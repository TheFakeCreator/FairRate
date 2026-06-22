import connectToDatabase from './utils/db.js';
import User from './models/User.js';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  // Setup CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Google Access Token is required' });
  }

  try {
    // 1. Verify Google Token and fetch user info
    const googleResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!googleResponse.ok) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const googleUser = await googleResponse.json();
    
    // 2. Connect to MongoDB
    await connectToDatabase();

    // 3. Upsert User in Database
    let user = await User.findOne({ googleId: googleUser.sub });
    if (!user) {
      user = new User({
        googleId: googleUser.sub,
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        presets: [],
        ratings: []
      });
      await user.save();
    }

    // 4. Generate JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is missing');
    }

    const authToken = jwt.sign({ userId: user._id, googleId: user.googleId }, jwtSecret, { expiresIn: '30d' });

    return res.status(200).json({ token: authToken, user: { name: user.name, email: user.email, picture: user.picture } });
    
  } catch (error) {
    console.error('Auth Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
