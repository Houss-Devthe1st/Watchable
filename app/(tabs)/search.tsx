import MovieCard from '@/components/MovieCard';
import SearchBar from "@/components/SearchBar";
import { icons } from '@/constants/icons';
import { images } from '@/constants/images';
import { fetchMovies } from '@/services/api';
//import { updateSearchCount } from '@/services/appwrite';
import useFetch from '@/services/useFetch';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Text, View } from 'react-native';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');

  //custom hook
  const {
    data: movies,
    loading,
    error,
    refetch: loadMovies,
    //reset,
  } = useFetch(() => fetchMovies({
    query: searchQuery
  }), false)


  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchQuery.trim()) {
        await loadMovies();
      }
    }, 500)
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  //BELOW function gets the results for each letter typed
  //   useEffect(()=> {
  //     const func = async() => {
  //       if(searchQuery.trim()) {
  //         await loadMovies();
  //     } else {
  //       reset()
  //     }
  //   }
  //    func();
  // },[searchQuery]);


  ///appwrite function to get the count of a movie
  // useEffect(() => {
  //   if (movies?.length > 0 && movies?.[0]) {
  //     updateSearchCount(searchQuery, movies[0]);
  //   }
  // }, [movies, searchQuery]);



  return (
    <View className='flex-1 bg-primary'>
      <Image source={images.bg} className='flex-1 absolute w-full z-0' resizeMode='cover' />
      <FlatList
        data={movies}
        renderItem={({ item }) => <MovieCard {...item} />}
        keyExtractor={(item) => item.id.toString()}
        className='px-5'
        numColumns={3}
        columnWrapperStyle={
          {
            justifyContent: 'center',
            gap: 16,
            marginVertical: 16
          }}
        contentContainerStyle={{ paddingBottom: 100 }}
        // {/*ListHeaderComponent: Whatever we put in the ListHeaderComponent will be added to the top */}
        ListHeaderComponent={
          <View>
            <View className='w-full flex-row justify-center mt-20 items-center'>
              <Image source={icons.moviesapp} className='w-16 h-16' />
            </View>

            <View className='my-5'>
              <SearchBar placeholder='Search movies...'
                value={searchQuery}
                onChangeText={(text: string) => setSearchQuery(text)} />
            </View>

            {loading && (<ActivityIndicator size="large" color="#A8B5DB" className='my-3' />)}
            {error && (<Text className='text-red-500 px-5 my-3'>Error: {error.message}</Text>)}
            {!loading && !error && searchQuery.trim() && movies?.length > 0 && (
              <Text className='text-xl text-white'>Search Results for{' '}
                <Text className='text-accent font-bold'>{searchQuery}</Text>
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          !loading && !error ? (
            <View className='mt-10 px-5'>
              <Text className='text-center text-gray-500'>
                {searchQuery.trim() ? 'Mmm...I Don\'t Think We Have That' : 'Search for a movie'}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  )
}

export default Search