import { useState } from 'react';
import { Code2, Copy, CheckCheck, FileCode, Terminal } from 'lucide-react';

interface CodeBlock {
  label: string;
  file: string;
  tsCode: string;
  pyCode: string;
  explanation: string;
}

const CODE_BLOCKS: CodeBlock[] = [
  {
    label: "Data Structures",
    file: "os_logic.py",
    explanation: "TypeScript interfaces become Python @dataclass — same fields, same types, cleaner syntax.",
    tsCode: `// src/lib/os-logic.ts
interface Process {
  id: number;
  name: string;
  allocation: number[];
  max: number[];
  need: number[];
  finished: boolean;
}

interface SystemState {
  processes: Process[];
  totalResources: number[];
  available: number[];
}`,
    pyCode: `# os_logic.py
from dataclasses import dataclass
from typing import List

@dataclass
class Process:
    id: int
    name: str
    allocation: List[int]
    max: List[int]
    need: List[int]
    finished: bool = False

@dataclass
class SystemState:
    processes: List[Process]
    total_resources: List[int]
    available: List[int]`,
  },
  {
    label: "State Management",
    file: "app.py",
    explanation: "React useState() → Streamlit st.session_state. Both are reactive — changes trigger a UI re-render.",
    tsCode: `// src/App.tsx
const [totalResources, setTotalResources] =
  useState<number[]>(INITIAL_TOTAL);

const [processes, setProcesses] =
  useState<Process[]>(INITIAL_PROCESSES);

const [simulationLog, setSimulationLog] =
  useState<string[]>([]);

const [isSafe, setIsSafe] =
  useState<boolean | null>(null);`,
    pyCode: `# app.py
if "total_resources" not in st.session_state:
    st.session_state.total_resources = list(INITIAL_TOTAL)

if "processes" not in st.session_state:
    st.session_state.processes = deepcopy(INITIAL_PROCESSES)

if "simulation_log" not in st.session_state:
    st.session_state.simulation_log = []

if "is_safe" not in st.session_state:
    st.session_state.is_safe = None`,
  },
  {
    label: "Banker's Safety Algorithm",
    file: "os_logic.py",
    explanation: "The core algorithm is identical in both languages — same loop, same logic. Python uses list comprehensions instead of .every().",
    tsCode: `// src/lib/os-logic.ts
export const checkSafety = (state: SystemState) => {
  let work = [...available];
  let finish = new Array(n).fill(false);

  while (count < numProcesses) {
    let found = false;
    for (let p = 0; p < numProcesses; p++) {
      if (!finish[p]) {
        let canAllocate = true;
        for (let r = 0; r < numResources; r++) {
          if (processes[p].need[r] > work[r]) {
            canAllocate = false; break;
          }
        }
        if (canAllocate) {
          for (let r = 0; r < numResources; r++)
            work[r] += processes[p].allocation[r];
          safeSequence.push(processes[p].id);
          finish[p] = true;
          found = true; count++;
          break;
        }
      }
    }
    if (!found) return { isSafe: false, ...}
  }
  return { isSafe: true, safeSequence, log };
};`,
    pyCode: `# os_logic.py
def check_safety(state: SystemState) -> SafetyResult:
    work   = list(state.available)
    finish = [False] * n

    while count < n:
        found = False
        for idx, p in enumerate(processes):
            if not finish[idx]:
                # Need[p] <= Work for all resources?
                can_allocate = all(
                    p.need[r] <= work[r]
                    for r in range(num_res)
                )
                if can_allocate:
                    for r in range(num_res):
                        work[r] += p.allocation[r]
                    safe_sequence.append(p.id)
                    finish[idx] = True
                    found = True
                    count += 1
                    break

        if not found:
            return SafetyResult(is_safe=False, ...)

    return SafetyResult(is_safe=True,
                        safe_sequence=safe_sequence, log=log)`,
  },
  {
    label: "Derived State (Available)",
    file: "app.py",
    explanation: "React computes available inline during render. Python wraps it in a pure function called on demand.",
    tsCode: `// src/App.tsx
// Computed each render — derived from state
const available = totalResources.map((total, rIdx) => {
  const allocated = processes.reduce(
    (sum, p) => sum + p.allocation[rIdx], 0
  );
  return total - allocated;
});`,
    pyCode: `# os_logic.py
def compute_available(
    total: List[int],
    processes: List[Process]
) -> List[int]:
    return [
        total[r] - sum(p.allocation[r] for p in processes)
        for r in range(len(total))
    ]

# app.py — called when needed
def get_available() -> list:
    return compute_available(
        st.session_state.total_resources,
        st.session_state.processes
    )`,
  },
  {
    label: "Resource Allocation Graph",
    file: "graph_builder.py",
    explanation: "React Flow nodes/edges → Plotly Scatter traces. Both draw process circles, resource squares, and directional arrows.",
    tsCode: `// src/components/ResourceGraph.tsx (React Flow)
// Process node — green circle
newNodes.push({
  id: \`P-\${p.id}\`,
  style: { borderRadius:'50%', background:'#f0fdf4',
           border:'1px solid #16a34a' },
  data: { label: p.name }
});
// Allocation edge: Resource → Process (blue)
newEdges.push({
  source: \`R-\${rIdx}\`, target: \`P-\${p.id}\`,
  style: { stroke: '#0ea5e9', strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed }
});
// Need edge: Process → Resource (dashed red)
newEdges.push({
  source: \`P-\${p.id}\`, target: \`R-\${rIdx}\`,
  animated: true,
  style: { stroke: '#ef4444', strokeDasharray: '5,5' }
});`,
    pyCode: `# graph_builder.py (Plotly)
# Process nodes — green circles
go.Scatter(
    x=[p[0] for p in proc_pos],
    mode="markers+text",
    marker=dict(symbol="circle", size=55,
                color="#bbf7d0",
                line=dict(color="#16a34a", width=3)),
)
# Allocation edge: Resource → Process (blue solid)
alloc_edge_x += [rx, px, None]
go.Scatter(x=alloc_edge_x, y=alloc_edge_y,
    line=dict(color="#0ea5e9", width=2))
# Need edge: Process → Resource (red dashed)
need_edge_x += [px, rx, None]
go.Scatter(x=need_edge_x, y=need_edge_y,
    line=dict(color="#ef4444", width=2, dash="dash"))`,
  },
  {
    label: "Add Process Handler",
    file: "app.py",
    explanation: "Dashboard.tsx form → Streamlit sidebar inputs. Both validate, compute need, and push to state.",
    tsCode: `// src/components/Dashboard.tsx
const handleAddProcess = () => {
  const max  = newProcessMax.split(',').map(Number);
  const alloc = newProcessAlloc.split(',').map(Number);

  if (max.length !== resourceCount ||
      alloc.length !== resourceCount) {
    alert(\`Please enter \${resourceCount} values.\`);
    return;
  }
  const newProc: Process = {
    id: state.processes.length,
    name: \`P\${state.processes.length}\`,
    allocation: alloc,
    max: max,
    need: calculateNeed(max, alloc),
    finished: false,
  };
  onAddProcess(newProc);
};`,
    pyCode: `# app.py
def handle_add_process(alloc_str: str, max_str: str):
    try:
        alloc = [int(x.strip()) for x in alloc_str.split(",")]
        max_r = [int(x.strip()) for x in max_str.split(",")]
    except ValueError:
        st.sidebar.error("Enter only numbers.")
        return

    n = len(st.session_state.total_resources)
    if len(alloc) != n or len(max_r) != n:
        st.sidebar.error(f"Enter exactly {n} values.")
        return

    pid  = len(st.session_state.processes)
    need = calculate_need(max_r, alloc)
    new_proc = Process(id=pid, name=f"P{pid}",
                       allocation=alloc, max=max_r, need=need)
    st.session_state.processes.append(new_proc)`,
  },
  {
    label: "Matrix Display",
    file: "app.py",
    explanation: "MatrixTable.tsx (custom HTML table) → Pandas DataFrame with .style (color-coded via Streamlit).",
    tsCode: `// src/components/MatrixTable.tsx
<table className="min-w-full divide-y divide-gray-200">
  <thead>
    <tr>
      <th>PID</th>
      {resourceNames.map((r, i) => <th key={i}>{r}</th>)}
    </tr>
  </thead>
  <tbody>
    {processes.map((p) => (
      <tr key={p.id}>
        <td>P{p.id}</td>
        {p[type].map((val, idx) => (
          <td key={idx}>{val}</td>
        ))}
      </tr>
    ))}
  </tbody>
</table>`,
    pyCode: `# app.py → render_matrices()
def _df(field: str) -> pd.DataFrame:
    data = {
        f"Res {r}": [getattr(p, field)[i] for p in procs]
        for i, r in enumerate(res_names)
    }
    return pd.DataFrame(data, index=[p.name for p in procs])

# Render with color styling
st.dataframe(
    _df("allocation").style.set_properties(**{
        "background-color": "#f0fdf4",
        "color": "#14532d",
        "font-weight": "600",
    }),
    use_container_width=True,
    height=200
)`,
  },
];

const INSTALL_SCRIPT = `# ─── Step 1: Navigate to the python_app folder ───
cd python_app

# ─── Step 2: Install all dependencies ───
pip install streamlit plotly pandas

# ─── Step 3: Run the app ───
streamlit run app.py

# ─── App opens at http://localhost:8501 ───`;

export const PythonViewer = () => {
  const [activeBlock, setActiveBlock] = useState<number>(0);
  const [showTS, setShowTS] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const block = CODE_BLOCKS[activeBlock];

  return (
    <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
      {/* Top bar */}
      <div className="bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center gap-3">
        <FileCode className="text-yellow-400" size={22} />
        <div>
          <h3 className="text-white font-bold text-lg">Python Code Viewer</h3>
          <p className="text-slate-400 text-xs">
            Exact Python equivalent of every React/TypeScript module — side by side
          </p>
        </div>
      </div>

      {/* Install banner */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-emerald-400 text-xs font-mono font-bold flex items-center gap-2">
            <Terminal size={14} /> Quick Start
          </span>
          <button
            onClick={() => handleCopy(INSTALL_SCRIPT, 'install')}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            {copied === 'install' ? <CheckCheck size={12} className="text-emerald-400" /> : <Copy size={12} />}
            {copied === 'install' ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre className="text-xs text-emerald-300 font-mono whitespace-pre-wrap leading-relaxed">
          {INSTALL_SCRIPT}
        </pre>
      </div>

      {/* Section selector */}
      <div className="flex overflow-x-auto bg-slate-900 border-b border-slate-700 gap-1 px-4 py-2">
        {CODE_BLOCKS.map((b, i) => (
          <button
            key={i}
            onClick={() => setActiveBlock(i)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
              activeBlock === i
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Explanation */}
      <div className="bg-slate-800 px-6 py-3 border-b border-slate-700">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-yellow-400 text-xs font-bold">📁 {block.file}</span>
        </div>
        <p className="text-slate-300 text-sm">{block.explanation}</p>
      </div>

      {/* Code toggle */}
      <div className="flex border-b border-slate-700">
        <button
          onClick={() => setShowTS(true)}
          className={`flex-1 py-2.5 text-xs font-bold transition-colors ${
            showTS
              ? 'bg-blue-900/50 text-blue-300 border-b-2 border-blue-500'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          🟦 TypeScript / React
        </button>
        <button
          onClick={() => setShowTS(false)}
          className={`flex-1 py-2.5 text-xs font-bold transition-colors ${
            !showTS
              ? 'bg-yellow-900/50 text-yellow-300 border-b-2 border-yellow-500'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          🐍 Python / Streamlit
        </button>
      </div>

      {/* Code block */}
      <div className="relative">
        <button
          onClick={() => handleCopy(showTS ? block.tsCode : block.pyCode, `code-${activeBlock}`)}
          className="absolute top-3 right-4 z-10 flex items-center gap-1.5 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded text-xs transition-colors"
        >
          {copied === `code-${activeBlock}`
            ? <><CheckCheck size={12} className="text-emerald-400" /> Copied!</>
            : <><Copy size={12} /> Copy</>
          }
        </button>
        <pre className="p-6 pt-10 text-sm font-mono overflow-x-auto text-slate-100 leading-relaxed bg-slate-950 max-h-96 overflow-y-auto">
          <code className={showTS ? 'text-blue-200' : 'text-yellow-200'}>
            {showTS ? block.tsCode : block.pyCode}
          </code>
        </pre>
      </div>

      {/* Module map table */}
      <div className="bg-slate-900 border-t border-slate-700 px-6 py-5">
        <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
          <Code2 size={15} className="text-purple-400" />
          Complete File Mapping
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="text-slate-500 border-b border-slate-700">
                <th className="text-left pb-2 pr-6">TypeScript File</th>
                <th className="text-left pb-2 pr-6">Python File</th>
                <th className="text-left pb-2">Role</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {[
                ['src/App.tsx', 'app.py → main()', 'App entry, layout, state'],
                ['src/lib/os-logic.ts', 'os_logic.py', "Banker's Algorithm"],
                ['src/components/ResourceGraph.tsx', 'graph_builder.py', 'RAG visualisation'],
                ['src/components/MatrixTable.tsx', 'render_matrices()', 'Pandas DataFrames'],
                ['src/components/Dashboard.tsx', 'render_sidebar()', 'Control panel'],
                ['React useState()', 'st.session_state', 'Reactive state'],
                ['Tailwind CSS classes', 'st.markdown(css)', 'Styling'],
                ['React Flow nodes/edges', 'Plotly Scatter traces', 'Graph rendering'],
              ].map(([ts, py, role], i) => (
                <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-1.5 pr-6 text-blue-300">{ts}</td>
                  <td className="py-1.5 pr-6 text-yellow-300">{py}</td>
                  <td className="py-1.5 text-slate-400">{role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
