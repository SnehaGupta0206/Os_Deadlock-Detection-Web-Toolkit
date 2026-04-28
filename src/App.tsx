import { useState, useMemo } from 'react';
import { Process, checkSafety, calculateNeed } from './lib/os-logic';
import { MatrixTable } from './components/MatrixTable';
import ResourceGraph from './components/ResourceGraph';
import { Dashboard } from './components/Dashboard';
import { PythonViewer } from './components/PythonViewer';
import {
  Activity, Server, ShieldCheck, Code2, LayoutDashboard, 
  GitBranch, Cpu, TrendingUp, AlertTriangle, CheckCircle
} from 'lucide-react';

// Start with example configuration - can be completely changed
const DEFAULT_TOTAL = [10, 5, 7];
const DEFAULT_PROCESSES: Process[] = [
  { id: 0, name: 'P0', allocation: [0, 1, 0], max: [7, 5, 3], need: [7, 4, 3], finished: false },
  { id: 1, name: 'P1', allocation: [2, 0, 0], max: [3, 2, 2], need: [1, 2, 2], finished: false },
  { id: 2, name: 'P2', allocation: [3, 0, 2], max: [9, 0, 2], need: [6, 0, 0], finished: false },
];

type AppTab = 'simulator' | 'python';

function App() {
  const [totalResources, setTotalResources] = useState<number[]>(DEFAULT_TOTAL);
  const [processes, setProcesses] = useState<Process[]>(DEFAULT_PROCESSES);
  const [simulationLog, setSimulationLog] = useState<string[]>([]);
  const [safeSequence, setSafeSequence] = useState<number[]>([]);
  const [isSafe, setIsSafe] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('simulator');

  const available = useMemo(() => 
    totalResources.map((total, rIdx) =>
      total - processes.reduce((sum, p) => sum + p.allocation[rIdx], 0)
    ), [totalResources, processes]
  );
  
  const resourceNames = totalResources.map((_, i) => String.fromCharCode(65 + i));
  const totalAllocated = processes.reduce((s, p) => s + p.allocation.reduce((a, b) => a + b, 0), 0);
  const totalAvailable = available.reduce((a, b) => a + b, 0);

  const runSimulation = () => {
    if (processes.length === 0) {
      setSimulationLog(["⚠️ No processes in the system. Add processes using the control panel."]);
      setIsSafe(null);
      return;
    }
    if (totalResources.some(r => r <= 0)) {
      setSimulationLog(["⚠️ All resources must have positive values. Update resource counts."]);
      setIsSafe(null);
      return;
    }
    const result = checkSafety({ processes, totalResources, available });
    setIsSafe(result.isSafe);
    setSafeSequence(result.safeSequence);
    setSimulationLog(result.log);
  };

  const handleReset = () => {
    setProcesses(DEFAULT_PROCESSES.map(p => ({ ...p, need: calculateNeed(p.max, p.allocation) })));
    setTotalResources([...DEFAULT_TOTAL]);
    setIsSafe(null);
    setSimulationLog([]);
    setSafeSequence([]);
  };

  const handleAddProcess = (newProcess: Process) => {
    setProcesses([...processes, newProcess]);
    setIsSafe(null);
    setSimulationLog([]);
  };

  const handleRemoveProcess = (id: number) => {
    const updatedProcesses = processes.filter(p => p.id !== id);
    const reassignedProcesses = updatedProcesses.map((p, idx) => ({
      ...p,
      id: idx,
      name: `P${idx}`
    }));
    setProcesses(reassignedProcesses);
    setIsSafe(null);
    setSimulationLog([]);
  };

  const handleEditProcess = (id: number, newAllocation: number[], newMax: number[]) => {
    const updatedProcesses = processes.map(p => {
      if (p.id === id) {
        const need = calculateNeed(newMax, newAllocation);
        return { ...p, allocation: newAllocation, max: newMax, need };
      }
      return p;
    });
    setProcesses(updatedProcesses);
    setIsSafe(null);
    setSimulationLog([]);
  };

  const handleAddResource = () => {
    const newResourceCount = totalResources.length + 1;
    setTotalResources([...totalResources, 10]);
    const updatedProcesses = processes.map(p => ({
      ...p,
      allocation: [...p.allocation, 0],
      max: [...p.max, 10],
      need: [...p.need, 10]
    }));
    setProcesses(updatedProcesses);
    setIsSafe(null);
    setSimulationLog([]);
  };

  const handleRemoveResource = () => {
    if (totalResources.length <= 1) return;
    const newResources = totalResources.slice(0, -1);
    setTotalResources(newResources);
    const updatedProcesses = processes.map(p => ({
      ...p,
      allocation: p.allocation.slice(0, -1),
      max: p.max.slice(0, -1),
      need: p.need.slice(0, -1)
    }));
    setProcesses(updatedProcesses);
    setIsSafe(null);
    setSimulationLog([]);
  };

  const handleUpdateResourceValue = (index: number, value: number) => {
    const newResources = [...totalResources];
    newResources[index] = Math.max(0, value);
    setTotalResources(newResources);
    setIsSafe(null);
  };

  return (
    <div style={{ minHeight: '100vh', padding: '24px 32px' }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '28px 32px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ background: 'linear-gradient(145deg, #0ea5e9, #2563eb)', borderRadius: '60px', padding: 12, boxShadow: '0 0 20px #0ea5e9' }}>
              <ShieldCheck size={32} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-1px', color: 'white' }} className="neon-text">
                OS DEADLOCK <span style={{ color: '#38bdf8' }}>DEFENDER</span>
              </h1>
              <p style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                Dynamic Process & Resource Management | Banker's Algorithm | Complete CRUD Operations
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div className="stat-pill"><Cpu size={16} /> {processes.length} Processes</div>
            <div className="stat-pill"><Server size={16} /> {totalResources.length} Resources</div>
            <div className="stat-pill"><Activity size={16} /> Alloc {totalAllocated}</div>
            <div className="stat-pill"><TrendingUp size={16} /> Avail {totalAvailable}</div>
            {isSafe !== null && (
              <div style={{ padding: '8px 16px', borderRadius: 60, display: 'flex', alignItems: 'center', gap: 8, background: isSafe ? '#22c55e20' : '#ef444420', border: `1px solid ${isSafe ? '#22c55e' : '#ef4444'}` }}>
                {isSafe ? <CheckCircle size={16} color="#4ade80" /> : <AlertTriangle size={16} color="#f87171" />}
                <span style={{ color: isSafe ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>{isSafe ? 'SAFE' : 'UNSAFE'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #2d3a5e', paddingBottom: 8 }}>
        {[
          { key: 'simulator' as AppTab, label: 'Simulator', icon: <LayoutDashboard size={16} /> },
          { key: 'python' as AppTab, label: 'Python Code', icon: <Code2 size={16} /> },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 24px',
              borderRadius: 40,
              fontWeight: 600,
              background: activeTab === tab.key ? 'linear-gradient(135deg, #0ea5e9, #3b82f6)' : 'rgba(30, 41, 59, 0.5)',
              border: activeTab === tab.key ? 'none' : '1px solid #2d3a5e',
              cursor: 'pointer',
              transition: 'all 0.2s',
              color: activeTab === tab.key ? 'white' : '#cbd5e6'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      {activeTab === 'simulator' ? (
        <>
          <Dashboard
            processes={processes}
            totalResources={totalResources}
            available={available}
            resourceNames={resourceNames}
            onUpdateResources={setTotalResources}
            onReset={handleReset}
            onRunAlgorithm={runSimulation}
            simulationLog={simulationLog}
            safeSequence={safeSequence}
            isSafe={isSafe}
            onAddProcess={handleAddProcess}
            onRemoveProcess={handleRemoveProcess}
            onEditProcess={handleEditProcess}
            onAddResource={handleAddResource}
            onRemoveResource={handleRemoveResource}
            onUpdateResourceValue={handleUpdateResourceValue}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 24 }}>
            <MatrixTable processes={processes} title="Allocation Matrix" type="allocation" resourceNames={resourceNames} accentColor="#4ade80" />
            <MatrixTable processes={processes} title="Max Need Matrix" type="max" resourceNames={resourceNames} accentColor="#facc15" />
            <MatrixTable processes={processes} title="Current Need" type="need" resourceNames={resourceNames} accentColor="#38bdf8" />
          </div>

          <div className="glass-card" style={{ padding: '20px', marginTop: 24 }}>
            <h2 style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, fontWeight: 600, color: '#e2e8f0' }}>
              <GitBranch size={22} /> Resource Allocation Graph (Dynamic)
            </h2>
            <ResourceGraph processes={processes} resourceNames={resourceNames} totalResources={totalResources} />
          </div>
        </>
      ) : (
        <PythonViewer />
      )}

      <footer style={{ marginTop: 48, textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', padding: '16px', borderTop: '1px solid #1e2f44' }}>
        OS Deadlock Defender · Fully Dynamic · Add/Remove Processes & Resources · Banker's Algorithm
      </footer>
    </div>
  );
}

export default App;