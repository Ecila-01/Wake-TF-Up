import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'wakeTFUp:preparedQr:v1';
export const isQrPrepared = async token => Boolean(token && await AsyncStorage.getItem(KEY) === token);
export const markQrPrepared = token => AsyncStorage.setItem(KEY, token);
