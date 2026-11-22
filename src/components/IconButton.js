import React from 'react'
import { StyleSheet, View } from 'react-native'
import { colors, radius } from '../theme'
import { PressableScale } from './Motion'

export default function IconButton({ children, onPress, active, tone = 'default', size = 38 }) {
  return (
    <PressableScale onPress={onPress} hitSlop={6}>
      <View
        style={[
          styles.base,
          { width: size, height: size },
          active && styles.active,
          tone === 'danger' && styles.danger,
        ]}
      >
        {children}
      </View>
    </PressableScale>
  )
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center', justifyContent: 'center',
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.silverBorder,
    backgroundColor: colors.silverLight,
  },
  active: { borderColor: colors.moss, backgroundColor: colors.mossFaint },
  danger: { borderColor: colors.red900, backgroundColor: 'transparent' },
})
