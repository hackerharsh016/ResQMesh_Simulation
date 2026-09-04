import { TransportType, SimulatedNode, EmergencyBundle } from '../types';

export interface TransferResult {
  success: boolean;
  latencyMs: number;
  batteryCost: number;
  error?: string;
}

export interface VirtualTransport {
  type: TransportType;
  
  canConnect(source: SimulatedNode, destination: SimulatedNode): boolean;
  estimateLatency(source: SimulatedNode, destination: SimulatedNode): number;
  estimateReliability(source: SimulatedNode, destination: SimulatedNode): number;
  transfer(bundle: EmergencyBundle, source: SimulatedNode, destination: SimulatedNode): Promise<TransferResult>;
}
