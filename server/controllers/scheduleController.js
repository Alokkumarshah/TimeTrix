
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

    // Enhanced genetic algorithm parameters for better conflict resolution
    const POP_SIZE = 50; // Increased population size
    const GENERATIONS = 100; // More generations for better optimization
    const MUTATION_RATE = 0.3; // Higher mutation rate for more exploration

    // Individual: timetable for all batches
    function randomIndividual() {
      let timetable = [];
      let usedClassrooms = {};
      // Build lunch break map: {batchId: {day: Set(periodNames)}}
      const lunchByBatchDay = {};
      // fixedBySubject structure: { [batchId]: { [day]: { [subjectId]: Set(periodName) } } }
      const fixedBySubject = {};
      for (const sc of specialClasses) {
        if (sc.type === 'lunch_break') {
          const periodsForBreak = (sc.slots && sc.slots.length) ? sc.slots : [];
          const batchKey = sc.batch?.toString();
          if (!batchKey) continue;
          if (!lunchByBatchDay[batchKey]) lunchByBatchDay[batchKey] = {};
          if (!lunchByBatchDay[batchKey][sc.day]) lunchByBatchDay[batchKey][sc.day] = new Set();
          periodsForBreak.forEach(pn => lunchByBatchDay[batchKey][sc.day].add(pn));
        }
        if (sc.type === 'fixed_slot') {
          const periodsForFix = (sc.slots && sc.slots.length) ? sc.slots : [];
          const batchKey = sc.batch?.toString();
          const subjectKey = sc.subject?.toString();
          if (!batchKey || !subjectKey) continue;
          if (!fixedBySubject[batchKey]) fixedBySubject[batchKey] = {};
          if (!fixedBySubject[batchKey][sc.day]) fixedBySubject[batchKey][sc.day] = {};
          if (!fixedBySubject[batchKey][sc.day][subjectKey]) fixedBySubject[batchKey][sc.day][subjectKey] = new Set();
          periodsForFix.forEach(pn => fixedBySubject[batchKey][sc.day][subjectKey].add(pn));
        }
      }
      for (const batch of batchList) {
        // PRIORITY 1: Place special classes first (lunch breaks and fixed slots)
        const batchSpecialClasses = specialClasses.filter(sc => sc.batch?.toString() === batch._id.toString());
        
        // Place lunch breaks first - they don't use classrooms or teachers
        for (const sc of batchSpecialClasses) {
          if (sc.type === 'lunch_break') {
            const periodsForBreak = (sc.slots && sc.slots.length) ? sc.slots : [];
            periodsForBreak.forEach(periodName => {
              // Lunch breaks don't use classrooms or teachers - they're independent
              // Generate unique ID for each lunch break entry
              const lunchBreakId = `lunch_${batch._id}_${sc.day}_${periodName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              timetable.push({
                batch: batch.name,
                subject: 'Lunch Break',
                faculty: '',
                classroom: '',
                department: batch.department,
                shift: batch.shift,
                day: sc.day,
                period: periodName,
                startTime: sc.startTime || '',
                endTime: sc.endTime || '',
                preferred: true,
                fallbackClassroom: false,
                assignedClassroom: true,
                fixedSlot: true,
                specialClassId: sc._id,
                lunchBreakId: lunchBreakId
              });
            });
          }
        }
        
        // Place fixed slots next
        for (const sc of batchSpecialClasses) {
          if (sc.type === 'fixed_slot' && sc.subject) {
            const subject = subjects.find(s => s._id.equals(sc.subject));
            if (subject) {
              const teacherId = batch.subjectTeacherAssignments?.find(sta => sta.subject.toString() === sc.subject.toString())?.teacher;
              const teacher = faculties.find(f => f._id.equals(teacherId));
              const periodsForFix = (sc.slots && sc.slots.length) ? sc.slots : [];
              
              periodsForFix.forEach(periodName => {
                // Find available classroom for this fixed slot
                let classroom = null;
                let fallbackUsed = false;
                
                // Check if batch has specific classroom assignments
                if (batch.classrooms && batch.classrooms.length > 0) {
                  let assignedClassrooms = classrooms.filter(c => 
                    batch.classrooms.some(bc => bc.toString() === c._id.toString())
                  );
                  
                  let availableAssignedClassrooms = assignedClassrooms.filter(c => {
                    let key = `${sc.day}-${periods.indexOf(periodName)}-${c._id}`;
                    return !usedClassrooms[key];
                  });
                  
                  if (availableAssignedClassrooms.length > 0) {
                    classroom = availableAssignedClassrooms[0];
                  } else {
                    // Use any available classroom as fallback
                    let allAvailableClassrooms = classrooms.filter(c => {
                      let key = `${sc.day}-${periods.indexOf(periodName)}-${c._id}`;
                      return !usedClassrooms[key];
                    });
                    if (allAvailableClassrooms.length > 0) {
                      classroom = allAvailableClassrooms[0];
                      fallbackUsed = true;
                    } else {
                      classroom = classrooms[0];
                      fallbackUsed = true;
                    }
                  }
                } else {
                  classroom = classrooms[0];
                }
                
                // Only mark classroom and teacher as used for fixed slots (not lunch breaks)
                let key = `${sc.day}-${periods.indexOf(periodName)}-${classroom._id}`;
                let teacherKey = `${teacher ? teacher.name : 'TBD'}-${sc.day}-${periodName}`;
                usedClassrooms[key] = true;
                usedClassrooms[`teacher-${teacherKey}`] = true;
                
                timetable.push({
                  batch: batch.name,
                  subject: subject.name,
                  faculty: teacher ? teacher.name : 'TBD',
                  classroom: classroom ? classroom.name : 'TBD',
                  department: batch.department,
                  shift: batch.shift,
                  day: sc.day,
                  period: periodName,
                  startTime: sc.startTime || '',
                  endTime: sc.endTime || '',
                  preferred: true,
                  fallbackClassroom: fallbackUsed,
                  assignedClassroom: batch.classrooms && batch.classrooms.length > 0 ? 
                    batch.classrooms.some(bc => bc.toString() === classroom._id.toString()) : true,
                  fixedSlot: true,
                  specialClassId: sc._id
                });
              });
            }
          }
        }
        
        // PRIORITY 2: Place regular subjects (excluding those already placed as fixed slots)
        let subjectTeacherMap = {};
        if (batch.subjectTeacherAssignments && batch.subjectTeacherAssignments.length) {
          batch.subjectTeacherAssignments.forEach(sta => {
            subjectTeacherMap[sta.subject.toString()] = sta.teacher;
          });
        }
        
        // Get subjects that are already placed as fixed slots and their counts
        const fixedSubjectCounts = {};
        batchSpecialClasses
          .filter(sc => sc.type === 'fixed_slot' && sc.subject)
          .forEach(sc => {
            const subjectId = sc.subject.toString();
            const periodsForFix = (sc.slots && sc.slots.length) ? sc.slots.length : 1;
            fixedSubjectCounts[subjectId] = (fixedSubjectCounts[subjectId] || 0) + periodsForFix;
          });
        
        for (const subjectId of batch.subjects) {
          const subject = subjects.find(s => s._id.equals(subjectId));
          if (!subject) continue;
          
          const requiredPerWeek = subjectConstraints[subjectId.toString()].requiredPerWeek;
          const fixedCount = fixedSubjectCounts[subjectId.toString()] || 0;
          const remainingRequired = requiredPerWeek - fixedCount;
          
          // If all required classes are already placed as fixed slots, skip
          if (remainingRequired <= 0) {
            continue;
          }
          const teacherId = subjectTeacherMap[subjectId.toString()];
          const teacher = faculties.find(f => f._id.equals(teacherId));
          const maxPerDay = subjectConstraints[subjectId.toString()].maxPerDay;
          let slots = [];
          let remaining = remainingRequired; // Use the calculated remaining required classes
          let daySlots = Array(days.length).fill(0);
          let dayOrder = Array.from(Array(days.length).keys());
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
            // Lunch breaks don't block other batches from using the same slot
            // Only avoid lunch breaks for the current batch itself
            const lunchSet = lunchByBatchDay[batch._id.toString()]?.[slot.day];
            if (lunchSet) {
              let guard = 0;
              while (lunchSet.has(periods[p]) && guard < 10) {
                p = Math.floor(Math.random() * periods.length);
                guard++;
              }
            }
            
            // Additional check: make sure we're not overriding an already placed lunch break
            const existingLunchBreak = timetable.find(entry => 
              entry.batch === batch.name && 
              entry.day === slot.day && 
              entry.period === periods[p] && 
              entry.subject === 'Lunch Break'
            );
            if (existingLunchBreak) {
              // Find a different period that doesn't have a lunch break
              let guard = 0;
              while (guard < 10) {
                const testPeriod = periods[Math.floor(Math.random() * periods.length)];
                const hasLunchBreak = timetable.some(entry => 
                  entry.batch === batch.name && 
                  entry.day === slot.day && 
                  entry.period === testPeriod && 
                  entry.subject === 'Lunch Break'
                );
                if (!hasLunchBreak) {
                  p = periods.indexOf(testPeriod);
                  break;
                }
                guard++;
              }
            }
            // Respect fixed slots by subject: if a fixed slot exists for this subject/day, use it
            const subjFixedSet = fixedBySubject[batch._id.toString()]?.[slot.day]?.[subject._id.toString()];
            if (subjFixedSet && subjFixedSet.size > 0) {
              // Prefer a fixed period for this subject/day
              for (let idx = 0; idx < periods.length; idx++) {
                if (subjFixedSet.has(periods[idx])) { p = idx; break; }
              }
            }
            
            // Check for classroom constraints for this batch/slot
            let classroomConstraints = constraints.filter(c => 
              c.type === 'classroom_preference' && 
              c.details && 
              c.details.batch == batch._id.toString() && 
              c.details.day === slot.day && 
              c.details.slot === periods[p]
            );
            
            // Strict classroom assignment enforcement
            let classroom = null;
            let fallbackUsed = false;
            
            // If there's a classroom constraint for this slot, prioritize that classroom
            if (classroomConstraints.length > 0) {
              let preferredClassroomId = classroomConstraints[0].details.classroom;
              let preferredClassroom = classrooms.find(c => c._id.toString() === preferredClassroomId);
              if (preferredClassroom) {
                let key = `${slot.day}-${p}-${preferredClassroom._id}`;
                if (!usedClassrooms[key]) {
                  classroom = preferredClassroom;
                } else {
                  // Preferred classroom is occupied, try to find alternative time slot
                  let alternativeFound = false;
                  for (let altP = 0; altP < periods.length; altP++) {
                    if (altP !== p) {
                      let altKey = `${slot.day}-${altP}-${preferredClassroom._id}`;
                      if (!usedClassrooms[altKey]) {
                        p = altP;
                        classroom = preferredClassroom;
                        alternativeFound = true;
                        break;
                      }
                    }
                  }
                  if (!alternativeFound) {
                    // No alternative time found, this will be marked as conflict
                    classroom = preferredClassroom;
                  }
                }
              }
            } else {
              // Check if batch has specific classroom assignments
              if (batch.classrooms && batch.classrooms.length > 0) {
                // First, try to find an available assigned classroom
                let assignedClassrooms = classrooms.filter(c => 
                  batch.classrooms.some(bc => bc.toString() === c._id.toString())
                );
                
                let availableAssignedClassrooms = assignedClassrooms.filter(c => {
                  let key = `${slot.day}-${p}-${c._id}`;
                  return !usedClassrooms[key];
                });
                
                if (availableAssignedClassrooms.length > 0) {
                  classroom = availableAssignedClassrooms[Math.floor(Math.random() * availableAssignedClassrooms.length)];
                } else {
                  // No assigned classrooms available, try alternative time slots
                  let alternativeFound = false;
                  for (let assignedClass of assignedClassrooms) {
                    for (let altP = 0; altP < periods.length; altP++) {
                      if (altP !== p) {
                        let altKey = `${slot.day}-${altP}-${assignedClass._id}`;
                        if (!usedClassrooms[altKey]) {
                          p = altP;
                          classroom = assignedClass;
                          alternativeFound = true;
                          break;
                        }
                      }
                    }
                    if (alternativeFound) break;
                  }
                  
                  if (!alternativeFound) {
                    // No alternative time found for assigned classrooms
                    // Only use fallback if absolutely necessary (emergency fallback)
                    let allAvailableClassrooms = classrooms.filter(c => {
                      let key = `${slot.day}-${p}-${c._id}`;
                      return !usedClassrooms[key];
                    });
                    
                    if (allAvailableClassrooms.length > 0) {
                      classroom = allAvailableClassrooms[Math.floor(Math.random() * allAvailableClassrooms.length)];
                      fallbackUsed = true;
                      console.log(`WARNING: Using fallback classroom ${classroom.name} for batch ${batch.name} - assigned classrooms not available`);
                    } else {
                      // Last resort - use any classroom (will be marked as conflict)
                      classroom = assignedClassrooms[0] || classrooms[0];
                      fallbackUsed = true;
                      console.log(`CRITICAL: No classrooms available for batch ${batch.name}, using ${classroom.name}`);
                    }
                  }
                }
              } else {
                // Batch has no specific classroom assignments, use any available
                let availableClassrooms = classrooms.filter(c => {
                  let key = `${slot.day}-${p}-${c._id}`;
                  return !usedClassrooms[key];
                });
                classroom = availableClassrooms.length > 0 ? availableClassrooms[Math.floor(Math.random() * availableClassrooms.length)] : classrooms[0];
              }
            }
            
            // Double-check for teacher conflicts before finalizing
            let teacherKey = `${teacher ? teacher.name : 'TBD'}-${slot.day}-${periods[p]}`;
            if (usedClassrooms[`teacher-${teacherKey}`]) {
              // Try to find a different period for this teacher
              let alternativePeriods = periods.filter((_, idx) => idx !== p);
              for (let altP of alternativePeriods) {
                let altTeacherKey = `${teacher ? teacher.name : 'TBD'}-${slot.day}-${periods[altP]}`;
                if (!usedClassrooms[`teacher-${altTeacherKey}`]) {
                  p = altP;
                  teacherKey = altTeacherKey; // Update teacherKey to match new period
                  break;
                }
              }
            }
            
            let key = `${slot.day}-${p}-${classroom._id}`;
            usedClassrooms[key] = true;
            usedClassrooms[`teacher-${teacherKey}`] = true;
            const isFixed = !!(fixedBySubject[batch._id.toString()]?.[slot.day]?.[subject._id.toString()]?.has(periods[p]));
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
              preferred: slot.preferred || false,
              fallbackClassroom: fallbackUsed,
              fixedSlot: isFixed,
              assignedClassroom: batch.classrooms && batch.classrooms.length > 0 ? 
                batch.classrooms.some(bc => bc.toString() === classroom._id.toString()) : true
            });
          });
        }
      }
      // Lunch entries are already added in the special classes section above
      // No need to add them again here to avoid duplicates
      return timetable;
    }

    // Enhanced Fitness: heavily penalize conflicts and reward conflict-free solutions
    function fitness(timetable) {
      let score = 1000; // Start with positive score
      let batchDaySubjectCount = {};
      let batchSubjectWeekCount = {};
      let slotMap = {};
      let classroomSlotMap = {};
      let teacherSlotMap = {};
      let classroomConstraintViolations = 0;
      let conflictCount = 0;
      let specialClassesPlaced = 0;
      let totalSpecialClasses = 0;
      
      // Count total special classes that should be placed
      for (const sc of specialClasses) {
        if (sc.type === 'lunch_break' || sc.type === 'fixed_slot') {
          totalSpecialClasses += (sc.slots && sc.slots.length) ? sc.slots.length : 1;
        }
      }
      
      timetable.forEach(entry => {
        if (entry.subject === 'Lunch Break') {
          // Lunch breaks are special classes - give bonus for placing them
          if (entry.fixedSlot) {
            specialClassesPlaced++;
            score += 100; // High bonus for lunch break placement
          }
          return;
        }
        
        // Check if this is a fixed slot (special class)
        if (entry.fixedSlot) {
          specialClassesPlaced++;
          score += 150; // Even higher bonus for fixed slot placement
        }
        let key = `${entry.batch}-${entry.day}-${entry.period}`;
        let teacherKey = `${entry.faculty}-${entry.day}-${entry.period}`;
        let classKey = `${entry.day}-${entry.period}-${entry.classroom}`;
        
        // Heavy penalty for using fallback classrooms (not assigned to batch)
        if (entry.fallbackClassroom) {
          score -= 200; // Very heavy penalty for fallback classroom usage
        }
        
        // Batch slot conflict (same batch, same time) - but lunch breaks don't conflict
        if (entry.subject !== 'Lunch Break') {
          if (slotMap[key]) {
            score -= 100; // Heavy penalty for batch conflicts
            conflictCount++;
          }
          slotMap[key] = true;
        }
        
        // Teacher conflict (same teacher, same time) - but lunch breaks don't have teachers
        if (entry.subject !== 'Lunch Break') {
          if (teacherSlotMap[teacherKey]) {
            score -= 150; // Heavier penalty for teacher conflicts
            conflictCount++;
          }
          teacherSlotMap[teacherKey] = true;
        }
        
        // Classroom conflict (same classroom, same time) - but lunch breaks don't use classrooms
        if (entry.subject !== 'Lunch Break') {
          if (classroomSlotMap[classKey]) {
            score -= 120; // Heavy penalty for classroom conflicts
            conflictCount++;
          }
          classroomSlotMap[classKey] = true;
        }
        
        // Check classroom constraint violations
        let batchId = batches.find(b => b.name === entry.batch)?._id;
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
              score -= 30; // Penalty for not using preferred classroom
            }
          }
        }
        
        // Count per day
        let bdsKey = `${entry.batch}-${entry.subject}-${entry.day}`;
        batchDaySubjectCount[bdsKey] = (batchDaySubjectCount[bdsKey] || 0) + 1;
        // Count per week
        let bswKey = `${entry.batch}-${entry.subject}`;
        batchSubjectWeekCount[bswKey] = (batchSubjectWeekCount[bswKey] || 0) + 1;
      });
      
      // MASSIVE bonus for placing all special classes
      if (specialClassesPlaced === totalSpecialClasses && totalSpecialClasses > 0) {
        score += 1000; // Very high bonus for complete special class placement
      } else if (totalSpecialClasses > 0) {
        // Penalty for missing special classes (proportional to how many are missing)
        const missingSpecialClasses = totalSpecialClasses - specialClassesPlaced;
        score -= missingSpecialClasses * 200; // Heavy penalty for each missing special class
      }
      
      // Bonus for conflict-free solutions
      if (conflictCount === 0) {
        score += 500; // Big bonus for no conflicts
      }
      
      // Penalize classroom constraint violations
      score -= classroomConstraintViolations * 50;
      
      // Penalize over maxPerDay and under/over requiredPerWeek
      Object.keys(batchDaySubjectCount).forEach(k => {
        let [batch, subject, day] = k.split('-');
        let subj = subjects.find(s => s.name === subject);
        if (subj) {
          let maxPerDay = subjectConstraints[subj._id.toString()].maxPerDay;
          if (batchDaySubjectCount[k] > maxPerDay) score -= (batchDaySubjectCount[k] - maxPerDay) * 15;
        }
      });
      Object.keys(batchSubjectWeekCount).forEach(k => {
        let [batch, subject] = k.split('-');
        let subj = subjects.find(s => s.name === subject);
        if (subj) {
          let requiredPerWeek = subjectConstraints[subj._id.toString()].requiredPerWeek;
          if (batchSubjectWeekCount[k] < requiredPerWeek) score -= (requiredPerWeek - batchSubjectWeekCount[k]) * 25;
          if (batchSubjectWeekCount[k] > requiredPerWeek) score -= (batchSubjectWeekCount[k] - requiredPerWeek) * 15;
        }
      });
      
      return score;
    }

    // Enhanced Mutation: intelligent conflict resolution
    function mutate(timetable) {
      let newTT = JSON.parse(JSON.stringify(timetable));
      
      // First, identify conflicts
      let conflicts = findConflicts(newTT);
      
      // If there are conflicts, try to resolve them
      if (conflicts.length > 0) {
        // Prioritize resolving conflicts over random mutations
        for (let conflict of conflicts) {
          if (Math.random() < MUTATION_RATE * 2) { // Higher mutation rate for conflicts
            let entry = newTT.find(e => 
              e.batch === conflict.batch && 
              e.day === conflict.day && 
              e.period === conflict.period
            );
            
            if (entry) {
              // Try to find a better slot
              let newSlot = findBetterSlot(entry, newTT);
              if (newSlot) {
                entry.day = newSlot.day;
                entry.period = newSlot.period;
                entry.classroom = newSlot.classroom;
              }
            }
          }
        }
      }
      
      // Regular random mutations for non-conflict entries
      for (let i = 0; i < newTT.length; i++) {
        if (Math.random() < MUTATION_RATE) {
          newTT[i].day = days[Math.floor(Math.random() * days.length)];
          newTT[i].period = periods[Math.floor(Math.random() * periods.length)];
          
          // Also try to find a better classroom (prefer assigned classrooms)
          let batch = batches.find(b => b.name === newTT[i].batch);
          let availableClassrooms = [];
          
          if (batch && batch.classrooms && batch.classrooms.length > 0) {
            // First try assigned classrooms
            availableClassrooms = classrooms.filter(c => {
              let isAssigned = batch.classrooms.some(bc => bc.toString() === c._id.toString());
              let isAvailable = !isClassroomOccupied(newTT, newTT[i].day, newTT[i].period, c.name, newTT[i].batch);
              return isAssigned && isAvailable;
            });
          }
          
          // If no assigned classrooms available, use any available (but mark as fallback)
          if (availableClassrooms.length === 0) {
            availableClassrooms = classrooms.filter(c => {
              return !isClassroomOccupied(newTT, newTT[i].day, newTT[i].period, c.name, newTT[i].batch);
            });
            if (availableClassrooms.length > 0) {
              newTT[i].fallbackClassroom = true;
            }
          } else {
            newTT[i].fallbackClassroom = false;
          }
          
          if (availableClassrooms.length > 0) {
            newTT[i].classroom = availableClassrooms[Math.floor(Math.random() * availableClassrooms.length)].name;
          }
        }
      }
      
      return newTT;
    }
    
    // Helper function to find conflicts in timetable
    function findConflicts(timetable) {
      let conflicts = [];
      let slotMap = {};
      let teacherSlotMap = {};
      let classroomSlotMap = {};
      
      timetable.forEach(entry => {
        // For lunch breaks, only check conflicts within the same batch (by name)
        if (entry.subject === 'Lunch Break') {
          let key = `${entry.batch}-${entry.day}-${entry.period}`;
          if (slotMap[key]) {
            conflicts.push({
              batch: entry.batch,
              day: entry.day,
              period: entry.period,
              type: 'batch',
              subject: entry.subject,
              lunchBreakId: entry.lunchBreakId
            });
          }
          slotMap[key] = true;
          return;
        }
        
        let key = `${entry.batch}-${entry.day}-${entry.period}`;
        let teacherKey = `${entry.faculty}-${entry.day}-${entry.period}`;
        let classKey = `${entry.day}-${entry.period}-${entry.classroom}`;
        
        if (slotMap[key] || teacherSlotMap[teacherKey] || classroomSlotMap[classKey]) {
          conflicts.push({
            batch: entry.batch,
            day: entry.day,
            period: entry.period,
            type: slotMap[key] ? 'batch' : teacherSlotMap[teacherKey] ? 'teacher' : 'classroom'
          });
        }
        
        slotMap[key] = true;
        teacherSlotMap[teacherKey] = true;
        classroomSlotMap[classKey] = true;
      });
      
      return conflicts;
    }
    
    // Helper function to find a better slot for an entry
    function findBetterSlot(entry, timetable) {
      let bestSlot = null;
      let bestScore = -Infinity;
      
      // Try different day/period combinations
      for (let day of days) {
        for (let period of periods) {
          // Check if this slot is available
          let isAvailable = true;
          let tempTimetable = timetable.filter(e => 
            !(e.batch === entry.batch && e.day === entry.day && e.period === entry.period)
          );
          
          // Check for conflicts
          for (let otherEntry of tempTimetable) {
            if (otherEntry.batch === entry.batch && otherEntry.day === day && otherEntry.period === period) {
              isAvailable = false;
              break;
            }
            if (otherEntry.faculty === entry.faculty && otherEntry.day === day && otherEntry.period === period) {
              isAvailable = false;
              break;
            }
          }
          
          if (isAvailable) {
            // Find available classroom for this slot
            let availableClassrooms = classrooms.filter(c => {
              return !tempTimetable.some(e => 
                e.day === day && e.period === period && e.classroom === c.name
              );
            });
            
            if (availableClassrooms.length > 0) {
              let classroom = availableClassrooms[0];
              let score = 0;
              
              // Prefer slots that don't violate constraints
              let batchId = batches.find(b => b.name === entry.batch)?._id;
              if (batchId) {
                let classroomConstraints = constraints.filter(c => 
                  c.type === 'classroom_preference' && 
                  c.details && 
                  c.details.batch == batchId.toString() && 
                  c.details.day === day && 
                  c.details.slot === period
                );
                if (classroomConstraints.length > 0) {
                  let preferredClassroomId = classroomConstraints[0].details.classroom;
                  let preferredClassroom = classrooms.find(c => c._id.toString() === preferredClassroomId);
                  if (preferredClassroom && classroom.name === preferredClassroom.name) {
                    score += 100; // Bonus for using preferred classroom
                  }
                }
              }
              
              if (score > bestScore) {
                bestScore = score;
                bestSlot = { day, period, classroom: classroom.name };
              }
            }
          }
        }
      }
      
      return bestSlot;
    }
    
    // Helper function to check if classroom is occupied (excluding lunch breaks)
    function isClassroomOccupied(timetable, day, period, classroom, excludeBatch) {
      return timetable.some(entry => 
        entry.subject !== 'Lunch Break' && // Lunch breaks don't occupy classrooms
        entry.day === day && 
        entry.period === period && 
        entry.classroom === classroom && 
        entry.batch !== excludeBatch
      );
    }
    
    // Post-processing function to resolve remaining conflicts
    function postProcessConflicts(timetable) {
      let maxAttempts = 10; // Maximum attempts to resolve conflicts
      let attempts = 0;
      
      while (attempts < maxAttempts) {
        let conflicts = findConflicts(timetable);
        if (conflicts.length === 0) break; // No conflicts found
        
        // Try to resolve each conflict
        for (let conflict of conflicts) {
          let entry = timetable.find(e => 
            e.batch === conflict.batch && 
            e.day === conflict.day && 
            e.period === conflict.period
          );
          
          if (entry) {
            let newSlot = findBetterSlot(entry, timetable);
            if (newSlot) {
              entry.day = newSlot.day;
              entry.period = newSlot.period;
              entry.classroom = newSlot.classroom;
            }
          }
        }
        
        attempts++;
      }
      
      return timetable;
    }

    // Crossover: not used (single batch, single timetable)

    // Function to detect and mark conflicts in timetable
    function detectConflicts(timetable) {
      let teacherSlotMap = {}; // Track teacher assignments
      let classroomSlotMap = {}; // Track classroom assignments
      let batchSlotMap = {}; // Track batch slot assignments (for lunch breaks)
      
      // First pass: collect all assignments
      timetable.forEach(entry => {
        if (entry.subject === 'Lunch Break') {
          // For lunch breaks, only track batch conflicts (same batch, same time)
          let batchKey = `${entry.batch}-${entry.day}-${entry.period}`;
          if (!batchSlotMap[batchKey]) {
            batchSlotMap[batchKey] = [];
          }
          batchSlotMap[batchKey].push(entry);
          return;
        }
        
        let teacherKey = `${entry.faculty}-${entry.day}-${entry.period}`;
        let classroomKey = `${entry.classroom}-${entry.day}-${entry.period}`;
        
        if (!teacherSlotMap[teacherKey]) {
          teacherSlotMap[teacherKey] = [];
        }
        if (!classroomSlotMap[classroomKey]) {
          classroomSlotMap[classroomKey] = [];
        }
        
        teacherSlotMap[teacherKey].push(entry);
        classroomSlotMap[classroomKey].push(entry);
      });
      
      // Second pass: mark conflicts
      timetable.forEach(entry => {
        if (entry.subject === 'Lunch Break') {
          // For lunch breaks, only check batch conflicts (same batch, same time)
          let batchKey = `${entry.batch}-${entry.day}-${entry.period}`;
          entry.hasTeacherCollision = false; // Lunch breaks don't have teachers
          entry.hasClassroomCollision = false; // Lunch breaks don't use classrooms
          entry.hasBatchCollision = batchSlotMap[batchKey].length > 1; // Check for duplicate lunch breaks in same batch/time
          return;
        }
        
        let teacherKey = `${entry.faculty}-${entry.day}-${entry.period}`;
        let classroomKey = `${entry.classroom}-${entry.day}-${entry.period}`;
        
        // Check for teacher conflicts (same teacher in multiple places at same time)
        entry.hasTeacherCollision = teacherSlotMap[teacherKey].length > 1;
        
        // Check for classroom conflicts (same classroom used by multiple batches at same time)
        entry.hasClassroomCollision = classroomSlotMap[classroomKey].length > 1;
        entry.hasBatchCollision = false; // Regular subjects don't have batch collisions
      });
      
      return timetable;
    }

    // Genetic algorithm main loop
    let population = Array(POP_SIZE).fill(0).map(randomIndividual);
    for (let gen = 0; gen < GENERATIONS; gen++) {
      population.sort((a, b) => fitness(b) - fitness(a));
      // Elitism: keep top 5
      let newPop = population.slice(0, 5);
      // Fill rest with mutated copies
      while (newPop.length < POP_SIZE) {
        let parent = population[Math.floor(Math.random() * 10)];
        newPop.push(mutate(parent));
      }
      population = newPop;
    }
    let best = population[0];
    console.log('Best timetable fitness:', fitness(best));
    console.log('Generated timetable entries:', best.length);
    console.log('Sample entry:', best[0]);
    
    // Post-process to resolve remaining conflicts
    best = postProcessConflicts(best);
    
    // Detect and mark conflicts in the best timetable
    best = detectConflicts(best);
    
    // Calculate statistics
    const statistics = {
      totalClasses: best.length,
      teacherConflicts: best.filter(t => t.hasTeacherCollision).length,
      classroomConflicts: best.filter(t => t.hasClassroomCollision && !t.hasTeacherCollision).length,
      fallbackClassrooms: best.filter(t => t.fallbackClassroom && !t.hasTeacherCollision && !t.hasClassroomCollision).length,
      uniqueFaculty: new Set(best.map(t => t.faculty)).size,
      classroomsUsed: new Set(best.map(t => t.classroom)).size
    };
    
    // Check if timetable is conflict-free
    const isConflictFree = statistics.teacherConflicts === 0 && statistics.classroomConflicts === 0;
    
    // Build subject ID to name mapping early
    const subjectIdToName = {};
    subjects.forEach(s => { subjectIdToName[s._id.toString()] = s.name; });
    
    // Compute special class placement status per batch
    const specialPlacements = {};
    // Build required tuples from specialClasses for verification
    const requiredByBatch = {};
    for (const sc of specialClasses) {
      const batchKey = sc.batch?.toString();
      if (!batchKey) continue;
      if (!requiredByBatch[batchKey]) requiredByBatch[batchKey] = [];
      if (sc.type === 'lunch_break') {
        const list = (sc.slots && sc.slots.length) ? sc.slots : [];
        list.forEach(slot => {
          requiredByBatch[batchKey].push({ type: 'lunch_break', day: sc.day, period: slot, subject: 'Lunch Break' });
        });
      } else if (sc.type === 'fixed_slot' && sc.subject) {
        const list = (sc.slots && sc.slots.length) ? sc.slots : [];
        const subjName = subjectIdToName[sc.subject.toString()] || 'Subject';
        list.forEach(slot => {
          requiredByBatch[batchKey].push({ type: 'fixed_slot', day: sc.day, period: slot, subject: subjName });
        });
      }
    }
    // Build lookup from best timetable
    const byBatchName = {};
    best.forEach(e => {
      if (!byBatchName[e.batch]) byBatchName[e.batch] = new Set();
      byBatchName[e.batch].add(`${e.day}|${e.period}|${e.subject}`);
    });
    
    // Debug: Log what's actually in the timetable for each batch
    console.log('=== Timetable Debug ===');
    batches.forEach(b => {
      const batchEntries = best.filter(e => e.batch === b.name);
      console.log(`Batch ${b.name} has ${batchEntries.length} entries:`);
      batchEntries.forEach(e => {
        const lunchId = e.lunchBreakId ? ` (ID: ${e.lunchBreakId.substring(0, 20)}...)` : '';
        console.log(`  ${e.day} ${e.period}: ${e.subject} (fixedSlot: ${e.fixedSlot})${lunchId}`);
      });
    });
    batches.forEach(b => {
      const reqs = requiredByBatch[b._id.toString()] || [];
      if (reqs.length === 0) {
        // Do not include batches with no special class requirements
        return;
      }
      const placed = [];
      const missing = [];
      let allPlaced = true;
      reqs.forEach(r => {
        const key = `${r.day}|${r.period}|${r.subject}`;
        const exists = byBatchName[b.name]?.has(key) || false;
        if (exists) {
          placed.push(r);
        } else {
          allPlaced = false;
          missing.push(r);
        }
      });
      specialPlacements[b._id.toString()] = { allPlaced, items: placed, missing, totalRequired: reqs.length };
    });

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
        statistics,
        isConflictFree,
        canSave: isConflictFree,
        specialPlacements
      });
    } else {
      let selectedBatch = batchList && batchList.length > 0 ? batchList[0] : null;
      res.json({
        timetable: best,
        batches,
        selectedBatch,
        statistics,
        isConflictFree,
        canSave: isConflictFree,
        specialPlacements
      });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate timetable' });
  }
};
