import React, { useRef, useEffect } from 'react';
import { useSimulationStore } from '../../state/useSimulationStore';
import { NodeType } from '../../types';

export const NetworkCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodes = useSimulationStore((state) => state.nodes);
  const selectedNodeId = useSimulationStore((state) => state.selectedNodeId);
  const setSelectedNode = useSimulationStore((state) => state.setSelectedNode);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas
    canvas.width = canvas.parentElement?.clientWidth || 800;
    canvas.height = canvas.parentElement?.clientHeight || 600;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw links based on communication range (simplified visual)
    ctx.lineWidth = 1.5;

    for (let i = 0; i < nodes.length; i++) {
      if (!nodes[i].isActive) continue; // skip dead nodes for links
      for (let j = i + 1; j < nodes.length; j++) {
        if (!nodes[j].isActive) continue; // skip dead nodes
        const dx = nodes[i].position.x - nodes[j].position.x;
        const dy = nodes[i].position.y - nodes[j].position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        const minRange = Math.min(nodes[i].communicationRange, nodes[j].communicationRange);
        if (dist <= minRange && nodes[i].transports.length > 0 && nodes[j].transports.length > 0) {
          ctx.beginPath();
          ctx.moveTo(nodes[i].position.x, nodes[i].position.y);
          ctx.lineTo(nodes[j].position.x, nodes[j].position.y);
          
          // Gradient link based on distance
          const opacity = Math.max(0.1, 1 - (dist / minRange));
          ctx.strokeStyle = `rgba(14, 165, 233, ${opacity * 0.8})`; // glowing cyan
          
          ctx.stroke();
        }
      }
    }

    // Draw Nodes
    for (const node of nodes) {
      ctx.beginPath();
      ctx.arc(node.position.x, node.position.y, 8, 0, Math.PI * 2);
      
      let glowColor = 'transparent';

      if (!node.isActive) {
        ctx.fillStyle = '#334155'; // dark slate
      } else {
        switch (node.type) {
          case NodeType.VICTIM:
            ctx.fillStyle = '#f43f5e'; // rose-500
            glowColor = '#f43f5e';
            break;
          case NodeType.RELAY:
            ctx.fillStyle = '#3b82f6'; // blue-500
            glowColor = '#3b82f6';
            break;
          case NodeType.GATEWAY:
            ctx.fillStyle = '#10b981'; // emerald-500
            glowColor = '#10b981';
            break;
          case NodeType.AUTHORITY:
            ctx.fillStyle = '#f59e0b'; // amber-500
            glowColor = '#f59e0b';
            break;
          default:
            ctx.fillStyle = '#64748b'; // slate-500
        }
      }
      
      // Glow effect
      const now = Date.now();
      const recentlyActive = node.lastActivity && (now - node.lastActivity < 500);

      if (recentlyActive) {
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#ffffff'; // Bright white flash
        ctx.fillStyle = '#ffffff'; // Pulse white
      } else if (node.isActive && node.transports.length > 0) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = glowColor;
      } else {
        ctx.shadowBlur = 0;
      }
      
      ctx.fill();
      ctx.shadowBlur = 0; // reset shadow for other drawings

      // Selection ring
      if (node.id === selectedNodeId) {
        ctx.beginPath();
        ctx.arc(node.position.x, node.position.y, 16, 0, Math.PI * 2);
        ctx.strokeStyle = '#22d3ee'; // cyan-400
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.lineWidth = 1.5;
      }

      // If carrying bundle, draw a white inner circle to indicate it has data
      if (node.bundleStore.length > 0) {
        ctx.beginPath();
        ctx.arc(node.position.x, node.position.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        
        // Draw an alert ring
        ctx.beginPath();
        ctx.arc(node.position.x, node.position.y, 14, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      // Draw range circle (faint)
      ctx.beginPath();
      ctx.arc(node.position.x, node.position.y, node.communicationRange, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, 0.05)`; // white faint
      ctx.lineWidth = 1;
      ctx.stroke();

      // Node ID label
      ctx.fillStyle = '#94a3b8'; // slate-400
      ctx.font = '10px monospace';
      ctx.fillText(node.id.substring(0, 4), node.position.x - 10, node.position.y - 14);
    }
  }, [nodes, selectedNodeId]);

  // Dragging state
  const [draggedNodeId, setDraggedNodeId] = React.useState<string | null>(null);
  const updateNode = useSimulationStore((state) => state.updateNode);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Calculate scaling if canvas CSS size differs from its intrinsic size (though here they match w/h)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    let foundId: string | null = null;
    
    for (const node of nodes) {
      const dx = node.position.x - x;
      const dy = node.position.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist <= 15) {
        foundId = node.id;
        break;
      }
    }
    
    if (foundId) {
      setSelectedNode(foundId);
      setDraggedNodeId(foundId);
    } else {
      setSelectedNode(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggedNodeId) return;
    
    const { x, y } = getCanvasCoords(e);
    // Update node position instantly and halt its velocity so it doesn't fight the drag
    updateNode(draggedNodeId, { position: { x, y }, velocity: { x: 0, y: 0 } });
  };

  const handleMouseUp = () => {
    setDraggedNodeId(null);
  };

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10 bg-slate-900/30 backdrop-blur-sm shadow-2xl relative">
      <canvas 
        ref={canvasRef} 
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full block cursor-pointer" 
      />
    </div>
  );
};
