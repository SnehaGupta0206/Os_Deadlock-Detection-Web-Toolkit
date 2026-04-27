export interface Process {
  id: number;
  name: string;
  allocation: number[];
  max: number[];
  need: number[];
  finished: boolean;
}

export interface SystemState {
  processes: Process[];
  totalResources: number[];
  available: number[];
}

export interface SafetyResult {
  isSafe: boolean;
  safeSequence: number[];
  log: string[];
}

/**
 * Calculates the NEED matrix for a process
 * Need[i][j] = Max[i][j] - Allocation[i][j]
 */
export const calculateNeed = (max: number[], allocation: number[]): number[] => {
  return max.map((m, i) => m - allocation[i]);
};

/**
 * The Banker's Algorithm for Deadlock Avoidance
 * Returns if the system is in a safe state and the safe sequence.
 */
export const checkSafety = (currentState: SystemState): SafetyResult => {
  const { processes, available } = currentState;
  const numProcesses = processes.length;
  const numResources = available.length;

  // Working variables (simulation copies)
  let work = [...available];
  let finish = new Array(numProcesses).fill(false);
  let safeSequence: number[] = [];
  let log: string[] = [];

  log.push(`Initial Available Resources: [${work.join(', ')}]`);

  let count = 0;
  while (count < numProcesses) {
    let found = false;

    for (let p = 0; p < numProcesses; p++) {
      if (!finish[p]) {
        // Check if Need <= Work for all resources
        let canAllocate = true;
        for (let r = 0; r < numResources; r++) {
          if (processes[p].need[r] > work[r]) {
            canAllocate = false;
            break;
          }
        }

        if (canAllocate) {
          // Simulate allocation
          for (let r = 0; r < numResources; r++) {
            work[r] += processes[p].allocation[r];
          }
          safeSequence.push(processes[p].id);
          finish[p] = true;
          found = true;
          count++;
          log.push(`Process P${processes[p].id} executed. New Available: [${work.join(', ')}]`);
          break; // Restart search from P0 to ensure safety
        }
      }
    }

    if (!found) {
      log.push("No process found with Need <= Available. System is in UNSAFE state (Potential Deadlock).");
      return { isSafe: false, safeSequence: [], log };
    }
  }

  log.push(`System is SAFE. Safe Sequence: < ${safeSequence.map(id => `P${id}`).join(', ')} >`);
  return { isSafe: true, safeSequence, log };
};

/**
 * Request Resources Algorithm
 * Simulates if a request from process P_id for resources Request[] can be granted immediately.
 */
export const requestResources = (
  state: SystemState,
  processId: number,
  request: number[]
): { granted: boolean; newState?: SystemState; message: string } => {
  const processIndex = state.processes.findIndex((p) => p.id === processId);
  if (processIndex === -1) return { granted: false, message: "Process not found" };

  const process = state.processes[processIndex];
  const numResources = state.available.length;

  // 1. Check if Request <= Need
  for (let i = 0; i < numResources; i++) {
    if (request[i] > process.need[i]) {
      return { granted: false, message: `Error: Process has exceeded its maximum claim.` };
    }
  }

  // 2. Check if Request <= Available
  for (let i = 0; i < numResources; i++) {
    if (request[i] > state.available[i]) {
      return { granted: false, message: `Resources not available. Process P${processId} must wait.` };
    }
  }

  // 3. Pretend to allocate resources
  const newProcesses = state.processes.map((p) => {
    if (p.id === processId) {
      const newAllocation = p.allocation.map((a, i) => a + request[i]);
      const newNeed = p.need.map((n, i) => n - request[i]);
      return { ...p, allocation: newAllocation, need: newNeed };
    }
    return p;
  });

  const newAvailable = state.available.map((a, i) => a - request[i]);

  const tentativeState: SystemState = {
    ...state,
    processes: newProcesses,
    available: newAvailable,
  };

  // 4. Check safety of new state
  const safetyCheck = checkSafety(tentativeState);

  if (safetyCheck.isSafe) {
    return { granted: true, newState: tentativeState, message: `Request Granted. System is Safe.` };
  } else {
    return { granted: false, message: `Request Denied. Granting would lead to an Unsafe State.` };
  }
};
