
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound } from 'lucide-react';
import { authAPI } from '../services/api';


const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [tokenValid, setTokenValid] = useState(null); // null=loading, true=valid, false=invalid
  const navigate = useNavigate();

  // Validate token with backend on mount
  useEffect(() => {
    console.log('=== RESET PASSWORD PAGE LOADED ===');
    console.log('🔍 Current URL:', window.location.href);
    console.log('🔍 Search params:', Object.fromEntries(searchParams.entries()));
    
    const urlToken = searchParams.get('token');
    console.log('🔑 Token from URL:', urlToken);
    
    if (urlToken) {
      setToken(urlToken);
      // Validate token by calling a backend endpoint
      setTokenValid(null);
      setMessage('Validating reset link...');
      console.log('📧 Validating token with backend...');
      
      authAPI
        .validateResetToken(urlToken)
        .then((response) => {
          console.log('✅ Token validation successful:', response.data);
          setTokenValid(true);
          setMessage('Reset link is valid. Please enter your new password.');
        })
        .catch((error) => {
          console.log('❌ Token validation failed:', error.response?.data || error.message);
          setTokenValid(false);
          const errorMessage = error.response?.data?.error || 'Invalid or expired reset link.';
          setMessage(`${errorMessage} Please request a new one.`);
        });
    } else {
      console.log('❌ No token found in URL');
      setTokenValid(false);
      setMessage('No reset token found in the link. Please check your email and click the reset link again.');
    }
  }, [searchParams]);


  const submit = async (e) => {
    e.preventDefault();
    console.log('=== PASSWORD RESET SUBMISSION ===');
    console.log('🔑 Token:', token);
    console.log('🔒 Password length:', password.length);
    console.log('🔒 Confirm password length:', confirm.length);
    
    // Validate passwords
    if (!password || password.length < 6) {
      console.log('❌ Password too short');
      setMessage('Password must be at least 6 characters long');
      setStatus('error');
      return;
    }
    
    if (password !== confirm) {
      console.log('❌ Passwords do not match');
      setMessage('Passwords do not match');
      setStatus('error');
      return;
    }
    
    if (!token) {
      console.log('❌ No token available');
      setMessage('No reset token available. Please request a new reset link.');
      setStatus('error');
      return;
    }
    
    setStatus('loading');
    setMessage('Resetting your password...');
    console.log('📧 Calling reset password API...');
    
    try {
      const res = await authAPI.resetPassword(token, password);
      console.log('✅ Password reset successful:', res.data);
      setMessage(res.data?.message || 'Password reset successful! Redirecting to login...');
      setStatus('success');
      setTimeout(() => {
        console.log('🔄 Redirecting to login page...');
        navigate('/login');
      }, 2000);
    } catch (e) {
      console.log('❌ Password reset failed:', e.response?.data || e.message);
      const errorMessage = e.response?.data?.error || 'Failed to reset password. Please try again.';
      setMessage(errorMessage);
      setStatus('error');
    }
  };


  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Validating reset link...</p>
        </div>
      </div>
    );
  }
  
  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center py-10">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Invalid Reset Link</h2>
            <p className="text-red-600 dark:text-red-400 mb-4">{message}</p>
            <a href="/forgot-password" className="btn-primary">Request New Reset Link</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full"
      >
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-2xl font-bold mb-6 text-center text-slate-900 dark:text-slate-100"
          >
            Reset Your Password
          </motion.h1>
          
          <form onSubmit={submit} className="space-y-6">
            {/* Only show token input if no token from URL */}
            {!searchParams.get('token') && (
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Reset Token</label>
                <input 
                  type="text" 
                  className="input-field w-full" 
                  value={token} 
                  onChange={(e) => setToken(e.target.value)} 
                  required 
                  placeholder="Paste your reset token" 
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="password" 
                  className="input-field pl-10 w-full" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  placeholder="Enter new password" 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Confirm Password</label>
              <input 
                type="password" 
                className="input-field w-full" 
                value={confirm} 
                onChange={(e) => setConfirm(e.target.value)} 
                required 
                placeholder="Confirm new password" 
              />
            </div>
            
            <motion.button 
              type="submit" 
              disabled={status==='loading'} 
              className="btn-primary w-full"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {status==='loading' ? 'Resetting...' : 'Reset Password'}
            </motion.button>
            
            {message && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-sm p-3 rounded-lg ${
                  status==='error' 
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800' 
                    : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800'
                }`}
              >
                {message}
              </motion.div>
            )}
          </form>
          
          <div className="mt-6 text-center">
            <a href="/login" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
              Back to Login
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;


