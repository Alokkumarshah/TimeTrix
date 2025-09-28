import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Users, 
  BookOpen, 
  GraduationCap, 
  Building, 
  Settings, 
  Calendar,
  LogOut,
  Menu,
  X,
  User,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMousePosition } from '../hooks/useScrollAnimation';
import ThemeToggle from './ThemeToggle';
import CosmicBackground from './CosmicBackground';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { x: mouseX, y: mouseY } = useMousePosition();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, color: 'text-blue-500' },
    { name: 'Batches', href: '/batches', icon: GraduationCap, color: 'text-purple-500' },
    { name: 'Faculty', href: '/faculty', icon: Users, color: 'text-green-500' },
    { name: 'Subjects', href: '/subjects', icon: BookOpen, color: 'text-orange-500' },
    { name: 'Classrooms', href: '/classrooms', icon: Building, color: 'text-red-500' },
    { name: 'Constraints', href: '/constraints', icon: Settings, color: 'text-indigo-500' },
    { name: 'Special Classes', href: '/special-classes', icon: Calendar, color: 'text-pink-500' },
    { name: 'Timetable', href: '/timetable', icon: Calendar, color: 'text-cyan-500' },
    { name: 'Saved Timetables', href: '/saved-timetables', icon: Calendar, color: 'text-emerald-500' },
  ];

  const handleLogout = async () => {
    await logout();
  };

  const isActive = (path) => location.pathname === path;

  // Mouse shadow effect
  useEffect(() => {
    const updateMouseShadow = () => {
      const elements = document.querySelectorAll('.mouse-shadow');
      elements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const elementCenterX = rect.left + rect.width / 2;
        const elementCenterY = rect.top + rect.height / 2;
        
        const distance = Math.sqrt(
          Math.pow(mouseX - elementCenterX, 2) + Math.pow(mouseY - elementCenterY, 2)
        );
        
        const maxDistance = 200;
        const intensity = Math.max(0, 1 - distance / maxDistance);
        
        if (intensity > 0.1) {
          element.style.boxShadow = `0 0 ${intensity * 30}px rgba(59, 130, 246, ${intensity * 0.4}), 0 0 ${intensity * 60}px rgba(59, 130, 246, ${intensity * 0.2})`;
        } else {
          element.style.boxShadow = '';
        }
      });
    };

    updateMouseShadow();
  }, [mouseX, mouseY]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-500">
      {/* Cosmic Background */}
      <CosmicBackground type="stars" />
      <CosmicBackground type="light-spot" followMouse={true} />
      
      {/* Cosmic Neon Decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full blur-xl"
          animate={{
            scale: [1, 0.8, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-32 left-1/3 w-40 h-40 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-full blur-2xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="relative flex-1 flex flex-col max-w-xs w-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-r border-white/20 dark:border-slate-700/20"
            >
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white bg-white/10 backdrop-blur-sm"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <div className="flex-shrink-0 flex items-center px-4">
                  <Link to="/" className="block">
                    <motion.div
                      className="flex items-center space-x-3 cursor-pointer hover:scale-105 transition-transform duration-300"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.div
                        className="p-2 bg-codehelp-gradient rounded-xl"
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="h-5 w-5 text-white" />
                      </motion.div>
                      <div>
                        <h1 className="text-xl font-bold gradient-text-codehelp font-display">TimeTrix</h1>
                        <div className="h-0.5 w-12 bg-codehelp-gradient rounded-full" />
                      </div>
                    </motion.div>
                  </Link>
                </div>
                <nav className="mt-5 px-2 space-y-1">
                  {navigation.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                      >
                        <Link
                          to={item.href}
                          className={`${
                            isActive(item.href)
                              ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-white/10 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
                          } group flex items-center px-3 py-3 text-base font-medium rounded-xl transition-all duration-300 transform hover:scale-105`}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <Icon className={`mr-4 h-6 w-6 ${isActive(item.href) ? 'text-white' : item.color}`} />
                          {item.name}
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>
              </div>
              <div className="flex-shrink-0 flex border-t border-white/20 dark:border-slate-700/20 p-4">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-base font-medium text-slate-700 dark:text-slate-200">{user?.name || 'User'}</p>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{user?.role || 'Scheduler'}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white/10 dark:hover:bg-slate-800/50 transition-all duration-300 transform hover:scale-105"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.div 
        className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex-1 flex flex-col min-h-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-r border-white/20 dark:border-slate-700/20">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <motion.div 
              className="flex items-center flex-shrink-0 px-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Link to="/" className="block">
                <motion.div 
                  className="flex items-center space-x-3 cursor-pointer hover:scale-105 transition-transform duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="p-2 bg-codehelp-gradient rounded-xl"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="h-5 w-5 text-white" />
                  </motion.div>
                  <div>
                    <h1 className="text-xl font-bold gradient-text-codehelp font-display">TimeTrix</h1>
                    <div className="h-0.5 w-12 bg-codehelp-gradient rounded-full" />
                  </div>
                </motion.div>
              </Link>
            </motion.div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigation.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    <Link
                      to={item.href}
                      className={`${
                        isActive(item.href)
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-white/10 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
                      } group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-300 transform hover:scale-105`}
                    >
                      <Icon className={`mr-3 h-5 w-5 ${isActive(item.href) ? 'text-white' : item.color}`} />
                      {item.name}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-white/20 dark:border-slate-700/20 p-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{user?.name || 'User'}</p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{user?.role || 'Scheduler'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <ThemeToggle />
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white/10 dark:hover:bg-slate-800/50 transition-all duration-300 transform hover:scale-105"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Enhanced Top bar with better styling */}
        <motion.div 
          className="sticky top-0 z-10 lg:hidden px-4 py-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-lg"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 bg-white/10 dark:bg-slate-800/50 backdrop-blur-sm transition-all duration-300 transform hover:scale-105"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <ThemeToggle />
          </div>
        </motion.div>

        {/* Enhanced Page content with better spacing */}
        <main className="flex-1">
          <div className="py-8 lg:py-12">
            <div className="max-w-8xl mx-auto px-6 sm:px-8 lg:px-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="codehelp-hover-box double-glow bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/30 p-8 lg:p-12"
                style={{
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                }}
              >
                {children}
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
