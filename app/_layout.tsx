import { setupNotifications } from '@/services/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import './globals.css';
import Onboarding from '@/components/Onboarding';

const ONBOARDING_KEY = 'ONBOARDING_COMPLETE';

export default function RootLayout() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setShowOnboarding(val === null);
    });
  }, []);

  useEffect(() => {
    setupNotifications();

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { type: string; id?: number };
      if (data.type === 'movie' && data.id) router.push(`/movies/${data.id}`);
      else if (data.type === 'show' && data.id) router.push(`/shows/${data.id}`);
    });

    setTimeout(async () => {
      const last = await Notifications.getLastNotificationResponseAsync();
      if (last) {
        const data = last.notification.request.content.data as { type: string; id?: number };
        if (data.type === 'movie' && data.id) router.push(`/movies/${data.id}`);
        else if (data.type === 'show' && data.id) router.push(`/shows/${data.id}`);
      }
    }, 500);

    return () => sub.remove();
  }, []);

  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar hidden={true} />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="movies/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="shows/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
      </Stack>
      <Modal
        visible={showOnboarding === true}
        animationType="fade"
        statusBarTranslucent
      >
        <Onboarding onComplete={handleOnboardingComplete} />
      </Modal>
    </GestureHandlerRootView>
  );
}
