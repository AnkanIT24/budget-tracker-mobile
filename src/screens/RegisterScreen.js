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
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export default function RegisterScreen({ navigation }) {
  const { register: registerUser } = useAuth()
  const toast = useToast()
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', password: '' },
  })

  const onSubmit = async (data) => {
    try {
      await registerUser(data)
    } catch (err) {
      toast.error(errMsg(err, 'Could not create your account'))
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
              <Text style={styles.heading}>Create account</Text>
              <Text style={styles.sub}>Start tracking your budget</Text>

              <Controller
                control={control}
                name="fullName"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Field
                    label="Full name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Ankan Chakraborty"
                    autoCapitalize="words"
                    error={errors.fullName?.message}
                    style={{ marginTop: 20 }}
                  />
                )}
              />

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
                    style={{ marginTop: 14 }}
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
                    placeholder="At least 6 characters"
                    secureTextEntry
                    error={errors.password?.message}
                    style={{ marginTop: 14 }}
                    returnKeyType="go"
                    onSubmitEditing={handleSubmit(onSubmit)}
                  />
                )}
              />

              <Button
                title="Create account"
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting}
                style={{ marginTop: 22 }}
              />
            </Card>
          </FadeInView>

          <FadeInView delay={180} offset={10}>
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
                <Text style={styles.link}>Sign in</Text>
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
    position: 'absolute', top: '20%', alignSelf: 'center',
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
  link: { color: colors.moss, fontSize: 14, fontWeight: '600' },
})
