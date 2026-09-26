import mongoose from 'mongoose';

const assessmentSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    category: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    possibleCauses: {
      type: [String],
      default: [],
    },
    recommendation: {
      type: String,
      trim: true,
      maxlength: 800,
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
    summary: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    requiredCustomerInformation: {
      type: [String],
      default: [],
    },
    requiredVehicleInformation: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model('Assessment', assessmentSchema);
