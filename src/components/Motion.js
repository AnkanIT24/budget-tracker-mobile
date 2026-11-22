import React, { useEffect, useRef } from 'react'
import { Animated, Pressable } from 'react-native'

/**
 * framer-motion replacements built on React Native's core Animated API.
 * No extra dependency, no babel plugin, works in Expo Go out of the box.
 */

/** whileTap={{ scale: 0.95 }} */
export function PressableScale({ onPress, onLongPress, style, children, scaleTo = 0.96, disabled, hitSlop }) {
  const scale = useRef(new Animated.Value(1)).current
  const to = (v) =>
    Animated.spring(scale, { toValue: v, useNativeDriver: true, damping: 20, stiffness: 420 }).start()

  return (
    <Pressable
      onPressIn={() => !disabled && to(scaleTo)}
      onPressOut={() => to(1)}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      hitSlop={hitSlop}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  )
}

/** initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} — with stagger via `delay` */
export function FadeInView({ delay = 0, offset = 14, style, children }) {
  const v = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 340, delay, useNativeDriver: true }).start()
  }, [])

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v,
          transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [offset, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  )
}

/** Stagger helper — matches staggerChildren: 0.06 from PageWrapper.jsx */
export const stagger = (index, step = 60, cap = 8) => Math.min(index, cap) * step
