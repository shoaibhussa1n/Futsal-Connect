import { useState } from 'react';
import { Mail, Phone, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface LoginSignupProps {
  onLogin: () => void;
}

export default function LoginSignup({ onLogin }: LoginSignupProps) {
  const { signIn, signUp, signInWithPhone } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isLogin) {
        // Login
        if (loginMethod === 'email') {
          if (!email || !password) {
            setError('Please fill in all fields');
            setLoading(false);
            return;
          }
          const { error: signInError } = await signIn(email, password);
          if (signInError) {
            setError(signInError.message || 'Login failed. Please check your credentials.');
          } else {
            setSuccess('Login successful!');
            setTimeout(() => {
              onLogin();
            }, 500);
          }
        } else {
          // Phone login - send OTP
          if (!phone) {
            setError('Please enter your phone number');
            setLoading(false);
            return;
          }
          const { error: phoneError } = await signInWithPhone(phone);
          if (phoneError) {
            setError(phoneError.message || 'Failed to send OTP');
          } else {
            setSuccess('OTP sent to your phone! Check your messages.');
            // TODO: Add OTP verification UI
          }
        }
      } else {
        // Sign Up
        if (loginMethod === 'email') {
          if (!fullName || !email || !password) {
            setError('Please fill in all fields');
            setLoading(false);
            return;
          }
          if (password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
          }
          const { error: signUpError } = await signUp(email, password, fullName);
          if (signUpError) {
            setError(signUpError.message || 'Sign up failed. Please try again.');
          } else {
            setSuccess('Account created! Please check your email to verify your account.');
            // Auto login after signup
            setTimeout(async () => {
              const { error: signInError } = await signIn(email, password);
              if (!signInError) {
                onLogin();
              }
            }, 1000);
          }
        } else {
          // Phone signup
          if (!fullName || !phone) {
            setError('Please fill in all fields');
            setLoading(false);
            return;
          }
          // For phone signup, we'll use OTP
          const { error: phoneError } = await signInWithPhone(phone);
          if (phoneError) {
            setError(phoneError.message || 'Failed to send OTP');
          } else {
            setSuccess('OTP sent to your phone! Check your messages.');
            // TODO: Add OTP verification and profile creation
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setError(error.message);
      } else {
        setSuccess('Password reset email sent! Check your inbox.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col px-6 py-12">
      {/* Logo */}
      <div className="text-center mb-12 mt-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#00FF57] to-[#00cc44] flex items-center justify-center shadow-[0_0_40px_rgba(0,255,87,0.4)]">
          <span className="text-4xl">⚽</span>
        </div>
        <h1 className="text-2xl tracking-wider text-white mb-1">
          FUTSAL HUB
        </h1>
        <p className="text-[#00FF57] tracking-widest">KARACHI</p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-[#00FF57]/20 border border-[#00FF57]/50 rounded-xl text-[#00FF57] text-sm">
          {success}
        </div>
      )}

      {/* Toggle Login/Signup */}
      <div className="flex gap-2 mb-8 bg-zinc-900 p-1 rounded-xl">
        <button
          onClick={() => {
            setIsLogin(true);
            setError(null);
            setSuccess(null);
          }}
          className={`flex-1 py-3 rounded-lg transition-all ${
            isLogin
              ? 'bg-[#00FF57] text-black'
              : 'text-zinc-400'
          }`}
        >
          Login
        </button>
        <button
          onClick={() => {
            setIsLogin(false);
            setError(null);
            setSuccess(null);
          }}
          className={`flex-1 py-3 rounded-lg transition-all ${
            !isLogin
              ? 'bg-[#00FF57] text-black'
              : 'text-zinc-400'
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Login Method Selector */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => {
            setLoginMethod('email');
            setError(null);
          }}
          className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
            loginMethod === 'email'
              ? 'border-[#00FF57] bg-[#00FF57]/10 text-[#00FF57]'
              : 'border-zinc-800 text-zinc-500'
          }`}
        >
          <Mail className="w-5 h-5" />
          Email
        </button>
        <button
          onClick={() => {
            setLoginMethod('phone');
            setError(null);
          }}
          className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
            loginMethod === 'phone'
              ? 'border-[#00FF57] bg-[#00FF57]/10 text-[#00FF57]'
              : 'border-zinc-800 text-zinc-500'
          }`}
        >
          <Phone className="w-5 h-5" />
          Phone
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        {!isLogin && (
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your name"
              className="w-full bg-zinc-900 border-2 border-[#00FF57]/30 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:border-[#00FF57] focus:outline-none transition-colors"
              required={!isLogin}
            />
          </div>
        )}

        <div>
          <label className="text-sm text-zinc-400 mb-2 block">
            {loginMethod === 'email' ? 'Email Address' : 'Phone Number'}
          </label>
          <input
            type={loginMethod === 'email' ? 'email' : 'tel'}
            value={loginMethod === 'email' ? email : phone}
            onChange={(e) => {
              if (loginMethod === 'email') {
                setEmail(e.target.value);
              } else {
                setPhone(e.target.value);
              }
            }}
            placeholder={loginMethod === 'email' ? 'your@email.com' : '+92 300 1234567'}
            className="w-full bg-zinc-900 border-2 border-[#00FF57]/30 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:border-[#00FF57] focus:outline-none transition-colors"
            required
          />
        </div>

        {loginMethod === 'email' && (
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-zinc-900 border-2 border-[#00FF57]/30 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:border-[#00FF57] focus:outline-none transition-colors"
              required
              minLength={6}
            />
          </div>
        )}

        {/* Action Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-[#00FF57] to-[#00cc44] text-black py-4 rounded-xl shadow-[0_0_30px_rgba(0,255,87,0.3)] active:scale-95 transition-transform mb-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Please wait...</span>
            </>
          ) : (
            <span>{isLogin ? 'Login' : 'Create Account'}</span>
          )}
        </button>
      </form>

      {/* Forgot Password */}
      {isLogin && loginMethod === 'email' && (
        <button
          onClick={handleForgotPassword}
          disabled={loading || !email}
          className="text-zinc-500 text-sm text-center mt-4 hover:text-[#00FF57] transition-colors disabled:opacity-50"
        >
          Forgot Password?
        </button>
      )}
    </div>
  );
}
