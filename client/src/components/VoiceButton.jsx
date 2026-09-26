
import { useEffect, useRef, useState } from 'react';

function VoiceButton({ onTranscript, disabled = false }) {
  const recognitionRef = useRef(null);
  const onTranscriptRef = useRef(onTranscript);
  const resultReceivedRef = useRef(false);
  const transcriptRef = useRef('');

  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Voice input is not supported by this browser.');
      return undefined;
    }

    const recognition = new SpeechRecognition();

    // Listen for one voice input at a time.
    recognition.continuous = false;

    // Keep interim text so short answers are not lost before the final event.
    recognition.interimResults = true;

    // Use the broadly supported locale for the browser speech service.
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('[VOICE] Speech recognition started');

      resultReceivedRef.current = false;
      transcriptRef.current = '';
      setError('');
      setIsListening(true);
    };

    recognition.onaudiostart = () => {
      console.log('[VOICE] Microphone audio started');
    };

    recognition.onspeechstart = () => {
      console.log('[VOICE] Speech detected');
    };

    recognition.onspeechend = () => {
      console.log('[VOICE] Speech ended');
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || '')
        .join(' ')
        .trim();

      const finalTranscript = Array.from(event.results)
        .filter((result) => result.isFinal)
        .map((result) => result[0]?.transcript || '')
        .join(' ')
        .trim();

      console.log('[VOICE STT RESULT]:', {
        transcript,
        finalTranscript,
      });

      if (transcript) {
        resultReceivedRef.current = true;
        transcriptRef.current = transcript;
      }
    };

    recognition.onnomatch = () => {
      console.warn('[VOICE STT] Speech was not recognized');
      setError('Speech was not recognized. Please try again.');
    };

    recognition.onerror = (event) => {
      console.error('[VOICE STT ERROR]:', event.error, event);

      let message = 'Voice input could not be started.';

      switch (event.error) {
        case 'not-allowed':
        case 'service-not-allowed':
          message = 'Microphone permission was denied.';
          break;

        case 'no-speech':
          message = 'No speech was detected. Please try again.';
          break;

        case 'audio-capture':
          message = 'No microphone could be detected.';
          break;

        case 'network':
          message = 'Speech recognition needs a network connection.';
          break;

        case 'aborted':
          message = 'Voice input was stopped.';
          break;

        default:
          message = 'Voice input could not be processed. Please try again.';
      }

      setError(message);
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('[VOICE] Speech recognition ended');

      const transcript = transcriptRef.current.trim();
      if (transcript) {
        console.log('[VOICE STT TRANSCRIPT]:', transcript);
        onTranscriptRef.current?.(transcript);
      } else {
        setError('No speech result was received. Please speak after listening starts and try again.');
      }
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  const handleClick = async () => {
    if (disabled) {
      return;
    }

    if (!recognitionRef.current) {
      setError('Voice input is not supported by this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      return;
    }

    setError('');

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const microphone = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        microphone.getTracks().forEach((track) => track.stop());
        console.log('[VOICE] Microphone permission confirmed');
      }

      console.log('[VOICE] Starting speech recognition...');

      recognitionRef.current.start();
    } catch (error) {
      console.error('[VOICE] Failed to start speech recognition:', error);

      setError(
        error.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Allow microphone access and try again.'
          : error.name === 'NotFoundError'
            ? 'No microphone was found. Connect a microphone and try again.'
            : 'Voice input could not be started. Please try again.'
      );
      setIsListening(false);
    }
  };

  return (
    <span className="voice-control">
      <button
        className={`secondary-button ${isListening ? 'listening' : ''}`}
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
      >
        {isListening ? 'Stop listening' : 'Start speaking'}
      </button>

      {error && <span className="voice-error">{error}</span>}
    </span>
  );
}

export { VoiceButton };

