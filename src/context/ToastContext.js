import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CheckCircle2, XCircle, Info } from 'lucide-react-native'
import { colors, radius } from '../theme'

// Replacement for `sonner` on web. Same call shape: toast.success('...') etc.
const ToastContext = createContext(null)

const ICONS = {
  success: { Icon: CheckCircle2, color: colors.moss },
  error:   { Icon: XCircle,      color: colors.red400 },
  info:    { Icon: Info,         color: colors.gray400 },
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const anim = useRef(new Animated.Value(0)).current
  const timer = useRef(null)
  const insets = useSafeAreaInsets()

  const hide = useCallback(() => {
    Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true })
      .start(() => setToast(null))
  }, [anim])

  const show = useCallback((message, type = 'info') => {
    if (timer.current) clearTimeout(timer.current)
    setToast({ message, type })
    anim.setValue(0)
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 220 }).start()
    timer.current = setTimeout(hide, 2600)
  }, [anim, hide])

  useEffect(() => () => timer.current && clearTimeout(timer.current), [])

  const api = {
    success: (m) => show(m, 'success'),
    error:   (m) => show(m, 'error'),
    info:    (m) => show(m, 'info'),
  }

  const { Icon, color } = ICONS[toast?.type || 'info']

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.wrap,
            { top: insets.top + 8 },
            {
              opacity: anim,
              transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }],
            },
          ]}
        >
          <View style={styles.toast}>
            <Icon size={16} color={color} />
            <Text style={styles.text} numberOfLines={2}>{toast.message}</Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, zIndex: 100 },
  toast: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.silverLight,
    borderWidth: 1, borderColor: colors.silverBorder,
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  text: { color: colors.white, fontSize: 14, flex: 1 },
})
