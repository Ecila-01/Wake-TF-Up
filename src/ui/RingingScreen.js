import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { timestampClock } from '../alarms/model';
import Icon from '../components/Icon';
import QrScannerModal from '../components/QrScannerModal';
import { Button, Notice } from './controls';
import { TYPE } from './theme';

export default function RingingScreen({ alarm, colors, now, preview, onDismiss, onSnooze, onClosePreview, onBack }) {
  const [scanner, setScanner] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const clock = timestampClock(now);
  const action = async fn => {
    if (busy) return;
    setBusy(true); setError('');
    try { await fn(); } catch (failure) { setError(failure.message || 'Could not dismiss the alarm. Try again.'); }
    finally { setBusy(false); }
  };
  return <Modal visible animationType="none" onRequestClose={() => { if (!busy) { if (preview) onClosePreview(); else onBack(); } }}>
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {preview && <Notice colors={colors}>Ringing screen preview · No sound or scheduled alarm.</Notice>}
        <View style={[styles.symbol, { backgroundColor: colors.container }]}><Icon name={alarm.challenge === 'qr' ? 'qr' : 'alarm'} size={40} color={colors.primary} /></View>
        <Text accessibilityRole="header" style={[TYPE.title, { color: colors.text, textAlign: 'center' }]}>Wake TF Up</Text>
        <View style={styles.timeRow}><Text style={[styles.time, { color: colors.text }]}>{clock.time}</Text><Text style={[TYPE.section, { color: colors.muted }]}>{clock.period}</Text></View>
        <Text style={[TYPE.section, { color: colors.text, textAlign: 'center' }]}>{alarm.label || 'Your alarm is ringing'}</Text>
        <Text style={[TYPE.body, { color: colors.muted, textAlign: 'center' }]}>{alarm.challenge === 'qr' ? 'Go to your wake-up QR and scan it to stop the alarm.' : 'Dismiss your alarm, or take five more minutes.'}</Text>
        {error ? <Notice colors={colors} error>{error}</Notice> : null}
        <View style={styles.actions}>
          {alarm.challenge === 'qr' ? <>
            <Button colors={colors} icon="qr" busy={busy} onPress={() => preview ? action(onDismiss) : setScanner(true)}>{preview ? 'Simulate matching QR scan' : 'Scan QR to dismiss'}</Button>
            <Text style={[TYPE.small, { color: colors.muted, textAlign: 'center' }]}>QR challenge · No snooze</Text>
          </> : <><Button colors={colors} busy={busy} onPress={() => action(onDismiss)}>Dismiss alarm</Button><Button colors={colors} disabled={busy} variant="tonal" onPress={() => action(onSnooze)}>Snooze 5 minutes</Button></>}
          {preview && <Button colors={colors} variant="text" disabled={busy} onPress={onClosePreview}>Close preview</Button>}
        </View>
      </ScrollView>
      <QrScannerModal colors={colors} visible={scanner} onClose={() => setScanner(false)} onScanned={async data => { await onDismiss(data); setScanner(false); }} />
    </SafeAreaView>
  </Modal>;
}
const styles = StyleSheet.create({
  root: { flex: 1 }, content: { flexGrow: 1, padding: 28, width: '100%', maxWidth: 480, alignSelf: 'center', justifyContent: 'center', gap: 20 },
  symbol: { width: 88, height: 88, borderRadius: 44, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  timeRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'baseline', flexWrap: 'wrap', gap: 10 }, time: { fontSize: 76, lineHeight: 90, letterSpacing: -1.5, fontWeight: '400', fontVariant: ['tabular-nums'] },
  actions: { gap: 12, marginTop: 24, marginBottom: 20 },
});
