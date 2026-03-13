# 🎬 Watchable

A sleek React Native movie app built with Expo. Browse trending and popular films, search by title or genre, save your favourites, and track your personal watch history with star ratings.

---

## ✨ Features

- 🏠 **Home** — Trending movies carousel + full grid with genre filter chips
- 🔍 **Search** — Real-time movie search powered by TMDB
- 🔖 **Saved** — Bookmarked movies with one-tap remove
- 👁️ **Watched** — Personal watch history with 1–5 ⭐ ratings and total watch-time stats
- 🎥 **Movie Detail** — Full info, YouTube trailer, cast list, director, and save/watched actions

---

## 🛠️ Tech Stack

| Layer | Library |
|---|---|
| Framework | Expo SDK 54 / React Native 0.81 |
| Routing | Expo Router (file-based) |
| Styling | NativeWind v4 (Tailwind CSS) |
| Data | TMDB API (Bearer token) |
| Persistence | AsyncStorage |
| Gestures | react-native-gesture-handler v2 |
| Animations | react-native-reanimated v4 |
| Trailers | react-native-youtube-iframe |

---

## 🚀 Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the root:

```
EXPO_PUBLIC_MOVIE_API_KEY=your_tmdb_bearer_token
```

Get a free API key at [themoviedb.org](https://www.themoviedb.org/settings/api).

### 3. Run the app

```bash
npx expo start
```

Press `a` for Android emulator, `i` for iOS simulator, or scan the QR code with Expo Go.

---

## 📦 Building for Device

**Preview APK** — install directly on Android:
```bash
eas build -p android --profile preview
```

**Production AAB** — for Google Play Store:
```bash
eas build -p android
```

> Requires an [Expo account](https://expo.dev) and EAS CLI: `npm install -g eas-cli`

---

## 📁 Project Structure

```
app/
  (tabs)/
    index.tsx       # 🏠 Home screen
    search.tsx      # 🔍 Search screen
    saved.tsx       # 🔖 Saved movies
    watched.tsx     # 👁️ Watch history & ratings
  movies/
    [id].tsx        # 🎥 Movie detail screen
components/
  SearchBar.tsx
  MovieCard.tsx
  TrendingCard.tsx
services/
  api.ts            # TMDB API calls
  useFetch.ts       # Generic data-fetching hook
constants/
  icons.ts
  images.ts
```
