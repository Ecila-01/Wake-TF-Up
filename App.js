import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, BackHandler, Linking, PermissionsAndroid, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ensureToken } from './src/storage/token';
import { getThemeMode, setThemeMode } from './src/storage/theme';
import { isQrPrepared, markQrPrepared } from './src/storage/qrSetup';
import * as api from './src/alarms/api';
import { clockParts, countdown, newAlarm, repeatLabel, timestampClock } from './src/alarms/model';
import Icon from './src/components/Icon';
import { Button, IconButton, Notice, Toggle } from './src/ui/controls';
import { THEMES, TYPE } from './src/ui/theme';
import AlarmEditor from './src/ui/AlarmEditor';
import QrSetup from './src/ui/QrSetup';
import RingingScreen from './src/ui/RingingScreen';

export default function App() {
  return <SafeAreaProvider><AlarmApp /></SafeAreaProvider>;
}

function AlarmApp() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState('light');
  const colors = THEMES[mode];
  const [state, setState] = useState({ alarms: [], active: [], exact: false, fullScreen: false, notifications: false });
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState(null);
  const [prepared, setPrepared] = useState(false);
  const [page, setPage] = useState('alarms');
  const [editor, setEditor] = useState(null);
  const [preview, setPreview] = useState(null);
  const [hiddenRinging, setHiddenRinging] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const initialized = useRef(false);
  const mounted = useRef(true);
  const operation = useRef(false);
  const refreshing = useRef(null);
  const serialized = useRef('');
  const scroll = useRef(null);

  const refresh = useCallback(() => {
    if (refreshing.current) return refreshing.current;
    refreshing.current = api.getState().then(next => {
      if (!mounted.current) return next;
      const json = JSON.stringify(next);
      if (serialized.current !== json) { serialized.current = json; setState(next); }
      return next;
    }).finally(() => { refreshing.current = null; });
    return refreshing.current;
  }, []);

  const initialize = useCallback(async () => {
    if (initialized.current) return;
    initialized.current = true; setError('');
    try {
      const saved = await getThemeMode();
      if (THEMES[saved] && mounted.current) setMode(saved);
      const value = await ensureToken();
      await api.setQrToken(value);
      const qrReady = await isQrPrepared(value);
      await refresh();
      if (mounted.current) { setToken(value); setPrepared(qrReady); setReady(true); }
    } catch (failure) {
      if (mounted.current) setError(failure.message || 'Could not load your alarms. Try again.');
    } finally { initialized.current = false; }
  }, [refresh]);

  useEffect(() => {
    mounted.current = true;
    initialize();
    const timer = setInterval(() => {
      if (AppState.currentState !== 'active') return;
      setNow(Date.now());
      if (!initialized.current) refresh().catch(failure => { if (mounted.current) setError(failure.message || 'Could not refresh alarms. Try again.'); });
    }, 1500);
    const subscription = AppState.addEventListener('change', status => {
      if (status === 'active') { setNow(Date.now()); setHiddenRinging(null); refresh().catch(failure => setError(failure.message)); }
    });
    return () => { mounted.current = false; clearInterval(timer); subscription.remove(); };
  }, [initialize, refresh]);

  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [page]);
  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (page !== 'alarms') { setPage('alarms'); return true; }
      return false;
    });
    return () => listener.remove();
  }, [page]);

  const mutate = async action => {
    if (operation.current) throw new Error('An alarm update is already in progress. Try again in a moment.');
    operation.current = true; setBusy(true);
    try { return await action(); }
    finally { operation.current = false; setBusy(false); }
  };
  const readAfterMutation = async () => {
    if (refreshing.current) await refreshing.current.catch(() => {});
    return refresh();
  };
  const permissions = async () => {
    if (!api.isNativeAlarm) return;
    const current = await api.getState();
    if (!current.exact) {
      api.requestExact();
      throw new Error('Allow Alarms & reminders in Settings, then return and save. Your draft is still here.');
    }
    if (!current.notifications && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) throw new Error('Allow notifications in app settings so you can open a ringing alarm. Your draft is still here.');
    } else if (!current.notifications) {
      throw new Error('Enable alarm notifications in app settings, then return and save. Your draft is still here.');
    }
  };
  const save = alarm => mutate(async () => {
    if (alarm.enabled && alarm.challenge === 'qr' && !prepared) throw new Error('Prepare your wake-up QR before enabling a QR alarm.');
    if (alarm.enabled) await permissions();
    await api.saveAlarm(alarm);
    const updated = await readAfterMutation();
    const saved = updated.alarms.find(item => item.id === alarm.id);
    setEditor(null); setError('');
    if (saved?.enabled && saved.nextAt) {
      const date = new Date(saved.nextAt); const clock = timestampClock(saved.nextAt);
      setMessage(`${api.isNativeAlarm ? 'Alarm set' : 'Preview saved'} for ${date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}, ${clock.time} ${clock.period}.`);
    } else setMessage('Alarm saved · Off');
  });
  const toggle = async (alarm, enabled) => {
    if (enabled && alarm.challenge === 'qr' && !prepared) { setEditor({ ...alarm, enabled }); return; }
    try { await save({ ...alarm, enabled }); } catch (failure) { setError(failure.message); }
  };
  const prepare = async () => {
    if (!token) throw new Error('Your QR is still loading. Try again.');
    await markQrPrepared(token); setPrepared(true);
    setMessage(api.isNativeAlarm ? 'Wake-up QR prepared.' : 'Preview QR setup complete. Repeat setup on Android.');
  };
  const remove = alarm => mutate(async () => {
    await api.deleteAlarm(alarm.id); await readAfterMutation(); setEditor(null); setMessage('Alarm deleted.');
  });
  const changeTheme = async dark => {
    const next = dark ? 'dark' : 'light';
    try { await setThemeMode(next); setMode(next); } catch { setError('Could not save appearance. Try again.'); }
  };
  const ringing = state.active[0];
  const active = (ringing?.id !== hiddenRinging ? ringing : null) || (!ringing ? preview : null);
  const isPreview = Boolean(preview && !state.active.length);
  const dismiss = data => mutate(async () => {
    if (isPreview) { setPreview(null); setMessage('Preview dismissed. No real alarm was stopped.'); return; }
    await api.dismissAlarm(active.id, typeof data === 'string' ? data : ''); await readAfterMutation(); setMessage('Alarm dismissed.');
  });
  const snooze = () => mutate(async () => {
    if (isPreview) { setPreview(null); setMessage('Snooze preview complete. No real alarm was scheduled.'); return; }
    await api.snoozeAlarm(active.id); await readAfterMutation(); setMessage('Snoozed for 5 minutes.');
  });
  const next = state.alarms.filter(item => item.enabled && item.nextAt > now).sort((a, b) => a.nextAt - b.nextAt)[0];
  const clock = next && timestampClock(next.nextAt);
  const sorted = [...state.alarms].sort((a, b) => a.hour * 60 + a.minute - b.hour * 60 - b.minute);
  const requiresPermissions = api.isNativeAlarm && ready && (!state.exact || !state.notifications || !state.fullScreen);
  const navigate = destination => { setPage(destination); setMessage(''); };

  return <SafeAreaView edges={['top', 'left', 'right']} style={[styles.root, { backgroundColor: colors.bg }]}>
    <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
    <View style={[styles.shell, { backgroundColor: colors.bg }]}>
      <View style={styles.appBar}><View style={styles.brand}><Icon name="alarm" color={colors.primary} size={27} /><Text style={[styles.brandName, { color: colors.text }]}>Wake TF Up</Text></View>
        <IconButton name={page === 'settings' ? 'back' : 'settings'} label={page === 'settings' ? 'Back to alarms' : 'Open settings'} colors={colors} onPress={() => navigate(page === 'settings' ? 'alarms' : 'settings')} />
      </View>
      {!api.isNativeAlarm && <View style={[styles.previewStrip, { backgroundColor: colors.faint }]}><Text style={[TYPE.small, { color: colors.muted }]}>Design preview · Alarms won’t ring here</Text></View>}
      <ScrollView ref={scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {ringing && hiddenRinging === ringing.id && <Notice colors={colors} action="Open alarm" onAction={() => setHiddenRinging(null)}>Your alarm is still ringing. Open it to dismiss or scan your QR.</Notice>}
        {error ? <Notice colors={colors} error action="Retry" onAction={async () => { setError(''); if (!ready) await initialize(); else await refresh().catch(failure => setError(failure.message)); }}>{error}</Notice> : null}
        {page === 'alarms' ? <>
          <View style={styles.pageTitle}><Text accessibilityRole="header" style={[TYPE.title, { color: colors.text }]}>Alarms</Text><Text style={[TYPE.body, { color: colors.muted }]}>{new Date(now).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Text></View>
          {!ready ? <View style={[styles.nextAlarm, { backgroundColor: colors.container }]}><ActivityIndicator color={colors.primary} /><Text style={[TYPE.body, { color: colors.muted }]}>Loading your alarms…</Text></View> : next ? <View style={[styles.nextAlarm, { backgroundColor: colors.container }]}>
            <Text style={[TYPE.body, { color: colors.muted }]}>Next alarm · {next.snoozed ? 'Snoozed' : next.challenge === 'qr' ? 'QR challenge' : 'Standard'}</Text>
            <View style={styles.clockLine}><Text style={[TYPE.time, { color: colors.text }]}>{clock.time}</Text><Text style={[TYPE.section, { color: colors.text }]}>{clock.period}</Text></View>
            <Text style={[TYPE.body, { color: colors.muted }]}>{new Date(next.nextAt).toLocaleDateString(undefined, { weekday: 'long' })} · in {countdown(next.nextAt, now)}</Text>
          </View> : <View style={[styles.nextAlarm, { backgroundColor: colors.container }]}><Icon name="alarm" color={colors.primary} size={30} /><Text style={[TYPE.section, { color: colors.text }]}>No upcoming alarms</Text><Text style={[TYPE.body, { color: colors.muted }]}>{sorted.length ? 'Turn on an alarm when you’re ready.' : 'Set your first alarm. Choose a QR challenge to get out of bed before dismissing it.'}</Text></View>}
          <Pressable accessibilityRole="button" accessibilityLabel={prepared ? 'View wake-up QR' : 'Prepare wake-up QR'} onPress={() => navigate('qr')}
            style={({ pressed }) => [styles.qrStatus, { backgroundColor: prepared ? colors.successBg : colors.faint, opacity: pressed ? 0.7 : 1 }]}>
            <Icon name={prepared ? 'check' : 'qr'} color={prepared ? colors.success : colors.primary} size={25} />
            <View style={{ flex: 1, gap: 3 }}><Text style={[TYPE.label, { color: colors.text }]}>{prepared ? 'Wake-up QR prepared' : 'Prepare your wake-up QR'}</Text><Text style={[TYPE.small, { color: colors.muted }]}>{prepared ? 'View your saved code.' : 'Save it away from bed. Scan to stop.'}</Text></View>
            <Icon name="chevron" color={colors.muted} size={20} />
          </Pressable>
          {requiresPermissions && <Notice colors={colors} action="Set up" onAction={() => navigate('settings')}>Check alarm permissions before relying on your next wake-up.</Notice>}
          <View style={styles.sectionHeader}><Text accessibilityRole="header" style={[TYPE.section, { color: colors.text }]}>Your alarms</Text><Text style={[TYPE.small, { color: colors.muted }]}>{sorted.filter(item => item.enabled).length} on</Text></View>
          {ready && !sorted.length && <Text style={[TYPE.body, { color: colors.muted, paddingBottom: 24 }]}>No alarms yet. Add one below to start.</Text>}
          {sorted.map(alarm => {
            const time = clockParts(alarm.hour, alarm.minute);
            return <View key={alarm.id} style={[styles.alarm, { borderColor: colors.outline, backgroundColor: colors.surface }]}>
              <View style={styles.alarmRow}>
                <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${time.time} ${time.period} ${alarm.label || 'alarm'}`} disabled={busy} onPress={() => { setMessage(''); setEditor(alarm); }} style={{ flex: 1, minWidth: 0 }}>
                  <View style={styles.alarmTimeRow}><Text style={[styles.alarmTime, { color: alarm.enabled ? colors.text : colors.muted }]}>{time.time}</Text><Text style={[TYPE.body, { color: colors.muted }]}>{time.period}</Text></View>
                  <Text style={[TYPE.label, { color: colors.text, flexShrink: 1 }]}>{alarm.label || 'Alarm'}</Text>
                  <Text style={[TYPE.small, { color: colors.muted, marginTop: 4 }]}>{repeatLabel(alarm.days)} · {alarm.challenge === 'qr' ? 'QR challenge' : 'Standard'}{alarm.snoozed ? ' · Snoozed' : ''}</Text>
                </Pressable>
                <Toggle value={alarm.enabled} colors={colors} disabled={busy} label={`${alarm.enabled ? 'Disable' : 'Enable'} ${alarm.label || `${time.time} ${time.period} alarm`}`} onChange={enabled => toggle(alarm, enabled)} />
              </View>
            </View>;
          })}
        </> : page === 'qr' ? <>
          <View style={styles.pageTitle}><Text accessibilityRole="header" style={[TYPE.title, { color: colors.text }]}>Wake-up QR</Text><Text style={[TYPE.body, { color: colors.muted }]}>Your first step out of bed.</Text></View>
          <QrSetup key={token || 'loading'} token={token} prepared={prepared} onPrepared={prepare} colors={colors} native={api.isNativeAlarm} />
        </> : <>
          <View style={styles.pageTitle}><Text accessibilityRole="header" style={[TYPE.title, { color: colors.text }]}>Settings</Text><Text style={[TYPE.body, { color: colors.muted }]}>Make your next wake-up ready.</Text></View>
          <View style={[styles.settingsGroup, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
            <View style={styles.settingRow}><View style={{ flex: 1 }}><Text style={[TYPE.label, { color: colors.text }]}>Dark appearance</Text><Text style={[TYPE.small, { color: colors.muted }]}>A dimmer screen for bedtime.</Text></View><Toggle colors={colors} value={mode === 'dark'} label="Dark appearance" onChange={changeTheme} /></View>
          </View>
          {api.isNativeAlarm && <><Text accessibilityRole="header" style={[TYPE.section, { color: colors.text, marginTop: 16 }]}>Alarm permissions</Text>
            <View style={[styles.settingsGroup, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
              {[['Precise alarms', state.exact, api.requestExact, 'Schedule alarms at the selected time.'], ['Notifications', state.notifications, () => Linking.openSettings(), 'Open the ringing screen from the notification.'], ['Lock-screen popups', state.fullScreen, api.requestFullScreen, 'Let Android show the alarm over the lock screen.']].map(([label, allowed, onPress, description], index) =>
                <Pressable key={label} accessibilityRole="button" onPress={onPress} style={[styles.permissionRow, { borderTopWidth: index ? 1 : 0, borderColor: colors.outline }]}>
                  <View style={{ flex: 1, gap: 4 }}><Text style={[TYPE.label, { color: colors.text }]}>{label}</Text><Text style={[TYPE.small, { color: colors.muted }]}>{description}</Text></View>
                  <Text style={[TYPE.small, { color: allowed ? colors.success : colors.primary }]}>{allowed ? 'Allowed' : 'Enable'}</Text><Icon name={allowed ? 'check' : 'chevron'} color={allowed ? colors.success : colors.primary} size={18} />
                </Pressable>)}
            </View></>}
          <View style={styles.help}><Text accessibilityRole="header" style={[TYPE.section, { color: colors.text }]}>Before you turn in</Text>
            <Text style={[TYPE.body, { color: colors.muted }]}>Alarms use your phone’s alarm tone and alarm volume. Keep the phone powered on and check its alarm volume.</Text>
            <Text style={[TYPE.body, { color: colors.muted }]}>Force-stopping the app prevents alarms until you reopen it. Android settings and device policies can affect lock-screen alerts.</Text>
            <Text style={[TYPE.body, { color: colors.muted }]}>QR alarms need the matching code from this installation. Keep a printed copy or display it on another device.</Text>
          </View>
          {!api.isNativeAlarm && <View style={{ gap: 12 }}><Text accessibilityRole="header" style={[TYPE.section, { color: colors.text }]}>Try the ringing screens</Text><Text style={[TYPE.body, { color: colors.muted }]}>These previews make no sound and schedule no alarms.</Text>
            <Button colors={colors} variant="tonal" icon="qr" onPress={() => setPreview({ ...newAlarm('qr'), label: 'Morning alarm' })}>Preview QR alarm</Button>
            <Button colors={colors} variant="tonal" icon="alarm" onPress={() => setPreview({ ...newAlarm('normal'), label: 'Morning alarm' })}>Preview standard alarm</Button>
          </View>}
        </>}
      </ScrollView>
      {message ? <View accessibilityLiveRegion="polite" style={[styles.snackbar, { backgroundColor: colors.text }]}><Text style={[TYPE.small, { color: colors.bg, flex: 1 }]}>{message}</Text><Pressable accessibilityRole="button" accessibilityLabel="Dismiss status message" onPress={() => setMessage('')} style={styles.messageClose}><Icon name="close" size={18} color={colors.bg} /></Pressable></View> : null}
      {page === 'alarms' && <View style={styles.addArea}><Button colors={colors} icon="plus" disabled={!ready || busy} onPress={() => { setMessage(''); setEditor(newAlarm()); }}>Add alarm</Button></View>}
      <View style={[styles.navigation, { borderColor: colors.outline, backgroundColor: colors.faint, paddingBottom: Math.max(insets.bottom, 8) }]}>
        {[['alarms', 'alarm', 'Alarms'], ['qr', 'qr', 'Wake-up QR'], ['settings', 'settings', 'Settings']].map(([id, icon, label]) =>
          <Pressable key={id} accessibilityRole="tab" accessibilityLabel={label} aria-selected={page === id} accessibilityState={{ selected: page === id }} onPress={() => navigate(id)} style={styles.navItem}>
            <View style={[styles.navIcon, { backgroundColor: page === id ? colors.container : 'transparent' }]}><Icon name={icon} color={page === id ? colors.primary : colors.muted} size={23} /></View>
            <Text style={[TYPE.small, { color: page === id ? colors.primary : colors.muted, fontWeight: page === id ? '700' : '500', textAlign: 'center' }]}>{label}</Text>
          </Pressable>)}
      </View>
    </View>
    {editor && <AlarmEditor key={editor.id} alarm={editor} colors={colors} existing={state.alarms.some(item => item.id === editor.id)} onClose={() => setEditor(null)} onSave={save} onDelete={remove} token={token} prepared={prepared} onPrepared={prepare} native={api.isNativeAlarm} />}
    {active && <RingingScreen key={`${isPreview ? 'preview' : 'alarm'}-${active.id}`} alarm={active} colors={colors} now={now} preview={isPreview} onDismiss={dismiss} onSnooze={snooze} onClosePreview={() => setPreview(null)} onBack={() => setHiddenRinging(active.id)} />}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  root: { flex: 1 }, shell: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' }, appBar: { minHeight: 60, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 }, brandName: { fontSize: 21, fontWeight: '600', letterSpacing: -0.3 }, previewStrip: { paddingHorizontal: 24, paddingVertical: 8 },
  content: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 28, gap: 16 }, pageTitle: { gap: 4, marginBottom: 4 }, nextAlarm: { borderRadius: 16, padding: 18, gap: 4 },
  clockLine: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 10 }, inline: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 8 },
  qrStatus: { borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 80 }, sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  alarm: { borderWidth: 1, borderRadius: 16, padding: 20 }, alarmRow: { flexDirection: 'row', alignItems: 'center', gap: 4 }, alarmTimeRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 7 },
  alarmTime: { fontSize: 42, lineHeight: 52, fontWeight: '400', letterSpacing: -0.8, fontVariant: ['tabular-nums'] }, addArea: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16 },
  navigation: { flexDirection: 'row', borderTopWidth: 1, paddingHorizontal: 12, paddingTop: 10 }, navItem: { flex: 1, minHeight: 64, alignItems: 'center', justifyContent: 'center', gap: 4 }, navIcon: { width: 64, height: 32, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  snackbar: { flexDirection: 'row', alignItems: 'center', paddingLeft: 18, paddingRight: 6, marginHorizontal: 24, marginTop: 4, borderRadius: 8, minHeight: 52, gap: 4 }, messageClose: { width: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  settingsGroup: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' }, settingRow: { minHeight: 84, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12 }, permissionRow: { minHeight: 88, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 10 },
  help: { gap: 14, paddingVertical: 12 },
});
