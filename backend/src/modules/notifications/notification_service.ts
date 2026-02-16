import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { pool } from '../../database/connectDatabase';
import { logger } from '../../config/logger';

const expo = new Expo();
const PUSH_ENABLED = process.env.PUSH_NOTIFICATIONS_ENABLED === 'true';

export const sendNotificationToUser = async (
  userId: string,
  title: string,
  message: string,
  data?: Record<string, unknown>
): Promise<boolean> => {
  if (!PUSH_ENABLED) {
    console.log('Push notifications disabled');
    return false;
  }

  try {
    const result = await pool.query('SELECT push_token, full_name FROM users WHERE id = $1', [
      userId,
    ]);

    if (!result.rows.length) {
      console.log(`User not found: ${userId}`);
      return false;
    }

    const pushToken = result.rows[0].push_token;
    const userName = result.rows[0].full_name;

    if (!pushToken) {
      console.log(`No push token for user ${userId} (${userName})`);
      return false;
    }

    if (!Expo.isExpoPushToken(pushToken)) {
      console.log(`Invalid push token: ${pushToken}`);
      return false;
    }

    const messages: ExpoPushMessage[] = [
      {
        to: pushToken,
        sound: 'default',
        title,
        body: message,
        data: data || {},
        priority: 'high',
      },
    ];

    const chunks = expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }

    const ticket = tickets[0];
    if (ticket.status === 'error') {
      console.error('Push notification error:', ticket.message);

      if (ticket.details?.error === 'DeviceNotRegistered') {
        await pool.query('UPDATE users SET push_token = NULL WHERE push_token = $1', [pushToken]);
        console.log('Cleared invalid push token');
      }

      return false;
    }

    await pool.query(
      `INSERT INTO notification_logs (user_id, title, message, data, push_token, status, sent_at)
       VALUES ($1, $2, $3, $4, $5, 'sent', NOW())`,
      [userId, title, message, JSON.stringify(data || {}), pushToken]
    );

    console.log(`Push notification sent to ${userName}`);
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
};

export const registerPushToken = async (userId: string, pushToken: string): Promise<boolean> => {
  try {
    if (!pushToken || !pushToken.startsWith('ExponentPushToken[')) {
      console.log('Invalid token format');
      return false;
    }

    const result = await pool.query(
      'UPDATE users SET push_token = $1 WHERE id = $2 RETURNING full_name',
      [pushToken, userId]
    );

    if (result.rows.length === 0) {
      console.log('User not found');
      return false;
    }

    console.log(`Push token registered for ${result.rows[0].full_name}`);
    return true;
  } catch (error) {
    console.error('Error registering push token:', error);
    return false;
  }
};

export const removePushToken = async (userId: string): Promise<boolean> => {
  try {
    await pool.query('UPDATE users SET push_token = NULL WHERE id = $1', [userId]);
    console.log(`Push token removed for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error removing push token:', error);
    return false;
  }
};
