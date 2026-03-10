import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { pool } from '../../database/connectDatabase';

const expo = new Expo();

export const sendNotificationToUser = async (
  userId: string,
  title: string,
  message: string,
  data?: Record<string, unknown>
): Promise<boolean> => {
  const PUSH_ENABLED = process.env.PUSH_NOTIFICATIONS_ENABLED === 'true';
  console.log(
    `[PushService] Attempting to notify ${userId}. PUSH_ENABLED=${PUSH_ENABLED} (process.env.PUSH_NOTIFICATIONS_ENABLED=${process.env.PUSH_NOTIFICATIONS_ENABLED})`
  );

  if (!PUSH_ENABLED) {
    console.log('[PushService] Push notifications disabled in .env');
    return false;
  }

  try {
    const result = await pool.query('SELECT push_token, full_name FROM users WHERE id = $1', [
      userId,
    ]);

    if (!result.rows.length) {
      console.log(`[PushService] User not found: ${userId}`);
      return false;
    }

    const pushToken = result.rows[0].push_token;
    const userName = result.rows[0].full_name;

    if (!pushToken) {
      console.log(`[PushService] No push token for user ${userId} (${userName})`);
      return false;
    }

    console.log(`[PushService] Found token for ${userName}: ${pushToken.substring(0, 20)}...`);

    if (!Expo.isExpoPushToken(pushToken)) {
      console.log(`[PushService] Invalid push token format: ${pushToken}`);
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
      const errorMsg = ticket.message || 'Unknown error';
      console.error('[PushService] Push notification error:', errorMsg);

      // Log failure to DB
      try {
        await pool.query(
          `INSERT INTO notification_logs (user_id, title, message, data, push_token, status, error_details, sent_at)
           VALUES ($1, $2, $3, $4, $5, 'failed', $6, NOW())`,
          [userId, title, message, JSON.stringify(data || {}), pushToken, errorMsg]
        );
      } catch (dbError) {
        console.error('[PushService] Failed to log failure to DB:', dbError);
      }

      if (ticket.details?.error === 'DeviceNotRegistered') {
        await pool.query('UPDATE users SET push_token = NULL WHERE push_token = $1', [pushToken]);
        console.log('[PushService] Cleared invalid push token');
      }

      return false;
    }

    try {
      await pool.query(
        `INSERT INTO notification_logs (user_id, title, message, data, push_token, status, sent_at)
         VALUES ($1, $2, $3, $4, $5, 'sent', NOW())`,
        [userId, title, message, JSON.stringify(data || {}), pushToken]
      );
      console.log(`[PushService] Logged notification for ${userName}`);
    } catch (logError) {
      console.error(
        '[PushService] Failed to write to notification_logs table. Is the table missing?',
        logError
      );
      // We don't return false here because the notification WAS sent to Expo,
      // just the logging failed.
    }

    console.log(`[PushService] Successfully sent to ${userName}`);
    return true;
  } catch (error) {
    console.error('[PushService] Critical error in sendNotificationToUser:', error);
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
