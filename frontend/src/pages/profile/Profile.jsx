import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Plus,
  Trash2,
  CheckCircle2,
  Save,
  FolderGit2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState({
    degree: 'B.Tech / B.E.',
    branch: 'Computer Science & Engineering',
    academicYear: '3rd Year',
    graduationYear: 2026,
    targetRole: 'Full Stack Engineer',
    targetCompany: '',
    availableHoursPerDay: 3,
    placementDeadline: '',
    skills: [],
    projects: [],
  });

  const [newSkill, setNewSkill] = useState({
    name: '',
    proficiency: 'Intermediate',
  });

  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    techStack: '',
    link: '',
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/profile');
        if (res.data.success && res.data.profile) {
          const p = res.data.profile;
          setProfile({
            ...p,
            placementDeadline: p.placementDeadline
              ? new Date(p.placementDeadline).toISOString().split('T')[0]
              : '',
          });
        }
      } catch (err) {
        setError('Failed to fetch student profile.');
      }
    };
    fetchProfile();
  }, []);

  const handleProfileChange = (e) => {
    setProfile((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const res = await api.put('/profile', profile);
      if (res.data.success) {
        setMessage('Academic and career preferences updated successfully.');
        refreshUser();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.name.trim()) return;
    try {
      const res = await api.post('/profile/skills', newSkill);
      if (res.data.success) {
        setProfile((prev) => ({ ...prev, skills: res.data.skills }));
        setNewSkill({ name: '', proficiency: 'Intermediate' });
        refreshUser();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add skill.');
    }
  };

  const handleRemoveSkill = async (skillId) => {
    try {
      const res = await api.delete(`/profile/skills/${skillId}`);
      if (res.data.success) {
        setProfile((prev) => ({ ...prev, skills: res.data.skills }));
        refreshUser();
      }
    } catch (err) {
      setError('Failed to delete skill.');
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!newProject.title.trim()) return;
    try {
      const res = await api.post('/profile/projects', newProject);
      if (res.data.success) {
        setProfile((prev) => ({ ...prev, projects: res.data.projects }));
        setNewProject({ title: '', description: '', techStack: '', link: '' });
      }
    } catch (err) {
      setError('Failed to add project.');
    }
  };

  const handleDeleteProject = async (projectId) => {
    try {
      const res = await api.delete(`/profile/projects/${projectId}`);
      if (res.data.success) {
        setProfile((prev) => ({ ...prev, projects: res.data.projects }));
      }
    } catch (err) {
      setError('Failed to remove project.');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <span style={{
          fontSize: '11.5px',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--text-muted)',
          fontWeight: 600,
        }}>
          Student Records
        </span>
        <h1 className="editorial-title" style={{ fontSize: '28px', marginTop: '2px' }}>
          Profile & Confirmed Skills
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Manage your academic background, target placement milestones, confirmed skills, and project portfolio.
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
          <AlertCircle size={16} />
          <div>{error}</div>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSaveProfile} style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-sm)',
        padding: '24px',
        marginBottom: '32px',
      }}>
        <h2 className="editorial-title" style={{ fontSize: '18px', marginBottom: '18px' }}>
          Academic & Target Role Settings
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="degree">Degree Program</label>
            <input
              id="degree"
              name="degree"
              type="text"
              className="form-input"
              value={profile.degree}
              onChange={handleProfileChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="branch">Branch / Major</label>
            <input
              id="branch"
              name="branch"
              type="text"
              className="form-input"
              value={profile.branch}
              onChange={handleProfileChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="academicYear">Current Academic Year</label>
            <select
              id="academicYear"
              name="academicYear"
              className="form-select"
              value={profile.academicYear}
              onChange={handleProfileChange}
            >
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="Final Year">Final Year</option>
              <option value="Graduated">Graduated</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="graduationYear">Graduation Year</label>
            <input
              id="graduationYear"
              name="graduationYear"
              type="number"
              className="form-input"
              value={profile.graduationYear}
              onChange={handleProfileChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="targetRole">Target Job Role</label>
            <input
              id="targetRole"
              name="targetRole"
              type="text"
              className="form-input"
              value={profile.targetRole}
              onChange={handleProfileChange}
              placeholder="e.g. Full Stack Engineer"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="targetCompany">Target Company (Optional)</label>
            <input
              id="targetCompany"
              name="targetCompany"
              type="text"
              className="form-input"
              value={profile.targetCompany}
              onChange={handleProfileChange}
              placeholder="e.g. Google, Atlassian, Razorpay"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="availableHoursPerDay">Available Study Hours/Day</label>
            <input
              id="availableHoursPerDay"
              name="availableHoursPerDay"
              type="number"
              className="form-input"
              value={profile.availableHoursPerDay}
              onChange={handleProfileChange}
              min={1}
              max={16}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="placementDeadline">Target Placement Date</label>
            <input
              id="placementDeadline"
              name="placementDeadline"
              type="date"
              className="form-input"
              value={profile.placementDeadline}
              onChange={handleProfileChange}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={15} />
            <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>

      {/* Confirmed Skills Management */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-sm)',
        padding: '24px',
        marginBottom: '32px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 className="editorial-title" style={{ fontSize: '18px' }}>
              Confirmed Student Skills ({profile.skills?.length || 0})
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
              These skills are referenced by Job Analysis. They can be added manually or confirmed after resume extraction.
            </p>
          </div>
        </div>

        {/* Add Skill Form */}
        <form onSubmit={handleAddSkill} style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end',
          marginBottom: '20px',
          flexWrap: 'wrap',
          backgroundColor: 'var(--bg-subtle)',
          padding: '16px',
          borderRadius: 'var(--radius-sm)',
        }}>
          <div style={{ flex: '1 1 200px' }}>
            <label className="form-label" htmlFor="skillName">Skill / Technology Name</label>
            <input
              id="skillName"
              type="text"
              className="form-input"
              placeholder="e.g. React, Docker, Node.js, PostgreSQL"
              value={newSkill.name}
              onChange={(e) => setNewSkill((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div style={{ flex: '0 1 180px' }}>
            <label className="form-label" htmlFor="skillProficiency">Proficiency Level</label>
            <select
              id="skillProficiency"
              className="form-select"
              value={newSkill.proficiency}
              onChange={(e) => setNewSkill((prev) => ({ ...prev, proficiency: e.target.value }))}
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Expert">Expert</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ height: '40px' }}>
            <Plus size={15} />
            <span>Add Skill</span>
          </button>
        </form>

        {/* Skills Table */}
        {profile.skills?.length > 0 ? (
          <div className="table-container">
            <table className="editorial-table">
              <thead>
                <tr>
                  <th>Skill Name</th>
                  <th>Proficiency</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {profile.skills.map((skill) => (
                  <tr key={skill._id}>
                    <td>
                      <strong>{skill.name}</strong>
                      {skill.evidence && (
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Evidence: {skill.evidence}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-default">{skill.proficiency}</span>
                    </td>
                    <td>
                      {skill.verified ? (
                        <span className="badge badge-success">
                          <CheckCircle2 size={12} /> Verified via Assessment
                        </span>
                      ) : (
                        <span className="badge badge-default">Unverified Claim</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {skill.source === 'resume_extracted' ? 'Resume Extracted' : skill.source === 'assessment_passed' ? 'Verified in Test' : 'Manually Added'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill._id)}
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--status-danger-text)' }}
                        title="Delete skill from profile"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No confirmed skills on profile yet. Add your known skills manually or upload a resume to extract them.
          </div>
        )}
      </div>

      {/* Projects Portfolio */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-sm)',
        padding: '24px',
      }}>
        <h2 className="editorial-title" style={{ fontSize: '18px', marginBottom: '6px' }}>
          Projects & Practical Evidence ({profile.projects?.length || 0})
        </h2>
        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '18px' }}>
          Document projects to provide evidence for job description matching algorithms.
        </p>

        {/* Add Project Form */}
        <form onSubmit={handleAddProject} style={{
          backgroundColor: 'var(--bg-subtle)',
          padding: '16px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginBottom: '12px' }}>
            <div>
              <label className="form-label" htmlFor="projectTitle">Project Title</label>
              <input
                id="projectTitle"
                type="text"
                className="form-input"
                placeholder="e.g. Distributed Task Queue"
                value={newProject.title}
                onChange={(e) => setNewProject((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="form-label" htmlFor="projectTechStack">Tech Stack (comma separated)</label>
              <input
                id="projectTechStack"
                type="text"
                className="form-input"
                placeholder="e.g. Node.js, Redis, Docker, TypeScript"
                value={newProject.techStack}
                onChange={(e) => setNewProject((prev) => ({ ...prev, techStack: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="projectLink">Repository / Demo URL</label>
              <input
                id="projectLink"
                type="url"
                className="form-input"
                placeholder="https://github.com/..."
                value={newProject.link}
                onChange={(e) => setNewProject((prev) => ({ ...prev, link: e.target.value }))}
              />
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label className="form-label" htmlFor="projectDescription">Key Highlights & Architecture</label>
            <input
              id="projectDescription"
              type="text"
              className="form-input"
              placeholder="Implemented asynchronous job processor handling 1,000 tasks/min with Redis backoff."
              value={newProject.description}
              onChange={(e) => setNewProject((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-sm">
            <Plus size={14} />
            <span>Add Project</span>
          </button>
        </form>

        {/* Projects List */}
        {profile.projects?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {profile.projects.map((proj) => (
              <div
                key={proj._id}
                style={{
                  border: '1px solid var(--border-subtle)',
                  padding: '16px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <FolderGit2 size={16} color="var(--accent-primary)" />
                    <strong style={{ fontSize: '15px' }}>{proj.title}</strong>
                    {proj.link && (
                      <a href={proj.link} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)' }}>
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    {proj.description}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {proj.techStack?.map((t, idx) => (
                      <span key={idx} className="badge badge-default font-mono">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteProject(proj._id)}
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--status-danger-text)' }}
                  title="Remove project"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No projects added yet.
          </div>
        )}
      </div>
    </div>
  );
};
