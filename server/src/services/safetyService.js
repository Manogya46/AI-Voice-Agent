const safetyRules = [
  {
    key: 'fire',
    test: (text) => /\bfire\b/i.test(text),
    recommendation: 'Stop using the vehicle, move to a safe location if you can do so safely, and arrange urgent professional assistance.',
  },
  {
    key: 'smoke',
    test: (text) => /\bsmoke\b/i.test(text),
    recommendation: 'Stop in a safe location, switch off the engine, do not continue driving, and arrange urgent professional assistance.',
  },
  {
    key: 'fuel-leakage',
    test: (text) => /(?:petrol|fuel|gasoline).*(?:leak|leaking|leakage|liquid)|(?:leak|leaking|liquid).*(?:petrol|fuel|gasoline)/i.test(text),
    recommendation: 'Stop using the vehicle and do not drive it. Fuel leakage is an immediate safety concern; arrange urgent professional assistance.',
  },
  {
    key: 'severe-overheating',
    test: (text) => /(?:steam|boiling coolant|temperature.{0,20}(?:red|high|hot)|overheat(?:ing)?)/i.test(text),
    recommendation: 'Stop somewhere safe and switch off the engine. Do not open the radiator or coolant cap while it is hot. Arrange professional inspection.',
  },
  {
    key: 'brake-failure',
    test: (text) => /(?:brake|braking|break|breaking).{0,50}(?:very soft|spongy|not stopping|stopping properly|reduced|poor|failure|significant loss|major loss|substantial loss)|(?:very soft|spongy).{0,30}(?:brake|break)|(?:not stopping|stopping properly).{0,30}(?:brake|break)|(?:significant|major|substantial|severe)\s+(?:loss|reduction)\s+of\s+(?:braking|breaking|brake|break)(?:\s+performance)?|(?:significant|major|substantial|severe)\s+(?:brake|braking|break|breaking)\s+(?:issue|problem|failure)/i.test(text),
    recommendation: 'This is an urgent brake safety issue. Park or stop the vehicle in a safe location as soon as it is safe to do so, avoid continued driving, and arrange urgent professional assistance. Do not attempt a brake repair.',
  },
  {
    key: 'flashing-engine-warning',
    test: (text) => /(?:flashing|blinking).{0,30}(?:check engine|engine warning)|(?:check engine|engine warning).{0,30}(?:flashing|blinking)/i.test(text) && /(?:shak|rough|misfir|loss of power|stall)/i.test(text),
    recommendation: 'Treat the flashing warning light and severe running problem as urgent. Avoid continued driving where possible and arrange professional assistance.',
  },
  {
    key: 'tyre-safety',
    test: (text) => /(?:\b(?:tyre|tire|tired)\b.{0,60}\b(?:cords?|codes?|wires?)\b|\b(?:cords?|codes?|wires?)\b.{0,60}\b(?:tyre|tire|tired)\b|\b(?:see|visible|exposed|showing)\b.{0,40}\b(?:cords?|codes?|wires?)\b|tyre bulge|tire bulge|significantly deflated|major tyre damage|major tire damage)/i.test(text),
    recommendation: 'Do not continue driving with significant tyre damage. Arrange urgent professional assistance.',
  },
  {
    key: 'steering-failure',
    test: (text) => /(?:major|loss of|no|cannot control).{0,20}steering|steering.{0,50}(?:failure|unsafe|loose|cannot control|isn't working|is not working|not working|doesn't work|not responding|difficult to control|hard to control)/i.test(text),
    recommendation: 'Stop using the vehicle if steering control is unsafe and arrange immediate professional assistance.',
  },
  {
    key: 'electrical-hazard',
    test: (text) => /(?:melted wiring|visible electrical damage|burning electrical|electrical).{0,30}(?:smell|damage|burning)/i.test(text),
    recommendation: 'Stop using the vehicle and arrange professional assistance. Do not attempt to repair electrical wiring yourself.',
  },
  {
    key: 'burning-smell-with-risk',
    test: (text) => /burning smell/i.test(text) && /(?:smoke|leak|fluid|fire)/i.test(text),
    recommendation: 'Stop using the vehicle and arrange urgent professional assistance. Do not continue troubleshooting a possible fire or fluid hazard.',
  },
];

export const detectSafetyIssue = (inputText = '') => {
  const normalizedText = String(inputText).toLowerCase();
  const matches = safetyRules.filter((rule) => rule.test(normalizedText));

  if (matches.length === 0) {
    return {
      hasSafetyIssue: false,
      safetyLevel: 'normal',
      matches: [],
      recommendation: 'Continue with a standard assessment and ask targeted follow-up questions.',
    };
  }

  return {
    hasSafetyIssue: true,
    safetyLevel: 'urgent',
    matches: matches.map((rule) => ({ key: rule.key, level: 'urgent' })),
    recommendation: matches[0].recommendation,
  };
};

export const buildSafetyResponse = (safetyCheck) => ({
  message: safetyCheck.recommendation,
  assessmentCategory: 'safety',
  possibleCauses: [],
  followUpQuestions: [],
  customerInformationNeeded: [],
  safetyLevel: 'urgent',
  recommendation: safetyCheck.recommendation,
  assessmentComplete: true,
});
