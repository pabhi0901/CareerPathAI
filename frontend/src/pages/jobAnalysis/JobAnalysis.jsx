import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useLoading } from '../../context/LoadingContext';
import {
  Briefcase,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Compass,
  ArrowRight,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const JobAnalysis = () => {
  const navigate = useNavigate();
  const { startOperation, endOperation } = useLoading();
  const [analyses, setAnalyses] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);

  // Form input states
  const [inputTab, setInputTab] = useState('text'); // 'text' | 'pdf'
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobText, setJobText] = useState('');
  const [jdFile, setJdFile] = useState(null);
  const [missingSkillsInput, setMissingSkillsInput] = useState('');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/job-analysis');
      if (res.data.success) {
        setAnalyses(res.data.analyses);
        if (res.data.analyses.length > 0 && !selectedAnalysis) {
          // Fetch full latest analysis
          const fullRes = await api.get(`/job-analysis/${res.data.analyses[0]._id}`);
          if (fullRes.data.success) {
            setSelectedAnalysis(fullRes.data.analysis);
          }
        }
      }
    } catch (err) {
      setError('Failed to fetch job analyses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const handleSelectAnalysis = async (id) => {
    try {
      const res = await api.get(`/job-analysis/${id}`);
      if (res.data.success) {
        setSelectedAnalysis(res.data.analysis);
      }
    } catch (err) {
      setError('Failed to load selected analysis details.');
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setAnalyzing(true);
    setMessage('');
    setError('');

    const formData = new FormData();
    formData.append('title', jobTitle);
    formData.append('company', companyName);
    if (missingSkillsInput) {
      formData.append('userAddedMissingSkills', missingSkillsInput);
    }

    if (inputTab === 'pdf') {
      if (!jdFile) {
        setError('Please select a PDF file containing the job description.');
        setAnalyzing(false);
        return;
      }
      formData.append('jobPdf', jdFile);
    } else {
      if (!jobText.trim() || jobText.trim().length < 30) {
        setError('Please enter at least 30 characters of job description text.');
        setAnalyzing(false);
        return;
      }
      formData.append('jobDescriptionText', jobText);
    }

    setAnalyzing(true);
    startOperation('Analyzing job description and matching skills...');

    try {
      const res = await api.post('/job-analysis/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setMessage('Job description analyzed and matched successfully!');
        setSelectedAnalysis(res.data.analysis);
        // Clear form
        setJobText('');
        setJdFile(null);
        setJobTitle('');
        setCompanyName('');
        setMissingSkillsInput('');
        fetchAnalyses();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze job description.');
    } finally {
      setAnalyzing(false);
      endOperation();
    }
  };

  const handleGenerateRoadmap = async () => {
    if (!selectedAnalysis) return;
    setGeneratingRoadmap(true);
    startOperation('Generating personalized roadmaps...');
    setError('');
    try {
      const res = await api.post(`/roadmaps/generate/${selectedAnalysis._id}`);
      if (res.data.success) {
        navigate('/roadmaps');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate personalized roadmaps.');
    } finally {
      setGeneratingRoadmap(false);
      endOperation();
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <span style={{
          fontSize: '11.5px',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--text-muted)',
          fontWeight: 600,
        }}>
          Target Role Alignment
        </span>
        <h1 className="editorial-title" style={{ fontSize: '28px', marginTop: '2px' }}>
          Job Description Input & Skill Gap Analysis
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Extract role requirements, compare against confirmed profile skills, and generate historical snapshots.
        </p>
      </div>

      {message && (
        <div className="notice-box notice-success">
          <CheckCircle2 size={16} />
          <div>{message}</div>
        </div>
      )}

      {error && (
        <div className="notice-box notice-danger">
          <AlertTriangle size={16} />
          <div>{error}</div>
        </div>
      )}

      {/* Input Section */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-sm)',
        padding: '24px',
        marginBottom: '32px',
      }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
          <button
            type="button"
            onClick={() => setInputTab('text')}
            className={`btn btn-sm ${inputTab === 'text' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <FileText size={14} />
            <span>Paste Job Description Text</span>
          </button>
          <button
            type="button"
            onClick={() => setInputTab('pdf')}
            className={`btn btn-sm ${inputTab === 'pdf' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <Upload size={14} />
            <span>Upload Job Description PDF</span>
          </button>
        </div>

        <form onSubmit={handleAnalyze}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div>
              <label className="form-label" htmlFor="jobTitle">Job Title / Role</label>
              <input
                id="jobTitle"
                type="text"
                className="form-input"
                placeholder="e.g. Senior Backend Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="companyName">Target Company (Optional)</label>
              <input
                id="companyName"
                type="text"
                className="form-input"
                placeholder="e.g. Stripe, Amazon, Flipkart"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
          </div>

          {inputTab === 'text' ? (
            <div className="form-group">
              <label className="form-label" htmlFor="jobText">Job Description Content</label>
              <textarea
                id="jobText"
                className="form-textarea"
                rows={7}
                placeholder="Paste the full job description text here, including requirements, responsibilities, tech stack, and qualifications..."
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
                required
              />
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Job Description PDF Document</label>
              <label style={{
                border: '1px dashed var(--border-strong)',
                padding: '24px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'block',
                textAlign: 'center',
                backgroundColor: 'var(--bg-subtle)',
              }}>
                <Upload size={24} color="var(--text-secondary)" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: '13.5px', fontWeight: 500 }}>
                  {jdFile ? jdFile.name : 'Click to select Job Description PDF'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Supports up to 15MB PDF files
                </div>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => setJdFile(e.target.files?.[0] || null)}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="missingSkillsInput">
              Additional Skills to Check (Optional)
            </label>
            <input
              id="missingSkillsInput"
              type="text"
              className="form-input"
              placeholder="e.g. GraphQL, Next.js, Kubernetes (comma-separated skills you believe might be needed)"
              value={missingSkillsInput}
              onChange={(e) => setMissingSkillsInput(e.target.value)}
            />
            <div className="form-hint">
              Optionally specify technologies you want the model to evaluate against the role.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={analyzing}
            >
              <Sparkles size={16} />
              <span>{analyzing ? 'Analyzing Job Requirements...' : 'Analyze Job Description & Match Skills'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Main Analysis Display & History */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', alignItems: 'flex-start' }}>
        {/* Left: Analysis History Snapshots List */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-sm)',
          padding: '16px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Historical Snapshots ({analyses.length})
          </div>

          {loading ? (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
              Loading...
            </div>
          ) : analyses.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {analyses.map((a) => (
                <button
                  key={a._id}
                  onClick={() => handleSelectAnalysis(a._id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'left',
                    backgroundColor: selectedAnalysis?._id === a._id ? 'var(--accent-light)' : 'transparent',
                    border: selectedAnalysis?._id === a._id ? '1px solid var(--accent-border)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {a.title}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    <span>{a.matchResults?.overallMatchScore || 0}% match</span>
                    <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
              No previous analyses.
            </div>
          )}
        </div>

        {/* Right: Detailed Match Results & Generate Roadmap Action */}
        {selectedAnalysis ? (
          <div>
            {/* Analysis Header Card */}
            <div style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              marginBottom: '24px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <span className="badge badge-default" style={{ marginBottom: '6px' }}>
                    Snapshot: {new Date(selectedAnalysis.createdAt).toLocaleDateString()}
                  </span>
                  <h2 className="editorial-title" style={{ fontSize: '24px' }}>
                    {selectedAnalysis.title} {selectedAnalysis.company ? `(${selectedAnalysis.company})` : ''}
                  </h2>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Target Role: <strong>{selectedAnalysis.extractedRequirements?.targetRole || 'Not specified'}</strong>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {selectedAnalysis.matchResults?.overallMatchScore}%
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Overall Requirement Match
                  </div>
                </div>
              </div>

              {/* Analysis Summary */}
              {selectedAnalysis.matchResults?.analysisSummary && (
                <div style={{
                  padding: '14px 16px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  lineHeight: 1.55,
                  color: 'var(--text-secondary)',
                  marginBottom: '20px',
                }}>
                  {selectedAnalysis.matchResults.analysisSummary}
                </div>
              )}

              {/* Action: Generate My Roadmap */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-subtle)',
                flexWrap: 'wrap',
                gap: '12px',
              }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Ready to bridge these identified skill gaps?
                </span>

                <button
                  onClick={handleGenerateRoadmap}
                  className="btn btn-primary"
                  disabled={generatingRoadmap}
                >
                  <Compass size={16} />
                  <span>{generatingRoadmap ? 'Generating Personalized Roadmaps...' : 'Generate My Roadmap'}</span>
                </button>
              </div>
            </div>

            {/* Extracted Requirements Breakdown */}
            <div style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              marginBottom: '24px',
            }}>
              <h3 className="editorial-title" style={{ fontSize: '18px', marginBottom: '16px' }}>
                Extracted Job Requirements
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', fontSize: '13px' }}>
                <div>
                  <strong style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Mandatory Technical Skills:
                  </strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {selectedAnalysis.extractedRequirements?.requiredTechnicalSkills?.map((s, i) => (
                      <span key={i} className="badge badge-default font-mono">{s}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <strong style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Preferred / Nice-to-Have Skills:
                  </strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {selectedAnalysis.extractedRequirements?.preferredSkills?.map((s, i) => (
                      <span key={i} className="badge badge-default font-mono">{s}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <strong style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Tools & Technologies:
                  </strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {selectedAnalysis.extractedRequirements?.toolsAndTechnologies?.map((t, i) => (
                      <span key={i} className="badge badge-default font-mono">{t}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <strong style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Experience & Academic Requirements:
                  </strong>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    {selectedAnalysis.extractedRequirements?.experienceRequirements || 'None specified'}
                    <br />
                    {selectedAnalysis.extractedRequirements?.educationalRequirements}
                  </p>
                </div>
              </div>
            </div>

            {/* Four Classified Skill Match Tables */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* 1. Matched Skills */}
              <div style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--status-success-bg)',
                  borderBottom: '1px solid var(--status-success-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <strong style={{ color: 'var(--status-success-text)', fontSize: '13.5px' }}>
                    Matched Skills ({selectedAnalysis.matchResults?.matchedSkills?.length || 0})
                  </strong>
                  <span className="badge badge-success">High Confidence</span>
                </div>
                {selectedAnalysis.matchResults?.matchedSkills?.length > 0 ? (
                  <table className="editorial-table">
                    <thead>
                      <tr>
                        <th>Skill Name</th>
                        <th>Your Proficiency</th>
                        <th>Importance</th>
                        <th>Evidence / Rationale</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAnalysis.matchResults.matchedSkills.map((m, i) => (
                        <tr key={i}>
                          <td><strong>{m.skillName}</strong></td>
                          <td><span className="badge badge-default">{m.studentProficiency || 'Claimed'}</span></td>
                          <td><span className="badge badge-default">{m.importance}</span></td>
                          <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{m.evidenceOrReason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: '14px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    No exact matched skills found.
                  </div>
                )}
              </div>

              {/* 2. Partially Matched or Unverified Skills */}
              <div style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--status-warning-bg)',
                  borderBottom: '1px solid var(--status-warning-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <strong style={{ color: 'var(--status-warning-text)', fontSize: '13.5px' }}>
                    Partially Matched or Unverified Skills ({selectedAnalysis.matchResults?.partiallyMatchedSkills?.length || 0})
                  </strong>
                  <span className="badge badge-warning">Needs Assessment Validation</span>
                </div>
                {selectedAnalysis.matchResults?.partiallyMatchedSkills?.length > 0 ? (
                  <table className="editorial-table">
                    <thead>
                      <tr>
                        <th>Skill Name</th>
                        <th>Student Status</th>
                        <th>Importance</th>
                        <th>Gap Analysis & Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAnalysis.matchResults.partiallyMatchedSkills.map((m, i) => (
                        <tr key={i}>
                          <td><strong>{m.skillName}</strong></td>
                          <td><span className="badge badge-default">{m.studentProficiency || 'Unverified'}</span></td>
                          <td><span className="badge badge-default">{m.importance}</span></td>
                          <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{m.evidenceOrReason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: '14px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    No partial matches.
                  </div>
                )}
              </div>

              {/* 3. Missing Skills */}
              <div style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--status-danger-bg)',
                  borderBottom: '1px solid var(--status-danger-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <strong style={{ color: 'var(--status-danger-text)', fontSize: '13.5px' }}>
                    Critical Missing Skills ({selectedAnalysis.matchResults?.missingSkills?.length || 0})
                  </strong>
                  <span className="badge badge-danger">Roadmap B Priority</span>
                </div>
                {selectedAnalysis.matchResults?.missingSkills?.length > 0 ? (
                  <table className="editorial-table">
                    <thead>
                      <tr>
                        <th>Required Skill</th>
                        <th>Category</th>
                        <th>Importance</th>
                        <th>Requirement Context</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAnalysis.matchResults.missingSkills.map((m, i) => (
                        <tr key={i}>
                          <td><strong>{m.skillName}</strong></td>
                          <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.category}</td>
                          <td><span className="badge badge-default">{m.importance}</span></td>
                          <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{m.evidenceOrReason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: '14px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    No critical missing skills!
                  </div>
                )}
              </div>

              {/* 4. Optional or Preferred Skills */}
              <div style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <strong style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>
                    Optional / Bonus Skills ({selectedAnalysis.matchResults?.optionalSkills?.length || 0})
                  </strong>
                  <span className="badge badge-default">Preferred / Nice-to-Have</span>
                </div>
                {selectedAnalysis.matchResults?.optionalSkills?.length > 0 ? (
                  <table className="editorial-table">
                    <thead>
                      <tr>
                        <th>Skill Name</th>
                        <th>Category</th>
                        <th>Role Context</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAnalysis.matchResults.optionalSkills.map((m, i) => (
                        <tr key={i}>
                          <td><strong>{m.skillName}</strong></td>
                          <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.category}</td>
                          <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{m.evidenceOrReason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: '14px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    No optional skills specified.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            padding: '40px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px dashed var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            textAlign: 'center',
          }}>
            <FileText size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <h3 className="editorial-title" style={{ fontSize: '18px', marginBottom: '6px' }}>
              No Job Analysis Selected
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Paste a job description above or choose a historical snapshot to see the skill gap matrix.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
