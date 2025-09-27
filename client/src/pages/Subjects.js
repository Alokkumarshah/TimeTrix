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
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
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
        <span className="text-sm text-gray-600">
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
        <span className="text-sm text-gray-600">
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
        <span className="text-sm text-gray-600">
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
          <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
          <p className="text-gray-600">Manage academic subjects and their scheduling requirements</p>
        </div>
      </motion.div>

      <DataTable
        data={subjects}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        title="All Subjects"
        loading={loading}
        emptyMessage="No subjects found. Add your first subject to get started."
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSubject ? 'Edit Subject' : 'Add New Subject'}
        size="medium"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject Name *
              </label>
              <input
                type="text"
                name="name"
                required
                className="input-field"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Data Structures and Algorithms"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject Code *
              </label>
              <input
                type="text"
                name="code"
                required
                className="input-field"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="e.g., CS-301"
              />
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
                Required Classes Per Week *
              </label>
              <input
                type="number"
                name="requiredClassesPerWeek"
                required
                className="input-field"
                value={formData.requiredClassesPerWeek}
                onChange={handleInputChange}
                placeholder="e.g., 3"
                min="1"
                max="10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Classes Per Day
              </label>
              <input
                type="number"
                name="maxClassesPerDay"
                className="input-field"
                value={formData.maxClassesPerDay}
                onChange={handleInputChange}
                placeholder="e.g., 2"
                min="1"
                max="5"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="isElective"
              id="isElective"
              checked={formData.isElective}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="isElective" className="ml-2 block text-sm text-gray-700">
              This is an elective subject
            </label>
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
              {editingSubject ? 'Update Subject' : 'Add Subject'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Subjects;
