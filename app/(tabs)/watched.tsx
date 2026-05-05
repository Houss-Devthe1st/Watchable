import HorizontalCard from '@/components/HorizontalCard'
import { icons } from '@/constants/icons'
import {
  fetchMovieBasicDetails,
  fetchMovieRecommendations,
  fetchTVShowBasicDetails,
  fetchTVShowRecommendations,
} from '@/services/api'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Link, useFocusEffect } from 'expo-router'
import React, { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

const WATCHED_MOVIES_KEY = 'WATCHED_MOVIES';
const MOVIE_RATINGS_KEY = 'MOVIE_RATINGS';
const WATCHED_SHOWS_KEY = 'WATCHED_SHOWS';
const SHOW_RATINGS_KEY = 'SHOW_RATINGS';
const MOVIE_COMMENTS_KEY = 'MOVIE_COMMENTS';
const SHOW_COMMENTS_KEY = 'SHOW_COMMENTS';

const StarRow = ({ rating }: { rating: number }) => (
  <View className='flex-row gap-x-0.5 mt-1'>
    {[1, 2, 3, 4, 5].map((star) => (
      <Image
        key={`star-${star}-${rating}`}
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
  const [movieComments, setMovieComments] = useState<Record<string, string>>({});
  const [watchedShows, setWatchedShows] = useState<TVShowDetails[]>([]);
  const [showRatings, setShowRatings] = useState<Record<string, number>>({});
  const [showComments, setShowComments] = useState<Record<string, string>>({});
  const [activeFilter, setActiveFilter] = useState<'movies' | 'shows'>('movies');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [movieRecs, setMovieRecs] = useState<Movie[]>([]);
  const [movieRecTitle, setMovieRecTitle] = useState('');
  const [showRecs, setShowRecs] = useState<TVShow[]>([]);
  const [showRecTitle, setShowRecTitle] = useState('');

  const loadWatched = async () => {
    try {
      setLoading(true);
      const [watchedRaw, ratingsRaw, watchedShowsRaw, showRatingsRaw, movieCommentsRaw, showCommentsRaw] =
        await Promise.all([
          AsyncStorage.getItem(WATCHED_MOVIES_KEY),
          AsyncStorage.getItem(MOVIE_RATINGS_KEY),
          AsyncStorage.getItem(WATCHED_SHOWS_KEY),
          AsyncStorage.getItem(SHOW_RATINGS_KEY),
          AsyncStorage.getItem(MOVIE_COMMENTS_KEY),
          AsyncStorage.getItem(SHOW_COMMENTS_KEY),
        ]);

      if (ratingsRaw) setRatings(JSON.parse(ratingsRaw));
      if (showRatingsRaw) setShowRatings(JSON.parse(showRatingsRaw));
      setMovieComments(movieCommentsRaw ? JSON.parse(movieCommentsRaw) : {});
      setShowComments(showCommentsRaw ? JSON.parse(showCommentsRaw) : {});

      let movies: MovieDetails[] = [];
      let movieIds: string[] = [];
      if (watchedRaw) {
        movieIds = JSON.parse(watchedRaw);
        const fetched = await Promise.all(
          movieIds.map(async (id) => {
            try { return await fetchMovieBasicDetails(id); } catch { return null; }
          })
        );
        movies = fetched.filter(Boolean) as MovieDetails[];
        setWatchedMovies(movies);
      } else {
        setWatchedMovies([]);
      }

      let shows: TVShowDetails[] = [];
      let showIds: string[] = [];
      if (watchedShowsRaw) {
        showIds = JSON.parse(watchedShowsRaw);
        const fetched = await Promise.all(
          showIds.map(async (id) => {
            try { return await fetchTVShowBasicDetails(id); } catch { return null; }
          })
        );
        shows = fetched.filter(Boolean) as TVShowDetails[];
        setWatchedShows(shows);
      } else {
        setWatchedShows([]);
      }

      // Non-blocking recommendations fetch from most-recently-added watched item
      if (movieIds.length > 0) {
        fetchMovieRecommendations(movieIds[movieIds.length - 1]).then((recs) => {
          setMovieRecs(recs.slice(0, 10));
          const ref = movies.find((m) => m.id.toString() === movieIds[movieIds.length - 1]);
          setMovieRecTitle(ref?.title ?? '');
        }).catch(() => { });
      }
      if (showIds.length > 0) {
        fetchTVShowRecommendations(showIds[showIds.length - 1]).then((recs) => {
          setShowRecs(recs.slice(0, 10));
          const ref = shows.find((s) => s.id.toString() === showIds[showIds.length - 1]);
          setShowRecTitle(ref?.name ?? '');
        }).catch(() => { });
      }
    } catch {
      setWatchedMovies([]);
      setWatchedShows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadWatched(); }, []));

  const onRefresh = useCallback(() => { setRefreshing(true); loadWatched(); }, []);

  const removeMovie = async (movieId: number) => {
    try {
      const key = movieId.toString();
      const [watchedRaw, ratingsRaw, commentsRaw] = await Promise.all([
        AsyncStorage.getItem(WATCHED_MOVIES_KEY),
        AsyncStorage.getItem(MOVIE_RATINGS_KEY),
        AsyncStorage.getItem(MOVIE_COMMENTS_KEY),
      ]);
      if (watchedRaw) {
        const ids: string[] = JSON.parse(watchedRaw);
        await AsyncStorage.setItem(WATCHED_MOVIES_KEY, JSON.stringify(ids.filter((id) => id !== key)));
      }
      if (ratingsRaw) {
        const r: Record<string, number> = JSON.parse(ratingsRaw);
        delete r[key];
        await AsyncStorage.setItem(MOVIE_RATINGS_KEY, JSON.stringify(r));
      }
      if (commentsRaw) {
        const c: Record<string, string> = JSON.parse(commentsRaw);
        delete c[key];
        await AsyncStorage.setItem(MOVIE_COMMENTS_KEY, JSON.stringify(c));
      }
      setWatchedMovies((prev) => prev.filter((m) => m.id !== movieId));
      setRatings((prev) => { const r = { ...prev }; delete r[key]; return r; });
      setMovieComments((prev) => { const c = { ...prev }; delete c[key]; return c; });
    } catch (e) {
      console.log('Error removing watched movie', e);
    }
  };

  const removeShow = async (showId: number) => {
    try {
      const key = showId.toString();
      const [watchedRaw, ratingsRaw, commentsRaw] = await Promise.all([
        AsyncStorage.getItem(WATCHED_SHOWS_KEY),
        AsyncStorage.getItem(SHOW_RATINGS_KEY),
        AsyncStorage.getItem(SHOW_COMMENTS_KEY),
      ]);
      if (watchedRaw) {
        const ids: string[] = JSON.parse(watchedRaw);
        await AsyncStorage.setItem(WATCHED_SHOWS_KEY, JSON.stringify(ids.filter((id) => id !== key)));
      }
      if (ratingsRaw) {
        const r: Record<string, number> = JSON.parse(ratingsRaw);
        delete r[key];
        await AsyncStorage.setItem(SHOW_RATINGS_KEY, JSON.stringify(r));
      }
      if (commentsRaw) {
        const c: Record<string, string> = JSON.parse(commentsRaw);
        delete c[key];
        await AsyncStorage.setItem(SHOW_COMMENTS_KEY, JSON.stringify(c));
      }
      setWatchedShows((prev) => prev.filter((s) => s.id !== showId));
      setShowRatings((prev) => { const r = { ...prev }; delete r[key]; return r; });
      setShowComments((prev) => { const c = { ...prev }; delete c[key]; return c; });
    } catch (e) {
      console.log('Error removing watched show', e);
    }
  };

  const isMovies = activeFilter === 'movies';

  // Movie stats
  const totalWatchedMovies = watchedMovies.length;
  const ratedMovies = watchedMovies.filter((m) => ratings[m.id.toString()]);
  const movieAvgRating = ratedMovies.length > 0
    ? (ratedMovies.reduce((sum, m) => sum + (ratings[m.id.toString()] ?? 0), 0) / ratedMovies.length).toFixed(1)
    : null;
  const totalRuntime = watchedMovies.reduce((sum, m) => sum + (m.runtime ?? 0), 0);
  const runtimeHours = Math.floor(totalRuntime / 60);
  const runtimeMins = totalRuntime % 60;

  // Show stats
  const totalWatchedShows = watchedShows.length;
  const ratedShows = watchedShows.filter((s) => showRatings[s.id.toString()]);
  const showAvgRating = ratedShows.length > 0
    ? (ratedShows.reduce((sum, s) => sum + (showRatings[s.id.toString()] ?? 0), 0) / ratedShows.length).toFixed(1)
    : null;
  const totalEpisodes = watchedShows.reduce((sum, s) => sum + (s.number_of_episodes ?? 0), 0);

  const displayCount = isMovies ? totalWatchedMovies : totalWatchedShows;
  const displayAvg = isMovies ? movieAvgRating : showAvgRating;
  const activeData = isMovies ? watchedMovies : watchedShows;

  const renderMovie = ({ item }: { item: MovieDetails }) => {
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
            {rating === 0 && <Text className='text-gray-600 text-xs mt-1'>Not rated yet</Text>}
            {movieComments[item.id.toString()] && (
              <Text className='text-indigo-300 text-xs mt-1 italic' numberOfLines={1}>
                "{movieComments[item.id.toString()]}"
              </Text>
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

  const renderShow = ({ item }: { item: TVShowDetails }) => {
    const rating = showRatings[item.id.toString()] ?? 0;
    return (
      <Link href={`/shows/${item.id}`} asChild>
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
            <Text className='text-white font-bold text-sm' numberOfLines={2}>{item.name}</Text>
            <Text className='text-gray-500 text-xs mt-1'>
              {item.first_air_date?.split('-')[0]}
              {item.episode_run_time?.[0] ? ` · ~${item.episode_run_time[0]} min/ep` : ''}
            </Text>
            <StarRow rating={rating} />
            {rating === 0 && <Text className='text-gray-600 text-xs mt-1'>Not rated yet</Text>}
            {showComments[item.id.toString()] && (
              <Text className='text-indigo-300 text-xs mt-1 italic' numberOfLines={1}>
                "{showComments[item.id.toString()]}"
              </Text>
            )}
            <Text className='text-gray-500 text-xs mt-1' numberOfLines={2}>{item.overview}</Text>
          </View>
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation(); removeShow(item.id); }}
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
      <View className="flex-row items-center gap-x-2 mt-14 mb-4">
        <Image source={icons.play} className="size-5" tintColor="#fff" />
        <Text className="text-white text-lg font-bold">Watched</Text>
      </View>

      {/* Filter chips */}
      <View className='flex-row gap-x-2 mb-4'>
        {(['movies', 'shows'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            onPress={() => setActiveFilter(filter)}
            className={`px-4 py-1.5 rounded-full border ${activeFilter === filter
                ? 'bg-indigo-900 border-indigo-700'
                : 'bg-transparent border-gray-700'
              }`}
          >
            <Text className={`text-sm font-medium ${activeFilter === filter ? 'text-white' : 'text-gray-400'}`}>
              {filter === 'movies' ? 'Movies' : 'TV Shows'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats bar */}
      {!loading && displayCount > 0 && (
        <View className='flex-row bg-slate-900 rounded-xl px-4 py-3 mb-4 gap-x-5'>
          <View className='items-center flex-1'>
            <Text className='text-white font-bold text-lg'>{displayCount}</Text>
            <Text className='text-gray-500 text-xs'>{isMovies ? 'Movies' : 'Shows'}</Text>
          </View>
          <View className='w-px bg-slate-700' />
          <View className='items-center flex-1'>
            <Text className='text-white font-bold text-lg'>
              {displayAvg ? `⭐ ${displayAvg}` : '—'}
            </Text>
            <Text className='text-gray-500 text-xs'>Avg rating</Text>
          </View>
          <View className='w-px bg-slate-700' />
          <View className='items-center flex-1'>
            {isMovies ? (
              <>
                <Text className='text-white font-bold text-lg'>
                  {totalRuntime > 0 ? `${runtimeHours}h ${runtimeMins}m` : '—'}
                </Text>
                <Text className='text-gray-500 text-xs'>Watch time</Text>
              </>
            ) : (
              <>
                <Text className='text-white font-bold text-lg'>
                  {totalEpisodes > 0 ? totalEpisodes : '—'}
                </Text>
                <Text className='text-gray-500 text-xs'>Episodes</Text>
              </>
            )}
          </View>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#A8B5DB" className="mt-10 self-center" />
      ) : activeData.length === 0 ? (
        <View className='flex-1 items-center justify-center'>
          <Image source={icons.sleep} className='size-40 mb-4 opacity-20' tintColor='#fff' />
          <Text className='text-gray-500 text-base text-center'>
            {isMovies ? 'No watched movies yet.' : 'No watched TV shows yet.'}
          </Text>
          <Text className='text-gray-600 text-sm text-center mt-1'>
            {isMovies
              ? 'Mark movies as watched from their detail page.'
              : 'Mark TV shows as watched from their detail page.'}
          </Text>
          <Text className='text-gray-600 text-sm text-center mt-1'>Take a Break And Watch Something.</Text>
        </View>
      ) : (
        <FlatList
          data={activeData as any[]}
          renderItem={isMovies ? renderMovie : renderShow}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
          }
          ListHeaderComponent={() => {
            const recs = (isMovies ? movieRecs : showRecs) as (Movie | TVShow)[];
            const recTitle = isMovies ? movieRecTitle : showRecTitle;
            if (recs.length === 0) return null;
            return (
              <View className='mb-4'>
                <Text className='text-white font-bold text-base mb-3' numberOfLines={1}>
                  Because you watched{' '}
                  <Text className='text-indigo-300'>{recTitle}</Text>
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12 }}
                >
                  {recs.map((item) => (
                    <HorizontalCard
                      key={item.id}
                      id={item.id}
                      title={'title' in item ? item.title : item.name}
                      poster_path={item.poster_path}
                      type={isMovies ? 'movie' : 'show'}
                      year={('release_date' in item ? item.release_date : item.first_air_date)?.split('-')[0]}
                    />
                  ))}
                </ScrollView>
              </View>
            );
          }}
          ListFooterComponent={() => <View style={{ height: 100 }} />}
        />
      )}
    </View>
  );
};

export default Watched;
