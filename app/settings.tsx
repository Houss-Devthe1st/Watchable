import { icons } from '@/constants/icons';
import {
  SETTING_MONTHLY_NOTIF_KEY,
  requestPermissions,
  sendTestNotification,
} from '@/services/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function Settings() {
  const [monthlyEnabled, setMonthlyEnabled] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(SETTING_MONTHLY_NOTIF_KEY).then((val) => {
      setMonthlyEnabled(val !== 'false');
    });
  }, []);

  const handleMonthlyToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          'Permission needed',
          'Enable notifications in your device settings to receive updates.'
        );
        return;
      }
    }
    setMonthlyEnabled(value);
    await AsyncStorage.setItem(SETTING_MONTHLY_NOTIF_KEY, value ? 'true' : 'false');
  };

  const handleTestNotification = async () => {
    const granted = await requestPermissions();
    if (!granted) {
      Alert.alert('Permission needed', 'Enable notifications in your device settings.');
      return;
    }
    await sendTestNotification();
    Alert.alert('Test sent', 'Minimize the app — notification arrives in 3 seconds.');
  };

  return (
    <View className="bg-primary flex-1 px-5">
      <View className="flex-row items-center gap-x-3 mt-14 mb-8">
        <TouchableOpacity onPress={router.back}>
          <Image source={icons.arrow} className="size-5 rotate-180" tintColor="#fff" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Settings</Text>
      </View>

      <Text className="text-gray-500 text-xs uppercase tracking-widest mb-3">Notifications</Text>

      <View className="bg-slate-900 rounded-xl px-4 py-3 mb-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 mr-3">
            <Text className="text-white font-medium">New monthly releases</Text>
            <Text className="text-gray-500 text-xs mt-1">
              Get notified when new movies are released this month
            </Text>
          </View>
          <Switch
            value={monthlyEnabled}
            onValueChange={handleMonthlyToggle}
            trackColor={{ false: '#374151', true: '#4338ca' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <TouchableOpacity
        onPress={handleTestNotification}
        className="bg-indigo-900 rounded-xl py-3.5 items-center mt-2"
      >
        <Text className="text-white font-semibold">Send Test Notification</Text>
      </TouchableOpacity>
    </View>
  );
}
