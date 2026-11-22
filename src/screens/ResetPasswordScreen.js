import React from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TrendingUp } from 'lucide-react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, radius } from '../theme'
import { authService, errMsg } from '../services/api'
import { useToast } from '../context/ToastContext'
import Card from '../components/Card'
import Field from '../components/Field'
import Button from '../components/Button'
import { FadeInView } from '../components/Motion'

const schema = z.object({
  token:           z.string().min(1, 'Paste the code from your email'),
  newPassword:     z.string().min(6, 'Use at least 6 characters'),
  confirmPassword: z.string().min(1, 'Confirm your new password'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export default function ResetPasswordScreen({ navigation }) {
  const toast = useToast()

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { token: '', newPassword: '', confirmPassword: '' },
  })

  const onSubmit = async (data) => {
    try {
      await authService.resetPassword({
        // Emails wrap long lines, so a pasted token can arrive with stray
        // whitespace or newlines. Strip them rather than fail validation.
        token: data.token.trim().replace(/\s+/g, ''),
        newPassword: data.newPassword,
      })
      toast.success('Password updated — sign in with your new one')
      navigation.navigate('Login')
    } catch (err) {
      toast.error(errMsg(err, 'This reset code is no longer valid'))
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.glow} />

          <FadeInView offset={20}>
            <View style={styles.brand}>
              <View style={styles.logo}><TrendingUp size={20} color={colors.silver} /></View>
              <Text style={styles.brandText}>BudgetTracker</Text>
            </View>
          </FadeInView>

          <FadeInView delay={100} offset={16}>
            <Card style={styles.card}>
              <Text style={styles.heading}>Set a new password</Text>
              <Text style={styles.sub}>Paste the code from your reset email.</Text>

              <Controller
                control={control}
                name="token"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Field
                    label="Reset code" value={value} onChangeText={onChange} onBlur={onBlur}
                    placeholder="Paste the code here"
                    error={errors.token?.message} style={{ marginTop: 20 }}
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
                    returnKeyType="go" onSubmitEditing={handleSubmit(onSubmit)}
                  />
                )}
              />

              <Button title="Update password" onPress={handleSubmit(onSubmit)}
                loading={isSubmitting} style={{ marginTop: 22 }} />
            </Card>
          </FadeInView>

          <FadeInView delay={180} offset={10}>
            <Pressable onPress={() => navigation.navigate('Login')} hitSlop={8}>
              <Text style={styles.link}>Back to sign in</Text>
            </Pressable>
          </FadeInView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.silver },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 22 },
  glow: {
    position: 'absolute', top: '20%', alignSelf: 'center',
    width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(43,238,52,0.05)',
  },
  brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 28 },
  logo: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.moss, alignItems: 'center', justifyContent: 'center' },
  brandText: { color: colors.white, fontSize: 20, fontWeight: '700' },
  card: { padding: 22 },
  heading: { color: colors.white, fontSize: 19, fontWeight: '700' },
  sub: { color: colors.gray400, fontSize: 14, marginTop: 4 },
  link: { color: colors.moss, fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 20 },
})
