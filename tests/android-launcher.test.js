import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { onlineDevices, javaVersion } = require('../scripts/run-android.cjs');

test('Android launcher ignores stale offline emulators and unauthorized phones', () => {
  assert.deepEqual(onlineDevices('List of devices attached\r\nemulator-5554\toffline\r\nemulator-5556\tdevice\r\nphone\tunauthorized\r\n'), ['emulator-5556']);
});
test('Android launcher retains multiple ready devices for explicit selection', () => {
  assert.deepEqual(onlineDevices('List of devices attached\nemulator-5556 device\nphone device\n'), ['emulator-5556', 'phone']);
});
test('Java detection distinguishes compatible JDKs from old or too-new versions', () => {
  assert.equal(javaVersion('openjdk version "17.0.20"'), 17);
  assert.equal(javaVersion('openjdk version "25.0.3"'), 25);
  assert.equal(javaVersion('java version "1.8.0_431"'), 8);
  assert.equal(javaVersion('not available'), null);
});
