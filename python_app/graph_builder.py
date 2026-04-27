"""
=============================================================================
  OS DEADLOCK TOOLKIT — Resource Allocation Graph Builder
  Equivalent of: src/components/ResourceGraph.tsx
=============================================================================
  Uses Plotly to draw the RAG:
    • Process nodes  → green circles   (left column)
    • Resource nodes → blue squares    (right column)
    • Allocation edge: Resource → Process  (solid blue)   = "holding"
    • Need edge:       Process  → Resource (dashed red)    = "waiting"

  FIX: Replaced axref/ayref="paper" annotations (dropped in newer Plotly)
       with arrowhead markers drawn on scatter traces instead.
=============================================================================
"""

from typing import List
import plotly.graph_objects as go
from os_logic import Process


# ---------------------------------------------------------------------------
# Layout helpers
# ---------------------------------------------------------------------------

def _process_positions(num_processes: int, x: float = 0.15) -> List[tuple]:
    """Evenly space process nodes vertically on the left."""
    if num_processes == 0:
        return []
    step = 1.0 / (num_processes + 1)
    return [(x, 1.0 - step * (i + 1)) for i in range(num_processes)]


def _resource_positions(num_resources: int, x: float = 0.85) -> List[tuple]:
    """Evenly space resource nodes vertically on the right."""
    if num_resources == 0:
        return []
    step = 1.0 / (num_resources + 1)
    return [(x, 1.0 - step * (i + 1)) for i in range(num_resources)]


# ---------------------------------------------------------------------------
# Main builder
# ---------------------------------------------------------------------------

def build_rag_figure(
    processes: List[Process],
    resource_names: List[str],
    total_resources: List[int],
) -> go.Figure:
    """
    Build and return a Plotly Figure representing the Resource Allocation Graph.

    Mirrors the logic in ResourceGraph.tsx:
      • Allocation edges: Resource → Process  (blue solid)
      • Need edges:       Process  → Resource  (red dashed)

    Arrow direction is indicated by a triangle marker at the target end
    of each edge line — compatible with all modern Plotly versions.
    """

    proc_pos = _process_positions(len(processes))
    res_pos  = _resource_positions(len(resource_names))

    traces = []

    # ----------------------------------------------------------------
    # Build edge traces (lines + arrowhead markers)
    # ----------------------------------------------------------------
    for pi, p in enumerate(processes):
        px, py = proc_pos[pi]

        for ri, _name in enumerate(resource_names):
            rx, ry = res_pos[ri]

            # ── Allocation edge: Resource ──► Process (solid blue) ──
            if p.allocation[ri] > 0:
                # Line segment
                traces.append(go.Scatter(
                    x=[rx, px], y=[ry, py],
                    mode="lines",
                    line=dict(color="#0ea5e9", width=2),
                    hoverinfo="none",
                    showlegend=False,
                ))
                # Arrowhead marker at process end (target)
                traces.append(go.Scatter(
                    x=[px], y=[py],
                    mode="markers",
                    marker=dict(
                        symbol="arrow",
                        size=14,
                        color="#0ea5e9",
                        angleref="previous",
                        # Point FROM resource TOWARD process
                        angle=_angle(rx, ry, px, py),
                    ),
                    hoverinfo="none",
                    showlegend=False,
                ))
                # Edge label at midpoint
                mx, my = (rx + px) / 2, (ry + py) / 2 + 0.025
                traces.append(go.Scatter(
                    x=[mx], y=[my],
                    mode="text",
                    text=[f"<b>{p.allocation[ri]}</b>"],
                    textfont=dict(size=10, color="#0369a1"),
                    hoverinfo="none",
                    showlegend=False,
                ))

            # ── Need edge: Process ──► Resource (dashed red) ──
            if p.need[ri] > 0:
                # Line segment
                traces.append(go.Scatter(
                    x=[px, rx], y=[py, ry],
                    mode="lines",
                    line=dict(color="#ef4444", width=2, dash="dash"),
                    hoverinfo="none",
                    showlegend=False,
                ))
                # Arrowhead marker at resource end (target)
                traces.append(go.Scatter(
                    x=[rx], y=[ry],
                    mode="markers",
                    marker=dict(
                        symbol="arrow",
                        size=14,
                        color="#ef4444",
                        angleref="previous",
                        angle=_angle(px, py, rx, ry),
                    ),
                    hoverinfo="none",
                    showlegend=False,
                ))
                # Edge label at midpoint
                mx, my = (px + rx) / 2, (py + ry) / 2 - 0.025
                traces.append(go.Scatter(
                    x=[mx], y=[my],
                    mode="text",
                    text=[f"<b>{p.need[ri]}</b>"],
                    textfont=dict(size=10, color="#b91c1c"),
                    hoverinfo="none",
                    showlegend=False,
                ))

    # ----------------------------------------------------------------
    # Legend dummy traces (so legend shows edge types)
    # ----------------------------------------------------------------
    traces.append(go.Scatter(
        x=[None], y=[None],
        mode="lines",
        line=dict(color="#0ea5e9", width=2),
        name="Allocation (Resource → Process)",
        showlegend=True,
    ))
    traces.append(go.Scatter(
        x=[None], y=[None],
        mode="lines",
        line=dict(color="#ef4444", width=2, dash="dash"),
        name="Need (Process → Resource)",
        showlegend=True,
    ))

    # ----------------------------------------------------------------
    # Process nodes (left column)
    # ----------------------------------------------------------------
    if proc_pos:
        traces.append(go.Scatter(
            x=[p[0] for p in proc_pos],
            y=[p[1] for p in proc_pos],
            mode="markers+text",
            marker=dict(
                symbol="circle",
                size=52,
                color="#bbf7d0",
                line=dict(color="#16a34a", width=3),
            ),
            text=[f"<b>{p.name}</b>" for p in processes],
            textposition="middle center",
            textfont=dict(size=12, color="#14532d"),
            customdata=[
                f"Alloc: {p.allocation}<br>Need: {p.need}<br>Max: {p.max}"
                for p in processes
            ],
            hovertemplate="%{customdata}<extra></extra>",
            name="Processes",
            showlegend=True,
        ))

    # ----------------------------------------------------------------
    # Resource nodes (right column)
    # ----------------------------------------------------------------
    if res_pos:
        traces.append(go.Scatter(
            x=[r[0] for r in res_pos],
            y=[r[1] for r in res_pos],
            mode="markers+text",
            marker=dict(
                symbol="square",
                size=56,
                color="#bae6fd",
                line=dict(color="#0284c7", width=3),
            ),
            text=[
                f"<b>{name}</b><br>{total_resources[i]}"
                for i, name in enumerate(resource_names)
            ],
            textposition="middle center",
            textfont=dict(size=11, color="#0c4a6e"),
            customdata=[
                f"Resource: {name}<br>Total Instances: {total_resources[i]}"
                for i, name in enumerate(resource_names)
            ],
            hovertemplate="%{customdata}<extra></extra>",
            name="Resources",
            showlegend=True,
        ))

    # ----------------------------------------------------------------
    # Column header labels
    # ----------------------------------------------------------------
    traces.append(go.Scatter(
        x=[0.15, 0.85],
        y=[1.07, 1.07],
        mode="text",
        text=["<b>PROCESSES</b>", "<b>RESOURCES</b>"],
        textfont=dict(size=13, color=["#15803d", "#0369a1"]),
        hoverinfo="none",
        showlegend=False,
    ))

    # ----------------------------------------------------------------
    # Compose Figure — NO annotations dict needed anymore
    # ----------------------------------------------------------------
    fig = go.Figure(data=traces)

    fig.update_layout(
        paper_bgcolor="#0f172a",    # Tailwind slate-900
        plot_bgcolor="#1e293b",     # Tailwind slate-800
        xaxis=dict(
            showgrid=False, zeroline=False,
            showticklabels=False, range=[-0.05, 1.05],
        ),
        yaxis=dict(
            showgrid=False, zeroline=False,
            showticklabels=False, range=[-0.1, 1.15],
        ),
        margin=dict(l=10, r=10, t=10, b=10),
        legend=dict(
            orientation="h",
            x=0.5, xanchor="center",
            y=-0.05,
            font=dict(color="white", size=11),
            bgcolor="rgba(0,0,0,0)",
        ),
        height=520,
        hoverlabel=dict(bgcolor="#1e293b", font_color="white"),
    )

    return fig


# ---------------------------------------------------------------------------
# Helper — compute compass angle (degrees) from point A → point B
# Used to orient the arrowhead marker correctly.
# ---------------------------------------------------------------------------

import math

def _angle(x0: float, y0: float, x1: float, y1: float) -> float:
    """
    Returns the angle in degrees for a marker pointing FROM (x0,y0) TO (x1,y1).
    Plotly's 'arrow' symbol points upward at 0°; we rotate clockwise.
    """
    dx = x1 - x0
    dy = y1 - y0
    # atan2 gives angle from +x axis; convert to Plotly's convention
    angle_rad = math.atan2(dy, dx)
    # Plotly arrow at 0° points right (+x); subtract 90° to align tip
    return math.degrees(angle_rad) - 90