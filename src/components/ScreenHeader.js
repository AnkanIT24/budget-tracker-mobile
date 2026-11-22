import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme'

export default function ScreenHeader({ title, subtitle, right }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {!!right && <View style={styles.right}>{right}</View>}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { color: colors.white, fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
  subtitle: { color: colors.gray500, fontSize: 13, marginTop: 2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
})
