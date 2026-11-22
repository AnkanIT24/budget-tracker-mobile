import React, { useCallback, useMemo, useState } from 'react'
import { FlatList, LayoutAnimation, Platform, Pressable, RefreshControl, StyleSheet, Text, UIManager, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowUpDown, Pencil, Plus, SlidersHorizontal, Trash2 } from 'lucide-react-native'
import { colors, radius } from '../theme'
import { formatINR, MONTHS, YEARS, todayISO, prettyDate } from '../utils/format'
import { categoryService, transactionService, errMsg } from '../services/api'
import { useToast } from '../context/ToastContext'
import Card from '../components/Card'
import Field from '../components/Field'
import Select from '../components/Select'
import DateField from '../components/DateField'
import Button from '../components/Button'
import IconButton from '../components/IconButton'
import Sheet from '../components/Sheet'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import ScreenHeader from '../components/ScreenHeader'
import { RowSkeleton } from '../components/Skeleton'
import { FadeInView, PressableScale, stagger } from '../components/Motion'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

const schema = z.object({
  categoryId: z.string().min(1, 'Pick a category'),
  type:       z.enum(['INCOME', 'EXPENSE']),
  amount:     z.coerce.number().min(0.01, 'Enter an amount greater than 0'),
  note:       z.string().optional(),
  date:       z.string().min(1, 'Pick a date'),
})

const emptyForm = () => ({ type: 'EXPENSE', categoryId: '', amount: '', note: '', date: todayISO() })

export default function TransactionsScreen() {
  const toast = useToast()
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [filters, setFilters] = useState(() => {
    const now = new Date()
    return { month: now.getMonth() + 1, year: now.getFullYear(), type: '', categoryId: '' }
  })

  const { control, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: emptyForm(),
  })

  const selectedType = useWatch({ control, name: 'type', defaultValue: 'EXPENSE' })

  const categoryOptions = useMemo(
    () => categories.filter((c) => c.type === selectedType).map((c) => ({ label: c.name, value: String(c.id) })),
    [categories, selectedType]
  )

  const load = useCallback(async (isRefresh) => {
    if (!isRefresh) setLoading(true)
    try {
      const params = { month: filters.month, year: filters.year }
      if (filters.type) params.type = filters.type
      if (filters.categoryId) params.categoryId = filters.categoryId
      const [t, c] = await Promise.all([transactionService.getAll(params), categoryService.getAll()])
      setTransactions(t)
      setCategories(c)
    } catch (err) {
      toast.error(errMsg(err, 'Could not load transactions'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filters])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const openCreate = () => { setEditing(null); reset(emptyForm()); setSheetOpen(true) }

  const openEdit = (t) => {
    setEditing(t)
    reset({
      categoryId: String(t.categoryId),
      type: t.type,
      amount: String(t.amount),
      note: t.note || '',
      date: t.date,
    })
    setSheetOpen(true)
  }

  const onSubmit = async (data) => {
    const payload = { ...data, categoryId: Number(data.categoryId) }
    try {
      if (editing) {
        await transactionService.update(editing.id, payload)
        toast.success('Transaction updated')
      } else {
        await transactionService.create(payload)
        toast.success('Transaction added')
      }
      setSheetOpen(false)
      load()
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  const onDelete = async () => {
    setDeleting(true)
    try {
      await transactionService.delete(deleteTarget.id)
      toast.success('Transaction deleted')
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast.error(errMsg(err, 'Could not delete that transaction'))
    } finally {
      setDeleting(false)
    }
  }

  const toggleFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setFiltersOpen((v) => !v)
  }

  const renderItem = ({ item: t, index }) => {
    const income = t.type === 'INCOME'
    return (
      <FadeInView delay={stagger(index)}>
        <Pressable
          onPress={() => openEdit(t)}
          style={({ pressed }) => [styles.row, index > 0 && styles.divider, pressed && { backgroundColor: colors.mossTint }]}
        >
          <View style={[styles.avatar, income ? styles.badgeMoss : styles.badgeRed]}>
            <Text style={[styles.avatarText, { color: income ? colors.moss : colors.red400 }]}>
              {t.categoryName?.[0] || '?'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{t.categoryName}</Text>
            <Text style={styles.meta} numberOfLines={1}>
              {t.note ? `${t.note} · ` : ''}{prettyDate(t.date)}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <Text style={[styles.amount, { color: income ? colors.moss : colors.red400 }]}>
              {income ? '+' : '-'}{formatINR(t.amount)}
            </Text>
            <View style={styles.rowActions}>
              <PressableScale onPress={() => openEdit(t)} hitSlop={8}>
                <Pencil size={15} color={colors.gray500} />
              </PressableScale>
              <PressableScale onPress={() => setDeleteTarget(t)} hitSlop={8}>
                <Trash2 size={15} color={colors.gray500} />
              </PressableScale>
            </View>
          </View>
        </Pressable>
      </FadeInView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <ScreenHeader
          title="Transactions"
          subtitle={`${transactions.length} ${transactions.length === 1 ? 'record' : 'records'}`}
          right={
            <>
              <IconButton onPress={toggleFilters} active={filtersOpen}>
                <SlidersHorizontal size={16} color={filtersOpen ? colors.moss : colors.gray400} />
              </IconButton>
              <Button title="Add" compact icon={<Plus size={15} color={colors.silver} />} onPress={openCreate} />
            </>
          }
        />

        {filtersOpen && (
          <Card style={styles.filterCard}>
            <View style={styles.filterGrid}>
              <Select
                compact title="Month" style={{ flex: 1 }}
                value={filters.month}
                options={MONTHS.map((m, i) => ({ label: m, value: i + 1 }))}
                onChange={(v) => setFilters((f) => ({ ...f, month: v }))}
              />
              <Select
                compact title="Year" style={{ flex: 1 }}
                value={filters.year}
                options={YEARS.map((y) => ({ label: String(y), value: y }))}
                onChange={(v) => setFilters((f) => ({ ...f, year: v }))}
              />
            </View>
            <View style={styles.filterGrid}>
              <Select
                compact title="Type" style={{ flex: 1 }}
                value={filters.type}
                options={[
                  { label: 'All types', value: '' },
                  { label: 'Income', value: 'INCOME' },
                  { label: 'Expense', value: 'EXPENSE' },
                ]}
                onChange={(v) => setFilters((f) => ({ ...f, type: v }))}
              />
              <Select
                compact title="Category" style={{ flex: 1 }}
                value={filters.categoryId}
                options={[{ label: 'All categories', value: '' }, ...categories.map((c) => ({ label: c.name, value: String(c.id) }))]}
                onChange={(v) => setFilters((f) => ({ ...f, categoryId: v }))}
              />
            </View>
          </Card>
        )}
      </View>

      <Card padded={false} style={styles.listCard}>
        {loading ? (
          <View>{[0, 1, 2, 3, 4].map((i) => <RowSkeleton key={i} />)}</View>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={transactions.length === 0 && { flexGrow: 1, justifyContent: 'center' }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); load(true) }}
                tintColor={colors.moss}
                colors={[colors.moss]}
              />
            }
            ListEmptyComponent={
              <EmptyState
                icon={ArrowUpDown}
                title="Nothing here yet"
                description="Add your first income or expense for this month."
              />
            }
          />
        )}
      </Card>

      {/* Add / edit */}
      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editing ? 'Edit transaction' : 'Add transaction'}
      >
        <View>
          <Text style={styles.label}>Type</Text>
          <View style={styles.segment}>
            {['EXPENSE', 'INCOME'].map((t) => {
              const active = selectedType === t
              const tint = t === 'INCOME' ? colors.moss : colors.red400
              return (
                <Pressable
                  key={t}
                  onPress={() => {
                    setValue('type', t, { shouldValidate: false })
                    setValue('categoryId', '') // category list changes with type
                  }}
                  style={[
                    styles.segmentBtn,
                    active && {
                      borderColor: tint,
                      backgroundColor: t === 'INCOME' ? colors.mossFaint : colors.redFaint,
                    },
                  ]}
                >
                  <Text style={[styles.segmentText, active && { color: tint }]}>
                    {t === 'INCOME' ? '↑  Income' : '↓  Expense'}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        <Controller
          control={control}
          name="categoryId"
          render={({ field: { value, onChange } }) => (
            <Select
              label="Category"
              hint={categoryOptions.length === 0 ? `No ${selectedType.toLowerCase()} categories yet` : undefined}
              placeholder={categoryOptions.length === 0 ? 'Create one in Categories first' : 'Pick a category'}
              value={value}
              options={categoryOptions}
              onChange={onChange}
              error={errors.categoryId?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="amount"
          render={({ field: { value, onChange, onBlur } }) => (
            <Field
              label="Amount (₹)"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="0.00"
              keyboardType="decimal-pad"
              error={errors.amount?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="date"
          render={({ field: { value, onChange } }) => (
            <DateField label="Date" value={value} onChange={onChange} error={errors.date?.message} />
          )}
        />

        <Controller
          control={control}
          name="note"
          render={({ field: { value, onChange, onBlur } }) => (
            <Field
              label="Note (optional)"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="What was this for?"
              autoCapitalize="sentences"
            />
          )}
        />

        <View style={styles.sheetActions}>
          <Button title="Cancel" variant="ghost" onPress={() => setSheetOpen(false)} style={{ flex: 1 }} />
          <Button
            title={editing ? 'Save changes' : 'Add transaction'}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            style={{ flex: 1.4 }}
          />
        </View>
      </Sheet>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={onDelete}
        loading={deleting}
        title="Delete transaction"
        message={`This removes the ${formatINR(deleteTarget?.amount)} entry for ${deleteTarget?.categoryName}. You can't undo it.`}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.silver },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 12 },
  filterCard: { padding: 12, gap: 8 },
  filterGrid: { flexDirection: 'row', gap: 8 },
  listCard: { flex: 1, marginHorizontal: 16, marginBottom: 12 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.silverBorder },
  avatar: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '700' },
  badgeMoss: { backgroundColor: colors.mossFaint },
  badgeRed: { backgroundColor: colors.redFaint },
  name: { color: colors.white, fontSize: 14.5, fontWeight: '500' },
  meta: { color: colors.gray500, fontSize: 12, marginTop: 2 },
  amount: { fontSize: 14.5, fontWeight: '600' },
  rowActions: { flexDirection: 'row', gap: 14 },

  label: { color: colors.gray400, fontSize: 12, fontWeight: '600', marginBottom: 6 },
  segment: { flexDirection: 'row', gap: 10 },
  segmentBtn: {
    flex: 1, minHeight: 46, borderRadius: radius.md, borderWidth: 1, borderColor: colors.silverBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  segmentText: { color: colors.gray500, fontSize: 14, fontWeight: '600' },
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
})
