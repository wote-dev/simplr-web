import type { Task } from '@/types';

// Check if notifications are supported
export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    throw new Error('Notifications are not supported in this browser');
  }

  // If permission is already granted or denied, return current status
  if (Notification.permission !== 'default') {
    return Notification.permission;
  }

  // Request permission
  const permission = await Notification.requestPermission();
  return permission;
}

// Check current notification permission status
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
}

// Show immediate notification
export function showNotification(title: string, options?: NotificationOptions): Notification | null {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  const notification = new Notification(title, {
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    ...options,
  });

  return notification;
}

// Schedule a reminder notification
export function scheduleReminder(task: Task): number | null {
  if (!task.reminderEnabled || !task.reminderDateTime) {
    return null;
  }

  const reminderTime = new Date(task.reminderDateTime).getTime();
  const now = Date.now();
  const delay = reminderTime - now;

  // Don't schedule if the time has already passed
  if (delay <= 0) {
    return null;
  }

  // Schedule the notification
  const timeoutId = window.setTimeout(() => {
    if (getNotificationPermission() === 'granted') {
      showNotification(`Reminder: ${task.title}`, {
        body: task.description || 'You have a task reminder',
        tag: `task-reminder-${task.id}`,
        requireInteraction: true
      });
    }
  }, delay);

  return timeoutId;
}

// Cancel a scheduled reminder
export function cancelReminder(timeoutId: number): void {
  window.clearTimeout(timeoutId);
}

// Format datetime for input field (YYYY-MM-DDTHH:MM)
export function formatDateTimeForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Get default reminder time (1 hour before due date, or 1 hour from now if no due date)
export function getDefaultReminderTime(task: Task): string {
  if (task.dueDate) {
    const dueDate = new Date(task.dueDate);
    const reminderTime = new Date(dueDate.getTime() - (60 * 60 * 1000)); // 1 hour before
    return formatDateTimeForInput(reminderTime);
  } else {
    const now = new Date();
    const reminderTime = new Date(now.getTime() + (60 * 60 * 1000)); // 1 hour from now
    return formatDateTimeForInput(reminderTime);
  }
}

// Validate reminder time
export function isValidReminderTime(reminderDateTime: string): boolean {
  const reminderTime = new Date(reminderDateTime);
  const now = new Date();
  
  // Must be in the future
  return reminderTime.getTime() > now.getTime();
}

// Storage for active reminder timeouts
const activeReminders = new Map<number, number>();

// Store reminder timeout ID
export function storeReminderTimeout(taskId: number, timeoutId: number): void {
  activeReminders.set(taskId, timeoutId);
}

// Get reminder timeout ID
export function getReminderTimeout(taskId: number): number | undefined {
  return activeReminders.get(taskId);
}

// Remove reminder timeout ID
export function removeReminderTimeout(taskId: number): void {
  const timeoutId = activeReminders.get(taskId);
  if (timeoutId) {
    cancelReminder(timeoutId);
    activeReminders.delete(taskId);
  }
}

// Clear all active reminders
export function clearAllReminders(): void {
  activeReminders.forEach((timeoutId) => {
    cancelReminder(timeoutId);
  });
  activeReminders.clear();
}