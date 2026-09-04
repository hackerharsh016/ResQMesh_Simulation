import { SimulatedNode, EmergencyBundle } from '../../types';
import { calculateAERS, DEFAULT_WEIGHTS, CandidateScore, selectRelay } from './aers';

export function runRoutingCycle(nodes: SimulatedNode[], bundles: Record<string, EmergencyBundle>): { 
  transfers: { from: string, to: string, bundleId: string }[] 
} {
  const transfers: { from: string, to: string, bundleId: string }[] = [];

  for (const node of nodes) {
    if (!node.isActive || node.transports.length === 0 || node.bundleStore.length === 0) continue;

    // Find neighbors within range
    const neighbors = nodes.filter(n => {
      if (n.id === node.id || !n.isActive || n.transports.length === 0) return false;
      const dx = n.position.x - node.position.x;
      const dy = n.position.y - node.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist <= Math.min(n.communicationRange, node.communicationRange);
    });

    if (neighbors.length === 0) continue;

    for (const bundleId of node.bundleStore) {
      const bundle = bundles[bundleId];
      if (!bundle) continue;

      // Evaluate candidates for this bundle
      const candidates: CandidateScore[] = neighbors.map(neighbor => {
        // Distance to nearest gateway mock (we can find actual nearest gateway)
        const gateways = nodes.filter(n => n.isGateway);
        
        const getGatewayDist = (n: SimulatedNode) => {
          if (n.isGateway) return 0;
          if (gateways.length === 0) return 9999;
          return Math.min(...gateways.map(g => {
            const dx = g.position.x - n.position.x;
            const dy = g.position.y - n.position.y;
            return Math.sqrt(dx * dx + dy * dy);
          }));
        };

        const currentDist = getGatewayDist(node);
        const neighborDist = getGatewayDist(neighbor);
        const progress = Math.max(0, Math.min(1, (currentDist - neighborDist) / (currentDist + 0.001)));

        const scoreRes = calculateAERS({
          gateway: neighbor.isGateway ? 1.0 : 0.5,
          contact: 0.5, // Mock default prior
          link: 0.9,    // Assuming good connection within range
          battery: neighbor.battery >= 20 ? neighbor.battery / 100 : (neighbor.battery < 10 ? 0.1 : 0.3),
          progress: progress,
          delivery: 0.5, // default
          latency: 0.8,  // default
          hopPenalty: Math.min((bundle.hopCount + 1) / 10, 1),
          congestion: neighbor.bundleStore.length / 100 // assuming 100 capacity
        }, DEFAULT_WEIGHTS);

        return {
          nodeId: neighbor.id,
          score: scoreRes.score,
          features: scoreRes.features
        };
      });

      // Simple current score mock based on current node's own progress (which is 0 compared to itself, so score is low)
      const currentScore = 0.3; 
      
      const selected = selectRelay(candidates, currentScore, 0.5, 0.05);

      if (selected) {
        // We found a better relay!
        // Make sure it doesn't already have this bundle to avoid loops
        const targetNode = nodes.find(n => n.id === selected.nodeId);
        if (targetNode && !targetNode.bundleStore.includes(bundleId)) {
          transfers.push({
            from: node.id,
            to: selected.nodeId,
            bundleId: bundleId
          });
        }
      }
    }
  }

  return { transfers };
}
