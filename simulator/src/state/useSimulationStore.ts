import { create } from 'zustand';
import { SimulatedNode, EmergencyBundle } from '../types';
import { SimulationEngine } from '../simulation/engine/SimulationEngine';
import { runRoutingCycle } from '../protocol/dtn/routing';

interface SimulationState {
  engine: SimulationEngine;
  nodes: SimulatedNode[];
  bundles: Record<string, EmergencyBundle>;
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

    addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
    
    updateNode: (id, updates) => set((state) => ({
      nodes: state.nodes.map(n => n.id === id ? { ...n, ...updates } : n)
    })),

    removeNode: (id) => set((state) => ({
      nodes: state.nodes.filter(n => n.id !== id)
    })),

    addBundle: (bundle) => set((state) => ({
      bundles: { ...state.bundles, [bundle.bundleId]: bundle }
    })),

    updateBundle: (id, updates) => set((state) => ({
      bundles: {
        ...state.bundles,
        [id]: { ...state.bundles[id], ...updates }
      }
    })),

    setSelectedNode: (id) => set({ selectedNodeId: id }),
    
    setGlobalSpeedMultiplier: (speed) => set({ globalSpeedMultiplier: speed }),

    togglePlay: () => {
      const { isPlaying } = get();
      if (!isPlaying) {
        lastTime = performance.now(); // reset delta calculation
      }
      set({ isPlaying: !isPlaying });
    },

    tick: (deltaMs) => {
      set((state) => {
        // 1. Update positions based on velocity
        const updatedNodes = state.nodes.map(node => {
          if (node.velocity.x === 0 && node.velocity.y === 0) return node;

          let newX = node.position.x + (node.velocity.x * (deltaMs / 1000) * state.globalSpeedMultiplier);
          let newY = node.position.y + (node.velocity.y * (deltaMs / 1000) * state.globalSpeedMultiplier);
          let { x: vx, y: vy } = node.velocity;

          if (newX < 50 || newX > 1150) {
            vx = -vx;
            newX = Math.max(50, Math.min(1150, newX));
          }
          if (newY < 50 || newY > 750) {
            vy = -vy;
            newY = Math.max(50, Math.min(750, newY));
          }

          return {
            ...node,
            position: { x: newX, y: newY },
            velocity: { x: vx, y: vy }
          };
        });

        const newTime = state.time + deltaMs;

        // 2. AERS Routing Decision Cycle
        let finalNodes = [...updatedNodes];
        
        // Execute routing cycle
        const { transfers } = runRoutingCycle(finalNodes, state.bundles);
        
        // Apply transfers instantly for simulation UI simplicity right now
        // A real discrete event engine would schedule a transfer completion event
        if (transfers.length > 0) {
          transfers.forEach(transfer => {
            finalNodes = finalNodes.map(n => {
              if (n.id === transfer.to) {
                return { ...n, bundleStore: [...n.bundleStore, transfer.bundleId] };
              }
              // DTN Store-Carry-Forward keeps the bundle in the sender until TTL expires or it's known delivered, 
              // but to avoid immediate re-evaluations we might track whom we sent it to.
              // For visualization, we keep it in the store to show propagation.
              return n;
            });
          });
        }

        return {
          nodes: finalNodes,
          time: newTime
        };
      });
    }
  };
});
