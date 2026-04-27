# OS Deadlock Toolkit: Real-time Detection, Prevention & Recovery

## 1. Project Overview
This project solves the critical problem of **deadlocks** in operating systems, where processes wait indefinitely for resources held by each other. In real-world scenarios (like Database Management Systems or Cloud Resource Allocation), deadlocks can freeze systems entirely.

**Objectives:**
- Visualize resource allocation in real-time.
- Implement the **Banker's Algorithm** for Deadlock Avoidance.
- Detect unsafe states (potential deadlocks).
- Simulate process requests and resource releases.

## 2. System Architecture
Although this implementation runs client-side for immediate interactivity, the designed architecture follows a standard Full-Stack model:

**Client (Frontend):**
- **React.js (Vite):** Handles UI, State Management, and interactive Graphs.
- **Tailwind CSS:** Responsive styling.
- **React Flow:** Visualizing Resource Allocation Graphs (RAG).

**Server (Backend Logic - Simulated here):**
- **Core OS Engine:** TypeScript modules handling matrix operations (Allocation, Max, Need).
- **Safety Algorithm:** Determines if a state is SAFE or UNSAFE.
- **Request Manager:** Validates if a request can be granted immediately.

**Database (State Store):**
- In this demo, we use **React Context/State** to hold the process matrices, simulating a database table of active processes.

## 3. Module Breakdown
1.  **Dashboard UI:** Input forms for Resources/Processes.
2.  **OS Logic Engine:** 
    - `banker.ts`: The core algorithm.
    - `safety.ts`: Checks if the system is in a safe state.
3.  **Visualization Module:**
    - `MatrixTable`: Displays Allocation/Max/Need matrices.
    - `ResourceGraph`: Nodes and Edges representation.
4.  **Simulation Controller:** Steps through the algorithm (Find Process -> Check Need <= Available -> Execute -> Release).

## 4. Functionalities
- **Custom Configuration:** Set total resources (e.g., A=10, B=5, C=7).
- **Dynamic Process Management:** Add/Remove processes.
- **Real-time Safety Check:** Instantly tells if the system is Safe or Unsafe.
- **Request Simulation:** "Process P1 requests [1, 0, 2]" -> System approves or denies based on safety.
- **Step-by-Step Execution:** Watch the OS "find" a safe sequence.

## 5. Tech Stack
- **Frontend:** React (Component-based, fast updates), Tailwind (Rapid styling).
- **Visualization:** React Flow (Best for node-based graphs).
- **Logic:** TypeScript (Strong typing prevents logic errors in matrix math).

## 6. Core OS Concepts Implementation
**Banker's Algorithm Logic:**
1.  `Need[i][j] = Max[i][j] - Allocation[i][j]`
2.  Find process `P_i` where `Finish[i] == false` AND `Need[i] <= Work`.
3.  If found: `Work += Allocation[i]`, `Finish[i] = true`. Record in Safe Sequence.
4.  If all `Finish == true`, System is Safe.

## 7. UI/UX Design
- **Theme:** Dark/System theme (Terminal aesthetic).
- **Layout:** Split view. Left: Controls/Matrices. Right: Visualization Graph.
- **Feedback:** Toast notifications for "Safe" or "Unsafe" states.

## 8. Execution Plan
1.  Setup Types & Utils.
2.  Implement `Banker's Algorithm` logic file.
3.  Build `MatrixTable` component.
4.  Build `ResourceGraph` component.
5.  Integrate into Main Dashboard.

## 9. Testing
- **Edge Case:** Request > Need (Error).
- **Edge Case:** Request > Available (Wait).
- **Stress Test:** 10+ Processes.

## 10. Final Output
A fully interactive dashboard demonstrating how an OS manages resources to avoid deadlocks, perfect for educational demonstrations and viva presentations.
