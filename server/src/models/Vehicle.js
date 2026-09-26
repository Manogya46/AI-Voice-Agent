import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    make: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    model: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    year: {
      type: Number,
      min: 1900,
      max: 2100,
    },
    registrationNumber: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 30,
    },
    vin: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 60,
    },
    mileage: {
      type: Number,
      min: 0,
    },
    primaryComplaint: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    issueStarted: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    issuePattern: {
      type: String,
      enum: ['constant', 'intermittent', 'unknown'],
      default: 'unknown',
    },
    warningLights: {
      type: [String],
      default: [],
    },
    recentRepairs: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    isDrivable: {
      type: Boolean,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Vehicle', vehicleSchema);
