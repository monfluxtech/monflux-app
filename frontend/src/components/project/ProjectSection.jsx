import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function ProjectSection({
  sectionId,
  icon,
  title,
  summary,
  stats = [],
  expanded,
  onToggle,
  background = '#fff',
  borderTop = '1px solid #E8EAED',
  headerAccent = '#E8794E',
  bodyStyle = {},
  children,
}) {
  return (
    <div id={sectionId} style={{ background, borderTop }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%',
          border: 'none',
          background: 'transparent',
          padding: '22px 56px 20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: '#fff',
            border: '1px solid #E8EAED',
            display: 'grid',
            placeItems: 'center',
            fontSize: 20,
            flexShrink: 0,
            boxShadow: '0 1px 2px rgba(0,0,0,.05)',
          }}
        >
          {icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-.02em', color: '#15171C', margin: 0 }}>
              {title}
            </h2>
            {stats.filter(Boolean).slice(0, 4).map((stat) => (
              <span
                key={`${title}-${stat}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 10px',
                  borderRadius: 999,
                  background: '#fff',
                  border: '1px solid #E8EAED',
                  color: '#4B5563',
                  fontSize: 11,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}
              >
                {stat}
              </span>
            ))}
          </div>
          {summary && (
            <div style={{ fontSize: 13, color: '#7C8089', marginTop: 6, lineHeight: 1.5 }}>
              {summary}
            </div>
          )}
        </div>

        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: '#fff',
            border: '1px solid #E8EAED',
            display: 'grid',
            placeItems: 'center',
            color: headerAccent,
            flexShrink: 0,
          }}
        >
          <ChevronDown
            size={18}
            style={{
              transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform .18s ease',
            }}
          />
        </div>
      </button>

      {expanded && (
        <div style={{ padding: '0 56px 44px', ...bodyStyle }}>
          {children}
        </div>
      )}
    </div>
  );
}
