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

const SAVED_MOVIES_KEY = 'SAVED_MOVIES';

const Saved = () => {
  const [savedMovies, setSavedMovies] = useState<MovieDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSavedMovies = async () => {
    try {
      setLoading(true);
      const saved = await AsyncStorage.getItem(SAVED_MOVIES_KEY);
      if (saved) {
        const ids: string[] = JSON.parse(saved);
        const movies = await Promise.all(
          ids.map(async (id) => {
            try {
              return await fetchMovieBasicDetails(id);
            } catch {
              return null;
            }
          })
        );
        setSavedMovies(movies.filter(Boolean) as MovieDetails[]);
      } else {
        setSavedMovies([]);
      }
    } catch {
      setSavedMovies([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSavedMovies();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSavedMovies();
  }, []);

  const removeMovie = async (movieId: number) => {
    try {
      const saved = await AsyncStorage.getItem(SAVED_MOVIES_KEY);
      if (saved) {
        const ids: string[] = JSON.parse(saved);
        const updated = ids.filter((id) => id !== movieId.toString());
        await AsyncStorage.setItem(SAVED_MOVIES_KEY, JSON.stringify(updated));
      }
      setSavedMovies((prev) => prev.filter((m) => m.id !== movieId));
    } catch (e) {
      console.log('Error removing movie', e);
    }
  };

  const renderItem = ({ item }: { item: MovieDetails }) => (
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
          <Text className='text-white font-bold text-sm' numberOfLines={2}>
            {item.title}
          </Text>
          <Text className='text-gray-500 text-xs mt-1'>
            {item.release_date?.split('-')[0]}
            {item.runtime ? ` · ${item.runtime} min` : ''}
          </Text>
          <View className='flex-row items-center gap-x-1 mt-1'>
            <Image source={icons.star} className='size-3' />
            <Text className='text-white text-xs font-bold'>
              {Math.round(item.vote_average / 2)}/5
            </Text>
          </View>
          <Text className='text-gray-500 text-xs mt-1' numberOfLines={2}>
            {item.overview}
          </Text>
        </View>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            removeMovie(item.id);
          }}
          className='ml-2 bg-red-600 rounded-lg p-2'
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text className='text-white text-xs font-bold'>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Link>
  );

  return (
    <View className='bg-primary flex-1 px-5'>
      <View className='flex justify-center items-center flex-col gap-2 mt-14 mb-4'>
        <Image source={icons.save} className='size-8' tintColor='#fff' />
        <Text className='text-gray-500 text-base'>Movies to watch later</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#A8B5DB" className="mt-10 self-center" />
      ) : savedMovies.length === 0 ? (
        <View className='flex-1 items-center justify-center'>
          <Image source={icons.remeber} className='size-40 mb-4 opacity-20' tintColor='#fff' />
          <Text className='text-gray-500 text-base text-center'>No movies saved for later</Text>
          <Text className='text-gray-600 text-sm text-center mt-1'>Mark movies as Saved to watch later from their detail page.</Text>
          <Text className='text-gray-600 text-sm text-center mt-1'>Keep your list in one place</Text>
        </View>
      ) : (
        <FlatList
          data={savedMovies}
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

export default Saved
