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
  isPlaying: boolean,
  position?: number,
  duration?: number
) => {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.dismissAllNotificationsAsync();

    const formatTime = (millis: number) => {
      const totalSeconds = Math.floor(millis / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    let bodyText = artist;
    if (position !== undefined && duration !== undefined && duration > 0) {
      bodyText = `${artist} • ${formatTime(position)} / ${formatTime(duration)}`;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: isPlaying ? `▶️ ${title}` : `⏸ ${title}`,
        body: bodyText,
        sticky: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        data: {
          type: 'media-control',
          isPlaying,
          position,
          duration,
        },
        categoryIdentifier: 'media-controls',
        sound: false,
        autoDismiss: false,
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
