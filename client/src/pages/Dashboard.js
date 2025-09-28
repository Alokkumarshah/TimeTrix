import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  Building, 
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  Sparkles,
  Zap,
  Target,
  Rocket
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { batchAPI, facultyAPI, subjectAPI, classroomAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const { scrollY } = useScrollAnimation();
  const [stats, setStats] = useState({
    batches: 0,
    faculty: 0,
    subjects: 0,
    classrooms: 0,
  });
  const [loading, setLoading] = useState(true);
  
  // Mouse tracking for rotation effects
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const cardRef = useRef(null);
  
  // Transform mouse position to rotation values
  const rotateX = useTransform(mouseY, [-300, 300], [15, -15]);
  const rotateY = useTransform(mouseX, [-300, 300], [-15, 15]);
  
  // Additional transforms for individual elements
  const iconRotateX = useTransform(mouseY, [-300, 300], [10, -10]);
  const iconRotateY = useTransform(mouseX, [-300, 300], [-10, 10]);
  const statusRotateX = useTransform(mouseY, [-300, 300], [5, -5]);
  const statusRotateY = useTransform(mouseX, [-300, 300], [-5, 5]);

  useEffect(() => {
    fetchStats();
  }, []);

  // Mouse event handler for rotation effects
  const handleMouseMove = (event) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      mouseX.set(event.clientX - centerX);
      mouseY.set(event.clientY - centerY);
    }
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const fetchStats = async () => {
    try {
      const [batchesRes, facultyRes, subjectsRes, classroomsRes] = await Promise.all([
        batchAPI.getAll(),
        facultyAPI.getAll(),
        subjectAPI.getAll(),
        classroomAPI.getAll(),
      ]);

      setStats({
        batches: batchesRes.data?.length || 0,
        faculty: facultyRes.data?.length || 0,
        subjects: subjectsRes.data?.length || 0,
        classrooms: classroomsRes.data?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Batches',
      value: stats.batches,
      icon: GraduationCap,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
      neonColor: 'text-neon-blue',
    },
    {
      title: 'Faculty Members',
      value: stats.faculty,
      icon: Users,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
      textColor: 'text-green-600 dark:text-green-400',
      neonColor: 'text-neon-green',
    },
    {
      title: 'Subjects',
      value: stats.subjects,
      icon: BookOpen,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
      textColor: 'text-purple-600 dark:text-purple-400',
      neonColor: 'text-neon-purple',
    },
    {
      title: 'Classrooms',
      value: stats.classrooms,
      icon: Building,
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20',
      textColor: 'text-orange-600 dark:text-orange-400',
      neonColor: 'text-neon-pink',
    },
  ];

  const quickActions = [
    {
      title: 'Generate Timetable',
      description: 'Create optimized schedules for all batches',
      icon: Rocket,
      href: '/timetable',
      gradient: 'from-primary-500 to-primary-600',
      hoverGradient: 'from-primary-600 to-primary-700',
    },
    {
      title: 'Manage Batches',
      description: 'Add or edit batch information',
      icon: GraduationCap,
      href: '/batches',
      gradient: 'from-blue-500 to-blue-600',
      hoverGradient: 'from-blue-600 to-blue-700',
    },
    {
      title: 'Faculty Management',
      description: 'Manage faculty members and assignments',
      icon: Users,
      href: '/faculty',
      gradient: 'from-green-500 to-green-600',
      hoverGradient: 'from-green-600 to-green-700',
    },
    {
      title: 'Set Constraints',
      description: 'Configure scheduling constraints',
      icon: Target,
      href: '/constraints',
      gradient: 'from-purple-500 to-purple-600',
      hoverGradient: 'from-purple-600 to-purple-700',
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <LoadingSpinner size="large" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section - CodeHelp Inspired */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden"
      >
        <motion.div 
          ref={cardRef}
          className="hero-card cursor-pointer"
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d"
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-codehelp-blue/20 via-codehelp-purple/20 to-codehelp-pink/20" />
          
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex items-center space-x-4 mb-6"
            >
              <motion.div
                style={{
                  rotateX: iconRotateX,
                  rotateY: iconRotateY
                }}
                className="p-3 bg-codehelp-gradient rounded-2xl"
              >
                <Sparkles className="h-8 w-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-5xl font-bold font-display text-white mb-2">
                  Welcome back, {user?.name || 'User'}!
                </h1>
                <div className="h-1 w-24 bg-codehelp-gradient rounded-full" />
              </div>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl text-white/90 mb-8 max-w-2xl"
            >
              Transform your educational institution with our AI-powered class scheduling system. 
              Create optimized timetables that maximize efficiency and minimize conflicts.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap items-center gap-4"
            >
              <motion.div 
                className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2"
                style={{
                  rotateX: statusRotateX,
                  rotateY: statusRotateY
                }}
                whileHover={{ scale: 1.05 }}
              >
                <Clock className="h-5 w-5 text-codehelp-blue" />
                <span className="text-sm font-medium text-white">
                  Last updated: {new Date().toLocaleDateString()}
                </span>
              </motion.div>
              <motion.div 
                className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2"
                style={{
                  rotateX: statusRotateX,
                  rotateY: statusRotateY
                }}
                whileHover={{ scale: 1.05 }}
              >
                <Zap className="h-5 w-5 text-codehelp-orange" />
                <span className="text-sm font-medium text-white">System Ready</span>
              </motion.div>
              <motion.div 
                className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2"
                style={{
                  rotateX: statusRotateX,
                  rotateY: statusRotateY
                }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-2 h-2 bg-codehelp-green rounded-full animate-pulse" />
                <span className="text-sm font-medium text-white">Live Status</span>
              </motion.div>
            </motion.div>
          </div>
          
          {/* Floating elements */}
          <motion.div
            className="absolute top-10 right-10 w-20 h-20 bg-codehelp-blue/20 rounded-full blur-xl"
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-10 left-10 w-16 h-16 bg-codehelp-purple/20 rounded-full blur-xl"
            animate={{
              y: [0, 15, 0],
              x: [0, -10, 0],
              scale: [1, 0.9, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      </motion.div>

      {/* Stats Grid - CodeHelp Style */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -8 }}
              className="codehelp-stats-card hover-lift mouse-shadow group relative overflow-hidden"
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-50 group-hover:opacity-70 transition-opacity duration-300`} />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <motion.div
                    className={`p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-codehelp`}
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icon className={`h-6 w-6 ${stat.textColor}`} />
                  </motion.div>
                  <motion.div
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="h-4 w-4 text-codehelp-blue" />
                  </motion.div>
                </div>
                
                <div>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">{stat.title}</p>
                  <motion.p
                    className="text-4xl font-bold text-slate-900 dark:text-slate-100"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1, type: "spring", stiffness: 200 }}
                  >
                    {stat.value}
                  </motion.p>
                </div>
                
                {/* Progress bar */}
                <div className="mt-4 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <motion.div
                    className={`h-2 rounded-full bg-gradient-to-r ${stat.gradient}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (stat.value / 50) * 100)}%` }}
                    transition={{ delay: 0.8 + index * 0.1, duration: 1 }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Quick Actions - CodeHelp Style */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.a
              key={action.title}
              href={action.href}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -8 }}
              whileTap={{ scale: 0.95 }}
              className="codehelp-feature-card hover-lift mouse-shadow group cursor-pointer relative overflow-hidden"
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-shimmer" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <motion.div
                    className={`p-4 rounded-2xl bg-gradient-to-r ${action.gradient} shadow-codehelp`}
                    whileHover={{ rotate: 15, scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </motion.div>
                  <motion.div
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="h-4 w-4 text-codehelp-blue" />
                  </motion.div>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-codehelp-blue transition-colors duration-300 mb-2">
                    {action.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors duration-300">
                    {action.description}
                  </p>
                </div>
                
                {/* Animated progress indicator */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-codehelp-green rounded-full animate-pulse" />
                    <span className="text-xs text-slate-500 dark:text-slate-400">Ready</span>
                  </div>
                  <motion.div
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <div className="w-1 h-1 bg-codehelp-blue rounded-full" />
                  </motion.div>
                </div>
              </div>
            </motion.a>
          );
        })}
      </motion.div>

      {/* Room Conflicts Alert - CodeHelp Style */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="codehelp-feature-card hover-lift mouse-shadow border-l-4 border-yellow-400"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <motion.div
              className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Building className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-display">
                Room Conflict Alert
              </h2>
              <div className="h-1 w-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full mt-1" />
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-full px-4 py-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">Active</span>
          </div>
        </div>
        
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center space-x-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl border border-yellow-200 dark:border-yellow-700 hover-lift"
          >
            <motion.div
              className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl shadow-lg"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <Building className="h-6 w-6 text-white" />
            </motion.div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Room Conflicts Detected</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Multiple batches assigned to same classroom at same time</p>
            </div>
            <motion.a
              href="/timetable"
              className="text-xs text-yellow-700 dark:text-yellow-300 font-semibold bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded-full hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors duration-200"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              whileHover={{ scale: 1.05 }}
            >
              Check Timetable
            </motion.a>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="flex items-center space-x-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-2xl border border-red-200 dark:border-red-700 hover-lift"
          >
            <motion.div
              className="p-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl shadow-lg"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <Users className="h-6 w-6 text-white" />
            </motion.div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Teacher Conflicts Detected</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Same teacher assigned to multiple classes simultaneously</p>
            </div>
            <motion.a
              href="/timetable"
              className="text-xs text-red-700 dark:text-red-300 font-semibold bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-full hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors duration-200"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              whileHover={{ scale: 1.05 }}
            >
              Check Timetable
            </motion.a>
          </motion.div>
        </div>
      </motion.div>

      {/* Recent Activity - CodeHelp Style */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="codehelp-feature-card hover-lift mouse-shadow"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <motion.div
              className="p-2 bg-codehelp-gradient rounded-xl"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <TrendingUp className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-display">
                Recent Activity
              </h2>
              <div className="h-1 w-16 bg-codehelp-gradient rounded-full mt-1" />
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-codehelp-green/10 dark:bg-codehelp-green/20 rounded-full px-4 py-2">
            <div className="w-2 h-2 bg-codehelp-green rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-codehelp-green">Live</span>
          </div>
        </div>
        
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="flex items-center space-x-4 p-4 bg-gradient-to-r from-codehelp-green/5 to-emerald-50 dark:from-codehelp-green/10 dark:to-emerald-900/20 rounded-2xl border border-codehelp-green/20 dark:border-codehelp-green/30 hover-lift"
          >
            <motion.div
              className="p-3 bg-gradient-to-r from-codehelp-green to-emerald-500 rounded-2xl shadow-codehelp"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <CheckCircle className="h-6 w-6 text-white" />
            </motion.div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">System initialized</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">All modules are ready for use</p>
            </div>
            <motion.div
              className="text-xs text-codehelp-green font-semibold bg-codehelp-green/10 dark:bg-codehelp-green/20 px-2 py-1 rounded-full"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Just now
            </motion.div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="flex items-center space-x-4 p-4 bg-gradient-to-r from-codehelp-blue/5 to-cyan-50 dark:from-codehelp-blue/10 dark:to-cyan-900/20 rounded-2xl border border-codehelp-blue/20 dark:border-codehelp-blue/30 hover-lift"
          >
            <motion.div
              className="p-3 bg-gradient-to-r from-codehelp-blue to-cyan-500 rounded-2xl shadow-codehelp"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <Calendar className="h-6 w-6 text-white" />
            </motion.div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Ready to generate timetables</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Configure your data and start scheduling</p>
            </div>
            <motion.div
              className="text-xs text-codehelp-blue font-semibold bg-codehelp-blue/10 dark:bg-codehelp-blue/20 px-2 py-1 rounded-full"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              2 min ago
            </motion.div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
            className="flex items-center space-x-4 p-4 bg-gradient-to-r from-codehelp-purple/5 to-purple-50 dark:from-codehelp-purple/10 dark:to-purple-900/20 rounded-2xl border border-codehelp-purple/20 dark:border-codehelp-purple/30 hover-lift"
          >
            <motion.div
              className="p-3 bg-gradient-to-r from-codehelp-purple to-purple-500 rounded-2xl shadow-codehelp"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <Rocket className="h-6 w-6 text-white" />
            </motion.div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">AI Optimization Active</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Smart algorithms are analyzing your data</p>
            </div>
            <motion.div
              className="text-xs text-codehelp-purple font-semibold bg-codehelp-purple/10 dark:bg-codehelp-purple/20 px-2 py-1 rounded-full"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              5 min ago
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
