import { icons } from '@/constants/icons'
import { fetchMovieBasicDetails } from '@/services/api'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Link, useFocusEffect } from 'expo-router'
import React, { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

const WATCHED_MOVIES_KEY = 'WATCHED_MOVIES';
const MOVIE_RATINGS_KEY = 'MOVIE_RATINGS';

const StarRow = ({ rating }: { rating: number }) => (
  <View className='flex-row gap-x-0.5 mt-1'>
    {[1, 2, 3, 4, 5].map((star) => (
      <Image
        key={star}
        source={icons.star}
        className='size-3'
        tintColor={star <= rating ? '#FACC15' : '#374151'}
      />
    ))}
  </View>
);

const Watched = () => {
  const [watchedMovies, setWatchedMovies] = useState<MovieDetails[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadWatchedMovies = async () => {
    try {
      setLoading(true);
      const [watchedRaw, ratingsRaw] = await Promise.all([
        AsyncStorage.getItem(WATCHED_MOVIES_KEY),
        AsyncStorage.getItem(MOVIE_RATINGS_KEY),
      ]);

      if (ratingsRaw) setRatings(JSON.parse(ratingsRaw));

      if (watchedRaw) {
        const ids: string[] = JSON.parse(watchedRaw);
        const movies = await Promise.all(
          ids.map(async (id) => {
            try { return await fetchMovieBasicDetails(id); }
            catch { return null; }
          })
        );
        setWatchedMovies(movies.filter(Boolean) as MovieDetails[]);
      } else {
        setWatchedMovies([]);
      }
    } catch {
      setWatchedMovies([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadWatchedMovies(); }, []));

  const onRefresh = useCallback(() => { setRefreshing(true); loadWatchedMovies(); }, []);

  const removeMovie = async (movieId: number) => {
    try {
      const watchedRaw = await AsyncStorage.getItem(WATCHED_MOVIES_KEY);
      if (watchedRaw) {
        const ids: string[] = JSON.parse(watchedRaw);
        await AsyncStorage.setItem(WATCHED_MOVIES_KEY, JSON.stringify(ids.filter((id) => id !== movieId.toString())));
      }
      const ratingsRaw = await AsyncStorage.getItem(MOVIE_RATINGS_KEY);
      if (ratingsRaw) {
        const r: Record<string, number> = JSON.parse(ratingsRaw);
        delete r[movieId.toString()];
        await AsyncStorage.setItem(MOVIE_RATINGS_KEY, JSON.stringify(r));
      }
      setWatchedMovies((prev) => prev.filter((m) => m.id !== movieId));
      setRatings((prev) => { const r = { ...prev }; delete r[movieId.toString()]; return r; });
    } catch (e) {
      console.log('Error removing watched movie', e);
    }
  };

  // Stats
  const totalWatched = watchedMovies.length;
  const ratedMovies = watchedMovies.filter((m) => ratings[m.id.toString()]);
  const avgRating = ratedMovies.length > 0
    ? (ratedMovies.reduce((sum, m) => sum + (ratings[m.id.toString()] ?? 0), 0) / ratedMovies.length).toFixed(1)
    : null;
  const totalRuntime = watchedMovies.reduce((sum, m) => sum + (m.runtime ?? 0), 0);
  const runtimeHours = Math.floor(totalRuntime / 60);
  const runtimeMins = totalRuntime % 60;

  const renderItem = ({ item }: { item: MovieDetails }) => {
    const rating = ratings[item.id.toString()] ?? 0;
    return (
      <Link href={`/movies/${item.id}`} asChild>
        <TouchableOpacity className='flex-row items-center bg-slate-900 rounded-xl p-3 my-1'>
          <Image
            source={{
              uri: item.poster_path
                ? `https://image.tmdb.org/t/p/w185${item.poster_path}`
                : `https://placehold.co/185x278/1a1a1a/ffffff.png`,
            }}
            className='w-16 h-24 rounded-lg'
            resizeMode='cover'
          />
          <View className='flex-1 ml-3'>
            <Text className='text-white font-bold text-sm' numberOfLines={2}>{item.title}</Text>
            <Text className='text-gray-500 text-xs mt-1'>
              {item.release_date?.split('-')[0]}{item.runtime ? ` · ${item.runtime} min` : ''}
            </Text>
            <StarRow rating={rating} />
            {rating === 0 && (
              <Text className='text-gray-600 text-xs mt-1'>Not rated yet</Text>
            )}
            <Text className='text-gray-500 text-xs mt-1' numberOfLines={2}>{item.overview}</Text>
          </View>
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation(); removeMovie(item.id); }}
            className='ml-2 bg-red-600 rounded-lg p-2'
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text className='text-white text-xs font-bold'>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Link>
    );
  };

  return (
    <View className='bg-primary flex-1 px-5'>
      {/* Header */}
      <View className='flex-row items-center gap-x-2 mt-14 mb-4'>
        <Image source={icons.moviesapp} className='size-5' tintColor='#fff' />
        <Text className='text-white text-lg font-bold'>Watched</Text>
      </View>

      {/* Stats bar */}
      {!loading && totalWatched > 0 && (
        <View className='flex-row bg-slate-900 rounded-xl px-4 py-3 mb-4 gap-x-5'>
          <View className='items-center flex-1'>
            <Text className='text-white font-bold text-lg'>{totalWatched}</Text>
            <Text className='text-gray-500 text-xs'>Movies</Text>
          </View>
          <View className='w-px bg-slate-700' />
          <View className='items-center flex-1'>
            <Text className='text-white font-bold text-lg'>
              {avgRating ? `⭐ ${avgRating}` : '—'}
            </Text>
            <Text className='text-gray-500 text-xs'>Avg rating</Text>
          </View>
          <View className='w-px bg-slate-700' />
          <View className='items-center flex-1'>
            <Text className='text-white font-bold text-lg'>
              {totalRuntime > 0 ? `${runtimeHours}h ${runtimeMins}m` : '—'}
            </Text>
            <Text className='text-gray-500 text-xs'>Watch time</Text>
          </View>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#A8B5DB" className="mt-10 self-center" />
      ) : watchedMovies.length === 0 ? (
        <View className='flex-1 items-center justify-center'>
          <Image source={icons.sleep} className='size-40 mb-4 opacity-20' tintColor='#fff' />
          <Text className='text-gray-500 text-base text-center'>No watched movies yet.</Text>
          <Text className='text-gray-600 text-sm text-center mt-1'>Mark movies as watched from their detail page.</Text>
          <Text className='text-gray-600 text-sm text-center mt-1'>Take a Break And Watch Something.</Text>
        </View>
      ) : (
        <FlatList
          data={watchedMovies}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
          }
        />
      )}
    </View>
  );
};

export default Watched
