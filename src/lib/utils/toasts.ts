import { Alert, Platform, ToastAndroid } from 'react-native';

export const showToast = (message: string): void => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    return;
  }
  Alert.alert('Notice', message);
};

export const showError = (message: string, detail?: string): void => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.LONG);
    return;
  }
  Alert.alert('Error', detail ? `${message}\n\n${detail}` : message);
};
