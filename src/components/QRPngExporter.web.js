import React, { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Button, Notice } from '../ui/controls';
import { TYPE } from '../ui/theme';

export default function QrPngExporter({ token, colors }) {
  const element = useRef(null);
  const [status, setStatus] = useState(null);
  const save = () => {
    try {
      const svg = element.current?.querySelector('svg');
      if (!svg) throw new Error('Your QR is still loading. Try again.');
      const link = document.createElement('a');
      link.href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`;
      link.download = 'wake-tf-up-qr.svg'; link.click();
      setStatus({ text: 'QR download started. Your Android installation will have a different QR.' });
    } catch (error) { setStatus({ text: error.message, error: true }); }
  };
  return <View style={{ gap: 16 }}>
    <div ref={element} style={{ padding: 24, background: '#fff', alignSelf: 'center', lineHeight: 0 }}>
      {token && <QRCode value={token} size={180} quietZone={12} backgroundColor="#ffffff" />}
    </div>
    <Button colors={colors} icon="download" disabled={!token} onPress={save}>Download preview QR</Button>
    {status && <Notice colors={colors} error={status.error}>{status.text}</Notice>}
    <Text style={[TYPE.small, { color: colors.muted }]}>Preview QR only. Save the QR from your Android installation before using real alarms.</Text>
  </View>;
}
