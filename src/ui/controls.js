import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from '../components/Icon';
import { TYPE } from './theme';

export function Button({ children, onPress, colors, variant = 'filled', disabled, busy, icon, accessibilityLabel }) {
  const filled = variant === 'filled';
  const foreground = filled ? colors.onPrimary : variant === 'danger' ? colors.error : colors.primary;
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} disabled={disabled || busy}
    accessibilityState={{ disabled: Boolean(disabled || busy), busy: Boolean(busy) }} onPress={onPress}
    style={({ pressed, hovered }) => [s.button, { backgroundColor: filled ? colors.primary : variant === 'tonal' ? colors.container : 'transparent', opacity: disabled ? 0.45 : pressed ? 0.7 : hovered ? 0.88 : 1 }]}>
    {busy ? <ActivityIndicator size="small" color={foreground} /> : icon ? <Icon name={icon} color={foreground} size={21} /> : null}
    <Text style={[TYPE.label, { color: foreground, textAlign: 'center', flexShrink: 1 }]}>{children}</Text>
  </Pressable>;
}
export function IconButton({ name, label, onPress, colors, disabled }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress}
    style={({ pressed, hovered }) => [s.iconButton, { backgroundColor: pressed || hovered ? colors.faint : 'transparent', opacity: disabled ? 0.45 : 1 }]}>
    <Icon name={name} color={colors.text} />
  </Pressable>;
}
export function Toggle({ value, onChange, label, colors, disabled }) {
  return <Pressable accessibilityRole="switch" accessibilityLabel={label} aria-checked={value} accessibilityState={{ checked: value, disabled: Boolean(disabled) }}
    disabled={disabled} onPress={() => onChange(!value)} style={s.toggleTarget}>
    <View style={[s.track, { backgroundColor: value ? colors.primary : colors.outline, alignItems: value ? 'flex-end' : 'flex-start' }]}>
      <View style={[s.thumb, { backgroundColor: value ? colors.onPrimary : colors.muted }]} />
    </View>
  </Pressable>;
}
export function Notice({ children, colors, error, action, onAction }) {
  return <View accessibilityRole={error ? 'alert' : undefined} style={[s.notice, { backgroundColor: error ? colors.errorBg : colors.faint }]}>
    <Text style={[TYPE.small, { color: error ? colors.error : colors.muted, flex: 1 }]}>{children}</Text>
    {action && <Button colors={colors} variant="text" onPress={onAction}>{action}</Button>}
  </View>;
}
export const s = StyleSheet.create({
  button: { minHeight: 52, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  iconButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  toggleTarget: { minWidth: 64, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  track: { width: 52, height: 32, borderRadius: 18, justifyContent: 'center', padding: 4 },
  thumb: { width: 24, height: 24, borderRadius: 12 },
  notice: { borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
});
