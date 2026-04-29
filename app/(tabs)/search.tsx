import MovieCard from '@/components/MovieCard';
import SearchBar from '@/components/SearchBar';
import TVShowCard from '@/components/TVShowCard';
import { icons } from '@/constants/icons';
import { images } from '@/constants/images';
import { fetchMovies, fetchTVShows } from '@/services/api';
import useFetch from '@/services/useFetch';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, ScrollView, Text, View } from 'react-native';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: movies,
    loading: moviesLoading,
    error: moviesError,
    refetch: loadMovies,
  } = useFetch(() => fetchMovies({ query: searchQuery }), false);

  const {
    data: shows,
    loading: showsLoading,
    error: showsError,
    refetch: loadShows,
  } = useFetch(() => fetchTVShows({ query: searchQuery }), false);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchQuery.trim()) {
        await Promise.all([loadMovies(), loadShows()]);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const isLoading = moviesLoading || showsLoading;
  const hasQuery = searchQuery.trim().length > 0;

  return (
    <View className="flex-1 bg-primary">
      <Image source={images.bg} className="flex-1 absolute w-full z-0" resizeMode="cover" />
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header */}
        <View className="w-full flex-row justify-center mt-20 items-center">
          <Image source={icons.moviesapp} className="w-20 h-20" />
        </View>
        <View className="my-5">
          <SearchBar
            placeholder="Search movies & TV shows..."
            value={searchQuery}
            onChangeText={(text: string) => setSearchQuery(text)}
          />
        </View>

        {isLoading && (
          <ActivityIndicator size="large" color="#A8B5DB" className="my-3" />
        )}
        {(moviesError || showsError) && (
          <Text className="text-red-500 my-3">
            Error: {moviesError?.message || showsError?.message}
          </Text>
        )}

        {/* Results — only shown after a query */}
        {hasQuery && !isLoading && (
          <>
            {/* Movies section */}
            <Text className="text-xl text-white mb-3">
              Movies{' '}
              <Text className="text-accent font-bold">({movies?.length ?? 0})</Text>
            </Text>
            {movies && movies.length > 0 ? (
              <FlatList
                data={movies}
                renderItem={({ item }) => <MovieCard {...item} />}
                keyExtractor={(item) => item.id.toString()}
                numColumns={3}
                scrollEnabled={false}
                columnWrapperStyle={{
                  justifyContent: 'flex-start',
                  gap: 16,
                  marginBottom: 10,
                }}
              />
            ) : (
              <Text className="text-gray-500 text-center mb-6">No movies found</Text>
            )}

            {/* TV Shows section */}
            <Text className="text-xl text-white mb-3 mt-6">
              TV Shows{' '}
              <Text className="text-accent font-bold">({shows?.length ?? 0})</Text>
            </Text>
            {shows && shows.length > 0 ? (
              <FlatList
                data={shows}
                renderItem={({ item }) => (
                  <TVShowCard
                    id={item.id}
                    name={item.name}
                    poster_path={item.poster_path}
                    vote_average={item.vote_average}
                    first_air_date={item.first_air_date}
                  />
                )}
                keyExtractor={(item) => item.id.toString()}
                numColumns={3}
                scrollEnabled={false}
                columnWrapperStyle={{
                  justifyContent: 'flex-start',
                  gap: 16,
                  marginBottom: 10,
                }}
              />
            ) : (
              <Text className="text-gray-500 text-center mb-6">No TV shows found</Text>
            )}
          </>
        )}

        {/* Empty state */}
        {!hasQuery && !isLoading && (
          <View className="mt-10">
            <Text className="text-center text-gray-500">
              Search for a movie or TV show
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default Search;
