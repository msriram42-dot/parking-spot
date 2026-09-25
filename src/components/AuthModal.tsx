import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User as UserIcon, Car, Shield, Building2, Phone, KeyRound, AlertCircle, CheckCircle2, ArrowRight, RefreshCw, Key, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { VehicleType, UserRole } from '../types/index.ts';
import { api } from '../services/api.ts';

export type AuthMode = 'login' | 'register' | 'forgot' | 'admin';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
  onLoginSuccess?: (role: UserRole) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onLoginSuccess
}) => {
  const { login, register, adminLogin } = useAuth();
  const [activeTab, setActiveTab] = useState<AuthMode>(initialMode);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'commuter' | 'owner'>('commuter');
  const [phone, setPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('car');
  const [adminKey, setAdminKey] = useState('');

  // Password Recovery Fields
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetStep, setResetStep] = useState<'request' | 'reset'>('request');
  const [recoveryInfo, setRecoveryInfo] = useState<{
    message: string;
    emailDeliveryConfigured?: boolean;
    resetToken?: string;
  } | null>(null);

  // Status
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset tab on modal open
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      setError('');
      setSuccessMessage('');
      setRecoveryInfo(null);
      setResetStep('request');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleClose = () => {
    setError('');
    setSuccessMessage('');
    onClose();
  };

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please provide both email and password.');
      setLoading(false);
      return;
    }

    try {
      const user = await login(email, password);
      setSuccessMessage(`Welcome back, ${user.name}!`);
      setTimeout(() => {
        handleClose();
        if (onLoginSuccess) onLoginSuccess(user.role);
      }, 400);
    } catch (err) {
      setError((err as Error).message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleUserRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!name || !email || !password) {
      setError('Name, email, and password are required.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      const user = await register({
        name,
        email,
        password,
        role,
        phone,
        vehicleNumber,
        vehicleType
      });
      setSuccessMessage(`Account created successfully! Welcome, ${user.name}.`);
      setTimeout(() => {
        handleClose();
        if (onLoginSuccess) onLoginSuccess(user.role);
      }, 500);
    } catch (err) {
      setError((err as Error).message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Administrator credentials are required.');
      setLoading(false);
      return;
    }

    try {
      const user = await adminLogin(email, password, adminKey);
      setSuccessMessage('Administrator session verified securely.');
      setTimeout(() => {
        handleClose();
        if (onLoginSuccess) onLoginSuccess(user.role);
      }, 400);
    } catch (err) {
      setError((err as Error).message || 'Administrator authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResetToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!resetEmail || !resetEmail.trim()) {
      setError('Please enter your account email address.');
      setLoading(false);
      return;
    }

    try {
      const data = await api.forgotPassword(resetEmail);
      setRecoveryInfo({
        message: data.message,
        emailDeliveryConfigured: data.emailDeliveryConfigured,
        resetToken: data.resetToken
      });
      if (data.resetToken) {
        setResetToken(data.resetToken);
        setResetStep('reset');
      }
    } catch (err) {
      setError((err as Error).message || 'Password reset request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!resetToken || !resetToken.trim()) {
      setError('Reset token is required.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.resetPassword(resetToken, newPassword);
      setSuccessMessage(res.message || 'Password updated successfully!');
      setTimeout(() => {
        setActiveTab('login');
        setPassword('');
        setEmail(resetEmail);
        setSuccessMessage('Password reset successfully. Please log in with your new password.');
      }, 1200);
    } catch (err) {
      setError((err as Error).message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#312E81]/40 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-[#EDE9FE] shadow-2xl shadow-[#7C3AED]/15 overflow-hidden text-[#312E81] my-8 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-[#EDE9FE] bg-[#F8F5FF] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${activeTab === 'admin' ? 'bg-[#EDE9FE] text-[#7C3AED]' : 'bg-[#EDE9FE] text-[#7C3AED]'}`}>
              {activeTab === 'admin' ? <Shield className="w-5 h-5" /> : activeTab === 'forgot' ? <Key className="w-5 h-5" /> : <Car className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#312E81]">
                {activeTab === 'admin' && 'Secure Administrator Login'}
                {activeTab === 'login' && 'Sign In to ParkingSpot'}
                {activeTab === 'register' && 'Create Your Account'}
                {activeTab === 'forgot' && 'Password Recovery'}
              </h3>
              <p className="text-xs text-[#6B7280]">
                {activeTab === 'admin' ? 'Restricted Platform Operations' : 'Access India’s Smart Parking Network'}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-[#EDE9FE] text-[#6B7280] hover:text-[#312E81] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Navigation */}
        <div className="grid grid-cols-4 p-1.5 bg-[#F8F5FF] border-b border-[#EDE9FE] gap-1 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setError(''); setSuccessMessage(''); }}
            className={`py-2 px-1 rounded-xl transition-all cursor-pointer text-center ${
              activeTab === 'login'
                ? 'bg-white text-[#7C3AED] shadow-sm border border-[#EDE9FE]'
                : 'text-[#6B7280] hover:text-[#312E81] hover:bg-white/50'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setError(''); setSuccessMessage(''); }}
            className={`py-2 px-1 rounded-xl transition-all cursor-pointer text-center ${
              activeTab === 'register'
                ? 'bg-white text-[#7C3AED] shadow-sm border border-[#EDE9FE]'
                : 'text-[#6B7280] hover:text-[#312E81] hover:bg-white/50'
            }`}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('forgot'); setError(''); setSuccessMessage(''); }}
            className={`py-2 px-1 rounded-xl transition-all cursor-pointer text-center ${
              activeTab === 'forgot'
                ? 'bg-white text-[#7C3AED] shadow-sm border border-[#EDE9FE]'
                : 'text-[#6B7280] hover:text-[#312E81] hover:bg-white/50'
            }`}
          >
            Forgot?
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('admin'); setError(''); setSuccessMessage(''); }}
            className={`py-2 px-1 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
              activeTab === 'admin'
                ? 'bg-[#7C3AED] text-white shadow-sm'
                : 'text-[#7C3AED] hover:bg-[#EDE9FE]'
            }`}
          >
            <Shield className="w-3 h-3" />
            <span>Admin</span>
          </button>
        </div>

        {/* Alert Messages */}
        <div className="px-5 pt-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* TAB 1: USER SIGN IN */}
        {activeTab === 'login' && (
          <form onSubmit={handleUserLogin} className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#312E81]">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#A78BFA] absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-[#F8F5FF] border border-[#EDE9FE] focus:border-[#7C3AED] focus:bg-white rounded-xl pl-10 pr-3 py-2.5 text-xs text-[#312E81] outline-none transition-all placeholder:text-[#9CA3AF]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#312E81]">Password</label>
                <button
                  type="button"
                  onClick={() => { setActiveTab('forgot'); setResetEmail(email); setError(''); }}
                  className="text-[11px] font-semibold text-[#7C3AED] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A78BFA] absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  className="w-full bg-[#F8F5FF] border border-[#EDE9FE] focus:border-[#7C3AED] focus:bg-white rounded-xl pl-10 pr-3 py-2.5 text-xs text-[#312E81] outline-none transition-all placeholder:text-[#9CA3AF]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs shadow-md shadow-[#7C3AED]/25 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-[#6B7280]">Don't have an account? </span>
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setError(''); }}
                className="text-xs font-bold text-[#7C3AED] hover:underline cursor-pointer"
              >
                Register Here
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: USER REGISTRATION */}
        {activeTab === 'register' && (
          <form onSubmit={handleUserRegister} className="p-5 space-y-3.5 max-h-[70vh] overflow-y-auto">
            {/* Account Role Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#312E81]">Register As</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('commuter')}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    role === 'commuter'
                      ? 'bg-[#EDE9FE] border-[#7C3AED] text-[#7C3AED]'
                      : 'bg-[#F8F5FF] border-[#EDE9FE] text-[#6B7280] hover:bg-white'
                  }`}
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>Commuter / Driver</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('owner')}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    role === 'owner'
                      ? 'bg-[#EDE9FE] border-[#7C3AED] text-[#7C3AED]'
                      : 'bg-[#F8F5FF] border-[#EDE9FE] text-[#6B7280] hover:bg-white'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Facility Owner</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#312E81]">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#A78BFA] absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-[#F8F5FF] border border-[#EDE9FE] focus:border-[#7C3AED] focus:bg-white rounded-xl pl-10 pr-3 py-2.5 text-xs text-[#312E81] outline-none transition-all placeholder:text-[#9CA3AF]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#312E81]">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#A78BFA] absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-[#F8F5FF] border border-[#EDE9FE] focus:border-[#7C3AED] focus:bg-white rounded-xl pl-10 pr-3 py-2.5 text-xs text-[#312E81] outline-none transition-all placeholder:text-[#9CA3AF]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#312E81]">Password (min 6 characters)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A78BFA] absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Create a secure password"
                  className="w-full bg-[#F8F5FF] border border-[#EDE9FE] focus:border-[#7C3AED] focus:bg-white rounded-xl pl-10 pr-3 py-2.5 text-xs text-[#312E81] outline-none transition-all placeholder:text-[#9CA3AF]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#312E81]">Phone Number (Optional)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#A78BFA] absolute left-3.5 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-[#F8F5FF] border border-[#EDE9FE] focus:border-[#7C3AED] focus:bg-white rounded-xl pl-10 pr-3 py-2.5 text-xs text-[#312E81] outline-none transition-all placeholder:text-[#9CA3AF]"
                />
              </div>
            </div>

            {role === 'commuter' && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#312E81]">Vehicle Number</label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={e => setVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="TN-09-AB-1234"
                    className="w-full bg-[#F8F5FF] border border-[#EDE9FE] focus:border-[#7C3AED] focus:bg-white rounded-xl px-3 py-2.5 text-xs text-[#312E81] outline-none uppercase"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#312E81]">Vehicle Type</label>
                  <select
                    value={vehicleType}
                    onChange={e => setVehicleType(e.target.value as VehicleType)}
                    className="w-full bg-[#F8F5FF] border border-[#EDE9FE] focus:border-[#7C3AED] focus:bg-white rounded-xl px-3 py-2.5 text-xs text-[#312E81] outline-none"
                  >
                    <option value="car">Car / Sedan</option>
                    <option value="bike">Motorcycle / Bike</option>
                    <option value="ev">Electric Vehicle (EV)</option>
                    <option value="suv">SUV / MUV</option>
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs shadow-md shadow-[#7C3AED]/25 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Registering Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 3: PASSWORD RECOVERY (REAL FLOW) */}
        {activeTab === 'forgot' && (
          <div className="p-5 space-y-4">
            {resetStep === 'request' ? (
              <form onSubmit={handleRequestResetToken} className="space-y-3.5">
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  Enter your registered email address below. A time-limited, single-use reset token will be generated to update your password securely.
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#312E81]">Registered Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#A78BFA] absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="w-full bg-[#F8F5FF] border border-[#EDE9FE] focus:border-[#7C3AED] focus:bg-white rounded-xl pl-10 pr-3 py-2.5 text-xs text-[#312E81] outline-none transition-all placeholder:text-[#9CA3AF]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs shadow-md shadow-[#7C3AED]/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating Token...</span>
                    </>
                  ) : (
                    <>
                      <span>Generate Reset Token</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
                {recoveryInfo && (
                  <div className="p-3.5 rounded-xl bg-[#EDE9FE]/70 border border-[#A78BFA]/40 space-y-2 text-xs">
                    <p className="text-[#312E81] font-semibold leading-relaxed">
                      {recoveryInfo.message}
                    </p>
                    {recoveryInfo.resetToken && (
                      <div className="p-2 bg-white rounded-lg border border-[#EDE9FE] font-mono text-[11px] text-[#7C3AED] break-all select-all">
                        {recoveryInfo.resetToken}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#312E81]">Reset Token</label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-[#A78BFA] absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={resetToken}
                      onChange={e => setResetToken(e.target.value)}
                      placeholder="Paste your 64-char single-use token"
                      className="w-full bg-[#F8F5FF] border border-[#EDE9FE] focus:border-[#7C3AED] focus:bg-white rounded-xl pl-10 pr-3 py-2.5 text-xs text-[#312E81] font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#312E81]">New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#A78BFA] absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Enter at least 6 characters"
                      className="w-full bg-[#F8F5FF] border border-[#EDE9FE] focus:border-[#7C3AED] focus:bg-white rounded-xl pl-10 pr-3 py-2.5 text-xs text-[#312E81] outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#312E81]">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#A78BFA] absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      className="w-full bg-[#F8F5FF] border border-[#EDE9FE] focus:border-[#7C3AED] focus:bg-white rounded-xl pl-10 pr-3 py-2.5 text-xs text-[#312E81] outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs shadow-md shadow-[#7C3AED]/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm & Update Password</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 4: SEPARATE SECURE ADMINISTRATOR LOGIN */}
        {activeTab === 'admin' && (
          <form onSubmit={handleAdminLogin} className="p-5 space-y-4">
            <div className="p-3.5 rounded-xl bg-[#EDE9FE]/50 border border-[#A78BFA]/30 text-xs text-[#4338CA]">
              <div className="flex items-center gap-2 font-bold text-[#312E81] mb-1">
                <Shield className="w-4 h-4 text-[#7C3AED]" />
                <span>Elevated Security Portal</span>
              </div>
              <p className="text-[11px] text-[#4B5563]">
                This entrance is exclusively reserved for platform administrators. Direct URL and API access are strictly authorized on the server.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#312E81]">Administrator Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#A78BFA] absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@parkingspot.com"
                  className="w-full bg-[#F8F5FF] border border-[#EDE9FE] focus:border-[#7C3AED] focus:bg-white rounded-xl pl-10 pr-3 py-2.5 text-xs text-[#312E81] outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#312E81]">Security Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A78BFA] absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Administrator Master Password"
                  className="w-full bg-[#F8F5FF] border border-[#EDE9FE] focus:border-[#7C3AED] focus:bg-white rounded-xl pl-10 pr-3 py-2.5 text-xs text-[#312E81] outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#312E81]">Hardware / 2FA Security Key (Optional)</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#A78BFA] absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={adminKey}
                  onChange={e => setAdminKey(e.target.value)}
                  placeholder="Optional secondary security key"
                  className="w-full bg-[#F8F5FF] border border-[#EDE9FE] focus:border-[#7C3AED] focus:bg-white rounded-xl pl-10 pr-3 py-2.5 text-xs text-[#312E81] outline-none font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs shadow-md shadow-[#7C3AED]/25 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Authorization...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Authenticate Administrator</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer info note */}
        <div className="p-3 bg-[#F8F5FF] border-t border-[#EDE9FE] text-center text-[11px] text-[#6B7280]">
          <span>Protected with bcrypt password hashing & JWT session authentication</span>
        </div>
      </div>
    </div>
  );
};
