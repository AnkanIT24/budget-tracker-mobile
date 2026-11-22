# BudgetTracker — React Native (Expo)

The mobile frontend for the same Spring Boot API your Vite app talks to. Nothing on the backend changes: same endpoints, same JWT, same payloads.

The dashboard now includes the **AI Budget Saver** chat panel, matching the web dashboard. It sends `POST /api/ai/chat` with `{ "message": "..." }` and reads the `{ "response": "..." }` reply. The chat request has a longer timeout for AI generation, and public password-reset requests do not trigger the session-expiry handler.

---

## Run it

```bash
# 1. Scaffold a fresh Expo app (gets you the correct SDK + node_modules)
npx create-expo-app budget-tracker-mobile --template blank
cd budget-tracker-mobile

# 2. Drop the files from this folder in, overwriting App.js / app.json / babel.config.js

# 3. Install the dependencies. Use `expo install`, not `npm install` —
#    it resolves versions that match your installed SDK.
npx expo install \
  @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs \
  react-native-screens react-native-safe-area-context \
  @react-native-async-storage/async-storage @react-native-community/datetimepicker \
  react-native-svg expo-status-bar

npm install axios react-hook-form @hookform/resolvers zod lucide-react-native

# 4. Point it at your API
cp .env.example .env      # then edit EXPO_PUBLIC_API_URL

# 5. Go
npx expo start
```

The `package.json` here is a reference for *which* packages you need. Let `expo install` pin the versions — hand-pinned RN versions are the #1 cause of "it won't build."

### Getting the API URL right

This is where most first runs fail. `localhost` inside the app means *the phone*, not your laptop.

| Where you're running | `EXPO_PUBLIC_API_URL` |
|---|---|
| Deployed backend | `https://your-backend.onrender.com/api` |
| Physical phone + local Spring Boot | `http://192.168.x.x:8080/api` (your laptop's LAN IP) |
| Android emulator + local Spring Boot | `http://10.0.2.2:8080/api` |
| iOS simulator + local Spring Boot | `http://localhost:8080/api` |

For a LAN IP you also need Spring Boot bound to `0.0.0.0` and your firewall open on 8080.

Android blocks plaintext HTTP by default in release builds — fine in Expo Go and dev, but ship against HTTPS.

---

## What changed from the web app, and why

| Web | Mobile | Note |
|---|---|---|
| `react-router-dom` | React Navigation | Bottom tabs replace the sidebar; auth is a stack swap, not a `<ProtectedRoute>` |
| Tailwind classes | `StyleSheet` + `src/theme.js` | Your exact palette, ported as tokens |
| `framer-motion` | RN `Animated` (`src/components/Motion.js`) | No extra dep, no babel plugin, works in Expo Go |
| `localStorage` | `AsyncStorage` | **Async** — this is the one real architectural change, see below |
| `sonner` | `ToastContext` | Same call shape: `toast.success(...)` |
| `lucide-react` | `lucide-react-native` | Identical icon names |
| `<select>` | `Select.js` | Pressable field + bottom sheet; native pickers differ too much across platforms |
| `<input type="date">` | `DateField.js` | Android dialog / iOS spinner sheet, ISO string in and out |
| `window.location.href = '/login'` | `setUnauthorizedHandler` callback | No `window` in RN |
| `toLocaleString('en-IN')` | hand-written grouping | Hermes' Intl is inconsistent on Android; `₹1,00,000` would silently become `₹100,000` |

`react-hook-form` + `zod` carried over unchanged — your schemas are copied verbatim, just wired through `<Controller>` instead of `{...register()}`.

### The async storage gotcha

Your web `AuthContext` did this:

```js
const [user, setUser] = useState(() => authService.getUser())   // sync
```

AsyncStorage can't do that. If you keep the same shape, every cold start flashes the login screen for a frame before the session loads. So there's now a `booting` flag and `RootNavigator` renders a spinner until the read resolves. Same for the axios request interceptor — it's `async` now, because reading the token returns a promise.

### Security note

The JWT sits in AsyncStorage, which mirrors what the web app did but is **not encrypted** — on a rooted/jailbroken device it's readable. Before you ship, swap `src/services/storage.js` to `expo-secure-store`. The API is already async, so it's a three-line change.

---

## Design decisions worth reviewing

**Dashboard leads with balance.** The web version put Income / Expenses / Balance in three equal columns. On a phone that's three full-width cards and a lot of scrolling for the number you actually opened the app to see. Balance is now the hero; income and expenses sit below in a 2-up row.

**Rows are tappable.** Web relied on hover-revealed edit/delete icons. Icons are always visible here, and tapping anywhere on a transaction row opens the edit sheet.

**Modals became bottom sheets.** Centered dialogs fight the keyboard on a phone. `ConfirmDialog` stayed centered — it's short and destructive, so it should feel like an interruption.

**Budgets hides taken categories.** The "set budget" picker now only lists expense categories without a budget this month, so you can't create a duplicate the backend would reject.

---

## Known loose ends

- `authService.changePassword` uses **PUT** `/auth/change-password`, matching your working web client. Your backend README lists it as POST. Worth confirming which your controller actually maps.
- No offline cache. Every screen refetches on focus and supports pull-to-refresh. If you want offline reads, TanStack Query is the natural next step and would replace most of the `useState` + `useFocusEffect` loading code.
- No app icon or splash image — `app.json` has the background colour set but no assets.
- Year filter is hardcoded to 2024–2027, same as the web app. Worth deriving from the data.

---

## Structure

```
App.js                      providers + navigator
src/
├── theme.js                colors, radii, type scale
├── utils/format.js         ₹ formatting, date helpers
├── services/
│   ├── api.js              axios instance, interceptors, all four services
│   └── storage.js          AsyncStorage session
├── context/
│   ├── AuthContext.js      session state + boot gate
│   └── ToastContext.js     sonner replacement
├── navigation/
│   └── RootNavigator.js    auth stack vs tab navigator
├── components/             Card, Button, Field, Select, DateField, Sheet,
│                           ConfirmDialog, EmptyState, ProgressBar, Skeleton,
│                           IconButton, ScreenHeader, Motion
└── screens/                Login, Register, Dashboard, Transactions,
                            Budgets, Categories, Settings
```
