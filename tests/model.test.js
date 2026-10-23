import test from 'node:test';
import assert from 'node:assert/strict';
import { clockParts, nextOccurrence, repeatLabel, countdown, newAlarm, timestampClock, validTime, validateAlarm } from '../src/alarms/model.js';

const alarm = (hour, minute, days = []) => ({ hour, minute, days });
test('one-shot alarm rolls to tomorrow if its minute already started', () => {
  const now = new Date(2026, 9, 23, 7, 30, 15);
  assert.equal(nextOccurrence(alarm(7, 30), now), new Date(2026, 9, 24, 7, 30).getTime());
});
test('repeat alarm crosses a weekend', () => {
  const now = new Date(2026, 9, 23, 8);
  assert.equal(nextOccurrence(alarm(7, 30, [1, 2, 3, 4, 5]), now), new Date(2026, 9, 26, 7, 30).getTime());
});
test('weekly alarm can schedule seven days ahead', () => {
  const now = new Date(2026, 9, 23, 8);
  assert.equal(nextOccurrence(alarm(7, 30, [5]), now), new Date(2026, 9, 30, 7, 30).getTime());
});
test('midnight and noon format without zero hour', () => {
  assert.deepEqual(clockParts(0, 5), { time: '12:05', period: 'AM' });
  assert.deepEqual(clockParts(12, 0), { time: '12:00', period: 'PM' });
});
test('repeat labels distinguish once, daily, and weekdays', () => {
  assert.equal(repeatLabel([]), 'Once');
  assert.equal(repeatLabel([0, 1, 2, 3, 4, 5, 6]), 'Every day');
  assert.equal(repeatLabel([5, 1, 2, 3, 4]), 'Weekdays');
  assert.equal(repeatLabel([6, 0]), 'Weekends');
});
test('new alarm is one minute ahead across the hour boundary', () => {
  const OriginalDate = Date;
  const fixed = new OriginalDate(2026, 9, 23, 23, 59).getTime();
  globalThis.Date = class extends OriginalDate { constructor(...args) { super(...(args.length ? args : [fixed])); } static now() { return fixed; } };
  try { const value = newAlarm(); assert.equal(value.hour, 0); assert.equal(value.minute, 0); }
  finally { globalThis.Date = OriginalDate; }
});
test('countdown rounds up without displaying zero minutes', () => {
  assert.equal(countdown(1000, 0), '1m');
  assert.equal(countdown(3660000, 0), '1h 1m');
});

test('snoozed next-time labels use the actual timestamp across noon and midnight', () => {
  assert.deepEqual(timestampClock(new Date(2026, 9, 23, 12, 3).getTime()), { time: '12:03', period: 'PM' });
  assert.deepEqual(timestampClock(new Date(2026, 9, 24, 0, 3).getTime()), { time: '12:03', period: 'AM' });
});
test('editor rejects malformed times before scheduling', () => {
  for (const [hour, minute] of [['0', '30'], ['13', '00'], ['7', '60'], ['7', '-1'], ['', '30'], ['1.5', '00']]) assert.equal(validTime(hour, minute), false);
  assert.equal(validTime('12', '00'), true);
  assert.equal(validTime('07', '59'), true);
});
test('preview rejects invalid data instead of saving an alarm Android would reject', () => {
  const valid = { ...alarm(7, 30, [1, 5]), challenge: 'qr' };
  assert.equal(validateAlarm(valid), valid);
  assert.throws(() => validateAlarm({ ...valid, hour: 24 }));
  assert.throws(() => validateAlarm({ ...valid, minute: 2.5 }));
  assert.throws(() => validateAlarm({ ...valid, days: [7] }));
  assert.throws(() => validateAlarm({ ...valid, challenge: 'unknown' }));
});
test('QR challenge leads new alarms, with standard mode still available', () => {
  assert.equal(newAlarm().challenge, 'qr');
  assert.equal(newAlarm('normal').challenge, 'normal');
});
