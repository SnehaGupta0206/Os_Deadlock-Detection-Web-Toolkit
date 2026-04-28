import React, { useState } from 'react';
import { 
  Plus, Play, RotateCw, Send, Trash2, Edit2, 
  PlusCircle, MinusCircle, Settings, Save, X, 
  AlertCircle, CheckCircle, Clock, Database, Cpu
} from 'lucide-react';
import { Process, calculateNeed, requestResources } from '../lib/os-logic';

interface DashboardProps {
  processes: Process[];
  totalResources: number[];
  available: number[];
  resourceNames: string[];
  onAddProcess: (p: Process) => void;
  onRemoveProcess: (id: number) => void;
  onEditProcess: (id: number, allocation: number[], max: number[]) => void;
  onUpdateResources: (r: number[]) => void;
  onAddResource: () => void;
  onRemoveResource: () => void;
  onUpdateResourceValue: (index: number, value: number) => void;
  onReset: () => void;
  onRunAlgorithm: () => void;
  simulationLog: string[];
  safeSequence: number[];
  isSafe: boolean | null;
}

export const Dashboard: React.FC<DashboardProps> = ({
  processes,
  totalResources,
  available,
  resourceNames,
  onAddProcess,
  onRemoveProcess,
  onEditProcess,
  onUpdateResources,
  onAddResource,
  onRemoveResource,
  onUpdateResourceValue,
  onReset,
  onRunAlgorithm,
  simulationLog,
  safeSequence,
  isSafe,
}) => {
  const [allocInput, setAllocInput] = useState('');
  const [maxInput, setMaxInput] = useState('');
  const [reqPid, setReqPid] = useState('');
  const [reqValue, setReqValue] = useState('');
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | 'info'>('info');
  const [editingProcess, setEditingProcess] = useState<number | null>(null);
  const [editAlloc, setEditAlloc] = useState('');
  const [editMax, setEditMax] = useState('');
  const [showProcessList, setShowProcessList] = useState(true);

  const showFeedback = (message: string, type: 'success' | 'error' | 'info') => {
    setFeedback(message);
    setFeedbackType(type);
    setTimeout(() => setFeedback(''), 3000);
  };

  const handleAdd = () => {
    if (!allocInput || !maxInput) {
      showFeedback('❌ Please enter both Allocation and Max values', 'error');
      return;
    }
    
    const alloc = allocInput.split(',').map(Number);
    const max = maxInput.split(',').map(Number);
    
    if (alloc.length !== totalResources.length || max.length !== totalResources.length) {
      showFeedback(`❌ Enter exactly ${totalResources.length} comma-separated values`, 'error');
      return;
    }
    
    for (let i = 0; i < alloc.length; i++) {
      if (isNaN(alloc[i]) || isNaN(max[i])) {
        showFeedback(`❌ Invalid number at position ${i + 1}`, 'error');
        return;
      }
      if (alloc[i] > max[i]) {
        showFeedback(`❌ Allocation[${i}] (${alloc[i]}) cannot exceed Max[${i}] (${max[i]})`, 'error');
        return;
      }
      if (alloc[i] < 0 || max[i] < 0) {
        showFeedback(`❌ Values cannot be negative`, 'error');
        return;
      }
    }
    
    const newProc: Process = {
      id: processes.length,
      name: `P${processes.length}`,
      allocation: alloc,
      max: max,
      need: calculateNeed(max, alloc),
      finished: false,
    };
    onAddProcess(newProc);
    setAllocInput('');
    setMaxInput('');
    showFeedback(`✅ Process P${processes.length} added successfully!`, 'success');
  };

  const handleDeleteProcess = (id: number, name: string) => {
    if (window.confirm(`Delete ${name}? This action cannot be undone.`)) {
      onRemoveProcess(id);
      showFeedback(`✅ ${name} removed successfully`, 'success');
    }
  };

  const handleEditClick = (p: Process) => {
    setEditingProcess(p.id);
    setEditAlloc(p.allocation.join(','));
    setEditMax(p.max.join(','));
  };

  const handleSaveEdit = () => {
    if (editingProcess !== null) {
      const alloc = editAlloc.split(',').map(Number);
      const max = editMax.split(',').map(Number);
      
      if (alloc.length !== totalResources.length || max.length !== totalResources.length) {
        showFeedback(`❌ Enter exactly ${totalResources.length} values`, 'error');
        return;
      }
      
      onEditProcess(editingProcess, alloc, max);
      setEditingProcess(null);
      showFeedback(`✅ Process P${editingProcess} updated`, 'success');
    }
  };

  const handleRequest = () => {
    const pid = parseInt(reqPid);
    if (isNaN(pid) || pid < 0 || pid >= processes.length) {
      showFeedback(`❌ Enter valid Process ID (0-${processes.length - 1})`, 'error');
      return;
    }
    
    if (!reqValue) {
      showFeedback(`❌ Enter request values`, 'error');
      return;
    }
    
    const req = reqValue.split(',').map(Number);
    if (req.length !== totalResources.length) {
      showFeedback(`❌ Enter exactly ${totalResources.length} comma-separated values`, 'error');
      return;
    }
    
    for (let i = 0; i < req.length; i++) {
      if (isNaN(req[i]) || req[i] < 0) {
        showFeedback(`❌ Invalid request value at position ${i + 1}`, 'error');
        return;
      }
    }
    
    const state = { processes, totalResources, available };
    const result = requestResources(state, pid, req);
    
    if (result.granted && result.newState) {
      onUpdateResources(result.newState.totalResources);
      showFeedback(result.message, 'success');
      setTimeout(() => window.location.reload(), 1000);
    } else {
      showFeedback(result.message, 'error');
    }
    setReqPid('');
    setReqValue('');
  };

  const handleAddResourceClick = () => {
    onAddResource();
    showFeedback(`✅ New resource type added (${resourceNames.length + 1})`, 'success');
  };

  const handleRemoveResourceClick = () => {
    if (totalResources.length <= 1) {
      showFeedback(`❌ Cannot remove last resource type`, 'error');
      return;
    }
    if (window.confirm(`Remove resource ${resourceNames[resourceNames.length - 1]}? All allocations for this resource will be set to 0.`)) {
      onRemoveResource();
      showFeedback(`✅ Resource ${resourceNames[resourceNames.length - 1]} removed`, 'success');
    }
  };

  const totalAllocated = processes.reduce((s, p) => s + p.allocation.reduce((a, b) => a + b, 0), 0);
  const resourceUtilization = totalResources.map((total, idx) => ({
    name: resourceNames[idx],
    used: total - available[idx],
    total: total,
    percentage: total > 0 ? ((total - available[idx]) / total * 100) : 0
  }));

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', gap: 8, color: 'white' }}>
          <Settings size={22} /> Dynamic Control Center
        </h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onReset} className="btn-secondary" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <RotateCw size={16} /> Reset All
          </button>
          <button onClick={onRunAlgorithm} className="btn-primary" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <Play size={16} /> Run Banker's Algorithm
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div style={{ background: 'rgba(56,189,248,0.1)', borderRadius: 16, padding: '12px', textAlign: 'center' }}>
          <Cpu size={20} color="#38bdf8" style={{ marginBottom: 4 }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#38bdf8' }}>{processes.length}</div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Processes</div>
        </div>
        <div style={{ background: 'rgba(56,189,248,0.1)', borderRadius: 16, padding: '12px', textAlign: 'center' }}>
          <Database size={20} color="#38bdf8" style={{ marginBottom: 4 }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#38bdf8' }}>{totalResources.length}</div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Resource Types</div>
        </div>
        <div style={{ background: 'rgba(56,189,248,0.1)', borderRadius: 16, padding: '12px', textAlign: 'center' }}>
          <Clock size={20} color="#38bdf8" style={{ marginBottom: 4 }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#38bdf8' }}>{totalAllocated}</div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Allocated Units</div>
        </div>
        <div style={{ background: 'rgba(56,189,248,0.1)', borderRadius: 16, padding: '12px', textAlign: 'center' }}>
          <CheckCircle size={20} color="#38bdf8" style={{ marginBottom: 4 }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#38bdf8' }}>{available.reduce((a,b) => a+b, 0)}</div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Available Units</div>
        </div>
      </div>

      {/* Resource Management */}
      <div style={{ marginBottom: 20, padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ color: '#38bdf8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Database size={16} /> Resource Configuration
          </h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleAddResourceClick} className="btn-secondary" style={{ padding: '6px 12px', display: 'flex', gap: 4, fontSize: '0.7rem' }}>
              <PlusCircle size={14} /> Add Resource
            </button>
            {totalResources.length > 1 && (
              <button onClick={handleRemoveResourceClick} className="btn-secondary" style={{ padding: '6px 12px', display: 'flex', gap: 4, fontSize: '0.7rem', background: '#991b1b80' }}>
                <MinusCircle size={14} /> Remove Last
              </button>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          {resourceUtilization.map((res, idx) => (
            <div key={idx} style={{ flex: 1, minWidth: '120px', background: 'rgba(56,189,248,0.05)', borderRadius: 12, padding: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>{res.name}:</span>
                <input
                  type="number"
                  value={res.total}
                  onChange={(e) => onUpdateResourceValue(idx, parseInt(e.target.value) || 0)}
                  style={{ width: '60px', background: '#111c2e', borderRadius: 20, padding: '2px 6px', border: '1px solid #2c3f5f', color: 'white', textAlign: 'center' }}
                />
              </div>
              <div style={{ background: '#1e293b', borderRadius: 10, height: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, res.percentage)}%`, background: res.percentage > 80 ? '#ef4444' : res.percentage > 50 ? '#f59e0b' : '#10b981', height: '100%' }} />
              </div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 4 }}>
                Used: {res.used}/{res.total} ({res.percentage.toFixed(0)}%)
              </div>
            </div>
          ))}
        </div>
        
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: 12 }}>
          <strong>Available Vector:</strong> [{available.join(', ')}]
        </div>
      </div>

      {/* Add Process */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} /> Add New Process
        </label>
        <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder={`Allocation (${resourceNames.map(() => '0').join(',')})`} 
            value={allocInput} 
            onChange={(e) => setAllocInput(e.target.value)} 
            style={{ flex: 1, minWidth: '150px', background: '#111c2e', borderRadius: 30, padding: '10px 12px', border: '1px solid #2c3f5f', color: 'white' }} 
          />
          <input 
            type="text" 
            placeholder={`Max Need (${resourceNames.map(() => '10').join(',')})`} 
            value={maxInput} 
            onChange={(e) => setMaxInput(e.target.value)} 
            style={{ flex: 1, minWidth: '150px', background: '#111c2e', borderRadius: 30, padding: '10px 12px', border: '1px solid #2c3f5f', color: 'white' }} 
          />
          <button onClick={handleAdd} className="btn-primary" style={{ padding: '0 24px', display: 'flex', alignItems: 'center' }}>
            <Plus size={18} /> Add
          </button>
        </div>
        <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: 6 }}>
          Format: comma-separated values, e.g., "0,1,0" or "7,5,3"
        </div>
      </div>

      {/* Process List Toggle */}
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button 
          onClick={() => setShowProcessList(!showProcessList)}
          style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '0.75rem', cursor: 'pointer' }}
        >
          {showProcessList ? '▼ Hide Process List' : '▶ Show Process List'} ({processes.length} processes)
        </button>
      </div>

      {/* Process List */}
      {showProcessList && (
        <div style={{ marginBottom: 20, maxHeight: '250px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: 16, padding: '12px' }}>
          <table style={{ width: '100%', fontSize: '0.7rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2d3a5e', color: '#94a3b8' }}>
                <th style={{ textAlign: 'left', padding: '6px' }}>Process</th>
                <th style={{ textAlign: 'left', padding: '6px' }}>Allocation</th>
                <th style={{ textAlign: 'left', padding: '6px' }}>Max</th>
                <th style={{ textAlign: 'left', padding: '6px' }}>Need</th>
                <th style={{ textAlign: 'center', padding: '6px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {processes.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #1e2a3a' }}>
                  <td style={{ padding: '6px', fontWeight: 'bold', color: '#a5f3fc' }}>{p.name}</td>
                  <td style={{ padding: '6px', fontFamily: 'monospace' }}>[{p.allocation.join(',')}]</td>
                  <td style={{ padding: '6px', fontFamily: 'monospace' }}>[{p.max.join(',')}]</td>
                  <td style={{ padding: '6px', fontFamily: 'monospace' }}>[{p.need.join(',')}]</td>
                  <td style={{ padding: '6px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button onClick={() => handleEditClick(p)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.65rem' }}>
                        <Edit2 size={12} /> Edit
                      </button>
                      <button onClick={() => handleDeleteProcess(p.id, p.name)} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.65rem', background: '#991b1b80' }}>
                        <Trash2 size={12} /> Del
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Resource Request */}
      <div style={{ marginBottom: 20, padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: 20 }}>
        <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Send size={14} /> Simulate Resource Request (Banker's Algorithm)
        </label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input 
            type="number" 
            placeholder={`Process ID (0-${processes.length - 1})`} 
            value={reqPid} 
            onChange={(e) => setReqPid(e.target.value)} 
            style={{ width: '140px', background: '#111c2e', borderRadius: 30, padding: '10px 16px', border: '1px solid #2c3f5f', color: 'white' }} 
          />
          <input 
            type="text" 
            placeholder={`Request (${resourceNames.map(() => '0').join(',')})`} 
            value={reqValue} 
            onChange={(e) => setReqValue(e.target.value)} 
            style={{ flex: 1, minWidth: '180px', background: '#111c2e', borderRadius: 30, padding: '10px 16px', border: '1px solid #2c3f5f', color: 'white' }} 
          />
          <button onClick={handleRequest} className="btn-secondary" style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '10px 24px' }}>
            <Send size={16} /> Submit Request
          </button>
        </div>
        <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: 8 }}>
          Example: Request for P1: "1,0,2" means request 1 of A, 0 of B, 2 of C
        </div>
      </div>

      {/* Feedback Message */}
      {feedback && (
        <div style={{ 
          marginBottom: 20, 
          padding: '12px 16px', 
          borderRadius: 16, 
          background: feedbackType === 'success' ? '#064e3b' : feedbackType === 'error' ? '#7f1d1d' : '#1e3a8a',
          borderLeft: `4px solid ${feedbackType === 'success' ? '#10b981' : feedbackType === 'error' ? '#ef4444' : '#3b82f6'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem' }}>
            {feedbackType === 'success' && <CheckCircle size={16} color="#10b981" />}
            {feedbackType === 'error' && <AlertCircle size={16} color="#ef4444" />}
            {feedbackType === 'info' && <Clock size={16} color="#3b82f6" />}
            <span>{feedback}</span>
          </div>
        </div>
      )}

      {/* Safe Sequence Banner */}
      {isSafe === true && safeSequence.length > 0 && (
        <div style={{ background: 'linear-gradient(135deg, #0f212e, #0a1620)', borderRadius: 24, padding: '16px 20px', marginBottom: 20, textAlign: 'center', border: '1px solid #2dd4bf' }}>
          <span style={{ fontWeight: 'bold', color: '#2dd4bf', fontSize: '0.85rem' }}>🔗 SAFE EXECUTION SEQUENCE → </span>
          <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.9rem', color: '#a5f3fc' }}>{safeSequence.map(id => `P${id}`).join(' → ')}</span>
        </div>
      )}

      {/* Log Console */}
      <div className="log-area">
        <div style={{ color: '#38bdf8', marginBottom: 12, fontSize: '0.7rem', fontWeight: 600, letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>📟</span> BANKER'S ALGORITHM EXECUTION LOG
        </div>
        {simulationLog.length === 0 ? (
          <div style={{ color: '#94a3b8', textAlign: 'center', padding: '30px', fontSize: '0.75rem' }}>
            ⚡ Configure processes and resources, then click <span style={{ color: '#38bdf8' }}>"Run Banker's Algorithm"</span>
          </div>
        ) : (
          simulationLog.map((log, idx) => (
            <div key={idx} style={{ 
              marginBottom: 6, 
              fontFamily: 'monospace', 
              fontSize: '0.7rem', 
              borderLeft: `2px solid ${log.includes('SAFE') || log.includes('✅') ? '#10b981' : log.includes('UNSAFE') || log.includes('❌') ? '#ef4444' : '#0ea5e9'}`,
              paddingLeft: 10, 
              paddingBottom: 4 
            }}>
              <span style={{ color: '#38bdf8', marginRight: 8 }}>[{String(idx + 1).padStart(2, '0')}]</span>
              <span style={{ 
                color: log.includes('✅') || log.includes('SAFE') || log.includes('🎉') ? '#4ade80' 
                  : log.includes('❌') || log.includes('UNSAFE') || log.includes('🚨') ? '#f87171' 
                  : '#cbd5e6'
              }}>
                {log}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editingProcess !== null && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0,0,0,0.9)', 
          zIndex: 1000, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center'
        }}>
          <div className="glass-card" style={{ width: '450px', padding: '28px' }}>
            <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Edit2 size={18} /> Edit Process P{editingProcess}
            </h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Allocation Vector</label>
              <input
                type="text"
                value={editAlloc}
                onChange={(e) => setEditAlloc(e.target.value)}
                placeholder={`e.g., ${resourceNames.map(() => '0').join(',')}`}
                style={{ width: '100%', marginTop: 4, padding: '10px', background: '#111c2e', borderRadius: 20, color: 'white', border: '1px solid #2c3f5f' }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Max Need Vector</label>
              <input
                type="text"
                value={editMax}
                onChange={(e) => setEditMax(e.target.value)}
                placeholder={`e.g., ${resourceNames.map(() => '10').join(',')}`}
                style={{ width: '100%', marginTop: 4, padding: '10px', background: '#111c2e', borderRadius: 20, color: 'white', border: '1px solid #2c3f5f' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleSaveEdit} className="btn-primary" style={{ flex: 1, display: 'flex', gap: 6, justifyContent: 'center' }}>
                <Save size={16} /> Save Changes
              </button>
              <button onClick={() => setEditingProcess(null)} className="btn-secondary" style={{ flex: 1, display: 'flex', gap: 6, justifyContent: 'center' }}>
                <X size={16} /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};