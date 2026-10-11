import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';

export const AssessmentHistory = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await api.get('/assessments/history');
        if (res.data.success) {
          setAttempts(res.data.attempts);
        }
      } catch (err) {
        setError('Failed to load assessment history.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const totalAttempts = attempts.length;
  const passedCount = attempts.filter((a) => a.passed).length;
  const overallRate = totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0;

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px',
      }}>
        <div>
          <span style={{
            fontSize: '11.5px',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-muted)',
            fontWeight: 600,
          }}>
            Examination Records
          </span>
          <h1 className="editorial-title" style={{ fontSize: '28px', marginTop: '2px' }}>
            Assessment Attempts History
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Permanent record of technical MCQ assessments, passing scores (75% threshold), and score trends.
          </p>
        </div>

        <Link to="/roadmaps" className="btn btn-primary">
          <span>Explore Modules to Test</span>
        </Link>
      </div>

      {error && (
        <div className="notice-box notice-danger">
          <AlertTriangle size={16} />
          <div>{error}</div>
        </div>
      )}

      {/* Aggregate Stats Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '28px',
      }}>
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-sm)',
          padding: '18px 20px',
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Attempts
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 600, marginTop: '4px' }}>
            {totalAttempts}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-sm)',
          padding: '18px 20px',
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Passed Assessments
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 600, color: 'var(--status-success-text)', marginTop: '4px' }}>
            {passedCount}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-sm)',
          padding: '18px 20px',
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Overall Pass Rate
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 600, marginTop: '4px' }}>
            {overallRate}%
          </div>
        </div>
      </div>

      {/* Attempts Table */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-sm)',
        padding: '24px',
      }}>
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading attempt history...
          </div>
        ) : attempts.length > 0 ? (
          <div className="table-container">
            <table className="editorial-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Module</th>
                  <th>Attempt</th>
                  <th>Score / Max</th>
                  <th>Percentage</th>
                  <th>Result (75% Rule)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((att) => (
                  <tr key={att._id}>
                    <td style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                      {new Date(att.createdAt).toLocaleDateString()} at{' '}
                      {new Date(att.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <strong>{att.assessmentId?.moduleTitle || att.moduleId}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {att.moduleId}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-default font-mono">
                        #{att.attemptNumber}
                      </span>
                    </td>
                    <td>
                      {att.score} / {att.maxScore}
                    </td>
                    <td>
                      <strong style={{ fontSize: '14px' }}>{att.percentage}%</strong>
                    </td>
                    <td>
                      {att.passed ? (
                        <span className="badge badge-success">
                          <CheckCircle2 size={12} /> Passed
                        </span>
                      ) : (
                        <span className="badge badge-danger">
                          <XCircle size={12} /> Below 75%
                        </span>
                      )}
                    </td>
                    <td>
                      <Link
                        to={`/assessments/${att.roadmapId}/${att.moduleId}`}
                        className="btn btn-secondary btn-sm"
                        title="Retake or review"
                      >
                        <RotateCcw size={12} />
                        <span>Retake</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No assessment attempts yet. Select any module in your roadmaps to take its technical assessment.
          </div>
        )}
      </div>
    </div>
  );
};
