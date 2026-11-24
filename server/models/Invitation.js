import mongoose from 'mongoose';

const rsvpSchema = new mongoose.Schema(
  {
    guestName: {
      type: String,
      required: true,
      trim: true,
    },
    attending: {
      type: Boolean,
      required: true,
    },
    guestsCount: {
      type: Number,
      default: 1,
      min: 0,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const invitationSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    templateId: {
      type: String,
      default: 'Minimalist',
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'expired'],
      default: 'draft',
    },
    eventData: {
      eventType: { type: String, default: 'wedding' },
      title: { type: String, required: true },
      hosts: [{ type: String }],
      eventDate: { type: Date, required: true },
      dressCode: { type: String, default: 'Elegante' },
      musicUrl: { type: String, default: '' },
      coverImage: { type: String, default: '' },
      galleryImages: [{ type: String }],
      welcomeMessage: { type: String, default: '' },
    },
    locations: {
      ceremony: {
        title: String,
        address: String,
        mapUrl: String,
        time: String,
      },
      party: {
        title: String,
        address: String,
        mapUrl: String,
        time: String,
      },
    },
    giftRegistry: {
      enabled: { type: Boolean, default: false },
      bankName: String,
      cbu: String,
      alias: String,
      holderName: String,
    },
    rsvps: [rsvpSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Invitation', invitationSchema);