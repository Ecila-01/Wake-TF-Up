import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, PanResponder, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from '../components/Icon';
import { TYPE } from './theme';

const REVEAL = 80;

export default function SwipeAlarm({ children, open, onOpenChange, onDelete, label, colors, disabled }) {
  const offset = useRef(new Animated.Value(0)).current;
  const start = useRef(0);
  const pointer = useRef(null);
  const current = useRef({ open, onOpenChange, disabled });
  current.current = { open, onOpenChange, disabled };
  useEffect(() => { offset.setValue(open ? -REVEAL : 0); }, [open, offset]);
  const gesture = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, { dx, dy }) => !current.current.disabled && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.5 && (dx < 0 || current.current.open),
    onPanResponderGrant: () => { start.current = current.current.open ? -REVEAL : 0; },
    onPanResponderMove: (_, { dx }) => offset.setValue(Math.max(-REVEAL, Math.min(0, start.current + dx))),
    onPanResponderRelease: (_, { dx, vx }) => {
      const reveal = vx < -0.5 || (vx < 0.5 && start.current + dx < -REVEAL / 2);
      offset.setValue(reveal ? -REVEAL : 0);
      current.current.onOpenChange(reveal);
    },
    onPanResponderTerminate: () => offset.setValue(current.current.open ? -REVEAL : 0),
  }), [offset]);
  const webGesture = Platform.OS === 'web' ? {
    onPointerDown: event => {
      if (disabled || event.button !== 0) return;
      pointer.current = { x: event.clientX, y: event.clientY, moved: false, start: open ? -REVEAL : 0 };
    },
    onPointerMove: event => {
      const drag = pointer.current;
      if (!drag) return;
      const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
      if (!drag.moved && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.5 && (dx < 0 || open)) {
        drag.moved = true; event.currentTarget.setPointerCapture(event.pointerId);
      }
      if (drag.moved) { event.preventDefault(); offset.setValue(Math.max(-REVEAL, Math.min(0, drag.start + dx))); }
    },
    onPointerUp: event => {
      const drag = pointer.current; pointer.current = null;
      if (!drag?.moved) return;
      const reveal = drag.start + event.clientX - drag.x < -REVEAL / 2;
      offset.setValue(reveal ? -REVEAL : 0); onOpenChange(reveal);
    },
    onPointerCancel: () => { pointer.current = null; offset.setValue(open ? -REVEAL : 0); },
  } : gesture.panHandlers;
  return <View style={[styles.root, { backgroundColor: colors.errorBg }]}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${label}`} disabled={disabled || !open}
      aria-hidden={!open}
      accessibilityElementsHidden={!open} importantForAccessibility={open ? 'auto' : 'no-hide-descendants'}
      onPress={onDelete} style={({ pressed }) => [styles.remove, { opacity: pressed ? 0.65 : 1 }]}>
      <Icon name="trash" color={colors.error} size={24} />
      <Text style={[TYPE.small, { color: colors.error }]}>Delete</Text>
    </Pressable>
    <Animated.View {...webGesture} style={[{ transform: [{ translateX: offset }] }, Platform.OS === 'web' && { touchAction: 'pan-y', userSelect: 'none' }]}>
      {children}
    </Animated.View>
  </View>;
}

const styles = StyleSheet.create({
  root: { borderRadius: 16, overflow: 'hidden' },
  remove: { position: 'absolute', right: 0, top: 0, bottom: 0, width: REVEAL, alignItems: 'center', justifyContent: 'center', gap: 6 },
});
