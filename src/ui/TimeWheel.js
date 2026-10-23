import React, { useEffect, useMemo, useRef } from 'react';
import { Keyboard, PanResponder, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { TYPE } from './theme';

export default function TimeWheel({ label, value, min, max, onChange, colors }) {
  const input = useRef(null), window = useRef(null), drag = useRef(null);
  const selected = Math.max(min, Math.min(max, Number(value) || min));
  const current = useRef(null);
  current.current = { selected, min, max, onChange };
  const wrap = number => {
    const size = max - min + 1;
    return ((number - min) % size + size) % size + min;
  };
  const change = number => onChange(String(wrap(number)).padStart(2, '0'));
  const begin = () => { input.current?.blur(); Keyboard.dismiss(); };
  const gesture = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, { dx, dy }) => Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx) * 1.5,
    onPanResponderGrant: () => { drag.current = current.current.selected; begin(); },
    onPanResponderMove: (_, { dy }) => {
      const { min: low, max: high, onChange: update } = current.current;
      const size = high - low + 1;
      const next = ((drag.current - Math.round(dy / 24) - low) % size + size) % size + low;
      update(String(next).padStart(2, '0'));
    },
    onPanResponderRelease: () => { drag.current = null; },
    onPanResponderTerminate: () => { drag.current = null; },
  }), []);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = window.current;
    let amount = 0;
    const wheel = event => {
      event.preventDefault(); amount += event.deltaY;
      if (Math.abs(amount) < 24) return;
      const { selected: number, min: low, max: high, onChange: update } = current.current;
      const size = high - low + 1;
      update(String(((number + Math.sign(amount) - low) % size + size) % size + low).padStart(2, '0'));
      amount = 0;
    };
    node?.addEventListener('wheel', wheel, { passive: false });
    return () => node?.removeEventListener('wheel', wheel);
  }, []);
  const webGesture = Platform.OS === 'web' ? {
    onPointerDown: event => { if (event.button === 0) drag.current = { y: event.clientY, start: selected, moved: false }; },
    onPointerMove: event => {
      const active = drag.current;
      if (!active || typeof active !== 'object') return;
      const dy = event.clientY - active.y;
      if (!active.moved && Math.abs(dy) > 8) { active.moved = true; event.currentTarget.setPointerCapture(event.pointerId); begin(); }
      if (active.moved) { event.preventDefault(); change(active.start - Math.round(dy / 24)); }
    },
    onPointerUp: () => { drag.current = null; }, onPointerCancel: () => { drag.current = null; },
  } : gesture.panHandlers;
  return <View style={styles.column}>
    <View ref={window} {...webGesture} style={[styles.window, Platform.OS === 'web' && { touchAction: 'none', userSelect: 'none' }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Decrease ${label.toLowerCase()}`} onPress={() => change(selected - 1)} style={styles.item}>
        <Text style={[styles.neighbor, { color: colors.muted }]}>{String(wrap(selected - 1)).padStart(2, '0')}</Text>
      </Pressable>
      <TextInput ref={input} accessibilityLabel={`${label}, ${min} to ${max}`} accessibilityHint="Type a number, or swipe up and down to adjust."
        selectTextOnFocus value={value} keyboardType="number-pad" maxLength={2} selectionColor={colors.primary} onChangeText={onChange}
        onBlur={() => { if (/^\d{1,2}$/.test(value) && Number(value) >= min && Number(value) <= max) onChange(value.padStart(2, '0')); }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={event => change(selected + (event.nativeEvent.actionName === 'increment' ? 1 : -1))}
        maxFontSizeMultiplier={1.3} style={[styles.input, { color: colors.text, backgroundColor: colors.surface }]} />
      <Pressable accessibilityRole="button" accessibilityLabel={`Increase ${label.toLowerCase()}`} onPress={() => change(selected + 1)} style={styles.item}>
        <Text style={[styles.neighbor, { color: colors.muted }]}>{String(wrap(selected + 1)).padStart(2, '0')}</Text>
      </Pressable>
    </View>
    <Text style={[TYPE.small, { color: colors.muted, textAlign: 'center', marginTop: 8 }]}>{label}</Text>
  </View>;
}

const styles = StyleSheet.create({
  column: { flex: 1, maxWidth: 100 }, window: { borderRadius: 12 },
  item: { minHeight: 56, alignItems: 'center', justifyContent: 'center' },
  neighbor: { fontSize: 30, lineHeight: 42, fontVariant: ['tabular-nums'], opacity: 0.6 },
  input: { width: '100%', minHeight: 56, padding: 0, textAlign: 'center', borderRadius: 12, fontSize: 34, lineHeight: 46, fontVariant: ['tabular-nums'] },
});
