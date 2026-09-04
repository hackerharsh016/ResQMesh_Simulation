import { create } from 'zustand';
import { SimulatedNode, NodeType, TransportType, LogEntry, EmergencyBundle, Priority, EmergencyType, Severity, BundleState } from '../types';
import { SimulationEngine } from '../simulation/engine/SimulationEngine';
import { runRoutingCycle } from '../protocol/dtn/routing';

interface SimulationState {
  engine: SimulationEngine;
  nodes: SimulatedNode[];
  bundles: Record<string, EmergencyBundle>;
  logs: LogEntry[];
  time: number;
  lastRoutingCycle: number;
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
  setGlobalInfrastructure: (type: 'SMS' | 'WAN', enabled: boolean) => void;
  resetSimulation: () => void;
  loadScenario: (scenarioId: string) => void;
  
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
    logs: [],
    time: 0,
    lastRoutingCycle: 0,
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

    setGlobalInfrastructure: (type, enabled) => set((state) => {
      const updatedNodes = state.nodes.map(n => {
        if (type === 'WAN') {
          return { ...n, hasInternet: enabled };
        } else if (type === 'SMS') {
          const hasSMS = n.transports.includes(TransportType.SMS);
          let newTransports = [...n.transports];
          if (enabled && !hasSMS) newTransports.push(TransportType.SMS);
          if (!enabled && hasSMS) newTransports = newTransports.filter(t => t !== TransportType.SMS);
          return { ...n, transports: newTransports };
        }
        return n;
      });
      return { nodes: updatedNodes };
    }),

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
        lastRoutingCycle: 0,
        isPlaying: false,
        selectedNodeId: null
      });
    },

    loadScenario: (scenarioId: string) => {
      const baseNode = (id: string, x: number, y: number): SimulatedNode => ({
        id, type: NodeType.RELAY, position: { x, y }, velocity: { x: 0, y: 0 },
        battery: 100, communicationRange: 150, transports: [TransportType.BLE, TransportType.WIFI_DIRECT],
        hasInternet: false, isGateway: false, isAuthority: false, isActive: true,
        bundleStore: [], deliveryHistory: [], contactHistory: [],
        metrics: { bundlesCreated: 0, bundlesRelayed: 0, bundlesDelivered: 0, bundlesDropped: 0, totalBytesTransferred: 0, energyConsumed: 0 },
        lastActivity: 0
      });

      let scenarioNodes: SimulatedNode[] = [];
      
      const auth = baseNode('AUTH', 1050, 350);
      auth.isAuthority = true;
      auth.hasInternet = true; // authorities typically have WAN

      const bundleId = `SOS-${Date.now().toString().slice(-4)}`;
      const bundle: EmergencyBundle = {
        bundleId, originNodeId: 'VIC1', destinationType: 'AUTHORITY', priority: Priority.CRITICAL,
        emergencyType: EmergencyType.MEDICAL, severity: Severity.CRITICAL, createdAt: Date.now(),
        ttl: 3600000, expiresAt: Date.now() + 3600000, payload: { victimId: 'VIC1', location: { x: 150, y: 350 }, timestamp: Date.now() },
        hopCount: 0, replicationCount: 0, state: BundleState.PERSISTED, currentNodeId: 'VIC1'
      };

      if (scenarioId === 'BLACKOUT') {
        // Complete Cellular/WAN Failure
        const v = baseNode('VIC1', 150, 350);
        v.bundleStore.push(bundleId);
        
        scenarioNodes = [
          v, auth,
          baseNode('R1', 350, 350),
          baseNode('R2', 550, 300),
          baseNode('R3', 750, 400),
          baseNode('R4', 900, 350)
        ];
        
        // Ensure absolutely NO WAN/SMS exists
        scenarioNodes = scenarioNodes.map(n => ({
           ...n, 
           hasInternet: n.isAuthority ? true : false,
           transports: [TransportType.BLE, TransportType.WIFI_DIRECT] // strictly local
        }));

      } else if (scenarioId === 'ADAPTIVE_ROUTING') {
        const v = baseNode('VIC1', 200, 350);
        v.bundleStore.push(bundleId);

        const rDead = baseNode('R_DYING', 350, 200);
        rDead.battery = 5; // almost dead, algorithm should reject

        const rLost = baseNode('R_LOST', 100, 100);
        rLost.battery = 100; // full battery but wrong direction

        const rPrime = baseNode('R_PRIME', 380, 380);
        rPrime.battery = 90; // good battery, good path

        scenarioNodes = [v, auth, rDead, rLost, rPrime, baseNode('R_NEXT', 550, 350), baseNode('R_LATE', 750, 350)];
      } else if (scenarioId === 'STORE_CARRY') {
        const v = baseNode('VIC1', 150, 350);
        v.bundleStore.push(bundleId);

        const rMule = baseNode('R_MULE', 250, 350);
        rMule.velocity = { x: 120, y: 0 }; // Moving very fast towards authority!

        scenarioNodes = [v, auth, rMule];
      } else if (scenarioId === 'GATEWAY') {
        const v = baseNode('VIC1', 150, 350);
        v.bundleStore.push(bundleId);

        const gw = baseNode('GW1', 550, 350);
        gw.hasInternet = true;
        
        scenarioNodes = [v, auth, baseNode('R1', 350, 350), gw];
      }

      set({
        nodes: scenarioNodes,
        bundles: { [bundleId]: bundle },
        logs: [{ id: 'scen', time: Date.now(), msg: `[TEST] Automatically loaded scenario: ${scenarioId}` }],
        time: 0,
        lastRoutingCycle: 0,
        isPlaying: true, // Auto-play
        selectedNodeId: null,
        globalSpeedMultiplier: 0.5 // Start slow for observation
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

          // Dynamic Role Assignment
          if (updated.isAuthority) {
            updated.type = NodeType.AUTHORITY;
          } else if (updated.hasInternet) {
            updated.type = NodeType.GATEWAY;
          } else {
            const originatedSOS = Object.values(state.bundles).some(b => b.originNodeId === updated.id);
            updated.type = originatedSOS ? NodeType.VICTIM : NodeType.RELAY;
          }

          // Dynamic Activity Check: Battery drain bounds
          if (updated.battery <= 0) {
            updated.isActive = false;
            updated.transports = []; // dead node
          } else {
            updated.isActive = updated.transports.includes(TransportType.BLE);
          }

          // Dynamic Range Assignment based on transports
          if (updated.transports.includes(TransportType.WIFI_DIRECT)) {
             updated.communicationRange = 250; // High range
          } else if (updated.transports.includes(TransportType.BLE)) {
             updated.communicationRange = 100; // Minimum range for BLE only
          } else {
             updated.communicationRange = 0; // Offline
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

        let finalNodes = [...updatedNodes];
        let newLogs = [...state.logs];
        
        // Rate-limit routing for observability
        const routingInterval = 1000 / Math.max(0.1, state.globalSpeedMultiplier);
        let updatedLastRoutingCycle = state.lastRoutingCycle;

        if (Date.now() - state.lastRoutingCycle >= routingInterval) {
          updatedLastRoutingCycle = Date.now();
          
          // 2. AERS Routing Decision Cycle
          const { transfers } = runRoutingCycle(finalNodes, state.bundles);
          
          if (transfers.length > 0) {
            transfers.forEach(transfer => {
              newLogs.unshift({
              id: Math.random().toString(),
              time: Date.now(),
              msg: `[AERS] Transferred ${transfer.bundleId.slice(-4)} from ${transfer.from} to ${transfer.to}`
            });

            finalNodes = finalNodes.map(n => {
              if (n.id === transfer.to) {
                // Receiver pays 1 power
                return { 
                  ...n, 
                  bundleStore: [...n.bundleStore, transfer.bundleId], 
                  lastActivity: Date.now(),
                  battery: Math.max(0, n.battery - 1),
                  metrics: { ...n.metrics, energyConsumed: n.metrics.energyConsumed + 1 }
                };
              }
              if (n.id === transfer.from) {
                // Transmitter pays 2 power
                return { 
                  ...n, 
                  lastActivity: Date.now(),
                  battery: Math.max(0, n.battery - 2),
                  metrics: { ...n.metrics, energyConsumed: n.metrics.energyConsumed + 2 }
                };
              }
              return n;
            });
          });
        }

        // 3. Backhaul Egress Check (WAN / SMS Shortcut)
        const authorityNode = finalNodes.find(n => n.isAuthority);
        if (authorityNode) {
          let authorityUpdated = false;
          // Need to clone authority's bundle store if we are modifying it
          const authorityBundles = [...authorityNode.bundleStore];
          
          finalNodes = finalNodes.map(node => {
            if (!node.isActive || node.id === authorityNode.id) return node;
            
            const hasBackhaul = node.hasInternet || node.transports.includes(TransportType.SMS);
            if (hasBackhaul && node.bundleStore.length > 0) {
              const unsentBundles = node.bundleStore.filter(bId => !authorityBundles.includes(bId));
              
              if (unsentBundles.length > 0) {
                unsentBundles.forEach(bId => {
                   authorityBundles.push(bId);
                   authorityUpdated = true;
                   
                   newLogs.unshift({
                     id: Math.random().toString(),
                     time: Date.now(),
                     msg: `[BACKHAUL] ${node.hasInternet ? 'WAN' : 'SMS'} uplink: ${bId.slice(-4)} from ${node.id} to Authority`
                   });
                });
                
                // Backhaul egress pays 3 power per bundle
                const cost = unsentBundles.length * 3;
                return { 
                  ...node, 
                  lastActivity: Date.now(),
                  battery: Math.max(0, node.battery - cost),
                  metrics: { ...node.metrics, energyConsumed: node.metrics.energyConsumed + cost }
                };
              }
            }
            return node;
          });

          if (authorityUpdated) {
             const authIndex = finalNodes.findIndex(n => n.id === authorityNode.id);
             if (authIndex !== -1) {
                 finalNodes[authIndex] = { ...finalNodes[authIndex], bundleStore: authorityBundles, lastActivity: Date.now() };
             }
          }
        }

        } // End of gated interval

        return {
          nodes: finalNodes,
          time: newTime,
          lastRoutingCycle: updatedLastRoutingCycle,
          logs: newLogs.slice(0, 50)
        };
      });
    }
  };
});
