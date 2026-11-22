import AsyncStorage from '@react-native-async-storage/async-storage'

const TOKEN_KEY = 'budget_token'
const USER_KEY  = 'budget_user'

// NOTE: the web app used localStorage. AsyncStorage is the direct equivalent,
// but it is NOT encrypted. For a production release, swap the token to
// expo-secure-store (Keychain / Keystore) — same API shape, just async.
export const getToken = () => AsyncStorage.getItem(TOKEN_KEY)

export const saveSession = async (res) => {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, res.token],
    [USER_KEY, JSON.stringify({ fullName: res.fullName, email: res.email })],
  ])
}

export const clearSession = () => AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY])

export const getUser = async () => {
  const raw = await AsyncStorage.getItem(USER_KEY)
  return raw ? JSON.parse(raw) : null
}
