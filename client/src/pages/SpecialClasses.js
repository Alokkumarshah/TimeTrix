import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Trash2, Plus, X } from 'lucide-react';
import { batchAPI, specialClassAPI, subjectAPI } from '../services/api';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const periods = ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6'];

const SpecialClasses = () => {
  const [batches, setBatches] = useState([]);
  const [items, setItems] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [bulk, setBulk] = useState({ days: {} });
  const [selectedBatch, setSelectedBatch] = useState('');
  const [form, setForm] = useState({
    name: 'Lunch Break',
    type: 'lunch_break',
    batch: '',
    day: '',
    slots: [],
    startTime: '13:00',
    endTime: '13:30',
    fixedSlot: true
  });

  useEffect(() => {
    (async () => {
      try {
        const [bResp, sResp, subResp] = await Promise.all([
          batchAPI.getAll(),
          specialClassAPI.getAll(),
          subjectAPI.getAll()
        ]);
        setBatches(bResp.data || []);
        setItems(sResp.data || []);
        setSubjects(subResp.data || []);
      } catch (e) {
        console.error('Failed to load data', e);
      }
    })();
  }, []);

  // Auto-fill batch selection when selectedBatch changes
  useEffect(() => {
    if (selectedBatch) {
      setForm(prev => ({ ...prev, batch: selectedBatch }));
      setFixedForm(prev => ({ ...prev, batch: selectedBatch }));
    }
  }, [selectedBatch]);

  useEffect(() => {
    // group by batch
    const map = {};
    items.forEach(it => {
      const key = it.batch?._id || it.batch;
      if (!map[key]) map[key] = [];
      map[key].push(it);
    });
    setGrouped(map);
  }, [items]);

  const toggleSlot = (slot) => {
    setForm(prev => ({
      ...prev,
      slots: prev.slots.includes(slot) ? prev.slots.filter(s => s !== slot) : [...prev.slots, slot]
    }));
  };

  const createLunch = async () => {
    if (!form.batch || !form.day || form.slots.length === 0) {
      alert('Select batch, day and at least one period');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        type: 'lunch_break',
        batch: form.batch,
        day: form.day,
        slots: form.slots,
        startTime: form.startTime,
        endTime: form.endTime,
        fixedSlot: true
      };
      const res = await specialClassAPI.create(payload);
      setItems(prev => [res.data, ...prev]);
      setForm({ ...form, day: '', slots: [] });
    } catch (e) {
      alert('Failed to create lunch break');
    } finally {
      setSaving(false);
    }
  };

  const applyBulk = async () => {
    if (!form.batch) {
      alert('Select a batch');
      return;
    }
    const selectedDays = Object.keys(bulk.days).filter(d => bulk.days[d] && bulk.days[d].length > 0);
    if (selectedDays.length === 0) {
      alert('Select at least one day with periods');
      return;
    }
    setSaving(true);
    try {
      const requests = selectedDays.map(day => specialClassAPI.create({
        name: 'Lunch Break',
        type: 'lunch_break',
        batch: form.batch,
        day,
        slots: bulk.days[day],
        startTime: form.startTime,
        endTime: form.endTime,
        fixedSlot: true
      }));
      const results = await Promise.all(requests);
      setItems(prev => [...results.map(r => r.data), ...prev]);
      setShowBulk(false);
      setBulk({ days: {} });
    } catch (e) {
      alert('Failed to apply');
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (id) => {
    try {
      await specialClassAPI.delete(id);
      setItems(prev => prev.filter(i => i._id !== id));
    } catch (e) {
      alert('Failed to delete');
    }
  };

  // Fixed slot UI
  const [fixedForm, setFixedForm] = useState({ batch: '', day: '', slots: [], subject: '' });
  const createFixed = async () => {
    if (!fixedForm.batch || !fixedForm.day || fixedForm.slots.length === 0 || !fixedForm.subject) {
      alert('Select batch, day, subject and at least one period');
      return;
    }
    setSaving(true);
    try {
      const res = await specialClassAPI.create({
        name: 'Fixed Slot',
        type: 'fixed_slot',
        batch: fixedForm.batch,
        day: fixedForm.day,
        slots: fixedForm.slots,
        subject: fixedForm.subject,
        fixedSlot: true,
        startTime: '00:00',
        endTime: '00:00'
      });
      setItems(prev => [res.data, ...prev]);
      setFixedForm({ batch: '', day: '', slots: [], subject: '' });
    } catch (e) {
      alert('Failed to create fixed slot');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-3"
      >
        <div className="p-3 bg-indigo-100 rounded-lg">
          <Calendar className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Special Classes</h1>
          <p className="text-slate-600 dark:text-slate-300">Manage lunch breaks and fixed slots</p>
        </div>
      </motion.div>

      {/* Batch Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Select Batch</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-2">Choose Batch to Manage</label>
            <select
              className="input-field"
              value={selectedBatch}
              onChange={e => setSelectedBatch(e.target.value)}
            >
              <option value="">Select a batch</option>
              {batches.map(b => (
                <option key={b._id} value={b._id}>{b.name} - {b.department}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {selectedBatch && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Add Lunch Break</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm mb-2">Batch</label>
                <div className="input-field bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                  {batches.find(b => b._id === selectedBatch)?.name} - {batches.find(b => b._id === selectedBatch)?.department}
                </div>
              </div>
              <div className="flex items-end">
                <button onClick={() => setShowBulk(true)} disabled={!form.batch} className="btn-primary flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Configure Days & Periods</span>
                </button>
              </div>
            </div>
          </motion.div>

      {showBulk && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-start justify-center pt-16">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-2xl mx-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Set Lunch Breaks for Batch</h3>
              <button className="btn-secondary" onClick={() => setShowBulk(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Select Days and Periods for Lunch Breaks</label>
                <div className="space-y-3">
                  {days.map(day => (
                    <div key={day} className="flex items-center space-x-4 p-3 border border-slate-200 dark:border-slate-600 rounded-lg">
                      <div className="flex items-center space-x-2 min-w-[100px]">
                        <input 
                          type="checkbox" 
                          checked={!!bulk.days[day] && bulk.days[day].length > 0} 
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBulk(prev => ({ ...prev, days: { ...prev.days, [day]: [] } }));
                            } else {
                              setBulk(prev => {
                                const newDays = { ...prev.days };
                                delete newDays[day];
                                return { ...prev, days: newDays };
                              });
                            }
                          }} 
                        />
                        <span className="text-sm font-medium">{day}</span>
                      </div>
                      {bulk.days[day] && (
                        <div className="flex-1">
                          <select
                            multiple
                            className="input-field min-h-[80px]"
                            value={bulk.days[day]}
                            onChange={(e) => {
                              const selectedPeriods = Array.from(e.target.selectedOptions, option => option.value);
                              setBulk(prev => ({ ...prev, days: { ...prev.days, [day]: selectedPeriods } }));
                            }}
                          >
                            {periods.map(period => (
                              <option key={period} value={period}>{period}</option>
                            ))}
                          </select>
                          <p className="text-xs text-slate-500 mt-1">Hold Ctrl/Cmd to select multiple periods</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button className="btn-primary" onClick={applyBulk} disabled={saving}>{saving ? 'Applying...' : 'Apply Lunch Breaks'}</button>
            </div>
          </div>
        </div>
      )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="card"
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Fixed Slot Classes</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm mb-2">Batch</label>
                <div className="input-field bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                  {batches.find(b => b._id === selectedBatch)?.name} - {batches.find(b => b._id === selectedBatch)?.department}
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2">Subject</label>
                <select className="input-field" value={fixedForm.subject} onChange={e => setFixedForm({ ...fixedForm, subject: e.target.value })}>
                  <option value="">Select subject</option>
                  {(() => {
                    const selectedBatchData = batches.find(b => b._id === selectedBatch);
                    
                    if (!selectedBatchData) {
                      return [];
                    }
                    
                    if (!selectedBatchData.subjects || selectedBatchData.subjects.length === 0) {
                      return (
                        <option value="" disabled>
                          No subjects assigned to this batch
                        </option>
                      );
                    }
                    
                    // Handle both cases: subjects as objects (populated) or as IDs
                    let batchSubjects = [];
                    
                    if (selectedBatchData.subjects.length > 0 && typeof selectedBatchData.subjects[0] === 'object' && selectedBatchData.subjects[0]._id) {
                      // Subjects are already populated objects
                      batchSubjects = selectedBatchData.subjects;
                    } else {
                      // Subjects are IDs, need to find the actual subject objects
                      batchSubjects = selectedBatchData.subjects.map(subjectId => 
                        subjects.find(s => s._id === subjectId)
                      ).filter(Boolean);
                    }
                    
                    if (batchSubjects.length === 0) {
                      return (
                        <option value="" disabled>
                          No valid subjects found for this batch
                        </option>
                      );
                    }
                    
                    return batchSubjects.map(s => (<option key={s._id} value={s._id}>{s.name}</option>));
                  })()}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2">Day</label>
                <select className="input-field" value={fixedForm.day} onChange={e => setFixedForm({ ...fixedForm, day: e.target.value })}>
                  <option value="">Select day</option>
                  {days.map(d => (<option key={d} value={d}>{d}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2">Periods</label>
                <div className="grid grid-cols-2 gap-2">
                  {periods.map(p => (
                    <label key={p} className="flex items-center space-x-2">
                      <input type="checkbox" checked={fixedForm.slots.includes(p)} onChange={() => setFixedForm(prev => ({ ...prev, slots: prev.slots.includes(p) ? prev.slots.filter(s => s !== p) : [...prev.slots, p] }))} />
                      <span className="text-sm">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button className="btn-primary" onClick={createFixed} disabled={saving}>{saving ? 'Saving...' : 'Add Fixed Slot'}</button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="card"
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Configured Special Slots</h3>
            {(() => {
              const selectedBatchData = batches.find(b => b._id === selectedBatch);
              const selectedBatchItems = grouped[selectedBatch] || [];
              
              if (!selectedBatchData) {
                return <div className="text-slate-500">No batch selected.</div>;
              }
              
              if (selectedBatchItems.length === 0) {
                return <div className="text-slate-500">No special classes configured for {selectedBatchData.name} - {selectedBatchData.department}.</div>;
              }
              
              return (
                <div className="space-y-4">
                  <div className="">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{selectedBatchData.name} - {selectedBatchData.department}</div>
                    <div className="space-y-2">
                      {selectedBatchItems.map(item => (
                        <div key={item._id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="text-sm">
                            <div className="font-medium">
                              {item.type === 'lunch_break' ? 'Lunch Break' : item.type === 'fixed_slot' ? 'Fixed Slot' : item.name}
                            </div>
                            <div className="text-slate-500">
                              {item.day} • {(item.slots || []).join(', ')} {item.subject ? `• ${(typeof item.subject === 'object' ? item.subject.name : subjects.find(s => s._id === item.subject)?.name) || ''}` : ''}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button onClick={() => removeItem(item._id)} className="btn-secondary text-red-600 flex items-center space-x-1">
                              <Trash2 className="h-4 w-4" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        </>
      )}
    </div>
  );
};

export default SpecialClasses;
