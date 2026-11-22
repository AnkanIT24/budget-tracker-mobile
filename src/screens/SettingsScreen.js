import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, LogOut, Shield } from 'lucide-react-native'
import { colors, radius } from '../theme'
import { authService, errMsg } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Card from '../components/Card'
import Field from '../components/Field'
import Button from '../components/Button'
import ConfirmDialog from '../components/ConfirmDialog'
import ScreenHeader from '../components/ScreenHeader'
import { FadeInView } from '../components/Motion'

const schema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password'),
  newPassword:     z.string().min(6, 'Use at least 6 characters'),
  confirmPassword: z.string().min(1, 'Confirm your new password'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export default function SettingsScreen() {
  const { user, logout } = useAuth()
  const toast = useToast()
  const [confirmLogout, setConfirmLogout] = useState(false)

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const onSubmit = async (data) => {
    try {
      await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      toast.success('Password changed')
      reset()
    } catch (err) {
      toast.error(errMsg(err, 'Could not change your password'))
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ScreenHeader title="Settings" subtitle="Manage your account" />

          <FadeInView>
            <Card style={{ padding: 18 }}>
              <View style={styles.cardHeader}>
                <Shield size={15} color={colors.gray500} />
                <Text style={styles.cardTitle}>Profile</Text>
              </View>
              <View style={styles.profile}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{user?.fullName?.[0]?.toUpperCase() || '?'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={1}>{user?.fullName}</Text>
                  <Text style={styles.email} numberOfLines={1}>{user?.email}</Text>
                </View>
              </View>
            </Card>
          </FadeInView>

          <FadeInView delay={80}>
            <Card style={{ padding: 18 }}>
              <View style={styles.cardHeader}>
                <Lock size={15} color={colors.gray500} />
                <Text style={styles.cardTitle}>Change password</Text>
              </View>

              <Controller
                control={control}
                name="currentPassword"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Field
                    label="Current password" value={value} onChangeText={onChange} onBlur={onBlur}
                    placeholder="••••••••" secureTextEntry
                    error={errors.currentPassword?.message} style={{ marginTop: 18 }}
                  />
                )}
              />
              <Controller
                control={control}
                name="newPassword"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Field
                    label="New password" value={value} onChangeText={onChange} onBlur={onBlur}
                    placeholder="At least 6 characters" secureTextEntry
                    error={errors.newPassword?.message} style={{ marginTop: 14 }}
                  />
                )}
              />
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Field
                    label="Confirm password" value={value} onChangeText={onChange} onBlur={onBlur}
                    placeholder="••••••••" secureTextEntry
                    error={errors.confirmPassword?.message} style={{ marginTop: 14 }}
                  />
                )}
              />

              <Button
                title="Update password"
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting}
                style={{ marginTop: 20 }}
              />
            </Card>
          </FadeInView>

          <FadeInView delay={140}>
            <Button
              title="Sign out"
              variant="danger"
              icon={<LogOut size={16} color={colors.red400} />}
              onPress={() => setConfirmLogout(true)}
            />
          </FadeInView>

          <Text style={styles.version}>BudgetTracker · v1.0.0</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmDialog
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={() => { setConfirmLogout(false); logout() }}
        confirmLabel="Sign out"
        title="Sign out"
        message="You'll need your email and password to get back in."
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.silver },
  scroll: { padding: 16, paddingBottom: 40, gap: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { color: colors.white, fontSize: 14, fontWeight: '600' },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 16 },
  avatar: {
    width: 52, height: 52, borderRadius: radius.lg, backgroundColor: colors.mossFaint,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: colors.moss, fontSize: 21, fontWeight: '700' },
  name: { color: colors.white, fontSize: 16, fontWeight: '600' },
  email: { color: colors.gray500, fontSize: 13.5, marginTop: 2 },
  version: { color: colors.gray500, fontSize: 11, textAlign: 'center', marginTop: 4 },
})
