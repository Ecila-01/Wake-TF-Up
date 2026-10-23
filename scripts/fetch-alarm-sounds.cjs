// Fetch the user-approved CC0 recordings, not newly generated sounds.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const selections = [
  ['digital_beep', 'Digital Beep', 'Felfa', 148297],
  ['electronic_alarm', 'Electronic Alarm', 'reecord2', 96063],
  ['classic_alarm', 'Classic Alarm', 'ZyryTSounds', 219244],
  ['synth_alarm', 'Synth Alarm', 'Dnab55', 128138],
  ['rapid_alarm', 'Rapid Alarm', 'Dishings', 752106],
  ['warning_beep', 'Warning Beep', 'SamsterBirdies', 467882],
  ['bedside_beep', 'Bedside Beep', 'SpliceSound', 369880],
  ['clock_radio', 'Clock Radio Buzzer', 'Lynx_5969', 418898],
  ['digital_clock', 'Digital Clock', 'Sadiquecat', 806272],
  ['lofi_clock', 'Lo-Fi Clock', 'Sadiquecat', 806270],
];
async function main() {
  const root = path.resolve(__dirname, '..');
  const assets = path.join(root, 'assets/sounds');
  const raw = path.join(root, 'android/app/src/main/res/raw');
  fs.mkdirSync(assets, { recursive: true });
  const catalog = [];
  for (const [id, name, author, sourceId] of selections) {
    const source = `https://freesound.org/people/${author}/sounds/${sourceId}/`;
    const page = await fetch(source);
    if (!page.ok) throw new Error(`Source unavailable: ${source}`);
    const html = await page.text();
    if (!/creativecommons.org\/publicdomain\/zero\/1.0/.test(html)) throw new Error(`CC0 not confirmed: ${source}`);
    const audioUrl = html.match(new RegExp(`https://cdn\\.freesound\\.org/previews/\\d+/${sourceId}_\\d+-hq\\.mp3`))?.[0];
    if (!audioUrl) throw new Error(`No public high-quality preview: ${source}`);
    const response = await fetch(audioUrl);
    if (!response.ok) throw new Error(`Audio unavailable: ${audioUrl}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 1000 || /html/.test(response.headers.get('content-type') || '')) throw new Error('Invalid audio response');
    fs.writeFileSync(path.join(assets, `${id}.mp3`), bytes);
    fs.writeFileSync(path.join(raw, `${id}.mp3`), bytes);
    catalog.push({ id, name, author, sourceId, source, license: 'CC0-1.0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/', audioUrl, sha256: crypto.createHash('sha256').update(bytes).digest('hex') });
    console.log(`${name}: ${bytes.length} bytes; CC0 verified`);
  }
  fs.writeFileSync(path.join(assets, 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
