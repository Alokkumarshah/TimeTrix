import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { subjectAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department: '',
    semester: '',
    isElective: false,
    requiredClassesPerWeek: '',
    maxClassesPerDay: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await subjectAPI.getAll();
      setSubjects(response.data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSubject(null);
    setFormData({
      name: '',
      code: '',
      department: '',
      semester: '',
      isElective: false,
      requiredClassesPerWeek: '',
      maxClassesPerDay: '',
    });
    setModalOpen(true);
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name || '',
      code: subject.code || '',
      department: subject.department || '',
      semester: subject.semester || '',
      isElective: subject.isElective || false,
      requiredClassesPerWeek: subject.requiredClassesPerWeek || '',
      maxClassesPerDay: subject.maxClassesPerDay || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (subject) => {
    if (window.confirm(`Are you sure you want to delete subject "${subject.name}"?`)) {
      try {
        await subjectAPI.delete(subject._id);
        await fetchData();
      } catch (error) {
        console.error('Error deleting subject:', error);
        alert('Failed to delete subject');
      }
    }
  };

  const handleBulkDelete = async (selectedSubjects) => {
    const subjectNames = selectedSubjects.map(subject => subject.name).join(', ');

    if (window.confirm(`Are you sure you want to delete ${selectedSubjects.length} subject(s)?\n\n${subjectNames}`)) {
      try {
        // Delete all selected subjects
        const deletePromises = selectedSubjects.map(subject => 
          subjectAPI.delete(subject._id)
        );
        await Promise.all(deletePromises);
        await fetchData();
        alert(`Successfully deleted ${selectedSubjects.length} subject(s)`);
      } catch (error) {
        console.error('Error deleting subjects:', error);
        alert('Failed to delete some subjects');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        // Update existing subject
        await subjectAPI.update(editingSubject._id, formData);
      } else {
        // Create new subject
        await subjectAPI.create(formData);
      }
      setModalOpen(false);
      await fetchData();
    } catch (error) {
      console.error('Error saving subject:', error);
      alert('Failed to save subject');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const columns = [
    {
      key: 'name',
      header: 'Subject Name',
      accessor: 'name',
      sortable: true,
    },
    {
      key: 'code',
      header: 'Code',
      accessor: 'code',
      sortable: true,
      render: (subject) => (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
          {subject.code}
        </span>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      accessor: 'department',
      sortable: true,
    },
    {
      key: 'semester',
      header: 'Semester',
      accessor: 'semester',
      sortable: true,
      render: (subject) => (
        <span className="text-sm text-slate-600 dark:text-slate-300">
          {subject.semester ? `Sem ${subject.semester}` : 'N/A'}
        </span>
      ),
    },
    {
      key: 'isElective',
      header: 'Type',
      accessor: 'isElective',
      render: (subject) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          subject.isElective 
            ? 'bg-purple-100 text-purple-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {subject.isElective ? 'Elective' : 'Core'}
        </span>
      ),
    },
    {
      key: 'requiredClassesPerWeek',
      header: 'Classes/Week',
      accessor: 'requiredClassesPerWeek',
      sortable: true,
      render: (subject) => (
        <span className="text-sm text-slate-600 dark:text-slate-300">
          {subject.requiredClassesPerWeek || 'N/A'}
        </span>
      ),
    },
    {
      key: 'maxClassesPerDay',
      header: 'Max/Day',
      accessor: 'maxClassesPerDay',
      sortable: true,
      render: (subject) => (
        <span className="text-sm text-slate-600 dark:text-slate-300">
          {subject.maxClassesPerDay || 'N/A'}
        </span>
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
        <div className="p-3 bg-purple-100 rounded-lg">
          <BookOpen className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Subjects</h1>
          <p className="text-slate-600 dark:text-slate-300">Manage academic subjects and their scheduling requirements</p>
        </div>
      </motion.div>

      <DataTable
        data={subjects}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
        onCreate={handleCreate}
        title="All Subjects"
        loading={loading}
        emptyMessage="No subjects found. Add your first subject to get started."
        selectable={true}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSubject ? 'Edit Subject' : 'Add New Subject'}
        size="medium"
      >
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Subject Name *
              </label>
              <input
                type="text"
                name="name"
                required
                className="w-full px-5 py-4 bg-white/95 dark:bg-slate-700/95 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:shadow-md focus:shadow-lg backdrop-blur-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Data Structures and Algorithms"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Subject Code *
              </label>
              <input
                type="text"
                name="code"
                required
                className="w-full px-5 py-4 bg-white/95 dark:bg-slate-700/95 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:shadow-md focus:shadow-lg backdrop-blur-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="e.g., CS-301"
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
                Semester *
              </label>
              <div className="relative">
                <select
                  name="semester"
                  required
                  className="w-full px-5 py-4 bg-white/95 dark:bg-slate-700/95 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:shadow-md focus:shadow-lg backdrop-blur-sm text-slate-700 dark:text-slate-200 appearance-none"
                  value={formData.semester}
                  onChange={handleInputChange}
                >
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Required Classes Per Week *
              </label>
              <input
                type="number"
                name="requiredClassesPerWeek"
                required
                className="w-full px-5 py-4 bg-white/95 dark:bg-slate-700/95 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:shadow-md focus:shadow-lg backdrop-blur-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                value={formData.requiredClassesPerWeek}
                onChange={handleInputChange}
                placeholder="e.g., 3"
                min="1"
                max="10"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Max Classes Per Day
              </label>
              <input
                type="number"
                name="maxClassesPerDay"
                className="w-full px-5 py-4 bg-white/95 dark:bg-slate-700/95 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:shadow-md focus:shadow-lg backdrop-blur-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                value={formData.maxClassesPerDay}
                onChange={handleInputChange}
                placeholder="e.g., 2"
                min="1"
                max="5"
              />
            </motion.div>
          </div>

          <motion.div 
            className="flex items-center p-4 border border-slate-200 dark:border-slate-600 rounded-xl bg-white/80 dark:bg-slate-700/80"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <input
              type="checkbox"
              name="isElective"
              id="isElective"
              checked={formData.isElective}
              onChange={handleInputChange}
              className="w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-500 text-blue-600 focus:ring-blue-500 focus:ring-2 bg-white dark:bg-slate-700"
            />
            <label htmlFor="isElective" className="ml-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
              This is an elective subject
            </label>
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
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {editingSubject ? 'Update Subject' : 'Add Subject'}
            </motion.button>
          </motion.div>
        </form>
      </Modal>
    </div>
  );
};

export default Subjects;
