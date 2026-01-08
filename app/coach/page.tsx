'use client'

import { useState, useRef, useEffect } from 'react'
import Navigation from '../components/Navigation'
import styles from './coach.module.css'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Salut Quentin ! Je suis ton coach personnel. Je suis là pour t'accompagner dans ton parcours vers la liberté. Comment te sens-tu aujourd'hui ?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Préparer l'historique de conversation pour l'API
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          conversationHistory,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])
      } else {
        const errorMessage: Message = {
          role: 'assistant',
          content: "Désolé, j'ai eu un problème technique. Peux-tu réessayer ?",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Erreur envoi message:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: "Je rencontre des difficultés de connexion. Réessaie dans un instant.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const quickPrompts = [
    "J'ai une forte envie là maintenant",
    "Je viens de rechuter",
    "J'ai réussi à dire non !",
    "Je me sens découragé",
    "Comment gérer le stress ?",
  ]

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt)
  }

  return (
    <div>
      <Navigation />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>🤝 Coach Personnel</h1>
          <p className={styles.subtitle}>
            Ton accompagnement IA disponible 24/7
          </p>
        </div>

        <div className={styles.chatContainer}>
          <div className={styles.messages}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`${styles.message} ${
                  msg.role === 'user' ? styles.userMessage : styles.assistantMessage
                }`}
              >
                <div className={styles.messageContent}>
                  <div className={styles.messageText}>{msg.content}</div>
                  <div className={styles.messageTime}>
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className={`${styles.message} ${styles.assistantMessage}`}>
                <div className={styles.messageContent}>
                  <div className={styles.typing}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div className={styles.quickPrompts}>
              <p className={styles.quickPromptsLabel}>
                Suggestions rapides :
              </p>
              <div className={styles.quickPromptsGrid}>
                {quickPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    className={styles.quickPromptBtn}
                    onClick={() => handleQuickPrompt(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={styles.inputContainer}>
            <textarea
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Écris ton message ici... (Entrée pour envoyer)"
              rows={2}
              disabled={loading}
            />
            <button
              className={styles.sendButton}
              onClick={sendMessage}
              disabled={loading || !input.trim()}
            >
              {loading ? '⏳' : '📤'}
            </button>
          </div>
        </div>

        <div className={styles.disclaimer}>
          💡 Ce coach IA est un outil de soutien. En cas de crise ou besoin urgent,
          contacte un professionnel de santé.
        </div>
      </div>
    </div>
  )
}
