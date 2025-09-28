import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import { Eye, EyeOff, UserPlus, User, Lock, Mail, UserCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import CosmicBackground from '../components/CosmicBackground';
import LoadingSpinner from '../components/LoadingSpinner';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'scheduler',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await register(formData);
    if (result.success) navigate('/dashboard');
    else setError(result.error);
    setLoading(false);
  };

  const cardBg = isDark ? 'bg-gray-900' : 'bg-white';
  const pageBg = isDark ? 'bg-gray-800' : 'bg-cosmic-light-50';
  const textPrimary = isDark ? 'text-gray-200' : 'text-gray-800';
  const inputBg = isDark ? 'bg-gray-700' : 'bg-white';
  const inputBorder = isDark ? 'border-gray-600' : 'border-gray-300';
  const placeholder = isDark ? 'placeholder-gray-400' : 'placeholder-gray-500';
  const iconColor = isDark ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`${pageBg} min-h-screen flex items-center justify-center p-4 relative overflow-hidden`}>
      {/* Cosmic Background */}
      <CosmicBackground type="stars" />
      <CosmicBackground type="light-spot" followMouse />

      {/* Theme toggle */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <Tilt
        glareEnable={true}
        glareMaxOpacity={0.1}
        glareColor="rgba(236, 72, 153, 0.3)"
        glarePosition="all"
        scale={1.01}
        tiltMaxAngleX={3}
        tiltMaxAngleY={3}
        transitionSpeed={2000}
        className="w-full max-w-md relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`w-full p-8 rounded-3xl relative z-10 ${cardBg} backdrop-blur-xl border-2 border-pink-500/20 dark:border-pink-400/20 shadow-lg hover:shadow-xl transition-all duration-500 hover:shadow-pink-500/30 dark:hover:shadow-pink-400/30 hover:border-pink-500/60 dark:hover:border-pink-400/60 hover:border-4 hover:scale-[1.02] group border-glow-hover pink`}
        >
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className={`mx-auto h-20 w-20 ${isDark ? 'bg-blue-700' : 'bg-blue-600'} rounded-3xl flex items-center justify-center`}
          >
            <Sparkles className="h-10 w-10 text-white" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`mt-4 text-3xl font-bold ${textPrimary}`}
          >
            Create Account
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className={`text-sm ${textPrimary}`}
          >
            Join TimeTrix to manage your institution
          </motion.p>
        </div>

        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* Full Name */}
          <div>
            <label htmlFor="name" className={`block text-sm font-medium mb-1 ${textPrimary}`}>
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className={`h-5 w-5 ${iconColor}`} />
              </div>
              <input
                id="name"
                name="name"
                type="text"
                required
                className={`w-full pl-10 pr-3 py-2 border rounded-lg ${inputBg} ${inputBorder} focus:outline-none focus:ring-2 focus:ring-blue-500 ${placeholder} ${textPrimary}`}
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className={`block text-sm font-medium mb-1 ${textPrimary}`}>
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserCheck className={`h-5 w-5 ${iconColor}`} />
              </div>
              <input
                id="username"
                name="username"
                type="text"
                required
                className={`w-full pl-10 pr-3 py-2 border rounded-lg ${inputBg} ${inputBorder} focus:outline-none focus:ring-2 focus:ring-blue-500 ${placeholder} ${textPrimary}`}
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className={`block text-sm font-medium mb-1 ${textPrimary}`}>
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className={`h-5 w-5 ${iconColor}`} />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                className={`w-full pl-10 pr-3 py-2 border rounded-lg ${inputBg} ${inputBorder} focus:outline-none focus:ring-2 focus:ring-blue-500 ${placeholder} ${textPrimary}`}
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className={`block text-sm font-medium mb-1 ${textPrimary}`}>
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className={`h-5 w-5 ${iconColor}`} />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className={`w-full pl-10 pr-10 py-2 border rounded-lg ${inputBg} ${inputBorder} focus:outline-none focus:ring-2 focus:ring-blue-500 ${placeholder} ${textPrimary}`}
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? <EyeOff className={`h-5 w-5 ${iconColor}`} /> : <Eye className={`h-5 w-5 ${iconColor}`} />}
              </button>
            </div>
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className={`block text-sm font-medium mb-1 ${textPrimary}`}>
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={`w-full py-2 pl-3 border rounded-lg ${inputBg} ${inputBorder} focus:outline-none focus:ring-2 focus:ring-blue-500 ${textPrimary}`}
            >
              <option value="scheduler">Scheduler</option>
              <option value="admin">Admin</option>
              <option value="reviewer">Reviewer</option>
            </select>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg"
            >
              {error}
            </motion.div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold transition"
          >
            {loading ? <LoadingSpinner size="small" /> : <><UserPlus className="inline-block mr-2" />Create Account</>}
          </button>

          <p className={`text-center text-sm mt-4 ${textPrimary}`}>
            Already have an account?{' '}
            <Link to="/login" className="text-blue-500 hover:underline">
              Sign in here
            </Link>
          </p>
        </motion.form>
        </motion.div>
      </Tilt>
    </div>
  );
};

export default Register;
