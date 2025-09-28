import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Search, 
  Filter, 
  Eye, 
  Download, 
  Trash2, 
  Edit, 
  Clock,
  Users,
  Building,
  BookOpen,
  GraduationCap,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { timetableAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const SavedTimetables = () => {
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState({
    semesters: [],
    academicYears: [],
    batches: []
  });
  const [filters, setFilters] = useState({
    semester: '',
    academicYear: '',
    batchId: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 10
  });
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [showTimetableModal, setShowTimetableModal] = useState(false);

  useEffect(() => {
    fetchFilterOptions();
    fetchTimetables();
  }, []);

  useEffect(() => {
    fetchTimetables();
  }, [filters, pagination.current]);

  const fetchFilterOptions = async () => {
    try {
      const response = await timetableAPI.getFilterOptions();
      setFilterOptions(response.data);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const fetchTimetables = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        page: pagination.current,
        limit: pagination.limit
      };
      
      const response = await timetableAPI.getSaved(params);
      setTimetables(response.data.timetables);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching timetables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleViewTimetable = async (timetableId) => {
    try {
      const response = await timetableAPI.getSavedById(timetableId);
      setSelectedTimetable(response.data.timetable);
      setShowTimetableModal(true);
    } catch (error) {
      console.error('Error fetching timetable:', error);
      alert('Failed to load timetable details');
    }
  };

  const handleDeleteTimetable = async (timetableId) => {
    if (!window.confirm('Are you sure you want to delete this timetable?')) {
      return;
    }

    try {
      await timetableAPI.delete(timetableId);
      fetchTimetables();
      alert('Timetable deleted successfully');
    } catch (error) {
      console.error('Error deleting timetable:', error);
      alert('Failed to delete timetable');
    }
  };

  const exportTimetable = (timetable) => {
    const csvContent = generateCSV(timetable.timetableData);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${timetable.name}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateCSV = (timetableData) => {
    const headers = ['Batch', 'Day', 'Period', 'Subject', 'Faculty', 'Classroom', 'Department', 'Shift'];
    const rows = [headers.join(',')];

    timetableData.forEach(entry => {
      const row = [
        entry.batch,
        entry.day,
        entry.period,
        entry.subject,
        entry.faculty,
        entry.classroom,
        entry.department,
        entry.shift
      ].map(field => `"${field}"`).join(',');
      rows.push(row);
    });

    return rows.join('\n');
  };

  const renderTimetableGrid = (timetableData) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const periods = ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6'];

    // Group timetable by batch
    const batchTimetables = {};
    timetableData.forEach(entry => {
      if (!batchTimetables[entry.batch]) {
        batchTimetables[entry.batch] = {};
      }
      if (!batchTimetables[entry.batch][entry.day]) {
        batchTimetables[entry.batch][entry.day] = {};
      }
      batchTimetables[entry.batch][entry.day][entry.period] = entry;
    });

    return Object.entries(batchTimetables).map(([batchName, batchData]) => (
      <div key={batchName} className="mb-8">
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
          <GraduationCap className="h-5 w-5 mr-2 text-blue-600" />
          {batchName}
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Period
                </th>
                {days.map(day => (
                  <th key={day} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {periods.map(period => (
                <tr key={period}>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {period}
                  </td>
                  {days.map(day => {
                    const entry = batchData[day]?.[period];
                    return (
                      <td key={day} className="px-2 py-2 text-sm">
                        {entry ? (
                          <div className={`rounded-lg p-2 text-xs ${
                            entry.hasTeacherCollision 
                              ? 'bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-600' 
                              : entry.hasClassroomCollision 
                                ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-600'
                                : entry.fallbackClassroom
                                  ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-600'
                                  : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-600'
                          }`}>
                            <div className="font-semibold">{entry.subject}</div>
                            <div className="text-xs opacity-75">{entry.faculty}</div>
                            <div className="text-xs opacity-75">{entry.classroom}</div>
                          </div>
                        ) : (
                          <div className="text-slate-400 dark:text-slate-500 text-center py-2">-</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-4 mb-8"
      >
        <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg">
          <Calendar className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 font-display gradient-text">
            Saved Timetables
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg mt-2">
            View and manage your previously saved timetables
          </p>
          <div className="h-1 w-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mt-3" />
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="input-field pl-10"
                placeholder="Search timetables..."
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Semester
            </label>
            <select
              value={filters.semester}
              onChange={(e) => handleFilterChange('semester', e.target.value)}
              className="input-field"
            >
              <option value="">All Semesters</option>
              {filterOptions.semesters.map(semester => (
                <option key={semester} value={semester}>{semester}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Academic Year
            </label>
            <select
              value={filters.academicYear}
              onChange={(e) => handleFilterChange('academicYear', e.target.value)}
              className="input-field"
            >
              <option value="">All Years</option>
              {filterOptions.academicYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Batch
            </label>
            <select
              value={filters.batchId}
              onChange={(e) => handleFilterChange('batchId', e.target.value)}
              className="input-field"
            >
              <option value="">All Batches</option>
              {filterOptions.batches.map(batch => (
                <option key={batch._id} value={batch._id}>
                  {batch.name} - {batch.department}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({ semester: '', academicYear: '', batchId: '', search: '' });
                setPagination(prev => ({ ...prev, current: 1 }));
              }}
              className="btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </motion.div>

      {/* Timetables List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="large" />
          </div>
        ) : timetables.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400">No saved timetables found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {timetables.map((timetable) => (
              <motion.div
                key={timetable._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        {timetable.name}
                      </h3>
                      {timetable.statistics.teacherConflicts === 0 && timetable.statistics.classroomConflicts === 0 ? (
                        <div className="flex items-center space-x-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-xs">
                          <CheckCircle className="h-3 w-3" />
                          <span>Conflict-Free</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-full text-xs">
                          <AlertCircle className="h-3 w-3" />
                          <span>Has Conflicts</span>
                        </div>
                      )}
                    </div>
                    
                    {timetable.description && (
                      <p className="text-slate-600 dark:text-slate-400 mb-3">{timetable.description}</p>
                    )}
                    
                    <div className="flex items-center space-x-6 text-sm text-slate-500 dark:text-slate-400 mb-4">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{timetable.semester} • {timetable.academicYear}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(timetable.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{timetable.batches.length} batches</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                        <span>{timetable.statistics.totalClasses} classes</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-green-600" />
                        <span>{timetable.statistics.uniqueFaculty} faculty</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-purple-600" />
                        <span>{timetable.statistics.classroomsUsed} classrooms</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span>{timetable.statistics.teacherConflicts + timetable.statistics.classroomConflicts} conflicts</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleViewTimetable(timetable._id)}
                      className="btn-secondary flex items-center space-x-1"
                      title="View Timetable"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </button>
                    
                    <button
                      onClick={() => exportTimetable(timetable)}
                      className="btn-secondary flex items-center space-x-1"
                      title="Export CSV"
                    >
                      <Download className="h-4 w-4" />
                      <span>Export</span>
                    </button>
                    
                    <button
                      onClick={() => handleDeleteTimetable(timetable._id)}
                      className="btn-secondary flex items-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Delete Timetable"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Showing {((pagination.current - 1) * pagination.limit) + 1} to {Math.min(pagination.current * pagination.limit, pagination.total)} of {pagination.total} timetables
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                disabled={pagination.current === 1}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="px-3 py-2 text-sm text-slate-700 dark:text-slate-300">
                Page {pagination.current} of {pagination.pages}
              </span>
              
              <button
                onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                disabled={pagination.current === pagination.pages}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Timetable View Modal */}
      {showTimetableModal && selectedTimetable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-7xl max-h-[90vh] overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {selectedTimetable.name}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {selectedTimetable.semester} • {selectedTimetable.academicYear}
                </p>
              </div>
              <button
                onClick={() => setShowTimetableModal(false)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {renderTimetableGrid(selectedTimetable.timetableData)}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SavedTimetables;
