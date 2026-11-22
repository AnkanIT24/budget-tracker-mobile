import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import { colors } from '../theme'

/** Animated width bar — the framer-motion `animate={{ width: '%' }}` equivalent. */
export default function ProgressBar({ percent = 0, color = colors.moss, height = 8 }) {
  const w = useRef(new Animated.Value(0)).current
  const clamped = Math.max(0, Math.min(percent, 100))

  useEffect(() => {
    Animated.timing(w, {
      toValue: clamped,
      duration: 850,
      useNativeDriver: false, // width can't run on the native driver
    }).start()
  }, [clamped])

  const width = w.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] })

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <Animated.View style={{ width, height: '100%', backgroundColor: color, borderRadius: height / 2 }} />
    </View>
  )
}

const styles = StyleSheet.create({
  track: { backgroundColor: colors.silverBorder, overflow: 'hidden', width: '100%' },
})
