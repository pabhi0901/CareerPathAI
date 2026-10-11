import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import {
  Compass,
  CheckCircle2,
  Lock,
  ArrowRight,
  Clock,
  Layers,
  BookOpen,
  AlertTriangle,
  Award,
} from 'lucide-react';

export const RoadmapOverview = () => {
  const [searchParams] = useSearchParams();
  const analysisIdParam = searchParams.get('analysisId');

  const [roadmaps, setRoadmaps] = useState([]);
  const [activeTab, setActiveTab] = useState('missing_skills'); // 'missing_skills' | 'existing_skills'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRoadmaps = async () => {
    try {
      setLoading(true);
      let url = '/dashboard';
      const dashRes = await api.get(url);

      if (dashRes.data.success && dashRes.data.metrics?.latestJobAnalysis) {
        const jaId = analysisIdParam || dashRes.data.metrics.latestJobAnalysis._id;
        const res = await api.get(`/roadmaps/analysis/${jaId}`);
        if (res.data.success) {
          setRoadmaps(res.data.roadmaps);
        }
      }
    } catch (err) {
      setError('Failed to fetch learning roadmaps.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmaps();
  }, [analysisIdParam]);

  const existingRoadmap = roadmaps.find((r) => r.roadmapType === 'existing_skills');
  const missingRoadmap = roadmaps.find((r) => r.roadmapType === 'missing_skills');

  const currentRoadmap = activeTab === 'missing_skills' ? missingRoadmap : existingRoadmap;

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
            Curriculum & Milestones
          </span>
          <h1 className="editorial-title" style={{ fontSize: '28px', marginTop: '2px' }}>
            Personalized Learning Roadmaps
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Structured paths with prerequisite sequencing, verified documentation, and technical assessment gates.
          </p>
        </div>

        <Link to="/job-analysis" className="btn btn-secondary">
          <span>Target Another Role</span>
        </Link>
      </div>

      {error && (
        <div className="notice-box notice-danger">
          <AlertTriangle size={16} />
          <div>{error}</div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading personalized syllabus...
        </div>
      ) : roadmaps.length === 0 ? (
        <div style={{
          padding: '48px 24px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px dashed var(--border-medium)',
          borderRadius: 'var(--radius-sm)',
          textAlign: 'center',
        }}>
          <Compass size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <h2 className="editorial-title" style={{ fontSize: '20px', marginBottom: '8px' }}>
            No Active Roadmaps Found
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 20px' }}>
            To generate your dual roadmaps (Roadmap A: Existing Skills and Roadmap B: Missing Skills), run a job analysis on your target role.
          </p>
          <Link to="/job-analysis" className="btn btn-primary">
            Start Job Analysis
          </Link>
        </div>
      ) : (
        <div>
          {/* Dual Roadmap Tabs */}
          <div style={{
            display: 'flex',
            gap: '12px',
            borderBottom: '1px solid var(--border-medium)',
            marginBottom: '28px',
          }}>
            <button
              onClick={() => setActiveTab('missing_skills')}
              style={{
                padding: '12px 18px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'missing_skills' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                color: activeTab === 'missing_skills' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: activeTab === 'missing_skills' ? 600 : 500,
                fontSize: '14.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
              }}
            >
              <span className="badge badge-accent">Roadmap B</span>
              <span>Missing Skills Path ({missingRoadmap?.modules?.length || 0} Modules)</span>
            </button>

            <button
              onClick={() => setActiveTab('existing_skills')}
              style={{
                padding: '12px 18px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'existing_skills' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                color: activeTab === 'existing_skills' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: activeTab === 'existing_skills' ? 600 : 500,
                fontSize: '14.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
              }}
            >
              <span className="badge badge-default">Roadmap A</span>
              <span>Existing Skills Validation ({existingRoadmap?.modules?.length || 0} Modules)</span>
            </button>
          </div>

          {/* Active Roadmap Description Banner */}
          {currentRoadmap && (
            <div style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              padding: '20px 24px',
              marginBottom: '28px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 className="editorial-title" style={{ fontSize: '20px' }}>
                    {currentRoadmap.title}
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {currentRoadmap.description}
                  </p>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  Estimated total: <strong>{currentRoadmap.studyConstraintDetails?.totalEstimatedWeeks || 4} Weeks</strong>
                </div>
              </div>
            </div>
          )}

          {/* Modules List in Prerequisite Order */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {currentRoadmap?.modules?.map((mod, index) => {
              const status = mod.progress?.status === 'completed' ? 'completed' : mod.progress?.status === 'in_progress' ? 'in_progress' : 'unlocked';
              const isCompleted = status === 'completed';
              const bestScore = mod.progress?.bestScorePercentage || 0;

              return (
                <div
                  key={mod.moduleId}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '20px 24px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: isCompleted ? 'var(--status-success-bg)' : 'var(--accent-light)',
                        color: isCompleted ? 'var(--status-success-text)' : 'var(--accent-text)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '13px',
                      }}>
                        {isCompleted ? <CheckCircle2 size={16} /> : mod.order}
                      </span>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {mod.title}
                          </h3>
                          {isCompleted && (
                            <span className="badge badge-success">
                              Completed ({bestScore}%)
                            </span>
                          )}
                          {status === 'in_progress' && (
                            <span className="badge badge-warning">
                              In Progress
                            </span>
                          )}
                          {!isCompleted && status !== 'in_progress' && (
                            <span className="badge badge-accent">
                              Unlocked
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {mod.purpose}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={13} /> {mod.estimatedStudyDuration}
                      </span>

                      <Link
                        to={`/roadmaps/${currentRoadmap._id}/module/${mod.moduleId}`}
                        className="btn btn-secondary btn-sm"
                      >
                        <span>{isCompleted ? 'Review Module' : 'Study & Take Assessment'}</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>

                  {/* Topics Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                    {mod.topics?.map((topic, tIdx) => (
                      <span key={tIdx} className="badge badge-default" style={{ fontSize: '11.5px' }}>
                        {topic}
                      </span>
                    ))}

                    {mod.prerequisites?.length > 0 && (
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                        Prerequisites: {mod.prerequisites.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
