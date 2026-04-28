import React from 'react';
import { Process } from '../lib/os-logic';

interface MatrixTableProps {
  processes: Process[];
  title: string;
  type: 'allocation' | 'max' | 'need';
  resourceNames: string[];
  accentColor?: string;
}

export const MatrixTable: React.FC<MatrixTableProps> = ({ 
  processes, 
  title, 
  type, 
  resourceNames, 
  accentColor = '#38bdf8' 
}) => {
  return (
    <div className="matrix-container" style={{ borderTop: `3px solid ${accentColor}`, background: 'rgba(16, 24, 40, 0.85)', borderRadius: 20, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', background: 'rgba(15, 25, 45, 0.9)' }}>
        <h3 style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px', color: accentColor, margin: 0 }}>{title}</h3>
      </div>
      <div style={{ overflowX: 'auto', maxHeight: '300px', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, background: '#0f172a' }}>
            <tr style={{ borderBottom: '1px solid #2d3a5e' }}>
              <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 600, fontSize: '0.75rem', color: '#94a3f8' }}>Process</th>
              {resourceNames.map((r, i) => (
                <th key={i} style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 600, fontSize: '0.75rem', color: '#94a3f8' }}>{r}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {processes.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #1e2a3a' }}>
                <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#a5f3fc' }}>P{p.id}</td>
                {p[type].map((val, idx) => (
                  <td key={idx} style={{ padding: '10px 8px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 500, color: '#cbd5e6' }}>{val}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};