import { TransportType, SimulatedNode, EmergencyBundle } from '../types';
import { VirtualTransport, TransferResult } from './VirtualTransport';

export class VirtualBLE implements VirtualTransport {
  type = TransportType.BLE;
  
  private MAX_RANGE = 50; // meters (simulated pixels)
  private BASE_LATENCY = 200; // ms
  private BATTERY_COST = 0.5; // percentage points per transfer

  canConnect(source: SimulatedNode, destination: SimulatedNode): boolean {
    if (!source.transports.includes(this.type) || !destination.transports.includes(this.type)) {
      return false;
    }
    
    const dx = source.position.x - destination.position.x;
    const dy = source.position.y - destination.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance <= this.MAX_RANGE;
  }

  estimateLatency(source: SimulatedNode, destination: SimulatedNode): number {
    if (!this.canConnect(source, destination)) return Infinity;
    
    // Closer distance might have slightly better latency in simulation
    const dx = source.position.x - destination.position.x;
    const dy = source.position.y - destination.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return this.BASE_LATENCY + (distance * 2);
  }

  estimateReliability(source: SimulatedNode, destination: SimulatedNode): number {
    if (!this.canConnect(source, destination)) return 0;
    
    const dx = source.position.x - destination.position.x;
    const dy = source.position.y - destination.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Reliability drops as distance approaches MAX_RANGE
    return Math.max(0.1, 1.0 - (distance / this.MAX_RANGE) * 0.5);
  }

  async transfer(_bundle: EmergencyBundle, source: SimulatedNode, destination: SimulatedNode): Promise<TransferResult> {
    if (!this.canConnect(source, destination)) {
      return { success: false, latencyMs: 0, batteryCost: 0, error: 'Out of range or unsupported transport' };
    }

    const reliability = this.estimateReliability(source, destination);
    const isSuccessful = Math.random() <= reliability;
    const latency = this.estimateLatency(source, destination);
    
    // Simulate async transfer time
    await new Promise(resolve => setTimeout(resolve, Math.min(latency, 100))); // Cap visual wait time

    if (isSuccessful) {
      return { success: true, latencyMs: latency, batteryCost: this.BATTERY_COST };
    } else {
      return { success: false, latencyMs: latency, batteryCost: this.BATTERY_COST / 2, error: 'Packet loss' };
    }
  }
}
