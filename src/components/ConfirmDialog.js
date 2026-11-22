import React from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { AlertTriangle } from 'lucide-react-native'
import { colors, radius } from '../theme'
import Button from './Button'

export default function ConfirmDialog({
  open, onClose, onConfirm, title, message, confirmLabel = 'Delete', loading,
}) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.dialog}>
          <View style={styles.iconWrap}>
            <AlertTriangle size={19} color={colors.red400} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Button title="Cancel" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
            <Button title={confirmLabel} variant="danger" onPress={onConfirm} loading={loading} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backdrop, padding: 28 },
  dialog: {
    width: '100%', maxWidth: 380,
    backgroundColor: colors.silverLight, borderWidth: 1, borderColor: colors.silverBorder,
    borderRadius: radius.xl, padding: 22,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.redFaint,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  title: { color: colors.white, fontSize: 17, fontWeight: '600' },
  message: { color: colors.gray400, fontSize: 14, lineHeight: 20, marginTop: 7 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 22 },
})
