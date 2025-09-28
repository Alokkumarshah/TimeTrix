const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  semester: {
    type: String,
    required: false
  },
  academicYear: {
    type: String,
    required: true
  },
  batches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  }],
  timetableData: [{
    batch: { type: String, required: true },
    subject: { type: String, required: true },
    faculty: { 
      type: String, 
      required: function() { return this.subject !== 'Lunch Break'; }
    },
    classroom: { 
      type: String, 
      required: function() { return this.subject !== 'Lunch Break'; }
    },
    department: { type: String, required: true },
    shift: { type: String, required: true },
    day: { type: String, required: true },
    period: { type: String, required: true },
    startTime: { type: String, default: '' },
    endTime: { type: String, default: '' },
    preferred: { type: Boolean, default: false },
    fallbackClassroom: { type: Boolean, default: false },
    assignedClassroom: { type: Boolean, default: true },
    hasTeacherCollision: { type: Boolean, default: false },
    hasClassroomCollision: { type: Boolean, default: false },
    hasBatchCollision: { type: Boolean, default: false },
    fixedSlot: { type: Boolean, default: false },
    lunchBreakId: { type: String, default: null }
  }],
  statistics: {
    totalClasses: { type: Number, default: 0 },
    teacherConflicts: { type: Number, default: 0 },
    classroomConflicts: { type: Number, default: 0 },
    fallbackClassrooms: { type: Number, default: 0 },
    uniqueFaculty: { type: Number, default: 0 },
    classroomsUsed: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
timetableSchema.index({ academicYear: 1 });
timetableSchema.index({ batches: 1 });
timetableSchema.index({ isActive: 1 });

module.exports = mongoose.model('Timetable', timetableSchema);
