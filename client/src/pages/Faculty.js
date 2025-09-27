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
        <span className="text-sm text-gray-600">
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
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
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
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
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
          <h1 className="text-2xl font-bold text-gray-900">Faculty</h1>
          <p className="text-gray-600">Manage faculty members and their teaching assignments</p>
        </div>
      </motion.div>

      <DataTable
        data={faculty}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        title="All Faculty Members"
        loading={loading}
        emptyMessage="No faculty members found. Add your first faculty member to get started."
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingFaculty ? 'Edit Faculty Member' : 'Add New Faculty Member'}
        size="large"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                required
                className="input-field"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Dr. John Smith"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                required
                className="input-field"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="e.g., john.smith@university.edu"
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
                Max Load Per Week (hours)
              </label>
              <input
                type="number"
                name="maxLoadPerWeek"
                className="input-field"
                value={formData.maxLoadPerWeek}
                onChange={handleInputChange}
                placeholder="e.g., 40"
                min="1"
                max="60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Average Leaves Per Month
              </label>
              <input
                type="number"
                name="averageLeavesPerMonth"
                className="input-field"
                value={formData.averageLeavesPerMonth}
                onChange={handleInputChange}
                placeholder="e.g., 2"
                min="0"
                max="10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teaching Subjects and Semesters
            </label>
            <div className="space-y-3 max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-3">
              {subjects.map((subject) => (
                <div key={subject._id} className="flex items-center space-x-3 p-2 border border-gray-200 rounded-lg">
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
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700">{subject.name}</span>
                    <span className="text-xs text-gray-500 ml-2">(Sem {subject.semester})</span>
                  </div>
                  {formData.subjects.includes(subject._id) && (
                    <input
                      type="number"
                      placeholder="Semester"
                      min="1"
                      max="8"
                      className="text-xs border border-gray-300 rounded px-2 py-1 w-20"
                      value={formData.semestersTaught.find(st => 
                        (st.subject._id || st.subject) === subject._id
                      )?.semester || ''}
                      onChange={(e) => handleSubjectSemesterChange(subject._id, e.target.value)}
                    />
                  )}
                </div>
              ))}
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
              {editingFaculty ? 'Update Faculty' : 'Add Faculty'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Faculty;
