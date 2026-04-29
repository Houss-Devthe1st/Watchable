import { icons } from '@/constants/icons';
import { fetchMovieBasicDetails, fetchTVShowBasicDetails } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const SAVED_MOVIES_KEY = 'SAVED_MOVIES';
const SAVED_SHOWS_KEY = 'SAVED_SHOWS';

const Saved = () => {
  const [savedMovies, setSavedMovies] = useState<MovieDetails[]>([]);
  const [savedShows, setSavedShows] = useState<TVShowDetails[]>([]);
  const [activeFilter, setActiveFilter] = useState<'movies' | 'shows'>('movies');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSaved = async () => {
    try {
      setLoading(true);
      const [savedMoviesRaw, savedShowsRaw] = await Promise.all([
        AsyncStorage.getItem(SAVED_MOVIES_KEY),
        AsyncStorage.getItem(SAVED_SHOWS_KEY),
      ]);

      if (savedMoviesRaw) {
        const ids: string[] = JSON.parse(savedMoviesRaw);
        const movies = await Promise.all(
          ids.map(async (id) => {
            try { return await fetchMovieBasicDetails(id); } catch { return null; }
          })
        );
        setSavedMovies(movies.filter(Boolean) as MovieDetails[]);
      } else {
        setSavedMovies([]);
      }

      if (savedShowsRaw) {
        const ids: string[] = JSON.parse(savedShowsRaw);
        const shows = await Promise.all(
          ids.map(async (id) => {
            try { return await fetchTVShowBasicDetails(id); } catch { return null; }
          })
        );
        setSavedShows(shows.filter(Boolean) as TVShowDetails[]);
      } else {
        setSavedShows([]);
      }
    } catch {
      setSavedMovies([]);
      setSavedShows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSaved();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSaved();
  }, []);

  const removeMovie = async (movieId: number) => {
    try {
      const saved = await AsyncStorage.getItem(SAVED_MOVIES_KEY);
      if (saved) {
        const ids: string[] = JSON.parse(saved);
        await AsyncStorage.setItem(SAVED_MOVIES_KEY, JSON.stringify(ids.filter((id) => id !== movieId.toString())));
      }
      setSavedMovies((prev) => prev.filter((m) => m.id !== movieId));
    } catch (e) {
      console.log('Error removing movie', e);
    }
  };

  const removeShow = async (showId: number) => {
    try {
      const saved = await AsyncStorage.getItem(SAVED_SHOWS_KEY);
      if (saved) {
        const ids: string[] = JSON.parse(saved);
        await AsyncStorage.setItem(SAVED_SHOWS_KEY, JSON.stringify(ids.filter((id) => id !== showId.toString())));
      }
      setSavedShows((prev) => prev.filter((s) => s.id !== showId));
    } catch (e) {
      console.log('Error removing show', e);
    }
  };

  const renderMovie = ({ item }: { item: MovieDetails }) => (
    <Link href={`/movies/${item.id}`} asChild>
      <TouchableOpacity className="flex-row items-center bg-slate-900 rounded-xl p-3 my-1">
        <Image
          source={{
            uri: item.poster_path
              ? `https://image.tmdb.org/t/p/w185${item.poster_path}`
              : `https://placehold.co/185x278/1a1a1a/ffffff.png`,
          }}
          className="w-16 h-24 rounded-lg"
          resizeMode="cover"
        />
        <View className="flex-1 ml-3">
          <Text className="text-white font-bold text-sm" numberOfLines={2}>
            {item.title}
          </Text>
          <Text className="text-gray-500 text-xs mt-1">
            {item.release_date?.split('-')[0]}
            {item.runtime ? ` · ${item.runtime} min` : ''}
          </Text>
          <View className="flex-row items-center gap-x-1 mt-1">
            <Image source={icons.star} className="size-3" />
            <Text className="text-white text-xs font-bold">
              {Math.round(item.vote_average / 2)}/5
            </Text>
          </View>
          <Text className="text-gray-500 text-xs mt-1" numberOfLines={2}>
            {item.overview}
          </Text>
        </View>
        <TouchableOpacity
          onPress={(e) => { e.stopPropagation(); removeMovie(item.id); }}
          className="ml-2 bg-red-600 rounded-lg p-2"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text className="text-white text-xs font-bold">✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Link>
  );

  const renderShow = ({ item }: { item: TVShowDetails }) => (
    <Link href={`/shows/${item.id}`} asChild>
      <TouchableOpacity className="flex-row items-center bg-slate-900 rounded-xl p-3 my-1">
        <Image
          source={{
            uri: item.poster_path
              ? `https://image.tmdb.org/t/p/w185${item.poster_path}`
              : `https://placehold.co/185x278/1a1a1a/ffffff.png`,
          }}
          className="w-16 h-24 rounded-lg"
          resizeMode="cover"
        />
        <View className="flex-1 ml-3">
          <Text className="text-white font-bold text-sm" numberOfLines={2}>
            {item.name}
          </Text>
          <Text className="text-gray-500 text-xs mt-1">
            {item.first_air_date?.split('-')[0]}
            {item.episode_run_time?.[0] ? ` · ~${item.episode_run_time[0]} min/ep` : ''}
          </Text>
          <View className="flex-row items-center gap-x-1 mt-1">
            <Image source={icons.star} className="size-3" />
            <Text className="text-white text-xs font-bold">
              {Math.round(item.vote_average / 2)}/5
            </Text>
          </View>
          <Text className="text-gray-500 text-xs mt-1" numberOfLines={2}>
            {item.overview}
          </Text>
        </View>
        <TouchableOpacity
          onPress={(e) => { e.stopPropagation(); removeShow(item.id); }}
          className="ml-2 bg-red-600 rounded-lg p-2"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text className="text-white text-xs font-bold">✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Link>
  );

  const isMovies = activeFilter === 'movies';
  const activeData = isMovies ? savedMovies : savedShows;

  return (
    <View className="bg-primary flex-1 px-5">
      {/* Header */}
      <View className="flex justify-center items-center flex-col gap-2 mt-14 mb-4">
        <Image source={icons.save} className="size-8" tintColor="#fff" />
        <Text className="text-gray-500 text-base">Watch Later</Text>
      </View>

      {/* Filter chips */}
      <View className="flex-row gap-x-2 mb-4">
        {(['movies', 'shows'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            onPress={() => setActiveFilter(filter)}
            className={`px-4 py-1.5 rounded-full border ${
              activeFilter === filter
                ? 'bg-indigo-900 border-indigo-700'
                : 'bg-transparent border-gray-700'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                activeFilter === filter ? 'text-white' : 'text-gray-400'
              }`}
            >
              {filter === 'movies' ? 'Movies' : 'TV Shows'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#A8B5DB" className="mt-10 self-center" />
      ) : activeData.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Image source={icons.remeber} className="size-40 mb-4 opacity-20" tintColor="#fff" />
          <Text className="text-gray-500 text-base text-center">
            {isMovies ? 'No movies saved for later' : 'No TV shows saved for later'}
          </Text>
          <Text className="text-gray-600 text-sm text-center mt-1">
            {isMovies
              ? 'Save movies from their detail page to watch later.'
              : 'Save TV shows from their detail page to watch later.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={activeData as any[]}
          renderItem={isMovies ? renderMovie : renderShow}
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

export default Saved;
