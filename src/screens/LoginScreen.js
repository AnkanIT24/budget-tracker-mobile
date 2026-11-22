import React from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TrendingUp } from 'lucide-react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, radius } from '../theme'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { errMsg } from '../services/api'
import Card from '../components/Card'
import Field from '../components/Field'
import Button from '../components/Button'
import { FadeInView } from '../components/Motion'

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
})

export default function LoginScreen({ navigation }) {
  const { login } = useAuth()
  const toast = useToast()
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data) => {
    try {
      await login(data)
      // No navigate() call — RootNavigator swaps stacks when `user` becomes set.
    } catch (err) {
      toast.error(errMsg(err, 'Email or password is incorrect'))
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.glow} />

          <FadeInView offset={20}>
            <View style={styles.brand}>
              <View style={styles.logo}>
                <TrendingUp size={20} color={colors.silver} />
              </View>
              <Text style={styles.brandText}>BudgetTracker</Text>
            </View>
          </FadeInView>

          <FadeInView delay={100} offset={16}>
            <Card style={styles.card}>
              <Text style={styles.heading}>Welcome back</Text>
              <Text style={styles.sub}>Sign in to your account</Text>

              <Controller
                control={control}
                name="email"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Field
                    label="Email"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    error={errors.email?.message}
                    style={{ marginTop: 20 }}
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Field
                    label="Password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="••••••••"
                    secureTextEntry
                    error={errors.password?.message}
                    style={{ marginTop: 14 }}
                    returnKeyType="go"
                    onSubmitEditing={handleSubmit(onSubmit)}
                  />
                )}
              />

              <Pressable
                onPress={() => navigation.navigate('ForgotPassword')}
                hitSlop={8}
                style={{ alignSelf: 'flex-end', marginTop: 10 }}
              >
                <Text style={styles.forgot}>Forgot password?</Text>
              </Pressable>

              <Button
                title="Sign in"
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting}
                style={{ marginTop: 16 }}
              />
            </Card>
          </FadeInView>

          <FadeInView delay={180} offset={10}>
            <View style={styles.footer}>
              <Text style={styles.footerText}>No account? </Text>
              <Pressable onPress={() => navigation.navigate('Register')} hitSlop={8}>
                <Text style={styles.link}>Create one</Text>
              </Pressable>
            </View>
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
    position: 'absolute', top: '22%', alignSelf: 'center',
    width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(43,238,52,0.05)',
  },
  brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 28 },
  logo: {
    width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.moss,
    alignItems: 'center', justifyContent: 'center',
  },
  brandText: { color: colors.white, fontSize: 20, fontWeight: '700' },
  card: { padding: 22 },
  heading: { color: colors.white, fontSize: 19, fontWeight: '700' },
  sub: { color: colors.gray400, fontSize: 14, marginTop: 4 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: colors.gray400, fontSize: 14 },
  forgot: { color: colors.gray500, fontSize: 13 },
  link: { color: colors.moss, fontSize: 14, fontWeight: '600' },
})
