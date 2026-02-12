import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import './Login.css';

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
    <div className="login-page">
      <div className="login-left">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2 className="login-form-title">用户登录</h2>
          <div className="form-group">
            <label>用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              required
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
              autoComplete="current-password"
            />
          </div>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? '登录中...' : '登 录'}
          </button>
          <p className="login-hint">测试账号：admin / 123456</p>
        </form>
      </div>
      <div className="login-right">
        <div className="login-banner">
          <h1 className="login-banner-title">大地集团智能选房系统</h1>
          <p className="login-banner-version">系统版本：Vol：1.0</p>
          <p className="login-banner-desc">推荐IE9.0以上版本Web浏览器，1280*800或更高分辨率</p>
          <p className="login-banner-tech">技术支持：北京鸿鼎信息技术有限公司</p>
        </div>
      </div>
    </div>
  );
}
