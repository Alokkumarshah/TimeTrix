import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { facultyAPI, subjectAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Faculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    maxLoadPerWeek: '',
    averageLeavesPerMonth: '',
    subjects: [],
    semestersTaught: [], // Add semestersTaught array
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [facultyRes, subjectsRes] = await Promise.all([
        facultyAPI.getAll(),
        subjectAPI.getAll(),
      ]);

      setFaculty(facultyRes.data || []);
      setSubjects(subjectsRes.data || []);
      setFilteredSubjects(subjectsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingFaculty(null);
    setFormData({
      name: '',
      email: '',
      department: '',
      maxLoadPerWeek: '',
      averageLeavesPerMonth: '',
      subjects: [],
      semestersTaught: [],
    });
    setFilteredSubjects(subjects);
    setModalOpen(true);
  };

  const handleEdit = (facultyMember) => {
    setEditingFaculty(facultyMember);
    setFormData({
      name: facultyMember.name || '',
      email: facultyMember.email || '',
      department: facultyMember.department || '',
      maxLoadPerWeek: facultyMember.maxLoadPerWeek || '',
      averageLeavesPerMonth: facultyMember.averageLeavesPerMonth || '',
      subjects: facultyMember.subjects?.map(s => s._id || s) || [],
      semestersTaught: facultyMember.semestersTaught || [],
    });
    setModalOpen(true);
  };

  const handleDelete = async (facultyMember) => {
    if (window.confirm(`Are you sure you want to delete faculty member "${facultyMember.name}"?`)) {
      try {
        await facultyAPI.delete(facultyMember._id);
        await fetchData();
      } catch (error) {
        console.error('Error deleting faculty:', error);
        alert('Failed to delete faculty member');
      }
    }
  };

  const handleBulkDelete = async (selectedFaculty) => {
    const facultyNames = selectedFaculty.map(faculty => faculty.name).join(', ');

    if (window.confirm(`Are you sure you want to delete ${selectedFaculty.length} faculty member(s)?\n\n${facultyNames}`)) {
      try {
        // Delete all selected faculty
        const deletePromises = selectedFaculty.map(faculty => 
          facultyAPI.delete(faculty._id)
        );
        await Promise.all(deletePromises);
        await fetchData();
        alert(`Successfully deleted ${selectedFaculty.length} faculty member(s)`);
      } catch (error) {
        console.error('Error deleting faculty:', error);
        alert('Failed to delete some faculty members');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFaculty) {
        // Update existing faculty
        await facultyAPI.update(editingFaculty._id, formData);
      } else {
        // Create new faculty
        await facultyAPI.create(formData);
      }
      setModalOpen(false);
      await fetchData();
    } catch (error) {
      console.error('Error saving faculty:', error);
      alert('Failed to save faculty member');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Filter subjects by department when department changes
    if (name === 'department') {
      const filteredSubjects = subjects.filter(subject => 
        !value || subject.department === value
      );
      setFilteredSubjects(filteredSubjects);
    }
  };

  const handleMultiSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubjectSemesterChange = (subjectId, semester) => {
    setFormData(prev => {
      const existingIndex = prev.semestersTaught.findIndex(st => 
        (st.subject._id || st.subject) === subjectId
      );
      
      let newSemestersTaught = [...prev.semestersTaught];
      
      if (semester) {
        if (existingIndex >= 0) {
          newSemestersTaught[existingIndex] = { subject: subjectId, semester: parseInt(semester) };
        } else {
          newSemestersTaught.push({ subject: subjectId, semester: parseInt(semester) });
        }
      } else {
        if (existingIndex >= 0) {
          newSemestersTaught.splice(existingIndex, 1);
        }
      }
      
      return {
        ...prev,
        semestersTaught: newSemestersTaught,
      };
    });
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      accessor: 'name',
      sortable: true,
    },
    {
      key: 'email',
      header: 'Email',
      accessor: 'email',
      sortable: true,
      render: (faculty) => (
        <a 
          href={`mailto:${faculty.email}`}
          className="text-primary-600 hover:text-primary-800 transition-colors duration-200"
        >
          {faculty.email}
        </a>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      accessor: 'department',
      sortable: true,
    },
    {
      key: 'maxLoadPerWeek',
      header: 'Max Load/Week',
      accessor: 'maxLoadPerWeek',
      sortable: true,
      render: (faculty) => (
        <span className="text-sm text-slate-600 dark:text-slate-300">
          {faculty.maxLoadPerWeek || 'N/A'} hours
        </span>
      ),
    },
    {
      key: 'subjects',
      header: 'Subjects',
      accessor: 'subjects',
      render: (faculty) => (
        <div className="flex flex-wrap gap-1">
          {faculty.subjects?.slice(0, 2).map((subject, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {subject.name || subject}
            </span>
          ))}
          {faculty.subjects?.length > 2 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
              +{faculty.subjects.length - 2} more
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'semestersTaught',
      header: 'Semesters Taught',
      accessor: 'semestersTaught',
      render: (faculty) => (
        <div className="flex flex-wrap gap-1">
          {faculty.semestersTaught?.slice(0, 3).map((st, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
            >
              {st.subject?.name || st.subject}: Sem {st.semester}
            </span>
          ))}
          {faculty.semestersTaught?.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
              +{faculty.semestersTaught.length - 3} more
            </span>
          )}
        </div>
      ),
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
        <div className="p-3 bg-green-100 rounded-lg">
          <Users className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Faculty</h1>
          <p className="text-slate-600 dark:text-slate-300">Manage faculty members and their teaching assignments</p>
        </div>
      </motion.div>

      <DataTable
        data={faculty}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
        onCreate={handleCreate}
        title="All Faculty Members"
        loading={loading}
        emptyMessage="No faculty members found. Add your first faculty member to get started."
        selectable={true}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingFaculty ? 'Edit Faculty Member' : 'Add New Faculty Member'}
        size="large"
      >
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                required
                className="w-full px-5 py-4 bg-white/95 dark:bg-slate-700/95 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:shadow-md focus:shadow-lg backdrop-blur-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Dr. John Smith"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Email *
              </label>
              <input
                type="email"
                name="email"
                required
                className="w-full px-5 py-4 bg-white/95 dark:bg-slate-700/95 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:shadow-md focus:shadow-lg backdrop-blur-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="e.g., john.smith@university.edu"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Department
              </label>
              <input
                type="text"
                name="department"
                className="w-full px-5 py-4 bg-white/95 dark:bg-slate-700/95 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:shadow-md focus:shadow-lg backdrop-blur-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                value={formData.department}
                onChange={handleInputChange}
                placeholder="e.g., Computer Science"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Max Load Per Week (hours)
              </label>
              <input
                type="number"
                name="maxLoadPerWeek"
                className="w-full px-5 py-4 bg-white/95 dark:bg-slate-700/95 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:shadow-md focus:shadow-lg backdrop-blur-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                value={formData.maxLoadPerWeek}
                onChange={handleInputChange}
                placeholder="e.g., 40"
                min="1"
                max="60"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Average Leaves Per Month
              </label>
              <input
                type="number"
                name="averageLeavesPerMonth"
                className="w-full px-5 py-4 bg-white/95 dark:bg-slate-700/95 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:shadow-md focus:shadow-lg backdrop-blur-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                value={formData.averageLeavesPerMonth}
                onChange={handleInputChange}
                placeholder="e.g., 2"
                min="0"
                max="10"
              />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
              Teaching Subjects and Semesters
            </label>
            <div className="space-y-3 max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-600 rounded-xl p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
              {filteredSubjects.map((subject, index) => (
                <motion.div 
                  key={subject._id} 
                  className="flex items-center space-x-4 p-4 border border-slate-200 dark:border-slate-600 rounded-xl bg-white/90 dark:bg-slate-700/90 hover:bg-white dark:hover:bg-slate-700 transition-all duration-300 hover:shadow-md"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  <input
                    type="checkbox"
                    checked={formData.subjects.includes(subject._id)}
                    onChange={(e) => {
                      const newSubjects = e.target.checked
                        ? [...formData.subjects, subject._id]
                        : formData.subjects.filter(id => id !== subject._id);
                      handleMultiSelectChange('subjects', newSubjects);
                      
                      // Clear semester if subject is unchecked
                      if (!e.target.checked) {
                        handleSubjectSemesterChange(subject._id, '');
                      }
                    }}
                    className="w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-500 text-blue-600 focus:ring-blue-500 focus:ring-2 bg-white dark:bg-slate-700"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{subject.name}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">(Sem {subject.semester})</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            className="flex justify-end space-x-4 pt-8 border-t border-slate-200 dark:border-slate-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <motion.button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-8 py-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {editingFaculty ? 'Update Faculty' : 'Add Faculty'}
            </motion.button>
          </motion.div>
        </form>
      </Modal>
    </div>
  );
};

export default Faculty;
