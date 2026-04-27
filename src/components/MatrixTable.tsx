import React from 'react';
import { Process } from '../lib/os-logic';

interface MatrixTableProps {
  processes: Process[];
  title: string;
  type: 'allocation' | 'max' | 'need';
  resourceNames: string[];
}

export const MatrixTable: React.FC<MatrixTableProps> = ({ processes, title, type, resourceNames }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PID</th>
              {resourceNames.map((r, i) => (
                <th key={i} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{r}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {processes.map((p) => (
              <tr key={p.id}>
                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">P{p.id}</td>
                {p[type].map((val, idx) => (
                  <td key={idx} className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
