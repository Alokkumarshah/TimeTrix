
const Classroom = require('../models/Classroom');
const Subject = require('../models/Subject');
const Faculty = require('../models/Faculty');
const Batch = require('../models/Batch');
const Constraint = require('../models/Constraint');
const SpecialClass = require('../models/SpecialClass');

exports.timetablePage = async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const batches = await Batch.find().populate('classrooms teachers');
  res.render('timetable', { timetable: null, batches });
};

exports.reviewTimetable = (req, res) => {
  // TODO: Implement review/approval workflow
  res.send('Timetable submitted for review.');
};

exports.generateTimetable = async function(req, res) {
  try {
    const classrooms = await Classroom.find();
    const subjects = await Subject.find();
    const faculties = await Faculty.find();
    const batches = await Batch.find();
    const constraints = await Constraint.find();
    const specialClasses = await SpecialClass.find();
    
    const subjectSlotConstraintsCount = constraints.filter(c => c.type === 'subject_slot_preference').length;
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const periods = ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6'];
    let selectedBatchId = req.body && req.body.batchId;
    let batchList = batches;
    let allBatchesMode = !selectedBatchId || req.body.allBatches === 'true';
    if (selectedBatchId && !allBatchesMode) {
      batchList = batches.filter(b => b._id.toString() === selectedBatchId);
    }

    // Helper: build subject constraints map
    const subjectConstraints = {};
    subjects.forEach(sub => {
      subjectConstraints[sub._id.toString()] = {
        requiredPerWeek: Number(sub.requiredClassesPerWeek) || 0,
        maxPerDay: Number(sub.maxClassesPerDay) || 0
      };
    });

    // Helper: build subject slot constraints map (for subject slot constraints)
    const subjectSlotConstraints = {};
    const constrainedSubjects = new Set(); // Track subjects with constraints
    const singleClassConstraints = []; // Track individual class constraints
    
    constraints.filter(c => c.type === 'subject_slot_preference').forEach(c => {
      if (c.details && c.details.batch && c.details.subject && c.details.day && c.details.slot) {
        // Store as constraint (not necessarily single class)
        singleClassConstraints.push({
          batchId: c.details.batch,
          subjectId: c.details.subject,
          day: c.details.day,
          slot: c.details.slot,
          constraintId: c._id
        });
        
        // Also maintain the old structure for backward compatibility
        const key = `${c.details.batch}-${c.details.subject}`;
        if (!subjectSlotConstraints[key]) {
          subjectSlotConstraints[key] = [];
        }
        subjectSlotConstraints[key].push({
          day: c.details.day,
          slot: c.details.slot,
          preferred: true,
          isSingleClass: false // Changed: Don't treat as single class constraint by default
        });
        constrainedSubjects.add(key); // Mark this subject as constrained
      }
    });
    

    // Optimized Genetic algorithm parameters for faster execution
    const POP_SIZE = 100; // Reduced population size for faster execution
    const GENERATIONS = 200; // Reduced generations for faster convergence
    const BASE_MUTATION_RATE = 0.15; // Slightly higher mutation rate for faster exploration
    const CROSSOVER_RATE = 0.85; // Crossover probability
    const ELITE_SIZE = 15; // Elite individuals to preserve
    const DIVERSITY_THRESHOLD = 0.1; // Minimum diversity threshold
    const CONFLICT_RESOLUTION_ATTEMPTS = 5; // Reduced attempts for faster execution
    const CONSTRAINT_PENALTY_WEIGHT = 100; // Higher penalty for constraint violations

    // Function to validate and fix over-scheduling issues
    function validateAndFixOverScheduling(timetable) {
      let removedClasses = 0;
      
      // Group classes by batch and subject
      const classGroups = {};
      timetable.forEach((entry, index) => {
        const key = `${entry.batch}-${entry.subject}`;
        if (!classGroups[key]) {
          classGroups[key] = [];
        }
        classGroups[key].push({ ...entry, originalIndex: index });
      });
      
      // Check each group for over-scheduling
      Object.keys(classGroups).forEach(key => {
        const [batchName, subjectName] = key.split('-');
        const classes = classGroups[key];
        const subject = subjects.find(s => s.name === subjectName);
        
        if (subject) {
          const requiredPerWeek = subjectConstraints[subject._id.toString()]?.requiredPerWeek || 0;
          const maxPerDay = subjectConstraints[subject._id.toString()]?.maxPerDay || 0;
          
          // Check weekly limit
          if (classes.length > requiredPerWeek) {
            // Remove excess classes (keep the ones with preferred slots first)
            const excessCount = classes.length - requiredPerWeek;
            const sortedClasses = classes.sort((a, b) => {
              // Prioritize classes with preferred slots
              if (a.preferred && !b.preferred) return -1;
              if (!a.preferred && b.preferred) return 1;
              return 0;
            });
            
            // Remove the excess classes
            for (let i = 0; i < excessCount; i++) {
              const classToRemove = sortedClasses[sortedClasses.length - 1 - i];
              const indexToRemove = timetable.findIndex(entry => 
                entry.batch === classToRemove.batch &&
                entry.subject === classToRemove.subject &&
                entry.day === classToRemove.day &&
                entry.period === classToRemove.period
              );
              
              if (indexToRemove !== -1) {
                timetable.splice(indexToRemove, 1);
                removedClasses++;
              }
            }
          }
          
          // Check daily limits
          const dailyGroups = {};
          classes.forEach(cls => {
            if (!dailyGroups[cls.day]) {
              dailyGroups[cls.day] = [];
            }
            dailyGroups[cls.day].push(cls);
          });
          
          Object.keys(dailyGroups).forEach(day => {
            const dayClasses = dailyGroups[day];
            if (dayClasses.length > maxPerDay) {
              // Remove excess classes for this day
              const excessCount = dayClasses.length - maxPerDay;
              const sortedDayClasses = dayClasses.sort((a, b) => {
                if (a.preferred && !b.preferred) return -1;
                if (!a.preferred && b.preferred) return 1;
                return 0;
              });
              
              for (let i = 0; i < excessCount; i++) {
                const classToRemove = sortedDayClasses[sortedDayClasses.length - 1 - i];
                const indexToRemove = timetable.findIndex(entry => 
                  entry.batch === classToRemove.batch &&
                  entry.subject === classToRemove.subject &&
                  entry.day === classToRemove.day &&
                  entry.period === classToRemove.period
                );
                
                if (indexToRemove !== -1) {
                  timetable.splice(indexToRemove, 1);
                  removedClasses++;
                }
              }
            }
          });
        }
      });
      
      return timetable;
    }

    // Constraint satisfaction function - ensures subject slot constraints are satisfied
    function ensureConstraintSatisfaction(timetable) {
      let satisfiedConstraints = 0;
      let totalConstraints = singleClassConstraints.length;
      let addedClasses = 0;
      
      // Create a tracking system for each batch-subject combination
      const subjectCounts = {};
      
      // Initialize counts for all batch-subject combinations
      batchList.forEach(batch => {
        batch.subjects.forEach(subjectId => {
          const key = `${batch._id}-${subjectId}`;
          const requiredClasses = subjectConstraints[subjectId.toString()]?.requiredPerWeek || 0;
          subjectCounts[key] = {
            batch: batch.name,
            subjectId: subjectId.toString(),
            required: requiredClasses,
            scheduled: 0,
            maxPerDay: subjectConstraints[subjectId.toString()]?.maxPerDay || 0
          };
        });
      });
      
      // Count existing classes for each batch-subject combination
      timetable.forEach(entry => {
        const batch = batches.find(b => b.name === entry.batch);
        const subject = subjects.find(s => s.name === entry.subject);
        if (batch && subject) {
          const key = `${batch._id}-${subject._id}`;
          if (subjectCounts[key]) {
            subjectCounts[key].scheduled++;
          }
        }
      });
      
      // Process each subject slot constraint
      singleClassConstraints.forEach(constraint => {
        const batch = batches.find(b => b._id.toString() === constraint.batchId);
        const subject = subjects.find(s => s._id.toString() === constraint.subjectId);
        
        if (batch && subject) {
          const key = `${batch._id}-${subject._id}`;
          const countInfo = subjectCounts[key];
          
          if (!countInfo) {
            return;
          }
          
          // Check if this specific constraint is already satisfied
          const isConstraintSatisfied = timetable.some(entry => 
            entry.batch === batch.name && 
            entry.subject === subject.name && 
            entry.day === constraint.day && 
            entry.period === constraint.slot
          );
          
          if (isConstraintSatisfied) {
            satisfiedConstraints++;
          } else {
            // CRITICAL: Check if we can schedule more classes (respect weekly limit)
            if (countInfo.scheduled < countInfo.required) {
              // Check if we can schedule on this specific day (respect daily limit)
              const classesOnThisDay = timetable.filter(entry => 
                entry.batch === batch.name && 
                entry.subject === subject.name && 
                entry.day === constraint.day
              ).length;
              
              if (classesOnThisDay < countInfo.maxPerDay) {
                // Check if slot is available for this specific constraint
                const isSlotAvailable = !timetable.some(entry => 
                  entry.day === constraint.day && 
                  entry.period === constraint.slot &&
                  (entry.batch === batch.name || 
                   entry.classroom === batch.classrooms?.[0]?.name ||
                   entry.teacher === batch.subjectTeacherAssignments?.find(sta => 
                     sta.subject.toString() === constraint.subjectId
                   )?.teacher)
                );
                
                if (isSlotAvailable) {
                  // Schedule ONE class at the preferred slot
                  const teacherId = batch.subjectTeacherAssignments?.find(sta => 
                    sta.subject.toString() === constraint.subjectId
                  )?.teacher;
                  const teacher = faculties.find(f => f._id.equals(teacherId));
                  
                  let classroom = classrooms[0]; // Default classroom
                  if (batch.classrooms && batch.classrooms.length > 0) {
                    classroom = classrooms.find(c => 
                      batch.classrooms.some(bc => bc.toString() === c._id.toString())
                    ) || classrooms[0];
                  }
                  
                  timetable.push({
                    batch: batch.name,
                    subject: subject.name,
                    teacher: teacher?.name || 'TBA',
                    classroom: classroom.name,
                    day: constraint.day,
                    period: constraint.slot
                  });
                  
                  // CRITICAL: Decrease the count by 1 for this batch-subject combination
                  countInfo.scheduled++;
                  satisfiedConstraints++;
                  addedClasses++;
                }
              }
            }
          }
        }
      });
      
      return timetable;
    }

    // Advanced conflict resolution strategies
    function resolveConflicts(timetable) {
      let conflicts = detectConflicts(timetable);
      let attempts = 0;
      
      while (conflicts.length > 0 && attempts < CONFLICT_RESOLUTION_ATTEMPTS) {
        for (let conflict of conflicts) {
          if (conflict.type === 'teacher') {
            resolveTeacherConflict(timetable, conflict);
          } else if (conflict.type === 'classroom') {
            resolveClassroomConflict(timetable, conflict);
          } else if (conflict.type === 'batch') {
            resolveBatchConflict(timetable, conflict);
          }
        }
        conflicts = detectConflicts(timetable);
        attempts++;
      }
      
      // Ensure constraint satisfaction after conflict resolution
      timetable = ensureConstraintSatisfaction(timetable);
      
      return timetable;
    }

    // Detect all types of conflicts
    function detectConflicts(timetable) {
      let conflicts = [];
      let teacherSlots = {};
      let classroomSlots = {};
      let batchSlots = {};

      timetable.forEach((entry, index) => {
        // Teacher conflicts
        let teacherKey = `${entry.faculty}-${entry.day}-${entry.period}`;
        if (teacherSlots[teacherKey]) {
          conflicts.push({
            type: 'teacher',
            key: teacherKey,
            entries: [teacherSlots[teacherKey], index],
            priority: 10 // High priority
          });
        } else {
          teacherSlots[teacherKey] = index;
        }

        // Classroom conflicts
        let classroomKey = `${entry.classroom}-${entry.day}-${entry.period}`;
        if (classroomSlots[classroomKey]) {
          conflicts.push({
            type: 'classroom',
            key: classroomKey,
            entries: [classroomSlots[classroomKey], index],
            priority: 8
          });
        } else {
          classroomSlots[classroomKey] = index;
        }

        // Batch conflicts (same batch, same time)
        let batchKey = `${entry.batch}-${entry.day}-${entry.period}`;
        if (batchSlots[batchKey]) {
          conflicts.push({
            type: 'batch',
            key: batchKey,
            entries: [batchSlots[batchKey], index],
            priority: 15 // Highest priority
          });
        } else {
          batchSlots[batchKey] = index;
        }
      });

      return conflicts.sort((a, b) => b.priority - a.priority);
    }

    // Resolve teacher conflicts by finding alternative slots
    function resolveTeacherConflict(timetable, conflict) {
      const [entry1Idx, entry2Idx] = conflict.entries;
      const entry1 = timetable[entry1Idx];
      const entry2 = timetable[entry2Idx];
      
      // Try to move entry2 to a different slot
      let bestSlot = findBestAlternativeSlot(timetable, entry2, 'teacher');
      if (bestSlot) {
        timetable[entry2Idx].day = bestSlot.day;
        timetable[entry2Idx].period = bestSlot.period;
        timetable[entry2Idx].classroom = bestSlot.classroom;
      }
    }

    // Resolve classroom conflicts
    function resolveClassroomConflict(timetable, conflict) {
      const [entry1Idx, entry2Idx] = conflict.entries;
      const entry2 = timetable[entry2Idx];
      
      let bestSlot = findBestAlternativeSlot(timetable, entry2, 'classroom');
      if (bestSlot) {
        timetable[entry2Idx].day = bestSlot.day;
        timetable[entry2Idx].period = bestSlot.period;
        timetable[entry2Idx].classroom = bestSlot.classroom;
      }
    }

    // Resolve batch conflicts
    function resolveBatchConflict(timetable, conflict) {
      const [entry1Idx, entry2Idx] = conflict.entries;
      const entry2 = timetable[entry2Idx];
      
      let bestSlot = findBestAlternativeSlot(timetable, entry2, 'batch');
      if (bestSlot) {
        timetable[entry2Idx].day = bestSlot.day;
        timetable[entry2Idx].period = bestSlot.period;
        timetable[entry2Idx].classroom = bestSlot.classroom;
      }
    }

    // Find best alternative slot for an entry
    function findBestAlternativeSlot(timetable, entry, conflictType) {
      let bestSlot = null;
      let bestScore = -Infinity;
      
      for (let day of days) {
        for (let period of periods) {
          let score = evaluateSlot(timetable, entry, day, period, conflictType);
          if (score > bestScore) {
            bestScore = score;
            bestSlot = {
              day: day,
              period: period,
              classroom: findAvailableClassroom(timetable, day, period, entry.batch)
            };
          }
        }
      }
      
      return bestSlot;
    }

    // Evaluate how good a slot is for an entry
    function evaluateSlot(timetable, entry, day, period, conflictType) {
      let score = 0;
      
      // Check for conflicts
      let hasConflict = false;
      timetable.forEach(otherEntry => {
        if (otherEntry === entry) return;
        
        if (conflictType === 'teacher' && otherEntry.faculty === entry.faculty && 
            otherEntry.day === day && otherEntry.period === period) {
          hasConflict = true;
        }
        if (conflictType === 'classroom' && otherEntry.classroom === entry.classroom && 
            otherEntry.day === day && otherEntry.period === period) {
          hasConflict = true;
        }
        if (conflictType === 'batch' && otherEntry.batch === entry.batch && 
            otherEntry.day === day && otherEntry.period === period) {
          hasConflict = true;
        }
      });
      
      if (hasConflict) return -1000;
      
      // Check batch classroom constraints
      let batch = batches.find(b => b.name === entry.batch);
      if (batch && batch.classrooms && batch.classrooms.length > 0) {
        // Get the classroom that would be assigned for this slot
        let assignedClassroom = findAvailableClassroom(timetable, day, period, entry.batch);
        let classroom = classrooms.find(c => c.name === assignedClassroom);
        
        // Check if the assigned classroom is in the batch's allowed classrooms
        let isAllowedClassroom = batch.classrooms.some(bc => {
          let batchClassroom = classrooms.find(c => c._id.equals(bc));
          return batchClassroom && batchClassroom.name === assignedClassroom;
        });
        
        if (!isAllowedClassroom) {
          return -2000; // Very heavy penalty for using unassigned classroom
        }
      }
      
      // Prefer slots that don't violate constraints
      let subject = subjects.find(s => s.name === entry.subject);
      
      if (batch && subject) {
        // Check subject constraints
        let dayCount = timetable.filter(e => e.batch === entry.batch && e.subject === entry.subject && e.day === day).length;
        let maxPerDay = subjectConstraints[subject._id.toString()].maxPerDay;
        if (dayCount < maxPerDay) score += 10;
        
        // Check if this slot is preferred
        const constraintKey = `${batch._id}-${subject._id}`;
        const subjectSlotConstraintsForThis = subjectSlotConstraints[constraintKey] || [];
        if (subjectSlotConstraintsForThis.some(c => c.day === day && c.slot === period)) {
          score += 50; // High bonus for preferred slots
        }
      }
      
      return score;
    }

    // Find available classroom for a slot with strict batch constraints
    function findAvailableClassroom(timetable, day, period, batchName) {
      let usedClassrooms = new Set();
      timetable.forEach(entry => {
        if (entry.day === day && entry.period === period) {
          usedClassrooms.add(entry.classroom);
        }
      });
      
      let batch = batches.find(b => b.name === batchName);
      
      // STRICT: If batch has classroom assignments, only consider those classrooms
      if (batch && batch.classrooms && batch.classrooms.length > 0) {
        let batchClassrooms = classrooms.filter(c => 
          batch.classrooms.some(bc => bc.toString() === c._id.toString())
        );
        
        let availableBatchClassrooms = batchClassrooms.filter(c => !usedClassrooms.has(c.name));
        
        if (availableBatchClassrooms.length > 0) {
          // Prefer less used classrooms within batch constraints
          let classroomUsage = {};
          timetable.forEach(entry => {
            classroomUsage[entry.classroom] = (classroomUsage[entry.classroom] || 0) + 1;
          });
          
          availableBatchClassrooms.sort((a, b) => {
            let usageA = classroomUsage[a.name] || 0;
            let usageB = classroomUsage[b.name] || 0;
            return usageA - usageB;
          });
          
          return availableBatchClassrooms[0].name;
        } else {
          // If no batch classrooms are available, return the first batch classroom
          // (conflict will be handled by fitness function)
          return batchClassrooms[0].name;
        }
      }
      
      // Only if batch has NO classroom assignments, use any available classroom
      let availableClassrooms = classrooms.filter(c => !usedClassrooms.has(c.name));
      
      if (availableClassrooms.length === 0) {
        // If all classrooms are occupied, return the first one (conflict will be handled by fitness function)
        return classrooms[0].name;
      }
      
      // Use any available classroom, preferring less used ones
      let classroomUsage = {};
      timetable.forEach(entry => {
        classroomUsage[entry.classroom] = (classroomUsage[entry.classroom] || 0) + 1;
      });
      
      availableClassrooms.sort((a, b) => {
        let usageA = classroomUsage[a.name] || 0;
        let usageB = classroomUsage[b.name] || 0;
        return usageA - usageB;
      });
      
      return availableClassrooms[0].name;
    }

    // Function to detect and report all types of constraints and limitations
    function detectAllConstraintsAndLimitations(timetable) {
      let limitations = {
        constrainedBatches: [],
        unavailableSlots: [],
        conflicts: [],
        constraintViolations: {
          subjectSlot: [],
          classroomSlot: [],
          teacherSlot: []
        },
        recommendations: []
      };
      
      // Group entries by batch
      let batchGroups = {};
      timetable.forEach(entry => {
        if (!batchGroups[entry.batch]) {
          batchGroups[entry.batch] = [];
        }
        batchGroups[entry.batch].push(entry);
      });
      
      // Check each batch for classroom constraints
      Object.keys(batchGroups).forEach(batchName => {
        let batch = batches.find(b => b.name === batchName);
        if (batch && batch.classrooms && batch.classrooms.length > 0) {
          let batchClassrooms = classrooms.filter(c => 
            batch.classrooms.some(bc => bc.toString() === c._id.toString())
          );
          
          limitations.constrainedBatches.push({
            batchName: batchName,
            assignedClassrooms: batchClassrooms.map(c => c.name),
            totalSlots: batchGroups[batchName].length
          });
          
          // Check for classroom availability issues only for time slots where this batch has classes
          batchGroups[batchName].forEach(entry => {
            let occupiedClassrooms = new Set();
            timetable.forEach(timetableEntry => {
              if (timetableEntry.day === entry.day && timetableEntry.period === entry.period) {
                occupiedClassrooms.add(timetableEntry.classroom);
              }
            });
            
            let availableBatchClassrooms = batchClassrooms.filter(c => 
              !occupiedClassrooms.has(c.name)
            );
            
            // Check if the batch is using a classroom that's not in its assigned classrooms
            let isUsingUnassignedClassroom = !batchClassrooms.some(c => c.name === entry.classroom);
            
            if (isUsingUnassignedClassroom) {
              limitations.unavailableSlots.push({
                batch: batchName,
                day: entry.day,
                period: entry.period,
                assignedClassrooms: batchClassrooms.map(c => c.name),
                occupiedBy: Array.from(occupiedClassrooms),
                issue: `Using unassigned classroom: ${entry.classroom}`
              });
            }
          });
          
          // Check for conflicts within batch classrooms
          let batchConflicts = [];
          batchGroups[batchName].forEach(entry => {
            let conflictingEntries = batchGroups[batchName].filter(e => 
              e !== entry && 
              e.day === entry.day && 
              e.period === entry.period && 
              e.classroom === entry.classroom
            );
            
            if (conflictingEntries.length > 0) {
              batchConflicts.push({
                batch: batchName,
                day: entry.day,
                period: entry.period,
                classroom: entry.classroom,
                conflictingSubjects: conflictingEntries.map(e => e.subject)
              });
            }
          });
          
          limitations.conflicts = limitations.conflicts.concat(batchConflicts);
        }
      });
      
      // Check Subject Slot constraints
      singleClassConstraints.forEach(constraint => {
        const batch = batches.find(b => b._id.toString() === constraint.batchId);
        const subject = subjects.find(s => s._id.toString() === constraint.subjectId);
        
        if (batch && subject) {
          let hasSubjectAtPreferredSlot = timetable.some(entry => 
            entry.batch === batch.name && 
            entry.subject === subject.name && 
            entry.day === constraint.day && 
            entry.period === constraint.slot
          );
          
          if (!hasSubjectAtPreferredSlot) {
            // Check if subject is scheduled at all
            const isSubjectScheduled = timetable.some(entry => 
              entry.batch === batch.name && entry.subject === subject.name
            );
            
            limitations.constraintViolations.subjectSlot.push({
              batch: batch.name,
              subject: subject.name,
              preferredDay: constraint.day,
              preferredPeriod: constraint.slot,
              violation: isSubjectScheduled 
                ? `Subject slot constraint: ${subject.name} for ${batch.name} scheduled but not at preferred time ${constraint.day} ${constraint.slot}`
                : `Subject slot constraint: ${subject.name} for ${batch.name} not scheduled at all (preferred time: ${constraint.day} ${constraint.slot})`,
              severity: isSubjectScheduled ? 'medium' : 'high'
            });
          }
        }
      });
      
      // Check Classroom Slot constraints
      constraints.filter(c => c.type === 'classroom_preference').forEach(constraint => {
        if (constraint.details && constraint.details.batch && constraint.details.classroom && 
            constraint.details.day && constraint.details.slot) {
          let batch = batches.find(b => b._id.toString() === constraint.details.batch);
          let classroom = classrooms.find(c => c._id.toString() === constraint.details.classroom);
          
          if (batch && classroom) {
            let hasClassroomAtPreferredSlot = timetable.some(entry => 
              entry.batch === batch.name && 
              entry.classroom === classroom.name && 
              entry.day === constraint.details.day && 
              entry.period === constraint.details.slot
            );
            
            if (!hasClassroomAtPreferredSlot) {
              limitations.constraintViolations.classroomSlot.push({
                batch: batch.name,
                classroom: classroom.name,
                preferredDay: constraint.details.day,
                preferredPeriod: constraint.details.slot,
                violation: `Classroom ${classroom.name} for batch ${batch.name} not reserved at preferred time ${constraint.details.day} ${constraint.details.slot}`,
                severity: 'medium'
              });
            }
          }
        }
      });
      
      // Check Teacher Slot constraints
      constraints.filter(c => c.type === 'teacher_slot_preference').forEach(constraint => {
        if (constraint.details && constraint.details.batch && constraint.details.faculty && 
            constraint.details.day && constraint.details.slot) {
          let batch = batches.find(b => b._id.toString() === constraint.details.batch);
          let faculty = faculties.find(f => f._id.toString() === constraint.details.faculty);
          
          if (batch && faculty) {
            let hasTeacherAtPreferredSlot = timetable.some(entry => 
              entry.batch === batch.name && 
              entry.faculty === faculty.name && 
              entry.day === constraint.details.day && 
              entry.period === constraint.details.slot
            );
            
            if (!hasTeacherAtPreferredSlot) {
              limitations.constraintViolations.teacherSlot.push({
                batch: batch.name,
                teacher: faculty.name,
                preferredDay: constraint.details.day,
                preferredPeriod: constraint.details.slot,
                violation: `Teacher ${faculty.name} for batch ${batch.name} not available at preferred time ${constraint.details.day} ${constraint.details.slot}`,
                severity: 'medium'
              });
            }
          }
        }
      });
      
      // Generate recommendations
      if (limitations.unavailableSlots.length > 0) {
        limitations.recommendations.push({
          type: "classroom_shortage",
          message: "Some batches cannot be scheduled at certain times due to classroom limitations",
          details: limitations.unavailableSlots,
          severity: 'high'
        });
      }
      
      if (limitations.conflicts.length > 0) {
        limitations.recommendations.push({
          type: "scheduling_conflicts",
          message: "Some classes have scheduling conflicts within their assigned classrooms",
          details: limitations.conflicts,
          severity: 'high'
        });
      }
      
      if (limitations.constraintViolations.subjectSlot.length > 0) {
        limitations.recommendations.push({
          type: "subject_slot_violations",
          message: "Some subjects are not scheduled at their preferred time slots",
          details: limitations.constraintViolations.subjectSlot,
          severity: 'high'
        });
      }
      
      if (limitations.constraintViolations.classroomSlot.length > 0) {
        limitations.recommendations.push({
          type: "classroom_slot_violations",
          message: "Some classrooms are not reserved at their preferred time slots",
          details: limitations.constraintViolations.classroomSlot,
          severity: 'medium'
        });
      }
      
      if (limitations.constraintViolations.teacherSlot.length > 0) {
        limitations.recommendations.push({
          type: "teacher_slot_violations",
          message: "Some teachers are not available at their preferred time slots",
          details: limitations.constraintViolations.teacherSlot,
          severity: 'medium'
        });
      }
      
      return limitations;
    }

    // Function to validate constraint limits are respected
    function validateConstraintLimits(timetable) {
      let violations = [];
      
      // Group entries by batch and subject
      let batchSubjectGroups = {};
      timetable.forEach(entry => {
        const key = `${entry.batch}-${entry.subject}`;
        if (!batchSubjectGroups[key]) {
          batchSubjectGroups[key] = [];
        }
        batchSubjectGroups[key].push(entry);
      });
      
      // Check each batch-subject combination
      Object.keys(batchSubjectGroups).forEach(key => {
        const [batchName, subjectName] = key.split('-');
        const entries = batchSubjectGroups[key];
        const batch = batches.find(b => b.name === batchName);
        const subject = subjects.find(s => s.name === subjectName);
        
        if (batch && subject) {
          const requiredPerWeek = subjectConstraints[subject._id.toString()]?.requiredPerWeek || 0;
          const maxPerDay = subjectConstraints[subject._id.toString()]?.maxPerDay || 0;
          
          // Check weekly limit
          if (entries.length > requiredPerWeek) {
            violations.push({
              type: 'weekly_limit_exceeded',
              batch: batchName,
              subject: subjectName,
              scheduled: entries.length,
              limit: requiredPerWeek,
              message: `${subjectName} for ${batchName} scheduled ${entries.length} times but limit is ${requiredPerWeek} per week`
            });
          }
          
          // Check daily limits
          let dayCounts = {};
          entries.forEach(entry => {
            dayCounts[entry.day] = (dayCounts[entry.day] || 0) + 1;
          });
          
          Object.keys(dayCounts).forEach(day => {
            if (dayCounts[day] > maxPerDay) {
              violations.push({
                type: 'daily_limit_exceeded',
                batch: batchName,
                subject: subjectName,
                day: day,
                scheduled: dayCounts[day],
                limit: maxPerDay,
                message: `${subjectName} for ${batchName} scheduled ${dayCounts[day]} times on ${day} but limit is ${maxPerDay} per day`
              });
            }
          });
        }
      });
      
      return violations;
    }

    // Function to create a detailed limitations report
    function createLimitationsReport(limitations) {
      let report = {
        summary: {
          totalConstrainedBatches: limitations.constrainedBatches.length,
          totalUnavailableSlots: limitations.unavailableSlots.length,
          totalConflicts: limitations.conflicts.length,
          totalConstraintViolations: {
            subjectSlot: limitations.constraintViolations.subjectSlot.length,
            classroomSlot: limitations.constraintViolations.classroomSlot.length,
            teacherSlot: limitations.constraintViolations.teacherSlot.length
          },
          hasLimitations: limitations.unavailableSlots.length > 0 || 
                          limitations.conflicts.length > 0 || 
                          limitations.constraintViolations.subjectSlot.length > 0 ||
                          limitations.constraintViolations.classroomSlot.length > 0 ||
                          limitations.constraintViolations.teacherSlot.length > 0
        },
        constrainedBatches: limitations.constrainedBatches.map(batch => ({
          batchName: batch.batchName,
          assignedClassrooms: batch.assignedClassrooms,
          totalSlots: batch.totalSlots,
          classroomCount: batch.assignedClassrooms.length
        })),
        unavailableSlots: limitations.unavailableSlots.map(slot => ({
          batch: slot.batch,
          timeSlot: `${slot.day} ${slot.period}`,
          assignedClassrooms: slot.assignedClassrooms,
          occupiedBy: slot.occupiedBy,
          limitation: `Cannot schedule ${slot.batch} on ${slot.day} ${slot.period} - all assigned classrooms are occupied`
        })),
        conflicts: limitations.conflicts.map(conflict => ({
          batch: conflict.batch,
          timeSlot: `${conflict.day} ${conflict.period}`,
          classroom: conflict.classroom,
          conflictingSubjects: conflict.conflictingSubjects,
          limitation: `Multiple subjects scheduled in same classroom at same time`
        })),
        constraintViolations: {
          subjectSlot: limitations.constraintViolations.subjectSlot.map(violation => ({
            batch: violation.batch,
            subject: violation.subject,
            preferredTime: `${violation.preferredDay} ${violation.preferredPeriod}`,
            violation: violation.violation,
            severity: violation.severity
          })),
          classroomSlot: limitations.constraintViolations.classroomSlot.map(violation => ({
            batch: violation.batch,
            classroom: violation.classroom,
            preferredTime: `${violation.preferredDay} ${violation.preferredPeriod}`,
            violation: violation.violation,
            severity: violation.severity
          })),
          teacherSlot: limitations.constraintViolations.teacherSlot.map(violation => ({
            batch: violation.batch,
            teacher: violation.teacher,
            preferredTime: `${violation.preferredDay} ${violation.preferredPeriod}`,
            violation: violation.violation,
            severity: violation.severity
          }))
        },
        recommendations: limitations.recommendations.map(rec => ({
          type: rec.type,
          message: rec.message,
          severity: rec.severity,
          count: rec.details ? rec.details.length : 0
        }))
      };
      
      return report;
    }

    // Function to validate and fix batch classroom constraints
    function validateAndFixBatchClassrooms(timetable) {
      let violations = [];
      
      timetable.forEach((entry, index) => {
        let batch = batches.find(b => b.name === entry.batch);
        if (batch && batch.classrooms && batch.classrooms.length > 0) {
          let isAssignedClassroom = batch.classrooms.some(bc => {
            let classroom = classrooms.find(c => c._id.equals(bc));
            return classroom && classroom.name === entry.classroom;
          });
          
          if (!isAssignedClassroom) {
            violations.push({ index, entry, batch });
          }
        }
      });
      
      
      // Fix violations by reassigning to valid classrooms
      violations.forEach(violation => {
        let batch = violation.batch;
        let batchClassrooms = classrooms.filter(c => 
          batch.classrooms.some(bc => bc.toString() === c._id.toString())
        );
        
        if (batchClassrooms.length > 0) {
          // Find a classroom that's not occupied at this time slot
          let occupiedClassrooms = new Set();
          timetable.forEach(e => {
            if (e.day === violation.entry.day && e.period === violation.entry.period) {
              occupiedClassrooms.add(e.classroom);
            }
          });
          
          let availableBatchClassrooms = batchClassrooms.filter(c => 
            !occupiedClassrooms.has(c.name)
          );
          
          if (availableBatchClassrooms.length > 0) {
            timetable[violation.index].classroom = availableBatchClassrooms[0].name;
          } else {
            // If no available batch classroom, use the first batch classroom
            timetable[violation.index].classroom = batchClassrooms[0].name;
          }
        }
      });
      
      return timetable;
    }

    // Function to optimize classroom distribution while respecting batch constraints
    function optimizeClassroomDistribution(timetable) {
      let classroomUsage = {};
      let classroomSlots = {};
      
      // Count usage per classroom
      timetable.forEach(entry => {
        classroomUsage[entry.classroom] = (classroomUsage[entry.classroom] || 0) + 1;
        let key = `${entry.classroom}-${entry.day}-${entry.period}`;
        classroomSlots[key] = entry;
      });
      
      // Group entries by batch for constraint-aware optimization
      let batchGroups = {};
      timetable.forEach(entry => {
        if (!batchGroups[entry.batch]) {
          batchGroups[entry.batch] = [];
        }
        batchGroups[entry.batch].push(entry);
      });
      
      // Optimize within each batch's assigned classrooms
      Object.keys(batchGroups).forEach(batchName => {
        let batch = batches.find(b => b.name === batchName);
        let batchEntries = batchGroups[batchName];
        
        if (batch && batch.classrooms && batch.classrooms.length > 0) {
          // Only consider classrooms assigned to this batch
          let batchClassrooms = classrooms.filter(c => 
            batch.classrooms.some(bc => bc.toString() === c._id.toString())
          );
          
          if (batchClassrooms.length > 1) {
            // Find overused and underused classrooms within this batch's assignments
            let batchClassroomUsage = {};
            batchEntries.forEach(entry => {
              batchClassroomUsage[entry.classroom] = (batchClassroomUsage[entry.classroom] || 0) + 1;
            });
            
            let totalBatchEntries = batchEntries.length;
            let avgBatchUsage = totalBatchEntries / batchClassrooms.length;
            let overusedClassrooms = [];
            let underusedClassrooms = [];
            
            batchClassrooms.forEach(classroom => {
              let usage = batchClassroomUsage[classroom.name] || 0;
              if (usage > avgBatchUsage * 1.5) {
                overusedClassrooms.push({ name: classroom.name, usage });
              } else if (usage < avgBatchUsage * 0.5) {
                underusedClassrooms.push({ name: classroom.name, usage });
              }
            });
            
            // Try to redistribute within batch-assigned classrooms
            overusedClassrooms.forEach(overused => {
              underusedClassrooms.forEach(underused => {
                // Find entries using overused classroom that could be moved
                let candidates = batchEntries.filter(entry => 
                  entry.classroom === overused.name && 
                  !classroomSlots[`${underused.name}-${entry.day}-${entry.period}`]
                );
                
                if (candidates.length > 0) {
                  // Move a random candidate to the underused classroom
                  let candidate = candidates[Math.floor(Math.random() * candidates.length)];
                  candidate.classroom = underused.name;
                }
              });
            });
          }
        } else {
          // If batch has no classroom assignments, optimize across all classrooms
          let totalEntries = batchEntries.length;
          let avgUsage = totalEntries / classrooms.length;
          let overusedClassrooms = [];
          let underusedClassrooms = [];
          
          classrooms.forEach(classroom => {
            let usage = classroomUsage[classroom.name] || 0;
            if (usage > avgUsage * 1.5) {
              overusedClassrooms.push({ name: classroom.name, usage });
            } else if (usage < avgUsage * 0.5) {
              underusedClassrooms.push({ name: classroom.name, usage });
            }
          });
          
          // Try to redistribute some classes from overused to underused classrooms
          overusedClassrooms.forEach(overused => {
            underusedClassrooms.forEach(underused => {
              // Find entries using overused classroom that could be moved
              let candidates = batchEntries.filter(entry => 
                entry.classroom === overused.name && 
                !classroomSlots[`${underused.name}-${entry.day}-${entry.period}`]
              );
              
              if (candidates.length > 0) {
                // Move a random candidate to the underused classroom
                let candidate = candidates[Math.floor(Math.random() * candidates.length)];
                candidate.classroom = underused.name;
              }
            });
          });
        }
      });
      
      return timetable;
    }

    // Constraint-aware individual generation
    function randomIndividual() {
      let timetable = [];
      let usedClassrooms = {};
      for (const batch of batchList) {
        let subjectTeacherMap = {};
        if (batch.subjectTeacherAssignments && batch.subjectTeacherAssignments.length) {
          batch.subjectTeacherAssignments.forEach(sta => {
            subjectTeacherMap[sta.subject.toString()] = sta.teacher;
          });
        }
        // Create a tracking system for this batch
        const batchSubjectCounts = {};
        batch.subjects.forEach(subjectId => {
          const requiredPerWeek = subjectConstraints[subjectId.toString()]?.requiredPerWeek || 0;
          const maxPerDay = subjectConstraints[subjectId.toString()]?.maxPerDay || 0;
          batchSubjectCounts[subjectId.toString()] = {
            required: requiredPerWeek,
            scheduled: 0,
            maxPerDay: maxPerDay
          };
        });
        
        // PRIORITY 1: Handle ALL constraints for this batch first
        // Process all subject slot constraints for this batch first
        const batchConstraints = singleClassConstraints.filter(constraint => 
          constraint.batchId === batch._id.toString()
        );
        
        batchConstraints.forEach(constraint => {
          const subject = subjects.find(s => s._id.toString() === constraint.subjectId);
          if (!subject) return;
          
          const countInfo = batchSubjectCounts[constraint.subjectId.toString()];
          if (!countInfo) return;
          
          // Check if we can still schedule more classes for this subject
          if (countInfo.scheduled < countInfo.required) {
            // Check if this specific constraint is already satisfied
            const isConstraintSatisfied = timetable.some(entry => 
              entry.batch === batch.name && 
              entry.subject === subject.name && 
              entry.day === constraint.day && 
              entry.period === constraint.slot
            );
            
            if (!isConstraintSatisfied) {
              // Check if slot is available
              const isSlotAvailable = !timetable.some(entry => 
                entry.day === constraint.day && 
                entry.period === constraint.slot &&
                (entry.batch === batch.name || 
                 entry.classroom === batch.classrooms?.[0]?.name ||
                 entry.teacher === batch.subjectTeacherAssignments?.find(sta => 
                   sta.subject.toString() === constraint.subjectId
                 )?.teacher)
              );
              
              if (isSlotAvailable) {
                // Check daily limit
                const classesOnThisDay = timetable.filter(entry => 
                  entry.batch === batch.name && 
                  entry.subject === subject.name && 
                  entry.day === constraint.day
                ).length;
                
                if (classesOnThisDay < countInfo.maxPerDay) {
                  // Schedule the constraint
                  const teacherId = batch.subjectTeacherAssignments?.find(sta => 
                    sta.subject.toString() === constraint.subjectId
                  )?.teacher;
                  const teacher = faculties.find(f => f._id.equals(teacherId));
                  
                  let classroom = classrooms[0];
                  if (batch.classrooms && batch.classrooms.length > 0) {
                    classroom = classrooms.find(c => 
                      batch.classrooms.some(bc => bc.toString() === c._id.toString())
                    ) || classrooms[0];
                  }
                  
                  timetable.push({
                    batch: batch.name,
                    subject: subject.name,
                    teacher: teacher?.name || 'TBA',
                    classroom: classroom.name,
                    day: constraint.day,
                    period: constraint.slot,
                    preferred: true
                  });
                  
                  countInfo.scheduled++;
                }
              }
            }
          }
        });
        
        // PRIORITY 2: Now schedule remaining classes for subjects that still need them
        for (const subjectId of batch.subjects) {
          const subject = subjects.find(s => s._id.equals(subjectId));
          if (!subject) continue;
          const teacherId = subjectTeacherMap[subjectId.toString()];
          const teacher = faculties.find(f => f._id.equals(teacherId));
          const countInfo = batchSubjectCounts[subjectId.toString()];
          const requiredPerWeek = countInfo.required;
          const maxPerDay = countInfo.maxPerDay;
          
          // Skip if this subject already has enough classes
          if (countInfo.scheduled >= countInfo.required) {
            continue;
          }
          
          let slots = [];
          let remaining = countInfo.required - countInfo.scheduled; // Only schedule remaining classes needed
          let daySlots = Array(days.length).fill(0);
          let dayOrder = Array.from(Array(days.length).keys());
          
          
          // Count existing classes for this subject to calculate day slots
          timetable.forEach(entry => {
            if (entry.batch === batch.name && entry.subject === subject.name) {
              const dayIdx = days.indexOf(entry.day);
              if (dayIdx !== -1) {
                daySlots[dayIdx]++;
              }
            }
          });
          
          // Check for teacher slot constraints for this batch/teacher
          let teacherSlotConstraints = constraints.filter(c => c.type === 'teacher_slot_preference' && c.details && c.details.batch == batch._id.toString() && c.details.faculty == teacherId?.toString());
          teacherSlotConstraints.forEach(tsc => {
            let dayIdx = days.indexOf(tsc.details.day);
            let periodIdx = periods.indexOf(tsc.details.slot);
            if (dayIdx !== -1 && periodIdx !== -1 && remaining > 0 && daySlots[dayIdx] < maxPerDay) {
              slots.push({ day: days[dayIdx], period: periods[periodIdx], preferred: true });
              daySlots[dayIdx]++;
              remaining--;
            }
          });
          
          // Assign remaining slots evenly
          while (remaining > 0 && countInfo.scheduled < countInfo.required) {
            for (let i = dayOrder.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [dayOrder[i], dayOrder[j]] = [dayOrder[j], dayOrder[i]];
            }
            for (let d of dayOrder) {
              if (remaining > 0 && daySlots[d] < maxPerDay && countInfo.scheduled < countInfo.required) {
                slots.push({ day: days[d] });
                daySlots[d]++;
                remaining--;
                countInfo.scheduled++; // CRITICAL: Decrease count by 1
              }
            }
          }
          // Assign periods for each slot
          slots.forEach(slot => {
            let p = slot.period ? periods.indexOf(slot.period) : Math.floor(Math.random() * periods.length);
            if (p === -1) p = Math.floor(Math.random() * periods.length);
            
            // Check for classroom constraints for this batch/slot
            let classroomConstraints = constraints.filter(c => 
              c.type === 'classroom_preference' && 
              c.details && 
              c.details.batch == batch._id.toString() && 
              c.details.day === slot.day && 
              c.details.slot === periods[p]
            );
            
            // Get all classrooms that are not occupied at this specific time slot
            let occupiedClassrooms = new Set();
            timetable.forEach(existingEntry => {
              if (existingEntry.day === slot.day && existingEntry.period === periods[p]) {
                occupiedClassrooms.add(existingEntry.classroom);
              }
            });
            
            let availableClassrooms = classrooms.filter(c => !occupiedClassrooms.has(c.name));
            
            // Smart classroom assignment with better utilization
            let classroom;
            
            // If there's a classroom constraint for this slot, prioritize that classroom
            if (classroomConstraints.length > 0) {
              let preferredClassroomId = classroomConstraints[0].details.classroom;
              let preferredClassroom = classrooms.find(c => c._id.toString() === preferredClassroomId);
              if (preferredClassroom && availableClassrooms.some(c => c._id.equals(preferredClassroom._id))) {
                classroom = preferredClassroom;
              } else {
                // If preferred classroom is not available, use any available classroom
                classroom = availableClassrooms.length > 0 ? availableClassrooms[Math.floor(Math.random() * availableClassrooms.length)] : classrooms[0];
              }
            } else {
              // Check if batch has specific classroom assignments
              if (batch.classrooms && batch.classrooms.length > 0) {
                // STRICT: Only use classrooms assigned to this batch
                let batchClassrooms = availableClassrooms.filter(c => 
                  batch.classrooms.some(bc => bc.toString() === c._id.toString())
                );
                if (batchClassrooms.length > 0) {
                  // Sort by usage frequency within batch-assigned classrooms
                  let classroomUsage = {};
                  timetable.forEach(entry => {
                    classroomUsage[entry.classroom] = (classroomUsage[entry.classroom] || 0) + 1;
                  });
                  
                  batchClassrooms.sort((a, b) => {
                    let usageA = classroomUsage[a.name] || 0;
                    let usageB = classroomUsage[b.name] || 0;
                    return usageA - usageB; // Prefer less used classrooms within batch assignments
                  });
                  
                  classroom = batchClassrooms[0];
                } else {
                  // If no batch-specific classrooms are available, this is a constraint violation
                  // We'll use the first batch classroom anyway and let the fitness function penalize it
                  let firstBatchClassroom = classrooms.find(c => 
                    batch.classrooms.some(bc => bc.toString() === c._id.toString())
                  );
                  classroom = firstBatchClassroom || classrooms[0];
                }
              } else {
                // Only if batch has NO classroom assignments, use any available classroom
                if (availableClassrooms.length > 0) {
                  // Sort by usage frequency to better distribute load
                  let classroomUsage = {};
                  timetable.forEach(entry => {
                    classroomUsage[entry.classroom] = (classroomUsage[entry.classroom] || 0) + 1;
                  });
                  
                  availableClassrooms.sort((a, b) => {
                    let usageA = classroomUsage[a.name] || 0;
                    let usageB = classroomUsage[b.name] || 0;
                    return usageA - usageB; // Prefer less used classrooms
                  });
                  
                  classroom = availableClassrooms[0];
                } else {
                  // Fallback to any classroom if all are occupied
                  classroom = classrooms[0];
                }
              }
            }
            
            let key = `${slot.day}-${p}-${classroom._id}`;
            usedClassrooms[key] = true;
            timetable.push({
              batch: batch.name,
              subject: subject.name,
              faculty: teacher ? teacher.name : 'TBD',
              classroom: classroom ? classroom.name : 'TBD',
              department: batch.department,
              shift: batch.shift,
              day: slot.day,
              period: periods[p],
              startTime: '',
              endTime: '',
              preferred: slot.preferred || false
            });
          });
        }
      }
      
      // Apply conflict resolution to the generated timetable
      timetable = resolveConflicts(timetable);
      
      // Validate and fix batch classroom constraints
      timetable = validateAndFixBatchClassrooms(timetable);
      
      // Optimize classroom distribution
      timetable = optimizeClassroomDistribution(timetable);
      
      // Note: Removed ensureConstraintSatisfaction call here to prevent over-scheduling
      // Constraints should be handled during the main generation process
      
      return timetable;
    }

    // Multi-objective fitness function with weighted objectives
    function fitness(timetable) {
      let objectives = {
        conflicts: 0,
        constraintViolations: 0,
        preferenceSatisfaction: 0,
        loadBalance: 0,
        resourceUtilization: 0
      };
      
      let batchDaySubjectCount = {};
      let batchSubjectWeekCount = {};
      let slotMap = {};
      let classroomSlotMap = {};
      let teacherSlotMap = {};
      let classroomConstraintViolations = 0;
      let subjectConstraintViolations = 0;
      let teacherCollisionViolations = 0;
      let preferenceViolations = 0;
      let loadBalanceScore = 0;
      let resourceUtilizationScore = 0;
      
      timetable.forEach(entry => {
        let key = `${entry.batch}-${entry.day}-${entry.period}`;
        
        // Objective 1: Conflict Detection
        if (slotMap[key]) objectives.conflicts -= 5; // Batch conflict
        slotMap[key] = true;
        
        // Classroom clash check
        let classKey = `${entry.day}-${entry.period}-${entry.classroom}`;
        if (classroomSlotMap[classKey]) objectives.conflicts -= 10; // Classroom conflict
        classroomSlotMap[classKey] = true;
        
        // Teacher collision check
        let teacherKey = `${entry.faculty}-${entry.day}-${entry.period}`;
        if (teacherSlotMap[teacherKey]) {
          teacherCollisionViolations++;
          objectives.conflicts -= 20; // Heavy penalty for teacher conflict
        }
        teacherSlotMap[teacherKey] = true;
        
        // Objective 2: Subject Slot Constraint Violations
        let batchId = batches.find(b => b.name === entry.batch)?._id;
        let subjectId = subjects.find(s => s.name === entry.subject)?._id;
        if (batchId && subjectId) {
          // Check if this specific slot matches any subject slot constraint
          const matchingConstraint = singleClassConstraints.find(sc => 
            sc.batchId === batchId.toString() && 
            sc.subjectId === subjectId.toString() &&
            sc.day === entry.day && 
            sc.slot === entry.period
          );
          
          if (matchingConstraint) {
            // This is a constrained slot - give bonus points
            objectives.constraintViolations += CONSTRAINT_PENALTY_WEIGHT;
          }
        }
        
        // Check classroom constraint violations
        if (batchId) {
          let batch = batches.find(b => b._id.equals(batchId));
          
          // Check if batch has specific classroom assignments
          if (batch && batch.classrooms && batch.classrooms.length > 0) {
            let isAssignedClassroom = batch.classrooms.some(bc => {
              let classroom = classrooms.find(c => c._id.equals(bc));
              return classroom && classroom.name === entry.classroom;
            });
            
            if (!isAssignedClassroom) {
              classroomConstraintViolations++;
              objectives.constraintViolations -= 50; // Heavy penalty for using unassigned classroom
            }
          }
          
          // Check for specific classroom preferences
          let classroomConstraints = constraints.filter(c => 
            c.type === 'classroom_preference' && 
            c.details && 
            c.details.batch == batchId.toString() && 
            c.details.day === entry.day && 
            c.details.slot === entry.period
          );
          if (classroomConstraints.length > 0) {
            let preferredClassroomId = classroomConstraints[0].details.classroom;
            let preferredClassroom = classrooms.find(c => c._id.toString() === preferredClassroomId);
            if (preferredClassroom && entry.classroom !== preferredClassroom.name) {
              classroomConstraintViolations++;
              objectives.constraintViolations -= 3;
            }
          }
        }
        
        // Objective 3: Preference Satisfaction
        if (entry.preferred) {
          objectives.preferenceSatisfaction += 10; // Bonus for preferred slots
        }
        
        // Count per day and week for load balancing
        let bdsKey = `${entry.batch}-${entry.subject}-${entry.day}`;
        batchDaySubjectCount[bdsKey] = (batchDaySubjectCount[bdsKey] || 0) + 1;
        let bswKey = `${entry.batch}-${entry.subject}`;
        batchSubjectWeekCount[bswKey] = (batchSubjectWeekCount[bswKey] || 0) + 1;
      });
      
      // Objective 4: Load Balancing
      Object.keys(batchDaySubjectCount).forEach(k => {
        let [batch, subject, day] = k.split('-');
        let subj = subjects.find(s => s.name === subject);
        if (subj) {
          let maxPerDay = subjectConstraints[subj._id.toString()].maxPerDay;
          if (batchDaySubjectCount[k] > maxPerDay) {
            objectives.loadBalance -= (batchDaySubjectCount[k] - maxPerDay) * 10;
          }
        }
      });
      
      Object.keys(batchSubjectWeekCount).forEach(k => {
        let [batch, subject] = k.split('-');
        let subj = subjects.find(s => s.name === subject);
        if (subj) {
          let requiredPerWeek = subjectConstraints[subj._id.toString()].requiredPerWeek;
          if (batchSubjectWeekCount[k] < requiredPerWeek) {
            objectives.loadBalance -= (requiredPerWeek - batchSubjectWeekCount[k]) * 20;
          }
          if (batchSubjectWeekCount[k] > requiredPerWeek) {
            objectives.loadBalance -= (batchSubjectWeekCount[k] - requiredPerWeek) * 10;
          }
        }
      });
      
      // Objective 5: Resource Utilization
      let totalSlots = days.length * periods.length;
      let usedSlots = new Set();
      timetable.forEach(entry => {
        usedSlots.add(`${entry.day}-${entry.period}`);
      });
      objectives.resourceUtilization = (usedSlots.size / totalSlots) * 100; // Percentage utilization
      
      // Calculate weighted fitness score
      let weights = {
        conflicts: 0.4,        // Highest priority - no conflicts
        constraintViolations: 0.25,  // High priority - respect constraints
        preferenceSatisfaction: 0.15, // Medium priority - satisfy preferences
        loadBalance: 0.15,     // Medium priority - balanced load
        resourceUtilization: 0.05   // Low priority - efficient resource use
      };
      
      let finalScore = 0;
      finalScore += objectives.conflicts * weights.conflicts;
      finalScore += objectives.constraintViolations * weights.constraintViolations;
      finalScore += objectives.preferenceSatisfaction * weights.preferenceSatisfaction;
      finalScore += objectives.loadBalance * weights.loadBalance;
      finalScore += objectives.resourceUtilization * weights.resourceUtilization;
      
      // Additional penalties for critical violations
      finalScore -= subjectConstraintViolations * 100;
      finalScore -= classroomConstraintViolations * 50;
      finalScore -= teacherCollisionViolations * 100;
      
      return finalScore;
    }

    // Advanced crossover operations
    function crossover(parent1, parent2) {
      if (Math.random() > CROSSOVER_RATE) {
        return Math.random() < 0.5 ? parent1 : parent2;
      }
      
      let child = JSON.parse(JSON.stringify(parent1));
      let crossoverType = Math.random();
      
      if (crossoverType < 0.4) {
        // Uniform crossover: randomly select entries from each parent
        parent2.forEach((entry, index) => {
          if (Math.random() < 0.5 && index < child.length) {
            child[index] = JSON.parse(JSON.stringify(entry));
          }
        });
      } else if (crossoverType < 0.7) {
        // Batch-wise crossover: swap entire batches
        let batchNames = [...new Set(child.map(e => e.batch))];
        let batchToSwap = batchNames[Math.floor(Math.random() * batchNames.length)];
        
        let parent2BatchEntries = parent2.filter(e => e.batch === batchToSwap);
        child = child.filter(e => e.batch !== batchToSwap);
        child = child.concat(parent2BatchEntries);
      } else {
        // Subject-wise crossover: swap subjects within batches
        let batchNames = [...new Set(child.map(e => e.batch))];
        let batchToModify = batchNames[Math.floor(Math.random() * batchNames.length)];
        let subjectsInBatch = [...new Set(child.filter(e => e.batch === batchToModify).map(e => e.subject))];
        let subjectToSwap = subjectsInBatch[Math.floor(Math.random() * subjectsInBatch.length)];
        
        let parent2SubjectEntries = parent2.filter(e => e.batch === batchToModify && e.subject === subjectToSwap);
        child = child.filter(e => !(e.batch === batchToModify && e.subject === subjectToSwap));
        child = child.concat(parent2SubjectEntries);
      }
      
      // Apply conflict resolution to the child
      child = resolveConflicts(child);
      
      // Validate and fix batch classroom constraints
      child = validateAndFixBatchClassrooms(child);
      
      return child;
    }

    // Adaptive mutation with multiple strategies
    function mutate(timetable, generation, maxGenerations) {
      let newTT = JSON.parse(JSON.stringify(timetable));
      
      // Adaptive mutation rate based on generation progress
      let adaptiveMutationRate = BASE_MUTATION_RATE * (1 - generation / maxGenerations);
      
      for (let i = 0; i < newTT.length; i++) {
        if (Math.random() < adaptiveMutationRate) {
          let mutationType = Math.random();
          
          if (mutationType < 0.3) {
            // Random slot mutation
          newTT[i].day = days[Math.floor(Math.random() * days.length)];
          newTT[i].period = periods[Math.floor(Math.random() * periods.length)];
          } else if (mutationType < 0.6) {
            // Swap mutation: swap with another entry
            let swapIndex = Math.floor(Math.random() * newTT.length);
            if (swapIndex !== i) {
              let temp = { day: newTT[i].day, period: newTT[i].period, classroom: newTT[i].classroom };
              newTT[i].day = newTT[swapIndex].day;
              newTT[i].period = newTT[swapIndex].period;
              newTT[i].classroom = newTT[swapIndex].classroom;
              newTT[swapIndex].day = temp.day;
              newTT[swapIndex].period = temp.period;
              newTT[swapIndex].classroom = temp.classroom;
            }
          } else if (mutationType < 0.8) {
            // Local search mutation: try to improve the slot
            let bestSlot = findBestAlternativeSlot(newTT, newTT[i], 'general');
            if (bestSlot) {
              newTT[i].day = bestSlot.day;
              newTT[i].period = bestSlot.period;
              newTT[i].classroom = bestSlot.classroom;
            }
          } else if (mutationType < 0.9) {
            // Classroom reassignment mutation: try different classroom within batch constraints
            let batch = batches.find(b => b.name === newTT[i].batch);
            if (batch && batch.classrooms && batch.classrooms.length > 0) {
              let batchClassrooms = classrooms.filter(c => 
                batch.classrooms.some(bc => bc.toString() === c._id.toString())
              );
              if (batchClassrooms.length > 0) {
                let randomClassroom = batchClassrooms[Math.floor(Math.random() * batchClassrooms.length)];
                newTT[i].classroom = randomClassroom.name;
              }
            }
          } else {
            // Constraint-aware mutation: prioritize subject slot constraint satisfaction
            let batch = batches.find(b => b.name === newTT[i].batch);
            let subject = subjects.find(s => s.name === newTT[i].subject);
            if (batch && subject) {
              // Check if this subject has any subject slot constraints
              const subjectSlotConstraint = singleClassConstraints.find(sc => 
                sc.batchId === batch._id.toString() && 
                sc.subjectId === subject._id.toString()
              );
              
              if (subjectSlotConstraint) {
                // 90% chance to move to the subject slot constraint slot
                if (Math.random() < 0.9) {
                  newTT[i].day = subjectSlotConstraint.day;
                  newTT[i].period = subjectSlotConstraint.slot;
                } else {
                  // Random mutation
                  newTT[i].day = days[Math.floor(Math.random() * days.length)];
                  newTT[i].period = periods[Math.floor(Math.random() * periods.length)];
                }
              } else {
                // Random mutation for subjects without constraints
                newTT[i].day = days[Math.floor(Math.random() * days.length)];
                newTT[i].period = periods[Math.floor(Math.random() * periods.length)];
              }
            }
          }
        }
      }
      
      // Apply conflict resolution after mutation
      newTT = resolveConflicts(newTT);
      
      // Validate and fix batch classroom constraints
      newTT = validateAndFixBatchClassrooms(newTT);
      
      // Note: Removed ensureConstraintSatisfaction call here to prevent over-scheduling
      // Constraints should be handled during the main generation process
      
      return newTT;
    }

    // Diversity maintenance
    function calculateDiversity(population) {
      if (population.length < 2) return 1;
      
      let totalDifferences = 0;
      let comparisons = 0;
      
      for (let i = 0; i < population.length; i++) {
        for (let j = i + 1; j < population.length; j++) {
          let differences = 0;
          let minLength = Math.min(population[i].length, population[j].length);
          
          for (let k = 0; k < minLength; k++) {
            if (population[i][k].day !== population[j][k].day || 
                population[i][k].period !== population[j][k].period ||
                population[i][k].classroom !== population[j][k].classroom) {
              differences++;
            }
          }
          
          totalDifferences += differences / minLength;
          comparisons++;
        }
      }
      
      return comparisons > 0 ? totalDifferences / comparisons : 0;
    }

    // Local search optimization
    function localSearch(timetable) {
      let improved = true;
      let iterations = 0;
      let maxIterations = 5; // Reduced for faster execution
      
      while (improved && iterations < maxIterations) {
        improved = false;
        let currentFitness = fitness(timetable);
        
        for (let i = 0; i < timetable.length; i++) {
          let bestSlot = findBestAlternativeSlot(timetable, timetable[i], 'general');
          if (bestSlot) {
            let originalDay = timetable[i].day;
            let originalPeriod = timetable[i].period;
            let originalClassroom = timetable[i].classroom;
            
            timetable[i].day = bestSlot.day;
            timetable[i].period = bestSlot.period;
            timetable[i].classroom = bestSlot.classroom;
            
            let newFitness = fitness(timetable);
            if (newFitness > currentFitness) {
              improved = true;
              currentFitness = newFitness;
            } else {
              // Revert if no improvement
              timetable[i].day = originalDay;
              timetable[i].period = originalPeriod;
              timetable[i].classroom = originalClassroom;
            }
          }
        }
        
        // Try classroom optimization
        if (!improved && iterations < maxIterations - 1) {
          let optimizedTimetable = optimizeClassroomDistribution(JSON.parse(JSON.stringify(timetable)));
          optimizedTimetable = validateAndFixBatchClassrooms(optimizedTimetable);
          let optimizedFitness = fitness(optimizedTimetable);
          if (optimizedFitness > currentFitness) {
            timetable = optimizedTimetable;
            improved = true;
            currentFitness = optimizedFitness;
          }
        }
        
        iterations++;
      }
      
      return timetable;
    }

    // Advanced Genetic algorithm main loop
    let population = Array(POP_SIZE).fill(0).map(randomIndividual);
    let bestFitnessHistory = [];
    let diversityHistory = [];
    let stagnationCount = 0;
    let lastBestFitness = -Infinity;
    
    for (let gen = 0; gen < GENERATIONS; gen++) {
      // Calculate fitness and sort population
      population.forEach(individual => {
        individual.fitness = fitness(individual);
      });
      population.sort((a, b) => b.fitness - a.fitness);
      
      let currentBestFitness = population[0].fitness;
      bestFitnessHistory.push(currentBestFitness);
      
      // Check for stagnation
      if (Math.abs(currentBestFitness - lastBestFitness) < 0.01) {
        stagnationCount++;
      } else {
        stagnationCount = 0;
      }
      lastBestFitness = currentBestFitness;
      
      // Calculate diversity
      let currentDiversity = calculateDiversity(population);
      diversityHistory.push(currentDiversity);
      
      
      // Create new population
      let newPop = [];
      
      // Elitism: keep top individuals
      newPop = population.slice(0, ELITE_SIZE);
      
      // Generate offspring through crossover and mutation
      while (newPop.length < POP_SIZE) {
        let parent1, parent2;
        
        // Tournament selection for parent1
        let tournament1 = [];
        for (let i = 0; i < 5; i++) {
          tournament1.push(population[Math.floor(Math.random() * population.length)]);
        }
        parent1 = tournament1.reduce((best, current) => 
          current.fitness > best.fitness ? current : best
        );
        
        // Tournament selection for parent2
        let tournament2 = [];
        for (let i = 0; i < 5; i++) {
          tournament2.push(population[Math.floor(Math.random() * population.length)]);
        }
        parent2 = tournament2.reduce((best, current) => 
          current.fitness > best.fitness ? current : best
        );
        
        // Create offspring through crossover
        let child = crossover(parent1, parent2);
        
        // Apply mutation
        child = mutate(child, gen, GENERATIONS);
        
        // Apply local search to best individuals occasionally (reduced frequency)
        if (Math.random() < 0.05 && child.fitness > population[Math.floor(POP_SIZE * 0.2)].fitness) {
          child = localSearch(child);
          child.fitness = fitness(child);
        }
        
        newPop.push(child);
      }
      
      // Diversity maintenance: if diversity is too low, introduce random individuals
      if (currentDiversity < DIVERSITY_THRESHOLD) {
        let randomCount = Math.floor(POP_SIZE * 0.1);
        for (let i = 0; i < randomCount; i++) {
          let newRandomIndividual = randomIndividual();
          newRandomIndividual.fitness = fitness(newRandomIndividual);
          newPop[Math.floor(Math.random() * newPop.length)] = newRandomIndividual;
        }
      }
      
      // If stagnation detected, increase mutation rate temporarily
      if (stagnationCount > 10) {
        for (let i = ELITE_SIZE; i < newPop.length; i++) {
          if (Math.random() < 0.3) {
            let newRandomIndividual = randomIndividual();
            newRandomIndividual.fitness = fitness(newRandomIndividual);
            newPop[i] = newRandomIndividual;
          }
        }
        stagnationCount = 0;
      }
      
      population = newPop;
    }
    
    // Final local search on best individual
    population.sort((a, b) => b.fitness - a.fitness);
    let best = localSearch(population[0]);
    
    // Final validation and fix of batch classroom constraints
    best = validateAndFixBatchClassrooms(best);
    
    // Validate and fix over-scheduling issues
    best = validateAndFixOverScheduling(best);
    
    best.fitness = fitness(best);
    
    // Detect and report all constraints and limitations
    // Note: Removed ensureConstraintSatisfaction call here to prevent exceeding weekly limits
    // The main algorithm should handle constraints properly during generation
    let limitations = detectAllConstraintsAndLimitations(best);
    let limitationsReport = createLimitationsReport(limitations);
    
    // Validate constraint limits
    let constraintLimitViolations = validateConstraintLimits(best);
    
    
    // Enhanced collision detection with proper conflict identification
    let teacherCollisions = {};
    let classroomCollisions = {};
    let batchCollisions = {};
    
    // First pass: collect all collisions
    best.forEach(entry => {
      let teacherKey = `${entry.faculty}-${entry.day}-${entry.period}`;
      let classroomKey = `${entry.classroom}-${entry.day}-${entry.period}`;
      let batchKey = `${entry.batch}-${entry.day}-${entry.period}`;
      
      // Teacher collisions
      if (teacherCollisions[teacherKey]) {
        teacherCollisions[teacherKey].push(entry);
      } else {
        teacherCollisions[teacherKey] = [entry];
      }
      
      // Classroom collisions
      if (classroomCollisions[classroomKey]) {
        classroomCollisions[classroomKey].push(entry);
      } else {
        classroomCollisions[classroomKey] = [entry];
      }
      
      // Batch collisions
      if (batchCollisions[batchKey]) {
        batchCollisions[batchKey].push(entry);
      } else {
        batchCollisions[batchKey] = [entry];
      }
    });
    
    // Second pass: mark entries with specific collision types
    best.forEach(entry => {
      let teacherKey = `${entry.faculty}-${entry.day}-${entry.period}`;
      let classroomKey = `${entry.classroom}-${entry.day}-${entry.period}`;
      let batchKey = `${entry.batch}-${entry.day}-${entry.period}`;
      
      // Mark collision types
      entry.hasTeacherCollision = teacherCollisions[teacherKey].length > 1;
      entry.hasClassroomCollision = classroomCollisions[classroomKey].length > 1;
      entry.hasBatchCollision = batchCollisions[batchKey].length > 1;
      
      // Add collision details for debugging
      if (entry.hasTeacherCollision) {
        entry.teacherCollisionDetails = teacherCollisions[teacherKey].map(e => ({
          batch: e.batch,
          subject: e.subject,
          classroom: e.classroom
        }));
      }
      
      if (entry.hasClassroomCollision) {
        entry.classroomCollisionDetails = classroomCollisions[classroomKey].map(e => ({
          batch: e.batch,
          subject: e.subject,
          faculty: e.faculty
        }));
      }
      
      if (entry.hasBatchCollision) {
        entry.batchCollisionDetails = batchCollisions[batchKey].map(e => ({
          subject: e.subject,
          faculty: e.faculty,
          classroom: e.classroom
        }));
      }
    });
    
    // Calculate collision statistics
    let totalTeacherConflicts = Object.values(teacherCollisions).filter(arr => arr.length > 1).length;
    let totalClassroomConflicts = Object.values(classroomCollisions).filter(arr => arr.length > 1).length;
    let totalBatchConflicts = Object.values(batchCollisions).filter(arr => arr.length > 1).length;
    
    if (allBatchesMode) {
      // Group timetable by batch for frontend display
      let batchTimetables = {};
      batches.forEach(batch => {
        batchTimetables[batch._id] = best.filter(e => e.batch === batch.name);
      });
      res.json({
        batchTimetables,
        batches,
        days,
        periods,
        limitations: limitations,
        limitationsReport: limitationsReport,
        constraintLimitViolations: constraintLimitViolations
      });
    } else {
      let selectedBatch = batchList && batchList.length > 0 ? batchList[0] : null;
      res.json({
        timetable: best,
        batches,
        selectedBatch,
        limitations: limitations,
        limitationsReport: limitationsReport,
        constraintLimitViolations: constraintLimitViolations
      });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate timetable' });
  }
};

