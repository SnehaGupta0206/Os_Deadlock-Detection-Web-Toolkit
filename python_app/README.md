# 🛡️ OS Deadlock Defender — Python Edition

> **Full Python equivalent of the React/TypeScript OS Deadlock Toolkit**
> Built with Streamlit · Plotly · Pandas

---

## 📁 File Structure & Component Mapping

```
python_app/
│
├── app.py              ← Main application  (= App.tsx + Dashboard.tsx)
├── os_logic.py         ← Core OS algorithms (= src/lib/os-logic.ts)
├── graph_builder.py    ← RAG visualiser    (= src/components/ResourceGraph.tsx)
├── requirements.txt    ← Dependencies
└── README.md           ← This file
```

### Exact File-by-File Mapping

| React/TypeScript File | Python File | What it Does |
|---|---|---|
| `src/App.tsx` | `app.py` → `main()` | App entry point, state management, layout |
| `src/lib/os-logic.ts` | `os_logic.py` | Banker's Algorithm, data structures |
| `src/components/ResourceGraph.tsx` | `graph_builder.py` | Plotly RAG visualisation |
| `src/components/MatrixTable.tsx` | `app.py` → `render_matrices()` | Pandas DataFrames in tabs |
| `src/components/Dashboard.tsx` | `app.py` → `render_sidebar()` | Streamlit sidebar controls |
| React `useState` | `st.session_state` | Global reactive state |
| React `useMemo` | Python `@st.cache_data` / pure functions | Derived/cached computation |
| Tailwind CSS | Custom `st.markdown(css)` | Styling |
| React Flow nodes | Plotly Scatter (markers) | Graph nodes |
| React Flow edges | Plotly Scatter (lines) + annotations | Graph edges with arrows |

---

## 🚀 How to Run

```bash
# 1. Navigate to the python_app directory
cd python_app

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run the Streamlit app
streamlit run app.py

# App opens at: http://localhost:8501
```

---

## 🔁 Concept Translations: TypeScript → Python

### 1. Data Structures

**TypeScript (os-logic.ts):**
```typescript
interface Process {
  id: number;
  name: string;
  allocation: number[];
  max: number[];
  need: number[];
  finished: boolean;
}
```

**Python (os_logic.py):**
```python
@dataclass
class Process:
    id: int
    name: str
    allocation: List[int]
    max: List[int]
    need: List[int]
    finished: bool = False
```

---

### 2. State Management

**TypeScript (App.tsx) — React useState:**
```typescript
const [processes, setProcesses] = useState<Process[]>(INITIAL_PROCESSES);
const [isSafe, setIsSafe] = useState<boolean | null>(null);
const [simulationLog, setSimulationLog] = useState<string[]>([]);
```

**Python (app.py) — Streamlit session_state:**
```python
if "processes" not in st.session_state:
    st.session_state.processes = deepcopy(INITIAL_PROCESSES)
if "is_safe" not in st.session_state:
    st.session_state.is_safe = None
if "simulation_log" not in st.session_state:
    st.session_state.simulation_log = []
```

---

### 3. Banker's Safety Algorithm

**TypeScript (os-logic.ts):**
```typescript
export const checkSafety = (currentState: SystemState): SafetyResult => {
  let work = [...available];
  let finish = new Array(numProcesses).fill(false);

  while (count < numProcesses) {
    for (let p = 0; p < numProcesses; p++) {
      if (!finish[p]) {
        let canAllocate = processes[p].need.every((n, r) => n <= work[r]);
        if (canAllocate) {
          work = work.map((w, r) => w + processes[p].allocation[r]);
          finish[p] = true;
          safeSequence.push(p);
        }
      }
    }
  }
};
```

**Python (os_logic.py):**
```python
def check_safety(state: SystemState) -> SafetyResult:
    work   = list(state.available)
    finish = [False] * len(state.processes)

    while count < n:
        for idx, p in enumerate(processes):
            if not finish[idx]:
                can_allocate = all(p.need[r] <= work[r] for r in range(num_res))
                if can_allocate:
                    work = [work[r] + p.allocation[r] for r in range(num_res)]
                    finish[idx] = True
                    safe_sequence.append(p.id)
```

---

### 4. Derived State (Available Resources)

**TypeScript (App.tsx):**
```typescript
const available = totalResources.map((total, rIdx) =>
  total - processes.reduce((sum, p) => sum + p.allocation[rIdx], 0)
);
```

**Python (os_logic.py):**
```python
def compute_available(total: List[int], processes: List[Process]) -> List[int]:
    return [
        total[r] - sum(p.allocation[r] for p in processes)
        for r in range(len(total))
    ]
```

---

### 5. Resource Allocation Graph

**TypeScript (ResourceGraph.tsx — React Flow):**
```tsx
// Process node
newNodes.push({ id: `P-${p.id}`, style: { borderRadius:'50%', background:'#f0fdf4' } });
// Resource → Process (allocation edge)
newEdges.push({ source:`R-${rIdx}`, target:`P-${p.id}`, style:{stroke:'#0ea5e9'} });
// Process → Resource (need edge, dashed)
newEdges.push({ source:`P-${p.id}`, target:`R-${rIdx}`, style:{strokeDasharray:'5,5'} });
```

**Python (graph_builder.py — Plotly):**
```python
# Process node (green circle)
go.Scatter(mode="markers+text", marker=dict(symbol="circle", color="#bbf7d0"))
# Allocation edge (blue solid line + annotation arrow)
go.Scatter(x=[rx, px], y=[ry, py], line=dict(color="#0ea5e9"))
# Need edge (red dashed line + annotation arrow)
go.Scatter(x=[px, rx], y=[py, ry], line=dict(color="#ef4444", dash="dash"))
```

---

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    STREAMLIT APP                        │
│                    (app.py)                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐    ┌──────────────┐                  │
│  │   SIDEBAR     │    │  MAIN AREA   │                  │
│  │  (Controls)   │    │  (Display)   │                  │
│  │               │    │              │                  │
│  │ • Resources   │    │ Tab 1: Matrices (Pandas)        │
│  │ • Add Process │    │ Tab 2: RAG Graph (Plotly)       │
│  │ • Req Request │    │ Tab 3: Log Console              │
│  │ • Run/Reset   │    │ Tab 4: About/Docs               │
│  └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                           │
│         ▼                   ▼                           │
│  ┌─────────────────────────────────┐                    │
│  │      st.session_state           │                    │
│  │  (processes, total_resources,   │                    │
│  │   simulation_log, is_safe…)     │                    │
│  └──────────────┬──────────────────┘                    │
│                 │                                        │
│         ┌───────┴──────┐                                │
│         ▼              ▼                                 │
│  ┌────────────┐  ┌────────────────┐                    │
│  │ os_logic   │  │ graph_builder  │                    │
│  │  .py       │  │    .py         │                    │
│  │            │  │                │                    │
│  │ Banker's   │  │ Plotly RAG     │                    │
│  │ Algorithm  │  │ Figure builder │                    │
│  └────────────┘  └────────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Feature Checklist

| Feature | React App | Python App |
|---|---|---|
| Banker's Safety Algorithm | ✅ | ✅ |
| Resource Allocation Graph | ✅ React Flow | ✅ Plotly |
| Allocation / Max / Need Matrices | ✅ Custom component | ✅ Pandas DataFrames |
| Add New Process | ✅ Dashboard form | ✅ Sidebar inputs |
| Update System Resources | ✅ Dashboard form | ✅ Sidebar inputs |
| Real-time Safe/Unsafe banner | ✅ | ✅ |
| Step-by-step algorithm log | ✅ | ✅ + Export button |
| Resource Request Simulation | ✅ (os-logic.ts) | ✅ Sidebar form |
| Delete Process | ❌ (removed) | ✅ Process table |
| Resource utilisation bars | ❌ | ✅ Progress bars |
| Statistics panel | ❌ | ✅ Metrics |
| Export log as .txt | ❌ | ✅ Download button |
| Dark theme | ✅ Tailwind slate | ✅ CSS injection |

---

## 🧪 Test Scenarios

### Scenario 1 — Safe State (default)
- Resources: `10,5,7`
- Processes: P0–P4 (textbook example)
- Expected: **SAFE** — Sequence: `P1 → P3 → P4 → P0 → P2`

### Scenario 2 — Force Deadlock
- Add a new process: Alloc=`0,0,0`, Max=`10,10,10`
- Click **Run**
- Expected: **UNSAFE** (resources exhausted)

### Scenario 3 — Resource Request
- Select P0, Request: `0,2,0`
- Expected: Granted (stays safe) or Denied (would cause deadlock)

### Scenario 4 — Reduce Resources
- Change total to `2,2,2`
- Expected: **UNSAFE** (insufficient resources)
