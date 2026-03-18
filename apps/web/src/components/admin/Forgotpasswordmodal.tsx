import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../services/commonAPI';

// ── API calls ─────────────────────────────────────────────────────────────────
const requestOTP = (email: string) => api.post('/api/auth/forgot-password', { email });

const verifyOTP = (email: string, otp: string) =>
  api.post<{ resetToken: string }>('/api/auth/verify-otp', { email, otp });

const resetPassword = (email: string, resetToken: string, newPassword: string) =>
  api.post('/api/auth/reset-password', { email, resetToken, newPassword });

// ── Types ─────────────────────────────────────────────────────────────────────
type Step = 'email' | 'otp' | 'password' | 'done';

interface ForgotPasswordModalProps {
  onClose: () => void;
}

// ── OTP Input ─────────────────────────────────────────────────────────────────
const OTPInput: React.FC<{ value: string; onChange: (v: string) => void; disabled?: boolean }> = ({
  value,
  onChange,
  disabled,
}) => {
  const ref0 = useRef<HTMLInputElement>(null);
  const ref1 = useRef<HTMLInputElement>(null);
  const ref2 = useRef<HTMLInputElement>(null);
  const ref3 = useRef<HTMLInputElement>(null);
  const ref4 = useRef<HTMLInputElement>(null);
  const ref5 = useRef<HTMLInputElement>(null);
  const refs = [ref0, ref1, ref2, ref3, ref4, ref5];
  const digits = value.padEnd(6, ' ').split('').slice(0, 6);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const next = [...digits];
      if (next[i].trim()) {
        next[i] = ' ';
        onChange(next.join('').trimEnd());
      } else if (i > 0) {
        refs[i - 1].current?.focus();
      }
    }
  };

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = char || ' ';
    onChange(next.join('').trimEnd());
    if (char && i < 5) refs[i + 1].current?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, 5);
    refs[focusIdx].current?.focus();
  };

  return (
    <div className="flex gap-2.5 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d.trim()}
          disabled={disabled}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          className={`w-11 h-13 text-center text-xl font-bold rounded-xl border-2 transition-all outline-none disabled:opacity-50
            ${
              d.trim()
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-slate-50 text-slate-800'
            }
            focus:border-blue-500 focus:bg-blue-50 focus:ring-2 focus:ring-blue-500/20`}
          style={{ height: '52px' }}
        />
      ))}
    </div>
  );
};

// ── Resend timer ──────────────────────────────────────────────────────────────
const ResendTimer: React.FC<{ onResend: () => void; loading: boolean }> = ({
  onResend,
  loading,
}) => {
  const [seconds, setSeconds] = useState(60);
  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  return seconds > 0 ? (
    <p className="text-xs text-slate-400 text-center">
      Resend code in <span className="font-semibold text-slate-600">{seconds}s</span>
    </p>
  ) : (
    <button
      onClick={() => {
        setSeconds(60);
        onResend();
      }}
      disabled={loading}
      className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50 mx-auto block"
    >
      Resend code
    </button>
  );
};

// ── Password strength ─────────────────────────────────────────────────────────
const strength = (pw: string): { score: number; label: string; color: string } => {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const map = [
    { label: '', color: 'bg-slate-200' },
    { label: 'Weak', color: 'bg-red-400' },
    { label: 'Fair', color: 'bg-amber-400' },
    { label: 'Good', color: 'bg-blue-400' },
    { label: 'Strong', color: 'bg-emerald-500' },
  ];
  return { score: s, ...map[s] };
};

// ── Main Modal ────────────────────────────────────────────────────────────────
const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ onClose }) => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pw = strength(newPassword);
  const errMsg = (e: unknown) => {
    const x = e as { response?: { data?: { message?: string } } };
    return x?.response?.data?.message ?? (e instanceof Error ? e.message : 'Something went wrong');
  };

  // ── Step 1: request OTP ────────────────────────────────────────────────────
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) return setError('Please enter your email address');
    try {
      setLoading(true);
      await requestOTP(email);
      setStep('otp');
    } catch (ex) {
      setError(errMsg(ex));
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify OTP ─────────────────────────────────────────────────────
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (otp.replace(/\s/g, '').length < 6) return setError('Please enter the full 6-digit code');
    try {
      setLoading(true);
      const res = await verifyOTP(email, otp.replace(/\s/g, ''));
      setResetToken(res.data.resetToken);
      setStep('password');
    } catch (ex) {
      setError(errMsg(ex));
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: reset password ─────────────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) return setError('Password must be at least 8 characters');
    if (newPassword !== confirmPassword) return setError('Passwords do not match');
    try {
      setLoading(true);
      await resetPassword(email, resetToken, newPassword);
      setStep('done');
    } catch (ex) {
      setError(errMsg(ex));
    } finally {
      setLoading(false);
    }
  };

  const inp =
    'w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all';
  const lbl = 'block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5';

  const stepMeta: Record<Step, { icon: string; title: string; sub: string }> = {
    email: {
      icon: '🔑',
      title: 'Forgot Password?',
      sub: "Enter your email and we'll send you a reset code.",
    },
    otp: { icon: '📬', title: 'Check Your Email', sub: `We sent a 6-digit code to ${email}` },
    password: {
      icon: '🔒',
      title: 'New Password',
      sub: 'Choose a strong password for your account.',
    },
    done: {
      icon: '✅',
      title: 'Password Reset!',
      sub: 'Your password has been updated. All sessions have been signed out.',
    },
  };
  const meta = stepMeta[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ animation: 'popIn .2s ease' }}
      >
        <style>{`@keyframes popIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}`}</style>

        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-4 text-2xl">
            {meta.icon}
          </div>
          <h2 className="text-lg font-extrabold text-slate-900">{meta.title}</h2>
          <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{meta.sub}</p>

          {/* Step dots */}
          {step !== 'done' && (
            <div className="flex items-center justify-center gap-2 mt-5">
              {(['email', 'otp', 'password'] as const).map((s, i) => (
                <React.Fragment key={s}>
                  <div
                    className={`w-2 h-2 rounded-full transition-all ${step === s ? 'bg-blue-600 w-6' : ['email', 'otp', 'password'].indexOf(step) > i ? 'bg-blue-300' : 'bg-slate-200'}`}
                  />
                  {i < 2 && (
                    <div
                      className={`h-px w-6 transition-all ${['email', 'otp', 'password'].indexOf(step) > i ? 'bg-blue-300' : 'bg-slate-200'}`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-8 pb-8">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2">
              <svg
                className="w-4 h-4 text-red-400 shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
              {error}
            </div>
          )}

          {/* ── STEP 1: Email ────────────────────────────────────────────── */}
          {step === 'email' && (
            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div>
                <label className={lbl}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                  className={inp}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors shadow-sm"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Sending…
                  </>
                ) : (
                  'Send Reset Code'
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
              >
                Back to Login
              </button>
            </form>
          )}

          {/* ── STEP 2: OTP ──────────────────────────────────────────────── */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <OTPInput value={otp} onChange={setOtp} disabled={loading} />
              <button
                type="submit"
                disabled={loading || otp.replace(/\s/g, '').length < 6}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors shadow-sm"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Verifying…
                  </>
                ) : (
                  'Verify Code'
                )}
              </button>
              <ResendTimer
                loading={loading}
                onResend={async () => {
                  setError(null);
                  try {
                    await requestOTP(email);
                  } catch (ex) {
                    setError(errMsg(ex));
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setOtp('');
                  setError(null);
                }}
                className="w-full py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
              >
                ← Use a different email
              </button>
            </form>
          )}

          {/* ── STEP 3: New Password ──────────────────────────────────────── */}
          {step === 'password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className={lbl}>New Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    autoFocus
                    className={inp + ' pr-11'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPw ? (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {/* Strength bar */}
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((n) => (
                        <div
                          key={n}
                          className={`h-1 flex-1 rounded-full transition-all ${pw.score >= n ? pw.color : 'bg-slate-200'}`}
                        />
                      ))}
                    </div>
                    {pw.label && (
                      <p
                        className={`text-xs font-semibold ${pw.score <= 1 ? 'text-red-500' : pw.score === 2 ? 'text-amber-500' : pw.score === 3 ? 'text-blue-500' : 'text-emerald-500'}`}
                      >
                        {pw.label}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className={lbl}>Confirm Password</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  className={
                    inp +
                    (confirmPassword && confirmPassword !== newPassword
                      ? ' border-red-300 focus:border-red-400'
                      : '')
                  }
                />
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-xs text-red-500 mt-1.5">Passwords don't match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors shadow-sm"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Resetting…
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}

          {/* ── STEP 4: Done ─────────────────────────────────────────────── */}
          {step === 'done' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-emerald-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-left space-y-1">
                <p>✓ Password updated successfully</p>
                <p>✓ All existing sessions signed out</p>
                <p>✓ You can now log in with your new password</p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
