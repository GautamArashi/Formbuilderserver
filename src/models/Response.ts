import { Schema, model, Document, Types } from 'mongoose';

export interface IResponse extends Document {
  formId: Types.ObjectId;
  answers: Record<string, any>;
  paymentId?: string;
  submittedAt: Date;
}

const ResponseSchema = new Schema<IResponse>({
  formId: {
    type: Schema.Types.ObjectId,
    ref: 'Form',
    required: true,
  },
  answers: {
    type: Schema.Types.Mixed,
    required: true,
  },
  paymentId: {
    type: String,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

export const Response = model<IResponse>('Response', ResponseSchema);
