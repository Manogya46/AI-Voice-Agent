import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { AssessmentSummary } from '../components/AssessmentSummary.jsx';
import { ErrorMessage } from '../components/ErrorMessage.jsx';
import { LoadingIndicator } from '../components/LoadingIndicator.jsx';
import { getConversation } from '../services/conversationService.js';

function SummaryPage() {
  const { conversationId } = useParams();
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadConversation = async () => {
      try {
        const result = await getConversation(conversationId);
        setConversation(result.conversation || result);
      } catch (err) {
        setError(err.message || 'The summary could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [conversationId]);

  if (loading) {
    return (
      <div className="app-shell">
        <LoadingIndicator message="Loading assessment summary..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-shell">
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <nav className="session-nav" aria-label="Assessment pages">
        <span className="session-nav-label">Current session</span>
        <Link className="session-link" to={`/assessment/${conversationId}`}>
          Live voice assessment
        </Link>
        <Link className="session-link active" to={`/assessment/${conversationId}/summary`}>
          Assessment summary: customer and vehicle details
        </Link>
      </nav>
      <AssessmentSummary conversation={conversation} />
    </div>
  );
}

export default SummaryPage;
