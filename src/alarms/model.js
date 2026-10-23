export const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function clockParts(hour, minute) {
  return { time: `${hour % 12 || 12}:${String(minute).padStart(2, '0')}`, period: hour >= 12 ? 'PM' : 'AM' };
}

export function repeatLabel(days) {
  if (!days.length) return 'Once';
  if (days.length === 7) return 'Every day';
  if ([1, 2, 3, 4, 5].every(d => days.includes(d)) && days.length === 5) return 'Weekdays';
  if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Weekends';
  return [...days].sort().map(d => DAY_NAMES[d]).join(', ');
}

export function nextOccurrence(alarm, now = new Date()) {
  for (let offset = 0; offset <= 7; offset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + offset);
    date.setHours(alarm.hour, alarm.minute, 0, 0);
    if (date > now && (!alarm.days.length || alarm.days.includes(date.getDay()))) return date.getTime();
  }
  return null;
}

export function countdown(timestamp, now = Date.now()) {
  const minutes = Math.max(1, Math.ceil((timestamp - now) / 60000));
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours}h${minutes % 60 ? ` ${minutes % 60}m` : ''}` : `${minutes}m`;
}

export function newAlarm(challenge = 'qr') {
  const date = new Date(Date.now() + 60000);
  return { id: Math.floor(Math.random() * 2147483646) + 1, hour: date.getHours(), minute: date.getMinutes(), label: '', days: [], challenge, enabled: true, soundId: 'digital_beep', soundName: 'Digital Beep' };
}

export function timestampClock(timestamp) {
  const date = new Date(timestamp);
  return clockParts(date.getHours(), date.getMinutes());
}

export function validTime(hour, minute) {
  return /^\d{1,2}$/.test(hour) && Number(hour) >= 1 && Number(hour) <= 12 && /^\d{1,2}$/.test(minute) && Number(minute) <= 59;
}

export function validateAlarm(alarm) {
  if (!Number.isInteger(alarm.hour) || alarm.hour < 0 || alarm.hour > 23 || !Number.isInteger(alarm.minute) || alarm.minute < 0 || alarm.minute > 59) throw new Error('Choose a valid alarm time.');
  if (!Array.isArray(alarm.days) || alarm.days.some(day => !Number.isInteger(day) || day < 0 || day > 6)) throw new Error('Choose valid repeat days.');
  if (!['qr', 'normal'].includes(alarm.challenge)) throw new Error('Choose a dismissal method.');
  return alarm;
}
