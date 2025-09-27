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
          <Users className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">
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
          <MapPin className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">
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
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">
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
          <h1 className="text-2xl font-bold text-gray-900">Classrooms</h1>
          <p className="text-gray-600">Manage classroom resources and their availability</p>
        </div>
      </motion.div>

      <DataTable
        data={classrooms}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        title="All Classrooms"
        loading={loading}
        emptyMessage="No classrooms found. Add your first classroom to get started."
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingClassroom ? 'Edit Classroom' : 'Add New Classroom'}
        size="medium"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Classroom Name *
              </label>
              <input
                type="text"
                name="name"
                required
                className="input-field"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., CS-101"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacity *
              </label>
              <input
                type="number"
                name="capacity"
                required
                className="input-field"
                value={formData.capacity}
                onChange={handleInputChange}
                placeholder="e.g., 60"
                min="1"
                max="200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type *
              </label>
              <select
                name="type"
                required
                className="input-field"
                value={formData.type}
                onChange={handleInputChange}
              >
                <option value="classroom">Classroom</option>
                <option value="laboratory">Laboratory</option>
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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Shift
              </label>
              <select
                name="shift"
                className="input-field"
                value={formData.shift}
                onChange={handleInputChange}
              >
                <option value="">Any Shift</option>
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
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
              {editingClassroom ? 'Update Classroom' : 'Add Classroom'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Classrooms;
