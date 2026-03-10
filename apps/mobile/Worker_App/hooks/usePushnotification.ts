import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

import api from '../src/api/api';

export interface PushNotificationState {
  expoPushToken?: string;
  notification?: Notifications.Notification;
}

export const usePushNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [notification, setNotification] = useState<Notifications.Notification | undefined>();

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  async function registerForPushNotificationsAsync(): Promise<string | undefined> {
    let token: string | undefined;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return undefined;
      }

      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;

        if (!projectId) {
          console.log('Project ID not found');
          return undefined;
        }

        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log('Push token:', token);
      } catch (error) {
        console.log('Error getting push token:', error);
        return undefined;
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }

  async function sendTokenToBackend(pushToken: string, authToken?: string): Promise<void> {
    try {
      const response = await api.post(
        '/api/auth/register-push-token',
        {
          pushToken: pushToken,
        },
        {
          // If authToken is provided (e.g. during login), use it.
          // Otherwise the interceptor will use the one from SecureStore.
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        }
      );

      if (!response.data.success) {
        throw new Error('Failed to register push token');
      }

      console.log('Push token registered successfully');
    } catch (error) {
      console.error('Error registering push token:', error);
    }
  }

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      setExpoPushToken(token);
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification: Notifications.Notification) => {
        setNotification(notification);
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response: Notifications.NotificationResponse) => {
        console.log('Notification response:', response);
      }
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
    sendTokenToBackend,
  };
};
