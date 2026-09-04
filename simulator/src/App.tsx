import { useEffect } from 'react';
import { useSimulationStore } from './state/useSimulationStore';
import { NetworkCanvas } from './components/simulation/NetworkCanvas';
import { NodeType, TransportType, SimulatedNode, EmergencyBundle, Priority, EmergencyType, Severity, BundleState } from './types';
import { Play, Pause, Radio, Zap, Power, Wifi, WifiOff, Activity, ShieldAlert, Cpu } from 'lucide-react';

function App() {
  const { nodes, bundles, selectedNodeId, isPlaying, togglePlay, addNode, updateNode, addBundle } = useSimulationStore();

  useEffect(() => {
    // Initial Scenario Setup
    if (nodes.length === 0) {
      const createNode = (id: string, type: NodeType, x: number, y: number, isStatic = false, isGateway = false): SimulatedNode => ({
        id, type, position: { x, y }, 
        velocity: isStatic ? { x: 0, y: 0 } : { x: (Math.random() - 0.5) * 50, y: (Math.random() - 0.5) * 50 },
        battery: 100, communicationRange: 150,
        transports: [TransportType.BLE, TransportType.WIFI_DIRECT],
        hasInternet: isGateway, isGateway, isAuthority: type === NodeType.AUTHORITY,
        isActive: true, bundleStore: [], deliveryHistory: [], contactHistory: [],
        metrics: { bundlesCreated: 0, bundlesRelayed: 0, bundlesDelivered: 0, bundlesDropped: 0, totalBytesTransferred: 0, energyConsumed: 0 }
      });

      addNode(createNode('V1', NodeType.VICTIM, 150, 300));
      for(let i=1; i<=8; i++) {
        addNode(createNode(`R${i}`, NodeType.RELAY, 300 + Math.random()*400, 100 + Math.random()*500));
      }
      addNode(createNode('G1', NodeType.GATEWAY, 850, 300, true, true));
      addNode(createNode('A1', NodeType.AUTHORITY, 1050, 300, true, false));
    }
  }, [nodes.length, addNode]);

  const generateSOS = () => {
    const victim = nodes.find(n => n.type === NodeType.VICTIM && n.isActive);
    if (!victim) {
      alert("No active victim node found!");
      return;
    }

    const bundle: EmergencyBundle = {
      bundleId: `SOS-${Date.now().toString().slice(-6)}`,
      originNodeId: victim.id,
      destinationType: 'AUTHORITY',
      priority: Priority.CRITICAL,
      emergencyType: EmergencyType.MEDICAL,
      severity: Severity.CRITICAL,
      createdAt: Date.now(),
      ttl: 60000 * 60,
      expiresAt: Date.now() + 60000 * 60,
      payload: {
        victimId: victim.id,
        location: { ...victim.position, x: victim.position.x, y: victim.position.y },
        timestamp: Date.now(),
      },
      hopCount: 0,
      replicationCount: 0,
      state: BundleState.PERSISTED,
      currentNodeId: victim.id
    };

    updateNode(victim.id, {
      bundleStore: [...victim.bundleStore, bundle.bundleId],
      metrics: {
        ...victim.metrics,
        bundlesCreated: victim.metrics.bundlesCreated + 1
      }
    });

    addBundle(bundle);
  };

  const totalBundles = Object.keys(bundles).length;
  const activeNodes = nodes.filter(n => n.isActive).length;

  return (
    <div className="flex flex-col h-screen text-slate-200">
      
      {/* Header */}
      <header className="backdrop-blur-md bg-slate-900/60 border-b border-white/10 px-6 py-4 flex items-center justify-between z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-500/20 p-2 rounded-lg border border-cyan-500/30">
            <Radio className="text-cyan-400 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">ResQMesh Engine</h1>
            <p className="text-xs text-slate-400 font-mono tracking-widest">DTN AERS SIMULATION</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={togglePlay}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all duration-300 ${isPlaying ? 'bg-amber-500/80 hover:bg-amber-400 shadow-amber-500/20 border border-amber-400/50' : 'bg-emerald-500/80 hover:bg-emerald-400 shadow-emerald-500/20 border border-emerald-400/50'}`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? 'PAUSE SYS' : 'INIT SYS'}
          </button>
        </div>
      </header>
      
      <main className="flex-1 flex p-6 gap-6 overflow-hidden z-10">
        
        {/* Canvas Area */}
        <div className="flex-1 relative rounded-2xl">
          <NetworkCanvas />
          
          {/* Overlay metrics */}
          <div className="absolute top-4 left-4 flex gap-4 pointer-events-none">
            <div className="backdrop-blur-md bg-slate-900/50 border border-white/10 rounded-xl p-3 flex items-center gap-3 shadow-xl">
              <Cpu className="text-slate-400 w-5 h-5" />
              <div>
                <div className="text-xs text-slate-400">NODES ONLINE</div>
                <div className="font-mono text-lg font-bold text-emerald-400">{activeNodes} / {nodes.length}</div>
              </div>
            </div>
            <div className="backdrop-blur-md bg-slate-900/50 border border-white/10 rounded-xl p-3 flex items-center gap-3 shadow-xl">
              <Activity className="text-slate-400 w-5 h-5" />
              <div>
                <div className="text-xs text-slate-400">ACTIVE BUNDLES</div>
                <div className="font-mono text-lg font-bold text-cyan-400">{totalBundles}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sidebar Controls */}
        <aside className="w-80 backdrop-blur-xl bg-slate-900/40 border border-white/10 rounded-2xl p-5 flex flex-col gap-6 overflow-y-auto shadow-2xl relative">
          
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-rose-500 to-orange-500 rounded-xl blur opacity-25"></div>
            <button 
              onClick={generateSOS}
              className="relative w-full bg-slate-900 hover:bg-slate-800 border border-rose-500/50 text-rose-400 font-bold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group"
            >
              <ShieldAlert className="w-5 h-5 group-hover:scale-110 transition-transform" />
              EMIT SOS BEACON
            </button>
          </div>

          <div className="space-y-4">
            <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase">Global Speed Control</h2>
            <div className="flex flex-col gap-2">
              <input 
                type="range" 
                min="0" max="5" step="0.1" 
                value={useSimulationStore((state) => state.globalSpeedMultiplier)}
                onChange={(e) => useSimulationStore.getState().setGlobalSpeedMultiplier(parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>0x</span>
                <span>{useSimulationStore((state) => state.globalSpeedMultiplier).toFixed(1)}x</span>
                <span>5x</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase">Telemetry Legend</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span> <span className="text-slate-300">Victim</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span> <span className="text-slate-300">Relay</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span> <span className="text-slate-300">Gateway</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></span> <span className="text-slate-300">Authority</span>
              </div>
            </div>
          </div>

          {selectedNodeId && (() => {
            const node = nodes.find(n => n.id === selectedNodeId);
            if (!node) return null;
            
            const roleName = NodeType[node.type];
            const hasNetwork = node.transports.length > 0;

            return (
              <div className="mt-2 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase flex items-center gap-2">
                    Node Inspector
                  </h2>
                  <button onClick={() => useSimulationStore.getState().setSelectedNode(null)} className="text-slate-400 hover:text-white text-xs bg-white/5 hover:bg-white/10 px-2 py-1 rounded">DISMISS</button>
                </div>
                
                <div className="bg-slate-950/50 rounded-xl border border-white/5 p-4 space-y-4 shadow-inner flex-1">
                  
                  {/* Status Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${node.isActive ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-slate-600'}`}></div>
                      <span className="font-mono text-lg font-bold text-white">{node.id}</span>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 bg-white/10 text-slate-300 rounded-md">
                      {roleName}
                    </span>
                  </div>

                  <hr className="border-white/5" />
                  
                  {/* Metrics */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Power Level</span>
                        <span className="font-mono">{Math.round(node.battery)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${node.battery > 20 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-rose-500'}`} style={{ width: `${Math.max(0, node.battery)}%` }} />
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/5">
                      <span className="text-xs text-slate-400 flex items-center gap-1"><Activity className="w-3 h-3" /> Buffer</span>
                      <span className="font-mono text-cyan-400 font-bold">{node.bundleStore.length} Pkts</span>
                    </div>
                  </div>
                  
                  <hr className="border-white/5" />
                  
                  {/* Actions */}
                  <div className="pt-2 flex flex-col gap-3">
                    <button 
                      onClick={() => updateNode(node.id, { isActive: !node.isActive })}
                      className={`w-full py-2.5 rounded-lg font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2 ${node.isActive ? 'bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-500/30' : 'bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/50'}`}
                    >
                      <Power className="w-4 h-4" />
                      {node.isActive ? 'TERMINATE NODE' : 'BOOT SEQUENCE'}
                    </button>
                    
                    <button 
                      onClick={() => updateNode(node.id, { transports: hasNetwork ? [] : [TransportType.BLE, TransportType.WIFI_DIRECT] })}
                      className={`w-full py-2.5 rounded-lg font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2 ${hasNetwork ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30' : 'bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/50'}`}
                    >
                      {hasNetwork ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
                      {hasNetwork ? 'JAM SIGNAL' : 'RESTORE COMMS'}
                    </button>
                  </div>

                </div>
              </div>
            );
          })()}
        </aside>
      </main>
    </div>
  );
}

export default App;
