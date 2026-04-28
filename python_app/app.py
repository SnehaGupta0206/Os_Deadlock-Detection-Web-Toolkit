"""
=============================================================================
  OS DEADLOCK DEFENDER - Fully Dynamic with Real-time Matrix Updates
=============================================================================
  Run: streamlit run app.py
=============================================================================
"""

import streamlit as st
import pandas as pd
from copy import deepcopy
import time

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
# Page Configuration
# ============================================================================

st.set_page_config(
    page_title="OS Deadlock Defender",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded",
)


# ============================================================================
# Custom CSS - Bright & Visible
# ============================================================================

st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

* {
    font-family: 'Inter', sans-serif;
}

.stApp {
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #020617 100%);
}

/* Force all text to be light */
.stMarkdown, p, div, span, label {
    color: #f1f5f9 !important;
}

h1, h2, h3, h4, h5, h6 {
    color: #ffffff !important;
}

/* Glass cards */
.glass-card {
    background: rgba(30, 41, 59, 0.85);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(56, 189, 248, 0.4);
    border-radius: 24px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
}

/* Header */
.header-banner {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border: 1px solid rgba(56, 189, 248, 0.3);
    border-radius: 24px;
    padding: 1.5rem 2rem;
    margin-bottom: 2rem;
}

.header-title {
    font-size: 2.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, #ffffff, #38bdf8, #818cf8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
}

/* Stat cards */
.stat-card {
    background: linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(56, 189, 248, 0.05));
    border: 1px solid rgba(56, 189, 248, 0.4);
    border-radius: 20px;
    padding: 1rem;
    text-align: center;
}

.stat-value {
    font-size: 2rem;
    font-weight: 800;
    background: linear-gradient(135deg, #38bdf8, #818cf8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.stat-label {
    font-size: 0.7rem;
    color: #cbd5e1 !important;
    text-transform: uppercase;
}

/* Buttons */
.stButton > button {
    background: linear-gradient(105deg, #0ea5e9 0%, #3b82f6 100%);
    color: white !important;
    border: none;
    border-radius: 40px;
    font-weight: 600;
    width: 100%;
    transition: all 0.3s ease;
}

.stButton > button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(14, 165, 233, 0.4);
}

/* Sidebar */
section[data-testid="stSidebar"] {
    background: rgba(15, 23, 42, 0.95) !important;
    backdrop-filter: blur(20px);
    border-right: 1px solid rgba(56, 189, 248, 0.2);
}

/* Inputs */
.stTextInput input, .stNumberInput input {
    background: rgba(51, 65, 85, 0.9) !important;
    color: #ffffff !important;
    border: 1px solid #475569 !important;
    border-radius: 16px !important;
}

.stTextInput input:focus {
    border-color: #38bdf8 !important;
    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.3) !important;
}

/* DataFrames - Critical for dynamic updates */
.dataframe {
    background: rgba(30, 41, 59, 0.8) !important;
    border-radius: 16px !important;
    width: 100% !important;
}

.dataframe th {
    background: #1e293b !important;
    color: #38bdf8 !important;
    font-weight: 600 !important;
    padding: 10px !important;
}

.dataframe td {
    background: #0f172a !important;
    color: #e2e8f0 !important;
    padding: 8px !important;
    font-family: monospace !important;
}

/* Log console */
.log-console {
    background: #020617;
    border-radius: 16px;
    border: 1px solid #334155;
    padding: 1rem;
    max-height: 400px;
    overflow-y: auto;
}

.log-line {
    margin: 8px 0;
    padding: 6px 0;
    border-left: 3px solid #0ea5e9;
    padding-left: 12px;
}

.log-time {
    color: #38bdf8;
    font-weight: bold;
    margin-right: 12px;
}

.log-success {
    color: #4ade80;
}

.log-error {
    color: #f87171;
}

.log-info {
    color: #cbd5e6;
}

/* Banners */
.success-banner, .error-banner {
    border-radius: 16px;
    padding: 1rem 1.5rem;
    margin: 1rem 0;
}

.success-banner {
    background: linear-gradient(135deg, #064e3b, #065f46);
    border: 1px solid #10b981;
}

.error-banner {
    background: linear-gradient(135deg, #7f1d1d, #991b1b);
    border: 1px solid #ef4444;
}

/* Metrics */
[data-testid="stMetricValue"] {
    font-size: 1.8rem !important;
    font-weight: 800 !important;
    background: linear-gradient(135deg, #38bdf8, #818cf8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

/* Footer */
.footer {
    text-align: center;
    padding: 2rem;
    color: #64748b !important;
    border-top: 1px solid #334155;
    margin-top: 2rem;
}
</style>
""", unsafe_allow_html=True)


# ============================================================================
# Session State
# ============================================================================

def init_session_state():
    if "total_resources" not in st.session_state:
        st.session_state.total_resources = list(INITIAL_TOTAL)
    if "processes" not in st.session_state:
        st.session_state.processes = deepcopy(INITIAL_PROCESSES)
    if "simulation_log" not in st.session_state:
        st.session_state.simulation_log = []
    if "safe_sequence" not in st.session_state:
        st.session_state.safe_sequence = []
    if "is_safe" not in st.session_state:
        st.session_state.is_safe = None
    if "feedback" not in st.session_state:
        st.session_state.feedback = ""
    if "update_counter" not in st.session_state:
        st.session_state.update_counter = 0

init_session_state()


# ============================================================================
# Helper Functions with Forced Updates
# ============================================================================

def get_available():
    return compute_available(st.session_state.total_resources, st.session_state.processes)

def get_resource_names():
    return [chr(65 + i) for i in range(len(st.session_state.total_resources))]

def force_update():
    """Force a UI refresh by incrementing counter"""
    st.session_state.update_counter += 1

def run_simulation():
    if len(st.session_state.processes) == 0:
        st.session_state.feedback = "⚠️ No processes to simulate! Add some processes first."
        force_update()
        return
    
    with st.spinner("🔍 Running Banker's Safety Algorithm..."):
        time.sleep(0.2)
        state = SystemState(
            processes=st.session_state.processes,
            total_resources=st.session_state.total_resources,
            available=get_available(),
        )
        result = check_safety(state)
        st.session_state.is_safe = result.is_safe
        st.session_state.safe_sequence = result.safe_sequence
        st.session_state.simulation_log = result.log
        st.session_state.feedback = "✅ Algorithm completed!"
        force_update()

def handle_reset():
    st.session_state.processes = deepcopy(INITIAL_PROCESSES)
    st.session_state.total_resources = list(INITIAL_TOTAL)
    st.session_state.is_safe = None
    st.session_state.simulation_log = []
    st.session_state.safe_sequence = []
    st.session_state.feedback = "🔄 System reset to default configuration"
    force_update()

def handle_add_process(alloc_str, max_str):
    try:
        alloc = [int(x.strip()) for x in alloc_str.split(",")]
        max_r = [int(x.strip()) for x in max_str.split(",")]
    except ValueError:
        st.session_state.feedback = "❌ Invalid input! Use numbers separated by commas"
        force_update()
        return

    n = len(st.session_state.total_resources)
    if len(alloc) != n or len(max_r) != n:
        st.session_state.feedback = f"❌ Please enter exactly {n} values"
        force_update()
        return

    for i in range(n):
        if alloc[i] > max_r[i]:
            st.session_state.feedback = f"❌ Allocation cannot exceed Max for resource {chr(65+i)}"
            force_update()
            return
        if alloc[i] < 0 or max_r[i] < 0:
            st.session_state.feedback = "❌ Values cannot be negative"
            force_update()
            return

    pid = len(st.session_state.processes)
    need = calculate_need(max_r, alloc)
    new_proc = Process(id=pid, name=f"P{pid}", allocation=alloc, max=max_r, need=need, finished=False)
    st.session_state.processes.append(new_proc)
    st.session_state.is_safe = None
    st.session_state.feedback = f"✅ Process P{pid} created successfully!"
    force_update()

def handle_update_resources(res_str):
    try:
        res = [int(x.strip()) for x in res_str.split(",")]
        if any(r <= 0 for r in res):
            st.session_state.feedback = "⚠️ Resource values must be positive"
            force_update()
            return
        st.session_state.total_resources = res
        st.session_state.is_safe = None
        
        # Update all processes to match new resource count
        current_res_count = len(res)
        for p in st.session_state.processes:
            # Pad or trim allocation/max/need arrays
            while len(p.allocation) < current_res_count:
                p.allocation.append(0)
                p.max.append(10)
                p.need.append(10)
            while len(p.allocation) > current_res_count:
                p.allocation.pop()
                p.max.pop()
                p.need.pop()
        
        st.session_state.feedback = f"✅ Resources updated to [{', '.join(map(str, res))}]"
        force_update()
    except ValueError:
        st.session_state.feedback = "❌ Invalid resource values! Use numbers separated by commas"
        force_update()

def handle_request(pid, req_str):
    try:
        req = [int(x.strip()) for x in req_str.split(",")]
    except ValueError:
        st.session_state.feedback = "❌ Invalid request format"
        force_update()
        return

    if len(req) != len(st.session_state.total_resources):
        st.session_state.feedback = f"❌ Enter exactly {len(st.session_state.total_resources)} values"
        force_update()
        return

    available = get_available()
    state = SystemState(
        processes=st.session_state.processes,
        total_resources=st.session_state.total_resources,
        available=available,
    )
    result = request_resources(state, pid, req)
    st.session_state.feedback = result.message
    if result.granted and result.new_state:
        st.session_state.processes = result.new_state.processes
        st.session_state.total_resources = result.new_state.total_resources
        st.session_state.is_safe = None
    force_update()

def handle_delete_process(pid):
    if len(st.session_state.processes) <= 1:
        st.session_state.feedback = "❌ Cannot delete the last process"
        force_update()
        return
    
    st.session_state.processes = [p for p in st.session_state.processes if p.id != pid]
    for i, p in enumerate(st.session_state.processes):
        p.id = i
        p.name = f"P{i}"
    st.session_state.is_safe = None
    st.session_state.feedback = f"✅ Process P{pid} removed"
    force_update()

def handle_edit_process(pid, alloc_str, max_str):
    try:
        new_alloc = [int(x.strip()) for x in alloc_str.split(",")]
        new_max = [int(x.strip()) for x in max_str.split(",")]
    except ValueError:
        st.session_state.feedback = "❌ Invalid input"
        force_update()
        return
    
    n = len(st.session_state.total_resources)
    if len(new_alloc) != n or len(new_max) != n:
        st.session_state.feedback = f"❌ Enter exactly {n} values"
        force_update()
        return
    
    for p in st.session_state.processes:
        if p.id == pid:
            p.allocation = new_alloc
            p.max = new_max
            p.need = calculate_need(new_max, new_alloc)
            break
    
    st.session_state.is_safe = None
    st.session_state.feedback = f"✅ Process P{pid} updated!"
    force_update()


# ============================================================================
# Dynamic UI Components
# ============================================================================

def render_header():
    st.markdown(f"""
    <div class="header-banner">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="background: linear-gradient(135deg, #0ea5e9, #3b82f6); border-radius: 60px; padding: 0.8rem; box-shadow: 0 0 20px rgba(14,165,233,0.5);">
                    <span style="font-size: 2rem;">🛡️</span>
                </div>
                <div>
                    <h1 class="header-title">OS DEADLOCK DEFENDER</h1>
                    <p style="color: #94a3b8;">Banker's Algorithm | Dynamic Matrices | Real-time Updates</p>
                </div>
            </div>
            <div style="display: flex; gap: 1rem;">
                <div class="stat-card"><div class="stat-value">{len(st.session_state.processes)}</div><div class="stat-label">PROCESSES</div></div>
                <div class="stat-card"><div class="stat-value">{len(st.session_state.total_resources)}</div><div class="stat-label">RESOURCES</div></div>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)


def render_sidebar():
    with st.sidebar:
        st.markdown("## 🎮 CONTROL PANEL")
        st.markdown("---")
        
        # Resources
        st.markdown("### 📦 RESOURCES")
        current_res = ",".join(map(str, st.session_state.total_resources))
        res_input = st.text_input("Total instances", value=current_res, key="res_input")
        
        col1, col2 = st.columns(2)
        with col1:
            if st.button("🔄 Update", use_container_width=True):
                handle_update_resources(res_input)
        with col2:
            if st.button("🎯 Run Algorithm", use_container_width=True, type="primary"):
                run_simulation()
        
        available = get_available()
        st.info(f"**Available:** `[{', '.join(map(str, available))}]`")
        st.markdown("---")
        
        # Add Process
        st.markdown("### ➕ ADD PROCESS")
        n_res = len(st.session_state.total_resources)
        placeholder = ",".join(["0"] * n_res)
        
        alloc_in = st.text_input("Allocation", placeholder=placeholder, key="add_alloc")
        max_in = st.text_input("Max Need", placeholder=placeholder, key="add_max")
        
        if st.button("✨ Create", use_container_width=True):
            if alloc_in and max_in:
                handle_add_process(alloc_in, max_in)
            else:
                st.warning("Fill both fields")
        
        st.markdown("---")
        
        # Edit Process
        if st.session_state.processes:
            st.markdown("### ✏️ EDIT PROCESS")
            proc_names = [p.name for p in st.session_state.processes]
            edit_proc = st.selectbox("Select process", proc_names, key="edit_proc")
            edit_alloc = st.text_input("New Allocation", placeholder=placeholder, key="edit_alloc")
            edit_max = st.text_input("New Max Need", placeholder=placeholder, key="edit_max")
            if st.button("💾 Save Changes", use_container_width=True):
                if edit_alloc and edit_max:
                    pid = int(edit_proc.replace("P", ""))
                    handle_edit_process(pid, edit_alloc, edit_max)
        
        st.markdown("---")
        
        # Delete Process
        if st.session_state.processes:
            st.markdown("### 🗑️ DELETE PROCESS")
            del_proc = st.selectbox("Select process", proc_names, key="del_proc")
            if st.button("Remove", use_container_width=True):
                pid = int(del_proc.replace("P", ""))
                handle_delete_process(pid)
        
        st.markdown("---")
        
        # Request
        if st.session_state.processes:
            st.markdown("### 📨 REQUEST")
            req_proc = st.selectbox("Process", proc_names, key="req_proc")
            req_input = st.text_input("Request Vector", placeholder=placeholder, key="req_input")
            if st.button("🚀 Submit", use_container_width=True):
                pid = int(req_proc.replace("P", ""))
                handle_request(pid, req_input)
        
        st.markdown("---")
        
        # Reset
        if st.button("🔄 Reset All", use_container_width=True):
            handle_reset()
        
        # Feedback
        if st.session_state.feedback:
            if "✅" in st.session_state.feedback:
                st.success(st.session_state.feedback)
            elif "❌" in st.session_state.feedback:
                st.error(st.session_state.feedback)
            else:
                st.info(st.session_state.feedback)


def render_metrics():
    available = get_available()
    total_allocated = sum(sum(p.allocation) for p in st.session_state.processes)
    total_available = sum(available)
    
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("🖥️ Processes", len(st.session_state.processes))
    c2.metric("📦 Resources", len(st.session_state.total_resources))
    c3.metric("🔒 Allocated", total_allocated)
    c4.metric("✅ Available", total_available)
    
    st.markdown("### 📊 Resource Utilization")
    res_names = get_resource_names()
    totals = st.session_state.total_resources
    avail = available
    
    cols = st.columns(len(totals))
    for i, (name, total, av) in enumerate(zip(res_names, totals, avail)):
        used = total - av
        pct = (used / total * 100) if total > 0 else 0
        with cols[i]:
            st.markdown(f"**{name}**: {used}/{total}")
            st.progress(min(100, max(0, int(pct))))


def render_matrices():
    """Dynamic matrices that update in real-time"""
    procs = st.session_state.processes
    res_names = get_resource_names()
    
    if not procs:
        st.info("✨ No processes yet. Add some using the sidebar!")
        return
    
    c1, c2, c3 = st.columns(3)
    
    # Allocation Matrix
    with c1:
        st.markdown("### 📌 Allocation Matrix")
        alloc_data = []
        for p in procs:
            row = {"Process": p.name}
            for i, r in enumerate(res_names):
                row[f"R{r}"] = p.allocation[i] if i < len(p.allocation) else 0
            alloc_data.append(row)
        df1 = pd.DataFrame(alloc_data)
        st.dataframe(df1, use_container_width=True, hide_index=True)
    
    # Max Matrix
    with c2:
        st.markdown("### 📊 Max Need Matrix")
        max_data = []
        for p in procs:
            row = {"Process": p.name}
            for i, r in enumerate(res_names):
                row[f"R{r}"] = p.max[i] if i < len(p.max) else 0
            max_data.append(row)
        df2 = pd.DataFrame(max_data)
        st.dataframe(df2, use_container_width=True, hide_index=True)
    
    # Need Matrix
    with c3:
        st.markdown("### 🔢 Current Need Matrix")
        need_data = []
        for p in procs:
            row = {"Process": p.name}
            for i, r in enumerate(res_names):
                row[f"R{r}"] = p.need[i] if i < len(p.need) else 0
            need_data.append(row)
        df3 = pd.DataFrame(need_data)
        st.dataframe(df3, use_container_width=True, hide_index=True)


def render_results():
    if st.session_state.is_safe is None:
        return
    
    if st.session_state.is_safe:
        seq_str = " → ".join(f"P{pid}" for pid in st.session_state.safe_sequence)
        st.markdown(f"""
        <div class="success-banner">
            ✅ <strong>SYSTEM IS SAFE</strong><br>
            <small>Safe Sequence: {seq_str}</small>
        </div>
        """, unsafe_allow_html=True)
    else:
        st.markdown(f"""
        <div class="error-banner">
            🚨 <strong>SYSTEM IS UNSAFE</strong><br>
            <small>Deadlock possible! No safe sequence exists.</small>
        </div>
        """, unsafe_allow_html=True)


def render_log():
    st.markdown("### 📜 Algorithm Log")
    
    if not st.session_state.simulation_log:
        st.info("⚡ Click 'Run Algorithm' to execute Banker's Algorithm")
        return
    
    log_html = '<div class="log-console">'
    for i, line in enumerate(st.session_state.simulation_log):
        if "✅" in line or "SAFE" in line:
            css = "log-success"
        elif "❌" in line or "UNSAFE" in line:
            css = "log-error"
        else:
            css = "log-info"
        log_html += f'<div class="log-line"><span class="log-time">[{i+1:02d}]</span><span class="{css}">{line}</span></div>'
    log_html += '</div>'
    st.markdown(log_html, unsafe_allow_html=True)


def render_rag():
    st.markdown("### 🌐 Resource Allocation Graph")
    
    if not st.session_state.processes:
        st.info("✨ No processes to visualize")
        return
    
    fig = build_rag_figure(
        st.session_state.processes,
        get_resource_names(),
        st.session_state.total_resources
    )
    fig.update_layout(height=500, paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
    st.plotly_chart(fig, use_container_width=True, key=f"rag_{st.session_state.update_counter}")


# ============================================================================
# Main
# ============================================================================

def main():
    render_header()
    render_sidebar()
    
    render_metrics()
    render_results()
    
    tab1, tab2, tab3 = st.tabs(["📊 Matrices", "🌐 Resource Graph", "📜 Algorithm Log"])
    
    with tab1:
        render_matrices()
    with tab2:
        render_rag()
    with tab3:
        render_log()
    
    st.markdown("""
    <div class="footer">
        OS Deadlock Defender · Dynamic Matrices · Real-time Updates · Banker's Algorithm
    </div>
    """, unsafe_allow_html=True)


if __name__ == "__main__":
    main()