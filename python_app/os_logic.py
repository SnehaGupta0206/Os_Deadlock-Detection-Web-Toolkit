"""
=============================================================================
  OS DEADLOCK TOOLKIT — Core Logic Engine
  Equivalent of: src/lib/os-logic.ts
=============================================================================
  Implements:
    - Banker's Algorithm (Safety Check)
    - Resource Request Simulation
    - Need Matrix Calculation
=============================================================================
"""

from dataclasses import dataclass, field
from typing import List, Optional, Tuple
from copy import deepcopy


# ---------------------------------------------------------------------------
# Data Structures  (mirror of TypeScript interfaces)
# ---------------------------------------------------------------------------

@dataclass
class Process:
    """Represents a single process in the system (Process Control Block)."""
    id: int
    name: str
    allocation: List[int]   # Resources currently held
    max: List[int]          # Maximum resources ever needed
    need: List[int]         # Still-needed resources  = max - allocation
    finished: bool = False


@dataclass
class SystemState:
    """Full snapshot of the OS resource state."""
    processes: List[Process]
    total_resources: List[int]   # Total instances per resource type
    available: List[int]         # Currently free instances per resource type


@dataclass
class SafetyResult:
    """Result returned by the Banker's safety algorithm."""
    is_safe: bool
    safe_sequence: List[int]     # Process IDs in execution order
    log: List[str]               # Step-by-step explanation log


@dataclass
class RequestResult:
    """Result returned by the resource-request algorithm."""
    granted: bool
    new_state: Optional[SystemState]
    message: str


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def calculate_need(max_res: List[int], allocation: List[int]) -> List[int]:
    """
    Need[i][j] = Max[i][j] - Allocation[i][j]
    Mirrors: calculateNeed() in os-logic.ts
    """
    return [m - a for m, a in zip(max_res, allocation)]


def compute_available(total: List[int], processes: List[Process]) -> List[int]:
    """
    Available = Total - sum(Allocation for all processes)
    Derived state — keeps Available always consistent.
    """
    num_resources = len(total)
    allocated_sum = [0] * num_resources
    for p in processes:
        for r in range(num_resources):
            allocated_sum[r] += p.allocation[r]
    return [total[r] - allocated_sum[r] for r in range(num_resources)]


# ---------------------------------------------------------------------------
# Banker's Algorithm — Safety Check
# Mirrors: checkSafety() in os-logic.ts
# ---------------------------------------------------------------------------

def check_safety(state: SystemState) -> SafetyResult:
    """
    Banker's Safety Algorithm
    ------------------------------------------------------------------
    Goal  : Determine whether the system is in a SAFE state.
    Method: Find a sequence in which all processes can finish.

    Pseudocode:
      work   = available[]
      finish = [False] * n

      while (found a process p where finish[p]==False AND need[p] <= work):
          work   += allocation[p]
          finish[p] = True
          add p to safe_sequence

      if all finish[p] == True:  SAFE
      else:                       UNSAFE (Deadlock possible)
    ------------------------------------------------------------------
    """
    processes   = state.processes
    n           = len(processes)
    num_res     = len(state.available)

    # Simulation copies — never mutate original state
    work           = list(state.available)
    finish         = [False] * n
    safe_sequence  = []
    log            = []

    log.append(f"▶  Initial Available Resources : {work}")

    count = 0
    while count < n:
        found = False

        for idx, p in enumerate(processes):
            if not finish[idx]:
                # Can this process run? Need[p] <= Work ?
                can_allocate = all(p.need[r] <= work[r] for r in range(num_res))

                if can_allocate:
                    # Simulate: process finishes → releases its allocation
                    for r in range(num_res):
                        work[r] += p.allocation[r]

                    safe_sequence.append(p.id)
                    finish[idx] = True
                    found        = True
                    count       += 1

                    log.append(
                        f"✔  Process {p.name} executed  |  "
                        f"Need {p.need} ≤ Work → Allocated  |  "
                        f"New Available: {work}"
                    )
                    break   # Restart scan from P0

        if not found:
            log.append(
                "✘  No process found with Need ≤ Available.  "
                "System is in an UNSAFE state — Deadlock possible!"
            )
            return SafetyResult(is_safe=False, safe_sequence=[], log=log)

    seq_str = " → ".join(processes[i].name for i in range(n)
                         if processes[i].id in safe_sequence
                         for _ in [None]  # single iteration trick
                         ) if False else \
              " → ".join(f"P{pid}" for pid in safe_sequence)

    log.append(f"✅  System is SAFE.  Safe Sequence: < {seq_str} >")
    return SafetyResult(is_safe=True, safe_sequence=safe_sequence, log=log)


# ---------------------------------------------------------------------------
# Resource Request Algorithm
# Mirrors: requestResources() in os-logic.ts
# ---------------------------------------------------------------------------

def request_resources(
    state: SystemState,
    process_id: int,
    request: List[int]
) -> RequestResult:
    """
    Resource-Request Algorithm (Banker's Algorithm — Request phase)
    ------------------------------------------------------------------
    Steps:
      1. Verify Request ≤ Need         (process hasn't exceeded its claim)
      2. Verify Request ≤ Available    (resources actually exist)
      3. Pretend-allocate (tentative)
      4. Run safety check on new state
         - Safe   → actually grant the request
         - Unsafe → roll back, deny the request
    ------------------------------------------------------------------
    """
    proc_index = next((i for i, p in enumerate(state.processes)
                       if p.id == process_id), None)
    if proc_index is None:
        return RequestResult(granted=False, new_state=None,
                             message="❌  Process not found.")

    proc      = state.processes[proc_index]
    num_res   = len(state.available)

    # Step 1 — Request ≤ Need?
    for r in range(num_res):
        if request[r] > proc.need[r]:
            return RequestResult(
                granted=False, new_state=None,
                message=f"❌  Error: Request exceeds process's maximum claim "
                        f"(Resource {r}: requested {request[r]}, need only {proc.need[r]})."
            )

    # Step 2 — Request ≤ Available?
    for r in range(num_res):
        if request[r] > state.available[r]:
            return RequestResult(
                granted=False, new_state=None,
                message=f"⏳  Resources unavailable. "
                        f"Process P{process_id} must wait "
                        f"(Resource {r}: need {request[r]}, have {state.available[r]})."
            )

    # Step 3 — Tentative allocation (deep copy to avoid mutation)
    new_processes = deepcopy(state.processes)
    new_proc      = new_processes[proc_index]
    for r in range(num_res):
        new_proc.allocation[r] += request[r]
        new_proc.need[r]       -= request[r]

    new_available = [state.available[r] - request[r] for r in range(num_res)]

    tentative_state = SystemState(
        processes       = new_processes,
        total_resources = state.total_resources,
        available       = new_available,
    )

    # Step 4 — Safety check
    safety = check_safety(tentative_state)

    if safety.is_safe:
        return RequestResult(
            granted   = True,
            new_state = tentative_state,
            message   = "✅  Request GRANTED — System remains in a SAFE state."
        )
    else:
        return RequestResult(
            granted   = False,
            new_state = None,
            message   = "🚫  Request DENIED — Granting would lead to an UNSAFE state (potential deadlock)."
        )


# ---------------------------------------------------------------------------
# Default / Example State  (mirrors INITIAL_PROCESSES in App.tsx)
# ---------------------------------------------------------------------------

INITIAL_TOTAL: List[int] = [10, 5, 7]   # Resources A, B, C

INITIAL_PROCESSES: List[Process] = [
    Process(id=0, name="P0", allocation=[0,1,0], max=[7,5,3], need=[7,4,3]),
    Process(id=1, name="P1", allocation=[2,0,0], max=[3,2,2], need=[1,2,2]),
    Process(id=2, name="P2", allocation=[3,0,2], max=[9,0,2], need=[6,0,0]),
    Process(id=3, name="P3", allocation=[2,1,1], max=[2,2,2], need=[0,1,1]),
    Process(id=4, name="P4", allocation=[0,0,2], max=[4,3,3], need=[4,3,1]),
]
