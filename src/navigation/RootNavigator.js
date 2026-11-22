import React from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { NavigationContainer, DarkTheme } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { ArrowLeftRight, LayoutDashboard, Settings, Tag, Target } from 'lucide-react-native'
import { colors } from '../theme'
import { useAuth } from '../context/AuthContext'
import LoginScreen from '../screens/LoginScreen'
import RegisterScreen from '../screens/RegisterScreen'
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen'
import ResetPasswordScreen from '../screens/ResetPasswordScreen'
import DashboardScreen from '../screens/DashboardScreen'
import TransactionsScreen from '../screens/TransactionsScreen'
import BudgetsScreen from '../screens/BudgetsScreen'
import CategoriesScreen from '../screens/CategoriesScreen'
import SettingsScreen from '../screens/SettingsScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

// The web app's left sidebar becomes a bottom tab bar — same five destinations.
const TABS = [
  { name: 'Dashboard',    component: DashboardScreen,    Icon: LayoutDashboard },
  { name: 'Transactions', component: TransactionsScreen, Icon: ArrowLeftRight },
  { name: 'Budgets',      component: BudgetsScreen,      Icon: Target },
  { name: 'Categories',   component: CategoriesScreen,   Icon: Tag },
  { name: 'Settings',     component: SettingsScreen,     Icon: Settings },
]

function AppTabs() {
  // Android phones with gesture navigation reserve space at the bottom for the
  // system gesture pill. Hardcoding the tab bar height meant the pill sat on top
  // of the tab row, so taps near the bottom edge went to the system, not the app.
  // Reading the real inset makes the bar sit above it on every device.
  const insets = useSafeAreaInsets()
  const bottomInset = Math.max(insets.bottom, 8)

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.moss,
        tabBarInactiveTintColor: colors.gray500,
        tabBarStyle: {
          backgroundColor: colors.silver,
          borderTopColor: colors.silverBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 56 + bottomInset,
          paddingTop: 6,
          paddingBottom: bottomInset,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      {TABS.map(({ name, component, Icon }) => (
        <Tab.Screen
          key={name}
          name={name}
          component={component}
          options={{ tabBarIcon: ({ color }) => <Icon size={20} color={color} /> }}
        />
      ))}
    </Tab.Navigator>
  )
}

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.silver,
    card: colors.silver,
    border: colors.silverBorder,
    primary: colors.moss,
    text: colors.white,
  },
}

export default function RootNavigator() {
  const { user, booting } = useAuth()

  if (booting) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.moss} />
      </View>
    )
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {user ? (
          <Stack.Screen name="App" component={AppTabs} />
        ) : (
          <Stack.Group screenOptions={{ animation: 'slide_from_right' }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.silver },
})
