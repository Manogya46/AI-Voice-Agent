import { Navigate, Route, Routes } from 'react-router-dom';

import LandingPage from './pages/LandingPage.jsx';
import AssessmentPage from './pages/AssessmentPage.jsx';
import SummaryPage from './pages/SummaryPage.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/assessment/:conversationId" element={<AssessmentPage />} />
      <Route
        path="/assessment/:conversationId/summary"
        element={<SummaryPage />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
