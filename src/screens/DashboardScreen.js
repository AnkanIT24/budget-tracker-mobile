import React, { useCallback, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { AlertCircle, ArrowRight, TrendingDown, TrendingUp, Wallet } from 'lucide-react-native'
import { colors, radius } from '../theme'
import { formatINR, MONTHS_FULL } from '../utils/format'
import { budgetService, transactionService, errMsg } from '../services/api'
import { useToast } from '../context/ToastContext'
import Card from '../components/Card'
import ProgressBar from '../components/ProgressBar'
import { FadeInView, PressableScale, stagger } from '../components/Motion'
import { BudgetSkeleton, RowSkeleton, StatSkeleton } from '../components/Skeleton'
import AiBudgetSaver from '../components/AiBudgetSaver'

function barColorFor(b) {
  if (b.isOverBudget) return colors.red500
  if (b.percentageUsed > 80) return colors.yellow400
  return colors.moss
}

export default function DashboardScreen({ navigation }) {
  const toast = useToast()
  const [summary, setSummary] = useState(null)
  const [budgets, setBudgets] = useState([])
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const load = useCallback(async (isRefresh) => {
    if (!isRefresh) setLoading(true)
    try {
      const [s, b, t] = await Promise.all([
        transactionService.getSummary(month, year),
        budgetService.getStatus(month, year),
        transactionService.getAll({ month, year }),
      ])
      setSummary(s)
      setBudgets(b)
      setRecent(t.slice(0, 5))
    } catch (err) {
      toast.error(errMsg(err, 'Could not load your dashboard'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [month, year])

  // Reload every time the tab regains focus, so numbers stay in sync after edits.
  useFocusEffect(useCallback(() => { load() }, [load]))

  const onRefresh = () => { setRefreshing(true); load(true) }

  const negative = (summary?.netBalance ?? 0) < 0

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.moss} colors={[colors.moss]} />
        }
      >
        <FadeInView offset={-8}>
          <Text style={styles.title}>{MONTHS_FULL[month - 1]} {year}</Text>
          <Text style={styles.subtitle}>Your financial snapshot</Text>
        </FadeInView>

        {loading ? (
          <View style={{ gap: 12 }}>
            <StatSkeleton height={112} />
            <View style={styles.statRow}>
              <StatSkeleton />
              <StatSkeleton />
            </View>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {/* Balance leads — on a phone the one number you open the app for goes first. */}
            <FadeInView delay={40}>
              <Card style={[styles.hero, negative && { borderColor: 'rgba(248,113,113,0.28)' }]}>
                <View style={styles.heroTop}>
                  <Text style={styles.statLabel}>BALANCE</Text>
                  <View style={[styles.iconBadge, negative ? styles.badgeRed : styles.badgeMoss]}>
                    <Wallet size={15} color={negative ? colors.red400 : colors.moss} />
                  </View>
                </View>
                <Text style={[styles.heroValue, negative && { color: colors.red400 }]}>
                  {formatINR(summary?.netBalance, 2)}
                </Text>
                <Text style={styles.heroHint}>
                  {negative ? 'You have spent more than you earned this month' : 'Left over this month'}
                </Text>
              </Card>
            </FadeInView>

            <View style={styles.statRow}>
              <FadeInView delay={90} style={{ flex: 1 }}>
                <Card style={styles.stat}>
                  <View style={styles.heroTop}>
                    <Text style={styles.statLabel}>INCOME</Text>
                    <View style={[styles.iconBadge, styles.badgeMoss]}>
                      <TrendingUp size={14} color={colors.moss} />
                    </View>
                  </View>
                  <Text style={styles.statValue}>{formatINR(summary?.totalIncome, 2)}</Text>
                </Card>
              </FadeInView>

              <FadeInView delay={140} style={{ flex: 1 }}>
                <Card style={styles.stat}>
                  <View style={styles.heroTop}>
                    <Text style={styles.statLabel}>EXPENSES</Text>
                    <View style={[styles.iconBadge, styles.badgeRed]}>
                      <TrendingDown size={14} color={colors.red400} />
                    </View>
                  </View>
                  <Text style={styles.statValue}>{formatINR(summary?.totalExpense, 2)}</Text>
                </Card>
              </FadeInView>
            </View>
          </View>
        )}

        {/* Budget status */}
        <Card padded={false}>
          <SectionHeader
            title="Budget status"
            actionLabel="Manage"
            onPress={() => navigation.navigate('Budgets')}
          />
          <View style={styles.sectionBody}>
            {loading ? (
              <View style={{ gap: 14 }}><BudgetSkeleton /><BudgetSkeleton /></View>
            ) : budgets.length === 0 ? (
              <Text style={styles.placeholder}>No budgets set for this month</Text>
            ) : (
              budgets.map((b, i) => (
                <FadeInView key={b.budgetId} delay={stagger(i)} style={{ gap: 7 }}>
                  <View style={styles.budgetRow}>
                    <Text style={styles.budgetName} numberOfLines={1}>{b.categoryName}</Text>
                    <Text style={[styles.budgetAmount, { color: barColorFor(b) === colors.moss ? colors.gray400 : barColorFor(b) }]}>
                      {formatINR(b.spent)} / {formatINR(b.monthlyLimit)}
                    </Text>
                  </View>
                  <ProgressBar percent={b.percentageUsed} color={barColorFor(b)} height={6} />
                  {b.isOverBudget && (
                    <View style={styles.overRow}>
                      <AlertCircle size={11} color={colors.red400} />
                      <Text style={styles.overText}>Over by {formatINR(Math.abs(b.remaining))}</Text>
                    </View>
                  )}
                </FadeInView>
              ))
            )}
          </View>
        </Card>

        {/* Recent transactions */}
        <Card padded={false}>
          <SectionHeader
            title="Recent transactions"
            actionLabel="View all"
            onPress={() => navigation.navigate('Transactions')}
          />
          {loading ? (
            <View>{[0, 1, 2, 3].map((i) => <RowSkeleton key={i} />)}</View>
          ) : recent.length === 0 ? (
            <Text style={[styles.placeholder, { paddingVertical: 28 }]}>Nothing recorded yet</Text>
          ) : (
            recent.map((t, i) => {
              const income = t.type === 'INCOME'
              return (
                <FadeInView key={t.id} delay={stagger(i)}>
                  <View style={[styles.txRow, i > 0 && styles.txDivider]}>
                    <View style={[styles.avatar, income ? styles.badgeMoss : styles.badgeRed]}>
                      <Text style={[styles.avatarText, { color: income ? colors.moss : colors.red400 }]}>
                        {t.categoryName?.[0] || '?'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.txName} numberOfLines={1}>{t.categoryName}</Text>
                      <Text style={styles.txMeta} numberOfLines={1}>{t.note || t.date}</Text>
                    </View>
                    <Text style={[styles.txAmount, { color: income ? colors.moss : colors.red400 }]}>
                      {income ? '+' : '-'}{formatINR(t.amount)}
                    </Text>
                  </View>
                </FadeInView>
              )
            })
          )}
        </Card>

        {/* AI assistant — mirrors the AI Budget Saver panel on the web dashboard. */}
        <AiBudgetSaver />
      </ScrollView>
    </SafeAreaView>
  )
}

function SectionHeader({ title, actionLabel, onPress }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <PressableScale onPress={onPress}>
        <View style={styles.sectionAction}>
          <Text style={styles.sectionActionText}>{actionLabel}</Text>
          <ArrowRight size={13} color={colors.moss} />
        </View>
      </PressableScale>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.silver },
  scroll: { padding: 16, paddingBottom: 32, gap: 18 },

  title: { color: colors.white, fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
  subtitle: { color: colors.gray500, fontSize: 13, marginTop: 2 },

  hero: { padding: 18 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroValue: { color: colors.white, fontSize: 32, fontWeight: '700', letterSpacing: -1, marginTop: 10 },
  heroHint: { color: colors.gray500, fontSize: 12, marginTop: 5 },

  statRow: { flexDirection: 'row', gap: 12 },
  stat: { padding: 14, flex: 1 },
  statLabel: { color: colors.gray500, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  statValue: { color: colors.white, fontSize: 17, fontWeight: '700', marginTop: 10, letterSpacing: -0.3 },

  iconBadge: { width: 30, height: 30, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  badgeMoss: { backgroundColor: colors.mossFaint },
  badgeRed: { backgroundColor: colors.redFaint },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.silverBorder,
  },
  sectionTitle: { color: colors.white, fontSize: 14, fontWeight: '600' },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sectionActionText: { color: colors.moss, fontSize: 12, fontWeight: '600' },
  sectionBody: { padding: 16, gap: 16 },
  placeholder: { color: colors.gray500, fontSize: 13, textAlign: 'center', paddingVertical: 14 },

  budgetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  budgetName: { color: colors.white, fontSize: 14, fontWeight: '500', flex: 1 },
  budgetAmount: { fontSize: 12 },
  overRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  overText: { color: colors.red400, fontSize: 11 },

  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  txDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.silverBorder },
  avatar: { width: 34, height: 34, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '700' },
  txName: { color: colors.white, fontSize: 14, fontWeight: '500' },
  txMeta: { color: colors.gray500, fontSize: 12, marginTop: 1 },
  txAmount: { fontSize: 14, fontWeight: '600' },
})
