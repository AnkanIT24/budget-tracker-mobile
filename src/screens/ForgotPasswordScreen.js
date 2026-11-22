import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, MailCheck, TrendingUp } from 'lucide-react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, radius } from '../theme'
import { authService, errMsg } from '../services/api'
import { useToast } from '../context/ToastContext'
import Card from '../components/Card'
import Field from '../components/Field'
import Button from '../components/Button'
import { FadeInView } from '../components/Motion'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
})

export default function ForgotPasswordScreen({ navigation }) {
  const toast = useToast()
  const [sentTo, setSentTo] = useState(null)

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (data) => {
    try {
      await authService.forgotPassword(data)
      // 204 comes back whether or not the address is registered, so this
      // confirmation has to read the same either way.
      setSentTo(data.email)
    } catch (err) {
      toast.error(errMsg(err, 'Could not send the reset email'))
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
              {sentTo ? (
                <View style={{ alignItems: 'center' }}>
                  <View style={styles.iconWrap}><MailCheck size={22} color={colors.moss} /></View>
                  <Text style={styles.heading}>Check your email</Text>
                  <Text style={styles.centerSub}>
                    If an account exists for {sentTo}, a reset link and code are on
                    the way. Both expire in 30 minutes.
                  </Text>
                  <Button
                    title="I have a reset code"
                    onPress={() => navigation.navigate('ResetPassword')}
                    style={{ marginTop: 20, alignSelf: 'stretch' }}
                  />
                  <Text style={styles.note}>
                    Tapping the link in the email opens the web app. To finish here
                    instead, paste the code from that email.
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.heading}>Forgot password</Text>
                  <Text style={styles.sub}>We'll email you a link and a reset code.</Text>

                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { value, onChange, onBlur } }) => (
                      <Field
                        label="Email" value={value} onChangeText={onChange} onBlur={onBlur}
                        placeholder="you@example.com" keyboardType="email-address"
                        error={errors.email?.message} style={{ marginTop: 20 }}
                        returnKeyType="go" onSubmitEditing={handleSubmit(onSubmit)}
                      />
                    )}
                  />

                  <Button title="Send reset link" onPress={handleSubmit(onSubmit)}
                    loading={isSubmitting} style={{ marginTop: 22 }} />

                  <Pressable onPress={() => navigation.navigate('ResetPassword')} hitSlop={8}>
                    <Text style={styles.secondaryLink}>I already have a code</Text>
                  </Pressable>
                </>
              )}
            </Card>
          </FadeInView>

          <FadeInView delay={180} offset={10}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.back}>
              <ArrowLeft size={14} color={colors.moss} />
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
    position: 'absolute', top: '22%', alignSelf: 'center',
    width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(43,238,52,0.05)',
  },
  brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 28 },
  logo: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.moss, alignItems: 'center', justifyContent: 'center' },
  brandText: { color: colors.white, fontSize: 20, fontWeight: '700' },
  card: { padding: 22 },
  heading: { color: colors.white, fontSize: 19, fontWeight: '700' },
  sub: { color: colors.gray400, fontSize: 14, marginTop: 4 },
  centerSub: { color: colors.gray400, fontSize: 14, marginTop: 6, textAlign: 'center', lineHeight: 20 },
  note: { color: colors.gray500, fontSize: 12, marginTop: 14, textAlign: 'center', lineHeight: 17 },
  iconWrap: {
    width: 48, height: 48, borderRadius: radius.lg, backgroundColor: colors.mossFaint,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  secondaryLink: { color: colors.gray500, fontSize: 13, textAlign: 'center', marginTop: 16 },
  back: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20 },
  link: { color: colors.moss, fontSize: 14, fontWeight: '600' },
})
