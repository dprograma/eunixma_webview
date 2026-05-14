import messaging from '@react-native-firebase/messaging';
import {Platform, Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {requestNotificationPermission} from '../utils/permissions';
import Logger from '../utils/logger';

const FCM_TOKEN_KEY = '@eunixma_fcm_token';

// All users subscribe to this topic so the admin can broadcast to everyone
const BROADCAST_TOPIC = 'all_users';

export async function init(): Promise<void> {
  try {
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      Logger.warn('NotificationService', 'Notification permission denied');
      return;
    }

    const token = await getToken();
    Logger.info('NotificationService', 'FCM Token', token);

    // Subscribe to broadcast topic so admin can push to all users at once
    await messaging()
      .subscribeToTopic(BROADCAST_TOPIC)
      .then(() =>
        Logger.info('NotificationService', `Subscribed to topic: ${BROADCAST_TOPIC}`),
      )
      .catch(err =>
        Logger.warn('NotificationService', 'Topic subscription failed', err),
      );

    // Refresh token listener
    messaging().onTokenRefresh(async newToken => {
      Logger.info('NotificationService', 'Token refreshed', newToken);
      await AsyncStorage.setItem(FCM_TOKEN_KEY, newToken);
    });

    // Foreground message handler — show an in-app alert so users don't miss it
    messaging().onMessage(async remoteMessage => {
      Logger.info('NotificationService', 'Foreground message', remoteMessage);
      const title = remoteMessage.notification?.title ?? 'Eunixma';
      const body = remoteMessage.notification?.body ?? '';
      if (body) {
        Alert.alert(title, body);
      }
    });
  } catch (err) {
    Logger.error('NotificationService', 'Init failed', err);
  }
}

async function requestPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    return requestNotificationPermission();
  }

  const authStatus = await messaging().requestPermission();
  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
}

export async function getToken(): Promise<string> {
  try {
    const token = await messaging().getToken();
    await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
    return token;
  } catch (err) {
    Logger.error('NotificationService', 'Get token failed', err);
    const cached = await AsyncStorage.getItem(FCM_TOKEN_KEY);
    return cached ?? '';
  }
}

export async function onNotificationOpened(
  remoteMessage: Record<string, unknown>,
): Promise<string | null> {
  const data = remoteMessage?.data as Record<string, string> | undefined;
  if (data?.url) {
    return data.url;
  }
  if (data?.deepLink) {
    return data.deepLink;
  }
  return null;
}

export function registerBackgroundHandler(): void {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    Logger.info('NotificationService', 'Background message', remoteMessage);
    // Background notifications with a `notification` key are shown automatically
    // by Firebase on Android. No manual display needed here.
  });
}
