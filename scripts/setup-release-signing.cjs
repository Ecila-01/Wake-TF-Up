// Explicit, one-time setup. This script creates a key; it never builds an APK.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
function main() {
  const root = path.resolve(__dirname, '..');
  const directory = path.join(root, '.signing');
  const store = path.join(directory, 'wake-tf-up-release.jks');
  const properties = path.join(directory, 'release.properties');
  if (fs.existsSync(store) || fs.existsSync(properties)) {
    if (fs.existsSync(store) && fs.existsSync(properties)) {
      console.log('Signing files already exist. Reusing them; no key was replaced.');
      return;
    }
    throw new Error('Only one signing file exists. Restore the matching key and release.properties from your backup. No files were changed.');
  }
  const candidates = [process.env.JAVA_HOME];
  const portable = path.join(root, '.tools/java17');
  if (fs.existsSync(portable)) for (const entry of fs.readdirSync(portable, { withFileTypes: true })) {
    if (entry.isDirectory()) candidates.push(path.join(portable, entry.name));
  }
  if (process.platform === 'win32') candidates.push('C:\\Program Files\\Android\\Android Studio\\jbr');
  const executable = process.platform === 'win32' ? 'keytool.exe' : 'keytool';
  const keytool = candidates.filter(Boolean).map(home => path.join(home, 'bin', executable)).find(file => fs.existsSync(file)) || executable;
  const probe = spawnSync(keytool, ['-help'], { windowsHide: true, encoding: 'utf8' });
  if (probe.error || probe.status !== 0) throw new Error('Java keytool was not found. Set JAVA_HOME to your JDK and try again.');
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  const password = crypto.randomBytes(32).toString('base64url');
  // Save the recovery information first: a keystore must never be created with
  // a password that is lost if the following filesystem write fails.
  fs.writeFileSync(properties, `storeFile=wake-tf-up-release.jks\nstorePassword=${password}\nkeyAlias=wake-tf-up\nkeyPassword=${password}\n`, { flag: 'wx', mode: 0o600 });
  const result = spawnSync(keytool, ['-genkeypair', '-v', '-storetype', 'JKS', '-keystore', store,
    '-alias', 'wake-tf-up', '-keyalg', 'RSA', '-keysize', '3072', '-validity', '10000',
    '-dname', 'CN=Wake TF Up', '-storepass:env', 'WAKE_TF_UP_SIGNING_PASSWORD',
    '-keypass:env', 'WAKE_TF_UP_SIGNING_PASSWORD', '-noprompt'], {
      env: { ...process.env, WAKE_TF_UP_SIGNING_PASSWORD: password }, windowsHide: true, encoding: 'utf8',
    });
  if (result.error || result.status !== 0) {
    // A failed keytool may have left a partial key: never replace it automatically.
    throw new Error('Key generation failed. Inspect .signing before retrying. No existing key was overwritten.');
  }
  console.log('Release signing is ready. No APK was built.');
  console.log('Back up the entire .signing folder privately, including release.properties.');
  console.log('Never commit these files or attach them to a GitHub release. Use this same key for future updates.');
}
if (require.main === module) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
