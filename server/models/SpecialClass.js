const mongoose = require('mongoose');

const specialClassSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['lunch_break', 'fixed_slot', 'special_session'], default: 'special_session' },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' },
  day: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  fixedSlot: { type: Boolean, default: true },
  // Optional list of period names this applies to (e.g., ['Period 3'])
  slots: [{ type: String }]
});

module.exports = mongoose.model('SpecialClass', specialClassSchema);
