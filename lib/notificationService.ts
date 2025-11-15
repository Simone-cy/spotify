import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const setupNotificationCategories = async () => {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.setNotificationCategoryAsync('media-controls', [
      {
        identifier: 'previous',
        buttonTitle: '⏮ Previous',
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: 'play-pause',
        buttonTitle: '⏯ Play/Pause',
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: 'next',
        buttonTitle: 'Next ⏭',
        options: {
          opensAppToForeground: false,
        },
      },
    ]);
  } catch (error) {
    console.error('Error setting up notification categories:', error);
  }
};

export const requestNotificationPermissions = async () => {
  if (Platform.OS === 'web') return true;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

export const showMediaNotification = async (
  title: string,
  artist: string,
  isPlaying: boolean
) => {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.dismissAllNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: isPlaying ? `▶️ ${title}` : `⏸ ${title}`,
        body: artist,
        sticky: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        data: { type: 'media-control', isPlaying },
        categoryIdentifier: 'media-controls',
        sound: false,
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Error showing media notification:', error);
  }
};

export const dismissMediaNotification = async () => {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch (error) {
    console.error('Error dismissing notification:', error);
  }
};
