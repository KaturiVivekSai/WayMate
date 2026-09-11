import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Bike,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  UserRound
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

const initialSignup = {
  username: '',
  email: '',
  phone: '',
  password: '',
  bikeNumber: '',
  avatar: ''
};

export const AuthPage = () => {
  const { entryMode, setEntryMode, signUp, login, isSubmitting, globalError, setActiveTab } = useApp();
  const [form, setForm] = useState(initialSignup);
  const [loginForm, setLoginForm] = useState({ emailOrUserId: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const isSignup = entryMode !== 'login';
  const passwordReady = form.password.length >= 8;

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const submitSignup = async e => {
    e.preventDefault();
    const phoneOkay = !form.phone || /^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, ''));
    if (form.username.trim().length < 3) return setError('Username should be at least 3 characters.');
    if (!form.email.includes('@')) return setError('Enter a valid campus email address.');
    if (form.phone && !phoneOkay) return setError('Enter a valid 10-digit Indian mobile number.');
    if (!passwordReady) return setError('Password must be at least 8 characters.');

    try {
      await signUp(form);
      setActiveTab('dashboard');
      setEntryMode('app');
    } catch (err) {
      setError(err.message || 'Could not create the account.');
    }
  };

  const submitLogin = async e => {
    e.preventDefault();
    if (!loginForm.emailOrUserId.trim() || loginForm.password.length < 8) {
      return setError('Enter your campus email/WayMate ID and password.');
    }
    try {
      await login(loginForm);
      setActiveTab('dashboard');
      setEntryMode('app');
    } catch (err) {
      setError(err.message || 'Could not sign you in.');
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <aside className="auth-aside">
          <button className="brand-lockup" onClick={() => setEntryMode('landing')}>
            <img src="/waymate-mark.png" alt="" />
            <span>Way <span>Mate</span></span>
          </button>
          <div className="auth-aside-copy">
            <span className="eyebrow"><ShieldCheck size={14} /> Student community</span>
            <h1>Turn empty seats into <em>shared journeys.</em></h1>
            <p>Find nearby campus rides, share spare seats, build trust and move Community Credits through one connected network.</p>
            <div className="auth-proof-list">
              <div><strong>01</strong><span>Campus-first student identity</span></div>
              <div><strong>02</strong><span>Supabase authenticated sessions</span></div>
              <div><strong>03</strong><span>Community Credits for shared mobility</span></div>
            </div>
          </div>
          <small>PVPSIT Parking · Hostel · PG network</small>
        </aside>

        <section className="auth-panel">
          <div className="auth-panel-head">
            <div className="auth-mobile-brand">
              <img src="/waymate-mark.png" alt="" />
              <span>Way <span>Mate</span></span>
            </div>
            <span className="auth-kicker">{isSignup ? 'Create your account' : 'Welcome back'}</span>
            <h2>{isSignup ? 'Your campus network starts here.' : 'Continue where you left off.'}</h2>
            <p>{isSignup ? 'Sign up to receive 50 Community Credits and start sharing rides.' : 'Sign in with your campus email or WayMate User ID (e.g. WM100001).'}</p>
          </div>

          <div className="auth-switch" role="tablist" aria-label="Authentication mode">
            <button className={isSignup ? 'active' : ''} onClick={() => { setEntryMode('signup'); setError(''); }}>Sign up</button>
            <button className={!isSignup ? 'active' : ''} onClick={() => { setEntryMode('login'); setError(''); }}>Log in</button>
          </div>

          {(error || globalError) && (
            <div className="auth-error">
              <AlertCircle size={16} />
              <span>{error || globalError?.message}</span>
            </div>
          )}

          {isSignup ? (
            <form className="auth-form" onSubmit={submitSignup} noValidate>
              <div className="form-section-label"><span>01</span> Student Details</div>
              
              <label>
                Full Name / Username
                <div className="input-with-icon">
                  <UserRound size={16} />
                  <input
                    value={form.username}
                    onChange={e => update('username', e.target.value)}
                    placeholder="e.g. Alex Kumar"
                    autoComplete="name"
                    required
                  />
                </div>
              </label>

              <div className="auth-two-col">
                <label>
                  Campus Email
                  <div className="input-with-icon">
                    <Mail size={16} />
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => update('email', e.target.value)}
                      placeholder="you@campus.edu"
                      autoComplete="email"
                      required
                    />
                  </div>
                </label>

                <label>
                  Phone Number (optional)
                  <div className="input-with-icon">
                    <Phone size={16} />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => update('phone', e.target.value)}
                      placeholder="10-digit mobile"
                      autoComplete="tel"
                    />
                  </div>
                </label>
              </div>

              <div className="form-section-label"><span>02</span> Account & Vehicle</div>
              <label>
                Password
                <div className="input-with-icon password-input">
                  <LockKeyhole size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => update('password', e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
              <div className="password-hint">
                <span className={passwordReady ? 'ready' : ''}>{passwordReady ? '✓' : '•'} 8+ characters</span>
                <span>Protected by Supabase Auth</span>
              </div>

              <label>
                Vehicle / Bike Number <span style={{ color: 'var(--text-tertiary)', fontWeight: 'normal' }}>(optional)</span>
                <div className="input-with-icon">
                  <Bike size={16} />
                  <input
                    value={form.bikeNumber}
                    onChange={e => update('bikeNumber', e.target.value)}
                    placeholder="e.g. AP 16 XX 1234 (leave blank if passenger)"
                    autoComplete="off"
                  />
                </div>
              </label>

              <div className="upload-row">
                <div className="upload-avatar">
                  {form.avatar ? <img src={form.avatar} alt="Profile preview" /> : <UserRound size={22} />}
                </div>
                <div>
                  <strong>Profile picture</strong>
                  <p>A clear photo helps fellow student commuters recognise you.</p>
                </div>
                <label className="upload-button">
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => update('avatar', String(reader.result));
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              </div>

              <div className="auth-footnote">
                <ShieldCheck size={15} />
                <span>New student accounts automatically receive 50 Community Credits and a unique WayMate ID upon registration.</span>
              </div>

              <button className="btn btn-primary btn-block auth-submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating account in Supabase…' : 'Create account'} <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={submitLogin} noValidate>
              <label>
                Campus Email or WayMate User ID
                <div className="input-with-icon">
                  <Mail size={16} />
                  <input
                    value={loginForm.emailOrUserId}
                    onChange={e => { setLoginForm(prev => ({ ...prev, emailOrUserId: e.target.value })); setError(''); }}
                    placeholder="you@campus.edu or WM100001"
                    autoComplete="username"
                    required
                  />
                </div>
              </label>

              <label>
                Password
                <div className="input-with-icon password-input">
                  <LockKeyhole size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={e => { setLoginForm(prev => ({ ...prev, password: e.target.value })); setError(''); }}
                    placeholder="Your password"
                    autoComplete="current-password"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(value => !value)} aria-label="Toggle password visibility">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <div className="auth-footnote">
                <ShieldCheck size={15} />
                <span>Supports login with your registered college email or WayMate User ID.</span>
              </div>

              <button className="btn btn-primary btn-block auth-submit" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in with Supabase…' : 'Log in to Way Mate'} <ArrowRight size={16} />
              </button>
            </form>
          )}

          <div className="auth-bottom">
            {isSignup ? 'Already part of the network?' : 'New to Way Mate?'}
            {' '}
            <button onClick={() => { setEntryMode(isSignup ? 'login' : 'signup'); setError(''); }}>
              {isSignup ? 'Log in' : 'Create an account'}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
};
