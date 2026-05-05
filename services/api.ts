export const TMDB_CONFIG = {
  BASE_URL: "https://api.themoviedb.org/3",
  API_KEY: process.env.EXPO_PUBLIC_MOVIE_API_KEY,
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${process.env.EXPO_PUBLIC_MOVIE_API_KEY}`,
  },
};

function getCurrentMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  const currentYear = now.getFullYear();
  const firstDay = `${year}-${month}-01`;
  const lastDay = new Date(year, now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  return { firstDay, lastDay, currentYear };
}

export const fetchMovies = async ({ query, genreId }: { query: string; genreId?: number }) => {
  let endpoint: string;
  if (query) {
    endpoint = `${TMDB_CONFIG.BASE_URL}/search/movie?query=${encodeURIComponent(query)}`;
  } else if (genreId) {
    endpoint = `${TMDB_CONFIG.BASE_URL}/discover/movie?sort_by=popularity.desc&with_genres=${genreId}`;
  } else {
    endpoint = `${TMDB_CONFIG.BASE_URL}/discover/movie?sort_by=popularity.desc`;
  }
  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: TMDB_CONFIG.headers,
    });

    if (!response.ok) {
      // Try to get more details from the API response
      console.log(
        "This is the key given:",
        process.env.EXPO_PUBLIC_MOVIE_API_KEY
      );

      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.status_message) {
          errorMessage += `: ${errorData.status_message}`;
        }
      } catch {
        // ignore JSON parse errors
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.results;
  } catch (err: any) {
    // Distinguish network errors vs API errors
    if (
      err.name === "TypeError" &&
      err.message.includes("Network request failed")
    ) {
      throw new Error("Network error: Please check your internet connection.");
    }
    throw err instanceof Error ? err : new Error("Unexpected error occurred");
  }
};

export const fetchGenres = async (): Promise<Genre[]> => {
  try {
    const response = await fetch(
      `${TMDB_CONFIG.BASE_URL}/genre/movie/list`,
      { method: "GET", headers: TMDB_CONFIG.headers }
    );
    if (!response.ok) throw new Error("Failed to fetch genres");
    const data = await response.json();
    return data.genres;
  } catch (error) {
    console.log("Error in fetchGenres: ", error);
    throw error;
  }
};

export const fetchMovieBasicDetails = async (
  movieId: string
): Promise<MovieDetails> => {
  try {
    const response = await fetch(
      `${TMDB_CONFIG.BASE_URL}/movie/${movieId}`,
      { method: "GET", headers: TMDB_CONFIG.headers }
    );
    if (!response.ok) throw new Error("Failed to fetch movie details");
    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const fetchMovieDetails = async (
  movieId: string
): Promise<MovieDetails> => {
  try {
    const response = await fetch(
      `${TMDB_CONFIG.BASE_URL}/movie/${movieId}?append_to_response=credits,videos`,
      {
        method: "GET",
        headers: TMDB_CONFIG.headers,
      }
    );
    if (!response.ok) throw new Error("Failed to fetch movie details");
    const data = await response.json();

    return data;
  } catch (error) {
    console.log("Error in fetchMovieDetails: ", error);
    throw error;
  }
};

export const fetchUpcomingMovies = async (): Promise<Movie[]> => {
  try {
    const response = await fetch(
      `${TMDB_CONFIG.BASE_URL}/movie/upcoming?page=1`,
      { method: "GET", headers: TMDB_CONFIG.headers }
    );
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    const data = await response.json();
    const today = new Date().toISOString().split('T')[0];
    return (data.results as Movie[]).filter((m) => m.release_date >= today);
  } catch (err: any) {
    if (err.name === "TypeError" && err.message.includes("Network request failed"))
      throw new Error("Network error: Please check your internet connection.");
    throw err instanceof Error ? err : new Error("Unexpected error occurred");
  }
};

export const fetchPopularShows = async (): Promise<TVShow[]> => {
  try {
    const response = await fetch(
      `${TMDB_CONFIG.BASE_URL}/tv/popular?page=1`,
      { method: "GET", headers: TMDB_CONFIG.headers }
    );
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    const data = await response.json();
    return data.results;
  } catch (err: any) {
    if (err.name === "TypeError" && err.message.includes("Network request failed"))
      throw new Error("Network error: Please check your internet connection.");
    throw err instanceof Error ? err : new Error("Unexpected error occurred");
  }
};

export const fetchTVShows = async ({ query }: { query: string }): Promise<TVShow[]> => {
  const endpoint = query
    ? `${TMDB_CONFIG.BASE_URL}/search/tv?query=${encodeURIComponent(query)}`
    : `${TMDB_CONFIG.BASE_URL}/tv/popular?sort_by=popularity.desc`;
  try {
    const response = await fetch(endpoint, { method: "GET", headers: TMDB_CONFIG.headers });
    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.status_message) errorMessage += `: ${errorData.status_message}`;
      } catch {}
      throw new Error(errorMessage);
    }
    const data = await response.json();
    return data.results;
  } catch (err: any) {
    if (err.name === "TypeError" && err.message.includes("Network request failed"))
      throw new Error("Network error: Please check your internet connection.");
    throw err instanceof Error ? err : new Error("Unexpected error occurred");
  }
};

export const fetchTVShowBasicDetails = async (showId: string): Promise<TVShowDetails> => {
  try {
    const response = await fetch(
      `${TMDB_CONFIG.BASE_URL}/tv/${showId}`,
      { method: "GET", headers: TMDB_CONFIG.headers }
    );
    if (!response.ok) throw new Error("Failed to fetch TV show details");
    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const fetchTVShowDetails = async (showId: string): Promise<TVShowDetails> => {
  try {
    const response = await fetch(
      `${TMDB_CONFIG.BASE_URL}/tv/${showId}?append_to_response=credits,videos`,
      { method: "GET", headers: TMDB_CONFIG.headers }
    );
    if (!response.ok) throw new Error("Failed to fetch TV show details");
    return await response.json();
  } catch (error) {
    console.log("Error in fetchTVShowDetails: ", error);
    throw error;
  }
};

export const fetchMovieWatchProviders = async (
  movieId: string,
  region = 'US'
): Promise<WatchProviders | null> => {
  try {
    const response = await fetch(
      `${TMDB_CONFIG.BASE_URL}/movie/${movieId}/watch/providers`,
      { method: 'GET', headers: TMDB_CONFIG.headers }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.results?.[region] ?? null;
  } catch {
    return null;
  }
};

export const fetchTVShowWatchProviders = async (
  showId: string,
  region = 'US'
): Promise<WatchProviders | null> => {
  try {
    const response = await fetch(
      `${TMDB_CONFIG.BASE_URL}/tv/${showId}/watch/providers`,
      { method: 'GET', headers: TMDB_CONFIG.headers }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.results?.[region] ?? null;
  } catch {
    return null;
  }
};

export const fetchMovieRecommendations = async (movieId: string): Promise<Movie[]> => {
  try {
    const response = await fetch(
      `${TMDB_CONFIG.BASE_URL}/movie/${movieId}/recommendations`,
      { method: 'GET', headers: TMDB_CONFIG.headers }
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.results ?? [];
  } catch {
    return [];
  }
};

export const fetchTVShowRecommendations = async (showId: string): Promise<TVShow[]> => {
  try {
    const response = await fetch(
      `${TMDB_CONFIG.BASE_URL}/tv/${showId}/recommendations`,
      { method: 'GET', headers: TMDB_CONFIG.headers }
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.results ?? [];
  } catch {
    return [];
  }
};

export const fetchMonthlyMovies = async ({ query }: { query: string }) => {
  const { firstDay, lastDay, currentYear } = getCurrentMonthRange();

  const endpoint = query
    ? `${TMDB_CONFIG.BASE_URL}/search/movie?query=${encodeURIComponent(
        query
      )}&page=1`
    : `${TMDB_CONFIG.BASE_URL}/discover/movie?primary_release_year=${currentYear}&primary_release_date.gte=${firstDay}&primary_release_date.lte=${lastDay}&page=1&sort_by=popularity.desc`;

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: TMDB_CONFIG.headers,
    });

    if (!response.ok) {
      console.log(
        "This is the key given:",
        process.env.EXPO_PUBLIC_MOVIE_API_KEY
      );
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.status_message) {
          errorMessage += `: ${errorData.status_message}`;
        }
      } catch {}
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const uniqueMovieIds = new Set();

    // Filter out movies with duplicate IDs
    const uniqueResults = data.results.filter((movie: any) => {
      if (movie.id && !uniqueMovieIds.has(movie.id)) {
        uniqueMovieIds.add(movie.id);
        return true;
      }
      return false;
    });

    // Map the unique TMDB data into your TrendingMovie interface
    return uniqueResults.map((movie: any) => ({
      movie_id: movie.id,
      title: movie.title,
      poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
      searchTerm: query || "",
      count: movie.vote_count,
    }));
  } catch (err: any) {
    if (
      err.name === "TypeError" &&
      err.message.includes("Network request failed")
    ) {
      throw new Error("Network error: Please check your internet connection.");
    }
    throw err instanceof Error ? err : new Error("Unexpected error occurred");
  }
};
