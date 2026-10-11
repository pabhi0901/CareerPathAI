import React from 'react';
import { Menu, LogOut, GraduationCap, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLoading } from '../../context/LoadingContext';

export const Header = ({ onOpenSidebar }) => {
  const { user, logout } = useAuth();
  const { isOperating, operatingMessage } = useLoading();

  return (
    <header className="top-header" style={{ position: 'relative' }}>
      {/* Animated Top Operation Progress Bar */}
      {isOperating && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #244A38, #529E73, #244A38)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite linear',
          zIndex: 50,
        }} />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          onClick={onOpenSidebar}
          style={{ display: 'none' }}
          className="mobile-menu-btn"
          aria-label="Open navigation menu"
        >
          <Menu size={20} color="var(--text-secondary)" />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GraduationCap size={18} color="var(--text-muted)" />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {user?.studentProfile?.degree} ({user?.studentProfile?.academicYear})
          </span>
        </div>

        {/* Global Operation Notice */}
        {isOperating && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 10px',
            backgroundColor: 'var(--accent-light)',
            color: 'var(--accent-text)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            fontWeight: 500,
            border: '1px solid var(--accent-border)',
          }}>
            <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
            <span>{operatingMessage || 'AI operation in progress... Navigation locked'}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {user?.name}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            {user?.email}
          </div>
        </div>

        <button
          onClick={logout}
          className="btn btn-ghost btn-sm"
          title="Sign out of your session"
          style={{ border: '1px solid var(--border-subtle)', padding: '6px 12px' }}
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
};
