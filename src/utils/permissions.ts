import {Platform, PermissionsAndroid} from 'react-native';
import Logger from './logger';

export async function requestCameraPermission(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    return true; // iOS handles via Info.plist prompts
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Camera Permission',
        message: 'This app needs access to your camera to take photos.',
        buttonPositive: 'OK',
        buttonNegative: 'Cancel',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    Logger.error('Permissions', 'Camera permission error', err);
    return false;
  }
}

export async function requestStoragePermission(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    return true;
  }

  if (Number(Platform.Version) >= 33) {
    // Android 13+ (API 33+): launchImageLibrary opens the system Photo Picker,
    // which needs no runtime permission at all. Requesting READ_MEDIA_IMAGES
    // here would violate Google Play's Photo and Video Permissions policy.
    return true;
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      {
        title: 'Storage Permission',
        message: 'This app needs access to your files.',
        buttonPositive: 'OK',
        buttonNegative: 'Cancel',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    Logger.error('Permissions', 'Storage permission error', err);
    return false;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    return true; // Handled by Firebase messaging
  }

  if (Number(Platform.Version) >= 33) {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        {
          title: 'Notification Permission',
          message: 'This app needs permission to send you notifications.',
          buttonPositive: 'OK',
          buttonNegative: 'Cancel',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      Logger.error('Permissions', 'Notification permission error', err);
      return false;
    }
  }

  return true; // Pre-Android 13 doesn't need runtime permission
}
