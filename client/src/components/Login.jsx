import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      if (username === 'admin' && password === 'admin') {
        onLogin();
      } else {
        setError('Username atau password salah!');
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #312E81 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative blobs */}
      <div style={{position: 'absolute', top: '-80px', left: '-80px', width: '350px', height: '350px', background: 'rgba(79, 70, 229, 0.15)', borderRadius: '50%', filter: 'blur(60px)'}}></div>
      <div style={{position: 'absolute', bottom: '-100px', right: '-60px', width: '400px', height: '400px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '50%', filter: 'blur(80px)'}}></div>

      <div style={{
        width: '100%',
        maxWidth: '420px',
        padding: '48px 40px',
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
        zIndex: 1
      }}>
        {/* Logo & Title */}
        <div style={{textAlign: 'center', marginBottom: '40px'}}>
          <div style={{
            width: '70px', height: '70px', background: 'linear-gradient(135deg, #4F46E5, #818CF8)',
            borderRadius: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px', marginBottom: '20px', boxShadow: '0 8px 20px rgba(79,70,229,0.4)'
          }}>🛍️</div>
          <h1 style={{color: 'white', fontSize: '26px', fontWeight: '700', letterSpacing: '-0.5px', marginBottom: '8px'}}>POS ERTIGA</h1>
          <p style={{color: 'rgba(255,255,255,0.5)', fontSize: '14px'}}>Masuk untuk melanjutkan</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom: '20px'}}>
            <label style={{display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: '600', marginBottom: '8px', letterSpacing: '0.3px'}}>USERNAME</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Masukkan username"
              required
              style={{
                width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '12px', padding: '14px 18px', color: 'white', fontSize: '15px', outline: 'none',
                transition: 'all 0.2s', boxShadow: 'none'
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(79,70,229,0.8)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
            />
          </div>

          <div style={{marginBottom: '30px'}}>
            <label style={{display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: '600', marginBottom: '8px', letterSpacing: '0.3px'}}>PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Masukkan password"
              required
              style={{
                width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '12px', padding: '14px 18px', color: 'white', fontSize: '15px', outline: 'none',
                transition: 'all 0.2s', boxShadow: 'none'
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(79,70,229,0.8)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '10px', padding: '12px 16px', marginBottom: '20px',
              color: '#FCA5A5', fontSize: '14px', textAlign: 'center'
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '15px',
              background: loading ? 'rgba(79,70,229,0.5)' : 'linear-gradient(135deg, #4F46E5, #6366F1)',
              border: 'none', borderRadius: '12px', color: 'white', fontSize: '16px', fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
              boxShadow: '0 4px 15px rgba(79,70,229,0.35)', letterSpacing: '0.3px'
            }}
          >
            {loading ? 'Masuk...' : 'Masuk →'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
