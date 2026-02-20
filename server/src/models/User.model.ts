import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'candidate_uploader' | 'job_uploader';
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, enum: ['candidate_uploader', 'job_uploader'] },
  },
  { timestamps: true },
);

export default mongoose.model<IUser>('User', UserSchema);
