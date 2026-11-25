import mongoose from 'mongoose';
import crypto from 'crypto';

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
      default: 'Vintage',
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'expired'],
      default: 'draft',
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    hostToken: {
      type: String,
      default: () => crypto.randomBytes(24).toString('hex'),
    },
    hostContact: {
      name: { type: String, default: '', trim: true },
      whatsapp: { type: String, default: '', trim: true },
      email: { type: String, default: '', trim: true },
    },
    eventData: {
      eventType: { type: String, default: 'wedding' },
      title: { type: String, required: true },
      hosts: [{ type: String }],
      eventDate: { type: Date, required: true },
      rsvpDeadline: { type: Date },
      dressCode: { type: String, default: 'Elegante' },
      musicUrl: { type: String, default: '' },
      coverImage: { type: String, default: '' },
      galleryImages: [{ type: String }],
      welcomeMessage: { type: String, default: '' },
      cardPrice: { type: Number, default: 0, min: 0 }, // Valor de referencia de la tarjeta
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
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Invitation', invitationSchema);