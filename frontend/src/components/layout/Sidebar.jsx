import React from 'react';
import { NavLink } from 'react-router-dom';

import {
  LayoutDashboard,
  User,
  FileText,
  Briefcase,
  Compass,
  CheckCircle2,
  X,
  Target,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLoading } from '../../context/LoadingContext';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Job Analysis', path: '/job-analysis', icon: Briefcase },
  { name: 'Learning Roadmaps', path: '/roadmaps', icon: Compass },
  { name: 'Assessments', path: '/assessments', icon: CheckCircle2 },
  { name: 'Resume Vault', path: '/resumes', icon: FileText },
  { name: 'Student Profile', path: '/profile', icon: User },
];

export const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { isOperating } = useLoading();

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Platform Branding */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            backgroundColor: 'var(--accent-primary)',
            color: '#FFFFFF',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Target size={16} />
          </div>
          <div>
            <span style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '18px',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}>
              CareerPath AI
            </span>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onClose}
          style={{ display: 'none' }}
          className="mobile-close-btn"
          aria-label="Close sidebar"
        >
          <X size={20} color="var(--text-secondary)" />
        </button>
      </div>

      {/* Primary Navigation */}
      <nav style={{ padding: '20px 12px', flex: 1, overflowY: 'auto' }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          padding: '0 12px 10px',
        }}>
          Workspace
        </div>

        <ul style={{
          listStyle: 'none',
          pointerEvents: isOperating ? 'none' : 'auto',
          opacity: isOperating ? 0.45 : 1,
          transition: 'opacity 0.2s ease',
        }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path} style={{ marginBottom: '3px' }}>
                <NavLink
                  to={item.path}
                  onClick={(e) => {
                    if (isOperating) {
                      e.preventDefault();
                      return;
                    }
                    onClose();
                  }}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13.5px',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    backgroundColor: isActive ? 'var(--accent-light)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                    transition: 'all 0.15s ease',
                    cursor: isOperating ? 'not-allowed' : 'pointer',
                  })}
                >
                  <Icon size={18} strokeWidth={1.8} />
                  <span>{item.name}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>

        {isOperating && (
          <div style={{
            margin: '16px 8px 0',
            padding: '8px 10px',
            backgroundColor: 'var(--status-warning-bg)',
            border: '1px solid var(--status-warning-border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '11px',
            color: 'var(--status-warning-text)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <Lock size={12} />
            <span>Navigation locked during active operation</span>
          </div>
        )}
      </nav>

      {/* Target Role Status Card at bottom */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-main)',
      }}>
        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '4px' }}>
          Target Preparation Role
        </div>
        <div style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {user?.studentProfile?.targetRole || 'Not specified'}
        </div>
        <div style={{
          fontSize: '11.5px',
          color: 'var(--accent-primary)',
          marginTop: '2px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <span>{user?.studentProfile?.availableHoursPerDay || 3} hrs/day allocation</span>
        </div>
      </div>
    </aside>
  );
};
