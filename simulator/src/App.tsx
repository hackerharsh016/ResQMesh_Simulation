import React, { useEffect, useState } from 'react';
import { useSimulationStore } from './state/useSimulationStore';
import { NetworkCanvas } from './components/simulation/NetworkCanvas';
import { NodeType, TransportType, EmergencyBundle, Priority, EmergencyType, Severity, BundleState } from './types';
import { Play, Pause, Radio, Zap, Power, Wifi, Activity, ShieldAlert, Cpu, Bluetooth, Globe, MessageSquare, Database, RotateCcw, Minus, Square } from 'lucide-react';
function App() {
  const { nodes, bundles, selectedNodeId, isPlaying, togglePlay, updateNode, addBundle, resetSimulation, setGlobalInfrastructure, logs, globalSpeedMultiplier } = useSimulationStore();
  const initialized = React.useRef(false);

  const [terminalPos, setTerminalPos] = useState({ x: 16, y: 112 });
  const [isDraggingTerminal, setIsDraggingTerminal] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [terminalMinimized, setTerminalMinimized] = useState(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingTerminal(true);
    setDragOffset({ x: e.clientX - terminalPos.x, y: e.clientY - terminalPos.y });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingTerminal) {
      setTerminalPos({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingTerminal(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  useEffect(() => {
    // Initial Scenario Setup
    if (nodes.length === 0 && !initialized.current) {
      initialized.current = true;
      resetSimulation();
    }
  }, [nodes.length, resetSimulation]);

  const generateSOS = (targetId: string) => {
    const victim = nodes.find(n => n.id === targetId && n.isActive);
    if (!victim) {
      alert("Selected node is inactive or missing!");
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
      battery: Math.max(0, victim.battery - 5), // Creating bundle costs 5 power
      metrics: {
        ...victim.metrics,
        bundlesCreated: victim.metrics.bundlesCreated + 1,
        energyConsumed: victim.metrics.energyConsumed + 5
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
            onClick={() => {
              if (window.confirm("Are you sure you want to completely wipe the simulation state and restart?")) {
                resetSimulation();
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 transition-all duration-300"
          >
            <RotateCcw className="w-4 h-4" />
            RESET
          </button>
          
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

          {/* Floating Log Terminal */}
          <div 
            style={{ left: terminalPos.x, top: terminalPos.y }}
            className={`absolute w-80 backdrop-blur-md bg-slate-950/80 border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto transition-all duration-300 ${terminalMinimized ? 'h-[37px]' : 'h-64'} z-50`}
          >
            <div 
              className="bg-white/5 hover:bg-white/10 border-b border-white/10 px-3 py-2 flex items-center justify-between cursor-move select-none"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase pointer-events-none">System Terminal</span>
              </div>
              <button 
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); setTerminalMinimized(!terminalMinimized); }}
                className="text-slate-400 hover:text-white transition-colors p-0.5 z-50 relative"
              >
                {terminalMinimized ? <Square className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              </button>
            </div>
            {!terminalMinimized && (
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5 flex flex-col-reverse custom-scrollbar">
                {logs.map((log) => (
                  <div key={log.id} className="text-[11px] font-mono leading-tight">
                    <span className="text-slate-500">[{new Date(log.time).toISOString().substring(11, 23)}]</span>{' '}
                    <span className={log.msg.includes('SOS') ? 'text-rose-400' : 'text-cyan-400'}>{log.msg}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Sidebar Controls */}
        <aside className="w-80 backdrop-blur-xl bg-slate-900/40 border border-white/10 rounded-2xl p-5 flex flex-col gap-6 overflow-y-auto shadow-2xl relative custom-scrollbar">

          <div className="space-y-4">
            <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase">Global Speed Control</h2>
            <div className="flex flex-col gap-2">
              <input 
                type="range" 
                min="0" max="5" step="0.1" 
                value={globalSpeedMultiplier}
                onChange={(e) => useSimulationStore.getState().setGlobalSpeedMultiplier(parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>0x</span>
                <span>{globalSpeedMultiplier.toFixed(1)}x</span>
                <span>5x</span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase">Global Infrastructure</h2>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setGlobalInfrastructure('WAN', !nodes.every(n => n.hasInternet))}
                className={`w-full py-2.5 rounded-lg font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2 ${nodes.length > 0 && nodes.every(n => n.hasInternet) ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'}`}
              >
                <Globe className="w-4 h-4" />
                GLOBAL WAN UPLINK
              </button>
              <button 
                onClick={() => setGlobalInfrastructure('SMS', !nodes.every(n => n.transports.includes(TransportType.SMS)))}
                className={`w-full py-2.5 rounded-lg font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2 ${nodes.length > 0 && nodes.every(n => n.transports.includes(TransportType.SMS)) ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'}`}
              >
                <MessageSquare className="w-4 h-4" />
                GLOBAL CELLULAR (SMS)
              </button>
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
                  
                  {/* Network Interfaces */}
                  <div>
                    <h3 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-2">Network Interfaces</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => {
                          const has = node.transports.includes(TransportType.BLE);
                          updateNode(node.id, { 
                            transports: has ? node.transports.filter(t => t !== TransportType.BLE) : [...node.transports, TransportType.BLE] 
                          });
                        }}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold transition-all ${node.transports.includes(TransportType.BLE) ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'bg-slate-900/50 border-white/5 text-slate-500 hover:text-slate-400'}`}
                      >
                        <Bluetooth className="w-3.5 h-3.5" /> BLE
                      </button>

                      <button 
                        onClick={() => {
                          const has = node.transports.includes(TransportType.WIFI_DIRECT);
                          updateNode(node.id, { 
                            transports: has ? node.transports.filter(t => t !== TransportType.WIFI_DIRECT) : [...node.transports, TransportType.WIFI_DIRECT] 
                          });
                        }}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold transition-all ${node.transports.includes(TransportType.WIFI_DIRECT) ? 'bg-blue-500/20 border-blue-500/50 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'bg-slate-900/50 border-white/5 text-slate-500 hover:text-slate-400'}`}
                      >
                        <Wifi className="w-3.5 h-3.5" /> Wi-Fi
                      </button>

                      <button 
                        onClick={() => {
                          const has = node.transports.includes(TransportType.SMS);
                          updateNode(node.id, { 
                            transports: has ? node.transports.filter(t => t !== TransportType.SMS) : [...node.transports, TransportType.SMS] 
                          });
                        }}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold transition-all ${node.transports.includes(TransportType.SMS) ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'bg-slate-900/50 border-white/5 text-slate-500 hover:text-slate-400'}`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> SMS
                      </button>

                      <button 
                        onClick={() => updateNode(node.id, { hasInternet: !node.hasInternet })}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold transition-all ${node.hasInternet ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-slate-900/50 border-white/5 text-slate-500 hover:text-slate-400'}`}
                      >
                        <Globe className="w-3.5 h-3.5" /> WAN
                      </button>
                    </div>
                  </div>

                  <hr className="border-white/5" />

                  {/* Local SQLite Storage */}
                  <div className="pt-1">
                    <h3 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-2 flex items-center gap-1.5">
                      <Database className="w-3 h-3" />
                      Local SQLite Storage
                    </h3>
                    <div className="bg-slate-950/50 rounded-lg border border-white/5 p-2 max-h-32 overflow-y-auto space-y-1.5 custom-scrollbar">
                      {node.bundleStore.length === 0 ? (
                        <div className="text-xs text-slate-600 text-center py-2 font-mono">0 RECORDS</div>
                      ) : (
                        node.bundleStore.map(id => {
                          const b = bundles[id];
                          if (!b) return null;
                          const sizeKb = (JSON.stringify(b).length / 1024).toFixed(1);
                          return (
                            <div key={id} className="bg-white/5 rounded p-2 text-[10px] font-mono border border-white/5 hover:border-cyan-500/30 transition-colors">
                              <div className="flex justify-between mb-1">
                                <span className="text-cyan-400 font-bold">{b.bundleId}</span>
                                <span className="text-slate-500">{new Date(b.createdAt).toISOString().substring(11, 19)}</span>
                              </div>
                              <div className="flex justify-between text-slate-400">
                                <span>SRC: {b.originNodeId}</span>
                                <span>{sizeKb} KB</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <hr className="border-white/5" />
                  
                  {/* Actions */}
                  <div className="pt-1 flex flex-col gap-3">
                    <button 
                      onClick={() => generateSOS(node.id)}
                      disabled={!node.isActive}
                      className={`w-full py-2.5 rounded-lg font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2 ${node.isActive ? 'bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 border border-rose-500/50' : 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'}`}
                    >
                      <ShieldAlert className="w-4 h-4" />
                      EMIT SOS BEACON
                    </button>

                    <button 
                      onClick={() => updateNode(node.id, { isActive: !node.isActive })}
                      className={`w-full py-2.5 rounded-lg font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2 ${node.isActive ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-500/30' : 'bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/50'}`}
                    >
                      <Power className="w-4 h-4" />
                      {node.isActive ? 'TERMINATE NODE' : 'BOOT SEQUENCE'}
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
