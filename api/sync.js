import connectToDatabase from './utils/db.js';
import User from './models/User.js';
import jwt from 'jsonwebtoken';

// Helper to verify JWT
const authenticate = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }
  const token = authHeader.split(' ')[1];
  return jwt.verify(token, process.env.JWT_SECRET);
};

export default async function handler(req, res) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let decoded;
  try {
    decoded = authenticate(req);
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  await connectToDatabase();

  if (req.method === 'GET') {
    // Pull Data
    try {
      const user = await User.findById(decoded.userId).lean();
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      return res.status(200).json({ presets: user.presets, ratings: user.ratings, lastSyncedAt: user.lastSyncedAt });
    } catch (error) {
      console.error('Sync GET error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } 
  
  if (req.method === 'POST') {
    // Push Data
    try {
      const { presets, ratings } = req.body;
      
      if (!presets || !ratings) {
        return res.status(400).json({ error: 'Missing presets or ratings in body' });
      }

      const user = await User.findByIdAndUpdate(
        decoded.userId,
        { 
          presets, 
          ratings,
          lastSyncedAt: new Date()
        },
        { new: true }
      ).lean();

      if (!user) return res.status(404).json({ error: 'User not found' });

      return res.status(200).json({ success: true, lastSyncedAt: user.lastSyncedAt });
    } catch (error) {
      console.error('Sync POST error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
