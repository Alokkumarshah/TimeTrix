import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { batchAPI, facultyAPI, subjectAPI, classroomAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Batches = () => {
  const [batches, setBatches] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    semester: '',
    studentsCount: '',
    shift: '',
    classrooms: [],
    teachers: [],
    subjects: [],
    subjectTeacherAssignments: {}, // Store subject-teacher assignments
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [batchesRes, facultyRes, subjectsRes, classroomsRes] = await Promise.all([
        batchAPI.getAll(),
        facultyAPI.getAll(),
        subjectAPI.getAll(),
        classroomAPI.getAll(),
      ]);

      setBatches(batchesRes.data || []);
      setFaculty(facultyRes.data || []);
      setSubjects(subjectsRes.data || []);
      setClassrooms(classroomsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter subjects by semester and department
  const filterSubjectsBySemester = async (semester, department) => {
    if (!semester) {
      setFilteredSubjects(subjects);
      return;
    }
    
    try {
      const response = await batchAPI.getSubjectsBySemester(semester, department);
      setFilteredSubjects(response.data.data || []);
    } catch (error) {
      console.error('Error filtering subjects:', error);
      // Fallback to client-side filtering
      const filtered = subjects.filter(subject => 
        subject.semester === parseInt(semester) && 
        (!department || subject.department === department)
      );
      setFilteredSubjects(filtered);
    }
  };

  // Get available teachers for selected subjects
  const getAvailableTeachers = async (selectedSubjectIds) => {
    if (!selectedSubjectIds || selectedSubjectIds.length === 0) {
      return [];
    }
    
    try {
      const response = await batchAPI.getTeachersBySubjects(selectedSubjectIds);
      return response.data.data || [];
    } catch (error) {
      console.error('Error getting teachers:', error);
      // Fallback to client-side filtering
      return faculty.filter(teacher => 
        teacher.subjects.some(subjectId => 
          selectedSubjectIds.includes(subjectId._id || subjectId)
        )
      );
    }
  };

  const handleCreate = () => {
    setEditingBatch(null);
    setFormData({
      name: '',
      department: '',
      semester: '',
      studentsCount: '',
      shift: '',
      classrooms: [],
      teachers: [],
      subjects: [],
      subjectTeacherAssignments: {},
    });
    setFilteredSubjects(subjects);
    setModalOpen(true);
  };

  const handleEdit = (batch) => {
    setEditingBatch(batch);
    const subjectTeacherAssignments = {};
    if (batch.subjectTeacherAssignments) {
      batch.subjectTeacherAssignments.forEach(assignment => {
        subjectTeacherAssignments[assignment.subject._id || assignment.subject] = assignment.teacher._id || assignment.teacher;
      });
    }
    
    setFormData({
      name: batch.name || '',
      department: batch.department || '',
      semester: batch.semester || '',
      studentsCount: batch.studentsCount || '',
      shift: batch.shift || '',
      classrooms: batch.classrooms?.map(c => c._id || c) || [],
      teachers: batch.teachers?.map(t => t._id || t) || [],
      subjects: batch.subjects?.map(s => s._id || s) || [],
      subjectTeacherAssignments,
    });
    
    // Filter subjects based on batch semester
    if (batch.semester) {
      filterSubjectsBySemester(batch.semester, batch.department);
    } else {
      setFilteredSubjects(subjects);
    }
    
    setModalOpen(true);
  };

  const handleDelete = async (batch) => {
    if (window.confirm(`Are you sure you want to delete batch "${batch.name}"?`)) {
      try {
        await batchAPI.delete(batch._id);
        await fetchData();
      } catch (error) {
        console.error('Error deleting batch:', error);
        alert('Failed to delete batch');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare subject-teacher assignments for backend
      const subjectTeacherAssignments = {};
      Object.entries(formData.subjectTeacherAssignments).forEach(([subjectId, teacherId]) => {
        if (teacherId && teacherId !== '') {
          subjectTeacherAssignments[subjectId] = teacherId;
        }
      });

      const batchData = {
        ...formData,
        subjectTeacherAssignments,
      };

      console.log('Sending batch data:', JSON.stringify(batchData, null, 2));

      if (editingBatch) {
        // Update existing batch
        await batchAPI.update(editingBatch._id, batchData);
      } else {
        // Create new batch
        await batchAPI.create(batchData);
      }
      setModalOpen(false);
      await fetchData();
    } catch (error) {
      console.error('Error saving batch:', error);
      const errorMessage = error.response?.data?.details || error.response?.data?.error || error.message || 'Failed to save batch';
      alert(`Failed to save batch: ${errorMessage}`);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // Filter subjects when semester or department changes
    if (name === 'semester' || name === 'department') {
      const newSemester = name === 'semester' ? value : formData.semester;
      const newDepartment = name === 'department' ? value : formData.department;
      filterSubjectsBySemester(newSemester, newDepartment);
    }
  };

  const handleMultiSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubjectTeacherAssignment = (subjectId, teacherId) => {
    setFormData(prev => ({
      ...prev,
      subjectTeacherAssignments: {
        ...prev.subjectTeacherAssignments,
        [subjectId]: teacherId,
      },
    }));
  };

  const columns = [
    {
      key: 'name',
      header: 'Batch Name',
      accessor: 'name',
      sortable: true,
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
    },
    {
      key: 'studentsCount',
      header: 'Students',
      accessor: 'studentsCount',
      sortable: true,
    },
    {
      key: 'shift',
      header: 'Shift',
      accessor: 'shift',
      sortable: true,
    },
    {
      key: 'classrooms',
      header: 'Classrooms',
      accessor: 'classrooms',
      render: (batch) => (
        <div className="flex flex-wrap gap-1">
          {batch.classrooms?.slice(0, 2).map((classroom, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
              title={`${classroom.name} (${classroom.capacity} seats, ${classroom.type})`}
            >
              {classroom.name || classroom}
            </span>
          ))}
          {batch.classrooms?.length > 2 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              +{batch.classrooms.length - 2} more
            </span>
          )}
          {(!batch.classrooms || batch.classrooms.length === 0) && (
            <span className="text-xs text-gray-500">No classrooms assigned</span>
          )}
        </div>
      ),
    },
    {
      key: 'subjects',
      header: 'Subjects',
      accessor: 'subjects',
      render: (batch) => (
        <span className="text-sm text-gray-600">
          {batch.subjects?.length || 0} subjects
        </span>
      ),
    },
    {
      key: 'teachers',
      header: 'Teachers',
      accessor: 'teachers',
      render: (batch) => (
        <span className="text-sm text-gray-600">
          {batch.teachers?.length || 0} teachers
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
        <div className="p-3 bg-blue-100 rounded-lg">
          <GraduationCap className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Batches</h1>
          <p className="text-gray-600">Manage student batches and their configurations</p>
        </div>
      </motion.div>

      <DataTable
        data={batches}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        title="All Batches"
        loading={loading}
        emptyMessage="No batches found. Create your first batch to get started."
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingBatch ? 'Edit Batch' : 'Create New Batch'}
        size="large"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch Name *
              </label>
              <input
                type="text"
                name="name"
                required
                className="input-field"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., CS-2024-A"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department *
              </label>
              <input
                type="text"
                name="department"
                required
                className="input-field"
                value={formData.department}
                onChange={handleInputChange}
                placeholder="e.g., Computer Science"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semester
              </label>
              <input
                type="number"
                name="semester"
                className="input-field"
                value={formData.semester}
                onChange={handleInputChange}
                placeholder="e.g., 1"
                min="1"
                max="8"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Students Count
              </label>
              <input
                type="number"
                name="studentsCount"
                className="input-field"
                value={formData.studentsCount}
                onChange={handleInputChange}
                placeholder="e.g., 60"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shift
              </label>
              <select
                name="shift"
                className="input-field"
                value={formData.shift}
                onChange={handleInputChange}
              >
                <option value="">Select Shift</option>
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subjects for Semester {formData.semester || 'All'}
            </label>
            <div className="space-y-3 max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-3">
              {filteredSubjects.map((subject) => (
                <div key={subject._id} className="flex items-center space-x-3 p-2 border border-gray-200 rounded-lg">
                  <input
                    type="checkbox"
                    checked={formData.subjects.includes(subject._id)}
                    onChange={(e) => {
                      const newSubjects = e.target.checked
                        ? [...formData.subjects, subject._id]
                        : formData.subjects.filter(id => id !== subject._id);
                      handleMultiSelectChange('subjects', newSubjects);
                    }}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700">{subject.name}</span>
                    <span className="text-xs text-gray-500 ml-2">({subject.code})</span>
                  </div>
                  {formData.subjects.includes(subject._id) && (
                    <select
                      value={formData.subjectTeacherAssignments[subject._id] || ''}
                      onChange={(e) => handleSubjectTeacherAssignment(subject._id, e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="">Select Teacher</option>
                      {faculty
                        .filter(teacher => teacher.subjects.some(subId => 
                          (subId._id || subId) === subject._id
                        ))
                        .map(teacher => (
                          <option key={teacher._id} value={teacher._id}>
                            {teacher.name} ({teacher.department})
                          </option>
                        ))}
                    </select>
                  )}
                </div>
              ))}
              {filteredSubjects.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  {formData.semester ? `No subjects found for semester ${formData.semester}` : 'No subjects available'}
                </p>
              )}
            </div>
          </div>


          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Classrooms
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3">
              {classrooms.map((classroom) => (
                <label key={classroom._id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.classrooms.includes(classroom._id)}
                    onChange={(e) => {
                      const newClassrooms = e.target.checked
                        ? [...formData.classrooms, classroom._id]
                        : formData.classrooms.filter(id => id !== classroom._id);
                      handleMultiSelectChange('classrooms', newClassrooms);
                    }}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">
                    {classroom.name} ({classroom.capacity} seats, {classroom.type})
                  </span>
                </label>
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
              {editingBatch ? 'Update Batch' : 'Create Batch'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Batches;
