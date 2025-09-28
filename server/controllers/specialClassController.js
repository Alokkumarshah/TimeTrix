const SpecialClass = require('../models/SpecialClass');

exports.listSpecialClasses = async (req, res) => {
  try {
    if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
    const classes = await SpecialClass.find().populate('subject faculty batch classroom');
    res.json(classes);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load special classes' });
  }
};

exports.createSpecialClass = async (req, res) => {
  try {
    if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
    const { name, type, subject, faculty, batch, classroom, day, startTime, endTime, fixedSlot, slots } = req.body;
    const created = await SpecialClass.create({ name, type, subject, faculty, batch, classroom, day, startTime, endTime, fixedSlot: fixedSlot !== false, slots });
    res.status(201).json(created);
  } catch (e) {
    res.status(400).json({ error: 'Failed to create special class' });
  }
};

exports.deleteSpecialClass = async (req, res) => {
  try {
    if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
    const { id } = req.params;
    await SpecialClass.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: 'Failed to delete special class' });
  }
};

exports.updateSpecialClass = async (req, res) => {
  try {
    if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
    const { id } = req.params;
    const update = req.body || {};
    const updated = await SpecialClass.findByIdAndUpdate(id, update, { new: true });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: 'Failed to update special class' });
  }
};
