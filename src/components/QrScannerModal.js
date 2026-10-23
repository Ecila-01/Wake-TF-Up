import React, { useEffect, useRef, useState } from 'react';
import { Linking, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Button, IconButton, Notice } from '../ui/controls';
import { THEMES, TYPE } from '../ui/theme';

export default function QrScannerModal({ visible, onClose, onScanned, colors = THEMES.light }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [scanned, setScanned] = useState(false);
  const locked = useRef(false);
  const reset = () => { locked.current = false; setScanned(false); setMessage(''); };
  useEffect(() => { if (visible) reset(); }, [visible]);
  const scan = async ({ data }) => {
    if (locked.current) return;
    locked.current = true;
    setScanned(true); setBusy(true);
    try { await onScanned(data); }
    catch (error) { setMessage(error.message || 'Could not read this QR. Try again.'); }
    finally { setBusy(false); }
  };
  const ask = async () => {
    try { await requestPermission(); } catch { setMessage('Camera access could not be requested. Open app settings and allow Camera.'); }
  };
  const deniedPermanently = permission && !permission.granted && !permission.canAskAgain;
  return <Modal visible={visible} animationType="none" onRequestClose={() => { if (!busy) onClose(); }}>
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={styles.header}><Text style={[TYPE.section, { color: colors.text, flex: 1 }]}>Scan wake-up QR</Text><IconButton name="close" label="Close QR scanner" colors={colors} disabled={busy} onPress={onClose} /></View>
      {permission?.granted ? <>
        <Text style={[TYPE.body, styles.instructions, { color: colors.muted }]}>Point your camera at the QR you saved from this app.</Text>
        <CameraView style={styles.camera} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={scanned ? undefined : scan} />
        <View style={styles.footer}>
          {message ? <Notice colors={colors} error>{message}</Notice> : <Text accessibilityLiveRegion="polite" style={[TYPE.body, { color: colors.muted, textAlign: 'center' }]}>{busy ? 'Checking QR…' : 'Keep the whole code in view.'}</Text>}
          {scanned && !busy && <Button colors={colors} onPress={reset}>Scan again</Button>}
          <Button colors={colors} variant="text" disabled={busy} onPress={onClose}>Back</Button>
        </View>
      </> : <ScrollView contentContainerStyle={styles.permission}>
        <Text style={[TYPE.title, { color: colors.text }]}>Allow camera access</Text>
        <Text style={[TYPE.body, { color: colors.muted }]}>The camera reads your wake-up QR. Images are not saved or uploaded.</Text>
        {message ? <Notice colors={colors} error>{message}</Notice> : null}
        <Button colors={colors} onPress={deniedPermanently ? () => Linking.openSettings() : ask}>{deniedPermanently ? 'Open app settings' : 'Allow camera'}</Button>
        {deniedPermanently && <Text style={[TYPE.small, { color: colors.muted }]}>Choose Permissions, then Camera. Return here after allowing access.</Text>}
        <Button colors={colors} variant="text" onPress={onClose}>Back</Button>
      </ScrollView>}
    </SafeAreaView>
  </Modal>;
}
const styles = StyleSheet.create({
  root: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, minHeight: 64 },
  instructions: { paddingHorizontal: 24, paddingBottom: 20 }, camera: { flex: 1, minHeight: 160 },
  footer: { padding: 24, gap: 12 }, permission: { padding: 24, gap: 22, flexGrow: 1, justifyContent: 'center', maxWidth: 480, alignSelf: 'center', width: '100%' },
});
