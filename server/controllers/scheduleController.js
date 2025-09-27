
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

    // Genetic algorithm parameters
    const POP_SIZE = 30;
    const GENERATIONS = 50;
    const MUTATION_RATE = 0.2;

    // Individual: timetable for all batches
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
            
            let availableClassrooms = classrooms.filter(c => {
              let key = `${slot.day}-${p}-${c._id}`;
              return !usedClassrooms[key];
            });
            
            // If there's a classroom constraint for this slot, prioritize that classroom
            let classroom;
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
                  classroom = availableClassrooms.length > 0 ? availableClassrooms[Math.floor(Math.random() * availableClassrooms.length)] : classrooms[0];
                }
              } else {
                classroom = availableClassrooms.length > 0 ? availableClassrooms[Math.floor(Math.random() * availableClassrooms.length)] : classrooms[0];
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
      return timetable;
    }

    // Fitness: penalize clashes, over maxPerDay, under requiredPerWeek
    function fitness(timetable) {
      let score = 0;
      let batchDaySubjectCount = {};
      let batchSubjectWeekCount = {};
      let slotMap = {};
      let classroomSlotMap = {};
      let classroomConstraintViolations = 0;
      let subjectConstraintViolations = 0;
      
      timetable.forEach(entry => {
        let key = `${entry.batch}-${entry.day}-${entry.period}`;
        if (slotMap[key]) score -= 5; // clash in same batch, day, period
        slotMap[key] = true;
        // Classroom clash check
        let classKey = `${entry.day}-${entry.period}-${entry.classroom}`;
        if (classroomSlotMap[classKey]) score -= 10; // classroom used by multiple batches at same time
        classroomSlotMap[classKey] = true;
        
        // Check subject constraint violations
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
      
      // Penalize subject constraint violations heavily
      score -= subjectConstraintViolations * 100;
      // Penalize classroom constraint violations heavily
      score -= classroomConstraintViolations * 50;
      // Penalize over maxPerDay and under/over requiredPerWeek (higher penalty)
      Object.keys(batchDaySubjectCount).forEach(k => {
        let [batch, subject, day] = k.split('-');
        let subj = subjects.find(s => s.name === subject);
        if (subj) {
          let maxPerDay = subjectConstraints[subj._id.toString()].maxPerDay;
          if (batchDaySubjectCount[k] > maxPerDay) score -= (batchDaySubjectCount[k] - maxPerDay) * 10;
        }
      });
      Object.keys(batchSubjectWeekCount).forEach(k => {
        let [batch, subject] = k.split('-');
        let subj = subjects.find(s => s.name === subject);
        if (subj) {
          let requiredPerWeek = subjectConstraints[subj._id.toString()].requiredPerWeek;
          if (batchSubjectWeekCount[k] < requiredPerWeek) score -= (requiredPerWeek - batchSubjectWeekCount[k]) * 20;
          if (batchSubjectWeekCount[k] > requiredPerWeek) score -= (batchSubjectWeekCount[k] - requiredPerWeek) * 10;
        }
      });
      return score;
    }

    // Mutation: randomly swap days/periods
    function mutate(timetable) {
      let newTT = JSON.parse(JSON.stringify(timetable));
      for (let i = 0; i < newTT.length; i++) {
        if (Math.random() < MUTATION_RATE) {
          newTT[i].day = days[Math.floor(Math.random() * days.length)];
          newTT[i].period = periods[Math.floor(Math.random() * periods.length)];
        }
      }
      return newTT;
    }

    // Crossover: not used (single batch, single timetable)

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
