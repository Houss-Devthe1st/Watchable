import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Platform } from 'react-native';

const NOTIF_PREFIX_MOVIE = 'NOTIF_MOVIE_';
const NOTIF_PREFIX_SHOW = 'NOTIF_SHOW_';
const MONTHLY_SNAPSHOT_KEY = 'MONTHLY_SNAPSHOT';
export const SETTING_MONTHLY_NOTIF_KEY = 'SETTING_MONTHLY_NOTIF';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const setupNotifications = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('watchable-default', {
      name: 'Watchable',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
};

export const requestPermissions = async (): Promise<boolean> => {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const toggleMovieNotification = async (
  movieId: number,
  title: string,
  releaseDate: string
): Promise<boolean> => {
  const key = `${NOTIF_PREFIX_MOVIE}${movieId}`;
  const existing = await AsyncStorage.getItem(key);
  if (existing) {
    await Notifications.cancelScheduledNotificationAsync(existing);
    await AsyncStorage.removeItem(key);
    return false;
  }
  const releaseMs = new Date(releaseDate).setHours(9, 0, 0, 0);
  if (releaseMs <= Date.now()) return false;
  const notifId = await Notifications.scheduleNotificationAsync({
    content: {
      title: `${title} is out today! 🎬`,
      body: 'Tap to check it out.',
      data: { type: 'movie', id: movieId },
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DATE,
      date: new Date(releaseMs),
      channelId: 'watchable-default',
    },
  });
  await AsyncStorage.setItem(key, notifId);
  return true;
};

export const toggleShowNotification = async (
  showId: number,
  showName: string,
  nextEpisodeAirDate: string | null
): Promise<boolean> => {
  const key = `${NOTIF_PREFIX_SHOW}${showId}`;
  const existing = await AsyncStorage.getItem(key);
  if (existing) {
    await Notifications.cancelScheduledNotificationAsync(existing);
    await AsyncStorage.removeItem(key);
    return false;
  }
  if (!nextEpisodeAirDate) return false;
  const airMs = new Date(nextEpisodeAirDate).setHours(9, 0, 0, 0);
  if (airMs <= Date.now()) return false;
  const notifId = await Notifications.scheduleNotificationAsync({
    content: {
      title: `New episode of ${showName}! 📺`,
      body: 'Tap to check it out.',
      data: { type: 'show', id: showId },
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DATE,
      date: new Date(airMs),
      channelId: 'watchable-default',
    },
  });
  await AsyncStorage.setItem(key, notifId);
  return true;
};

export const isMovieNotificationSet = async (movieId: number): Promise<boolean> => {
  const val = await AsyncStorage.getItem(`${NOTIF_PREFIX_MOVIE}${movieId}`);
  return val !== null;
};

export const isShowNotificationSet = async (showId: number): Promise<boolean> => {
  const val = await AsyncStorage.getItem(`${NOTIF_PREFIX_SHOW}${showId}`);
  return val !== null;
};

export const checkMonthlyMoviesUpdate = async (currentMovieIds: number[]): Promise<void> => {
  const settingRaw = await AsyncStorage.getItem(SETTING_MONTHLY_NOTIF_KEY);
  if (settingRaw === 'false') return;
  const snapshotRaw = await AsyncStorage.getItem(MONTHLY_SNAPSHOT_KEY);
  const prevIds: number[] = snapshotRaw ? JSON.parse(snapshotRaw) : [];
  const newIds = currentMovieIds.filter((id) => !prevIds.includes(id));
  await AsyncStorage.setItem(MONTHLY_SNAPSHOT_KEY, JSON.stringify(currentMovieIds));
  if (newIds.length > 0 && prevIds.length > 0) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${newIds.length} new release${newIds.length > 1 ? 's' : ''} this month! 🎬`,
        body: 'Check out the latest movies.',
        data: { type: 'home' },
      },
      trigger: {
        type: SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1,
        channelId: 'watchable-default',
      },
    });
  }
};

export const sendTestNotification = async (): Promise<void> => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Watchable notifications are working! 🎬',
      body: 'You will be notified about new releases.',
      data: { type: 'home' },
    },
    trigger: {
      type: SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 3,
      channelId: 'watchable-default',
    },
  });
};
