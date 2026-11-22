import React from 'react'
import { StyleSheet, View } from 'react-native'
import { colors, radius } from '../theme'

export default function Card({ style, children, padded = true }) {
  return <View style={[styles.card, padded && styles.padded, style]}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.silverLight,
    borderWidth: 1,
    borderColor: colors.silverBorder,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  padded: { padding: 16 },
})
