import connectToDatabase from './utils/db.js';
import User from './models/User.js';
import jwt from 'jsonwebtoken';

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
  const { action } = req.query;

  if (req.method === 'GET') {
    // 1. Search for a user by email
    if (action === 'search') {
      const { email } = req.query;
      if (!email) return res.status(400).json({ error: 'Email is required' });
      
      const foundUser = await User.findOne({ email: email.toLowerCase() }).lean();
      if (!foundUser) return res.status(404).json({ error: 'User not found' });
      
      return res.status(200).json({ 
        _id: foundUser._id, 
        name: foundUser.name, 
        email: foundUser.email, 
        picture: foundUser.picture 
      });
    }

    // 2. Get list of followed users
    if (action === 'list') {
      const user = await User.findById(decoded.userId).populate('following', 'name email picture').lean();
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      return res.status(200).json({ following: user.following || [] });
    }

    // 3. Get friends' ratings for a specific movie
    if (action === 'ratings') {
      const { movieId } = req.query;
      if (!movieId) return res.status(400).json({ error: 'MovieId is required' });
      
      const user = await User.findById(decoded.userId).populate('following').lean();
      if (!user) return res.status(404).json({ error: 'User not found' });

      const friendsRatings = [];
      const following = user.following || [];
      
      for (const friend of following) {
        const rating = friend.ratings.find(r => r.movieId === movieId);
        if (rating) {
          friendsRatings.push({
            user: { _id: friend._id, name: friend.name, picture: friend.picture },
            rating: rating
          });
        }
      }
      
      return res.status(200).json({ ratings: friendsRatings });
    }
  }

  if (req.method === 'POST') {
    // Toggle follow/unfollow
    const bodyAction = req.body.action;
    if (bodyAction === 'follow') {
      const { targetUserId } = req.body;
      if (!targetUserId) return res.status(400).json({ error: 'Target User ID required' });
      if (targetUserId === decoded.userId) return res.status(400).json({ error: 'Cannot follow yourself' });

      const user = await User.findById(decoded.userId);
      const targetUser = await User.findById(targetUserId);

      if (!targetUser) return res.status(404).json({ error: 'Target user not found' });

      const isFollowing = user.following.includes(targetUserId);
      if (isFollowing) {
        user.following.pull(targetUserId);
      } else {
        user.following.push(targetUserId);
      }
      
      await user.save();
      return res.status(200).json({ success: true, isFollowing: !isFollowing });
    }
  }

  return res.status(400).json({ error: 'Invalid request' });
}
