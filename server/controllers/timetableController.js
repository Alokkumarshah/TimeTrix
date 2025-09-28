const Timetable = require('../models/Timetable');
const Batch = require('../models/Batch');

// Save a generated timetable
exports.saveTimetable = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      semester, 
      academicYear, 
      batches, 
      timetableData, 
      statistics 
    } = req.body;

    // Validate required fields
    if (!name || !semester || !academicYear || !timetableData || !batches) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, semester, academicYear, timetableData, batches' 
      });
    }

    // Check if timetable name already exists for this semester and academic year
    const existingTimetable = await Timetable.findOne({
      name,
      semester,
      academicYear,
      isActive: true
    });

    if (existingTimetable) {
      return res.status(400).json({ 
        error: 'A timetable with this name already exists for the specified semester and academic year' 
      });
    }

    // Create new timetable
    const timetable = new Timetable({
      name,
      description: description || '',
      semester,
      academicYear,
      batches,
      timetableData,
      statistics: statistics || {},
      createdBy: req.session.userId
    });

    await timetable.save();

    // Populate batch information for response
    await timetable.populate('batches', 'name department semester shift');

    res.status(201).json({
      message: 'Timetable saved successfully',
      timetable
    });
  } catch (error) {
    console.error('Error saving timetable:', error);
    res.status(500).json({ error: 'Failed to save timetable' });
  }
};

// Get all saved timetables with filtering
exports.getSavedTimetables = async (req, res) => {
  try {
    const { semester, academicYear, batchId, page = 1, limit = 10 } = req.query;
    
    // Build filter object
    const filter = { isActive: true };
    
    if (semester) {
      filter.semester = semester;
    }
    
    if (academicYear) {
      filter.academicYear = academicYear;
    }
    
    if (batchId) {
      filter.batches = batchId;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get timetables with pagination
    const timetables = await Timetable.find(filter)
      .populate('batches', 'name department semester shift')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Timetable.countDocuments(filter);

    res.json({
      timetables,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching saved timetables:', error);
    res.status(500).json({ error: 'Failed to fetch saved timetables' });
  }
};

// Get a specific saved timetable
exports.getSavedTimetable = async (req, res) => {
  try {
    const { id } = req.params;

    const timetable = await Timetable.findById(id)
      .populate('batches', 'name department semester shift')
      .populate('createdBy', 'name email');

    if (!timetable) {
      return res.status(404).json({ error: 'Timetable not found' });
    }

    res.json({ timetable });
  } catch (error) {
    console.error('Error fetching timetable:', error);
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
};

// Update a saved timetable
exports.updateTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const timetable = await Timetable.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('batches', 'name department semester shift');

    if (!timetable) {
      return res.status(404).json({ error: 'Timetable not found' });
    }

    res.json({
      message: 'Timetable updated successfully',
      timetable
    });
  } catch (error) {
    console.error('Error updating timetable:', error);
    res.status(500).json({ error: 'Failed to update timetable' });
  }
};

// Delete a saved timetable (soft delete)
exports.deleteTimetable = async (req, res) => {
  try {
    const { id } = req.params;

    const timetable = await Timetable.findByIdAndUpdate(
      id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );

    if (!timetable) {
      return res.status(404).json({ error: 'Timetable not found' });
    }

    res.json({ message: 'Timetable deleted successfully' });
  } catch (error) {
    console.error('Error deleting timetable:', error);
    res.status(500).json({ error: 'Failed to delete timetable' });
  }
};

// Get filter options (unique semesters, academic years, batches)
exports.getFilterOptions = async (req, res) => {
  try {
    const semesters = await Timetable.distinct('semester', { isActive: true });
    const academicYears = await Timetable.distinct('academicYear', { isActive: true });
    
    // Get batches that are referenced in saved timetables
    const batchIds = await Timetable.distinct('batches', { isActive: true });
    const batches = await Batch.find({ _id: { $in: batchIds } })
      .select('name department semester shift');

    res.json({
      semesters,
      academicYears,
      batches
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({ error: 'Failed to fetch filter options' });
  }
};
