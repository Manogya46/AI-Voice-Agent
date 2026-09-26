import { env } from '../config/env.js';

let ollamaUnavailableUntil = 0;
let fallbackWarningShown = false;

const validateStructure = (response) => {
  if (!response || typeof response !== 'object') {
    throw new Error('AI response is malformed.');
  }

  return {
    message:
      typeof response.message === 'string'
        ? response.message
        : 'I need a bit more detail to assess the issue safely.',
    assessmentCategory:
      typeof response.assessmentCategory === 'string'
        ? response.assessmentCategory
        : 'customer-info',
    possibleCauses: Array.isArray(response.possibleCauses)
      ? response.possibleCauses
      : [],
    followUpQuestions: Array.isArray(response.followUpQuestions)
      ? response.followUpQuestions
      : [],
    customerInformationNeeded: Array.isArray(response.customerInformationNeeded)
      ? response.customerInformationNeeded
      : [],
    safetyLevel: ['normal', 'caution', 'urgent'].includes(response.safetyLevel)
      ? response.safetyLevel
      : 'normal',
    recommendation:
      typeof response.recommendation === 'string'
        ? response.recommendation
        : 'Please arrange inspection if the issue continues.',
    assessmentComplete: Boolean(response.assessmentComplete),
  };
};

const buildSystemPrompt = (relevantKnowledge) => {
  const knowledgeText = relevantKnowledge
    .map(
      (item) =>
        `Category: ${item.category}\nSymptoms: ${item.symptoms.join('; ')}\nQuestions: ${item.questions.join('; ')}\nGuidance: ${item.guidance.join('; ')}`
    )
    .join('\n\n');

  return `You are a professional car service initial assessment assistant.\n
Rules:\n1. Do not claim a definitive diagnosis.\n2. Use only the supplied knowledge base and customer-reported facts.\n3. Ask targeted follow-up questions when information is missing.\n4. Do not invent answers or promise a diagnosis.\n5. Prioritize safety.\n6. If a safety risk is reported, advise urgent professional assistance and avoid repair instructions.\n7. Clearly separate possible causes from confirmed causes.\n8. Keep responses concise and conversational because this is designed for voice use.\n9. Collect only relevant customer and vehicle information.\n10. End with a brief summary and next step.\n\nKnowledge base:\n${knowledgeText}\n\nReturn valid JSON only with this schema:\n{\n  "message": "short conversational reply",\n  "assessmentCategory": "one category name",\n  "possibleCauses": ["possible cause 1"],\n  "followUpQuestions": ["question 1"],\n  "customerInformationNeeded": ["info field"],\n  "safetyLevel": "normal|caution|urgent",\n  "recommendation": "brief recommendation",\n  "assessmentComplete": false\n}`;
};

const parseAiResponse = (rawResponse) => {
  const cleanedResponse = rawResponse.trim();

  try {
    return JSON.parse(cleanedResponse);
  } catch (error) {
    const startIndex = cleanedResponse.indexOf('{');
    const endIndex = cleanedResponse.lastIndexOf('}');

    if (startIndex !== -1 && endIndex > startIndex) {
      return JSON.parse(cleanedResponse.slice(startIndex, endIndex + 1));
    }

    throw new Error('AI response was not valid JSON.');
  }
};

const categoryGuidance = {
  engine: {
    causes: ['weak battery', 'starter-related issue'],
    questions: [
      'Do the dashboard lights appear to be working normally?',
      'When did this issue start?',
      'Does the engine crank or stay silent?',
      'Has the battery recently been replaced?',
    ],
    message: 'I will narrow this down safely. Do the dashboard lights appear to be working normally?',
  },
  battery: {
    causes: ['battery-related issue', 'electrical or charging issue'],
    questions: [
      'How old is the battery?',
      'Does this happen mainly after the vehicle has been parked for a long period?',
    ],
    message: 'The symptoms may be related to the battery or another electrical issue. How old is the battery?',
  },
  overheating: {
    causes: [],
    questions: ['Is the temperature warning active or is coolant visibly leaking?'],
    message: 'Overheating needs careful attention. Is the temperature warning active or is coolant visibly leaking?',
  },
  brakes: {
    causes: [],
    questions: ['Does the brake pedal feel soft or spongy, and is stopping distance reduced?'],
    message: 'Brake symptoms can affect safety. Does the pedal feel soft or spongy, and is stopping distance reduced?',
  },
  tyres: {
    causes: ['tyre, steering, or suspension-related issue'],
    questions: [
      'Does the shaking happen during braking, acceleration, turning, or only at that speed?',
      'Do you see tyre damage, a bulge, or uneven wear?',
    ],
    message: 'A steering-wheel shake can involve the tyres, steering, or suspension. Does it happen during braking, acceleration, turning, or only at that speed?',
  },
  'warning-light': {
    causes: ['an engine or electrical issue is possible'],
    questions: [
      'Is the check-engine light steady or flashing?',
      'Is the vehicle shaking, losing power, or stalling?',
    ],
    message: 'A warning light can have several causes. Is the check-engine light steady or flashing?',
  },
  transmission: {
    causes: ['a transmission or gear-selection issue is possible'],
    questions: [
      'Does the delay also happen when selecting Reverse?',
      'Are any other gears affected?',
    ],
    message: 'Delayed engagement is a symptom that should be inspected. Does the same delay happen when selecting Reverse?',
  },
  'air-conditioning': {
    causes: ['refrigerant, compressor, blower, cabin filter, or airflow issue'],
    questions: [
      'Does the blower work, and is the airflow weak or normal?',
      'Does cooling change with engine speed?',
    ],
    message: 'Several causes can affect cooling, including refrigerant, compressor, blower, or airflow issues. Does the blower work, and is the airflow weak or normal?',
  },
  'noise-smell': {
    causes: [],
    questions: [
      'Does the sound resemble squealing, grinding, knocking, rattling, or hissing?',
      'When do you notice it?',
    ],
    message: 'I do not want to guess from a vague noise. Does it sound like squealing, grinding, knocking, rattling, or hissing?',
  },
  'customer-info': {
    causes: [],
    questions: ['What is the make, model, and year of the vehicle?'],
    message: 'What is the make, model, and year of the vehicle?',
  },
};

const buildFallbackResponse = ({
  userMessage,
  relevantKnowledge,
  safetyCheck,
  customerInformation,
  vehicleInformation,
  conversationHistory,
}) => {
  const knowledge = relevantKnowledge[0];
  const reportedText = [
    userMessage,
    ...(conversationHistory || []).map((entry) => entry.content),
  ]
    .join(' ')
    .toLowerCase();
  const isClickingNoStart =
    reportedText.includes('click') &&
    /(?:not|doesn|isn|won).{0,20}start/.test(reportedText);
  const guidance = isClickingNoStart
    ? categoryGuidance.engine
    : categoryGuidance[knowledge?.category] || categoryGuidance['customer-info'];
  const missingVehicleDetails = ['make', 'model', 'year'].filter(
    (field) => !vehicleInformation?.[field]
  );
  const missingCustomerDetails = ['fullName', 'phoneNumber', 'email'].filter(
    (field) => !customerInformation?.[field]
  );
  const assistantHistory = (conversationHistory || [])
    .filter((entry) => entry.role === 'assistant')
    .map((entry) => entry.content.toLowerCase());
  const unansweredQuestions = guidance.questions.filter(
    (question) =>
      !assistantHistory.some((message) =>
        message.includes(question.toLowerCase())
      )
  );
  const followUpQuestions = [
    ...unansweredQuestions.slice(0, 2),
    ...(missingVehicleDetails.length > 0
      ? ['What is the make, model, and year of the vehicle?']
      : []),
  ].slice(0, 2);
  const nextQuestion = followUpQuestions[0];
  const message = isClickingNoStart
    ? `Clicking during a no-start can be consistent with a weak battery or a starter-related issue, but an inspection is required to confirm the cause. ${nextQuestion || ''}`.trim()
    : nextQuestion || guidance.message;

  return {
    message,
    assessmentCategory: isClickingNoStart
      ? 'engine'
      : knowledge?.category || 'customer-info',
    possibleCauses: guidance.causes,
    followUpQuestions,
    customerInformationNeeded: missingCustomerDetails,
    safetyLevel: safetyCheck?.safetyLevel || knowledge?.safetyLevel || 'normal',
    recommendation: 'This is an initial assessment only. A professional inspection is recommended to confirm the cause.',
    assessmentComplete: false,
  };
};

const shouldUseFallback = () => Date.now() < ollamaUnavailableUntil;

export const generateAssessmentResponse = async ({
  userMessage,
  conversationHistory,
  relevantKnowledge,
  customerInformation,
  vehicleInformation,
  safetyCheck,
}) => {
  if (!env.ollamaEnabled || shouldUseFallback()) {
    return buildFallbackResponse({
      userMessage,
      relevantKnowledge,
      safetyCheck,
      customerInformation,
      vehicleInformation,
      conversationHistory,
    });
  }

  const systemPrompt = buildSystemPrompt(relevantKnowledge);

  const contextBlock = conversationHistory
    .map((entry) => `${entry.role}: ${entry.content}`)
    .slice(-10)
    .join('\n');

  const customerInfoText = Object.entries(customerInformation || {})
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  const vehicleInfoText = Object.entries(vehicleInformation || {})
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  const userPrompt = `Customer message:\n${userMessage}\n\nSafety check:\n${JSON.stringify(safetyCheck, null, 2)}\n\nCustomer information:\n${customerInfoText || 'Not provided yet'}\n\nVehicle information:\n${vehicleInfoText || 'Not provided yet'}\n\nConversation history:\n${contextBlock || 'No previous messages yet'}\n\nRespond with the required JSON shape.`;

  try {
    const response = await fetch(`${env.ollamaBaseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(env.ollamaTimeoutMs),
      body: JSON.stringify({
        model: env.ollamaModel,
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        stream: false,
        format: 'json',
        think: false,
        options: {
          num_predict: 180,
          temperature: 0.2,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const rawText = payload?.response || '';
    const parsed = parseAiResponse(rawText);

    const validatedResponse = validateStructure(parsed);
    const previousAssistantMessages = conversationHistory
      .filter((entry) => entry.role === 'assistant')
      .map((entry) => entry.content.trim().toLowerCase());

    const repeatsPreviousMessage = previousAssistantMessages.includes(
      validatedResponse.message.trim().toLowerCase()
    );
    const asksForVehicleIdentity = /make.{0,30}model.{0,30}year/i.test(
      validatedResponse.message
    );
    const vehicleIdentityComplete = ['make', 'model', 'year'].every(
      (field) => vehicleInformation?.[field]
    );

    if (
      repeatsPreviousMessage ||
      (asksForVehicleIdentity && vehicleIdentityComplete)
    ) {
      return buildFallbackResponse({
        userMessage,
        relevantKnowledge,
        safetyCheck,
        customerInformation,
        vehicleInformation,
        conversationHistory,
      });
    }

    return validatedResponse;
  } catch (error) {
    ollamaUnavailableUntil =
      Date.now() + env.ollamaFallbackCooldownMs;
    if (env.ollamaEnabled && !fallbackWarningShown) {
      console.warn(
        `AI service fallback enabled for ${env.ollamaFallbackCooldownMs}ms: ${error.message}`
      );
      fallbackWarningShown = true;
      setTimeout(() => {
        fallbackWarningShown = false;
      }, env.ollamaFallbackCooldownMs);
    }
    return buildFallbackResponse({
      userMessage,
      relevantKnowledge,
      safetyCheck,
      customerInformation,
      vehicleInformation,
      conversationHistory,
    });
  }
};
