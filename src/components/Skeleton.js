import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import { colors, radius } from '../theme'

/** Pulsing placeholder — the RN stand-in for the CSS shimmer keyframe. */
export function Skeleton({ width = '100%', height = 12, style, round }) {
  const v = useRef(new Animated.Value(0.35)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [])

  return (
    <Animated.View
      style={[
        { width, height, backgroundColor: colors.silverBorder, borderRadius: round ? 999 : radius.sm, opacity: v },
        style,
      ]}
    />
  )
}

export function RowSkeleton() {
  return (
    <View style={styles.row}>
      <Skeleton width={36} height={36} style={{ borderRadius: radius.md }} />
      <View style={{ flex: 1, gap: 7 }}>
        <Skeleton width="55%" height={11} />
        <Skeleton width="35%" height={9} />
      </View>
      <Skeleton width={64} height={13} />
    </View>
  )
}

export function StatSkeleton({ height = 92 }) {
  return (
    <View style={[styles.card, { height }]}>
      <Skeleton width="40%" height={9} />
      <Skeleton width="65%" height={22} style={{ marginTop: 14 }} />
    </View>
  )
}

export function BudgetSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width="45%" height={13} />
      <Skeleton width="60%" height={9} style={{ marginTop: 8 }} />
      <Skeleton width="100%" height={8} style={{ marginTop: 16, borderRadius: 999 }} />
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.silverBorder,
  },
  card: {
    backgroundColor: colors.silverLight, borderWidth: 1, borderColor: colors.silverBorder,
    borderRadius: radius.lg, padding: 16, justifyContent: 'center',
  },
})
