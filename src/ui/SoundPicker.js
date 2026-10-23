import React, { useEffect, useRef, useState } from 'react';
import { AppState, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BUILTIN_SOUNDS, getImportedSounds, importSound, previewSound, stopSoundPreview } from '../alarms/sounds';
import { Button, Notice } from './controls';
import { TYPE } from './theme';

export default function SoundPicker({ value, onChange, colors }) {
  const [imports, setImports] = useState([]);
  const [playing, setPlaying] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const timer = useRef(null);
  const alive = useRef(true);
  const stop = () => { clearTimeout(timer.current); stopSoundPreview(); setPlaying(null); };
  useEffect(() => {
    alive.current = true;
    getImportedSounds().then(items => { if (alive.current) setImports(items); }).catch(failure => { if (alive.current) setError(failure.message); });
    const subscription = AppState.addEventListener('change', status => { if (status !== 'active') stop(); });
    return () => { alive.current = false; clearTimeout(timer.current); stopSoundPreview(); subscription.remove(); };
  }, []);
  const preview = async id => {
    const wasPlaying = playing === id;
    stop(); setError('');
    if (wasPlaying) return;
    setBusy(true);
    try {
      await previewSound(id);
      if (!alive.current) { stopSoundPreview(); return; }
      setPlaying(id);
      timer.current = setTimeout(() => { if (alive.current) setPlaying(null); }, 5000);
    } catch (failure) { if (alive.current) setError(failure.message || 'Could not preview this sound.'); }
    finally { if (alive.current) setBusy(false); }
  };
  const pickFile = async () => {
    stop(); setError(''); setBusy(true);
    try {
      const sound = await importSound();
      if (sound && alive.current) { setImports(items => [...items, sound]); onChange(sound); }
    } catch (failure) { if (alive.current) setError(failure.message || 'Could not import this audio. Try another file.'); }
    finally { if (alive.current) setBusy(false); }
  };
  const rows = items => items.map(sound => <View key={sound.id} style={[styles.row, { borderColor: colors.outline, backgroundColor: value === sound.id ? colors.container : colors.surface }]}>
    <Pressable accessibilityRole="radio" aria-checked={value === sound.id} accessibilityState={{ checked: value === sound.id, disabled: busy }} disabled={busy}
      onPress={() => { stop(); onChange(sound); }} style={styles.select}>
      <View style={[styles.radio, { borderColor: value === sound.id ? colors.primary : colors.muted }]}>{value === sound.id && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}</View>
      <Text style={[TYPE.label, { color: colors.text, flex: 1 }]}>{sound.name}</Text>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={`${playing === sound.id ? 'Stop' : 'Preview'} ${sound.name}`} disabled={busy}
      onPress={() => preview(sound.id)} style={styles.preview}>
      <Text style={[TYPE.small, { color: colors.primary }]}>{playing === sound.id ? 'Stop' : 'Preview'}</Text>
    </Pressable>
  </View>);
  return <>
    <Text style={[TYPE.small, { color: colors.muted }]}>Choose a sound for this alarm. Previews play for 5 seconds at your {Platform.OS === 'web' ? 'browser' : 'alarm'} volume.</Text>
    {error ? <Notice colors={colors} error>{error}</Notice> : null}
    <Text style={[TYPE.label, { color: colors.text, marginTop: 12 }]}>Built-in sounds</Text>
    <View style={[styles.list, { borderColor: colors.outline }]}>{rows(BUILTIN_SOUNDS)}</View>
    <Text style={[TYPE.label, { color: colors.text, marginTop: 20 }]}>Your audio</Text>
    <Text style={[TYPE.small, { color: colors.muted }]}>Import a file from your device, up to 25 MB. A private copy stays in the app and works offline.</Text>
    {imports.length > 0 && <View style={[styles.list, { borderColor: colors.outline }]}>{rows(imports)}</View>}
    <Button colors={colors} variant="tonal" busy={busy} onPress={pickFile}>Import audio</Button>
  </>;
}
const styles = StyleSheet.create({
  list: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  select: { flex: 1, minHeight: 64, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center' },
  preview: { minHeight: 48, minWidth: 72, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center' },
  radio: { width: 22, height: 22, borderWidth: 2, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
