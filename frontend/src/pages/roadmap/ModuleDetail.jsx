import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import {
  BookOpen,
  CheckCircle2,
  Lock,
  Clock,
  ArrowLeft,
  ExternalLink,
  Code,
  CheckSquare,
  Sparkles,
  HelpCircle,
  FileCode,
  AlertCircle,
  Award,
} from 'lucide-react';
import { CodeBlock } from '../../components/common/CodeBlock';

export const ModuleDetail = () => {
  const { roadmapId, moduleId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchModule = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/roadmaps/${roadmapId}/module/${moduleId}`);
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load module details.');
      } finally {
        setLoading(false);
      }
    };
    fetchModule();
  }, [roadmapId, moduleId]);

  if (loading) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading comprehensive study guide...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="notice-box notice-danger">
        <AlertCircle size={16} />
        <div>{error || 'Module not found.'}</div>
      </div>
    );
  }

  const { module, roadmap, progress, attempts, hasAssessment } = data;
  const isCompleted = progress?.status === 'completed';

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Back to Roadmap navigation */}
      <div style={{ marginBottom: '20px' }}>
        <Link
          to={`/roadmaps`}
          className="btn btn-ghost btn-sm"
          style={{ padding: '4px 8px', color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={14} />
          <span>Back to Roadmap Overview</span>
        </Link>
      </div>

      {/* Module Editorial Title Header */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-sm)',
        padding: '28px',
        marginBottom: '28px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-default">
                {roadmap.roadmapType === 'missing_skills' ? 'Roadmap B' : 'Roadmap A'}
              </span>
              <span className="badge badge-default font-mono">
                {module.moduleId}
              </span>
              {isCompleted ? (
                <span className="badge badge-success">
                  <CheckCircle2 size={12} /> Completed ({progress?.bestScorePercentage}%)
                </span>
              ) : (
                <span className="badge badge-warning">
                  Pending Assessment (75% to pass)
                </span>
              )}
            </div>

            <h1 className="editorial-title" style={{ fontSize: '26px' }}>
              {module.title}
            </h1>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.55 }}>
              {module.purpose}
            </p>
          </div>

          {/* Assessment Launcher Button */}
          <Link
            to={`/assessments/${roadmapId}/${moduleId}`}
            className="btn btn-primary"
            style={{ padding: '10px 18px' }}
          >
            <CheckSquare size={16} />
            <span>{isCompleted ? 'Retake Assessment' : 'Launch Module Assessment'}</span>
          </Link>
        </div>

        {/* Duration & Metadata Bar */}
        <div style={{
          display: 'flex',
          gap: '24px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '12.5px',
          color: 'var(--text-muted)',
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} />
            <span>Estimated Study: <strong>{module.estimatedStudyDuration}</strong></span>
          </div>

          <div>
            <span>Attempts: <strong>{attempts.length}</strong></span>
          </div>

          <div>
            <span>Passing Threshold: <strong>75% or higher</strong></span>
          </div>
        </div>
      </div>

      {/* Curriculum Outline / Topics Sequence */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-sm)',
        padding: '24px',
        marginBottom: '28px',
      }}>
        <h2 className="editorial-title" style={{ fontSize: '18px', marginBottom: '14px' }}>
          Logical Learning Sequence & Topics
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Core Topics
            </div>
            <ul style={{ listStyle: 'none' }}>
              {module.topics?.map((topic, i) => (
                <li key={i} style={{ fontSize: '13px', color: 'var(--text-primary)', padding: '5px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <strong>{i + 1}.</strong> {topic}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Subtopics & Mechanistic Concepts
            </div>
            <ul style={{ listStyle: 'none' }}>
              {module.subtopics?.map((sub, i) => (
                <li key={i} style={{ fontSize: '12.5px', color: 'var(--text-secondary)', padding: '4px 0' }}>
                  • {sub}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Detailed Technical Guide / Walkthrough */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-sm)',
        padding: '28px',
        marginBottom: '28px',
      }}>
        <h2 className="editorial-title" style={{ fontSize: '20px', marginBottom: '16px' }}>
          Comprehensive Concept Walkthrough
        </h2>

        <div style={{
          fontSize: '14.5px',
          lineHeight: 1.75,
          color: 'var(--text-secondary)',
          whiteSpace: 'pre-line',
          marginBottom: '24px',
        }}>
          {module.detailedExplanation}
        </div>

        {/* Practical Applications */}
        {module.practicalApplications?.length > 0 && (
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
            <h3 className="editorial-title" style={{ fontSize: '16px', marginBottom: '10px' }}>
              Production & Enterprise Applications
            </h3>
            <ul style={{ paddingLeft: '20px', fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {module.practicalApplications.map((app, i) => (
                <li key={i} style={{ marginBottom: '6px' }}>{app}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Code Snippets Section */}
      {module.codeSnippets?.length > 0 && (
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-sm)',
          padding: '24px',
          marginBottom: '28px',
        }}>
          <h2 className="editorial-title" style={{ fontSize: '18px', marginBottom: '16px' }}>
            Production Code Patterns & Examples
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {module.codeSnippets.map((snippet, idx) => (
              <div key={idx} style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                <CodeBlock
                  code={snippet.code}
                  language={snippet.language || 'javascript'}
                  title={snippet.title}
                />

                {snippet.explanation && (
                  <div style={{ padding: '12px 14px', fontSize: '12.5px', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-surface)' }}>
                    <strong>Explanation:</strong> {snippet.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Practice Exercises */}
      {module.practiceExercises?.length > 0 && (
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-sm)',
          padding: '24px',
          marginBottom: '28px',
        }}>
          <h2 className="editorial-title" style={{ fontSize: '18px', marginBottom: '16px' }}>
            Hands-on Engineering Challenges
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {module.practiceExercises.map((ex, idx) => (
              <div
                key={idx}
                style={{
                  padding: '16px',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-main)',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Exercise {idx + 1}: {ex.title}
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  <strong>Task:</strong> {ex.task || ex.description}
                </p>
                {ex.solutionHint && (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <strong>Hint:</strong> {ex.solutionHint}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verified Curated Resources */}
      {module.curatedResources?.length > 0 && (
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-sm)',
          padding: '24px',
          marginBottom: '32px',
        }}>
          <h2 className="editorial-title" style={{ fontSize: '18px', marginBottom: '14px' }}>
            Verified Documentation & Learning References
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {module.curatedResources.map((res, idx) => (
              <a
                key={idx}
                href={res.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <div>
                  <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>
                    {res.title}
                  </strong>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {res.description}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)', fontSize: '12.5px' }}>
                  <span>Official Reference</span>
                  <ExternalLink size={13} />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Launch Assessment Callout */}
      <div style={{
        padding: '24px',
        backgroundColor: 'var(--accent-light)',
        border: '1px solid var(--accent-border)',
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '40px',
      }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--accent-text)', marginBottom: '4px' }}>
            Ready to Validate Your Knowledge?
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--accent-text)', opacity: 0.9 }}>
            Take the module assessment. Passing score is 75% (e.g. 15/20). Module unlocks subsequent milestones only upon passing.
          </p>
        </div>

        <Link
          to={`/assessments/${roadmapId}/${moduleId}`}
          className="btn btn-primary"
          style={{ padding: '10px 20px' }}
        >
          <CheckSquare size={16} />
          <span>Take Module Assessment</span>
        </Link>
      </div>
    </div>
  );
};
