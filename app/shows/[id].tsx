import { icons } from '@/constants/icons';
import { fetchTVShowDetails } from '@/services/api';
import {
  isShowNotificationSet,
  requestPermissions,
  toggleShowNotification,
} from '@/services/notifications';
import useFetch from '@/services/useFetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import tailwind from 'tailwind-react-native-classnames';
import YoutubeIframe from 'react-native-youtube-iframe';

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface InfoProps {
  label: string;
  value?: string | number | null;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const ShowInfo = ({ label, value }: InfoProps) => (
  <View className="flex-col items-start justify-center mt-5 mr-6">
    <Text className="text-gray-500 font-normal text-sm">{label}</Text>
    <Text className="text-white font-bold text-sm mt-2">{value || 'N/A'}</Text>
  </View>
);

const SAVED_SHOWS_KEY = 'SAVED_SHOWS';
const WATCHED_SHOWS_KEY = 'WATCHED_SHOWS';
const SHOW_RATINGS_KEY = 'SHOW_RATINGS';

const ShowDetails = () => {
  const { id } = useLocalSearchParams();
  const { data: show } = useFetch(() => fetchTVShowDetails(id as string));

  const [saved, setSaved] = useState(false);
  const [watched, setWatched] = useState(false);
  const [notified, setNotified] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    const loadState = async () => {
      try {
        const [savedRaw, watchedRaw, ratingsRaw, notifSet] = await Promise.all([
          AsyncStorage.getItem(SAVED_SHOWS_KEY),
          AsyncStorage.getItem(WATCHED_SHOWS_KEY),
          AsyncStorage.getItem(SHOW_RATINGS_KEY),
          isShowNotificationSet(Number(id)),
        ]);
        if (savedRaw) setSaved((JSON.parse(savedRaw) as string[]).includes(id as string));
        if (watchedRaw) setWatched((JSON.parse(watchedRaw) as string[]).includes(id as string));
        if (ratingsRaw) {
          const ratings = JSON.parse(ratingsRaw) as Record<string, number>;
          setUserRating(ratings[id as string] ?? 0);
        }
        setNotified(notifSet);
      } catch (e) {
        console.log('Error loading show state', e);
      }
    };
    if (id) loadState();
  }, [id]);

  const handleSavePress = async () => {
    scale.value = withSequence(
      withTiming(1.3, { duration: 150 }),
      withTiming(1, { duration: 150 })
    );
    try {
      const savedShows = await AsyncStorage.getItem(SAVED_SHOWS_KEY);
      let savedIds: string[] = savedShows ? JSON.parse(savedShows) : [];
      if (saved) {
        savedIds = savedIds.filter((sid) => sid !== id);
      } else {
        savedIds.push(id as string);
      }
      await AsyncStorage.setItem(SAVED_SHOWS_KEY, JSON.stringify(savedIds));
      setSaved(!saved);
    } catch (e) {
      console.log('Error saving show', e);
    }
  };

  const handleWatchedPress = async () => {
    try {
      const watchedRaw = await AsyncStorage.getItem(WATCHED_SHOWS_KEY);
      let watchedIds: string[] = watchedRaw ? JSON.parse(watchedRaw) : [];
      if (watched) {
        watchedIds = watchedIds.filter((sid) => sid !== id);
        const ratingsRaw = await AsyncStorage.getItem(SHOW_RATINGS_KEY);
        const ratings: Record<string, number> = ratingsRaw ? JSON.parse(ratingsRaw) : {};
        delete ratings[id as string];
        await AsyncStorage.setItem(SHOW_RATINGS_KEY, JSON.stringify(ratings));
        setUserRating(0);
      } else {
        watchedIds.push(id as string);
      }
      await AsyncStorage.setItem(WATCHED_SHOWS_KEY, JSON.stringify(watchedIds));
      setWatched(!watched);
    } catch (e) {
      console.log('Error toggling watched', e);
    }
  };

  const handleRating = async (star: number) => {
    const newRating = userRating === star ? 0 : star;
    setUserRating(newRating);
    try {
      const ratingsRaw = await AsyncStorage.getItem(SHOW_RATINGS_KEY);
      const ratings: Record<string, number> = ratingsRaw ? JSON.parse(ratingsRaw) : {};
      if (newRating === 0) {
        delete ratings[id as string];
      } else {
        ratings[id as string] = newRating;
      }
      await AsyncStorage.setItem(SHOW_RATINGS_KEY, JSON.stringify(ratings));
    } catch (e) {
      console.log('Error saving rating', e);
    }
  };

  const handleNotifyPress = async () => {
    const granted = await requestPermissions();
    if (!granted) {
      Alert.alert('Permission needed', 'Enable notifications in your device settings.');
      return;
    }
    const isNowSet = await toggleShowNotification(
      Number(id),
      show?.name ?? '',
      show?.next_episode_to_air?.air_date ?? null
    );
    setNotified(isNowSet);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const trailer = show?.videos?.results?.find(
    (v) => v.site === 'YouTube' && v.type === 'Trailer'
  ) ?? show?.videos?.results?.find((v) => v.site === 'YouTube');

  const cast = show?.credits?.cast?.slice(0, 10) ?? [];

  const creator = show?.credits?.crew?.find(
    (c) => c.job === 'Creator' || c.job === 'Executive Producer'
  );

  const episodeRuntime = show?.episode_run_time?.[0];

  return (
    <View className="bg-primary flex-1">
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <View>
          <Image
            source={{ uri: `https://image.tmdb.org/t/p/w500${show?.poster_path}` }}
            className="w-full h-[550px]"
            resizeMode="stretch"
          />
        </View>

        <View className="flex-col items-start justify-center mt-5 px-5">
          <Text className="text-white font-bold text-xl">{show?.name}</Text>

          <View className="flex-row items-center gap-x-1 mt-2">
            <Text className="text-gray-500 text-sm">
              {show?.first_air_date?.split('-')[0]}
            </Text>
            {episodeRuntime ? (
              <Text className="text-gray-500 text-sm">
                · ~{episodeRuntime} min/ep
              </Text>
            ) : null}
          </View>

          <View className="flex-row items-center bg-slate-800 px-2 py-1 rounded-full gap-x-1 mt-2">
            <Image source={icons.star} className="size-4" />
            <Text className="text-white font-bold text-sm">
              {Math.round(show?.vote_average ?? 0)}/10
            </Text>
            <Text className="text-gray-500 text-sm">
              ({show?.vote_count} votes)
            </Text>
          </View>

          <ShowInfo label="Overview" value={show?.overview} />
          <ShowInfo
            label="Genres"
            value={show?.genres?.map((g) => g.name).join(' - ') || 'N/A'}
          />

          <View className="flex flex-row justify-between w-1/2">
            <ShowInfo label="Seasons" value={show?.number_of_seasons} />
            <ShowInfo label="Episodes" value={show?.number_of_episodes} />
          </View>

          <ShowInfo
            label="Networks"
            value={show?.networks?.map((n) => n.name).join(' - ') || 'N/A'}
          />

          {creator && <ShowInfo label="Creator" value={creator.name} />}
        </View>

        {/* Trailer */}
        {trailer && (
          <View className="mt-6 px-5">
            <Text className="text-white font-bold text-base mb-3">Trailer</Text>
            <YoutubeIframe height={210} videoId={trailer.key} play={false} />
          </View>
        )}

        {/* Cast */}
        {cast.length > 0 && (
          <View className="mt-6 px-5">
            <Text className="text-white font-bold text-base mb-3">Cast</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={cast}
              keyExtractor={(item) => item.id.toString()}
              ItemSeparatorComponent={() => <View className="w-3" />}
              renderItem={({ item }) => (
                <View className="items-center w-16">
                  <Image
                    source={{
                      uri: item.profile_path
                        ? `https://image.tmdb.org/t/p/w185${item.profile_path}`
                        : `https://placehold.co/185x278/1a1a1a/ffffff.png`,
                    }}
                    className="w-16 h-20 rounded-lg"
                    resizeMode="cover"
                  />
                  <Text
                    className="text-white text-xs font-semibold mt-1 text-center"
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>
                  <Text className="text-gray-500 text-xs text-center" numberOfLines={1}>
                    {item.character}
                  </Text>
                </View>
              )}
            />
          </View>
        )}

        {/* Save button */}
        <AnimatedTouchable
          style={[
            tailwind`left-0 right-0 mx-5 mt-7 bg-indigo-900 rounded-lg py-3.5 flex flex-row items-center justify-center`,
            animatedStyle,
          ]}
          onPress={handleSavePress}
        >
          <Animated.Image
            source={icons.save}
            className="size-5 mr-1"
            tintColor={saved ? '#A8B5DB' : '#fff'}
            style={animatedStyle}
          />
          <Text className="text-white">{saved ? 'Saved!' : 'Save to watch later'}</Text>
        </AnimatedTouchable>

        {/* Mark as Watched */}
        <TouchableOpacity
          className={`mx-5 mt-3 rounded-lg py-3.5 flex flex-row items-center justify-center ${
            watched ? 'bg-emerald-800' : 'bg-slate-800'
          }`}
          onPress={handleWatchedPress}
        >
          <Image
            source={icons.play}
            className="size-5 mr-2"
            tintColor={watched ? '#6ee7b7' : '#fff'}
          />
          <Text className="text-white font-medium">
            {watched ? 'Watched!' : 'Mark as Watched'}
          </Text>
        </TouchableOpacity>

        {/* Notify on new episode — only if next episode air date is in the future */}
        {show?.next_episode_to_air?.air_date &&
          new Date(show.next_episode_to_air.air_date) > new Date() && (
          <TouchableOpacity
            className={`mx-5 mt-3 rounded-lg py-3.5 flex-row items-center justify-center ${
              notified ? 'bg-amber-800' : 'bg-slate-800'
            }`}
            onPress={handleNotifyPress}
          >
            <Text className="text-lg mr-2">{notified ? '🔔' : '🔕'}</Text>
            <Text className="text-white font-medium">
              {notified ? 'Reminder set!' : 'Notify me on new episode'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Star rating */}
        {watched && (
          <View className="mx-5 mt-3 bg-slate-900 rounded-lg py-3 px-4">
            <Text className="text-gray-400 text-xs mb-2 text-center">Your rating</Text>
            <View className="flex-row justify-center gap-x-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => handleRating(star)}>
                  <Image
                    source={icons.star}
                    className="size-7"
                    tintColor={star <= userRating ? '#FACC15' : '#374151'}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        className="absolute bottom-5 left-0 right-0 mx-5 bg-indigo-900 rounded-lg py-3.5 flex flex-row items-center justify-center z-50"
        onPress={router.back}
      >
        <Image
          source={icons.arrow}
          className="size-5 mr-1 mt0.5 rotate-180"
          tintColor="#fff"
        />
        <Text className="text-white font-semibold text-base">Go Back</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ShowDetails;
