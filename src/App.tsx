import { useState } from 'react';
import {
  Process,
  SystemState,
  checkSafety
} from './lib/os-logic';
import { MatrixTable } from './components/MatrixTable';
import ResourceGraph from './components/ResourceGraph';
import { Dashboard } from './components/Dashboard';
import { PythonViewer } from './components/PythonViewer';
import {
  Activity, Server, Layers, ShieldCheck,
  Code2, LayoutDashboard, GitBranch
} from 'lucide-react';

const INITIAL_TOTAL = [10, 5, 7]; // A, B, C

const INITIAL_PROCESSES: Process[] = [
  { id: 0, name: 'P0', allocation: [0, 1, 0], max: [7, 5, 3], need: [7, 4, 3], finished: false },
  { id: 1, name: 'P1', allocation: [2, 0, 0], max: [3, 2, 2], need: [1, 2, 2], finished: false },
  { id: 2, name: 'P2', allocation: [3, 0, 2], max: [9, 0, 2], need: [6, 0, 0], finished: false },
  { id: 3, name: 'P3', allocation: [2, 1, 1], max: [2, 2, 2], need: [0, 1, 1], finished: false },
  { id: 4, name: 'P4', allocation: [0, 0, 2], max: [4, 3, 3], need: [4, 3, 1], finished: false },
];

type AppTab = 'simulator' | 'python';

function App() {
  /* ── State (mirrors Streamlit session_state in Python version) ── */
  const [totalResources, setTotalResources] = useState<number[]>(INITIAL_TOTAL);
  const [processes, setProcesses]           = useState<Process[]>(INITIAL_PROCESSES);
  const [simulationLog, setSimulationLog]   = useState<string[]>([]);
  const [safeSequence, setSafeSequence]     = useState<number[]>([]);
  const [isSafe, setIsSafe]                 = useState<boolean | null>(null);
  const [activeTab, setActiveTab]           = useState<AppTab>('simulator');

  /* ── Derived State ── */
  const available = totalResources.map((total, rIdx) =>
    total - processes.reduce((sum, p) => sum + p.allocation[rIdx], 0)
  );
  const resourceNames = totalResources.map((_, i) => String.fromCharCode(65 + i));

  /* ── Handlers ── */
  const handleAddProcess = (newProcess: Process) => {
    setProcesses([...processes, newProcess]);
    setIsSafe(null);
    setSimulationLog([]);
  };

  const handleUpdateResources = (newTotals: number[]) => {
    setTotalResources(newTotals);
    setIsSafe(null);
    setSimulationLog([]);
  };

  const runSimulation = () => {
    const currentState: SystemState = { processes, totalResources, available };
    const result = checkSafety(currentState);
    setIsSafe(result.isSafe);
    setSafeSequence(result.safeSequence);
    setSimulationLog(result.log);
  };

  const handleReset = () => {
    setProcesses(INITIAL_PROCESSES);
    setTotalResources(INITIAL_TOTAL);
    setIsSafe(null);
    setSimulationLog([]);
    setSafeSequence([]);
  };

  /* ── Stats ── */
  const totalAllocated = processes.reduce((s, p) => s + p.allocation.reduce((a, b) => a + b, 0), 0);
  const totalAvailable = available.reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">

      {/* ══════════════ HEADER ══════════════ */}
      <header className="bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-xl">
        <div className="container mx-auto px-4 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/20 p-2 rounded-xl">
                <ShieldCheck className="text-emerald-400" size={30} />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">OS Deadlock Defender</h1>
                <p className="text-xs text-slate-400 mt-0.5">Banker's Algorithm · Resource Allocation Graph · Python Equivalent</p>
              </div>
            </div>
            <div className="hidden md:flex gap-5 text-xs font-medium text-slate-300">
              <span className="flex items-center gap-1.5 bg-slate-700/50 px-3 py-1.5 rounded-full">
                <Activity size={13} className="text-emerald-400" /> Real-time Simulation
              </span>
              <span className="flex items-center gap-1.5 bg-slate-700/50 px-3 py-1.5 rounded-full">
                <Server size={13} className="text-blue-400" /> Resource Monitor
              </span>
              <span className="flex items-center gap-1.5 bg-slate-700/50 px-3 py-1.5 rounded-full">
                <Layers size={13} className="text-purple-400" /> Deadlock Prevention
              </span>
            </div>
          </div>

          {/* ── Stat pills ── */}
          <div className="flex gap-4 mt-4 flex-wrap">
            {[
              { label: 'Processes',      value: processes.length,   color: 'emerald' },
              { label: 'Resource Types', value: totalResources.length, color: 'blue' },
              { label: 'Total Allocated',value: totalAllocated,     color: 'amber'   },
              { label: 'Total Available',value: totalAvailable,     color: 'cyan'    },
            ].map(({ label, value, color }) => (
              <div key={label}
                className={`bg-${color}-500/10 border border-${color}-500/30 px-4 py-1.5 rounded-full flex items-center gap-2`}>
                <span className={`text-${color}-400 font-bold text-sm`}>{value}</span>
                <span className="text-slate-400 text-xs">{label}</span>
              </div>
            ))}
            {isSafe !== null && (
              <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 border font-bold text-sm
                ${isSafe
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}>
                {isSafe ? '✅ SAFE' : '🚨 UNSAFE'}
              </div>
            )}
          </div>
        </div>

        {/* ── Navigation tabs ── */}
        <div className="border-t border-slate-700/50 mt-4">
          <div className="container mx-auto px-4 flex gap-1">
            {([
              { key: 'simulator', label: 'Simulator', icon: <LayoutDashboard size={15} /> },
              { key: 'python',    label: '🐍 Python Code', icon: <Code2 size={15} /> },
            ] as { key: AppTab; label: string; icon: React.ReactNode }[]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all border-b-2 ${
                  activeTab === tab.key
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ══════════════ MAIN ══════════════ */}
      <main className="container mx-auto px-4 py-8">

        {activeTab === 'simulator' && (
          <>
            {/* Control Panel + Logs */}
            <section className="mb-8">
              <Dashboard
                state={{ processes, totalResources, available }}
                onAddProcess={handleAddProcess}
                onUpdateResources={handleUpdateResources}
                onReset={handleReset}
                onRunAlgorithm={runSimulation}
                simulationLog={simulationLog}
                safeSequence={safeSequence}
                isSafe={isSafe}
              />
            </section>

            {/* Matrices */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <MatrixTable processes={processes} title="Allocation Matrix"  type="allocation" resourceNames={resourceNames} />
              <MatrixTable processes={processes} title="Max Need Matrix"    type="max"        resourceNames={resourceNames} />
              <MatrixTable processes={processes} title="Current Need Matrix" type="need"      resourceNames={resourceNames} />
            </section>

            {/* Resource Allocation Graph */}
            <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <GitBranch className="text-blue-600" size={22} />
                  Resource Allocation Graph (RAG)
                </h2>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-8 h-0.5 bg-sky-500"></span> Allocation
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-8 h-0.5 bg-red-400 border-dashed border-t-2 border-red-400"></span> Need
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-4 h-4 rounded-full bg-green-100 border border-green-500"></span> Process
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-4 h-4 rounded bg-sky-100 border border-sky-500"></span> Resource
                  </span>
                </div>
              </div>
              <ResourceGraph
                processes={processes}
                resourceNames={resourceNames}
                totalResources={totalResources}
              />
            </section>
          </>
        )}

        {activeTab === 'python' && (
          <section>
            {/* Python intro card */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 mb-6 border border-slate-700">
              <div className="flex items-start gap-4">
                <span className="text-5xl">🐍</span>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Python / Streamlit Edition</h2>
                  <p className="text-slate-300 text-sm mb-3">
                    Every single module of this React app has been re-written in Python using
                    <strong className="text-yellow-300"> Streamlit</strong> (UI),
                    <strong className="text-yellow-300"> Plotly</strong> (graphs), and
                    <strong className="text-yellow-300"> Pandas</strong> (matrices).
                    Zero JavaScript needed.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { ts: 'React + Vite',    py: 'Streamlit',  desc: 'UI Framework'    },
                      { ts: 'React Flow',      py: 'Plotly',     desc: 'Graph/RAG'        },
                      { ts: 'Tailwind CSS',    py: 'Custom CSS', desc: 'Styling'          },
                      { ts: 'TypeScript types',py: '@dataclass', desc: 'Type Safety'      },
                    ].map(item => (
                      <div key={item.ts} className="bg-slate-700/50 rounded-lg p-3">
                        <div className="text-xs text-slate-400 mb-1">{item.desc}</div>
                        <div className="text-blue-300 text-xs font-mono mb-0.5">⚛ {item.ts}</div>
                        <div className="text-yellow-300 text-xs font-mono">🐍 {item.py}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Code viewer */}
            <PythonViewer />

            {/* System architecture */}
            <div className="mt-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Layers size={18} className="text-purple-500" /> Python App System Architecture
              </h3>
              <pre className="bg-slate-900 rounded-xl p-5 text-xs text-slate-300 font-mono leading-relaxed overflow-x-auto">{`
┌────────────────────────────────────────────────────────────────────┐
│                     STREAMLIT APPLICATION                          │
│                         (app.py)                                   │
├──────────────────────┬─────────────────────────────────────────────┤
│      SIDEBAR         │              MAIN AREA                      │
│  (render_sidebar)    │  ┌──────────────────────────────────────┐   │
│                      │  │   Tab 1: Matrices  (Pandas DataFrames)│   │
│  • Set Resources     │  │   Tab 2: RAG Graph (Plotly)          │   │
│  • Add Process       │  │   Tab 3: Algorithm Log               │   │
│  • Resource Request  │  │   Tab 4: About / Docs                │   │
│  • Run / Reset       │  └──────────────────────────────────────┘   │
└──────────┬───────────┴─────────────┬───────────────────────────────┘
           │                         │
           ▼                         ▼
  ┌─────────────────────────────────────────────────┐
  │           st.session_state (Global State)       │
  │  processes • total_resources • available        │
  │  simulation_log • is_safe • safe_sequence       │
  └────────────────┬────────────────────────────────┘
                   │
       ┌───────────┴────────────┐
       ▼                        ▼
 ┌─────────────┐         ┌──────────────────┐
 │ os_logic.py │         │ graph_builder.py │
 │             │         │                  │
 │ @dataclass  │         │ Plotly Figure    │
 │ Process     │         │ Process circles  │
 │ SystemState │         │ Resource squares │
 │             │         │ Allocation edges │
 │ check_safety│         │ Need edges       │
 │ req_resource│         │ Arrow annotations│
 └─────────────┘         └──────────────────┘
      `}</pre>
            </div>

            {/* 10-point project guide */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  num: '01', title: 'Project Overview',
                  color: 'blue',
                  items: [
                    'Solves: Database & OS deadlocks (MySQL InnoDB, Linux kernel)',
                    'Implements Banker\'s Algorithm for deadlock avoidance',
                    'Visualises RAG (Resource Allocation Graph) in real-time',
                    'Real-life use: Cloud schedulers, distributed lock managers',
                  ]
                },
                {
                  num: '02', title: 'System Architecture',
                  color: 'purple',
                  items: [
                    'Frontend: Streamlit (replaces React + Vite)',
                    'Logic: os_logic.py (pure Python, no framework)',
                    'Viz: graph_builder.py + Plotly (replaces React Flow)',
                    'Data: Pandas DataFrames (replaces custom MatrixTable)',
                  ]
                },
                {
                  num: '03', title: 'Modules',
                  color: 'emerald',
                  items: [
                    'Module 1: UI Layer (app.py → render_* functions)',
                    'Module 2: OS Logic (os_logic.py → Banker\'s Algo)',
                    'Module 3: Graph Engine (graph_builder.py → Plotly)',
                    'Module 4: State Manager (st.session_state)',
                    'Module 5: Analytics (metrics, utilisation bars)',
                  ]
                },
                {
                  num: '04', title: 'Functionalities',
                  color: 'amber',
                  items: [
                    'Add/Remove processes with custom Allocation & Max',
                    'Update system resources dynamically',
                    'Run Banker\'s Algorithm → Safe/Unsafe decision',
                    'Step-by-step algorithm log (exportable as .txt)',
                    'Resource request simulation (grant/deny)',
                    'RAG: interactive hover tooltips per node',
                  ]
                },
                {
                  num: '05', title: 'Tech Stack',
                  color: 'cyan',
                  items: [
                    'Python 3.10+ — mature, readable, typed',
                    'Streamlit — instant web UI, no HTML/JS needed',
                    'Plotly — pub-quality interactive graphs',
                    'Pandas — matrix display & styling',
                    '@dataclass — TypeScript-like typed structs',
                  ]
                },
                {
                  num: '06', title: 'OS Concepts',
                  color: 'rose',
                  items: [
                    'Deadlock Avoidance: check_safety() — safe sequence',
                    'Deadlock Prevention: request_resources() — deny unsafe',
                    'Resource Allocation Graph: nodes + directed edges',
                    'Process Control Block: Process @dataclass',
                    'Mutual Exclusion: allocation tracking per resource',
                  ]
                },
                {
                  num: '07', title: 'UI/UX Design',
                  color: 'violet',
                  items: [
                    'Dark slate header with live stat pills',
                    'Sidebar for all inputs (Add Process, Resources)',
                    'Tabbed main area: Matrices, RAG, Log, Docs',
                    'Color-coded result banners (green=safe, red=unsafe)',
                    'Custom CSS injected via st.markdown()',
                  ]
                },
                {
                  num: '08', title: 'Execution Plan',
                  color: 'teal',
                  items: [
                    'Step 1: pip install streamlit plotly pandas',
                    'Step 2: Write os_logic.py (data + algorithms)',
                    'Step 3: Write graph_builder.py (Plotly RAG)',
                    'Step 4: Write app.py (UI layout + state)',
                    'Step 5: streamlit run app.py → test all scenarios',
                    'Step 6: Add CSS styling + export features',
                  ]
                },
                {
                  num: '09', title: 'Testing',
                  color: 'orange',
                  items: [
                    'Scenario A: Default 5 processes → expect SAFE',
                    'Scenario B: Add greedy process → expect UNSAFE',
                    'Scenario C: Reduce resources to 2,2,2 → UNSAFE',
                    'Scenario D: Resource request simulation',
                    'Edge: Empty processes list, zero resources, max=alloc',
                  ]
                },
                {
                  num: '10', title: 'Final Output',
                  color: 'indigo',
                  items: [
                    'Live Banker\'s Algorithm with step-by-step log',
                    'Interactive RAG with hover tooltips',
                    'Color-coded matrices (Alloc, Max, Need)',
                    'Viva tip: Run Scenario B live to show deadlock!',
                    'Future: Multi-instance resources, RAG cycle detection',
                  ]
                },
              ].map(section => (
                <div key={section.num}
                  className={`bg-white border border-${section.color}-100 rounded-xl p-4 shadow-sm`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-${section.color}-600 font-black text-2xl leading-none`}>
                      {section.num}
                    </span>
                    <h4 className="font-bold text-gray-800">{section.title}</h4>
                  </div>
                  <ul className="space-y-1">
                    {section.items.map((item, i) => (
                      <li key={i} className="text-xs text-gray-600 flex gap-2">
                        <span className={`text-${section.color}-400 mt-0.5`}>›</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer className="bg-slate-900 text-slate-400 py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="font-semibold text-slate-300 mb-1">
            OS Deadlock Defender — Deadlock Detection & Prevention Toolkit
          </p>
          <p className="text-xs opacity-60 mb-3">
            React + TypeScript + React Flow + Tailwind CSS
            &nbsp;|&nbsp;
            Python + Streamlit + Plotly + Pandas
          </p>
          <div className="flex justify-center gap-6 text-xs">
            <span className="bg-slate-800 px-3 py-1 rounded-full">⚛️ React Edition</span>
            <span className="bg-slate-800 px-3 py-1 rounded-full">🐍 Python Edition</span>
            <span className="bg-slate-800 px-3 py-1 rounded-full">📐 Banker's Algorithm</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
