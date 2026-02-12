import { useState } from 'react';
import { motion } from 'framer-motion';
import './Login.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { username, password });
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen min-h-[100dvh] relative flex items-center justify-center overflow-hidden bg-background">
      {/* Hero Image + 40% Dark Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/home-bg.png"
          alt=""
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0 bg-black/40"
          aria-hidden
        />
      </div>

      {/* Centered Glassmorphism Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[420px] mx-4"
      >
        <div className="login-glass-card">
          <form onSubmit={handleSubmit} className="login-form-inner">
            <h2 className="login-title">欢迎登录</h2>
            <p className="login-subtitle">大地集团智能选房系统</p>

            <div className="login-fields">
              <div className="login-input-wrap">
                <label htmlFor="login-username" className="login-label">用户名</label>
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  className="login-input"
                />
              </div>

              <div className="login-input-wrap">
                <label htmlFor="login-password" className="login-label">密码</label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="login-input"
                />
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 text-sm text-red-400 font-medium"
              >
                {error}
              </motion.p>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              className="login-cta"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? '登录中...' : '登 录'}
            </motion.button>

            <p className="login-hint">测试账号：admin / 123456</p>
          </form>
        </div>
      </motion.div>

      {/* Footer branding */}
      <div className="absolute bottom-6 left-0 right-0 text-center z-10">
        <p className="text-white/70 text-xs font-sans">
          技术支持：北京鸿鼎信息技术有限公司 · 系统版本 Vol.1.0
        </p>
      </div>
    </div>
  );
}
