
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
    console.log('Starting timetable generation (genetic algorithm)...');
    const classrooms = await Classroom.find();
    const subjects = await Subject.find();
    const faculties = await Faculty.find();
    const batches = await Batch.find();
    const constraints = await Constraint.find();
    const specialClasses = await SpecialClass.find();
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

    // Helper: build subject slot constraints map
    const subjectSlotConstraints = {};
    constraints.filter(c => c.type === 'subject_slot_preference').forEach(c => {
      if (c.details && c.details.batch && c.details.subject && c.details.day && c.details.slot) {
        const key = `${c.details.batch}-${c.details.subject}`;
        if (!subjectSlotConstraints[key]) {
          subjectSlotConstraints[key] = [];
        }
        subjectSlotConstraints[key].push({
          day: c.details.day,
          slot: c.details.slot,
          preferred: true
        });
      }
    });

    // Advanced Genetic algorithm parameters
    const POP_SIZE = 100; // Increased population size for better diversity
    const GENERATIONS = 200; // More generations for better convergence
    const BASE_MUTATION_RATE = 0.15; // Base mutation rate
    const CROSSOVER_RATE = 0.8; // Crossover probability
    const ELITE_SIZE = 15; // Elite individuals to preserve
    const DIVERSITY_THRESHOLD = 0.1; // Minimum diversity threshold
    const CONFLICT_RESOLUTION_ATTEMPTS = 5; // Max attempts to resolve conflicts

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
      
      // Prefer slots that don't violate constraints
      let batch = batches.find(b => b.name === entry.batch);
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

    // Find available classroom for a slot with better utilization
    function findAvailableClassroom(timetable, day, period, batchName) {
      let usedClassrooms = new Set();
      timetable.forEach(entry => {
        if (entry.day === day && entry.period === period) {
          usedClassrooms.add(entry.classroom);
        }
      });
      
      let batch = batches.find(b => b.name === batchName);
      let availableClassrooms = classrooms.filter(c => !usedClassrooms.has(c.name));
      
      if (availableClassrooms.length === 0) {
        // If all classrooms are occupied, return the first one (conflict will be handled by fitness function)
        return classrooms[0].name;
      }
      
      if (batch && batch.classrooms && batch.classrooms.length > 0) {
        let batchClassrooms = availableClassrooms.filter(c => 
          batch.classrooms.some(bc => bc.toString() === c._id.toString())
        );
        if (batchClassrooms.length > 0) {
          // Prefer less used classrooms within batch constraints
          let classroomUsage = {};
          timetable.forEach(entry => {
            classroomUsage[entry.classroom] = (classroomUsage[entry.classroom] || 0) + 1;
          });
          
          batchClassrooms.sort((a, b) => {
            let usageA = classroomUsage[a.name] || 0;
            let usageB = classroomUsage[b.name] || 0;
            return usageA - usageB;
          });
          
          return batchClassrooms[0].name;
        }
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

    // Function to optimize classroom distribution
    function optimizeClassroomDistribution(timetable) {
      let classroomUsage = {};
      let classroomSlots = {};
      
      // Count usage per classroom
      timetable.forEach(entry => {
        classroomUsage[entry.classroom] = (classroomUsage[entry.classroom] || 0) + 1;
        let key = `${entry.classroom}-${entry.day}-${entry.period}`;
        classroomSlots[key] = entry;
      });
      
      // Find overused and underused classrooms
      let totalEntries = timetable.length;
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
          let candidates = timetable.filter(entry => 
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
        for (const subjectId of batch.subjects) {
          const subject = subjects.find(s => s._id.equals(subjectId));
          if (!subject) continue;
          const teacherId = subjectTeacherMap[subjectId.toString()];
          const teacher = faculties.find(f => f._id.equals(teacherId));
          const requiredPerWeek = subjectConstraints[subjectId.toString()].requiredPerWeek;
          const maxPerDay = subjectConstraints[subjectId.toString()].maxPerDay;
          let slots = [];
          let remaining = requiredPerWeek;
          let daySlots = Array(days.length).fill(0);
          let dayOrder = Array.from(Array(days.length).keys());
          
          // Check for subject slot constraints for this batch/subject
          const constraintKey = `${batch._id}-${subjectId}`;
          const subjectSlotConstraintsForThis = subjectSlotConstraints[constraintKey] || [];
          subjectSlotConstraintsForThis.forEach(ssc => {
            let dayIdx = days.indexOf(ssc.day);
            let periodIdx = periods.indexOf(ssc.slot);
            if (dayIdx !== -1 && periodIdx !== -1 && remaining > 0 && daySlots[dayIdx] < maxPerDay) {
              slots.push({ day: days[dayIdx], period: periods[periodIdx], preferred: true });
              daySlots[dayIdx]++;
              remaining--;
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
          while (remaining > 0) {
            for (let i = dayOrder.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [dayOrder[i], dayOrder[j]] = [dayOrder[j], dayOrder[i]];
            }
            for (let d of dayOrder) {
              if (remaining > 0 && daySlots[d] < maxPerDay) {
                slots.push({ day: days[d] });
                daySlots[d]++;
                remaining--;
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
                let batchClassrooms = availableClassrooms.filter(c => 
                  batch.classrooms.some(bc => bc.toString() === c._id.toString())
                );
                if (batchClassrooms.length > 0) {
                  classroom = batchClassrooms[Math.floor(Math.random() * batchClassrooms.length)];
                } else {
                  // If no batch-specific classrooms available, use any available classroom
                  classroom = availableClassrooms.length > 0 ? availableClassrooms[Math.floor(Math.random() * availableClassrooms.length)] : classrooms[0];
                }
              } else {
                // Use any available classroom, prioritizing less used ones
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
      
      // Optimize classroom distribution
      timetable = optimizeClassroomDistribution(timetable);
      
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
        
        // Objective 2: Constraint Violations
        let batchId = batches.find(b => b.name === entry.batch)?._id;
        let subjectId = subjects.find(s => s.name === entry.subject)?._id;
        if (batchId && subjectId) {
          const constraintKey = `${batchId}-${subjectId}`;
          const subjectSlotConstraintsForThis = subjectSlotConstraints[constraintKey] || [];
          const hasConstraintForThisSlot = subjectSlotConstraintsForThis.some(c => 
            c.day === entry.day && c.slot === entry.period
          );
          if (subjectSlotConstraintsForThis.length > 0 && !hasConstraintForThisSlot) {
            subjectConstraintViolations++;
            objectives.constraintViolations -= 5;
          }
        }
        
        // Check classroom constraint violations
        if (batchId) {
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
          } else {
            // Constraint-aware mutation: move to a preferred slot
            let batch = batches.find(b => b.name === newTT[i].batch);
            let subject = subjects.find(s => s.name === newTT[i].subject);
            if (batch && subject) {
              const constraintKey = `${batch._id}-${subject._id}`;
              const subjectSlotConstraintsForThis = subjectSlotConstraints[constraintKey] || [];
              if (subjectSlotConstraintsForThis.length > 0) {
                let preferredSlot = subjectSlotConstraintsForThis[Math.floor(Math.random() * subjectSlotConstraintsForThis.length)];
                newTT[i].day = preferredSlot.day;
                newTT[i].period = preferredSlot.slot;
              }
            }
          }
        }
      }
      
      // Apply conflict resolution after mutation
      newTT = resolveConflicts(newTT);
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
      let maxIterations = 10;
      
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
    
    console.log('Starting advanced genetic algorithm...');
    
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
      
      // Log progress every 20 generations
      if (gen % 20 === 0) {
        console.log(`Generation ${gen}: Best fitness = ${currentBestFitness.toFixed(2)}, Diversity = ${currentDiversity.toFixed(3)}`);
      }
      
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
        
        // Apply local search to best individuals occasionally
        if (Math.random() < 0.1 && child.fitness > population[Math.floor(POP_SIZE * 0.3)].fitness) {
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
        console.log(`Stagnation detected at generation ${gen}, applying diversity boost...`);
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
    best.fitness = fitness(best);
    
    console.log('Genetic algorithm completed!');
    console.log(`Final best fitness: ${best.fitness.toFixed(2)}`);
    console.log(`Fitness improvement: ${(best.fitness - bestFitnessHistory[0]).toFixed(2)}`);
    console.log(`Final diversity: ${calculateDiversity(population).toFixed(3)}`);
    console.log('Generated timetable entries:', best.length);
    console.log('Sample entry:', best[0]);
    
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
    
    // Log collision statistics
    let totalTeacherConflicts = Object.values(teacherCollisions).filter(arr => arr.length > 1).length;
    let totalClassroomConflicts = Object.values(classroomCollisions).filter(arr => arr.length > 1).length;
    let totalBatchConflicts = Object.values(batchCollisions).filter(arr => arr.length > 1).length;
    
    console.log(`Collision Summary:`);
    console.log(`- Teacher conflicts: ${totalTeacherConflicts}`);
    console.log(`- Classroom conflicts: ${totalClassroomConflicts}`);
    console.log(`- Batch conflicts: ${totalBatchConflicts}`);
    
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
      });
    } else {
      let selectedBatch = batchList && batchList.length > 0 ? batchList[0] : null;
      res.json({
        timetable: best,
        batches,
        selectedBatch
      });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate timetable' });
  }
};

