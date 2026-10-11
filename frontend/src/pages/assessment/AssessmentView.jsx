import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import { useLoading } from '../../context/LoadingContext';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckSquare,
  Award,
  BookOpen,
  Info,
} from 'lucide-react';
import { CodeBlock } from '../../components/common/CodeBlock';

export const AssessmentView = () => {
  const { roadmapId, moduleId } = useParams();
  const { startOperation, endOperation } = useLoading();

  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Student active answers: map of questionId -> selectedOptionIndex (0-3)
  const [selectedAnswers, setSelectedAnswers] = useState({});

  // Submission result state (when test is finished)
  const [submissionResult, setSubmissionResult] = useState(null);

  const fetchAssessment = async () => {
    try {
      setLoading(true);
      startOperation('Generating or fetching technical assessment questions...');
      setError('');
      setSubmissionResult(null);
      setSelectedAnswers({});

      const res = await api.get(`/assessments/${roadmapId}/${moduleId}`);
      if (res.data.success) {
        setAssessment(res.data.assessment);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate or load assessment questions.');
    } finally {
      setLoading(false);
      endOperation();
    }
  };

  useEffect(() => {
    fetchAssessment();
  }, [roadmapId, moduleId]);

  const handleSelectOption = (questionId, optionIndex) => {
    if (submissionResult) return; // Read-only after submission
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!assessment) return;

    // Check unanswered questions
    const answeredCount = Object.keys(selectedAnswers).length;
    if (answeredCount < assessment.questions.length) {
      if (!window.confirm(`You have answered ${answeredCount} of ${assessment.questions.length} questions. Do you want to submit anyway?`)) {
        return;
      }
    }

    setSubmitting(true);
    startOperation('Evaluating assessment answers and updating proficiency...');
    setError('');

    const formattedAnswers = Object.entries(selectedAnswers).map(([questionId, selectedOptionIndex]) => ({
      questionId,
      selectedOptionIndex,
    }));

    try {
      const res = await api.post(`/assessments/${roadmapId}/${moduleId}/submit`, {
        answers: formattedAnswers,
      });

      if (res.data.success) {
        setSubmissionResult(res.data.result);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit assessment answers.');
    } finally {
      setSubmitting(false);
      endOperation();
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        <CheckSquare size={32} style={{ margin: '0 auto 12px', opacity: 0.6 }} />
        <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
          Generating Technical Assessment...
        </div>
        <div style={{ fontSize: '12.5px' }}>
          Validating option distractors and answer key consistency
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="notice-box notice-danger">
          <AlertTriangle size={16} />
          <div>{error || 'Assessment not available.'}</div>
        </div>
        <Link to={`/roadmaps/${roadmapId}/module/${moduleId}`} className="btn btn-secondary">
          <ArrowLeft size={14} />
          <span>Back to Module</span>
        </Link>
      </div>
    );
  }

  const answeredCount = Object.keys(selectedAnswers).length;
  const totalQuestions = assessment.questions.length;

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto' }}>
      {/* Navigation link back to module */}
      <div style={{ marginBottom: '16px' }}>
        <Link
          to={`/roadmaps/${roadmapId}/module/${moduleId}`}
          className="btn btn-ghost btn-sm"
          style={{ padding: '4px 8px', color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={14} />
          <span>Back to Module Study Guide</span>
        </Link>
      </div>

      {/* RESULT BANNER (Shown After Submission) */}
      {submissionResult && (
        <div style={{
          backgroundColor: submissionResult.passed ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
          border: `1px solid ${submissionResult.passed ? 'var(--status-success-border)' : 'var(--status-danger-border)'}`,
          borderRadius: 'var(--radius-sm)',
          padding: '24px',
          marginBottom: '32px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                {submissionResult.passed ? (
                  <CheckCircle2 size={24} color="var(--status-success-text)" />
                ) : (
                  <XCircle size={24} color="var(--status-danger-text)" />
                )}
                <h2 style={{
                  fontSize: '22px',
                  fontWeight: 600,
                  color: submissionResult.passed ? 'var(--status-success-text)' : 'var(--status-danger-text)',
                }}>
                  {submissionResult.passed ? 'Assessment Passed (75% Standard Met)' : 'Assessment Not Passed'}
                </h2>
              </div>

              <p style={{
                fontSize: '13.5px',
                color: submissionResult.passed ? 'var(--status-success-text)' : 'var(--status-danger-text)',
                lineHeight: 1.5,
              }}>
                {submissionResult.passed
                  ? `Outstanding! You achieved ${submissionResult.percentage}% (required: 75%). Module marked complete and dependent milestones unlocked.`
                  : `You scored ${submissionResult.percentage}% (${submissionResult.correctCount}/${submissionResult.totalQuestions} correct). The passing threshold is 75%. Please review the explanations below and retake.`}
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '38px',
                fontWeight: 600,
                color: submissionResult.passed ? 'var(--status-success-text)' : 'var(--status-danger-text)',
              }}>
                {submissionResult.percentage}%
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Attempt #{submissionResult.attemptNumber}
              </div>
            </div>
          </div>

          {/* Topic Performance Breakdown */}
          {submissionResult.topicBreakdown?.length > 0 && (
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '10px' }}>
                Topic-by-Topic Performance Breakdown
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                {submissionResult.topicBreakdown.map((t, i) => (
                  <div key={i} style={{
                    padding: '8px 12px',
                    backgroundColor: 'rgba(255,255,255,0.7)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12.5px',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}>
                    <span>{t.topic}:</span>
                    <strong>{t.correctQuestions}/{t.totalQuestions} ({t.percentage}%)</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button
              onClick={fetchAssessment}
              className="btn btn-secondary btn-sm"
            >
              <RotateCcw size={14} />
              <span>Retry Assessment (Attempt #{submissionResult.attemptNumber + 1})</span>
            </button>
            <Link
              to={`/roadmaps/${roadmapId}/module/${moduleId}`}
              className="btn btn-ghost btn-sm"
              style={{ border: '1px solid var(--border-medium)' }}
            >
              <BookOpen size={14} />
              <span>Revisit Module Study Guide</span>
            </Link>
          </div>
        </div>
      )}

      {/* Active Assessment Header */}
      {!submissionResult && (
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-sm)',
          padding: '24px',
          marginBottom: '28px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span className="badge badge-default" style={{ marginBottom: '6px' }}>
                Attempt #{assessment.attemptNumber}
              </span>
              <h1 className="editorial-title" style={{ fontSize: '24px' }}>
                {assessment.moduleTitle} — Technical Assessment
              </h1>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Answer all {totalQuestions} multiple-choice questions. Score at least 75% to pass and complete the module.
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {answeredCount} / {totalQuestions} Answered
              </div>
              <div className="progress-bar-track" style={{ width: '120px', marginTop: '6px' }}>
                <div
                  className="progress-bar-fill"
                  style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Questions Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
          {(submissionResult ? submissionResult.evaluatedAnswers : assessment.questions).map((q, qIndex) => {
            const isEvaluated = Boolean(submissionResult);
            const studentSelected = isEvaluated ? q.selectedOptionIndex : selectedAnswers[q.questionId];

            return (
              <div
                key={q.questionId}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: isEvaluated
                    ? q.isCorrect
                      ? '1px solid var(--status-success-border)'
                      : '1px solid var(--status-danger-border)'
                    : '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '22px 24px',
                }}
              >
                {/* Question Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontWeight: 700,
                      fontSize: '14px',
                      color: isEvaluated
                        ? q.isCorrect ? 'var(--status-success-text)' : 'var(--status-danger-text)'
                        : 'var(--text-muted)',
                    }}>
                      Question {qIndex + 1}
                    </span>
                    <span className="badge badge-default" style={{ fontSize: '11px' }}>
                      {q.topic}
                    </span>
                  </div>

                  {isEvaluated && (
                    <span>
                      {q.isCorrect ? (
                        <span className="badge badge-success">
                          <CheckCircle2 size={12} /> Correct (+{q.marksAwarded} pt)
                        </span>
                      ) : (
                        <span className="badge badge-danger">
                          <XCircle size={12} /> Incorrect (0 pt)
                        </span>
                      )}
                    </span>
                  )}
                </div>

                {/* Question Text */}
                <p style={{
                  fontSize: '14.5px',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  lineHeight: 1.55,
                  marginBottom: q.codeSnippet ? '10px' : '16px',
                }}>
                  {q.questionText}
                </p>

                {/* Separate Dedicated Code Block */}
                {q.codeSnippet && q.codeSnippet.trim() && (
                  <CodeBlock
                    code={q.codeSnippet}
                    language={q.codeLanguage || 'javascript'}
                  />
                )}

                {/* 4 Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {q.options.map((option, optIndex) => {
                    const isSelected = studentSelected === optIndex;
                    const isCorrectAnswer = isEvaluated && q.correctAnswerIndex === optIndex;
                    const isWrongSelection = isEvaluated && isSelected && !q.isCorrect;

                    let optionBg = 'var(--bg-main)';
                    let optionBorder = 'var(--border-subtle)';
                    let optionColor = 'var(--text-primary)';

                    if (isEvaluated) {
                      if (isCorrectAnswer) {
                        optionBg = 'var(--status-success-bg)';
                        optionBorder = 'var(--status-success-border)';
                        optionColor = 'var(--status-success-text)';
                      } else if (isWrongSelection) {
                        optionBg = 'var(--status-danger-bg)';
                        optionBorder = 'var(--status-danger-border)';
                        optionColor = 'var(--status-danger-text)';
                      }
                    } else if (isSelected) {
                      optionBg = 'var(--accent-light)';
                      optionBorder = 'var(--accent-primary)';
                      optionColor = 'var(--accent-text)';
                    }

                    return (
                      <div
                        key={optIndex}
                        onClick={() => !isEvaluated && handleSelectOption(q.questionId, optIndex)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '11px 14px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: optionBg,
                          border: `1px solid ${optionBorder}`,
                          cursor: isEvaluated ? 'default' : 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: `1.5px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-strong)'}`,
                          backgroundColor: isSelected ? 'var(--accent-primary)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: isSelected ? '#FFFFFF' : 'var(--text-muted)',
                          flexShrink: 0,
                        }}>
                          {['A', 'B', 'C', 'D'][optIndex]}
                        </span>

                        <span style={{ fontSize: '13.5px', color: optionColor, flex: 1 }}>
                          {option}
                        </span>

                        {isCorrectAnswer && (
                          <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--status-success-text)' }}>
                            ✓ Correct Answer
                          </span>
                        )}
                        {isWrongSelection && (
                          <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--status-danger-text)' }}>
                            ✗ Your Answer
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Post-Submission Explanation */}
                {isEvaluated && q.explanation && (
                  <div style={{
                    marginTop: '14px',
                    padding: '12px 14px',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12.5px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                  }}>
                    <strong>Explanation:</strong> {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit Actions Bar */}
        {!submissionResult && (
          <div style={{
            position: 'sticky',
            bottom: '20px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          }}>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {answeredCount} of {totalQuestions} questions completed
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Backend calculates score independently against the 75% rule.
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ padding: '10px 24px' }}
            >
              <span>{submitting ? 'Evaluating Submission...' : 'Submit Assessment'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
