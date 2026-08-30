import { Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  LocalNotifications,
  ScheduleOptions,
  PermissionStatus,
  ActionPerformed,
} from '@capacitor/local-notifications';

export interface HabitReminderConfig {
  id: number;
  title: string;
  body: string;
  hour: number;
  minute: number;
  commitmentId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  readonly isSupported = signal<boolean>(Capacitor.isNativePlatform());
  readonly hasPermission = signal<boolean>(false);

  constructor() {
    this.checkPermissions();
    this.setupListeners();
  }

  /**
   * Checks current permission status for local notifications.
   */
  async checkPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      if ('Notification' in window) {
        const granted = Notification.permission === 'granted';
        this.hasPermission.set(granted);
        return granted;
      }
      return false;
    }

    try {
      const status: PermissionStatus = await LocalNotifications.checkPermissions();
      const granted = status.display === 'granted';
      this.hasPermission.set(granted);
      return granted;
    } catch (err) {
      console.warn('[NotificationService] Error checking permissions:', err);
      return false;
    }
  }

  /**
   * Requests permission to display notifications from the user.
   */
  async requestPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      if ('Notification' in window) {
        const res = await Notification.requestPermission();
        const granted = res === 'granted';
        this.hasPermission.set(granted);
        return granted;
      }
      return false;
    }

    try {
      const status = await LocalNotifications.requestPermissions();
      const granted = status.display === 'granted';
      this.hasPermission.set(granted);
      return granted;
    } catch (err) {
      console.error('[NotificationService] Error requesting permissions:', err);
      return false;
    }
  }

  /**
   * Schedules a daily repeating reminder for a habit on the device without requiring server or internet connection.
   */
  async scheduleDailyHabitReminder(config: HabitReminderConfig): Promise<boolean> {
    const hasPerm = await this.checkPermissions();
    if (!hasPerm) {
      const requested = await this.requestPermissions();
      if (!requested) {
        console.warn('[NotificationService] Permission not granted for habit reminder');
        return false;
      }
    }

    if (!Capacitor.isNativePlatform()) {
      console.log('[NotificationService] Web fallback: Reminder scheduled (simulated):', config);
      return true;
    }

    try {
      // Cancel previous notification with this ID first to avoid duplicates
      await this.cancelReminder(config.id);

      const options: ScheduleOptions = {
        notifications: [
          {
            id: config.id,
            title: config.title,
            body: config.body,
            schedule: {
              on: {
                hour: config.hour,
                minute: config.minute,
              },
              allowWhileIdle: true,
            },
            extra: {
              commitmentId: config.commitmentId,
            },
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#008080',
          },
        ],
      };

      await LocalNotifications.schedule(options);
      console.log(`[NotificationService] Daily reminder #${config.id} scheduled for ${config.hour}:${config.minute}`);
      return true;
    } catch (err) {
      console.error('[NotificationService] Failed to schedule reminder:', err);
      return false;
    }
  }

  /**
   * Cancels a specific reminder by ID.
   */
  async cancelReminder(notificationId: number): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await LocalNotifications.cancel({
        notifications: [{ id: notificationId }],
      });
    } catch (err) {
      console.warn(`[NotificationService] Failed to cancel notification ${notificationId}:`, err);
    }
  }

  /**
   * Retrieves all pending scheduled notifications.
   */
  async getPendingReminders() {
    if (!Capacitor.isNativePlatform()) return [];
    try {
      const pending = await LocalNotifications.getPending();
      return pending.notifications;
    } catch (err) {
      console.warn('[NotificationService] Failed to get pending notifications:', err);
      return [];
    }
  }

  /**
   * Sets up listeners for user actions on local notifications.
   */
  private setupListeners(): void {
    if (!Capacitor.isNativePlatform()) return;

    LocalNotifications.addListener('localNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('[NotificationService] User tapped notification:', notification);
      const commitmentId = notification.notification.extra?.commitmentId;
      if (commitmentId) {
        // Can navigate or highlight active commitment
      }
    });
  }
}
