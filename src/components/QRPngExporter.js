import React, { useRef, useState } from 'react';
import { View, Text } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import { Button, Notice } from '../ui/controls';
import { TYPE } from '../ui/theme';

export default function QrPngExporter({ token, colors }) {
  const shot = useRef(null);
  const saving = useRef(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const save = async () => {
    if (saving.current || !token || !shot.current) return;
    saving.current = true; setBusy(true); setStatus(null);
    try {
      const permission = await MediaLibrary.requestPermissionsAsync(true, ['photo']);
      if (!permission.granted) throw new Error('Photo access is needed to save your QR. Allow photo access in app settings, then try again.');
      await MediaLibrary.saveToLibraryAsync(await shot.current.capture());
      setStatus({ text: 'QR saved to Photos. Print it or display it on another device.' });
    } catch (error) { setStatus({ text: error.message || 'Could not save your QR. Try again.', error: true }); }
    finally { saving.current = false; setBusy(false); }
  };
  return <View style={{ gap: 16, alignItems: 'stretch' }}>
    <View style={{ alignItems: 'center' }}><ViewShot ref={shot} options={{ format: 'png', quality: 1, result: 'tmpfile' }}>
      <View collapsable={false} style={{ backgroundColor: '#fff', padding: 24, alignItems: 'center', gap: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#22232B' }}>Wake TF Up</Text>
        {token ? <QRCode value={token} size={180} quietZone={8} /> : <Text>Loading QR…</Text>}
        <Text style={{ color: '#444', fontSize: 12 }}>Your wake-up QR</Text>
      </View>
    </ViewShot></View>
    <Button colors={colors} icon="download" busy={busy} disabled={!token} onPress={save}>{busy ? 'Saving QR…' : 'Save QR to Photos'}</Button>
    {status && <Notice colors={colors} error={status.error}>{status.text}</Notice>}
    <Text style={[TYPE.small, { color: colors.muted }]}>This QR belongs to this installation. Save a new one if you clear app data or reinstall.</Text>
  </View>;
}
