const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Note = require('../models/Note');
const Subject = require('../models/Subject');
const { auth } = require('../middleware/auth');

router.use(auth);

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) =>
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e6) + path.extname(file.originalname))
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    cb(null, file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/'))
});

// only these fields can be set from the client (never "user")
const fields = b => {
  const out = {};
  ['title', 'content', 'topic', 'subject', 'pinned', 'favorite'].forEach(k => { if (b[k] !== undefined) out[k] = b[k]; });
  return out;
};

// make sure the chosen subject belongs to the logged-in user
const ownsSubject = async (userId, subjectId) =>
  !subjectId || !!(await Subject.exists({ _id: subjectId, user: userId }));

// list + search + filters (pinned first, then newest)
router.get('/', async (req, res) => {
  const { q, subject, favorite } = req.query;
  const filter = { user: req.userId };
  if (subject) filter.subject = subject;
  if (favorite === 'true') filter.favorite = true;
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ title: rx }, { content: rx }, { topic: rx }];
  }
  res.json(await Note.find(filter).populate('subject').sort({ pinned: -1, updatedAt: -1 }));
});

// dashboard: latest 5
router.get('/recent', async (req, res) =>
  res.json(await Note.find({ user: req.userId }).populate('subject').sort('-updatedAt').limit(5)));

router.post('/', async (req, res) => {
  try {
    const data = fields(req.body);
    if (!(await ownsSubject(req.userId, data.subject))) return res.status(400).json({ error: 'Invalid subject' });
    res.status(201).json(await Note.create({ ...data, user: req.userId }));
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  const data = fields(req.body);
  if (!(await ownsSubject(req.userId, data.subject))) return res.status(400).json({ error: 'Invalid subject' });
  const note = await Note.findOneAndUpdate({ _id: req.params.id, user: req.userId }, data, { new: true }).populate('subject');
  if (!note) return res.status(404).json({ error: 'Note not found' });
  res.json(note);
});

router.delete('/:id', async (req, res) => {
  const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.userId });
  note?.files.forEach(f => fs.unlink(path.join(__dirname, '..', f.path), () => {}));
  res.json({ ok: true });
});

// upload a PDF/image to a note
router.post('/:id/files', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'PDF or image only (max 10 MB)' });
  const note = await Note.findOne({ _id: req.params.id, user: req.userId });
  if (!note) {
    fs.unlink(req.file.path, () => {});
    return res.status(404).json({ error: 'Note not found' });
  }
  note.files.push({ name: req.file.originalname, path: 'uploads/' + req.file.filename });
  await note.save();
  res.json(note);
});

module.exports = router;
