import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building, Users, MapPin, Clock } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { classroomAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Classrooms = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    type: 'classroom',
    department: '',
    shift: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await classroomAPI.getAll();
      setClassrooms(response.data || []);
    } catch (error) {
      console.error('Error fetching classrooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingClassroom(null);
    setFormData({
      name: '',
      capacity: '',
      type: 'classroom',
      department: '',
      shift: '',
    });
    setModalOpen(true);
  };

  const handleEdit = (classroom) => {
    setEditingClassroom(classroom);
    setFormData({
      name: classroom.name || '',
      capacity: classroom.capacity || '',
      type: classroom.type || 'classroom',
      department: classroom.department || '',
      shift: classroom.shift || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (classroom) => {
    if (window.confirm(`Are you sure you want to delete classroom "${classroom.name}"?`)) {
      try {
        await classroomAPI.delete(classroom._id);
        await fetchData();
      } catch (error) {
        console.error('Error deleting classroom:', error);
        alert('Failed to delete classroom');
      }
    }
  };

  const handleBulkDelete = async (selectedClassrooms) => {
    const classroomNames = selectedClassrooms.map(classroom => classroom.name).join(', ');

    if (window.confirm(`Are you sure you want to delete ${selectedClassrooms.length} classroom(s)?\n\n${classroomNames}`)) {
      try {
        // Delete all selected classrooms
        const deletePromises = selectedClassrooms.map(classroom => 
          classroomAPI.delete(classroom._id)
        );
        await Promise.all(deletePromises);
        await fetchData();
        alert(`Successfully deleted ${selectedClassrooms.length} classroom(s)`);
      } catch (error) {
        console.error('Error deleting classrooms:', error);
        alert('Failed to delete some classrooms');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClassroom) {
        // Update existing classroom
        await classroomAPI.update(editingClassroom._id, formData);
      } else {
        // Create new classroom
        await classroomAPI.create(formData);
      }
      setModalOpen(false);
      await fetchData();
    } catch (error) {
      console.error('Error saving classroom:', error);
      alert('Failed to save classroom');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const columns = [
    {
      key: 'name',
      header: 'Classroom Name',
      accessor: 'name',
      sortable: true,
    },
    {
      key: 'capacity',
      header: 'Capacity',
      accessor: 'capacity',
      sortable: true,
      render: (classroom) => (
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {classroom.capacity || 'N/A'} students
          </span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      accessor: 'type',
      sortable: true,
      render: (classroom) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          classroom.type === 'laboratory' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {classroom.type === 'laboratory' ? 'Laboratory' : 'Classroom'}
        </span>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      accessor: 'department',
      sortable: true,
      render: (classroom) => (
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {classroom.department || 'N/A'}
          </span>
        </div>
      ),
    },
    {
      key: 'shift',
      header: 'Shift',
      accessor: 'shift',
      sortable: true,
      render: (classroom) => (
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {classroom.shift || 'Any'}
          </span>
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
        <div className="p-3 bg-orange-100 rounded-lg">
          <Building className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Classrooms</h1>
          <p className="text-slate-600 dark:text-slate-300">Manage classroom resources and their availability</p>
        </div>
      </motion.div>

      <DataTable
        data={classrooms}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
        onCreate={handleCreate}
        title="All Classrooms"
        loading={loading}
        emptyMessage="No classrooms found. Add your first classroom to get started."
        selectable={true}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingClassroom ? 'Edit Classroom' : 'Add New Classroom'}
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
                Classroom Name *
              </label>
              <input
                type="text"
                name="name"
                required
                className="w-full px-5 py-4 bg-white/95 dark:bg-slate-700/95 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:shadow-md focus:shadow-lg backdrop-blur-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., CS-101"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Capacity *
              </label>
              <input
                type="number"
                name="capacity"
                required
                className="w-full px-5 py-4 bg-white/95 dark:bg-slate-700/95 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:shadow-md focus:shadow-lg backdrop-blur-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                value={formData.capacity}
                onChange={handleInputChange}
                placeholder="e.g., 60"
                min="1"
                max="200"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Type *
              </label>
              <div className="relative">
                <select
                  name="type"
                  required
                  className="w-full px-5 py-4 bg-white/95 dark:bg-slate-700/95 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:shadow-md focus:shadow-lg backdrop-blur-sm text-slate-700 dark:text-slate-200 appearance-none"
                  value={formData.type}
                  onChange={handleInputChange}
                >
                  <option value="classroom">Classroom</option>
                  <option value="laboratory">Laboratory</option>
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
              transition={{ delay: 0.4 }}
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
              className="sm:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Preferred Shift
              </label>
              <div className="relative">
                <select
                  name="shift"
                  className="w-full px-5 py-4 bg-white/95 dark:bg-slate-700/95 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:shadow-md focus:shadow-lg backdrop-blur-sm text-slate-700 dark:text-slate-200 appearance-none"
                  value={formData.shift}
                  onChange={handleInputChange}
                >
                  <option value="">Any Shift</option>
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Evening">Evening</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div 
            className="flex justify-end space-x-4 pt-8 border-t border-slate-200 dark:border-slate-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
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
              {editingClassroom ? 'Update Classroom' : 'Add Classroom'}
            </motion.button>
          </motion.div>
        </form>
      </Modal>
    </div>
  );
};

export default Classrooms;
