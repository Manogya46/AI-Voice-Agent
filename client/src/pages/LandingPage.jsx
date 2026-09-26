import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { createConversation } from '../services/conversationService.js';
import { ErrorMessage } from '../components/ErrorMessage.jsx';
import { LoadingIndicator } from '../components/LoadingIndicator.jsx';

function LandingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStartAssessment = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await createConversation();
      const conversationId =
        result.conversation?.id || result.conversation?._id;
      navigate(`/assessment/${conversationId}`);
    } catch (err) {
      setError(err.message || 'Unable to create a conversation right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="hero-card">
        <h1>Start Vehicle Assessment</h1>
        <p>
          Describe what is happening with your vehicle. This assistant does an
          initial assessment, asks focused questions, and helps decide whether a
          professional inspection is needed.
        </p>
        <div
          style={{
            marginTop: '20px',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          <button
            className="primary-button"
            onClick={handleStartAssessment}
            disabled={loading}
          >
            {loading ? 'Starting...' : 'Begin Assessment'}
          </button>
        </div>
        {loading && <LoadingIndicator message="Preparing your assessment..." />}
        {error && <ErrorMessage message={error} />}
      </div>
    </div>
  );
}

export default LandingPage;
