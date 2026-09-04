import { TransportType, SimulatedNode, EmergencyBundle } from '../types';
import { VirtualTransport, TransferResult } from './VirtualTransport';

export class VirtualWifiDirect implements VirtualTransport {
  type = TransportType.WIFI_DIRECT;
  
  private MAX_RANGE = 150; // meters (simulated pixels)
  private BASE_LATENCY = 500; // ms (higher discovery time)
  private BATTERY_COST = 2.0; // Higher battery cost than BLE

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
    
    // WiFi Direct has higher discovery time but fast transfer
    return this.BASE_LATENCY;
  }

  estimateReliability(source: SimulatedNode, destination: SimulatedNode): number {
    if (!this.canConnect(source, destination)) return 0;
    
    // Wi-Fi direct is generally more reliable than BLE over distance
    return 0.95;
  }

  async transfer(_bundle: EmergencyBundle, source: SimulatedNode, destination: SimulatedNode): Promise<TransferResult> {
    if (!this.canConnect(source, destination)) {
      return { success: false, latencyMs: 0, batteryCost: 0, error: 'Out of range or unsupported transport' };
    }

    const reliability = this.estimateReliability(source, destination);
    const isSuccessful = Math.random() <= reliability;
    const latency = this.estimateLatency(source, destination);
    
    // Simulate async transfer time
    await new Promise(resolve => setTimeout(resolve, Math.min(latency, 200)));

    if (isSuccessful) {
      return { success: true, latencyMs: latency, batteryCost: this.BATTERY_COST };
    } else {
      return { success: false, latencyMs: latency, batteryCost: this.BATTERY_COST / 2, error: 'Connection failed' };
    }
  }
}
