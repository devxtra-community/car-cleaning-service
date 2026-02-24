import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import axios from 'axios';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const BACKEND_URL = 'http://10.10.1.203:3033/api/auth/register-push-token';

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
        console.log('Failed to get push notification permissions');
        return undefined;
      }

      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;

        if (!projectId) {
          console.log('Project ID not found');
          return undefined;
        }

        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log('Supervisor Push Token:', token);
      } catch (error) {
        console.error('Error getting push token:', error);
        return undefined;
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }

  const sendTokenToBackend = async (token: string, authToken: string): Promise<void> => {
    try {
      console.log('Sending supervisor push token to backend...');
      console.log('URL:', BACKEND_URL);
      console.log('Token:', token);

      const response = await axios.post(
        BACKEND_URL,
        { pushToken: token },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Supervisor push token registered:', response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Backend error:', error.response?.data);
        console.error('Status:', error.response?.status);
        console.error('URL:', error.config?.url);
      } else {
        console.error('Failed to send push token:', error);
      }
    }
  };

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      setExpoPushToken(token);
    });

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
      console.log('Supervisor received notification:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Supervisor notification tapped:', response);
    });

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
