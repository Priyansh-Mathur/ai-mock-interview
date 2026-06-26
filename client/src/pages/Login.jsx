import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">Welcome back</p>
        <h1>Login to start interview practice</h1>
        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />

          <label>Password</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Minimum 6 characters" required />

          {error && <p className="error">{error}</p>}
          <button className="primary-btn" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
        </form>
        <p className="muted">New here? <Link to="/register">Create account</Link></p>
      </section>
    </main>
  );
};

export default Login;
