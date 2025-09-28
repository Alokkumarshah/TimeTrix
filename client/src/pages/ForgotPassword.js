import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { authAPI } from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      const res = await authAPI.forgotPassword(email);
      setMessage(res.data?.message || 'If that email exists, a reset link has been created.');
      setStatus('success');
    } catch (e) {
      setMessage('Failed to process request');
      setStatus('error');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold mb-4">Forgot Password</motion.h1>
      <form onSubmit={submit} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-slate-400" />
            </div>
            <input type="email" className="input-field pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
        </div>
        <button type="submit" disabled={status==='loading'} className="btn-primary w-full">{status==='loading' ? 'Sending...' : 'Send reset link'}</button>
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
        
        {status === 'success' && (
          <div className="text-sm text-slate-600 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p><strong>Next steps:</strong></p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Check your email inbox (and spam folder)</li>
              <li>Click the reset link in the email</li>
              <li>Enter your new password</li>
              <li>Login with your new password</li>
            </ul>
          </div>
        )}
        
        <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
          <p><strong>Setup required:</strong> To receive emails, configure EMAIL_USER and EMAIL_PASS in your server/.env file.</p>
          <p>For Gmail: Use an App Password instead of your regular password.</p>
          <p>If email fails, the reset token will be shown in the response for testing.</p>
        </div>
      </form>
    </div>
  );
};

export default ForgotPassword;


