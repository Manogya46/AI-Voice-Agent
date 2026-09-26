function AssessmentSummary({ conversation }) {
  const latestMessage =
    conversation?.messages?.slice(-1)[0]?.content ||
    'No final assessment message has been stored yet.';

  return (
    <div className="summary-card">
      <h1 className="page-title" style={{ marginBottom: '8px' }}>
        Assessment Summary
      </h1>
      <p className="page-subtitle">
        This overview is meant to support a professional inspection decision,
        not to replace a mechanic's diagnosis.
      </p>

      <div className="summary-grid">
        <div className="summary-item">
          <strong>Overall status</strong>
          <p>{conversation?.status || 'New'}</p>
        </div>
        <div className="summary-item">
          <strong>Current category</strong>
          <p>
            {conversation?.currentAssessmentCategory || 'Not yet identified'}
          </p>
        </div>
        <div className="summary-item">
          <strong>Safety Level</strong>
          <p>
            <span className={`badge ${conversation?.safetyLevel || 'normal'}`}>
              {conversation?.safetyLevel || 'normal'}
            </span>
          </p>
        </div>
      </div>

      <div className="summary-item" style={{ marginTop: '20px' }}>
        <strong>Latest assistant response</strong>
        <p>{latestMessage}</p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Customer snapshot</h3>
        <ul className="info-list">
          <li>
            <span className="info-label">Name</span>
            {conversation?.customer?.fullName || 'Not provided'}
          </li>
          <li>
            <span className="info-label">Phone</span>
            {conversation?.customer?.phoneNumber || 'Not provided'}
          </li>
          <li>
            <span className="info-label">Email</span>
            {conversation?.customer?.email || 'Not provided'}
          </li>
          <li>
            <span className="info-label">Service location</span>
            {conversation?.customer?.preferredServiceLocation || 'Not provided'}
          </li>
          <li>
            <span className="info-label">Service date</span>
            {conversation?.customer?.preferredServiceDate || 'Not provided'}
          </li>
        </ul>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Vehicle snapshot</h3>
        <ul className="info-list">
          <li>
            <span className="info-label">Make</span>
            {conversation?.vehicle?.make || 'Not provided'}
          </li>
          <li>
            <span className="info-label">Model</span>
            {conversation?.vehicle?.model || 'Not provided'}
          </li>
          <li>
            <span className="info-label">Year</span>
            {conversation?.vehicle?.year || 'Not provided'}
          </li>
          <li>
            <span className="info-label">Mileage</span>
            {conversation?.vehicle?.mileage || 'Not provided'}
          </li>
          <li>
            <span className="info-label">Registration</span>
            {conversation?.vehicle?.registrationNumber || 'Not provided'}
          </li>
          <li>
            <span className="info-label">VIN</span>
            {conversation?.vehicle?.vin || 'Not provided'}
          </li>
          <li>
            <span className="info-label">Primary complaint</span>
            {conversation?.vehicle?.primaryComplaint || 'Not provided'}
          </li>
          <li>
            <span className="info-label">Issue started</span>
            {conversation?.vehicle?.issueStarted || 'Not provided'}
          </li>
          <li>
            <span className="info-label">Issue pattern</span>
            {conversation?.vehicle?.issuePattern || 'Not provided'}
          </li>
          <li>
            <span className="info-label">Warning lights</span>
            {conversation?.vehicle?.warningLights?.join(', ') || 'Not provided'}
          </li>
          <li>
            <span className="info-label">Recent repair or accident</span>
            {conversation?.vehicle?.recentRepairs || 'Not provided'}
          </li>
          <li>
            <span className="info-label">Currently drivable</span>
            {conversation?.vehicle?.isDrivable === null || conversation?.vehicle?.isDrivable === undefined
              ? 'Not provided'
              : conversation.vehicle.isDrivable
                ? 'Yes'
                : 'No'}
          </li>
        </ul>
      </div>
    </div>
  );
}

export { AssessmentSummary };
