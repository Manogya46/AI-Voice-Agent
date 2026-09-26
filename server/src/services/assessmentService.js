import Assessment from '../models/Assessment.js';
import Conversation from '../models/Conversation.js';
import Customer from '../models/Customer.js';
import Vehicle from '../models/Vehicle.js';
import { buildSafetyResponse, detectSafetyIssue } from './safetyService.js';
import { getRelevantKnowledge } from './knowledgeBaseService.js';
import { extractInformationFromMessage } from './informationExtractionService.js';
import {
  advanceAssessmentState,
  buildTransmissionSafetyResponse,
} from './assessmentStateService.js';

export const createConversation = async ({
  customerName,
  vehicleMake,
} = {}) => {
  const customer = await Customer.create({
    fullName: customerName || '',
  });

  const vehicle = await Vehicle.create({
    make: vehicleMake || '',
  });

  const conversation = await Conversation.create({
    customer: customer._id,
    vehicle: vehicle._id,
    status: 'new',
    messages: [
      {
        role: 'assistant',
        content:
          'Hi, I am your voice service assistant. Tell me what is happening with your vehicle, and I will ask the questions needed for a safe initial assessment.',
        metadata: { category: 'customer-info', safetyLevel: 'normal' },
      },
    ],
  });

  return conversation;
};

export const getConversationById = async (conversationId) => {
  const conversation = await Conversation.findById(conversationId)
    .populate('customer')
    .populate('vehicle')
    .populate('assessment')
    .lean();

  if (!conversation) {
    const error = new Error('Conversation not found');
    error.statusCode = 404;
    error.code = 'CONVERSATION_NOT_FOUND';
    throw error;
  }

  return conversation;
};

export const processCustomerMessage = async (conversationId, userMessage) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    const error = new Error('Conversation not found');
    error.statusCode = 404;
    error.code = 'CONVERSATION_NOT_FOUND';
    throw error;
  }

  const cleanedMessage = String(userMessage || '').trim();
  if (!cleanedMessage) {
    const error = new Error('Message is required');
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const previousCustomerMessages = conversation.messages
    .filter((message) => message.role === 'user')
    .map((message) => message.content)
    .join(' ');
  const assessmentContext = `${previousCustomerMessages} ${cleanedMessage}`;
  const currentMessageSafetyCheck = detectSafetyIssue(cleanedMessage);
  const safetyCheck = currentMessageSafetyCheck.hasSafetyIssue
    ? currentMessageSafetyCheck
    : detectSafetyIssue(assessmentContext);
  console.log('[SAFETY CHECK]', {
    transcript: cleanedMessage,
    messageLength: cleanedMessage.length,
    hasSafetyIssue: safetyCheck.hasSafetyIssue,
    matches: safetyCheck.matches.map(({ key }) => key),
  });
  const relevantKnowledge = getRelevantKnowledge(cleanedMessage);
  const assessmentCategory =
    conversation.assessmentState?.category || relevantKnowledge[0]?.category || 'customer-info';

  const extractedInformation = extractInformationFromMessage(cleanedMessage);
  const customer = conversation.customer
    ? await Customer.findById(conversation.customer)
    : await Customer.create({});
  const vehicle = conversation.vehicle
    ? await Vehicle.findById(conversation.vehicle)
    : await Vehicle.create({});

  Object.assign(customer, extractedInformation.customer);
  Object.assign(vehicle, extractedInformation.vehicle);
  if (!vehicle.primaryComplaint) {
    vehicle.primaryComplaint = cleanedMessage.slice(0, 500);
  }

  await Promise.all([customer.save(), vehicle.save()]);
  conversation.customer = customer._id;
  conversation.vehicle = vehicle._id;

  const previousCustomerTurnExists = conversation.messages.some(
    (message) => message.role === 'user'
  );
  const stateResult = advanceAssessmentState({
    previousState: conversation.assessmentState,
    category: assessmentCategory,
    message: cleanedMessage,
    isFirstMessage: !previousCustomerTurnExists,
    customerInformation: customer.toObject(),
    vehicleInformation: vehicle.toObject(),
  });
  console.log('[ASSESSMENT STATE]', {
    messageLength: cleanedMessage.length,
    category: assessmentCategory,
    pendingQuestion: conversation.assessmentState?.pendingQuestionKey || null,
    nextQuestion: stateResult.state.pendingQuestionKey || null,
    responseLength: stateResult.response?.message?.length || 0,
  });
  const transmissionSafetyResponse = buildTransmissionSafetyResponse(
    stateResult.state
  );
  const aiResponse = safetyCheck.hasSafetyIssue
    ? buildSafetyResponse(safetyCheck)
    : transmissionSafetyResponse || stateResult.response;
  const category =
    aiResponse.assessmentCategory || relevantKnowledge[0]?.category || 'customer-info';

  conversation.messages.push({
    role: 'user',
    content: cleanedMessage,
    timestamp: new Date(),
  });

  conversation.messages.push({
    role: 'assistant',
    content: aiResponse.message,
    timestamp: new Date(),
    metadata: {
      category,
      safetyLevel:
        aiResponse.safetyLevel || safetyCheck.safetyLevel || 'normal',
    },
  });

  conversation.currentAssessmentCategory = category;
  conversation.assessmentState = stateResult.state;
  conversation.safetyLevel = safetyCheck.hasSafetyIssue
    ? safetyCheck.safetyLevel
    : aiResponse.safetyLevel || 'normal';
  conversation.assessmentComplete = Boolean(aiResponse.assessmentComplete);
  conversation.status = conversation.assessmentComplete
    ? 'complete'
    : aiResponse.followUpQuestions.length > 0
      ? 'awaiting_info'
      : 'in_progress';

  const assessment = await Assessment.findOneAndUpdate(
    { conversation: conversation._id },
    {
      conversation: conversation._id,
      category,
      possibleCauses: aiResponse.possibleCauses,
      recommendation: aiResponse.recommendation,
      safetyLevel: conversation.safetyLevel,
      assessmentComplete: conversation.assessmentComplete,
      summary: aiResponse.message,
      requiredCustomerInformation: aiResponse.customerInformationNeeded,
      requiredVehicleInformation: aiResponse.followUpQuestions,
    },
    { upsert: true, new: true }
  );

  conversation.assessment = assessment._id;
  await conversation.save();

  return {
    conversationId: conversation._id,
    response: aiResponse,
    latestMessage: aiResponse.message,
    conversation,
  };
};

export const updateCustomerInfo = async (conversationId, details) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    const error = new Error('Conversation not found');
    error.statusCode = 404;
    error.code = 'CONVERSATION_NOT_FOUND';
    throw error;
  }

  const customer = conversation.customer
    ? await Customer.findById(conversation.customer)
    : await Customer.create({});

  Object.entries(details || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      customer[key] = value;
    }
  });

  await customer.save();
  conversation.customer = customer._id;
  await conversation.save();

  return { success: true, customer };
};

export const updateVehicleInfo = async (conversationId, details) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    const error = new Error('Conversation not found');
    error.statusCode = 404;
    error.code = 'CONVERSATION_NOT_FOUND';
    throw error;
  }

  const vehicle = conversation.vehicle
    ? await Vehicle.findById(conversation.vehicle)
    : await Vehicle.create({});

  Object.entries(details || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      vehicle[key] = value;
    }
  });

  await vehicle.save();
  conversation.vehicle = vehicle._id;
  await conversation.save();

  return { success: true, vehicle };
};
