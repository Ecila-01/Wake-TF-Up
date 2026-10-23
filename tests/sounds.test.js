import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { newAlarm } from '../src/alarms/model.js';

const catalog = JSON.parse(fs.readFileSync(new URL('../assets/sounds/catalog.json', import.meta.url)));
test('all ten approved recordings are bundled unchanged for web and Android, with license provenance', () => {
  assert.equal(catalog.length, 10);
  assert.equal(new Set(catalog.map(sound => sound.id)).size, 10);
  assert.deepEqual(catalog.map(sound => sound.sourceId).sort((a, b) => a - b), [96063, 128138, 148297, 219244, 369880, 418898, 467882, 752106, 806270, 806272]);
  for (const sound of catalog) {
    const web = fs.readFileSync(new URL(`../assets/sounds/${sound.id}.mp3`, import.meta.url));
    const android = fs.readFileSync(new URL(`../android/app/src/main/res/raw/${sound.id}.mp3`, import.meta.url));
    assert.equal(crypto.createHash('sha256').update(web).digest('hex'), sound.sha256);
    assert.deepEqual(android, web);
    assert.equal(sound.license, 'CC0-1.0');
    assert.ok(sound.source.startsWith('https://freesound.org/people/'));
  }
});
test('new alarms use the bundled Digital Beep rather than relying on the device ringtone', () => {
  assert.equal(newAlarm().soundId, catalog[0].id);
});
