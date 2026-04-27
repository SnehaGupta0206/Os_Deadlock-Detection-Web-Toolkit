import React, { useState } from 'react';
import { Plus, Play, AlertCircle, CheckCircle, RotateCcw } from 'lucide-react';
import { Process, SystemState, calculateNeed } from '../lib/os-logic';

interface DashboardProps {
  state: SystemState;
  onAddProcess: (p: Process) => void;
  onUpdateResources: (r: number[]) => void;
  onReset: () => void;
  onRunAlgorithm: () => void;
  simulationLog: string[];
  safeSequence: number[];
  isSafe: boolean | null;
}

export const Dashboard: React.FC<DashboardProps> = ({
  state,
  onAddProcess,
  onUpdateResources,
  onReset,
  onRunAlgorithm,
  simulationLog,
  safeSequence,
  isSafe,
}) => {
  const [newProcessMax, setNewProcessMax] = useState<string>('');
  const [newProcessAlloc, setNewProcessAlloc] = useState<string>('');
  const [resourceInput, setResourceInput] = useState<string>('10,5,7');

  const resourceCount = state.totalResources.length;

  const handleAddProcess = () => {
    const max = newProcessMax.split(',').map(Number);
    const alloc = newProcessAlloc.split(',').map(Number);

    if (max.length !== resourceCount || alloc.length !== resourceCount) {
      alert(`Please enter ${resourceCount} values for resources.`);
      return;
    }

    const newProc: Process = {
      id: state.processes.length,
      name: `P${state.processes.length}`,
      allocation: alloc,
      max: max,
      need: calculateNeed(max, alloc),
      finished: false,
    };
    onAddProcess(newProc);
    setNewProcessMax('');
    setNewProcessAlloc('');
  };

  const handleUpdateResources = () => {
    const res = resourceInput.split(',').map(Number);
    onUpdateResources(res);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Control Panel</h2>
        <div className="flex gap-2">
           <button onClick={onReset} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <RotateCcw size={18} /> Reset
          </button>
          <button 
            onClick={onRunAlgorithm}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            <Play size={18} /> Run Simulation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Resource Configuration */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <h3 className="font-semibold text-slate-700 mb-3">System Resources</h3>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={resourceInput}
              onChange={(e) => setResourceInput(e.target.value)}
              placeholder="e.g. 10,5,7"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button 
              onClick={handleUpdateResources}
              className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800"
            >
              Set
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Comma separated total instances (e.g. A, B, C)</p>
          <div className="mt-4">
             <span className="text-sm font-medium text-gray-600">Current Available: </span>
             <span className="font-mono bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                [{state.available.join(', ')}]
             </span>
          </div>
        </div>

        {/* Process Addition */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <h3 className="font-semibold text-slate-700 mb-3">Add Process</h3>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-xs text-gray-500">Allocation</label>
              <input 
                type="text" 
                value={newProcessAlloc}
                onChange={(e) => setNewProcessAlloc(e.target.value)}
                placeholder="e.g. 0,1,0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Max Need</label>
              <input 
                type="text" 
                value={newProcessMax}
                onChange={(e) => setNewProcessMax(e.target.value)}
                placeholder="e.g. 7,5,3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <button 
            onClick={handleAddProcess}
            className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Plus size={18} /> Add Process
          </button>
        </div>
      </div>

      {/* Simulation Results */}
      {isSafe !== null && (
        <div className={`p-4 rounded-lg border ${isSafe ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} mb-6`}>
          <div className="flex items-center gap-3 mb-2">
            {isSafe ? <CheckCircle className="text-green-600" /> : <AlertCircle className="text-red-600" />}
            <h3 className={`font-bold ${isSafe ? 'text-green-800' : 'text-red-800'}`}>
              {isSafe ? 'System is SAFE' : 'System is UNSAFE (Deadlock Possible)'}
            </h3>
          </div>
          {isSafe && (
            <p className="text-green-700">
              Safe Sequence: <span className="font-mono font-bold">{safeSequence.map(id => `P${id}`).join(' → ')}</span>
            </p>
          )}
        </div>
      )}

      {/* Logs */}
      <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm h-48 overflow-y-auto">
        <h3 className="text-gray-400 mb-2 border-b border-gray-700 pb-1">Simulation Log &gt;</h3>
        {simulationLog.length === 0 ? (
           <span className="text-gray-600">Waiting for simulation...</span>
        ) : (
          simulationLog.map((log, idx) => (
            <div key={idx} className="mb-1">
              <span className="text-blue-500">[{idx + 1}]</span> <span className="text-gray-300">{log}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
