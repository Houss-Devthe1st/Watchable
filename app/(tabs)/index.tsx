import HorizontalCard from "@/components/HorizontalCard";
import MovieCard from "@/components/MovieCard";
import SearchBar from "@/components/SearchBar";
import TrendingCard from "@/components/TrendingCard";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { fetchGenres, fetchMonthlyMovies, fetchMovies, fetchPopularShows, fetchUpcomingMovies } from "@/services/api";
import useFetch from "@/services/useFetch";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Index() {
  const router = useRouter();
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null);

  const {
    data: genres,
  } = useFetch(fetchGenres);

  const {
    data: movies,
    loading: moviesLoading,
    error: moviesError,
    refetch: refetchMovies,
  } = useFetch(() => fetchMovies({ query: '', genreId: selectedGenreId ?? undefined }), false);

  const {
    data: Monthlymovies,
    loading: monthlyMoviesLoading,
    error: monthlyMoviesError,
  } = useFetch(() => fetchMonthlyMovies({ query: '' }));

  const {
    data: upcomingMovies,
    loading: upcomingLoading,
  } = useFetch(() => fetchUpcomingMovies());

  const {
    data: popularShows,
    loading: showsLoading,
  } = useFetch(() => fetchPopularShows());

  // Refetch movies when genre selection changes
  useEffect(() => {
    refetchMovies();
  }, [selectedGenreId]);

  const handleGenrePress = (genreId: number | null) => {
    setSelectedGenreId(genreId === selectedGenreId ? null : genreId);
  };

  return (
    <View className="flex-1 bg-primary">
      <Image source={images.bg} className="absolute w-full z-0" />
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ minHeight: "100%", paddingBottom: 120 }}
      >
        <Image source={icons.moviesapp} className="w-20 h-20 mt-12 mb-5 mx-auto" />

        {moviesLoading || monthlyMoviesLoading || upcomingLoading || showsLoading ? (
          <ActivityIndicator size="large" color="#A8B5DB" className="mt-10 self-center" />
        ) : moviesError || monthlyMoviesError ? (
          <Text className="text-white text-lg">
            Error: {moviesError?.message || monthlyMoviesError?.message}
          </Text>
        ) : (
          <View className="flex-1 mt-5">
            <SearchBar
              onPress={() => router.push("/search")}
              placeholder="Looking for more? Click here to search"
              onChangeText={() => { }}
            />

            {/* Genre filter chips */}
            {genres && genres.length > 0 && (
              <View className="mt-5">
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={[{ id: null, name: "All" } as any, ...genres]}
                  keyExtractor={(item) => (item.id?.toString() ?? "all")}
                  ItemSeparatorComponent={() => <View className="w-2" />}
                  renderItem={({ item }) => {
                    const isSelected =
                      item.id === null
                        ? selectedGenreId === null
                        : selectedGenreId === item.id;
                    return (
                      <TouchableOpacity
                        onPress={() => handleGenrePress(item.id)}
                        className={`px-4 py-1.5 rounded-full border ${isSelected
                          ? "bg-indigo-900 border-indigo-700"
                          : "bg-transparent border-gray-700"
                          }`}
                      >
                        <Text
                          className={`text-sm font-medium ${isSelected ? "text-white" : "text-gray-400"
                            }`}
                        >
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            )}

            {/* Released this month */}
            {Monthlymovies && (
              <View className="mt-8">
                <Text className="text-lg text-white font-bold mb-3">Released this month</Text>
              </View>
            )}
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              ItemSeparatorComponent={() => <View className="w-4" />}
              className="mb-4 mt-3"
              data={Monthlymovies}
              renderItem={({ item, index }) => (
                <TrendingCard movie={item} index={index} />
              )}
              keyExtractor={(item) => item.movie_id.toString()}
            />

            {/* Upcoming Movies */}
            {upcomingMovies && upcomingMovies.length > 0 && (
              <View className="mt-4">
                <Text className="text-lg text-white font-bold mb-3">Upcoming Movies</Text>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  ItemSeparatorComponent={() => <View className="w-4" />}
                  data={upcomingMovies}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <HorizontalCard
                      id={item.id}
                      title={item.title}
                      poster_path={item.poster_path}
                      type="movie"
                      year={item.release_date?.split('-')[0]}
                    />
                  )}
                />
              </View>
            )}

            {/* Latest Movies grid */}
            <Text className="text-white text-lg font-bold mt-8 mb-3">
              {selectedGenreId
                ? `${genres?.find((g) => g.id === selectedGenreId)?.name ?? ""} Movies`
                : "Latest Movies!"}
            </Text>
            <FlatList
              data={movies}
              renderItem={({ item }) => <MovieCard {...item} />}
              keyExtractor={(item) => item.id.toString()}
              numColumns={3}
              columnWrapperStyle={{
                justifyContent: "flex-start",
                gap: 20,
                paddingRight: 5,
                marginBottom: 10,
              }}
              className="mt-2"
              scrollEnabled={false}
            />

            {/* Popular TV Shows */}
            {popularShows && popularShows.length > 0 && (
              <View className="mt-8">
                <Text className="text-lg text-white font-bold mb-3">Popular TV Shows</Text>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  ItemSeparatorComponent={() => <View className="w-4" />}
                  data={popularShows}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <HorizontalCard
                      id={item.id}
                      title={item.name}
                      poster_path={item.poster_path}
                      type="show"
                      year={item.first_air_date?.split('-')[0]}
                    />
                  )}
                />
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
