import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, BookOpen, Users } from 'lucide-react';

const SpecialClasses = () => {
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
          <p className="text-slate-600 dark:text-slate-300">Manage special classes and fixed time slots</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">Special Classes Management</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            This feature will allow you to manage special classes such as:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
              <Clock className="h-8 w-8 text-blue-600 mb-2" />
              <h4 className="font-medium text-slate-900 dark:text-slate-100">Fixed Time Slots</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 text-center">Schedule classes that must occur at specific times</p>
            </div>
            
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
              <BookOpen className="h-8 w-8 text-green-600 mb-2" />
              <h4 className="font-medium text-slate-900 dark:text-slate-100">Special Events</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 text-center">Manage workshops, seminars, and special sessions</p>
            </div>
            
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
              <Users className="h-8 w-8 text-purple-600 mb-2" />
              <h4 className="font-medium text-slate-900 dark:text-slate-100">Guest Lectures</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 text-center">Schedule guest lectures and external sessions</p>
            </div>
            
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
              <Calendar className="h-8 w-8 text-orange-600 mb-2" />
              <h4 className="font-medium text-slate-900 dark:text-slate-100">Make-up Classes</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 text-center">Schedule make-up classes for missed sessions</p>
            </div>
          </div>
          
          <div className="mt-8">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              This feature is coming soon and will be integrated with the timetable generation system.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SpecialClasses;
