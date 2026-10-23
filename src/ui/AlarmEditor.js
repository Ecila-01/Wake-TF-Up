import React, { useState } from 'react';
import { KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { clockParts, DAY_NAMES, nextOccurrence, repeatLabel, validTime } from '../alarms/model';
import Icon from '../components/Icon';
import { Button, IconButton, Notice } from './controls';
import QrSetup from './QrSetup';
import { TYPE } from './theme';
import SoundPicker from './SoundPicker';
import { BUILTIN_SOUNDS, DEFAULT_SOUND } from '../alarms/sounds';

export default function AlarmEditor({ alarm, colors, onClose, onSave, onDelete, existing, token, prepared, onPrepared, native }) {
  const [hour, setHour] = useState(String(alarm.hour % 12 || 12).padStart(2, '0'));
  const [minute, setMinute] = useState(String(alarm.minute).padStart(2, '0'));
  const [pm, setPm] = useState(alarm.hour >= 12);
  const [label, setLabel] = useState(alarm.label);
  const [days, setDays] = useState(alarm.days);
  const [challenge, setChallenge] = useState(alarm.challenge);
  const [sound, setSound] = useState({ id: alarm.soundId || DEFAULT_SOUND, name: alarm.soundName || BUILTIN_SOUNDS.find(item => item.id === (alarm.soundId || DEFAULT_SOUND))?.name || 'Imported audio' });
  const [soundOpen, setSoundOpen] = useState(false);
  const [setup, setSetup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const valid = validTime(hour, minute);
  const draft = { ...alarm, hour: Number(hour) % 12 + (pm ? 12 : 0), minute: Number(minute), label: label.trim(), days, challenge, soundId: sound.id, soundName: sound.name };
  const dirty = draft.hour !== alarm.hour || draft.minute !== alarm.minute || draft.label !== alarm.label || challenge !== alarm.challenge || sound.id !== (alarm.soundId || DEFAULT_SOUND) || [...days].sort().join() !== [...alarm.days].sort().join();
  const needsQr = challenge === 'qr' && alarm.enabled && !prepared;
  const close = () => {
    if (busy) return;
    if (soundOpen) { setSoundOpen(false); return; }
    if (setup) { setSetup(false); return; }
    if (!dirty) { onClose(); return; }
    setConfirmation('discard');
  };
  const save = async () => {
    if (!valid || busy) return;
    if (needsQr) { setSetup(true); return; }
    setBusy(true); setError('');
    try { await onSave(draft); } catch (failure) { setError(failure.message || 'Could not save the alarm. Your changes are still here.'); }
    finally { setBusy(false); }
  };
  const remove = () => setConfirmation('delete');
  const confirmAction = async () => {
    if (confirmation === 'discard') { setConfirmation(null); onClose(); return; }
    setConfirmation(null); setBusy(true); setError('');
    try { await onDelete(alarm); } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };
  const occurrence = valid ? new Date(nextOccurrence(draft)) : null;
  return <Modal visible animationType="none" onRequestClose={close}>
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.shell}>
          <View style={styles.header}><IconButton name={setup || soundOpen ? 'back' : 'close'} label={setup || soundOpen ? 'Back to alarm draft' : 'Close alarm editor'} colors={colors} disabled={busy} onPress={close} />
            <Text accessibilityRole="header" style={[TYPE.section, { color: colors.text, flex: 1 }]}>{soundOpen ? 'Alarm sound' : setup ? 'Prepare your QR' : existing ? 'Edit alarm' : 'New alarm'}</Text>
          </View>
          <ScrollView key={soundOpen ? 'sound' : setup ? 'qr' : 'alarm'} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            {soundOpen ? <><SoundPicker value={sound.id} onChange={setSound} colors={colors} /><Button colors={colors} onPress={() => setSoundOpen(false)}>Done</Button></> : setup ? <QrSetup token={token} prepared={prepared} colors={colors} native={native} onPrepared={async () => { await onPrepared(); setSetup(false); }} /> : <>
              <Text style={[TYPE.label, { color: colors.muted }]}>Time</Text>
              <View style={[styles.timeFields, { backgroundColor: colors.container }]}>
                <View><TextInput accessibilityLabel="Hour, 1 to 12" selectTextOnFocus value={hour} onChangeText={setHour} keyboardType="number-pad" maxLength={2}
                  selectionColor={colors.primary} style={[styles.timeInput, { color: colors.text }]} /><Text style={[TYPE.small, { color: colors.muted, textAlign: 'center' }]}>Hour</Text></View>
                <Text style={[styles.colon, { color: colors.muted }]}>:</Text>
                <View><TextInput accessibilityLabel="Minute, 0 to 59" selectTextOnFocus value={minute} onChangeText={setMinute} keyboardType="number-pad" maxLength={2}
                  selectionColor={colors.primary} style={[styles.timeInput, { color: colors.text }]} /><Text style={[TYPE.small, { color: colors.muted, textAlign: 'center' }]}>Minute</Text></View>
                <View style={styles.periods}>{['AM', 'PM'].map((period, index) => <Pressable key={period} accessibilityRole="radio" aria-checked={pm === Boolean(index)} accessibilityState={{ checked: pm === Boolean(index) }} onPress={() => setPm(Boolean(index))}
                  style={[styles.period, { backgroundColor: pm === Boolean(index) ? colors.primary : colors.surface }]}><Text style={[TYPE.label, { color: pm === Boolean(index) ? colors.onPrimary : colors.muted }]}>{period}</Text></Pressable>)}</View>
              </View>
              {!valid && <Notice colors={colors} error>Enter an hour from 1–12 and a minute from 00–59.</Notice>}
              <Text style={[TYPE.label, styles.fieldHeading, { color: colors.text }]}>Alarm name</Text>
              <TextInput accessibilityLabel="Alarm name" value={label} onChangeText={setLabel} maxLength={40} placeholder="Morning alarm" placeholderTextColor={colors.muted}
                selectionColor={colors.primary} style={[styles.name, TYPE.body, { color: colors.text, borderColor: colors.outline, backgroundColor: colors.surface }]} />
              <View style={[styles.sectionRow, styles.fieldHeading]}><Text style={[TYPE.label, { color: colors.text }]}>Repeat</Text>
                <Pressable accessibilityRole="button" onPress={() => setDays(days.length ? [] : [0, 1, 2, 3, 4, 5, 6])} style={styles.textTarget}><Text style={[TYPE.small, { color: colors.primary }]}>{days.length ? 'Clear days' : 'Every day'}</Text></Pressable></View>
              <View style={styles.days}>{DAY_NAMES.map((day, index) => <Pressable key={day} accessibilityRole="checkbox" accessibilityLabel={day} aria-checked={days.includes(index)} accessibilityState={{ checked: days.includes(index) }}
                onPress={() => setDays(days.includes(index) ? days.filter(d => d !== index) : [...days, index].sort())}
                style={[styles.day, { backgroundColor: days.includes(index) ? colors.container : colors.surface, borderColor: days.includes(index) ? colors.primary : colors.outline }]}>
                <Text style={[TYPE.small, { fontWeight: '600', color: days.includes(index) ? colors.primary : colors.muted }]}>{day}</Text>
              </Pressable>)}</View>
              <Text style={[TYPE.small, { color: colors.muted, marginTop: 10 }]}>{repeatLabel(days)}{!days.length ? ' · Next occurrence only' : ''}</Text>
              <Text style={[TYPE.label, styles.fieldHeading, { color: colors.text }]}>Sound</Text>
              <Button colors={colors} variant="tonal" accessibilityLabel={`Alarm sound: ${sound.name}. Change sound`} onPress={() => setSoundOpen(true)}>{sound.name}</Button>
              <Text style={[TYPE.label, styles.fieldHeading, { color: colors.text }]}>Dismissal</Text>
              <View style={[styles.choices, { borderColor: colors.outline, backgroundColor: colors.surface }]}>
                {[['qr', 'qr', 'QR challenge', 'Scan your wake-up QR. No snooze.'], ['normal', 'alarm', 'Standard', 'Dismiss with a tap. Snooze for 5 minutes.']].map(([value, icon, title, description], index) =>
                  <Pressable key={value} accessibilityRole="radio" aria-checked={challenge === value} accessibilityState={{ checked: challenge === value }} onPress={() => setChallenge(value)}
                    style={[styles.choice, { borderTopWidth: index ? 1 : 0, borderColor: colors.outline, backgroundColor: challenge === value ? colors.container : 'transparent' }]}>
                    <Icon name={icon} color={challenge === value ? colors.primary : colors.muted} />
                    <View style={{ flex: 1, gap: 4 }}><Text style={[TYPE.label, { color: colors.text }]}>{title}</Text><Text style={[TYPE.small, { color: colors.muted }]}>{description}</Text></View>
                    <View style={[styles.radio, { borderColor: challenge === value ? colors.primary : colors.muted }]}>{challenge === value && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}</View>
                  </Pressable>)}
              </View>
              {challenge === 'qr' && <Notice colors={colors} action={prepared ? 'View QR' : 'Set up'} onAction={() => setSetup(true)}>{prepared ? 'Your wake-up QR is prepared.' : 'Prepare your QR before enabling this alarm. Your draft will stay here.'}</Notice>}
              {error ? <Notice colors={colors} error>{error}</Notice> : null}
              {error && native && <Button colors={colors} variant="text" onPress={() => Linking.openSettings()}>Open app settings</Button>}
              {occurrence && <Text style={[TYPE.small, { color: colors.muted, marginTop: 24 }]}>{alarm.enabled ? `${native ? 'Next alarm' : 'Preview time'}: ${occurrence.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} at ${clockParts(draft.hour, draft.minute).time} ${pm ? 'PM' : 'AM'}.` : 'This alarm is off. Saving will keep it off.'}</Text>}
              <View style={{ marginTop: 16 }}><Button colors={colors} busy={busy} disabled={!valid} onPress={save}>{needsQr ? 'Prepare QR to continue' : existing ? 'Save changes' : 'Set alarm'}</Button></View>
              {existing && <Button colors={colors} disabled={busy} variant="danger" onPress={remove}>Delete alarm</Button>}
            </>}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      <Modal transparent visible={Boolean(confirmation)} animationType="none" onRequestClose={() => setConfirmation(null)}>
        <View style={styles.dialogOverlay}><View accessibilityRole="alert" style={[styles.dialog, { backgroundColor: colors.surface }]}>
          <Text accessibilityRole="header" style={[TYPE.section, { color: colors.text }]}>{confirmation === 'discard' ? 'Discard changes?' : 'Delete alarm?'}</Text>
          <Text style={[TYPE.body, { color: colors.muted }]}>{confirmation === 'discard' ? 'Your alarm has unsaved changes.' : 'This removes the alarm and its schedule.'}</Text>
          <Button colors={colors} variant="tonal" onPress={() => setConfirmation(null)}>{confirmation === 'discard' ? 'Keep editing' : 'Keep alarm'}</Button>
          <Button colors={colors} variant="danger" onPress={confirmAction}>{confirmation === 'discard' ? 'Discard changes' : 'Delete alarm'}</Button>
        </View></View>
      </Modal>
    </SafeAreaView>
  </Modal>;
}
const styles = StyleSheet.create({
  root: { flex: 1 }, shell: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' }, header: { minHeight: 72, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  content: { padding: 24, paddingTop: 12, paddingBottom: 40, gap: 12 }, timeFields: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, borderRadius: 16, paddingVertical: 20, paddingHorizontal: 8 },
  timeInput: { width: 82, minHeight: 76, fontSize: 54, fontWeight: '400', fontVariant: ['tabular-nums'], textAlign: 'center', padding: 0, borderRadius: 8 }, colon: { fontSize: 40, alignSelf: 'flex-start', marginTop: 10 },
  periods: { marginLeft: 10, gap: 8 }, period: { minWidth: 56, minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, name: { minHeight: 56, borderWidth: 1, borderRadius: 12, padding: 16 },
  fieldHeading: { marginTop: 16 }, sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, textTarget: { minHeight: 48, paddingHorizontal: 12, justifyContent: 'center' },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, day: { minWidth: 48, minHeight: 48, borderWidth: 1, borderRadius: 24, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  choices: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' }, choice: { minHeight: 88, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  radio: { width: 22, height: 22, borderWidth: 2, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, radioDot: { width: 10, height: 10, borderRadius: 5 },
  dialogOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#00000066' }, dialog: { width: '100%', maxWidth: 360, padding: 24, borderRadius: 28, gap: 16 },
});
