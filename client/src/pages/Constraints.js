import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Calendar, Clock, Users, BookOpen, Building, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { constraintAPI, batchAPI, subjectAPI, classroomAPI, facultyAPI, timetableAPI } from '../services/api';
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
  const [limitations, setLimitations] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [filteredClassrooms, setFilteredClassrooms] = useState([]);
  const [filteredFaculty, setFilteredFaculty] = useState([]);
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

  // Debug: Log batch data when it changes
  useEffect(() => {
    if (batches.length > 0) {
      console.log('Batches loaded:', batches);
      console.log('First batch subjects:', batches[0]?.subjects);
      console.log('First batch classrooms:', batches[0]?.classrooms);
      console.log('First batch teachers:', batches[0]?.teachers);
    }
  }, [batches]);

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

  const analyzeConstraints = async () => {
    try {
      setAnalyzing(true);
      const response = await timetableAPI.generate({ allBatches: true });
      if (response.data && response.data.limitationsReport) {
        setLimitations(response.data.limitationsReport);
      }
    } catch (error) {
      console.error('Error analyzing constraints:', error);
    } finally {
      setAnalyzing(false);
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

  // Helper function to safely get assigned resources from batch
  const getBatchResources = (batch, resourceType) => {
    if (!batch || !batch[resourceType]) return [];
    
    const resources = batch[resourceType];
    
    // If resources are populated objects, return them directly
    if (resources.length > 0 && typeof resources[0] === 'object' && resources[0]._id) {
      return resources;
    }
    
    // If resources are just IDs, filter from the main arrays
    const allResources = resourceType === 'subjects' ? subjects : 
                        resourceType === 'classrooms' ? classrooms : faculty;
    
    return allResources.filter(resource => 
      resources.some(id => id.toString() === resource._id.toString())
    );
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
    setFilteredSubjects([]);
    setFilteredClassrooms([]);
    setFilteredFaculty([]);
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

  const handleBulkDelete = async (selectedConstraints) => {
    const constraintNames = selectedConstraints.map(c => {
      const details = c.details;
      if (c.type === 'subject_slot_preference') {
        const subject = subjects.find(s => s._id === details.subject);
        return `${subject?.name || 'Unknown Subject'} constraint`;
      } else if (c.type === 'classroom_preference') {
        const classroom = classrooms.find(c => c._id === details.classroom);
        return `${classroom?.name || 'Unknown Classroom'} constraint`;
      } else {
        const teacher = faculty.find(f => f._id === details.faculty);
        return `${teacher?.name || 'Unknown Teacher'} constraint`;
      }
    }).join(', ');

    if (window.confirm(`Are you sure you want to delete ${selectedConstraints.length} constraint(s)?\n\n${constraintNames}`)) {
      try {
        // Delete all selected constraints
        const deletePromises = selectedConstraints.map(constraint => 
          constraintAPI.delete(constraint._id)
        );
        await Promise.all(deletePromises);
        await fetchData();
        alert(`Successfully deleted ${selectedConstraints.length} constraint(s)`);
      } catch (error) {
        console.error('Error deleting constraints:', error);
        alert('Failed to delete some constraints');
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

  const handleInputChange = async (e) => {
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
    
    // Filter subjects, classrooms, and faculty when batch changes
    if (name === 'batch') {
      if (value) {
        const selectedBatch = batches.find(b => b._id === value);
        if (selectedBatch) {
          console.log('Selected batch:', selectedBatch);
          console.log('Batch subjects:', selectedBatch.subjects);
          console.log('Batch classrooms:', selectedBatch.classrooms);
          console.log('Batch teachers:', selectedBatch.teachers);
          
          // Filter subjects assigned to this batch
          const batchSubjects = getBatchResources(selectedBatch, 'subjects');
          setFilteredSubjects(batchSubjects);
          
          // Filter classrooms assigned to this batch
          const batchClassrooms = getBatchResources(selectedBatch, 'classrooms');
          setFilteredClassrooms(batchClassrooms);
          
          // Filter faculty assigned to this batch
          const batchFaculty = getBatchResources(selectedBatch, 'teachers');
          setFilteredFaculty(batchFaculty);
          
          console.log('Filtered subjects:', batchSubjects);
          console.log('Filtered classrooms:', batchClassrooms);
          console.log('Filtered faculty:', batchFaculty);
        }
      } else {
        // Reset filters when no batch is selected
        setFilteredSubjects([]);
        setFilteredClassrooms([]);
        setFilteredFaculty([]);
      }
      
      // Clear dependent fields when batch changes
      setFormData(prev => ({
        ...prev,
        subject: '',
        classroom: '',
        faculty: '',
      }));
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
      render: (constraint) => {
        const details = constraint.details;
        if (constraint.type === 'subject_slot_preference') {
          // Find the subject name from the subjects array using the subject ID
          const subject = subjects.find(s => s._id === details.subject);
          return subject?.name || 'Unknown Subject';
        } else if (constraint.type === 'classroom_preference') {
          // Find the classroom name from the classrooms array using the classroom ID
          const classroom = classrooms.find(c => c._id === details.classroom);
          return classroom?.name || 'Unknown Classroom';
        } else {
          // Find the teacher name from the faculty array using the faculty ID
          const teacher = faculty.find(f => f._id === details.faculty);
          return teacher?.name || 'Unknown Teacher';
        }
      },
    },
    {
      key: 'batch',
      header: 'Batch',
      accessor: 'details',
      render: (constraint) => {
        const details = constraint.details;
        // Find the batch name from the batches array using the batch ID
        const batch = batches.find(b => b._id === details.batch);
        return batch?.name || 'Unknown';
      },
    },
    {
      key: 'day',
      header: 'Day',
      accessor: 'details',
      render: (constraint) => {
        const details = constraint.details;
        return details.day || '-';
      },
    },
    {
      key: 'slot',
      header: 'Period',
      accessor: 'details',
      render: (constraint) => {
        const details = constraint.details;
        return details.slot || '-';
      },
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Constraints</h1>
          <p className="text-slate-600 dark:text-slate-300">Set slot preferences and constraints for timetable generation</p>
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
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Fix Subject Slot</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">Set specific time slots for subjects</p>
            </div>
          </div>
        </div>

        <div className="card cursor-pointer hover:shadow-lg transition-shadow duration-200" onClick={() => handleCreate('classroom_preference')}>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Building className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Fix Classroom Slot</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">Reserve classrooms for specific slots</p>
            </div>
          </div>
        </div>

        <div className="card cursor-pointer hover:shadow-lg transition-shadow duration-200" onClick={() => handleCreate('teacher_slot_preference')}>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Fix Teacher Slot</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">Set teacher availability preferences</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Constraint Analysis Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Constraint Analysis</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">Analyze constraints and view limitations</p>
            </div>
          </div>
          <button
            onClick={analyzeConstraints}
            disabled={analyzing || constraints.length === 0}
            className="btn-primary flex items-center space-x-2"
          >
            {analyzing ? (
              <>
                <LoadingSpinner size="small" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Settings className="h-4 w-4" />
                <span>Analyze Constraints</span>
              </>
            )}
          </button>
        </div>

        {/* Debug Section - Remove this after testing */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Debug Info:</h4>
            <div className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
              <p>Total batches: {batches.length}</p>
              <p>Filtered subjects: {filteredSubjects.length}</p>
              <p>Filtered classrooms: {filteredClassrooms.length}</p>
              <p>Filtered faculty: {filteredFaculty.length}</p>
              {batches.length > 0 && (
                <div>
                  <p>First batch: {batches[0].name}</p>
                  <p>First batch subjects: {batches[0].subjects?.length || 0}</p>
                  <p>First batch classrooms: {batches[0].classrooms?.length || 0}</p>
                  <p>First batch teachers: {batches[0].teachers?.length || 0}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {limitations && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Constrained Batches</span>
                </div>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {limitations.summary.totalConstrainedBatches}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium text-red-900">Unavailable Slots</span>
                </div>
                <p className="text-2xl font-bold text-red-900 mt-1">
                  {limitations.summary.totalUnavailableSlots}
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-900">Conflicts</span>
                </div>
                <p className="text-2xl font-bold text-yellow-900 mt-1">
                  {limitations.summary.totalConflicts}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">Violations</span>
                </div>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  {limitations.summary.totalConstraintViolations.subjectSlot + 
                   limitations.summary.totalConstraintViolations.classroomSlot + 
                   limitations.summary.totalConstraintViolations.teacherSlot}
                </p>
              </div>
            </div>

            {/* Constraint Violations */}
            {(limitations.constraintViolations.subjectSlot.length > 0 || 
              limitations.constraintViolations.classroomSlot.length > 0 || 
              limitations.constraintViolations.teacherSlot.length > 0) && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Constraint Violations</h4>
                
                {/* Subject Slot Violations */}
                {limitations.constraintViolations.subjectSlot.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <BookOpen className="h-5 w-5 text-red-600" />
                      <h5 className="font-semibold text-red-900">Subject Slot Violations ({limitations.constraintViolations.subjectSlot.length})</h5>
                    </div>
                    <div className="space-y-2">
                      {limitations.constraintViolations.subjectSlot.map((violation, index) => (
                        <div key={index} className="bg-white p-3 rounded border border-red-200">
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            <span className="font-medium">{violation.batch}</span>: {violation.subject} not scheduled at preferred time <span className="font-medium">{violation.preferredTime}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Classroom Slot Violations */}
                {limitations.constraintViolations.classroomSlot.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Building className="h-5 w-5 text-yellow-600" />
                      <h5 className="font-semibold text-yellow-900">Classroom Slot Violations ({limitations.constraintViolations.classroomSlot.length})</h5>
                    </div>
                    <div className="space-y-2">
                      {limitations.constraintViolations.classroomSlot.map((violation, index) => (
                        <div key={index} className="bg-white p-3 rounded border border-yellow-200">
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            <span className="font-medium">{violation.batch}</span>: {violation.classroom} not reserved at preferred time <span className="font-medium">{violation.preferredTime}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Teacher Slot Violations */}
                {limitations.constraintViolations.teacherSlot.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Users className="h-5 w-5 text-purple-600" />
                      <h5 className="font-semibold text-purple-900">Teacher Slot Violations ({limitations.constraintViolations.teacherSlot.length})</h5>
                    </div>
                    <div className="space-y-2">
                      {limitations.constraintViolations.teacherSlot.map((violation, index) => (
                        <div key={index} className="bg-white p-3 rounded border border-purple-200">
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            <span className="font-medium">{violation.batch}</span>: {violation.teacher} not available at preferred time <span className="font-medium">{violation.preferredTime}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recommendations */}
            {limitations.recommendations.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Info className="h-5 w-5 text-blue-600" />
                  <h5 className="font-semibold text-blue-900">Recommendations</h5>
                </div>
                <div className="space-y-2">
                  {limitations.recommendations.map((rec, index) => (
                    <div key={index} className="bg-white p-3 rounded border border-blue-200">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          rec.severity === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {rec.severity.toUpperCase()}
                        </span>
                        <span className="text-sm text-slate-700 dark:text-slate-300">{rec.message}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">({rec.count} issues)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Issues */}
            {!limitations.summary.hasLimitations && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-900 font-medium">All constraints are satisfied! No violations found.</span>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Constraints Table */}
      <DataTable
        data={constraints}
        columns={columns}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
        title="All Constraints"
        loading={loading}
        emptyMessage="No constraints found. Create constraints to fix specific slots."
        selectable={true}
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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Subject *
                </label>
                <select
                  name="subject"
                  required
                  className="input-field"
                  value={formData.subject}
                  onChange={handleInputChange}
                  disabled={!formData.batch}
                >
                  <option value="">
                    {!formData.batch ? 'Select Batch First' : 'Select Subject'}
                  </option>
                  {filteredSubjects.map(subject => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name} ({subject.code})
                    </option>
                  ))}
                </select>
                {!formData.batch && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Please select a batch first to see available subjects</p>
                )}
              </div>
            )}

            {constraintType === 'classroom_preference' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Classroom *
                </label>
                <select
                  name="classroom"
                  required
                  className="input-field"
                  value={formData.classroom}
                  onChange={handleInputChange}
                  disabled={!formData.batch}
                >
                  <option value="">
                    {!formData.batch ? 'Select Batch First' : 'Select Classroom'}
                  </option>
                  {filteredClassrooms.map(classroom => (
                    <option key={classroom._id} value={classroom._id}>
                      {classroom.name} ({classroom.department})
                    </option>
                  ))}
                </select>
                {!formData.batch && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Please select a batch first to see assigned classrooms</p>
                )}
                {formData.batch && filteredClassrooms.length === 0 && (
                  <p className="text-xs text-yellow-600 mt-1">No classrooms assigned to this batch</p>
                )}
              </div>
            )}

            {constraintType === 'teacher_slot_preference' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Teacher *
                </label>
                <select
                  name="faculty"
                  required
                  className="input-field"
                  value={formData.faculty}
                  onChange={handleInputChange}
                  disabled={!formData.batch}
                >
                  <option value="">
                    {!formData.batch ? 'Select Batch First' : 'Select Teacher'}
                  </option>
                  {filteredFaculty.map(teacher => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.name} ({teacher.department})
                    </option>
                  ))}
                </select>
                {!formData.batch && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Please select a batch first to see assigned teachers</p>
                )}
                {formData.batch && filteredFaculty.length === 0 && (
                  <p className="text-xs text-yellow-600 mt-1">No teachers assigned to this batch</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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