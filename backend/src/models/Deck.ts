import mongoose, { Document, Schema } from 'mongoose';

export interface IDeck extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  tags: string[];
  cardCount: number;
  dueCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const deckSchema = new Schema<IDeck>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 500, default: '' },
  tags: [{ type: String, trim: true, lowercase: true }],
  cardCount: { type: Number, default: 0 },
  dueCount: { type: Number, default: 0 },
}, { timestamps: true });

deckSchema.index({ userId: 1, createdAt: -1 });
deckSchema.index({ userId: 1, tags: 1 });
deckSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model<IDeck>('Deck', deckSchema);
