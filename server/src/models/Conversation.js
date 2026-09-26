import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      category: String,
      safetyLevel: String,
    },
  },
  { _id: true }
);

const conversationSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
    },
    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
      default: null,
    },
    status: {
      type: String,
      enum: ['new', 'in_progress', 'awaiting_info', 'complete'],
      default: 'new',
    },
    currentAssessmentCategory: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    safetyLevel: {
      type: String,
      enum: ['normal', 'caution', 'urgent'],
      default: 'normal',
    },
    assessmentComplete: {
      type: Boolean,
      default: false,
    },
    assessmentState: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({
        category: null,
        pendingQuestionKey: null,
        askedQuestionKeys: [],
        answeredQuestionKeys: [],
        facts: {},
      }),
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ createdAt: -1 });

export default mongoose.model('Conversation', conversationSchema);
