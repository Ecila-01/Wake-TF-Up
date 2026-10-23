// Render the user-selected Lucide alarm-clock asset; do not redraw the icon.
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require(process.argv[2] || 'sharp');
const root = path.resolve(__dirname, '..');
async function main() {
  const licenseDirectory = path.join(root, 'android/app/src/main/assets/licenses');
  await fs.mkdir(licenseDirectory, { recursive: true });
  await fs.copyFile(path.join(root, 'licenses/LUCIDE.txt'), path.join(licenseDirectory, 'LUCIDE.txt'));
  const original = await fs.readFile(path.join(root, 'assets/vendor/lucide-alarm-clock.svg'), 'utf8');
  const shapes = original.slice(original.indexOf('>') + 1, original.lastIndexOf('</svg>'));
  const foreground = `<g transform="translate(6 6)" fill="none" stroke="#425BDD" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${shapes}</g>`;
  const render = background => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 36 36">${background ? '<rect width="36" height="36" fill="#F9F9FC"/>' : ''}${foreground}</svg>`);
  const icon = render(true);
  const adaptive = render(false);
  await fs.writeFile(path.join(root, 'assets/mark.svg'), icon);
  await sharp(icon).png().toFile(path.join(root, 'assets/icon.png'));
  await sharp(adaptive).png().toFile(path.join(root, 'assets/adaptive-icon.png'));
  for (const [density, size] of Object.entries({ mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 })) {
    const folder = path.join(root, 'android/app/src/main/res', `mipmap-${density}`);
    for (const name of ['ic_launcher', 'ic_launcher_round', 'ic_launcher_foreground']) {
      await sharp(name.endsWith('foreground') ? adaptive : icon).resize(name.endsWith('foreground') ? size * 2.25 : size).webp().toFile(path.join(folder, `${name}.webp`));
    }
    await sharp(adaptive).resize(size * 3).png().toFile(path.join(root, 'android/app/src/main/res', `drawable-${density}`, 'splashscreen_logo.png'));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
