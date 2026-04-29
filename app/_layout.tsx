import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Modal, StatusBar } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import './globals.css';
import Onboarding from "@/components/Onboarding";

const ONBOARDING_KEY = 'ONBOARDING_COMPLETE';

export default function RootLayout() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setShowOnboarding(val === null);
    });
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
