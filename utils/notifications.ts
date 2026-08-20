import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

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
      return;
    }
    // token = (await Notifications.getExpoPushTokenAsync({ projectId: 'your-project-id' })).data;
    // We don't strictly need a push token if we are only doing LOCAL notifications,
    // but we need the permissions granted.
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

export async function scheduleClassNotification(subject: string, location: string, startTimeStr: string, dayIndex: number) {
  // Clear all previous local notifications to avoid duplicates (naive approach for now)
  // In a full app, you'd track notification IDs and cancel/reschedule individually
  await Notifications.cancelAllScheduledNotificationsAsync();

  // For this prototype, let's just schedule it if it's happening today
  // parseTime logic...
  const match = startTimeStr.match(/(\d+):(\d+)\s*(AM|PM|am|pm)?/);
  if (!match) return;

  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const isPM = match[3] && match[3].toLowerCase() === 'pm';
  if (isPM && h !== 12) h += 12;
  if (!isPM && h === 12) h = 0;

  const now = new Date();
  
  // Create date for the class time today
  const classTime = new Date();
  // Adjust day (if dayIndex is provided and differs from today, you'd calculate next occurrence)
  // For simplicity, let's assume it's for today's classes
  classTime.setHours(h, m, 0, 0);

  // Subtract 15 minutes
  const notifyTime = new Date(classTime.getTime() - 15 * 60000);

  // If the time has already passed today, don't schedule
  if (notifyTime < now) {
    return;
  }

  // Calculate seconds until notification
  const secondsToWait = (notifyTime.getTime() - now.getTime()) / 1000;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Class starting soon!",
      body: `${subject} starts in 15 minutes at ${location || 'TBD'}.`,
      sound: true,
    },
    trigger: { 
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, 
      seconds: secondsToWait 
    },
  });
  
  console.log(`Scheduled notification for ${subject} at ${notifyTime.toLocaleTimeString()}`);
}
