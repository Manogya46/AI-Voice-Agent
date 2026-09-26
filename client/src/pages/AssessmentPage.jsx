import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { SafetyAlert } from '../components/SafetyAlert.jsx';
import { LoadingIndicator } from '../components/LoadingIndicator.jsx';
import { ErrorMessage } from '../components/ErrorMessage.jsx';
import { VoiceButton } from '../components/VoiceButton.jsx';
import {
  createConversation,
  getConversation,
  sendMessage,
} from '../services/conversationService.js';

function AssessmentPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const spokenMessageRef = useRef('');
  const latestAssistantMessage = conversation?.messages
    ?.slice()
    .reverse()
    .find((message) => message.role === 'assistant')?.content;
  const assessmentStatus =
    conversation?.status === 'complete'
      ? { className: 'complete', label: 'Complete' }
      : conversation?.status === 'in_progress'
        ? { className: 'in_progress', label: 'In progress' }
        : { className: 'pending', label: 'Pending' };

  const startNewSession = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await createConversation();
      const newConversationId =
        result.conversation?.id || result.conversation?._id;
      navigate(`/assessment/${newConversationId}`, { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to start a new voice session.');
      setLoading(false);
    }
  };

  const refreshConversation = async () => {
    try {
      setLoading(true);
      const result = await getConversation(conversationId);
      setConversation(result.conversation || result);
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load this assessment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (conversationId) {
      const navigation = performance.getEntriesByType('navigation')[0];
      const reloadHandled = sessionStorage.getItem('voiceReloadHandled');

      if (navigation?.type === 'reload' && reloadHandled !== 'true') {
        sessionStorage.setItem('voiceReloadHandled', 'true');
        void startNewSession();
        return;
      }

      sessionStorage.removeItem('voiceReloadHandled');
      refreshConversation();
    }
  }, [conversationId]);

  useEffect(() => {
    const latestMessage = conversation?.messages?.slice(-1)[0];
    const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

    if (
      !latestMessage ||
      latestMessage.role !== 'assistant' ||
      spokenMessageRef.current === latestMessage._id ||
      !canSpeak
    ) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(latestMessage.content);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
    spokenMessageRef.current = latestMessage._id;
  }, [conversation]);

  const submitMessage = async (messageToSend) => {
    const trimmedMessage = messageToSend.trim();
    if (!trimmedMessage || sending) {
      return;
    }

    console.log('[VOICE API] Submitting transcript:', {
      length: trimmedMessage.length,
    });
    setSending(true);
    setError('');

    try {
      const result = await sendMessage(conversationId, trimmedMessage);
      const nextConversation = result.conversation || conversation;
      setConversation(nextConversation);
      console.log('[VOICE API] Assistant response received:', {
        length: result.latestMessage?.length || 0,
        hasConversation: Boolean(result.conversation),
      });
    } catch (err) {
      console.error('[VOICE API] Message submission failed:', err);
      setError(err.message || 'Message could not be sent.');
    } finally {
      setSending(false);
    }
  };

  const handleVoiceTranscript = (transcript) => {
    void submitMessage(transcript);
  };

  if (loading) {
    return (
      <div className="app-shell">
        <LoadingIndicator message="Loading the assessment conversation..." />
      </div>
    );
  }

  if (error && !conversation) {
    return (
      <div className="app-shell">
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="assessment-header">
        <h1 className="page-title">Tell me what your car is doing?</h1>
        <button className="secondary-button" onClick={startNewSession} disabled={loading || sending}>
          New voice session
        </button>
      </header>

      <nav className="session-nav" aria-label="Assessment pages">
        <Link className="session-link active" to={`/assessment/${conversationId}`}>
          Voice Assessment
        </Link>
        <Link className="session-link" to={`/assessment/${conversationId}/summary`}>
          Assessment Summary
        </Link>
      </nav>

      {conversation?.safetyLevel === 'urgent' && (
        <SafetyAlert message="This issue appears safety-critical. Stop using the vehicle and seek professional help if needed." />
      )}

      <div className="layout-grid">
        <section className="chat-box">
          <div className="voice-stage">
            <div className="voice-stage-copy">
              <p>
                Let’s start with a few details about your car, then I’ll ask a couple of questions to get a better idea of the issue.
              </p>
            </div>
            <VoiceButton
              onTranscript={handleVoiceTranscript}
              disabled={sending}
            />
            <p className="voice-status">
              {sending
                ? 'Your assistant is thinking...'
                : 'Press Start speaking and allow microphone access.'}
            </p>
          </div>
          {error && <ErrorMessage message={error} />}
        </section>

        <aside className="voice-sidebar panel">
          <span className="eyebrow">Assessment status</span>
          <h3>Safety comes first</h3>
          <span className={`badge status-badge ${assessmentStatus.className}`}>
            {assessmentStatus.label}
          </span>
          <span className={`badge ${conversation?.safetyLevel || 'normal'}`}>
            {conversation?.safetyLevel || 'normal'}
          </span>
          {conversation?.assessmentComplete && (
            <p className="assessment-result">
              {latestAssistantMessage || 'The assessment is complete.'}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

export default AssessmentPage;
