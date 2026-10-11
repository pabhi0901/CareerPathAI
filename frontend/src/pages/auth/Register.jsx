import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Target, ArrowRight, AlertCircle } from 'lucide-react';

export const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    degree: 'B.Tech / B.E.',
    branch: 'Computer Science & Engineering',
    targetRole: 'Full Stack Engineer',
    graduationYear: 2026,
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create student account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-main)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-md)',
        padding: '36px 32px',
      }}>
        {/* Editorial Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            backgroundColor: 'var(--accent-primary)',
            color: '#FFFFFF',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '14px',
          }}>
            <Target size={20} />
          </div>
          <h1 className="editorial-title" style={{ fontSize: '24px', marginBottom: '6px' }}>
            Register as Student
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Start your AI-driven skill gap analysis and roadmap preparation
          </p>
        </div>

        {error && (
          <div className="notice-box notice-danger" style={{ marginBottom: '20px' }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                className="form-input"
                placeholder="Abhishek Sharma"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder="abhishek@university.edu"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" htmlFor="password">Password (minimum 6 characters)</label>
              <input
                id="password"
                name="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                minLength={6}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="degree">Degree</label>
              <select
                id="degree"
                name="degree"
                className="form-select"
                value={formData.degree}
                onChange={handleChange}
              >
                <option value="B.Tech / B.E.">B.Tech / B.E.</option>
                <option value="M.Tech / M.E.">M.Tech / M.E.</option>
                <option value="BCA / MCA">BCA / MCA</option>
                <option value="B.Sc / M.Sc">B.Sc / M.Sc</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="graduationYear">Graduation Year</label>
              <input
                id="graduationYear"
                name="graduationYear"
                type="number"
                className="form-input"
                value={formData.graduationYear}
                onChange={handleChange}
                min={2024}
                max={2030}
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" htmlFor="branch">Academic Branch / Specialization</label>
              <input
                id="branch"
                name="branch"
                type="text"
                className="form-input"
                placeholder="Computer Science & Engineering"
                value={formData.branch}
                onChange={handleChange}
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label" htmlFor="targetRole">Target Career Role</label>
              <input
                id="targetRole"
                name="targetRole"
                type="text"
                className="form-input"
                placeholder="Full Stack Engineer / AI Engineer"
                value={formData.targetRole}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px 16px', marginTop: '12px' }}
            disabled={isSubmitting}
          >
            <span>{isSubmitting ? 'Creating Profile...' : 'Complete Registration'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="hairline-divider" />

        <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
