import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from '../components/Icon';
import QrPngExporter from '../components/QRPngExporter';
import QrScannerModal from '../components/QrScannerModal';
import { Button, Notice } from './controls';
import { TYPE } from './theme';

export default function QrSetup({ token, prepared, onPrepared, colors, native }) {
  const [placed, setPlaced] = useState(prepared);
  const [scanner, setScanner] = useState(false);
  const [tested, setTested] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const confirm = async () => {
    setBusy(true); setError('');
    try { await onPrepared(); } catch (failure) { setError(failure.message || 'Could not save QR setup. Try again.'); }
    finally { setBusy(false); }
  };
  return <View style={{ gap: 24 }}>
    <View style={[styles.explainer, { backgroundColor: prepared ? colors.successBg : colors.container }]}>
      <Icon name={prepared ? 'check' : 'qr'} color={prepared ? colors.success : colors.primary} />
      <View style={{ flex: 1, gap: 5 }}><Text style={[TYPE.label, { color: colors.text }]}>{prepared ? 'Wake-up QR prepared' : 'A reason to get out of bed'}</Text>
        <Text style={[TYPE.body, { color: colors.muted }]}>{prepared ? 'You confirmed your code is accessible away from bed.' : 'QR alarms keep ringing until you scan this code. Save it somewhere you can reach in the morning.'}</Text></View>
    </View>
    <QrPngExporter token={token} colors={colors} />
    <View style={{ gap: 8 }}><Text style={[TYPE.section, { color: colors.text }]}>Put it somewhere worth getting up for</Text>
      <Text style={[TYPE.body, { color: colors.muted }]}>Print the code or open it on another device. Try the bathroom mirror, coffee machine, or your desk. A code saved only on this phone won’t work for scanning.</Text>
    </View>
    {native && <Button colors={colors} variant="tonal" icon="qr" disabled={!token} onPress={() => setScanner(true)}>Test a scan</Button>}
    {tested && <Notice colors={colors}>This QR matches. Keep that copy accessible for your next alarm.</Notice>}
    <Pressable accessibilityRole="checkbox" aria-checked={placed} accessibilityState={{ checked: placed }} onPress={() => setPlaced(!placed)}
      style={[styles.confirm, { borderColor: colors.outline }]}>
      <View style={[styles.checkbox, { borderColor: placed ? colors.primary : colors.muted, backgroundColor: placed ? colors.primary : 'transparent' }]}>
        {placed && <Icon name="check" size={17} color={colors.onPrimary} />}
      </View>
      <Text style={[TYPE.body, { color: colors.text, flex: 1 }]}>I’ve placed a copy of this QR away from my bed and can reach it when the alarm rings.</Text>
    </Pressable>
    {error ? <Notice colors={colors} error>{error}</Notice> : null}
    <Button colors={colors} busy={busy} disabled={!placed || !token} onPress={confirm}>{prepared ? 'Confirm QR setup' : 'Complete QR setup'}</Button>
    <Text style={[TYPE.small, { color: colors.muted }]}>{native ? 'QR alarms have no snooze. Choose Standard on an alarm if you prefer a dismiss button.' : 'This confirms preview setup only. Complete setup again on your Android phone.'}</Text>
    <QrScannerModal visible={scanner} colors={colors} onClose={() => setScanner(false)} onScanned={async data => {
      if (data !== token) throw new Error('That code doesn’t match. Scan the wake-up QR from this installation.');
      setScanner(false); setTested(true);
    }} />
  </View>;
}
const styles = StyleSheet.create({
  explainer: { flexDirection: 'row', padding: 18, borderRadius: 16, gap: 14 },
  confirm: { minHeight: 64, paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  checkbox: { width: 24, height: 24, borderRadius: 3, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
