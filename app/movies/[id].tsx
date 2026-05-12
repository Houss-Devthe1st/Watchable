import { useCurtain } from '@/components/CurtainContext';
import { icons } from '@/constants/icons';
import { fetchMovieDetails, fetchMovieWatchProviders } from '@/services/api';
import {
  isMovieNotificationSet,
  requestPermissions,
  toggleMovieNotification,
} from '@/services/notifications';
import useFetch from '@/services/useFetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from "react";
import { Alert, FlatList, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import tailwind from 'tailwind-react-native-classnames';
import YoutubeIframe from 'react-native-youtube-iframe';

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface MovieInfoProps {
  label: string,
  value?: string | number | null;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const MovieInfo = ({ label, value }: MovieInfoProps) => (
  <View className='flex-col items-start justify-center mt-5 mr-6'>
    <Text className='text-gray-500 font-normal text-sm'>
      {label}
    </Text>
    <Text className='text-white font-bold text-sm mt-2'>
      {value || 'N/A'}
    </Text>
  </View>
)

const SAVED_MOVIES_KEY = 'SAVED_MOVIES';
const WATCHED_MOVIES_KEY = 'WATCHED_MOVIES';
const MOVIE_RATINGS_KEY = 'MOVIE_RATINGS';
const MOVIE_COMMENTS_KEY = 'MOVIE_COMMENTS';

const MovieDetails = () => {

  const { id } = useLocalSearchParams();
  const { open } = useCurtain();

  const { data: movie } = useFetch(() => fetchMovieDetails(id as string));
  const { data: watchProviders } = useFetch(() => fetchMovieWatchProviders(id as string));

  useEffect(() => { open(); }, [open]);

  const [saved, setSaved] = useState(false);
  const [watched, setWatched] = useState(false);
  const [notified, setNotified] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [comment, setComment] = useState('');
  const [savedComment, setSavedComment] = useState('');
  const scale = useSharedValue(1);
  const scrollRef = useRef<ScrollView>(null);

  // Load saved, watched, and rating state
  useEffect(() => {
    const loadState = async () => {
      try {
        const [savedRaw, watchedRaw, ratingsRaw, notifSet, commentsRaw] = await Promise.all([
          AsyncStorage.getItem(SAVED_MOVIES_KEY),
          AsyncStorage.getItem(WATCHED_MOVIES_KEY),
          AsyncStorage.getItem(MOVIE_RATINGS_KEY),
          isMovieNotificationSet(Number(id)),
          AsyncStorage.getItem(MOVIE_COMMENTS_KEY),
        ]);
        if (savedRaw) setSaved((JSON.parse(savedRaw) as string[]).includes(id as string));
        if (watchedRaw) setWatched((JSON.parse(watchedRaw) as string[]).includes(id as string));
        if (ratingsRaw) {
          const ratings = JSON.parse(ratingsRaw) as Record<string, number>;
          setUserRating(ratings[id as string] ?? 0);
        }
        setNotified(notifSet);
        if (commentsRaw) {
          const comments = JSON.parse(commentsRaw) as Record<string, string>;
          const loaded = comments[id as string] ?? '';
          setComment(loaded);
          setSavedComment(loaded);
        }
      } catch (e) {
        console.log('Error loading movie state', e);
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
      const savedMovies = await AsyncStorage.getItem(SAVED_MOVIES_KEY);
      let savedIds: string[] = savedMovies ? JSON.parse(savedMovies) : [];
      if (saved) {
        savedIds = savedIds.filter((movieId) => movieId !== id);
      } else {
        savedIds.push(id as string);
      }
      await AsyncStorage.setItem(SAVED_MOVIES_KEY, JSON.stringify(savedIds));
      setSaved(!saved);
    } catch (e) {
      console.log('Error saving movie', e);
    }
  };

  const handleWatchedPress = async () => {
    try {
      const watchedRaw = await AsyncStorage.getItem(WATCHED_MOVIES_KEY);
      let watchedIds: string[] = watchedRaw ? JSON.parse(watchedRaw) : [];
      if (watched) {
        watchedIds = watchedIds.filter((movieId) => movieId !== id);
        const ratingsRaw = await AsyncStorage.getItem(MOVIE_RATINGS_KEY);
        const ratings: Record<string, number> = ratingsRaw ? JSON.parse(ratingsRaw) : {};
        delete ratings[id as string];
        await AsyncStorage.setItem(MOVIE_RATINGS_KEY, JSON.stringify(ratings));
        setUserRating(0);
        const commentsRaw = await AsyncStorage.getItem(MOVIE_COMMENTS_KEY);
        const comments: Record<string, string> = commentsRaw ? JSON.parse(commentsRaw) : {};
        delete comments[id as string];
        await AsyncStorage.setItem(MOVIE_COMMENTS_KEY, JSON.stringify(comments));
        setComment('');
        setSavedComment('');
      } else {
        watchedIds.push(id as string);
      }
      await AsyncStorage.setItem(WATCHED_MOVIES_KEY, JSON.stringify(watchedIds));
      setWatched(!watched);
    } catch (e) {
      console.log('Error toggling watched', e);
    }
  };

  const handleCommentSave = async (text: string) => {
    try {
      const raw = await AsyncStorage.getItem(MOVIE_COMMENTS_KEY);
      const comments: Record<string, string> = raw ? JSON.parse(raw) : {};
      if (text.trim()) {
        comments[id as string] = text.trim();
      } else {
        delete comments[id as string];
      }
      await AsyncStorage.setItem(MOVIE_COMMENTS_KEY, JSON.stringify(comments));
      setSavedComment(text.trim());
    } catch (e) {
      console.log('Error saving comment', e);
    }
  };

  const handleRating = async (star: number) => {
    const newRating = userRating === star ? 0 : star;
    setUserRating(newRating);
    try {
      const ratingsRaw = await AsyncStorage.getItem(MOVIE_RATINGS_KEY);
      const ratings: Record<string, number> = ratingsRaw ? JSON.parse(ratingsRaw) : {};
      if (newRating === 0) {
        delete ratings[id as string];
      } else {
        ratings[id as string] = newRating;
      }
      await AsyncStorage.setItem(MOVIE_RATINGS_KEY, JSON.stringify(ratings));
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
    const isNowSet = await toggleMovieNotification(
      Number(id),
      movie?.title ?? '',
      movie?.release_date ?? ''
    );
    setNotified(isNowSet);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Find first official YouTube trailer
  const trailer = movie?.videos?.results?.find(
    (v) => v.site === 'YouTube' && v.type === 'Trailer'
  ) ?? movie?.videos?.results?.find((v) => v.site === 'YouTube');

  // Top 10 cast members
  const cast = movie?.credits?.cast?.slice(0, 10) ?? [];

  // Director from crew
  const director = movie?.credits?.crew?.find((c) => c.job === 'Director');

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
    <View className='bg-primary flex-1'>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: 80 }}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <Image source={{ uri: `https://image.tmdb.org/t/p/w500${movie?.poster_path}` }} className='w-full h-[550px]' resizeMode='stretch' />
        </View>
        <View className='flex-col items-start justify-center mt-5 px-5'>
          <Text className='text-white font-bold text-xl'>
            {movie?.title}
          </Text>
          <View className='flex-row items-center gap-x-1 mt-2'>
            <Text className='text-gray-500 text-sm'>
              {movie?.release_date?.split('-')[0]}
            </Text>
            <Text className='text-gray-500 text-sm'>
              - {movie?.runtime} minutes
            </Text>
          </View>
          <View className='flex-row items-center bg-slate-800 px-2 py-1 rounded-full gap-x-1 mt-2'>
            <Image source={icons.star} className='size-4' />
            <Text className='text-white font-bold text-sm'>
              {Math.round(movie?.vote_average ?? 0)}/10
            </Text>
            <Text className='text-gray-500 text-sm'>
              ({movie?.vote_count} people votes)
            </Text>
          </View>
          <MovieInfo label="Overview" value={movie?.overview} />
          <MovieInfo label="Genres" value={movie?.genres?.map((g) => g.name).join(' - ') || 'N/A'} />

          <View className='flex flex-row justify-between w-1/2'>
            <MovieInfo
              label='Budget'
              value={
                movie?.budget === 0
                  ? 'N/A'
                  : movie?.budget ?? 0 >= 1_000_000
                    ? `$${((movie?.budget ?? 0) / 1_000_000)} million`
                    : `$${movie?.budget.toLocaleString('en-US')}`
              }
            />
            <MovieInfo label="Revenue"
              value={
                movie?.revenue === 0 ? 'N/A'
                  : `$${(Math.round(movie?.revenue ?? 0) / 1_000_000).toFixed(1)} million`} />
          </View>
          <MovieInfo label="Production Companies" value={movie?.production_companies?.map((c) => c.name).join(' - ') || 'N/A'} />
          {director && (
            <MovieInfo label="Director" value={director.name} />
          )}
        </View>

        {/* Trailer */}
        {trailer && (
          <View className='mt-6 px-5'>
            <Text className='text-white font-bold text-base mb-3'>Trailer</Text>
            <YoutubeIframe
              height={210}
              videoId={trailer.key}
              play={false}
            />
          </View>
        )}

        {/* Cast */}
        {cast.length > 0 && (
          <View className='mt-6 px-5'>
            <Text className='text-white font-bold text-base mb-3'>Cast</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={cast}
              keyExtractor={(item) => item.id.toString()}
              ItemSeparatorComponent={() => <View className='w-3' />}
              renderItem={({ item }) => (
                <View className='items-center w-16'>
                  <Image
                    source={{
                      uri: item.profile_path
                        ? `https://image.tmdb.org/t/p/w185${item.profile_path}`
                        : `https://placehold.co/185x278/1a1a1a/ffffff.png`
                    }}
                    className='w-16 h-20 rounded-lg'
                    resizeMode='cover'
                  />
                  <Text className='text-white text-xs font-semibold mt-1 text-center' numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text className='text-gray-500 text-xs text-center' numberOfLines={1}>
                    {item.character}
                  </Text>
                </View>
              )}
            />
          </View>
        )}

        {/* Where to Watch */}
        {(watchProviders?.flatrate?.length || watchProviders?.rent?.length) ? (
          <View className='mt-6 px-5'>
            <Text className='text-white font-bold text-base mb-3'>Where to Watch</Text>
            {watchProviders?.flatrate && watchProviders.flatrate.length > 0 && (
              <>
                <Text className='text-gray-500 text-xs mb-2 uppercase tracking-wide'>Stream</Text>
                <View className='flex-row flex-wrap gap-2 mb-3'>
                  {watchProviders.flatrate.map((p) => (
                    <Image
                      key={p.provider_id}
                      source={{ uri: `https://image.tmdb.org/t/p/w92${p.logo_path}` }}
                      className='w-10 h-10 rounded-lg'
                      resizeMode='cover'
                    />
                  ))}
                </View>
              </>
            )}
            {watchProviders?.rent && watchProviders.rent.length > 0 && (
              <>
                <Text className='text-gray-500 text-xs mb-2 uppercase tracking-wide'>Rent</Text>
                <View className='flex-row flex-wrap gap-2'>
                  {watchProviders.rent.map((p) => (
                    <Image
                      key={p.provider_id}
                      source={{ uri: `https://image.tmdb.org/t/p/w92${p.logo_path}` }}
                      className='w-10 h-10 rounded-lg'
                      resizeMode='cover'
                    />
                  ))}
                </View>
              </>
            )}
          </View>
        ) : null}

        {/* Action buttons */}
        <AnimatedTouchable
          style={[
            tailwind`left-0 right-0 mx-5 mt-7 bg-indigo-900
      rounded-lg py-3.5 flex flex-row items-center justify-center`,
            animatedStyle
          ]}
          onPress={handleSavePress}>
          <Animated.Image
            source={icons.save}
            className="size-5 mr-1"
            tintColor={saved ? "#A8B5DB" : "#fff"}
            style={animatedStyle}
          />
          <Text className="text-white">
            {saved ? "Saved!" : "Save to watch later"}
          </Text>
        </AnimatedTouchable>

        {/* Mark as Watched */}
        <TouchableOpacity
          className={`mx-5 mt-3 rounded-lg py-3.5 flex flex-row items-center justify-center ${watched ? 'bg-emerald-800' : 'bg-slate-800'}`}
          onPress={handleWatchedPress}
        >
          <Image source={icons.play} className="size-5 mr-2" tintColor={watched ? '#6ee7b7' : '#fff'} />
          <Text className="text-white font-medium">
            {watched ? "Watched!" : "Mark as Watched"}
          </Text>
        </TouchableOpacity>

        {/* Notify on release — only for upcoming movies */}
        {movie?.release_date && new Date(movie.release_date) > new Date() && (
          <TouchableOpacity
            className={`mx-5 mt-3 rounded-lg py-3.5 flex-row items-center justify-center ${
              notified ? 'bg-amber-800' : 'bg-slate-800'
            }`}
            onPress={handleNotifyPress}
          >
            <Text className="text-lg mr-2">{notified ? '🔔' : '🔕'}</Text>
            <Text className="text-white font-medium">
              {notified ? 'Reminder set!' : 'Notify me on release'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Star rating + notes — only visible after marking watched */}
        {watched && (
          <View className='mx-5 mt-3 bg-slate-900 rounded-lg py-3 px-4'>
            <Text className='text-gray-400 text-xs mb-2 text-center'>Your rating</Text>
            <View className='flex-row justify-center gap-x-3'>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => handleRating(star)}>
                  <Image
                    key={`star-${star}-${userRating}`}
                    source={icons.star}
                    className='size-7'
                    tintColor={star <= userRating ? '#FACC15' : '#374151'}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {watched && (
          <View className='mx-5 mt-3 bg-slate-900 rounded-lg py-3 px-4'>
            <Text className='text-gray-400 text-xs mb-2'>Your notes</Text>
            <TextInput
              multiline
              placeholder="What did you think?"
              placeholderTextColor="#4B5563"
              value={comment}
              onChangeText={setComment}
              onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150)}
              className='text-white text-sm'
              style={{ minHeight: 56 }}
            />
            <TouchableOpacity
              onPress={() => handleCommentSave(comment)}
              disabled={comment.trim() === savedComment}
              className='mt-3 rounded-lg py-2 items-center'
              style={{ backgroundColor: comment.trim() === savedComment ? '#1e293b' : '#312e81' }}
            >
              <Text
                className='text-sm font-semibold'
                style={{ color: comment.trim() === savedComment ? '#4B5563' : '#fff' }}
              >
                {savedComment ? 'Update note' : 'Save note'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
      <TouchableOpacity className='absolute bottom-5 left-0 right-0 mx-5 bg-indigo-900
      rounded-lg py-3.5 flex flex-row items-center justify-center z-50'
        onPress={router.back}>
        <Image source={icons.arrow} className='size-5 mr-1 mt0.5 rotate-180' tintColor="#fff" />
        <Text className='text-white font-semibold text-base'>
          Go Back
        </Text>
      </TouchableOpacity>
    </View>
    </KeyboardAvoidingView>
  )
}

export default MovieDetails
