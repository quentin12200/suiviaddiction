import { useState, useEffect, useCallback } from 'react'

interface UseSpeechRecognitionOptions {
  onResult: (transcript: string) => void
  onError?: (error: string) => void
  continuous?: boolean
  language?: string
}

interface UseSpeechRecognitionReturn {
  isListening: boolean
  isSupported: boolean
  startListening: () => void
  stopListening: () => void
  transcript: string
}

export function useSpeechRecognition({
  onResult,
  onError,
  continuous = false,
  language = 'fr-FR',
}: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [recognition, setRecognition] = useState<any>(null)

  useEffect(() => {
    // Vérifier si le navigateur supporte la reconnaissance vocale
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition

      if (SpeechRecognition) {
        console.log('✅ Reconnaissance vocale supportée!')
        setIsSupported(true)

        const recognitionInstance = new SpeechRecognition()
        recognitionInstance.continuous = continuous
        recognitionInstance.interimResults = true
        recognitionInstance.lang = language

        recognitionInstance.onstart = () => {
          console.log('🎤 Reconnaissance vocale démarrée')
          setIsListening(true)
        }

        recognitionInstance.onresult = (event: any) => {
          let interimTranscript = ''
          let finalTranscript = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPiece = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcriptPiece + ' '
            } else {
              interimTranscript += transcriptPiece
            }
          }

          const currentTranscript = finalTranscript || interimTranscript
          setTranscript(currentTranscript)

          // Si on a un résultat final, l'envoyer
          if (finalTranscript) {
            onResult(finalTranscript.trim())
          }
        }

        recognitionInstance.onerror = (event: any) => {
          console.error('❌ Erreur reconnaissance vocale:', event.error)

          // En mode continu, ignorer l'erreur "no-speech" car les pauses sont normales
          if (continuous && event.error === 'no-speech') {
            console.log('ℹ️ Pause détectée (mode continu) - c\'est normal!')
            return
          }

          setIsListening(false)

          const errorMessages: Record<string, string> = {
            'no-speech': 'Aucune voix détectée. Parle plus fort!',
            'audio-capture': 'Microphone non détecté. Vérifie tes paramètres.',
            'not-allowed': 'Accès au microphone refusé. Autorise-le dans ton navigateur.',
            'network': 'Erreur réseau. Vérifie ta connexion.',
            'aborted': 'Reconnaissance annulée.',
          }

          const errorMessage = errorMessages[event.error] || `Erreur: ${event.error}`

          if (onError) {
            onError(errorMessage)
          }
        }

        recognitionInstance.onend = () => {
          console.log('🎤 Reconnaissance vocale arrêtée')
          setIsListening(false)
        }

        setRecognition(recognitionInstance)
      } else {
        console.warn('⚠️ Reconnaissance vocale non supportée par ce navigateur')
        console.log('Navigateur détecté:', navigator.userAgent)
        setIsSupported(false)
      }
    } else {
      console.warn('⚠️ Pas de window (SSR)')
    }

    return () => {
      if (recognition) {
        recognition.stop()
      }
    }
  }, [language, continuous])

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      try {
        setTranscript('')
        recognition.start()
      } catch (error) {
        console.error('Erreur démarrage:', error)
        if (onError) {
          onError('Impossible de démarrer le microphone')
        }
      }
    }
  }, [recognition, isListening, onError])

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop()
    }
  }, [recognition, isListening])

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    transcript,
  }
}
