import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const sendAuthResponse = (res, user, statusCode = 200) => {
  const token = createToken(user._id);

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  return res.status(statusCode).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email
    }
  });
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const user = await User.create({ name, email, password });
    return sendAuthResponse(res, user, 201);
  } catch (error) {
    return res.status(500).json({ message: 'Register failed', error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    return sendAuthResponse(res, user);
  } catch (error) {
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

export const logout = async (req, res) => {
  res.clearCookie('token');
  return res.json({ message: 'Logged out successfully' });
};

export const getMe = async (req, res) => {
  return res.json({ user: req.user });
};
