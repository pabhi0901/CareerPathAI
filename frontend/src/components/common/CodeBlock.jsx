import React, { useEffect, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
// Import popular languages
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import { Copy, Check } from 'lucide-react';

export const CodeBlock = ({ code = '', language = 'javascript', title }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Prism.highlightAll();
  }, [code, language]);

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const normalizedLang = (language || 'javascript').toLowerCase();
  const prismLang = Prism.languages[normalizedLang] ? normalizedLang : 'javascript';

  return (
    <div style={{
      margin: '12px 0 16px 0',
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden',
      border: '1px solid #2D2D35',
      backgroundColor: '#1E1E24',
    }}>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 14px',
        backgroundColor: '#16161B',
        borderBottom: '1px solid #282830',
        fontSize: '11.5px',
        color: '#A0A0A8',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#4A8E6B',
          }} />
          <span style={{
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            fontWeight: 600,
            color: '#D4D4DC',
          }}>
            {title || prismLang}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 8px',
            borderRadius: '4px',
            backgroundColor: copied ? '#244A38' : '#2A2A34',
            color: copied ? '#8EE4AF' : '#D0D0DA',
            border: 'none',
            fontSize: '11.5px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="Copy code snippet"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Code Body */}
      <pre
        className={`language-${prismLang}`}
        style={{
          margin: 0,
          padding: '14px 16px',
          backgroundColor: '#1E1E24',
          fontSize: '13px',
          fontFamily: 'var(--font-mono)',
          lineHeight: 1.55,
          overflowX: 'auto',
          borderRadius: 0,
        }}
      >
        <code className={`language-${prismLang}`}>{code.trim()}</code>
      </pre>
    </div>
  );
};
