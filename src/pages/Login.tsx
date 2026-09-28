import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, ArrowRight, Sparkles, KeyRound } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@yashedu.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Validate password for admin credentials
      if (email.toLowerCase() === 'admin@yashedu.com' && password === 'admin123') {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {

          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            role: 'admin',
            fullName: 'System Administrator'
          })
        }).catch(() => null);

        let token = 'admin-session-token';
        let userObj = { email, role: 'admin', fullName: 'Administrator' };

        if (response && response.ok) {
          const data = await response.json();
          if (data.token) token = data.token;
          if (data.user) userObj = data.user;
        }

        localStorage.setItem('adminToken', token);
        localStorage.setItem('isAdminLoggedIn', 'true');
        localStorage.setItem('adminUser', JSON.stringify(userObj));
        navigate('/');
      } else {
        setError('Invalid administrator email or password.');
      }
    } catch (err) {
      setError('An error occurred during admin authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setEmail('admin@yashedu.com');
    setPassword('admin123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-red-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 -right-20 w-96 h-96 bg-rose-600/15 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-xl shadow-red-900/40 mb-4 border border-red-500/30">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Yash<span className="text-red-500">Edu</span> <span className="text-xs uppercase font-extrabold px-2 py-1 rounded bg-red-500/20 border border-red-500/30 text-red-400">Admin</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">Management Portal & Content Control System</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-2xl shadow-black/80 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-bold text-white">Administrator Login</h2>
            </div>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Protected
            </span>
          </div>

          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@yashedu.com"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-12 py-3 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-red-900/30 hover:shadow-red-600/40 flex items-center justify-center gap-2 group disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span>Verifying Credentials...</span>
              ) : (
                <>
                  <span>Sign In to Admin Portal</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Option */}
          <div className="pt-2 border-t border-gray-800 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Default Credentials</span>
            <button
              type="button"
              onClick={handleQuickFill}
              className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1 hover:underline"
            >
              <Sparkles className="w-3.5 h-3.5" /> Fill Demo Admin
            </button>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-gray-600 mt-8">
          © {new Date().getFullYear()} YashEdu Academy Admin System. All rights reserved.
        </p>
      </div>
    </div>
  );
};
