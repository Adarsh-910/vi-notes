import { useState } from 'react';
import axios from 'axios';
const API = import.meta.env.VITE_API_URL;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const res = await axios.post(`${API}${endpoint}`, { email, password });      localStorage.setItem('token', res.data.token);
      window.location.href = '/';
    } catch {
      setError(isLogin ? 'Invalid credentials. Please try again.' : 'Registration failed. Account may already exist.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
    }}>

      {/* Left — Brand panel */}
      <div style={{
        borderRight: '1px solid var(--glass-border)',
        background: 'var(--bg-secondary)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '3rem',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--text-primary)' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
            Vi-Notes
          </span>
        </div>

        {/* Center blurb */}
        <div>
          <h1 style={{
            fontFamily: 'var(--font-base)',
            fontSize: '2rem',
            fontWeight: 400,
            lineHeight: 1.5,
            color: 'var(--text-primary)',
            margin: '0 0 1.5rem',
            maxWidth: '340px'
          }}>
            Prove every word is yours.
          </h1>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            maxWidth: '320px',
            margin: 0
          }}>
            Vi-Notes captures your typing behavior in real time, building a cryptographic proof of
            original authorship for every session you write.
          </p>
        </div>

        {/* Footer note */}
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.72rem',
          color: 'var(--text-secondary)',
          opacity: 0.5,
          margin: 0,
          letterSpacing: '0.05em'
        }}>
          ML AUTHENTICITY ENGINE · END-TO-END ANALYSIS
        </p>
      </div>

      {/* Right — Form panel */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 4rem',
      }}>
        <div style={{ width: '100%', maxWidth: '360px' }} className="animate-fade-in">

          {/* Tab switcher */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--glass-border)',
            marginBottom: '2.5rem'
          }}>
            {['Sign in', 'Create account'].map((label, i) => {
              const active = i === 0 ? isLogin : !isLogin;
              return (
                <button
                  key={label}
                  onClick={() => { setIsLogin(i === 0); setError(null); }}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    borderBottom: active ? '2px solid var(--text-primary)' : '2px solid transparent',
                    padding: '0.7rem 0',
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.85rem',
                    fontWeight: active ? 600 : 400,
                    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    marginBottom: '-1px',
                    transition: 'all 0.15s'
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{
                display: 'block',
                fontFamily: 'var(--font-display)',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-secondary)',
                marginBottom: '0.5rem'
              }}>
                Email
              </label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                fontFamily: 'var(--font-display)',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-secondary)',
                marginBottom: '0.5rem'
              }}>
                Password
              </label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            {/* Error */}
            {error && (
              <p style={{
                fontFamily: 'var(--font-display)', fontSize: '0.82rem',
                color: 'var(--text-primary)', background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)',
                borderRadius: '4px', padding: '0.6rem 0.8rem',
                margin: '0 0 1.2rem'
              }}>
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '0.7rem', fontSize: '0.9rem' }}
            >
              {loading ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p style={{
            fontFamily: 'var(--font-display)', fontSize: '0.72rem',
            color: 'var(--text-secondary)', opacity: 0.5,
            textAlign: 'center', marginTop: '3rem', letterSpacing: '0.05em'
          }}>
            Vi-Notes · Secure Authorship Platform
          </p>
        </div>
      </div>
    </div>
  );
}
