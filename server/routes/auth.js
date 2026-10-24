const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Note = require('../models/Note');
const { auth, signToken } = require('../middleware/auth');
const { createStarterData } = require('../utils/starter');

const publicUser = u => ({ id: u._id, name: u.name, email: u.email });

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    if (await User.findOne({ email: email.toLowerCase() })) {
      return res.status(409).json({ error: 'This email is already registered' });
    }
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
    await createStarterData(user._id); // every new student starts with sample subjects and notes
    res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
  } catch (e) {
    res.status(500).json({ error: 'Registration failed: ' + e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = email && (await User.findOne({ email: email.toLowerCase() }));
    if (!user || !(await bcrypt.compare(password || '', user.password))) {
      return res.status(401).json({ error: 'Wrong email or password' });
    }
    res.json({ token: signToken(user._id), user: publicUser(user) });
  } catch (e) {
    res.status(500).json({ error: 'Login failed: ' + e.message });
  }
});

router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ error: 'User not found' });
  res.json(publicUser(user));
});

// Load sample subjects and notes into an empty account
router.post('/starter', auth, async (req, res) => {
  try {
    const has = (await Subject.exists({ user: req.userId })) || (await Note.exists({ user: req.userId }));
    if (has) return res.status(400).json({ error: 'Your account already has data' });
    res.json(await createStarterData(req.userId));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
