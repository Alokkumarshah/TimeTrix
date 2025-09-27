import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative p-3 rounded-xl bg-white/10 dark:bg-slate-800/50 backdrop-blur-md border border-white/20 dark:border-slate-700/20 hover:bg-white/20 dark:hover:bg-slate-700/50 transition-all duration-300 transform hover:scale-105 hover:shadow-glow group"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Toggle theme"
    >
      <motion.div
        className="relative w-6 h-6"
        initial={false}
        animate={{ rotate: isDark ? 180 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: isDark ? 0 : 1, 
            scale: isDark ? 0 : 1 
          }}
          transition={{ duration: 0.2 }}
        >
          <Sun className="w-5 h-5 text-amber-500" />
        </motion.div>
        
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: isDark ? 1 : 0, 
            scale: isDark ? 1 : 0 
          }}
          transition={{ duration: 0.2 }}
        >
          <Moon className="w-5 h-5 text-blue-400" />
        </motion.div>
      </motion.div>
      
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: isDark 
            ? 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(251, 191, 36, 0.2) 0%, transparent 70%)'
        }}
      />
    </motion.button>
  );
};

export default ThemeToggle;
