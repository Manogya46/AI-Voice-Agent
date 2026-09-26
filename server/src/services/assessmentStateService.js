const workflows = {
  engine: {
    possibleCauses: ['weak battery', 'starter-related issue'],
    questions: [
      ['engine.dashboardLights', 'Do the dashboard lights appear to be working normally?', 'dashboardLights'],
      ['engine.issueStarted', 'When did this issue start?', 'issueStarted'],
      ['engine.engineCranks', 'Does the engine crank, make a clicking sound, or stay silent?', 'engineCranks'],
      ['engine.batteryHistory', 'Has the battery recently been replaced?', 'batteryRecentlyReplaced'],
    ],
  },
  battery: {
    possibleCauses: ['battery-related issue', 'electrical or charging issue'],
    questions: [
      ['battery.age', 'How old is the battery?', 'batteryAge'],
      ['battery.parkingPattern', 'Does this happen mainly after the vehicle has been parked for a long period?', 'longParking'],
    ],
  },
  overheating: {
    possibleCauses: [],
    questions: [['overheating.coolant', 'Is there visible coolant loss or a temperature warning?', 'coolantOrWarning']],
  },
  brakes: {
    possibleCauses: [],
    questions: [['brakes.pedal', 'Does the brake pedal feel soft or spongy, and is stopping distance reduced?', 'pedalAndStopping']],
  },
  'warning-light': {
    possibleCauses: ['an engine or electrical issue is possible'],
    questions: [
      ['warning.lightState', 'Is the check-engine light steady or flashing?', 'lightState'],
      ['warning.running', 'Is the vehicle shaking, losing power, or stalling?', 'runningCondition'],
    ],
  },
  tyres: {
    possibleCauses: ['tyre, steering, or suspension-related issue'],
    questions: [
      ['tyres.drivingContext', 'Does the shaking happen during braking, acceleration, turning, or only at that speed?', 'drivingContext'],
      ['tyres.damage', 'Do you see tyre damage, a bulge, or uneven wear?', 'tyreDamage'],
    ],
  },
  'air-conditioning': {
    possibleCauses: ['refrigerant, compressor, blower, cabin filter, or airflow issue'],
    questions: [
      ['ac.blower', 'Does the blower work, and is the airflow weak or normal?', 'blowerAndAirflow'],
      ['ac.engineSpeed', 'Does cooling change with engine speed?', 'coolingWithEngineSpeed'],
    ],
  },
  'noise-smell': {
  possibleCauses: [],
  questions: [
    [
      'noise-smell.description',
      'What does the smell or noise resemble, and where does it seem to be coming from?',
      'description',
    ],
    [
      'noise-smell.timing',
      'Is the issue constant or only when the vehicle is in use?',
      'timing',
    ],
  ],
},
};

const defaultState = () => ({
  category: null,
  pendingQuestionKey: null,
  askedQuestionKeys: [],
  answeredQuestionKeys: [],
  facts: {},
});

const normalizeState = (state, category) => ({
  ...defaultState(),
  ...(state || {}),
  category: state?.category || category,
  askedQuestionKeys: [...(state?.askedQuestionKeys || [])],
  answeredQuestionKeys: [...(state?.answeredQuestionKeys || [])],
  facts: { ...(state?.facts || {}) },
});

const answerValue = (message) => {
  const normalized = message.toLowerCase().trim();
  if (/^(yes|yeah|yep|correct|that is right)[.!]?$/i.test(normalized)) return true;
  if (/^(no|nope|not really|negative)[.!]?$/i.test(normalized)) return false;
  return message.trim();
};

const applyTransmissionAnswer = (state, message) => {
  const normalized = message.toLowerCase();
  const facts = state.facts.transmission || {};

  if (state.pendingQuestionKey === 'transmission.shiftContext') {
    if (/reverse/.test(normalized)) facts.reverseAffected = true;
    if (/(park\s+to\s+drive|drive)/.test(normalized)) facts.driveAffected = true;
    if (/^(no|nope|not really)\b/.test(normalized)) facts.shiftContextConfirmed = false;
    else if (/\b(yes|yeah|correct)\b/.test(normalized) && !facts.reverseAffected && !facts.driveAffected) facts.shiftContextNeedsClarification = true;
    else facts.shiftContextConfirmed = true;
  }

  if (state.pendingQuestionKey === 'transmission.shiftContextClarifier') {
    if (/reverse/.test(normalized)) facts.reverseAffected = true;
    if (/drive/.test(normalized)) facts.driveAffected = true;
    facts.shiftContextNeedsClarification = false;
  }

  if (state.pendingQuestionKey === 'transmission.reverseControl') {
    if (/(trouble|difficulty|hard|cannot|can't|doesn't|not)\b.*(?:stay|maintain|hold|select)|(?:stay|maintain|hold).*(?:reverse|gear)/.test(normalized)) {
      facts.cannotMaintainGear = true;
    } else if (/^(no|nope)\b/.test(normalized)) {
      facts.cannotMaintainGear = false;
    } else {
      facts.reverseControlAnswer = message.trim();
    }
  }

  state.facts.transmission = facts;
};

const nextTransmissionQuestion = (state) => {
  const facts = state.facts.transmission || {};
  if (!state.answeredQuestionKeys.includes('transmission.shiftContext')) {
    return ['transmission.shiftContext', 'Does it happen in a particular gear, or when shifting from Park to Drive or Reverse?'];
  }
  if (facts.shiftContextNeedsClarification) {
    return ['transmission.shiftContextClarifier', 'Which shift is affected: Park to Drive, Park to Reverse, or both?'];
  }
  if (facts.reverseAffected && !state.answeredQuestionKeys.includes('transmission.reverseControl')) {
    return ['transmission.reverseControl', 'Are you able to select and maintain Reverse normally, or does the vehicle have difficulty staying in gear?'];
  }
  if (!facts.reverseAffected && !facts.driveAffected && !state.answeredQuestionKeys.includes('transmission.otherGear')) {
    return ['transmission.otherGear', 'Which gear is affected, and can the vehicle select and maintain that gear normally?'];
  }
  return [null, null];
};

const nextStandardQuestion = (state, category) => {
  const workflow = workflows[category] || workflows.engine;
  return workflow.questions.find(([key]) => !state.answeredQuestionKeys.includes(key)) || [null, null, null];
};

const missingVehicleIdentity = (vehicleInformation) =>
  ['make', 'model', 'year'].filter((field) => !vehicleInformation?.[field]);

const missingCustomerContact = (customerInformation) =>
  ['fullName', 'phoneNumber'].filter((field) => !customerInformation?.[field]);

const nextIntakeQuestion = ({ state, customerInformation, vehicleInformation }) => {
  const missingVehicleFields = missingVehicleIdentity(vehicleInformation);
  if (missingVehicleFields.length > 0) {
    return [
      'vehicle.identity',
      'Before I complete the assessment, please tell me the vehicle make, model, and year.',
      ['make', 'model', 'year'],
    ];
  }

  const missingCustomerFields = missingCustomerContact(customerInformation);
  if (missingCustomerFields.length > 0) {
    return [
      'customer.contact',
      'Please tell me your full name and the best phone number for the service team to contact you.',
      ['fullName', 'phoneNumber'],
    ];
  }

  if (!state.answeredQuestionKeys.includes('intake.optional')) {
    return [
      'intake.optional',
      'For the service record, please tell me anything not already covered: when the issue started, whether it is constant or intermittent, any warning lights, whether the vehicle is drivable, recent repair or accident details, approximate mileage, registration number or VIN, email address, and preferred service location or date.',
      [
        'issueStarted',
        'issuePattern',
        'warningLights',
        'isDrivable',
        'email',
        'registrationNumber',
        'vin',
        'mileage',
        'recentRepairs',
        'preferredServiceLocation',
        'preferredServiceDate',
      ],
    ];
  }

  return [null, null, []];
};

const nextNoiseSmellQuestion = (state, message) => {
  const normalizedMessage = message.toLowerCase();
  const hasSmell = /\b(smell|odou?r|burning|petrol|fuel|coolant|chemical)\b/.test(normalizedMessage);
  const hasSound = /\b(sound|noise|grinding|squealing|squeal|knocking|knock|rattling|rattle|hissing|hiss)\b/.test(normalizedMessage);

  const symptomQuestionAnswered = state.answeredQuestionKeys.some((key) =>
    ['noise.smellType', 'noise.soundType', 'noise.symptomType'].includes(key)
  );

  if (!symptomQuestionAnswered) {
    if (hasSmell && !hasSound) {
      return ['noise.smellType', 'What kind of smell do you notice, and where does it seem to be coming from?'];
    }
    if (hasSound && !hasSmell) {
      return ['noise.soundType', 'What does the sound resemble, such as squealing, grinding, knocking, rattling, or hissing?'];
    }
    return ['noise.symptomType', 'Do you notice a smell, a sound, or both, and where does it seem to be coming from?'];
  }

  if (!state.answeredQuestionKeys.includes('noise.when')) {
    return ['noise.when', 'When do you notice it: while starting, driving, braking, or at all times?'];
  }

  return [null, null];
};

export const advanceAssessmentState = ({
  previousState,
  category,
  message,
  isFirstMessage,
  customerInformation = {},
  vehicleInformation = {},
}) => {
  const state = normalizeState(previousState, category);
  const activeCategory = state.category || category;
  state.category = activeCategory;

  if (state.pendingQuestionKey && !isFirstMessage) {
    if (state.pendingQuestionKey.startsWith('transmission.')) {
      applyTransmissionAnswer(state, message);
    } else {
      const pendingQuestion = state.pendingQuestionKey.split('.').pop();
      state.facts[pendingQuestion] = answerValue(message);
    }
    if (!state.answeredQuestionKeys.includes(state.pendingQuestionKey)) {
      state.answeredQuestionKeys.push(state.pendingQuestionKey);
    }
    state.pendingQuestionKey = null;
  }

  const [nextKey, nextQuestion, factKey] = activeCategory === 'transmission'
    ? nextTransmissionQuestion(state)
    : activeCategory === 'noise-smell'
      ? nextNoiseSmellQuestion(state, message)
      : nextStandardQuestion(state, activeCategory);

  if (!nextKey) {
    const [intakeKey, intakeQuestion, intakeFields] = nextIntakeQuestion({
      state,
      customerInformation,
      vehicleInformation,
    });

    if (intakeKey) {
      state.pendingQuestionKey = intakeKey;
      if (!state.askedQuestionKeys.includes(intakeKey)) {
        state.askedQuestionKeys.push(intakeKey);
      }
      return {
        state,
        response: {
          message: intakeQuestion,
          assessmentCategory: activeCategory,
          possibleCauses: workflows[activeCategory]?.possibleCauses || [],
          followUpQuestions: [intakeQuestion],
          customerInformationNeeded: intakeFields,
          safetyLevel: 'normal',
          recommendation: 'Please provide the requested service details so the assessment can be completed.',
          assessmentComplete: false,
        },
      };
    }

    const possibleCauses = workflows[activeCategory]?.possibleCauses || [];
    const suggestionText = possibleCauses.length > 0
      ? `Possible causes may include ${possibleCauses.join(' or ')}, but none is confirmed without inspection.`
      : 'The reported symptoms do not confirm a specific mechanical cause without inspection.';

    return {
      state,
      response: {
        message: `Based on what you have told me, ${suggestionText} The recommended next step is a professional inspection.`,
        assessmentCategory: activeCategory,
        possibleCauses,
        followUpQuestions: [],
        customerInformationNeeded: [],
        safetyLevel: 'normal',
        recommendation: 'A professional inspection is recommended to confirm the cause.',
        assessmentComplete: true,
      },
    };
  }

  state.pendingQuestionKey = nextKey;
  if (!state.askedQuestionKeys.includes(nextKey)) state.askedQuestionKeys.push(nextKey);
  if (factKey && state.facts[factKey] === undefined) state.facts[factKey] = null;

  return {
    state,
    response: {
      message: nextQuestion,
      assessmentCategory: activeCategory,
      possibleCauses: workflows[activeCategory]?.possibleCauses || [],
      followUpQuestions: [nextQuestion],
      customerInformationNeeded: ['fullName', 'phoneNumber', 'email'],
      safetyLevel: 'normal',
      recommendation: 'This is an initial assessment only. A professional inspection is recommended to confirm the cause.',
      assessmentComplete: false,
    },
  };
};

export const buildTransmissionSafetyResponse = (state) => {
  if (state?.facts?.transmission?.cannotMaintainGear !== true) return null;
  return {
    message: 'If the vehicle cannot safely select or maintain Reverse, avoid continued driving and arrange professional assistance. This needs an inspection.',
    assessmentCategory: 'safety',
    possibleCauses: [],
    followUpQuestions: [],
    customerInformationNeeded: [],
    safetyLevel: 'urgent',
    recommendation: 'Avoid continued driving and arrange professional assistance.',
    assessmentComplete: true,
  };
};
