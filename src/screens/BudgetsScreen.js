import React, { useCallback, useMemo, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, Pencil, Plus, Target, Trash2 } from 'lucide-react-native'
import { colors, radius } from '../theme'
import { formatINR, MONTHS, YEARS } from '../utils/format'
import { budgetService, categoryService, errMsg } from '../services/api'
import { useToast } from '../context/ToastContext'
import Card from '../components/Card'
import Field from '../components/Field'
import Select from '../components/Select'
import Button from '../components/Button'
import Sheet from '../components/Sheet'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import ScreenHeader from '../components/ScreenHeader'
import ProgressBar from '../components/ProgressBar'
import { BudgetSkeleton } from '../components/Skeleton'
import { FadeInView, PressableScale, stagger } from '../components/Motion'

const schema = z.object({
  categoryId:   z.string().min(1, 'Pick a category'),
  monthlyLimit: z.coerce.number().min(0.01, 'Enter a limit greater than 0'),
  month:        z.coerce.number().min(1).max(12),
  year:         z.coerce.number().min(2000),
})

function toneFor(b) {
  if (b.isOverBudget) return colors.red500
  if (b.percentageUsed > 80) return colors.yellow400
  return colors.moss
}

export default function BudgetsScreen() {
  const toast = useToast()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { categoryId: '', monthlyLimit: '', month, year },
  })

  const load = useCallback(async (isRefresh) => {
    if (!isRefresh) setLoading(true)
    try {
      const [b, c] = await Promise.all([
        budgetService.getStatus(month, year),
        categoryService.getByType('EXPENSE'),
      ])
      setBudgets(b)
      setCategories(c)
    } catch (err) {
      toast.error(errMsg(err, 'Could not load budgets'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [month, year])

  useFocusEffect(useCallback(() => { load() }, [load]))

  // Categories that don't already have a budget this month.
  const availableCategories = useMemo(() => {
    const taken = new Set(budgets.map((b) => String(b.categoryId)))
    return categories
      .filter((c) => !taken.has(String(c.id)))
      .map((c) => ({ label: c.name, value: String(c.id) }))
  }, [categories, budgets])

  const openCreate = () => {
    setEditing(null)
    reset({ categoryId: '', monthlyLimit: '', month, year })
    setSheetOpen(true)
  }

  const openEdit = (b) => {
    setEditing(b)
    reset({ categoryId: String(b.categoryId), monthlyLimit: String(b.monthlyLimit), month, year })
    setSheetOpen(true)
  }

  const onSubmit = async (data) => {
    try {
      if (editing) {
        await budgetService.update(editing.budgetId, { monthlyLimit: data.monthlyLimit })
        toast.success('Limit updated')
      } else {
        await budgetService.create({ ...data, categoryId: Number(data.categoryId) })
        toast.success('Budget set')
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
      await budgetService.delete(deleteTarget.budgetId)
      toast.success('Budget removed')
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast.error(errMsg(err, 'Could not remove that budget'))
    } finally {
      setDeleting(false)
    }
  }

  const renderItem = ({ item: b, index }) => {
    const tone = toneFor(b)
    const over = b.isOverBudget
    return (
      <FadeInView delay={stagger(index)}>
        <Card style={[styles.budgetCard, over && { borderColor: 'rgba(248,113,113,0.28)' }]}>
          <View style={styles.budgetTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.budgetName} numberOfLines={1}>{b.categoryName}</Text>
              <Text style={styles.budgetSub}>
                {formatINR(b.spent)} spent of {formatINR(b.monthlyLimit)}
              </Text>
            </View>
            <View style={styles.budgetActions}>
              {over && (
                <View style={styles.overBadge}>
                  <AlertCircle size={10} color={colors.red400} />
                  <Text style={styles.overBadgeText}>Over</Text>
                </View>
              )}
              <PressableScale onPress={() => openEdit(b)} hitSlop={8}>
                <Pencil size={15} color={colors.gray500} />
              </PressableScale>
              <PressableScale onPress={() => setDeleteTarget(b)} hitSlop={8}>
                <Trash2 size={15} color={colors.gray500} />
              </PressableScale>
            </View>
          </View>

          <ProgressBar percent={b.percentageUsed} color={tone} height={8} />

          <View style={styles.budgetFooter}>
            <Text style={[styles.pct, { color: tone }]}>{Number(b.percentageUsed || 0).toFixed(1)}% used</Text>
            <Text style={[styles.remaining, over && { color: colors.red400 }]}>
              {over
                ? `${formatINR(Math.abs(b.remaining))} over`
                : `${formatINR(b.remaining)} left`}
            </Text>
          </View>
        </Card>
      </FadeInView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <ScreenHeader
          title="Budgets"
          subtitle={`${budgets.length} active`}
          right={<Button title="Set budget" compact icon={<Plus size={15} color={colors.silver} />} onPress={openCreate} />}
        />
        <View style={styles.periodRow}>
          <Select
            compact title="Month" style={{ flex: 1 }}
            value={month}
            options={MONTHS.map((m, i) => ({ label: m, value: i + 1 }))}
            onChange={setMonth}
          />
          <Select
            compact title="Year" style={{ flex: 1 }}
            value={year}
            options={YEARS.map((y) => ({ label: String(y), value: y }))}
            onChange={setYear}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.list}>
          <BudgetSkeleton /><BudgetSkeleton /><BudgetSkeleton />
        </View>
      ) : (
        <FlatList
          data={budgets}
          keyExtractor={(item) => String(item.budgetId)}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, budgets.length === 0 && { flexGrow: 1, justifyContent: 'center' }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(true) }}
              tintColor={colors.moss}
              colors={[colors.moss]}
            />
          }
          ListEmptyComponent={
            <Card>
              <EmptyState
                icon={Target}
                title="No budgets for this month"
                description="Set a monthly limit on an expense category to track it here."
              />
            </Card>
          }
        />
      )}

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={editing ? 'Edit limit' : 'Set a budget'}>
        {editing ? (
          <View style={styles.editingBanner}>
            <Text style={styles.editingText}>{editing.categoryName}</Text>
            <Text style={styles.editingSub}>{MONTHS[month - 1]} {year}</Text>
          </View>
        ) : (
          <Controller
            control={control}
            name="categoryId"
            render={({ field: { value, onChange } }) => (
              <Select
                label="Expense category"
                placeholder={availableCategories.length === 0 ? 'Every category already has a budget' : 'Pick a category'}
                value={value}
                options={availableCategories}
                onChange={onChange}
                error={errors.categoryId?.message}
              />
            )}
          />
        )}

        <Controller
          control={control}
          name="monthlyLimit"
          render={({ field: { value, onChange, onBlur } }) => (
            <Field
              label="Monthly limit (₹)"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="0.00"
              keyboardType="decimal-pad"
              error={errors.monthlyLimit?.message}
            />
          )}
        />

        {!editing && (
          <View style={styles.periodRow}>
            <Controller
              control={control}
              name="month"
              render={({ field: { value, onChange } }) => (
                <Select
                  label="Month" style={{ flex: 1 }}
                  value={value}
                  options={MONTHS.map((m, i) => ({ label: m, value: i + 1 }))}
                  onChange={onChange}
                />
              )}
            />
            <Controller
              control={control}
              name="year"
              render={({ field: { value, onChange } }) => (
                <Select
                  label="Year" style={{ flex: 1 }}
                  value={value}
                  options={YEARS.map((y) => ({ label: String(y), value: y }))}
                  onChange={onChange}
                />
              )}
            />
          </View>
        )}

        <View style={styles.sheetActions}>
          <Button title="Cancel" variant="ghost" onPress={() => setSheetOpen(false)} style={{ flex: 1 }} />
          <Button
            title={editing ? 'Save limit' : 'Set budget'}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            style={{ flex: 1.3 }}
          />
        </View>
      </Sheet>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={onDelete}
        loading={deleting}
        confirmLabel="Remove"
        title="Remove budget"
        message={`This stops tracking a limit for ${deleteTarget?.categoryName}. Your transactions stay untouched.`}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.silver },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 12 },
  periodRow: { flexDirection: 'row', gap: 10 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },

  budgetCard: { padding: 16, gap: 12 },
  budgetTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  budgetName: { color: colors.white, fontSize: 15.5, fontWeight: '600' },
  budgetSub: { color: colors.gray500, fontSize: 12, marginTop: 3 },
  budgetActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  overBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.redFaint, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill,
  },
  overBadgeText: { color: colors.red400, fontSize: 10, fontWeight: '600' },
  budgetFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  pct: { fontSize: 12, fontWeight: '600' },
  remaining: { color: colors.gray500, fontSize: 12 },

  editingBanner: {
    backgroundColor: colors.silver, borderWidth: 1, borderColor: colors.silverBorder,
    borderRadius: radius.md, padding: 14,
  },
  editingText: { color: colors.white, fontSize: 15, fontWeight: '600' },
  editingSub: { color: colors.gray500, fontSize: 12, marginTop: 2 },
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
})
