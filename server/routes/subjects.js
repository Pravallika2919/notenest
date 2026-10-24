const router = require('express').Router();
const Subject = require('../models/Subject');
const Note = require('../models/Note');
const { auth } = require('../middleware/auth');

router.use(auth);

const fields = b => {
  const out = {};
  ['name', 'color', 'examDate'].forEach(k => { if (b[k] !== undefined) out[k] = b[k]; });
  return out;
};

router.get('/', async (req, res) => res.json(await Subject.find({ user: req.userId }).sort('name')));

router.post('/', async (req, res) => {
  try { res.status(201).json(await Subject.create({ ...fields(req.body), user: req.userId })); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/:id', async (req, res) =>
  res.json(await Subject.findOneAndUpdate({ _id: req.params.id, user: req.userId }, fields(req.body), { new: true })));

router.delete('/:id', async (req, res) => {
  await Subject.findOneAndDelete({ _id: req.params.id, user: req.userId });
  await Note.updateMany({ subject: req.params.id, user: req.userId }, { $unset: { subject: '' } });
  res.json({ ok: true });
});

module.exports = router;
