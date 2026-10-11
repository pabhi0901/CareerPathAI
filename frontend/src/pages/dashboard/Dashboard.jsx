import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import {
  Compass,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  TrendingUp,
  FileText,
  Calendar,
  Clock,
  Info,
} from 'lucide-react';

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard');
        if (res.data.success) {
          setData(res.data.metrics);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading student preparation metrics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="notice-box notice-danger">
        <AlertTriangle size={16} />
        <div>{error}</div>
      </div>
    );
  }

  const {
    targetRole,
    targetCompany,
    daysRemaining,
    availableHoursPerDay,
    skillsOverview,
    latestJobAnalysis,
    roadmapProgress,
    assessmentStats,
    readiness,
  } = data;

  return (
    <div>
      {/* Editorial Header Section */}
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
            Preparation Overview
          </span>
          <h1 className="editorial-title" style={{ fontSize: '28px', marginTop: '2px' }}>
            Target: {targetRole} {targetCompany ? `at ${targetCompany}` : ''}
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Systematic career roadmap tracking, skill validation, and assessment performance.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/job-analysis" className="btn btn-secondary">
            <Briefcase size={15} />
            <span>New Job Analysis</span>
          </Link>
          <Link to="/roadmaps" className="btn btn-primary">
            <Compass size={15} />
            <span>View Roadmaps</span>
          </Link>
        </div>
      </div>

      {/* Top Indicators Row: Career Readiness + Timeline + Assessment Pass Rate */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '32px',
      }}>
        {/* Career Readiness Index */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-md)',
          padding: '22px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              Readiness Index
            </span>
            <span className="badge badge-accent">
              <TrendingUp size={12} /> {readiness.score >= 70 ? 'Interview Ready' : 'In Preparation'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '38px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {readiness.score}%
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>aggregate index</span>
          </div>

          <div className="progress-bar-track" style={{ marginBottom: '12px' }}>
            <div className="progress-bar-fill" style={{ width: `${readiness.score}%` }} />
          </div>

          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.45, backgroundColor: 'var(--bg-subtle)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
            <Info size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
            {readiness.explanation.formula}
          </div>
        </div>

        {/* Timeline & Study Allocation */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-md)',
          padding: '22px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              Placement Timeline
            </span>
            <span className="badge badge-default">
              <Calendar size={12} /> {daysRemaining !== null ? `${daysRemaining} Days Left` : 'Active'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '38px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {availableHoursPerDay} hrs
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>daily study target</span>
          </div>

          <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Confirmed Skills in Profile:</span>
              <strong>{skillsOverview.totalConfirmed} skills</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Verified through Tests:</span>
              <strong style={{ color: 'var(--accent-primary)' }}>{skillsOverview.verifiedCount} verified</strong>
            </div>
          </div>
        </div>

        {/* Assessment Pass Rate */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-md)',
          padding: '22px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
              Technical Assessments
            </span>
            <span className="badge badge-default">
              75% Pass Standard
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '38px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {assessmentStats.passRate}%
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              ({assessmentStats.passedAttempts} / {assessmentStats.totalAttempts} passed)
            </span>
          </div>

          <div className="progress-bar-track" style={{ marginBottom: '12px' }}>
            <div
              className={`progress-bar-fill ${assessmentStats.passRate >= 75 ? 'success' : 'warning'}`}
              style={{ width: `${assessmentStats.passRate}%` }}
            />
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Modules require 75% or higher to be marked completed.
          </div>
        </div>
      </div>

      {/* Main Content Grid: Roadmap Progress & Gap Analysis */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '28px', marginBottom: '32px' }}>
        {/* Left Column: Dual Roadmap Progress */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 className="editorial-title" style={{ fontSize: '19px' }}>
              Active Learning Roadmaps
            </h2>
            <Link to="/roadmaps" style={{ fontSize: '12.5px', color: 'var(--accent-primary)', fontWeight: 600 }}>
              View all modules →
            </Link>
          </div>

          {/* Roadmap A Progress Card */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '18px 20px',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div>
                <span className="badge badge-default" style={{ marginBottom: '6px' }}>Roadmap A</span>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {roadmapProgress.existingSkills?.title || 'Existing Skills Validation'}
                </div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13.5px', fontWeight: 600 }}>
                {roadmapProgress.existingSkills?.completed} / {roadmapProgress.existingSkills?.total} Done
              </span>
            </div>

            <div className="progress-bar-track" style={{ marginBottom: '10px' }}>
              <div
                className="progress-bar-fill"
                style={{ width: `${roadmapProgress.existingSkills?.percentage || 0}%` }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span>Concept validation & advanced exercises</span>
              <span>{roadmapProgress.existingSkills?.percentage || 0}% completed</span>
            </div>
          </div>

          {/* Roadmap B Progress Card */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '18px 20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div>
                <span className="badge badge-accent" style={{ marginBottom: '6px' }}>Roadmap B</span>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {roadmapProgress.missingSkills?.title || 'Missing Skills Learning Path'}
                </div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13.5px', fontWeight: 600 }}>
                {roadmapProgress.missingSkills?.completed} / {roadmapProgress.missingSkills?.total} Done
              </span>
            </div>

            <div className="progress-bar-track" style={{ marginBottom: '10px' }}>
              <div
                className="progress-bar-fill success"
                style={{ width: `${roadmapProgress.missingSkills?.percentage || 0}%` }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span>Prerequisite-ordered gap bridging</span>
              <span>{roadmapProgress.missingSkills?.percentage || 0}% completed</span>
            </div>
          </div>

          {/* Weak Topics Revision Recommendation */}
          <div style={{ marginTop: '28px' }}>
            <h3 className="editorial-title" style={{ fontSize: '17px', marginBottom: '12px' }}>
              Areas Requiring Revision
            </h3>
            {assessmentStats.weakTopics.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {assessmentStats.weakTopics.map((wt, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: 'var(--status-warning-bg)',
                      border: '1px solid var(--status-warning-border)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12.5px',
                      color: 'var(--status-warning-text)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <AlertTriangle size={13} />
                    <span>{wt.topic}</span>
                    <span style={{ fontSize: '11px', opacity: 0.8 }}>({wt.occurrences} misses)</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-subtle)',
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
              }}>
                No critical weak topics recorded yet. Complete module assessments to detect knowledge gaps.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Latest Job Analysis Snapshot & Recent Assessments */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 className="editorial-title" style={{ fontSize: '19px' }}>
              Target Job Match Snapshot
            </h2>
            <Link to="/job-analysis" style={{ fontSize: '12.5px', color: 'var(--accent-primary)', fontWeight: 600 }}>
              Analysis history →
            </Link>
          </div>

          {latestJobAnalysis ? (
            <div style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              padding: '20px',
              marginBottom: '28px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {latestJobAnalysis.title}
                </span>
                <span className="badge badge-accent">
                  {latestJobAnalysis.matchScore}% Match
                </span>
              </div>
              {latestJobAnalysis.company && (
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  {latestJobAnalysis.company}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Matched Skills
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--status-success-text)' }}>
                    {skillsOverview.matchedSkillsCount}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Skill Gaps (Missing)
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--status-danger-text)' }}>
                    {skillsOverview.missingSkillsCount}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <Link
                  to={`/job-analysis`}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%' }}
                >
                  <span>Review Detailed Gap Breakdown</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ) : (
            <div style={{
              padding: '24px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px dashed var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              textAlign: 'center',
              marginBottom: '28px',
            }}>
              <FileText size={24} color="var(--text-muted)" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                No Job Description Analyzed Yet
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Paste a target job description or upload a JD PDF to identify skill gaps.
              </p>
              <Link to="/job-analysis" className="btn btn-primary btn-sm">
                Analyze First Job Description
              </Link>
            </div>
          )}

          {/* Recent Assessments Table */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 className="editorial-title" style={{ fontSize: '17px' }}>
                Recent Assessments
              </h3>
              <Link to="/assessments/history" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                All attempts
              </Link>
            </div>

            {assessmentStats.recentAssessments.length > 0 ? (
              <div className="table-container">
                <table className="editorial-table">
                  <thead>
                    <tr>
                      <th>Module ID</th>
                      <th>Score</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessmentStats.recentAssessments.map((a) => (
                      <tr key={a._id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px' }}>
                          {a.moduleId}
                        </td>
                        <td>
                          <strong>{a.percentage}%</strong> ({a.score}/{a.maxScore})
                        </td>
                        <td>
                          {a.passed ? (
                            <span className="badge badge-success">Passed</span>
                          ) : (
                            <span className="badge badge-danger">Retake</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', padding: '12px', backgroundColor: 'var(--bg-subtle)' }}>
                No assessment attempts recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
