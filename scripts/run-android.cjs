const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');

function onlineDevices(output) {
  return output.split(/\r?\n/).map(line => line.trim().split(/\s+/))
    .filter(parts => parts.length >= 2 && parts[1] === 'device').map(parts => parts[0]);
}

function javaVersion(output) {
  const match = output.match(/version\s+"(\d+)(?:\.(\d+))?/i);
  return match ? Number(match[1] === '1' ? match[2] : match[1]) : null;
}

function main() {
  const root = path.resolve(__dirname, '..');
  const env = { ...process.env, NODE_ENV: process.env.NODE_ENV || 'development', EXPO_NO_TELEMETRY: process.env.EXPO_NO_TELEMETRY || '1', EXPO_OFFLINE: process.env.EXPO_OFFLINE || '1' };
  const windows = process.platform === 'win32';
  const sdk = env.ANDROID_HOME || env.ANDROID_SDK_ROOT || (windows
    ? path.join(env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'Android', 'Sdk')
    : process.platform === 'darwin' ? path.join(os.homedir(), 'Library', 'Android', 'sdk') : path.join(os.homedir(), 'Android', 'Sdk'));
  const adb = path.join(sdk, 'platform-tools', windows ? 'adb.exe' : 'adb');
  if (!fs.existsSync(adb)) {
    console.error(`Android SDK not found at ${sdk}. Set ANDROID_HOME to the SDK directory shown in Android Studio's SDK Manager.`);
    return 1;
  }
  env.ANDROID_HOME = sdk;
  env.ANDROID_SDK_ROOT = sdk;
  const portable = path.join(root, '.tools', 'java17');
  const candidates = [env.JAVA_HOME];
  if (fs.existsSync(portable)) {
    for (const entry of fs.readdirSync(portable, { withFileTypes: true })) if (entry.isDirectory()) candidates.push(path.join(portable, entry.name));
  }
  if (windows) candidates.push('C:\\Program Files\\Android\\Android Studio\\jbr');
  const javaFile = windows ? 'java.exe' : 'java';
  let selectedJava;
  for (const directory of candidates.filter(Boolean)) {
    const result = spawnSync(path.join(directory, 'bin', javaFile), ['-version'], { encoding: 'utf8', windowsHide: true });
    const major = javaVersion(`${result.stdout || ''}\n${result.stderr || ''}`);
    if (!result.error && result.status === 0 && major >= 17 && major <= 24) { selectedJava = directory; break; }
  }
  if (windows && !selectedJava) {
    console.error('This project needs JDK 17–24 (JDK 17 recommended). Set JAVA_HOME to a compatible JDK. Android Studio Java 25 is too new for this Gradle version.');
    return 1;
  }
  if (selectedJava) env.JAVA_HOME = selectedJava;
  const originalPath = env.Path || env.PATH || '';
  // Windows environment keys are case-insensitive; Node forwards only one of
  // duplicate Path/PATH keys. Normalize it and keep Node discoverable by Gradle.
  for (const key of Object.keys(env)) if (key.toLowerCase() === 'path') delete env[key];
  env.PATH = [path.dirname(process.execPath), selectedJava && path.join(selectedJava, 'bin'), path.join(sdk, 'platform-tools'), path.join(sdk, 'emulator'), originalPath].filter(Boolean).join(path.delimiter);
  const args = process.argv.slice(2);
  if (!args.some(arg => arg === '--device' || arg.startsWith('--device='))) {
    const result = spawnSync(adb, ['devices'], { encoding: 'utf8', windowsHide: true, timeout: 15000 });
    if (result.error || result.status !== 0) { console.error('Could not read Android devices. Start the emulator and try again.'); return 1; }
    const online = onlineDevices(result.stdout);
    if (online.length !== 1) {
      console.error(online.length ? `More than one device is connected: ${online.join(', ')}. Run npm run android -- --device <device-id>.` : 'No ready Android device found. Wait for the emulator home screen, then try again. Offline emulators are ignored.');
      return 1;
    }
    args.push('--device', online[0]);
    console.log(`Using Android device: ${online[0]}`);
  }
  console.log(`Android SDK: ${sdk}`);
  if (selectedJava) console.log(`Java: ${selectedJava}`);
  if (windows) {
    // Expo SDK 54 enumerates every emulator, including offline ones, before
    // applying --device. Build directly so a stale emulator cannot stall it.
    const index = args.indexOf('--device');
    const deviceId = index >= 0 ? args[index + 1] : args.find(arg => arg.startsWith('--device='))?.slice(9);
    if (!deviceId) { console.error('Pass a ready device ID with --device.'); return 1; }
    const result = spawnSync(adb, ['-s', deviceId, 'shell', 'getprop', 'ro.product.cpu.abi'], { encoding: 'utf8', windowsHide: true, timeout: 15000 });
    const abi = result.stdout?.trim();
    if (!['x86_64', 'x86', 'arm64-v8a', 'armeabi-v7a'].includes(abi)) { console.error('The selected device is not ready. Wait for its home screen and try again.'); return 1; }
    const portIndex = args.indexOf('--port');
    const port = portIndex >= 0 ? Number(args[portIndex + 1]) : 8081;
    if (!Number.isInteger(port) || port < 1024 || port > 65535) { console.error('Choose a valid development-server port.'); return 1; }
    const gradleCommand = `gradlew.bat :app:assembleDebug -x lint -x test --build-cache -PreactNativeArchitectures=${abi} -PreactNativeDevServerPort=${port}`;
    const build = spawn(env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', gradleCommand], { cwd: path.join(root, 'android'), env, stdio: 'inherit' });
    build.on('error', error => { console.error(error.message); process.exitCode = 1; });
    build.on('exit', async code => {
      if (code !== 0) { process.exitCode = code ?? 1; return; }
      const apk = path.join(root, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
      const appId = require(path.join(root, 'app.json')).expo.android.package;
      for (const command of [
        ['-s', deviceId, 'install', '-r', apk],
        ['-s', deviceId, 'reverse', `tcp:${port}`, `tcp:${port}`],
      ]) {
        const task = spawnSync(adb, command, { stdio: 'inherit', windowsHide: true, timeout: 120000 });
        if (task.error || task.status !== 0) { process.exitCode = 1; return; }
      }
      if (!args.includes('--no-bundler')) {
        let running = false;
        try { running = (await fetch(`http://127.0.0.1:${port}/status`, { signal: AbortSignal.timeout(2000) })).ok; } catch {}
        if (!running) {
          const cli = path.join(path.dirname(require.resolve('expo/package.json')), 'bin', 'cli');
          const metro = spawn(process.execPath, [cli, 'start', '--localhost', '--port', String(port)], { cwd: root, env, stdio: 'inherit' });
          metro.on('error', error => { console.error(error.message); process.exitCode = 1; });
          for (let attempt = 0; attempt < 40; attempt++) {
            await new Promise(resolve => setTimeout(resolve, 500));
            try { if ((await fetch(`http://127.0.0.1:${port}/status`, { signal: AbortSignal.timeout(1000) })).ok) break; } catch {}
          }
        }
      }
      const launch = spawnSync(adb, ['-s', deviceId, 'shell', 'am', 'start', '-n', `${appId}/.MainActivity`], { stdio: 'inherit', windowsHide: true, timeout: 15000 });
      process.exitCode = launch.status ?? 1;
      if (launch.status === 0) console.log('Wake TF Up installed and opened on the emulator.');
    });
    return 0;
  }
  const cli = path.join(path.dirname(require.resolve('expo/package.json')), 'bin', 'cli');
  const child = spawn(process.execPath, [cli, 'run:android', ...args], { cwd: root, env, stdio: 'inherit' });
  child.on('error', error => { console.error(error.message); process.exitCode = 1; });
  child.on('exit', code => { process.exitCode = code ?? 1; });
  return 0;
}

module.exports = { onlineDevices, javaVersion };
if (require.main === module) process.exitCode = main();
