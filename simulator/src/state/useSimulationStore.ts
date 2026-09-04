import { create } from 'zustand';
import { SimulatedNode, EmergencyBundle, NodeType, TransportType, LogEntry } from '../types';
import { SimulationEngine } from '../simulation/engine/SimulationEngine';
import { runRoutingCycle } from '../protocol/dtn/routing';

interface SimulationState {
  engine: SimulationEngine;
  nodes: SimulatedNode[];
  bundles: Record<string, EmergencyBundle>;
  logs: LogEntry[];
  time: number;
  isPlaying: boolean;
  selectedNodeId: string | null;
  globalSpeedMultiplier: number;
  
  // Actions
  addNode: (node: SimulatedNode) => void;
  updateNode: (id: string, updates: Partial<SimulatedNode>) => void;
  removeNode: (id: string) => void;
  addBundle: (bundle: EmergencyBundle) => void;
  updateBundle: (id: string, updates: Partial<EmergencyBundle>) => void;
  togglePlay: () => void;
  setSelectedNode: (id: string | null) => void;
  setGlobalSpeedMultiplier: (speed: number) => void;
  resetSimulation: () => void;
  
  // Simulation Loop Updates
  tick: (deltaMs: number) => void;
}

const engine = new SimulationEngine();

export const useSimulationStore = create<SimulationState>((set, get) => {
  let lastTime = performance.now();

  const loop = () => {
    const { isPlaying, tick } = get();
    const now = performance.now();
    const delta = now - lastTime;
    lastTime = now;

    if (isPlaying) {
      tick(delta);
    }
    requestAnimationFrame(loop);
  };

  // Start the render loop independent of the logical engine for now
  requestAnimationFrame(loop);

  return {
    engine,
    nodes: [],
    bundles: {},
    time: 0,
    isPlaying: false,
    selectedNodeId: null,
    globalSpeedMultiplier: 1.0,

    // ...
    logs: [],
    
    addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
    
    updateNode: (id, updates) => set((state) => ({
      nodes: state.nodes.map(n => n.id === id ? { ...n, ...updates } : n)
    })),

    removeNode: (id) => set((state) => ({
      nodes: state.nodes.filter(n => n.id !== id)
    })),

    addBundle: (bundle) => set((state) => ({
      bundles: { ...state.bundles, [bundle.bundleId]: bundle },
      logs: [{ id: Date.now().toString(), time: Date.now(), msg: `[SOS] Bundle ${bundle.bundleId.slice(-4)} generated at ${bundle.originNodeId}` }, ...state.logs].slice(0, 50)
    })),

    updateBundle: (id, updates) => set((state) => ({
      bundles: {
        ...state.bundles,
        [id]: { ...state.bundles[id], ...updates }
      }
    })),

    setSelectedNode: (id) => set({ selectedNodeId: id }),
    
    setGlobalSpeedMultiplier: (speed) => set({ globalSpeedMultiplier: speed }),

    resetSimulation: () => {
      const createNode = (id: string, x: number, y: number, isStatic = false, hasInternet = false, isAuthority = false): SimulatedNode => ({
        id, type: NodeType.RELAY, position: { x, y }, 
        velocity: isStatic ? { x: 0, y: 0 } : { x: (Math.random() - 0.5) * 50, y: (Math.random() - 0.5) * 50 },
        battery: 100, communicationRange: 150,
        transports: [TransportType.BLE, TransportType.WIFI_DIRECT],
        hasInternet, isGateway: hasInternet, isAuthority,
        isActive: true, bundleStore: [], deliveryHistory: [], contactHistory: [],
        metrics: { bundlesCreated: 0, bundlesRelayed: 0, bundlesDelivered: 0, bundlesDropped: 0, totalBytesTransferred: 0, energyConsumed: 0 },
        lastActivity: 0
      });

      const initialNodes: SimulatedNode[] = [];
      for(let i=1; i<=8; i++) {
        initialNodes.push(createNode(`N${i}`, 150 + Math.random()*400, 100 + Math.random()*500));
      }
      initialNodes.push(createNode('G1', 850, 300, true, true, false));
      initialNodes.push(createNode('A1', 1050, 300, true, true, true));

      set({
        nodes: initialNodes,
        bundles: {},
        logs: [{ id: 'init', time: Date.now(), msg: '[SYS] Simulation manually reset and re-initialized.' }],
        time: 0,
        isPlaying: false,
        selectedNodeId: null
      });
    },

    togglePlay: () => {
      const { isPlaying } = get();
      if (!isPlaying) {
        lastTime = performance.now(); // reset delta calculation
      }
      set({ isPlaying: !isPlaying });
    },

    tick: (deltaMs) => {
      set((state) => {
        // 1. Update positions, dynamic roles, and bounds
        const updatedNodes = state.nodes.map(node => {
          let updated = { ...node };

          // Dynamic Activity: If BLE is disabled, node is inactive
          updated.isActive = updated.transports.includes(TransportType.BLE);

          // Dynamic Role Assignment
          if (updated.isAuthority) {
            updated.type = NodeType.AUTHORITY;
          } else if (updated.hasInternet) {
            updated.type = NodeType.GATEWAY;
          } else {
            // Check if it originated any SOS
            const originatedSOS = Object.values(state.bundles).some(b => b.originNodeId === updated.id);
            updated.type = originatedSOS ? NodeType.VICTIM : NodeType.RELAY;
          }

          if (updated.velocity.x === 0 && updated.velocity.y === 0) return updated;

          let newX = updated.position.x + (updated.velocity.x * (deltaMs / 1000) * state.globalSpeedMultiplier);
          let newY = updated.position.y + (updated.velocity.y * (deltaMs / 1000) * state.globalSpeedMultiplier);
          let { x: vx, y: vy } = updated.velocity;

          if (newX < 50 || newX > 1150) {
            vx = -vx;
            newX = Math.max(50, Math.min(1150, newX));
          }
          if (newY < 50 || newY > 750) {
            vy = -vy;
            newY = Math.max(50, Math.min(750, newY));
          }

          return {
            ...updated,
            position: { x: newX, y: newY },
            velocity: { x: vx, y: vy }
          };
        });

        const newTime = state.time + deltaMs;

        // 2. AERS Routing Decision Cycle
        let finalNodes = [...updatedNodes];
        let newLogs = [...state.logs];
        
        // Execute routing cycle
        const { transfers } = runRoutingCycle(finalNodes, state.bundles);
        
        // Apply transfers instantly for simulation UI simplicity right now
        if (transfers.length > 0) {
          transfers.forEach(transfer => {
            newLogs.unshift({
              id: Math.random().toString(),
              time: Date.now(),
              msg: `[AERS] Transferred ${transfer.bundleId.slice(-4)} from ${transfer.from} to ${transfer.to}`
            });

            finalNodes = finalNodes.map(n => {
              if (n.id === transfer.to) {
                return { ...n, bundleStore: [...n.bundleStore, transfer.bundleId], lastActivity: Date.now() };
              }
              if (n.id === transfer.from) {
                return { ...n, lastActivity: Date.now() };
              }
              return n;
            });
          });
        }

        return {
          nodes: finalNodes,
          time: newTime,
          logs: newLogs.slice(0, 50)
        };
      });
    }
  };
});
