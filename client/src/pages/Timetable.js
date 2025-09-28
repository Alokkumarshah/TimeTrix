import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Play, Download, Clock, Users, BookOpen, Building, GraduationCap, Save, CheckCircle } from 'lucide-react';
import { batchAPI, timetableAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Timetable = () => {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [timetable, setTimetable] = useState(null);
  const [loading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [allBatchesMode, setAllBatchesMode] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [isConflictFree, setIsConflictFree] = useState(false);
  const [canSave, setCanSave] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveForm, setSaveForm] = useState({
    name: '',
    description: '',
    academicYear: new Date().getFullYear().toString()
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const periods = ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6'];

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const response = await batchAPI.getAll();
      setBatches(response.data || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const generateTimetable = async () => {
    if (!selectedBatch && !allBatchesMode) {
      alert('Please select a batch or enable all batches mode');
      return;
    }

    setGenerating(true);
    try {
      const response = await timetableAPI.generate(selectedBatch, allBatchesMode);
      console.log('Full timetable response:', response);
      console.log('Timetable response data:', response.data);
      
      if (response.data.timetable) {
        // Single batch mode
        console.log('Single batch mode - timetable data:', response.data.timetable);
        setTimetable(response.data.timetable);
      } else if (response.data.batchTimetables) {
        // All batches mode - flatten the data
        console.log('All batches mode - batchTimetables:', response.data.batchTimetables);
        const allTimetables = [];
        Object.values(response.data.batchTimetables).forEach(batchTimetable => {
          allTimetables.push(...batchTimetable);
        });
        console.log('Flattened timetable data:', allTimetables);
        setTimetable(allTimetables);
      } else {
        console.log('Direct data mode:', response.data);
        setTimetable(response.data);
      }
      
      // Set statistics and save status
      if (response.data.statistics) {
        setStatistics(response.data.statistics);
      }
      if (response.data.isConflictFree !== undefined) {
        setIsConflictFree(response.data.isConflictFree);
      }
      if (response.data.canSave !== undefined) {
        setCanSave(response.data.canSave);
      }
    } catch (error) {
      console.error('Error generating timetable:', error);
      console.error('Error details:', error.response?.data);
      alert('Failed to generate timetable: ' + (error.response?.data?.error || error.message));
    } finally {
      setGenerating(false);
    }
  };

  const exportTimetable = () => {
    if (!timetable) return;

    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timetable-${selectedBatch || 'all'}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSaveTimetable = async () => {
    if (!timetable || !canSave) return;

    setSaving(true);
    try {
      const batchIds = allBatchesMode 
        ? batches.map(b => b._id)
        : batches.filter(b => b._id === selectedBatch).map(b => b._id);

      // Remove any incomplete entries (e.g., missing period) before saving
      const cleanedTimetable = (timetable || []).filter(entry => entry && entry.batch && entry.day && entry.period);

      const saveData = {
        name: saveForm.name,
        description: saveForm.description,
        academicYear: saveForm.academicYear,
        batches: batchIds,
        timetableData: cleanedTimetable,
        statistics: statistics
      };

      await timetableAPI.save(saveData);
      alert('Timetable saved successfully!');
      setShowSaveModal(false);
      setSaveForm({
        name: '',
        description: '',
        academicYear: new Date().getFullYear().toString()
      });
    } catch (error) {
      console.error('Error saving timetable:', error);
      alert('Failed to save timetable: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  const generateCSV = () => {
    if (!timetable) return '';

    const headers = ['Batch', 'Day', 'Period', 'Subject', 'Faculty', 'Classroom', 'Department', 'Shift'];
    const rows = [headers.join(',')];

    timetable.forEach(entry => {
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

  const renderTimetableGrid = () => {
    if (!timetable || timetable.length === 0) {
      return (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">No timetable generated yet</p>
        </div>
      );
    }

    console.log('Rendering timetable with data:', timetable);

    // Group timetable by batch
    const batchTimetables = {};
    timetable.forEach(entry => {
      if (!entry || !entry.batch || !entry.day || !entry.period) {
        console.warn('Invalid timetable entry:', entry);
        return;
      }
      
      if (!batchTimetables[entry.batch]) {
        batchTimetables[entry.batch] = {};
      }
      if (!batchTimetables[entry.batch][entry.day]) {
        batchTimetables[entry.batch][entry.day] = {};
      }
      batchTimetables[entry.batch][entry.day][entry.period] = entry;
    });

    return Object.entries(batchTimetables).map(([batchName, batchData]) => (
      <motion.div
        key={batchName}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center">
          <GraduationCap className="h-6 w-6 mr-3 text-blue-600" />
          {batchName}
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg backdrop-blur-sm">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Period
                </th>
                {days.map(day => (
                  <th key={day} className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {periods.map(period => (
                <tr key={period} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {period}
                  </td>
                  {days.map(day => {
                    const entry = batchData[day]?.[period];
                    return (
                      <td key={day} className="px-4 py-3 text-sm">
                        {entry ? (
                          entry.subject === 'Lunch Break' ? (
                            <div className="rounded-xl p-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 text-center">
                              <div className="text-green-800 dark:text-green-200 font-extrabold text-lg tracking-wide">Lunch</div>
                            </div>
                          ) : (
                            <div className={`rounded-xl p-4 shadow-sm transition-all duration-300 hover:shadow-md ${
                              entry.hasTeacherCollision 
                                ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-600' 
                                : entry.hasClassroomCollision 
                                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-600'
                                  : entry.fallbackClassroom
                                    ? 'bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300 dark:border-orange-600'
                                    : entry.fixedSlot
                                      ? 'bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-600'
                                      : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-600'
                            }`}>
                              <div className={`font-semibold text-sm ${
                                entry.hasTeacherCollision 
                                  ? 'text-red-900 dark:text-red-100' 
                                  : entry.hasClassroomCollision 
                                    ? 'text-yellow-900 dark:text-yellow-100'
                                    : entry.fallbackClassroom
                                      ? 'text-orange-900 dark:text-orange-100'
                                      : entry.fixedSlot
                                        ? 'text-purple-900 dark:text-purple-100'
                                        : 'text-blue-900 dark:text-blue-100'
                              }`}>
                                {entry.subject}
                                {entry.fixedSlot && (
                                  <span className="ml-2 text-xs bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full">
                                    FIXED
                                  </span>
                                )}
                                {entry.hasTeacherCollision && (
                                  <span className="ml-2 text-xs bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 px-2 py-1 rounded-full">
                                    TEACHER CONFLICT
                                  </span>
                                )}
                                {entry.hasClassroomCollision && !entry.hasTeacherCollision && (
                                  <span className="ml-2 text-xs bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full">
                                    ROOM CONFLICT
                                  </span>
                                )}
                                {entry.fallbackClassroom && !entry.hasTeacherCollision && !entry.hasClassroomCollision && (
                                  <span className="ml-2 text-xs bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-full">
                                    FALLBACK ROOM
                                  </span>
                                )}
                              </div>
                              <div className={`text-xs mt-2 flex items-center ${
                                entry.hasTeacherCollision 
                                  ? 'text-red-700 dark:text-red-300' 
                                  : entry.hasClassroomCollision 
                                    ? 'text-yellow-700 dark:text-yellow-300'
                                    : entry.fallbackClassroom
                                      ? 'text-orange-700 dark:text-orange-300'
                                      : entry.fixedSlot
                                        ? 'text-purple-700 dark:text-purple-300'
                                        : 'text-blue-700 dark:text-blue-300'
                              }`}>
                                <Users className="h-3 w-3 mr-1" />
                                {entry.faculty}
                              </div>
                              <div className={`text-xs mt-1 flex items-center ${
                                entry.hasTeacherCollision 
                                  ? 'text-red-600 dark:text-red-400' 
                                  : entry.hasClassroomCollision 
                                    ? 'text-yellow-600 dark:text-yellow-400'
                                    : entry.fallbackClassroom
                                      ? 'text-orange-600 dark:text-orange-400'
                                      : entry.fixedSlot
                                        ? 'text-purple-600 dark:text-purple-400'
                                        : 'text-blue-600 dark:text-blue-400'
                              }`}>
                                <Building className="h-3 w-3 mr-1" />
                                {entry.classroom}
                              </div>
                            </div>
                          )
                        ) : (
                          <div className="text-slate-400 dark:text-slate-500 text-center py-4">-</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    ));
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-4 mb-8"
      >
        <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
          <Calendar className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 font-display gradient-text">
            Timetable Generator
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg mt-2">
            Generate optimized class schedules using AI algorithms
          </p>
          <div className="h-1 w-20 bg-codehelp-gradient rounded-full mt-3" />
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="allBatches"
                checked={allBatchesMode}
                onChange={(e) => {
                  setAllBatchesMode(e.target.checked);
                  if (e.target.checked) setSelectedBatch('');
                }}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="allBatches" className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                Generate for all batches
              </label>
            </div>

            {!allBatchesMode && (
              <div className="min-w-0 flex-1 sm:max-w-xs">
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select a batch</option>
                  {batches.map(batch => (
                    <option key={batch._id} value={batch._id}>
                      {batch.name} - {batch.department}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={generateTimetable}
              disabled={generating || (!selectedBatch && !allBatchesMode)}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <LoadingSpinner size="small" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span>{generating ? 'Generating...' : 'Generate Timetable'}</span>
            </button>

            {timetable && (
              <>
                <button
                  onClick={exportTimetable}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Export CSV</span>
                </button>
                
                {canSave && (
                <button
                  onClick={() => { setShowSaveModal(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="btn-primary flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Timetable</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Timetable Display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Generated Timetable</h2>
          {timetable && (
            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
              <Clock className="h-4 w-4 mr-1" />
              Generated on {new Date().toLocaleString()}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="large" />
          </div>
        ) : (
          renderTimetableGrid()
        )}
      </motion.div>

      {/* Collision Summary */}
      {timetable && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Collision Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-red-200 border border-red-300 rounded"></div>
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Teacher Conflicts: {timetable.filter(t => t.hasTeacherCollision).length}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-yellow-200 border border-yellow-300 rounded"></div>
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Classroom Conflicts: {timetable.filter(t => t.hasClassroomCollision && !t.hasTeacherCollision).length}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-orange-200 border border-orange-300 rounded"></div>
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Fallback Classrooms: {timetable.filter(t => t.fallbackClassroom && !t.hasTeacherCollision && !t.hasClassroomCollision).length}
              </span>
            </div>
          </div>
          {(timetable.filter(t => t.hasTeacherCollision).length > 0 || 
            timetable.filter(t => t.hasClassroomCollision).length > 0 ||
            timetable.filter(t => t.fallbackClassroom).length > 0) && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>Note:</strong> Conflicts or fallback classrooms detected in the timetable. 
                {timetable.filter(t => t.fallbackClassroom).length > 0 && 
                  ` ${timetable.filter(t => t.fallbackClassroom).length} classes are using fallback classrooms instead of assigned ones.`
                }
                Consider regenerating to resolve these issues.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Statistics */}
      {timetable && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Classes</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{timetable.length}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Unique Faculty</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {new Set(timetable.map(t => t.faculty)).size}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Building className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Classrooms Used</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {new Set(timetable.map(t => t.classroom)).size}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Save Timetable Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 pt-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Save Timetable
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Timetable Name *
                </label>
                <input
                  type="text"
                  value={saveForm.name}
                  onChange={(e) => setSaveForm({...saveForm, name: e.target.value})}
                  className="input-field"
                  placeholder="e.g., Fall 2024 Timetable"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={saveForm.description}
                  onChange={(e) => setSaveForm({...saveForm, description: e.target.value})}
                  className="input-field"
                  rows={3}
                  placeholder="Optional description..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Academic Year *
                </label>
                <input
                  type="text"
                  value={saveForm.academicYear}
                  onChange={(e) => setSaveForm({...saveForm, academicYear: e.target.value})}
                  className="input-field"
                  placeholder="2024"
                  required
                />
              </div>
              
              {statistics && (
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      Conflict-Free Timetable
                    </span>
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-300">
                    {statistics.totalClasses} classes • {statistics.uniqueFaculty} faculty • {statistics.classroomsUsed} classrooms
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className="btn-secondary flex-1"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTimetable}
                disabled={saving || !saveForm.name || !saveForm.academicYear}
                className="btn-primary flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {saving ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Timetable;
