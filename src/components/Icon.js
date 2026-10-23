import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

const paths = {
  // Lucide alarm-clock outline; upstream notice: licenses/LUCIDE.txt.
  alarm: 'M12 9v4l2 2M5 3 2 6M22 6l-3-3M6.38 18.7 4 21M17.64 18.67 20 21',
  plus: 'M12 5v14M5 12h14',
  close: 'm6 6 12 12M6 18 18 6',
  back: 'm14 5-7 7 7 7',
  arrow: 'M5 12h14m-5-5 5 5-5 5',
  settings: 'M4 7h16M4 17h16',
  qr: 'M3 3h6v6H3zm12 0h6v6h-6zM3 15h6v6H3zm12 0h2v2h-2zm4 0h2v6h-6v-2',
  check: 'm5 12 4 4L19 6',
  chevron: 'm9 5 7 7-7 7',
  download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
  help: 'M9 8a3 3 0 0 1 6 0c0 2-3 2-3 5M12 17h.01',
  sun: 'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5',
};
export default function Icon({ name, size = 24, color = '#F3EFE5' }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <Path d={paths[name] || paths.alarm} />
    {name === 'alarm' && <Circle cx="12" cy="13" r="8" />}
    {name === 'sun' && <Circle cx="12" cy="12" r="4" />}
    {name === 'settings' && <><Circle cx="9" cy="7" r="3" fill={color} /><Circle cx="15" cy="17" r="3" fill={color} /></>}
  </Svg>;
}
