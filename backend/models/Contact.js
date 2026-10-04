import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot be longer than 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      maxlength: [254, 'Email cannot be longer than 254 characters'],
      match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [40, 'Phone cannot be longer than 40 characters'],
      default: '',
    },
    company: {
      type: String,
      trim: true,
      maxlength: [100, 'Company cannot be longer than 100 characters'],
      default: '',
    },
  },
  { timestamps: true },
);

export default mongoose.model('Contact', contactSchema);
