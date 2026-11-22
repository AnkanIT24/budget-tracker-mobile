import React, { useState } from 'react'
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { Check, ChevronDown } from 'lucide-react-native'
import { colors, radius } from '../theme'

/**
 * Replacement for <select>. A native picker behaves very differently across
 * iOS/Android, so this is a pressable field + a bottom sheet list. One
 * component, identical on both platforms, and it can be styled to match.
 *
 * options: [{ label, value }]
 */
export default function Select({
  label, value, options = [], onChange, placeholder = 'Select...', error, hint, style, compact, title,
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => String(o.value) === String(value))

  return (
    <View style={style}>
      {!!label && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {!!hint && <Text style={styles.hint}>{hint}</Text>}
        </View>
      )}

      <Pressable
        onPress={() => options.length > 0 && setOpen(true)}
        style={[styles.field, compact && styles.fieldCompact, !!error && styles.fieldError]}
      >
        <Text
          numberOfLines={1}
          style={[
            compact ? styles.valueCompact : styles.value,
            !selected && { color: colors.gray500 },
          ]}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <ChevronDown size={compact ? 13 : 16} color={colors.gray500} />
      </Pressable>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>{title || label || 'Select'}</Text>
          <FlatList
            data={options}
            keyExtractor={(item) => String(item.value)}
            style={{ maxHeight: 380 }}
            renderItem={({ item }) => {
              const active = String(item.value) === String(value)
              return (
                <Pressable
                  onPress={() => { onChange(item.value); setOpen(false) }}
                  style={({ pressed }) => [styles.option, pressed && { backgroundColor: colors.mossTint }]}
                >
                  <Text style={[styles.optionText, active && { color: colors.moss, fontWeight: '600' }]}>
                    {item.label}
                  </Text>
                  {active && <Check size={16} color={colors.moss} />}
                </Pressable>
              )
            }}
          />
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  label: { color: colors.gray400, fontSize: 12, fontWeight: '600' },
  hint: { color: colors.yellow400, fontSize: 11 },
  field: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    backgroundColor: colors.silver, borderWidth: 1, borderColor: colors.silverBorder,
    borderRadius: radius.md, paddingHorizontal: 14, minHeight: 46,
  },
  fieldCompact: { minHeight: 36, paddingHorizontal: 10, borderRadius: radius.sm },
  fieldError: { borderColor: colors.red500 },
  value: { color: colors.white, fontSize: 15, flex: 1 },
  valueCompact: { color: colors.white, fontSize: 12, flex: 1 },
  error: { color: colors.red400, fontSize: 12, marginTop: 5 },

  backdrop: { flex: 1, backgroundColor: colors.backdrop },
  sheet: {
    backgroundColor: colors.silverLight,
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    borderTopWidth: 1, borderColor: colors.silverBorder,
    paddingBottom: 28, paddingTop: 10,
  },
  handle: {
    width: 38, height: 4, borderRadius: 999, backgroundColor: colors.silverBorder,
    alignSelf: 'center', marginBottom: 12,
  },
  sheetTitle: {
    color: colors.white, fontSize: 15, fontWeight: '600',
    paddingHorizontal: 20, paddingBottom: 10,
  },
  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.silverBorder,
  },
  optionText: { color: colors.gray300, fontSize: 15 },
})
