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

export const calculateNeed = (max: number[], allocation: number[]): number[] => {
  return max.map((m, i) => m - allocation[i]);
};

export const checkSafety = (currentState: SystemState): SafetyResult => {
  const { processes, available } = currentState;
  const numProcesses = processes.length;
  const numResources = available.length;
  const log: string[] = [];

  if (numProcesses === 0) {
    log.push("⚠️ No processes in the system. Add processes to simulate.");
    return { isSafe: false, safeSequence: [], log };
  }

  let work = [...available];
  let finish = new Array(numProcesses).fill(false);
  let safeSequence: number[] = [];

  log.push(`📊 Initial Available Resources: [${work.join(', ')}]`);
  log.push(`📊 Total Processes: ${numProcesses}, Resource Types: ${numResources}`);

  let count = 0;
  while (count < numProcesses) {
    let found = false;

    for (let p = 0; p < numProcesses; p++) {
      if (!finish[p]) {
        let canAllocate = true;
        for (let r = 0; r < numResources; r++) {
          if (processes[p].need[r] > work[r]) {
            canAllocate = false;
            break;
          }
        }

        if (canAllocate) {
          for (let r = 0; r < numResources; r++) {
            work[r] += processes[p].allocation[r];
          }
          safeSequence.push(processes[p].id);
          finish[p] = true;
          found = true;
          count++;
          log.push(`✅ Process ${processes[p].name} executed | Work: [${work.join(', ')}]`);
          break;
        }
      }
    }

    if (!found) {
      const unfinished = processes.filter((_, i) => !finish[i]).map(p => p.name);
      log.push(`❌ No process can run! Unfinished: [${unfinished.join(', ')}]`);
      log.push(`🚨 SYSTEM IS IN UNSAFE STATE - Deadlock Possible!`);
      return { isSafe: false, safeSequence: [], log };
    }
  }

  log.push(`🎉 SYSTEM IS SAFE!`);
  log.push(`🔗 Safe Sequence: ${safeSequence.map(id => `P${id}`).join(' → ')}`);
  return { isSafe: true, safeSequence, log };
};

export const requestResources = (
  state: SystemState,
  processId: number,
  request: number[]
): { granted: boolean; newState?: SystemState; message: string } => {
  const processIndex = state.processes.findIndex((p) => p.id === processId);
  if (processIndex === -1) return { granted: false, message: "❌ Process not found" };

  const process = state.processes[processIndex];
  const numResources = state.available.length;

  for (let i = 0; i < numResources; i++) {
    if (request[i] > process.need[i]) {
      return { granted: false, message: `❌ Request exceeds maximum claim for resource ${String.fromCharCode(65 + i)}` };
    }
  }

  for (let i = 0; i < numResources; i++) {
    if (request[i] > state.available[i]) {
      return { granted: false, message: `⏳ Resources not available for resource ${String.fromCharCode(65 + i)}. Process must wait.` };
    }
  }

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

  const safetyCheck = checkSafety(tentativeState);

  if (safetyCheck.isSafe) {
    return { granted: true, newState: tentativeState, message: `✅ Request Granted! System remains safe.` };
  } else {
    return { granted: false, message: `🚫 Request Denied! Would lead to unsafe state.` };
  }
};