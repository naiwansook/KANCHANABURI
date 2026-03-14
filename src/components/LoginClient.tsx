'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginClient() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    if (!username || !password) { setError('กรุณากรอก Username และ Password'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (data.success) { router.push('/'); router.refresh() }
      else setError('Username หรือ Password ไม่ถูกต้อง')
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2942 50%, #1a1a4e 100%)',
      fontFamily: "'Prompt', sans-serif",
    }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: `${120 + i * 60}px`, height: `${120 + i * 60}px`,
            borderRadius: '50%',
            border: '1px solid rgba(96,165,250,0.08)',
            top: `${10 + i * 8}%`, left: `${5 + i * 15}%`,
            animation: `spin ${15 + i * 5}s linear infinite`,
          }} />
        ))}
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.97)', borderRadius: '20px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.35)', padding: '40px',
        width: '380px', maxWidth: '92vw', position: 'relative', zIndex: 1,
      }}>
        <div style={{
          width: '72px', height: '72px', background: 'linear-gradient(135deg, #2563eb, #1e3a5f)',
          borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', color: '#fff', fontSize: '1.8rem',
          boxShadow: '0 8px 24px rgba(37,99,235,0.35)',
        }}>
          <i className="fas fa-hotel" />
        </div>

        <h3 style={{ textAlign: 'center', fontWeight: 700, color: '#1e3a5f', marginBottom: 4 }}>
          Resort Manager
        </h3>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: 28, fontSize: '0.87rem' }}>
          ระบบจัดการรีสอร์ทออนไลน์
        </p>

        <div style={{ marginBottom: 14 }}>
          <label className="form-label">Username</label>
          <div style={{ position: 'relative' }}>
            <i className="fas fa-user" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text" className="form-control"
              style={{ paddingLeft: 34 }}
              placeholder="กรอก username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label className="form-label">Password</label>
          <div style={{ position: 'relative' }}>
            <i className="fas fa-lock" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="password" className="form-control"
              style={{ paddingLeft: 34 }}
              placeholder="กรอก password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>
        </div>

        {error && (
          <div style={{ color: '#ef4444', textAlign: 'center', fontSize: '0.85rem', marginBottom: 12 }}>
            <i className="fas fa-exclamation-circle me-1" /> {error}
          </div>
        )}

        <button className="bp w-100" style={{ justifyContent: 'center', padding: '11px', fontSize: '0.95rem' }}
          onClick={handleLogin} disabled={loading}>
          {loading ? <><span className="spinner" style={{ width: 16, height: 16, borderColor: 'rgba(255,255,255,0.4)', borderTopColor: '#fff' }} /> กำลังตรวจสอบ...</> : <><i className="fas fa-sign-in-alt me-1" /> เข้าสู่ระบบ</>}
        </button>

        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.78rem', marginTop: 20, marginBottom: 0 }}>
          <i className="fas fa-shield-alt me-1" /> Resort Manager Pro v3.0
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
