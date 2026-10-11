import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLoading } from '../../context/LoadingContext';
import {
  FileText,
  Upload,
  Sparkles,
  ExternalLink,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';

export const ResumeManagement = () => {
  const { refreshUser } = useAuth();
  const { startOperation, endOperation } = useLoading();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Extracted skills review modal/drawer state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [extractedPayload, setExtractedPayload] = useState(null);
  const [reviewSkills, setReviewSkills] = useState([]);
  const [activeResumeId, setActiveResumeId] = useState(null);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/resumes');
      if (res.data.success) {
        setResumes(res.data.resumes);
      }
    } catch (err) {
      setError('Failed to fetch resumes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError('Please select a valid PDF file (.pdf).');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    startOperation('Uploading and processing resume...');
    setMessage('');
    setError('');

    const formData = new FormData();
    formData.append('resume', selectedFile);

    try {
      const res = await api.post('/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setMessage(res.data.message);
        setSelectedFile(null);
        fetchResumes();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload resume to ImageKit.');
    } finally {
      setUploading(false);
      endOperation();
    }
  };

  const handleExtractSkills = async (resumeId = 'latest') => {
    setExtracting(true);
    startOperation('Extracting skills from resume with AI...');
    setMessage('');
    setError('');
    try {
      const res = await api.post(`/resumes/${resumeId}/extract`);
      if (res.data.success) {
        setExtractedPayload(res.data.extractedData);
        setActiveResumeId(res.data.resumeId);

        // Prepopulate review list with selectable skills
        const skillsWithSelection = (res.data.extractedData.skills || []).map((s, idx) => ({
          id: idx,
          name: s.name,
          proficiencyLevel: s.proficiencyLevel || 'Intermediate',
          category: s.category || 'Technical',
          evidenceFromResume: s.evidenceFromResume || '',
          selected: true, // checked by default for user review
        }));

        setReviewSkills(skillsWithSelection);
        setReviewModalOpen(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'AI Skill Extraction failed.');
    } finally {
      setExtracting(false);
      endOperation();
    }
  };

  const toggleSkillSelection = (index) => {
    setReviewSkills((prev) =>
      prev.map((s, idx) => (idx === index ? { ...s, selected: !s.selected } : s))
    );
  };

  const updateSkillProficiency = (index, newLevel) => {
    setReviewSkills((prev) =>
      prev.map((s, idx) => (idx === index ? { ...s, proficiencyLevel: newLevel } : s))
    );
  };

  const handleConfirmSkills = async () => {
    const selected = reviewSkills.filter((s) => s.selected);
    if (selected.length === 0) {
      setError('Please select at least one skill to confirm for your profile.');
      return;
    }

    setConfirming(true);
    startOperation('Confirming skills to student profile...');
    try {
      const res = await api.post(`/resumes/${activeResumeId}/confirm-skills`, {
        selectedSkills: selected,
      });
      if (res.data.success) {
        setMessage(res.data.message);
        setReviewModalOpen(false);
        fetchResumes();
        refreshUser();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm skills to profile.');
    } finally {
      setConfirming(false);
      endOperation();
    }
  };

  const latestResume = resumes.length > 0 ? resumes[0] : null;

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
            Resume Vault
          </span>
          <h1 className="editorial-title" style={{ fontSize: '28px', marginTop: '2px' }}>
            Resume Management & Skill Extraction
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Upload versioned PDF resumes stored in ImageKit, and extract verified skills using AI.
          </p>
        </div>

        {latestResume && (
          <button
            onClick={() => handleExtractSkills('latest')}
            className="btn btn-primary"
            disabled={extracting}
          >
            <Sparkles size={16} />
            <span>{extracting ? 'Extracting Skills with AI...' : 'Extract Skills from Latest Resume'}</span>
          </button>
        )}
      </div>

      {message && (
        <div className="notice-box notice-success">
          <CheckCircle2 size={16} />
          <div>{message}</div>
        </div>
      )}

      {error && (
        <div className="notice-box notice-danger">
          <AlertCircle size={16} />
          <div>{error}</div>
        </div>
      )}

      {/* Upload New Version Card */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-sm)',
        padding: '24px',
        marginBottom: '32px',
      }}>
        <h2 className="editorial-title" style={{ fontSize: '18px', marginBottom: '8px' }}>
          Upload New Resume Version
        </h2>
        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '18px' }}>
          Files are permanently stored on ImageKit with versioning. New uploads will not overwrite previous versions.
        </p>

        <form onSubmit={handleUpload} style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{
            border: '1px dashed var(--border-strong)',
            padding: '12px 18px',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'var(--bg-subtle)',
            fontSize: '13px',
          }}>
            <Upload size={16} color="var(--text-secondary)" />
            <span>{selectedFile ? selectedFile.name : 'Select PDF Resume (.pdf)'}</span>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={!selectedFile || uploading}
          >
            {uploading ? 'Uploading to ImageKit...' : 'Upload Version'}
          </button>

          {latestResume && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Current active version: Version {latestResume.version}
            </span>
          )}
        </form>
      </div>

      {/* Resume Version History Table */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-sm)',
        padding: '24px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 className="editorial-title" style={{ fontSize: '18px' }}>
            Resume History & Versions ({resumes.length})
          </h2>
        </div>

        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading resume catalog...
          </div>
        ) : resumes.length > 0 ? (
          <div className="table-container">
            <table className="editorial-table">
              <thead>
                <tr>
                  <th>Version</th>
                  <th>File Name</th>
                  <th>Upload Date</th>
                  <th>Size</th>
                  <th>Extraction Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {resumes.map((resume) => (
                  <tr key={resume._id}>
                    <td>
                      <span className="badge badge-default font-mono">
                        v{resume.version}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={16} color="var(--accent-primary)" />
                        <span style={{ fontWeight: 500 }}>{resume.fileName}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                      {new Date(resume.uploadDate).toLocaleDateString()} at{' '}
                      {new Date(resume.uploadDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                      {(resume.fileSize / 1024).toFixed(1)} KB
                    </td>
                    <td>
                      {resume.extractionStatus === 'confirmed' ? (
                        <span className="badge badge-success">
                          <CheckCircle2 size={12} /> Confirmed to Profile
                        </span>
                      ) : resume.extractionStatus === 'extracted' ? (
                        <span className="badge badge-accent">
                          <Sparkles size={12} /> Extracted (Pending Review)
                        </span>
                      ) : (
                        <span className="badge badge-default">
                          <Clock size={12} /> Uploaded
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <a
                          href={resume.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          title="Open or preview PDF stored in ImageKit"
                        >
                          <ExternalLink size={13} />
                          <span>Preview PDF</span>
                        </a>

                        <button
                          onClick={() => handleExtractSkills(resume._id)}
                          className="btn btn-ghost btn-sm"
                          style={{ border: '1px solid var(--border-subtle)' }}
                          disabled={extracting}
                          title="Run AI skill extraction on this version"
                        >
                          <Sparkles size={13} color="var(--accent-primary)" />
                          <span>Extract Skills</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No resumes uploaded yet. Upload your first PDF resume above.
          </div>
        )}
      </div>

      {/* Review & Confirm Extracted Skills Modal/Drawer */}
      {reviewModalOpen && extractedPayload && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-md)',
            width: '100%',
            maxWidth: '750px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <h2 className="editorial-title" style={{ fontSize: '20px' }}>
                  Review & Confirm Extracted Skills
                </h2>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Select which skills to confirm for your profile. Unchecked skills will not be added.
                </p>
              </div>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="btn btn-ghost btn-sm"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {/* Summary Highlights */}
              {extractedPayload.experienceHighlights?.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Extracted Resume Highlights
                  </div>
                  <ul style={{ paddingLeft: '18px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {extractedPayload.experienceHighlights.map((h, i) => (
                      <li key={i} style={{ marginBottom: '4px' }}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Skills Checklist Table */}
              <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Extracted Skills Checklist ({reviewSkills.filter(s => s.selected).length} selected)
              </div>

              <div className="table-container" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                <table className="editorial-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>Include</th>
                      <th>Skill Name</th>
                      <th>Category</th>
                      <th>Proficiency</th>
                      <th>Resume Evidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewSkills.map((skill, idx) => (
                      <tr key={idx} style={{ opacity: skill.selected ? 1 : 0.6 }}>
                        <td>
                          <input
                            type="checkbox"
                            checked={skill.selected}
                            onChange={() => toggleSkillSelection(idx)}
                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                          />
                        </td>
                        <td>
                          <strong>{skill.name}</strong>
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {skill.category}
                        </td>
                        <td>
                          <select
                            value={skill.proficiencyLevel}
                            onChange={(e) => updateSkillProficiency(idx, e.target.value)}
                            className="form-select"
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                            disabled={!skill.selected}
                          >
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                            <option value="Expert">Expert</option>
                          </select>
                        </td>
                        <td style={{ fontSize: '11.5px', color: 'var(--text-muted)', maxWidth: '240px' }}>
                          {skill.evidenceFromResume || 'Direct mention'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-main)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
            }}>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="btn btn-secondary"
                disabled={confirming}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSkills}
                className="btn btn-primary"
                disabled={confirming}
              >
                <Check size={16} />
                <span>{confirming ? 'Updating Profile...' : `Confirm & Add (${reviewSkills.filter(s => s.selected).length}) Skills to Profile`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
