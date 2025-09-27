import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Calendar, Clock, Users, BookOpen, Building } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { constraintAPI, batchAPI, subjectAPI, classroomAPI, facultyAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Constraints = () => {
  const [constraints, setConstraints] = useState([]);
  const [batches, setBatches] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [constraintType, setConstraintType] = useState('subject_slot_preference');
  const [formData, setFormData] = useState({
    semester: '',
    department: '',
    batch: '',
    subject: '',
    classroom: '',
    faculty: '',
    day: '',
    slot: '',
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const slots = ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [constraintsRes, batchesRes, subjectsRes, classroomsRes, facultyRes] = await Promise.all([
        constraintAPI.getAll(),
        batchAPI.getAll(),
        subjectAPI.getAll(),
        classroomAPI.getAll(),
        facultyAPI.getAll(),
      ]);

      setConstraints(constraintsRes.data.data || []);
      setBatches(batchesRes.data || []);
      setSubjects(subjectsRes.data || []);
      setClassrooms(classroomsRes.data || []);
      setFaculty(facultyRes.data || []);
      setFilteredBatches(batchesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBatchesBySemester = async (semester, department) => {
    if (!semester) {
      setFilteredBatches(batches);
      return;
    }
    
    try {
      const response = await constraintAPI.getBatchesBySemester(semester, department);
      setFilteredBatches(response.data.data || []);
    } catch (error) {
      console.error('Error filtering batches:', error);
      // Fallback to client-side filtering
      const filtered = batches.filter(batch => 
        batch.semester === parseInt(semester) && 
        (!department || batch.department === department)
      );
      setFilteredBatches(filtered);
    }
  };

  const getSubjectsByBatch = async (batchId) => {
    if (!batchId) return [];
    
    try {
      const response = await constraintAPI.getSubjectsByBatch(batchId);
      return response.data.data || [];
    } catch (error) {
      console.error('Error getting subjects:', error);
      // Fallback to client-side filtering
      const batch = batches.find(b => b._id === batchId);
      return batch?.subjects || [];
    }
  };

  const handleCreate = (type) => {
    setConstraintType(type);
    setFormData({
      semester: '',
      department: '',
      batch: '',
      subject: '',
      classroom: '',
      faculty: '',
      day: '',
      slot: '',
    });
    setFilteredBatches(batches);
    setModalOpen(true);
  };

  const handleDelete = async (constraint) => {
    if (window.confirm(`Are you sure you want to delete this constraint?`)) {
      try {
        await constraintAPI.delete(constraint._id);
        await fetchData();
      } catch (error) {
        console.error('Error deleting constraint:', error);
        alert('Failed to delete constraint');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let details = {};
      
      if (constraintType === 'subject_slot_preference') {
        details = {
          batch: formData.batch,
          subject: formData.subject,
          day: formData.day,
          slot: formData.slot,
        };
      } else if (constraintType === 'classroom_preference') {
        details = {
          batch: formData.batch,
          classroom: formData.classroom,
          day: formData.day,
          slot: formData.slot,
        };
      } else if (constraintType === 'teacher_slot_preference') {
        details = {
          batch: formData.batch,
          faculty: formData.faculty,
          day: formData.day,
          slot: formData.slot,
        };
      }

      await constraintAPI.create({
        type: constraintType,
        details,
      });
      
      setModalOpen(false);
      await fetchData();
    } catch (error) {
      console.error('Error creating constraint:', error);
      alert(error.response?.data?.error || 'Failed to create constraint');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Filter batches when semester or department changes
    if (name === 'semester' || name === 'department') {
      const newSemester = name === 'semester' ? value : formData.semester;
      const newDepartment = name === 'department' ? value : formData.department;
      filterBatchesBySemester(newSemester, newDepartment);
    }
  };

  const columns = [
    {
      key: 'type',
      header: 'Type',
      accessor: 'type',
      render: (constraint) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          constraint.type === 'subject_slot_preference' 
            ? 'bg-blue-100 text-blue-800'
            : constraint.type === 'classroom_preference'
            ? 'bg-green-100 text-green-800'
            : 'bg-purple-100 text-purple-800'
        }`}>
          {constraint.type === 'subject_slot_preference' ? 'Subject' :
           constraint.type === 'classroom_preference' ? 'Classroom' : 'Teacher'}
        </span>
      ),
    },
    {
      key: 'resource',
      header: 'Resource',
      accessor: 'details',
      render: (details) => {
        if (constraintType === 'subject_slot_preference') {
          return details.subject?.name || 'Subject';
        } else if (constraintType === 'classroom_preference') {
          return details.classroom?.name || 'Classroom';
        } else {
          return details.faculty?.name || 'Teacher';
        }
      },
    },
    {
      key: 'batch',
      header: 'Batch',
      accessor: 'details',
      render: (details) => details.batch?.name || 'Unknown',
    },
    {
      key: 'day',
      header: 'Day',
      accessor: 'details',
      render: (details) => details.day,
    },
    {
      key: 'slot',
      header: 'Period',
      accessor: 'details',
      render: (details) => details.slot,
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-3"
      >
        <div className="p-3 bg-orange-100 rounded-lg">
          <Settings className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Constraints</h1>
          <p className="text-gray-600">Set slot preferences and constraints for timetable generation</p>
        </div>
      </motion.div>

      {/* Constraint Types */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="card cursor-pointer hover:shadow-lg transition-shadow duration-200" onClick={() => handleCreate('subject_slot_preference')}>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Fix Subject Slot</h3>
              <p className="text-sm text-gray-600">Set specific time slots for subjects</p>
            </div>
          </div>
        </div>

        <div className="card cursor-pointer hover:shadow-lg transition-shadow duration-200" onClick={() => handleCreate('classroom_preference')}>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Building className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Fix Classroom Slot</h3>
              <p className="text-sm text-gray-600">Reserve classrooms for specific slots</p>
            </div>
          </div>
        </div>

        <div className="card cursor-pointer hover:shadow-lg transition-shadow duration-200" onClick={() => handleCreate('teacher_slot_preference')}>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Fix Teacher Slot</h3>
              <p className="text-sm text-gray-600">Set teacher availability preferences</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Constraints Table */}
      <DataTable
        data={constraints}
        columns={columns}
        onDelete={handleDelete}
        title="All Constraints"
        loading={loading}
        emptyMessage="No constraints found. Create constraints to fix specific slots."
      />

      {/* Constraint Creation Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Fix ${constraintType === 'subject_slot_preference' ? 'Subject' : 
                constraintType === 'classroom_preference' ? 'Classroom' : 'Teacher'} Slot`}
        size="large"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semester *
              </label>
              <select
                name="semester"
                required
                className="input-field"
                value={formData.semester}
                onChange={handleInputChange}
              >
                <option value="">Select Semester</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <input
                type="text"
                name="department"
                className="input-field"
                value={formData.department}
                onChange={handleInputChange}
                placeholder="e.g., Computer Science"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch *
              </label>
              <select
                name="batch"
                required
                className="input-field"
                value={formData.batch}
                onChange={handleInputChange}
              >
                <option value="">Select Batch</option>
                {filteredBatches.map(batch => (
                  <option key={batch._id} value={batch._id}>
                    {batch.name} - {batch.department} (Sem {batch.semester})
                  </option>
                ))}
              </select>
            </div>

            {constraintType === 'subject_slot_preference' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  name="subject"
                  required
                  className="input-field"
                  value={formData.subject}
                  onChange={handleInputChange}
                >
                  <option value="">Select Subject</option>
                  {subjects.map(subject => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name} ({subject.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {constraintType === 'classroom_preference' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Classroom *
                </label>
                <select
                  name="classroom"
                  required
                  className="input-field"
                  value={formData.classroom}
                  onChange={handleInputChange}
                >
                  <option value="">Select Classroom</option>
                  {classrooms.map(classroom => (
                    <option key={classroom._id} value={classroom._id}>
                      {classroom.name} ({classroom.department})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {constraintType === 'teacher_slot_preference' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teacher *
                </label>
                <select
                  name="faculty"
                  required
                  className="input-field"
                  value={formData.faculty}
                  onChange={handleInputChange}
                >
                  <option value="">Select Teacher</option>
                  {faculty.map(teacher => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.name} ({teacher.department})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Day *
              </label>
              <select
                name="day"
                required
                className="input-field"
                value={formData.day}
                onChange={handleInputChange}
              >
                <option value="">Select Day</option>
                {days.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period *
              </label>
              <select
                name="slot"
                required
                className="input-field"
                value={formData.slot}
                onChange={handleInputChange}
              >
                <option value="">Select Period</option>
                {slots.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Create Constraint
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Constraints;