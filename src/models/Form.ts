import { Schema, model, Document, Types } from 'mongoose';

export interface IFormTheme {
  primaryColor: string;
  backgroundColor: string;
  fontFamily: string;
}

export interface IFormField {
  fieldId: string;
  type: 'text' | 'email' | 'number' | 'dropdown' | 'checkbox' | 'radio' | 'date' | 'textarea';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  order: number;
}

export interface IForm extends Document {
  title: string;
  description?: string;
  owner: Types.ObjectId;
  fields: IFormField[];
  isPublished: boolean;
  theme?: IFormTheme;
  isPaid: boolean;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

const FormFieldSchema = new Schema<IFormField>({
  fieldId: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['text', 'email', 'number', 'dropdown', 'checkbox', 'radio', 'date', 'textarea'],
  },
  label: {
    type: String,
    required: true,
  },
  placeholder: {
    type: String,
  },
  required: {
    type: Boolean,
    default: false,
  },
  options: {
    type: [String],
  },
  order: {
    type: Number,
    required: true,
  },
}, { _id: false });

const FormSchema = new Schema<IForm>({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fields: {
    type: [FormFieldSchema],
    default: [],
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
  price: {
    type: Number,
    default: 0,
  },
  theme: {
    primaryColor: {
      type: String,
      default: '#4f46e5',
    },
    backgroundColor: {
      type: String,
      default: '#ffffff',
    },
    fontFamily: {
      type: String,
      default: 'Inter',
    },
  },
}, {
  timestamps: true,
});

export const Form = model<IForm>('Form', FormSchema);
