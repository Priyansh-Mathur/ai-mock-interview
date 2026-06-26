import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
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
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">Start practicing</p>
        <h1>Create your account</h1>
        <form onSubmit={handleSubmit}>
          <label>Name</label>
          <input name="name" value={form.name} onChange={handleChange} placeholder="Your name" required />

          <label>Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />

          <label>Password</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Minimum 6 characters" required />

          {error && <p className="error">{error}</p>}
          <button className="primary-btn" disabled={loading}>{loading ? 'Creating...' : 'Create account'}</button>
        </form>
        <p className="muted">Already have an account? <Link to="/login">Login</Link></p>
      </section>
    </main>
  );
};

export default Register;
