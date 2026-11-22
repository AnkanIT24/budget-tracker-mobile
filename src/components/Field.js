import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Eye, EyeOff } from 'lucide-react-native'
import { colors, radius } from '../theme'

/** The .input-field class from index.css, as a controlled RN component. */
export default function Field({
  label, value, onChangeText, onBlur, placeholder, error, hint,
  secureTextEntry, keyboardType, autoCapitalize = 'none', autoFocus, editable = true,
  style, returnKeyType, onSubmitEditing,
}) {
  const [focused, setFocused] = useState(false)
  const [revealed, setRevealed] = useState(false)

  // When secureTextEntry is set, the field grows an eye toggle. Kept internal so
  // every password input in the app gets it without changing a single call site.
  const isPassword = !!secureTextEntry

  return (
    <View style={style}>
      {!!label && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {!!hint && <Text style={styles.hint}>{hint}</Text>}
        </View>
      )}

      <View>
        <TextInput
          value={value != null ? String(value) : ''}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={(e) => { setFocused(false); onBlur && onBlur(e) }}
          placeholder={placeholder}
          placeholderTextColor={colors.gray500}
          secureTextEntry={isPassword && !revealed}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          autoFocus={autoFocus}
          editable={editable}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          style={[
            styles.input,
            isPassword && styles.inputWithAction,
            focused && styles.inputFocused,
            !!error && styles.inputError,
          ]}
        />

        {isPassword && (
          <Pressable
            onPress={() => setRevealed((v) => !v)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            style={styles.action}
          >
            {revealed
              ? <EyeOff size={17} color={colors.gray400} />
              : <Eye size={17} color={colors.gray500} />}
          </Pressable>
        )}
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  label: { color: colors.gray400, fontSize: 12, fontWeight: '600' },
  hint: { color: colors.yellow400, fontSize: 11 },
  input: {
    backgroundColor: colors.silver,
    borderWidth: 1, borderColor: colors.silverBorder,
    borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 12,
    color: colors.white, fontSize: 15, minHeight: 46,
  },
  inputWithAction: { paddingRight: 46 },
  inputFocused: { borderColor: colors.moss },
  inputError: { borderColor: colors.red500 },
  action: {
    position: 'absolute', right: 0, top: 0, bottom: 0,
    width: 46, alignItems: 'center', justifyContent: 'center',
  },
  error: { color: colors.red400, fontSize: 12, marginTop: 5 },
})
