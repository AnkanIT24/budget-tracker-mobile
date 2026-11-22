import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors, radius } from '../theme'

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <View style={styles.wrap}>
      {Icon && (
        <View style={styles.iconWrap}>
          <Icon size={22} color={colors.gray500} />
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
      {!!description && <Text style={styles.description}>{description}</Text>}
      {action}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 46, paddingHorizontal: 28, gap: 6 },
  iconWrap: {
    width: 48, height: 48, borderRadius: radius.lg, backgroundColor: colors.silver,
    borderWidth: 1, borderColor: colors.silverBorder,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  title: { color: colors.white, fontSize: 15, fontWeight: '600' },
  description: { color: colors.gray500, fontSize: 13, textAlign: 'center', lineHeight: 19, marginTop: 2 },
})
