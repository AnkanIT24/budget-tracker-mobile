import React from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { colors, radius } from '../theme'
import { PressableScale } from './Motion'

/** variant: 'primary' | 'ghost' | 'danger' */
export default function Button({
  title, onPress, variant = 'primary', loading, disabled, icon, style, compact,
}) {
  const isDisabled = disabled || loading
  const v = styles[variant]
  const textStyle = textStyles[variant]

  return (
    <PressableScale onPress={onPress} disabled={isDisabled} style={style}>
      <View style={[styles.base, v, compact && styles.compact, isDisabled && styles.disabled]}>
        {loading ? (
          <ActivityIndicator size="small" color={variant === 'primary' ? colors.silver : colors.gray400} />
        ) : (
          <>
            {icon}
            <Text style={[styles.text, textStyle, compact && { fontSize: 13 }]}>{title}</Text>
          </>
        )}
      </View>
    </PressableScale>
  )
}

const styles = StyleSheet.create({
  base: {
    minHeight: 46, borderRadius: radius.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingHorizontal: 16,
  },
  compact: { minHeight: 38, paddingHorizontal: 12, borderRadius: radius.sm },
  disabled: { opacity: 0.5 },
  text: { fontSize: 15, fontWeight: '600' },
  primary: { backgroundColor: colors.moss },
  ghost:   { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.silverBorder },
  danger:  { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.red900 },
})

const textStyles = StyleSheet.create({
  primary: { color: colors.silver },
  ghost:   { color: colors.gray400 },
  danger:  { color: colors.red400 },
})
