import React, { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Bot, Send, Sparkles } from 'lucide-react-native'
import { colors, radius } from '../theme'
import { aiService, errMsg } from '../services/api'
import Card from './Card'

const SUGGESTIONS = [
  'How am I spending this month?',
  'How can I save more?',
]

export default function AiBudgetSaver() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Hi! I'm your AI Budget Saver. Ask me about your spending, budgets or financial goals.",
    },
  ])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  const sendMessage = async (value = draft) => {
    const message = value.trim()
    if (!message || sending) return

    setDraft('')
    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: 'user', text: message },
    ])
    setSending(true)

    try {
      const result = await aiService.chat({ message })
      const answer = result?.response?.trim()
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: answer || 'I could not generate a response. Please try again.',
        },
      ])
    } catch (error) {
      const quotaError =
        error?.response?.status === 429 ||
        /quota|rate.?limit|resource.?exhausted/i.test(
          error?.response?.data?.message || error?.message || ''
        )

      setMessages((current) => [
        ...current,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          text: quotaError
            ? 'The AI provider has reached its current request quota. Please try again after the quota resets.'
            : errMsg(error, 'The AI assistant is temporarily unavailable. Please try again later.'),
          error: true,
        },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <Card padded={false} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Sparkles size={17} color="#c4a7ff" />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>AI Budget Saver</Text>
          <Text style={styles.subtitle}>Your personal budget assistant</Text>
        </View>
        <View style={styles.onlineDot} />
      </View>

      <View style={styles.conversation}>
        {messages.map((message) => {
          const isUser = message.role === 'user'
          return (
            <View
              key={message.id}
              style={[styles.messageRow, isUser && styles.userMessageRow]}
            >
              {!isUser && (
                <View style={styles.botAvatar}>
                  <Bot size={14} color="#c4a7ff" />
                </View>
              )}
              <View
                style={[
                  styles.bubble,
                  isUser ? styles.userBubble : styles.assistantBubble,
                  message.error && styles.errorBubble,
                ]}
              >
                <Text style={[styles.messageText, isUser && styles.userMessageText]}>
                  {message.text}
                </Text>
              </View>
            </View>
          )
        })}

        {sending && (
          <View style={styles.typingRow}>
            <ActivityIndicator size="small" color="#a78bfa" />
            <Text style={styles.typingText}>AI Budget Saver is thinking...</Text>
          </View>
        )}
      </View>

      <View style={styles.suggestions}>
        {SUGGESTIONS.map((suggestion) => (
          <Pressable
            key={suggestion}
            onPress={() => sendMessage(suggestion)}
            disabled={sending}
            style={({ pressed }) => [styles.suggestion, pressed && { opacity: 0.65 }]}
          >
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </Pressable>
        ))}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Ask AI Budget Saver..."
            placeholderTextColor={colors.gray500}
            multiline
            maxLength={1200}
            editable={!sending}
            returnKeyType="send"
            blurOnSubmit
            onSubmitEditing={() => sendMessage()}
            style={styles.input}
          />
          <Pressable
            onPress={() => sendMessage()}
            disabled={!draft.trim() || sending}
            accessibilityRole="button"
            accessibilityLabel="Send message"
            style={({ pressed }) => [
              styles.sendButton,
              (!draft.trim() || sending) && styles.sendDisabled,
              pressed && { opacity: 0.75 },
            ]}
          >
            {sending
              ? <ActivityIndicator size="small" color="#ffffff" />
              : <Send size={17} color="#ffffff" />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Text style={styles.disclaimer}>
        AI responses may be unavailable when the provider quota is reached.
      </Text>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#191720',
    borderColor: '#46365f',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 15,
    paddingVertical: 14,
    backgroundColor: '#211c2d',
    borderBottomWidth: 1,
    borderBottomColor: '#382c4b',
  },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#392b55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1 },
  title: { color: colors.white, fontSize: 14, fontWeight: '700' },
  subtitle: { color: colors.gray500, fontSize: 11, marginTop: 2 },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34d399',
  },
  conversation: { padding: 14, gap: 12 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 7 },
  userMessageRow: { justifyContent: 'flex-end' },
  botAvatar: {
    width: 25,
    height: 25,
    borderRadius: 9,
    backgroundColor: '#392b55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '88%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 13,
  },
  assistantBubble: {
    backgroundColor: '#24232b',
    borderWidth: 1,
    borderColor: '#34313d',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#392852',
    borderBottomRightRadius: 4,
  },
  errorBubble: {
    borderColor: 'rgba(248,113,113,0.35)',
  },
  messageText: {
    color: '#d1d5db',
    fontSize: 13,
    lineHeight: 19,
  },
  userMessageText: { color: '#f5f3ff' },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 32 },
  typingText: { color: '#9b8bb8', fontSize: 11 },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    paddingHorizontal: 13,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: '#302b39',
  },
  suggestion: {
    borderWidth: 1,
    borderColor: '#393442',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  suggestionText: { color: '#aaa3b8', fontSize: 11 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    margin: 13,
    marginBottom: 8,
    padding: 8,
    minHeight: 56,
    borderWidth: 1,
    borderColor: '#8060b0',
    borderRadius: 13,
    backgroundColor: '#141219',
  },
  input: {
    flex: 1,
    color: colors.white,
    fontSize: 14,
    lineHeight: 20,
    maxHeight: 100,
    minHeight: 36,
    paddingHorizontal: 5,
    paddingVertical: 7,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#6542a0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.4 },
  disclaimer: {
    color: '#71677f',
    fontSize: 9,
    textAlign: 'center',
    paddingHorizontal: 12,
    paddingBottom: 11,
  },
})
