import mongoose from 'mongoose';

const guestSchema = new mongoose.Schema(
  {
    invitationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invitation',
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    attending: {
      type: Boolean,
      required: true,
    },
    companions: {
      type: Number,
      default: 0,
      min: 0,
    },
    dietaryRestrictions: {
      type: String,
      default: '',
      trim: true,
    },
    songRequest: {
      type: String,
      default: '',
      trim: true,
    },
    message: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Guest', guestSchema);