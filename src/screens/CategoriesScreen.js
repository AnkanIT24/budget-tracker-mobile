import React, { useCallback, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react-native'
import { colors, radius } from '../theme'
import { categoryService, errMsg } from '../services/api'
import { useToast } from '../context/ToastContext'
import Card from '../components/Card'
import ConfirmDialog from '../components/ConfirmDialog'
import ScreenHeader from '../components/ScreenHeader'
import { RowSkeleton } from '../components/Skeleton'
import { FadeInView, PressableScale, stagger } from '../components/Motion'

function CategoryRow({ cat, onDelete, onRenamed, first }) {
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(cat.name)
  const [saving, setSaving] = useState(false)

  const income = cat.type === 'INCOME'

  const cancel = () => { setEditing(false); setName(cat.name) }

  const save = async () => {
    const trimmed = name.trim()
    if (!trimmed || trimmed === cat.name) return cancel()
    setSaving(true)
    try {
      await categoryService.update(cat.id, { name: trimmed, type: cat.type })
      toast.success('Category renamed')
      setEditing(false)
      onRenamed()
    } catch (err) {
      toast.error(errMsg(err, 'Could not rename that category'))
      setName(cat.name)
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={[styles.row, !first && styles.divider]}>
      <View style={[styles.avatar, income ? styles.badgeMoss : styles.badgeRed]}>
        <Text style={[styles.avatarText, { color: income ? colors.moss : colors.red400 }]}>
          {cat.name[0]?.toUpperCase()}
        </Text>
      </View>

      {editing ? (
        <TextInput
          value={name}
          onChangeText={setName}
          autoFocus
          onSubmitEditing={save}
          returnKeyType="done"
          style={styles.editInput}
          placeholderTextColor={colors.gray500}
        />
      ) : (
        <Text style={styles.rowName} numberOfLines={1}>{cat.name}</Text>
      )}

      <View style={styles.rowActions}>
        {editing ? (
          <>
            <PressableScale onPress={save} disabled={saving} hitSlop={8}>
              <Check size={17} color={colors.moss} />
            </PressableScale>
            <PressableScale onPress={cancel} hitSlop={8}>
              <X size={17} color={colors.gray500} />
            </PressableScale>
          </>
        ) : (
          <>
            <PressableScale onPress={() => setEditing(true)} hitSlop={8}>
              <Pencil size={15} color={colors.gray500} />
            </PressableScale>
            <PressableScale onPress={() => onDelete(cat)} hitSlop={8}>
              <Trash2 size={15} color={colors.gray500} />
            </PressableScale>
          </>
        )}
      </View>
    </View>
  )
}

function AddRow({ type, onAdded }) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setSaving(true)
    try {
      await categoryService.create({ name: trimmed, type })
      toast.success('Category added')
      setName('')
      setOpen(false)
      onAdded()
    } catch (err) {
      toast.error(errMsg(err, 'Could not create that category'))
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <Pressable onPress={() => setOpen(true)} style={styles.addTrigger} hitSlop={6}>
        <Plus size={15} color={colors.gray500} />
        <Text style={styles.addTriggerText}>Add {type.toLowerCase()} category</Text>
      </Pressable>
    )
  }

  return (
    <View style={styles.addRow}>
      <TextInput
        value={name}
        onChangeText={setName}
        autoFocus
        placeholder="Category name"
        placeholderTextColor={colors.gray500}
        onSubmitEditing={save}
        returnKeyType="done"
        style={[styles.editInput, styles.addInput]}
      />
      <PressableScale onPress={save} disabled={saving}>
        <View style={styles.addConfirm}><Check size={16} color={colors.silver} /></View>
      </PressableScale>
      <PressableScale onPress={() => { setOpen(false); setName('') }}>
        <View style={styles.addCancel}><X size={16} color={colors.gray400} /></View>
      </PressableScale>
    </View>
  )
}

// Defined at module scope on purpose. If this lived inside CategoriesScreen it
// would be a new component type on every render, and React would unmount and
// remount the whole subtree — killing focus inside the rename/add inputs.
function Section({ title, items, type, dotColor, delay, onDelete, onReload }) {
  return (
    <FadeInView delay={delay}>
      <Card padded={false}>
        <View style={styles.sectionHeader}>
          <View style={[styles.dot, { backgroundColor: dotColor }]} />
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionCount}>{items.length}</Text>
        </View>

        {items.length === 0 ? (
          <Text style={styles.placeholder}>No {type.toLowerCase()} categories yet</Text>
        ) : (
          items.map((cat, i) => (
            <CategoryRow key={cat.id} cat={cat} first={i === 0} onDelete={onDelete} onRenamed={onReload} />
          ))
        )}

        <AddRow type={type} onAdded={onReload} />
      </Card>
    </FadeInView>
  )
}

export default function CategoriesScreen() {
  const toast = useToast()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async (isRefresh) => {
    if (!isRefresh) setLoading(true)
    try {
      setCategories(await categoryService.getAll())
    } catch (err) {
      toast.error(errMsg(err, 'Could not load categories'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const onDelete = async () => {
    setDeleting(true)
    try {
      await categoryService.delete(deleteTarget.id)
      toast.success('Category deleted')
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast.error(errMsg(err, 'Could not delete that category'))
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  const income = categories.filter((c) => c.type === 'INCOME')
  const expense = categories.filter((c) => c.type === 'EXPENSE')

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(true) }}
            tintColor={colors.moss}
            colors={[colors.moss]}
          />
        }
      >
        <ScreenHeader
          title="Categories"
          subtitle={`${income.length} income · ${expense.length} expense`}
        />

        {loading ? (
          <Card padded={false}>{[0, 1, 2].map((i) => <RowSkeleton key={i} />)}</Card>
        ) : (
          <>
            <Section
              title="Income" items={income} type="INCOME" dotColor={colors.moss} delay={0}
              onDelete={setDeleteTarget} onReload={load}
            />
            <Section
              title="Expense" items={expense} type="EXPENSE" dotColor={colors.red500} delay={80}
              onDelete={setDeleteTarget} onReload={load}
            />
          </>
        )}
      </ScrollView>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={onDelete}
        loading={deleting}
        title="Delete category"
        message={`Delete "${deleteTarget?.name}"? This fails if any transaction still uses it.`}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.silver },
  scroll: { padding: 16, paddingBottom: 32, gap: 16 },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.silverBorder,
  },
  dot: { width: 7, height: 7, borderRadius: 999 },
  sectionTitle: { color: colors.white, fontSize: 14, fontWeight: '600', flex: 1 },
  sectionCount: { color: colors.gray500, fontSize: 12 },
  placeholder: { color: colors.gray500, fontSize: 13, textAlign: 'center', paddingVertical: 22 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 11 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.silverBorder },
  avatar: { width: 32, height: 32, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '700' },
  badgeMoss: { backgroundColor: colors.mossFaint },
  badgeRed: { backgroundColor: colors.redFaint },
  rowName: { color: colors.white, fontSize: 14.5, fontWeight: '500', flex: 1 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },

  editInput: {
    flex: 1, color: colors.white, fontSize: 14.5,
    backgroundColor: colors.silver, borderWidth: 1, borderColor: colors.moss,
    borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 8,
  },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14 },
  addInput: { borderColor: colors.silverBorder },
  addConfirm: {
    width: 38, height: 38, borderRadius: radius.sm, backgroundColor: colors.moss,
    alignItems: 'center', justifyContent: 'center',
  },
  addCancel: {
    width: 38, height: 38, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.silverBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  addTrigger: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 15 },
  addTriggerText: { color: colors.gray500, fontSize: 13.5 },
})
