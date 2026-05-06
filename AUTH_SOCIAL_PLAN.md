# Auth + Social Lite — Implementation Plan

## Context
Add optional Google/Apple sign-in (via Supabase) to Watchable. Signed-in users unlock three exclusive features: (1) a social layer — see friends' total watch time, genre breakdown, ratings, and comments per watched title; (2) achievements — a progression system of badges and streaks; (3) a Spotify Wrapped–style yearly recap. The local-first principle is preserved: Watch Later (saved lists) stays AsyncStorage-only. Watched data, ratings, and comments sync to Supabase when signed in so friends/achievements work.

Supabase is used (not Appwrite) because PostgreSQL + Row Level Security makes friend-visibility queries trivial. The existing Appwrite trending tracking will be migrated to Supabase.

---

## Backend: Supabase Schema

### Tables

**`profiles`** — public user data (extends `auth.users`)
```sql
id          uuid PRIMARY KEY REFERENCES auth.users
username    text UNIQUE NOT NULL
avatar_url  text
created_at  timestamptz DEFAULT now()
```

**`watched_movies`**
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id       uuid REFERENCES profiles NOT NULL
movie_id      integer NOT NULL
movie_title   text
poster_path   text
rating        integer CHECK (rating BETWEEN 0 AND 5)
comment       text
watched_at    timestamptz DEFAULT now()
UNIQUE (user_id, movie_id)
```

**`watched_shows`** — same shape with `show_id`, `show_name`

**`friendships`**
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
requester_id  uuid REFERENCES profiles NOT NULL
addressee_id  uuid REFERENCES profiles NOT NULL
status        text CHECK (status IN ('pending', 'accepted')) DEFAULT 'pending'
created_at    timestamptz DEFAULT now()
UNIQUE (requester_id, addressee_id)
```

**`user_achievements`**
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid REFERENCES profiles NOT NULL
achievement_id  text NOT NULL
unlocked_at     timestamptz DEFAULT now()
UNIQUE (user_id, achievement_id)
```

**`user_streaks`**
```sql
user_id           uuid PRIMARY KEY REFERENCES profiles
current_streak    integer DEFAULT 0
longest_streak    integer DEFAULT 0
last_watched_date date
```

**`movie_searches`** (migrated from Appwrite — trending tracking)
```sql
movie_id      integer PRIMARY KEY
search_count  integer DEFAULT 1
movie_title   text
poster_path   text
```

### RLS Policies

| Table | Read | Write |
|---|---|---|
| `profiles` | anyone | own row only |
| `watched_movies` / `watched_shows` | own rows + accepted friends' rows | own rows only |
| `friendships` | rows where requester or addressee = me | own rows |
| `user_achievements` | own rows + friends' | own rows |
| `user_streaks` | own row + friends' | own row |
| `movie_searches` | anyone | service role only |

Friends visibility RLS pattern:
```sql
user_id = auth.uid()
OR user_id IN (
  SELECT CASE
    WHEN requester_id = auth.uid() THEN addressee_id
    ELSE requester_id
  END
  FROM friendships
  WHERE (requester_id = auth.uid() OR addressee_id = auth.uid())
    AND status = 'accepted'
)
```

---

## Packages

```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage
# expo-web-browser already installed (used for OAuth redirect)
npm remove react-native-appwrite
```

Add to `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=your_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## New Files

| File | Purpose |
|---|---|
| `services/supabase.ts` | Supabase client |
| `services/sync.ts` | Sync AsyncStorage watched data ↔ Supabase |
| `services/achievements.ts` | Check + unlock achievements |
| `context/AuthContext.tsx` | Auth state, user object, sign-in/out |
| `app/auth.tsx` | Login screen (Google / Apple / Guest) |
| `app/(tabs)/profile.tsx` | Profile tab |
| `app/friends.tsx` | Friends list + add by username |
| `app/profile/[userId].tsx` | Friend's public profile |
| `app/recap.tsx` | Yearly recap — 10 animated slides |

## Modified Files

| File | Changes |
|---|---|
| `app/_layout.tsx` | Wrap with `AuthProvider`; add new routes |
| `app/(tabs)/_layout.tsx` | Add 5th Profile tab (`icons.user`) |
| `app/(tabs)/watched.tsx` | Trigger sync + achievement check |
| `app/movies/[id].tsx` | Trigger sync + achievement check |
| `app/shows/[id].tsx` | Trigger sync + achievement check |
| `services/appwrite.ts` | Replace with Supabase trending calls |

---

## Phase 1 — Foundation

**`services/supabase.ts`**
```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

**`context/AuthContext.tsx`**
```typescript
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
}
```
- `supabase.auth.onAuthStateChange` keeps `user` in sync
- On first sign-in: upsert row in `profiles` (username = email prefix)

**Migrate Appwrite → Supabase**
- `updateSearchCount(movieId)` → upsert `movie_searches`
- `getTrendingMovies()` → select top 5 by `search_count`

---

## Phase 2 — Auth UI

**`app/auth.tsx`**
- Dark screen (`bg-primary`), app logo at top
- "Continue with Google" — `supabase.auth.signInWithOAuth({ provider: 'google' })` + `WebBrowser.openAuthSessionAsync`
- "Continue with Apple" — same with `provider: 'apple'`
- "Continue as Guest" — navigate back

**`app/(tabs)/profile.tsx`**
- Logged out: sign-in button → `app/auth.tsx`
- Logged in: avatar + username, stats row (movies · shows · hours), Friends button, Yearly Recap button, achievements grid, Sign Out

---

## Phase 3 — Sync

**`services/sync.ts`**
- `syncWatchedToCloud(userId)` — called once after login; reads AsyncStorage, upserts all watched rows to Supabase
- `pushWatchedMovie(userId, movie, rating, comment)` — upsert on mark watched
- `removeWatchedMovie(userId, movieId)` — delete on unwatch
- Same for shows

AsyncStorage = source of truth for local state. Supabase = mirror for social. App works fully offline.

---

## Phase 4 — Achievements

**20 badges:**

| ID | Label | Trigger |
|---|---|---|
| `first_watch` | First Watch | Watch any movie |
| `watch_10` | Devoted Viewer | Watch 10 movies |
| `watch_50` | Film Buff | Watch 50 movies |
| `show_5` | Binge Watcher | Watch 5 shows |
| `completionist` | Completionist | 25 movies + 10 shows |
| `first_rating` | Opinionated | Rate any item |
| `critic_10` | The Critic | Rate 10 items |
| `harsh_critic` | Harsh Critic | Five 1-star ratings |
| `fanatic` | Fanatic | Five 5-star ratings |
| `first_note` | Thoughtful | Write first comment |
| `notes_10` | Film Journaler | Write 10 comments |
| `streak_3` | Consistent | 3-day watch streak |
| `streak_7` | Dedicated | 7-day watch streak |
| `streak_30` | Obsessed | 30-day watch streak |
| `horror_fan` | Horror Fan | Watch 5 horror titles |
| `sci_fi_explorer` | Sci-Fi Explorer | Watch 5 sci-fi titles |
| `comedy_buff` | Comedy Buff | Watch 5 comedies |
| `first_friend` | Social | Add first friend |
| `five_friends` | Social Butterfly | Have 5 friends |
| `night_owl` | Night Owl | Mark 5 items watched after midnight |

**Streak logic (on each watch event):**
- Same day → no change
- Yesterday → increment `current_streak`, update date
- Older → reset `current_streak` to 1
- Always: `longest_streak = max(longest_streak, current_streak)`

---

## Phase 5 — Friends

**`app/friends.tsx`**
- Search by username → show result → send friend request
- Pending requests section (accept/decline)
- Accepted friends list → tap → `app/profile/[userId].tsx`

**`app/profile/[userId].tsx`**
- Avatar + username
- Stats: movies watched, shows watched, total hours, top genre
- Unlocked achievements
- Watched list with poster, rating, comment

---

## Phase 6 — Yearly Recap

**`app/recap.tsx`** — 10 full-screen animated slides (reanimated `FadeInUp` / `ZoomIn`):

| # | Slide |
|---|---|
| 1 | "Your [year] in Film" intro |
| 2 | Movies watched count |
| 3 | TV shows watched count |
| 4 | Total hours |
| 5 | Top genre |
| 6 | Best rated movie |
| 7 | Best rated show |
| 8 | Most active month |
| 9 | Longest streak |
| 10 | Share card (expo-sharing) |

---

## Implementation Order

1. Create Supabase project + run schema SQL
2. `services/supabase.ts`
3. `context/AuthContext.tsx`
4. Migrate `services/appwrite.ts` → Supabase
5. Update `app/_layout.tsx` (AuthProvider + new routes)
6. `app/auth.tsx`
7. `app/(tabs)/profile.tsx` (shell)
8. Add Profile tab to `app/(tabs)/_layout.tsx`
9. `services/sync.ts`
10. Wire sync into `movies/[id].tsx` + `shows/[id].tsx`
11. `services/achievements.ts`
12. Wire achievements into watched handlers + profile grid
13. `app/friends.tsx`
14. `app/profile/[userId].tsx`
15. `app/recap.tsx`
