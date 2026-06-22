import mongoose from 'mongoose';

const presetSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  weights: { type: Map, of: Number },
  isDefault: { type: Boolean, default: false }
}, { _id: false });

const ratingSchema = new mongoose.Schema({
  movieId: { type: String, required: true },
  overall: { type: Number, required: true },
  scores: { type: Map, of: Number },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: { type: String },
  picture: { type: String },
  presets: [presetSchema],
  ratings: [ratingSchema],
  lastSyncedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Check if the model already exists to prevent OverwriteModelError in serverless environments
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
