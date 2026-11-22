import React, { useState } from 'react'
import { Platform, Pressable, StyleSheet, Text, View, Modal } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Calendar } from 'lucide-react-native'
import { colors, radius } from '../theme'
import { dateToISO, isoToDate, prettyDate } from '../utils/format'

/** Replacement for <input type="date">. Value in/out is a 'YYYY-MM-DD' string. */
export default function DateField({ label, value, onChange, error, style }) {
  const [open, setOpen] = useState(false)
  const [temp, setTemp] = useState(() => isoToDate(value))

  const openPicker = () => { setTemp(isoToDate(value)); setOpen(true) }

  const onAndroidChange = (event, date) => {
    setOpen(false)
    if (event.type === 'set' && date) onChange(dateToISO(date))
  }

  return (
    <View style={style}>
      {!!label && <Text style={styles.label}>{label}</Text>}

      <Pressable onPress={openPicker} style={[styles.field, !!error && styles.fieldError]}>
        <Text style={styles.value}>{value ? prettyDate(value) : 'Pick a date'}</Text>
        <Calendar size={16} color={colors.gray500} />
      </Pressable>

      {!!error && <Text style={styles.error}>{error}</Text>}

      {open && Platform.OS === 'android' && (
        <DateTimePicker value={temp} mode="date" display="calendar" onChange={onAndroidChange} />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            <DateTimePicker
              value={temp}
              mode="date"
              display="spinner"
              themeVariant="dark"
              onChange={(_, d) => d && setTemp(d)}
              style={{ alignSelf: 'stretch' }}
            />
            <View style={styles.sheetActions}>
              <Pressable onPress={() => setOpen(false)} style={styles.sheetBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => { onChange(dateToISO(temp)); setOpen(false) }}
                style={[styles.sheetBtn, { backgroundColor: colors.moss }]}
              >
                <Text style={styles.confirmText}>Use this date</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  label: { color: colors.gray400, fontSize: 12, fontWeight: '600', marginBottom: 6 },
  field: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.silver, borderWidth: 1, borderColor: colors.silverBorder,
    borderRadius: radius.md, paddingHorizontal: 14, minHeight: 46,
  },
  fieldError: { borderColor: colors.red500 },
  value: { color: colors.white, fontSize: 15 },
  error: { color: colors.red400, fontSize: 12, marginTop: 5 },
  backdrop: { flex: 1, backgroundColor: colors.backdrop },
  sheet: {
    backgroundColor: colors.silverLight, paddingTop: 8, paddingBottom: 28, paddingHorizontal: 16,
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    borderTopWidth: 1, borderColor: colors.silverBorder,
  },
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  sheetBtn: {
    flex: 1, minHeight: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.silverBorder,
  },
  cancelText: { color: colors.gray400, fontSize: 15, fontWeight: '600' },
  confirmText: { color: colors.silver, fontSize: 15, fontWeight: '600' },
})
