"""
=============================================================================
  OS DEADLOCK TOOLKIT — Streamlit Application
  Python equivalent of the full React/TypeScript app (App.tsx + all components)
=============================================================================

  Run with:
      cd python_app
      pip install streamlit plotly pandas
      streamlit run app.py

=============================================================================
  Module Mapping  (React → Python)
  ─────────────────────────────────────────────────────────────────────────
  src/lib/os-logic.ts          →  os_logic.py        (algorithms)
  src/components/ResourceGraph →  graph_builder.py   (Plotly RAG)
  src/components/MatrixTable   →  render_matrices()  (st.dataframe)
  src/components/Dashboard     →  sidebar controls   (st.sidebar)
  src/App.tsx                  →  app.py             (this file)
=============================================================================
"""

import streamlit as st
import pandas as pd
from copy import deepcopy

from os_logic import (
    Process,
    SystemState,
    calculate_need,
    compute_available,
    check_safety,
    request_resources,
    INITIAL_TOTAL,
    INITIAL_PROCESSES,
)
from graph_builder import build_rag_figure


# ============================================================================
# 0.  Page Configuration  (must be first Streamlit call)
# ============================================================================

st.set_page_config(
    page_title="OS Deadlock Defender",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded",
)


# ============================================================================
# 1.  Global CSS  (mirrors Tailwind slate dark theme)
# ============================================================================

st.markdown("""
<style>
/* ── Global background ── */
.stApp { background-color: #f8fafc; }

/* ── Header banner ── */
.header-banner {
    background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
    padding: 1.4rem 2rem;
    border-radius: 14px;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 4px 24px rgba(0,0,0,0.25);
}
.header-title {
    font-size: 1.9rem;
    font-weight: 800;
    color: #f8fafc;
    margin: 0;
    letter-spacing: -0.5px;
}
.header-subtitle {
    font-size: 0.8rem;
    color: #94a3b8;
    margin: 0;
}
.header-badges {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
    margin-top: 0.4rem;
}
.badge {
    background: rgba(255,255,255,0.08);
    color: #cbd5e1;
    padding: 3px 10px;
    border-radius: 99px;
    font-size: 0.72rem;
    border: 1px solid rgba(255,255,255,0.12);
}

/* ── Section cards ── */
.section-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.2rem 1.4rem;
    margin-bottom: 1.2rem;
    box-shadow: 0 1px 6px rgba(0,0,0,0.06);
}
.section-title {
    font-size: 1rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.8rem;
    border-left: 4px solid #3b82f6;
    padding-left: 0.6rem;
}

/* ── Result banners ── */
.safe-banner {
    background: linear-gradient(135deg,#d1fae5,#a7f3d0);
    border: 1.5px solid #34d399;
    border-radius: 10px;
    padding: 1rem 1.4rem;
    color: #065f46;
    font-weight: 600;
    font-size: 1rem;
}
.unsafe-banner {
    background: linear-gradient(135deg,#fee2e2,#fecaca);
    border: 1.5px solid #f87171;
    border-radius: 10px;
    padding: 1rem 1.4rem;
    color: #7f1d1d;
    font-weight: 600;
    font-size: 1rem;
}

/* ── Log console ── */
.log-console {
    background: #0f172a;
    border-radius: 10px;
    padding: 1rem 1.2rem;
    font-family: 'Courier New', monospace;
    font-size: 0.82rem;
    max-height: 260px;
    overflow-y: auto;
    border: 1px solid #334155;
}
.log-line { margin: 3px 0; color: #94a3b8; }
.log-line span.step { color: #38bdf8; font-weight: bold; margin-right: 6px; }
.log-line span.safe  { color: #4ade80; }
.log-line span.unsafe { color: #f87171; }

/* ── Matrix tables ── */
.matrix-header {
    background: #f1f5f9;
    font-size: 0.78rem;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 4px 8px;
    border-bottom: 1px solid #e2e8f0;
    border-radius: 8px 8px 0 0;
}

/* ── Process table ── */
.proc-table { width: 100%; border-collapse: collapse; font-size: 0.83rem; }
.proc-table th {
    background:#f8fafc; color:#64748b; font-weight:600;
    text-transform:uppercase; font-size:0.7rem; letter-spacing:0.05em;
    padding: 6px 10px; border-bottom: 1px solid #e2e8f0;
}
.proc-table td { padding: 6px 10px; border-bottom: 1px solid #f1f5f9; color:#334155; }
.proc-table tr:last-child td { border-bottom: none; }

/* ── Sidebar ── */
section[data-testid="stSidebar"] {
    background: #0f172a !important;
}
section[data-testid="stSidebar"] * { color: #e2e8f0 !important; }
section[data-testid="stSidebar"] .stButton button {
    background: #3b82f6 !important;
    color: white !important;
    border: none !important;
    font-weight: 600;
    border-radius: 8px;
    width: 100%;
}
section[data-testid="stSidebar"] .stTextInput input,
section[data-testid="stSidebar"] .stNumberInput input {
    background: #1e293b !important;
    color: #f1f5f9 !important;
    border: 1px solid #334155 !important;
    border-radius: 6px !important;
}

/* ── Footer ── */
.footer {
    text-align: center;
    color: #94a3b8;
    font-size: 0.76rem;
    padding: 2rem 0 1rem;
    border-top: 1px solid #e2e8f0;
    margin-top: 2rem;
}
</style>
""", unsafe_allow_html=True)


# ============================================================================
# 2.  Session State  (mirrors React useState in App.tsx)
# ============================================================================

def _init_state():
    """Initialise Streamlit session state once (equivalent to React's useState)."""
    if "total_resources" not in st.session_state:
        st.session_state.total_resources = list(INITIAL_TOTAL)
    if "processes" not in st.session_state:
        st.session_state.processes = deepcopy(INITIAL_PROCESSES)
    if "simulation_log" not in st.session_state:
        st.session_state.simulation_log = []
    if "safe_sequence" not in st.session_state:
        st.session_state.safe_sequence = []
    if "is_safe" not in st.session_state:
        st.session_state.is_safe = None       # None = not run yet
    if "request_log" not in st.session_state:
        st.session_state.request_log = []

_init_state()


# ============================================================================
# 3.  Derived State  (mirrors computed `available` in App.tsx)
# ============================================================================

def get_available() -> list:
    return compute_available(
        st.session_state.total_resources,
        st.session_state.processes
    )


def get_resource_names() -> list:
    """A, B, C, D … per resource type."""
    return [chr(65 + i) for i in range(len(st.session_state.total_resources))]


# ============================================================================
# 4.  Action Handlers  (mirror React event handlers in App.tsx / Dashboard.tsx)
# ============================================================================

def handle_reset():
    """Mirrors handleReset() in App.tsx."""
    st.session_state.processes       = deepcopy(INITIAL_PROCESSES)
    st.session_state.total_resources = list(INITIAL_TOTAL)
    st.session_state.is_safe         = None
    st.session_state.simulation_log  = []
    st.session_state.safe_sequence   = []
    st.session_state.request_log     = []


def run_simulation():
    """Mirrors runSimulation() in App.tsx → calls checkSafety()."""
    available = get_available()
    state = SystemState(
        processes       = st.session_state.processes,
        total_resources = st.session_state.total_resources,
        available       = available,
    )
    result = check_safety(state)
    st.session_state.is_safe        = result.is_safe
    st.session_state.safe_sequence  = result.safe_sequence
    st.session_state.simulation_log = result.log


def handle_add_process(alloc_str: str, max_str: str):
    """Mirrors handleAddProcess() in Dashboard.tsx → App.tsx."""
    try:
        alloc = [int(x.strip()) for x in alloc_str.split(",")]
        max_r = [int(x.strip()) for x in max_str.split(",")]
    except ValueError:
        st.sidebar.error("⚠️  Enter only numbers separated by commas.")
        return

    n = len(st.session_state.total_resources)
    if len(alloc) != n or len(max_r) != n:
        st.sidebar.error(f"⚠️  Please enter exactly {n} values (one per resource).")
        return

    for i in range(n):
        if alloc[i] > max_r[i]:
            st.sidebar.error(f"⚠️  Allocation[{i}] ({alloc[i]}) cannot exceed Max[{i}] ({max_r[i]}).")
            return

    pid  = len(st.session_state.processes)
    need = calculate_need(max_r, alloc)
    new_proc = Process(id=pid, name=f"P{pid}", allocation=alloc,
                       max=max_r, need=need)
    st.session_state.processes.append(new_proc)
    st.session_state.is_safe = None    # Reset simulation — state changed


def handle_update_resources(res_str: str):
    """Mirrors handleUpdateResources() in App.tsx."""
    try:
        res = [int(x.strip()) for x in res_str.split(",")]
    except ValueError:
        st.sidebar.error("⚠️  Enter only numbers separated by commas.")
        return
    st.session_state.total_resources = res
    st.session_state.is_safe = None


def handle_request(pid: int, req_str: str):
    """Mirrors requestResources() in os-logic.ts."""
    try:
        req = [int(x.strip()) for x in req_str.split(",")]
    except ValueError:
        st.session_state.request_log = ["❌  Invalid request format."]
        return

    available = get_available()
    state = SystemState(
        processes       = st.session_state.processes,
        total_resources = st.session_state.total_resources,
        available       = available,
    )
    result = request_resources(state, pid, req)
    st.session_state.request_log = [result.message]
    if result.granted and result.new_state:
        st.session_state.processes       = result.new_state.processes
        st.session_state.total_resources = result.new_state.total_resources
        st.session_state.is_safe         = None   # Force re-run


def handle_delete_process(pid: int):
    """Remove a process by ID (extra Python-only feature)."""
    st.session_state.processes = [
        p for p in st.session_state.processes if p.id != pid
    ]
    # Re-assign IDs to stay contiguous
    for i, p in enumerate(st.session_state.processes):
        p.id   = i
        p.name = f"P{i}"
    st.session_state.is_safe = None


# ============================================================================
# 5.  Render Helpers  (equivalent to React sub-components)
# ============================================================================

# ---------------------------------------------------------------------------
# 5a. Header  (mirrors <header> in App.tsx)
# ---------------------------------------------------------------------------

def render_header():
    st.markdown("""
    <div class="header-banner">
      <span style="font-size:2.6rem">🛡️</span>
      <div>
        <p class="header-title">OS Deadlock Defender</p>
        <p class="header-subtitle">Banker's Algorithm &amp; Resource Allocation Graph Toolkit</p>
        <div class="header-badges">
          <span class="badge">⚡ Real-time Simulation</span>
          <span class="badge">🖥️ Resource Monitoring</span>
          <span class="badge">🔒 Deadlock Prevention</span>
          <span class="badge">📊 Visual RAG</span>
        </div>
      </div>
    </div>
    """, unsafe_allow_html=True)


# ---------------------------------------------------------------------------
# 5b. Sidebar Controls  (mirrors Dashboard.tsx)
# ---------------------------------------------------------------------------

def render_sidebar():
    """
    The full sidebar is the Python equivalent of Dashboard.tsx —
    the control panel for adding processes, setting resources, and running simulations.
    """
    st.sidebar.markdown("## ⚙️ Control Panel")

    # ── System Resources ──────────────────────────────────────────────
    st.sidebar.markdown("### 📦 System Resources")
    current_res = ",".join(map(str, st.session_state.total_resources))
    res_input   = st.sidebar.text_input(
        "Total resources (comma-separated)",
        value=current_res,
        help="e.g. 10,5,7 means Resource A=10, B=5, C=7",
        key="res_input"
    )
    if st.sidebar.button("🔄 Update Resources"):
        handle_update_resources(res_input)
        st.rerun()

    available = get_available()
    st.sidebar.markdown(
        f"**Available Now:** `{available}`",
    )
    st.sidebar.divider()

    # ── Add Process ───────────────────────────────────────────────────
    st.sidebar.markdown("### ➕ Add New Process")
    n_res     = len(st.session_state.total_resources)
    placeholder = ",".join(["0"] * n_res)

    alloc_in  = st.sidebar.text_input("Allocation", value="",
                                       placeholder=placeholder,
                                       key="add_alloc")
    max_in    = st.sidebar.text_input("Max Need",   value="",
                                       placeholder=placeholder,
                                       key="add_max")
    if st.sidebar.button("➕ Add Process"):
        if alloc_in.strip() and max_in.strip():
            handle_add_process(alloc_in, max_in)
            st.rerun()
        else:
            st.sidebar.warning("Fill in both Allocation and Max fields.")

    st.sidebar.divider()

    # ── Resource Request Simulation ────────────────────────────────────
    st.sidebar.markdown("### 📥 Simulate Resource Request")
    proc_names  = [p.name for p in st.session_state.processes]
    if proc_names:
        sel_proc  = st.sidebar.selectbox("Process", proc_names, key="req_proc")
        req_input = st.sidebar.text_input("Request", placeholder=placeholder,
                                           key="req_input")
        if st.sidebar.button("📤 Submit Request"):
            pid = int(sel_proc.replace("P", ""))
            handle_request(pid, req_input)
            st.rerun()
    else:
        st.sidebar.info("No processes defined yet.")

    st.sidebar.divider()

    # ── Run / Reset ────────────────────────────────────────────────────
    col1, col2 = st.sidebar.columns(2)
    with col1:
        if st.button("▶ Run", use_container_width=True, type="primary"):
            run_simulation()
            st.rerun()
    with col2:
        if st.button("↺ Reset", use_container_width=True):
            handle_reset()
            st.rerun()


# ---------------------------------------------------------------------------
# 5c. Matrix Tables  (mirrors MatrixTable.tsx)
# ---------------------------------------------------------------------------

def render_matrices():
    """
    Renders Allocation, Max, and Need matrices side-by-side.
    Mirrors the three <MatrixTable> calls in App.tsx.
    """
    procs      = st.session_state.processes
    res_names  = get_resource_names()

    if not procs:
        st.info("No processes to display.")
        return

    col1, col2, col3 = st.columns(3)

    def _df(field: str) -> pd.DataFrame:
        data = {f"Res {r}": [getattr(p, field)[i] for p in procs]
                for i, r in enumerate(res_names)}
        df = pd.DataFrame(data, index=[p.name for p in procs])
        return df

    with col1:
        st.markdown('<div class="matrix-header">📌 Allocation Matrix</div>',
                    unsafe_allow_html=True)
        st.dataframe(
            _df("allocation").style
            .set_properties(**{"background-color": "#f0fdf4", "color": "#14532d",
                                "font-weight": "600", "text-align": "center"})
            .set_table_styles([{
                "selector": "th",
                "props": [("background","#dcfce7"),("color","#15803d"),
                           ("font-weight","bold"),("text-align","center")]
            }]),
            use_container_width=True, height=200
        )

    with col2:
        st.markdown('<div class="matrix-header">📊 Max Need Matrix</div>',
                    unsafe_allow_html=True)
        st.dataframe(
            _df("max").style
            .set_properties(**{"background-color": "#fefce8", "color": "#713f12",
                                "font-weight": "600", "text-align": "center"})
            .set_table_styles([{
                "selector": "th",
                "props": [("background","#fef9c3"),("color","#854d0e"),
                           ("font-weight","bold"),("text-align","center")]
            }]),
            use_container_width=True, height=200
        )

    with col3:
        st.markdown('<div class="matrix-header">🔢 Current Need Matrix</div>',
                    unsafe_allow_html=True)
        st.dataframe(
            _df("need").style
            .set_properties(**{"background-color": "#eff6ff", "color": "#1e3a8a",
                                "font-weight": "600", "text-align": "center"})
            .set_table_styles([{
                "selector": "th",
                "props": [("background","#dbeafe"),("color","#1d4ed8"),
                           ("font-weight","bold"),("text-align","center")]
            }]),
            use_container_width=True, height=200
        )


# ---------------------------------------------------------------------------
# 5d. Process Table  (extra feature — shows all process details)
# ---------------------------------------------------------------------------

def render_process_table():
    """Full process listing with delete buttons."""
    procs     = st.session_state.processes
    res_names = get_resource_names()

    if not procs:
        st.info("No processes defined. Add one from the sidebar.")
        return

    rows = []
    for p in procs:
        rows.append({
            "PID"        : p.name,
            "Allocation" : str(p.allocation),
            "Max"        : str(p.max),
            "Need"       : str(p.need),
            "Status"     : "✅ Finished" if p.finished else "⏳ Waiting",
        })

    df = pd.DataFrame(rows)
    st.dataframe(df, use_container_width=True, hide_index=True)

    # Delete buttons
    with st.expander("🗑️ Remove a Process"):
        proc_to_del = st.selectbox(
            "Select process to remove",
            [p.name for p in procs],
            key="del_proc_select"
        )
        if st.button("Delete Process", key="del_proc_btn"):
            pid = int(proc_to_del.replace("P", ""))
            handle_delete_process(pid)
            st.rerun()


# ---------------------------------------------------------------------------
# 5e. Simulation Results Banner  (mirrors the isSafe banner in Dashboard.tsx)
# ---------------------------------------------------------------------------

def render_results_banner():
    is_safe = st.session_state.is_safe
    seq     = st.session_state.safe_sequence
    procs   = st.session_state.processes

    if is_safe is None:
        st.info("▶  Click **Run** in the sidebar to execute the Banker's Algorithm.")
        return

    if is_safe:
        seq_str = " → ".join(f"P{pid}" for pid in seq)
        st.markdown(f"""
        <div class="safe-banner">
            ✅ &nbsp; System is <b>SAFE</b><br>
            <span style="font-size:0.9rem; font-weight:400;">
                Safe Sequence: &nbsp; <code>{seq_str}</code>
            </span>
        </div>
        """, unsafe_allow_html=True)
    else:
        st.markdown("""
        <div class="unsafe-banner">
            🚨 &nbsp; System is <b>UNSAFE</b> — Deadlock is possible!<br>
            <span style="font-size:0.9rem; font-weight:400;">
                No safe execution sequence exists with the current resource allocation.
            </span>
        </div>
        """, unsafe_allow_html=True)


# ---------------------------------------------------------------------------
# 5f. Simulation Log Console  (mirrors the log panel in Dashboard.tsx)
# ---------------------------------------------------------------------------

def render_log_console():
    log = st.session_state.simulation_log

    st.markdown("#### 🖥️ Algorithm Execution Log")

    if not log:
        st.markdown(
            '<div class="log-console"><span class="log-line">'
            '<span class="step">&gt;</span> Waiting for simulation…'
            '</span></div>',
            unsafe_allow_html=True
        )
        return

    lines_html = ""
    for i, line in enumerate(log):
        css_class = "safe" if "SAFE" in line else ("unsafe" if "UNSAFE" in line else "")
        lines_html += (
            f'<div class="log-line">'
            f'<span class="step">[{i+1:02d}]</span>'
            f'<span class="{css_class}">{line}</span>'
            f'</div>'
        )

    st.markdown(
        f'<div class="log-console">{lines_html}</div>',
        unsafe_allow_html=True
    )


# ---------------------------------------------------------------------------
# 5g. Request Log  (extra feature for resource request simulation)
# ---------------------------------------------------------------------------

def render_request_log():
    log = st.session_state.request_log
    if not log:
        return
    for msg in log:
        if "GRANTED" in msg or "✅" in msg:
            st.success(msg)
        elif "DENIED" in msg or "❌" in msg or "🚫" in msg:
            st.error(msg)
        elif "wait" in msg.lower() or "⏳" in msg:
            st.warning(msg)
        else:
            st.info(msg)


# ---------------------------------------------------------------------------
# 5h. Resource Allocation Graph  (mirrors ResourceGraph.tsx)
# ---------------------------------------------------------------------------

def render_rag():
    """
    Plotly-powered RAG, equivalent to the ReactFlow-based ResourceGraph.tsx.
    • Green circles  = Processes
    • Blue squares   = Resources
    • Blue arrows    = Allocation (Resource → Process)
    • Red arrows     = Need       (Process  → Resource)
    """
    procs     = st.session_state.processes
    res_names = get_resource_names()
    totals    = st.session_state.total_resources

    fig = build_rag_figure(procs, res_names, totals)
    st.plotly_chart(fig, use_container_width=True, config={"displayModeBar": False})

    # Legend explanation
    leg1, leg2, leg3 = st.columns(3)
    with leg1:
        st.markdown("🟢 **Circle** = Process node")
    with leg2:
        st.markdown("🔵 **Square** = Resource node")
    with leg3:
        st.markdown("🔵 Solid = Allocated &nbsp;&nbsp; 🔴 Dashed = Need/Request")


# ---------------------------------------------------------------------------
# 5i. Statistics Panel  (extra visual feature)
# ---------------------------------------------------------------------------

def render_stats():
    procs     = st.session_state.processes
    totals    = st.session_state.total_resources
    available = get_available()
    res_names = get_resource_names()

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("🖥️ Processes", len(procs))
    c2.metric("📦 Resource Types", len(totals))
    total_alloc = sum(sum(p.allocation) for p in procs)
    c3.metric("🔒 Total Allocated", total_alloc)
    c4.metric("✅ Total Available", sum(available))

    # Per-resource utilisation bars
    if totals:
        st.markdown("##### Resource Utilisation")
        util_cols = st.columns(len(totals))
        for i, (rname, total, avail) in enumerate(zip(res_names, totals, available)):
            used  = total - avail
            pct   = (used / total * 100) if total > 0 else 0
            util_cols[i].markdown(f"**{rname}** — {used}/{total} used ({pct:.0f}%)")
            util_cols[i].progress(max(0, min(100, int(pct))))


# ---------------------------------------------------------------------------
# 5j. Project Info / About section  (requested in original prompt)
# ---------------------------------------------------------------------------

def render_about():
    st.markdown("""
    <div class="section-card">
    <div class="section-title">📚 About This Toolkit</div>

    <b>Real-World Problem Solved:</b>
    Deadlocks occur in databases, operating systems, and distributed systems when
    processes indefinitely wait for each other's resources. This toolkit implements
    the OS-level prevention mechanisms that systems like MySQL InnoDB and Linux kernel use.

    <br><br>
    <b>Banker's Algorithm:</b>
    Developed by Edsger Dijkstra, it works by simulating resource allocation and
    checking if the resulting state is <em>safe</em> — i.e., there exists at least
    one order in which all processes can complete without deadlock.

    <br><br>
    <b>Key OS Concepts Demonstrated:</b>
    <ul>
        <li>🔒 <b>Deadlock Prevention</b>  — Never enter unsafe state</li>
        <li>🔍 <b>Deadlock Detection</b>   — Identify circular wait in RAG</li>
        <li>📊 <b>Resource Allocation</b>  — Allocation, Max, Need matrices</li>
        <li>⚙️ <b>Process Scheduling</b>  — Safe sequence = execution order</li>
        <li>🧠 <b>Memory Management</b>   — Track held vs. requested resources</li>
    </ul>

    <b>Real-Life Applications:</b>
    Database transaction managers (MySQL, PostgreSQL),
    Linux kernel resource locks,
    Cloud orchestration (Kubernetes),
    Distributed system consensus protocols.
    </div>
    """, unsafe_allow_html=True)


# ============================================================================
# 6.  Main Application Layout  (mirrors the full JSX return in App.tsx)
# ============================================================================

def main():
    # ── Header ──────────────────────────────────────────────────────────
    render_header()

    # ── Sidebar ─────────────────────────────────────────────────────────
    render_sidebar()

    # ── Statistics ──────────────────────────────────────────────────────
    with st.container():
        st.markdown('<div class="section-card">', unsafe_allow_html=True)
        render_stats()
        st.markdown('</div>', unsafe_allow_html=True)

    # ── Simulation Result + Request Log ─────────────────────────────────
    res_col, req_col = st.columns([2, 1])
    with res_col:
        render_results_banner()
    with req_col:
        render_request_log()

    st.divider()

    # ── Main Tabs ────────────────────────────────────────────────────────
    tab1, tab2, tab3, tab4 = st.tabs([
        "🗂️  Matrices",
        "🌐  Resource Allocation Graph",
        "🖥️  Algorithm Log",
        "ℹ️  About / Docs",
    ])

    with tab1:
        st.markdown("### Process State Matrices")
        render_matrices()
        st.divider()
        st.markdown("### 📋 Process Table")
        render_process_table()

    with tab2:
        st.markdown("### 🌐 Resource Allocation Graph (RAG)")
        st.caption(
            "Visualises the current deadlock state. "
            "Blue arrows = allocated resources. Red arrows = resource requests (need)."
        )
        render_rag()

    with tab3:
        render_log_console()
        if st.session_state.simulation_log:
            log_text = "\n".join(
                f"[{i+1:02d}] {line}"
                for i, line in enumerate(st.session_state.simulation_log)
            )
            st.download_button(
                "⬇️  Export Log",
                data=log_text,
                file_name="banker_algorithm_log.txt",
                mime="text/plain"
            )

    with tab4:
        render_about()
        st.markdown("---")
        st.markdown("""
        **Technology Stack:**
        | Component | Technology | Why |
        |-----------|-----------|-----|
        | UI Framework | **Streamlit** | Rapid Python web apps, no JS needed |
        | Visualisation | **Plotly** | Interactive, publication-quality graphs |
        | Data Tables | **Pandas** | Industry-standard tabular data in Python |
        | Core Logic | **Python dataclasses** | Clean, typed, mirrors TypeScript interfaces |
        | Algorithm | **Banker's Algorithm** | Standard OS deadlock avoidance algorithm |
        """)

    # ── Footer ──────────────────────────────────────────────────────────
    st.markdown(
        '<div class="footer">'
        'OS Deadlock Defender &nbsp;·&nbsp; '
        'Built with Python · Streamlit · Plotly &nbsp;·&nbsp; '
        'Banker\'s Algorithm Implementation'
        '</div>',
        unsafe_allow_html=True
    )


# ============================================================================
# 7.  Entry Point
# ============================================================================

if __name__ == "__main__":
    main()
