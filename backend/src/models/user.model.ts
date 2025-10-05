import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  authId: string;
  name: string;
  email: string;
  mobile: string;
  role: "user" | "lawyer";
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  authId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  mobile: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "lawyer"],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<IUser>("User", UserSchema);
