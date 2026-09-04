export enum NodeType {
  VICTIM,
  RELAY,
  GATEWAY,
  AUTHORITY
}

export enum TransportType {
  BLE,
  WIFI_DIRECT,
  WIFI_AWARE,
  INTERNET,
  SMS
}

export enum Priority {
  CRITICAL = 0,
  HIGH = 1,
  MEDIUM = 2,
  LOW = 3
}

export enum BundleState {
  CREATED,
  PERSISTED,
  QUEUED,
  OFFERED,
  TRANSFERRED,
  RELAYED,
  DELIVERED,
  EXPIRED,
  REJECTED,
  CANCELLED
}

export enum SimulationEventType {
  NODE_MOVED,
  NEIGHBOR_DISCOVERED,
  LINK_ESTABLISHED,
  LINK_LOST,

  SOS_CREATED,
  BUNDLE_STORED,

  AERS_CALCULATED,
  ROUTING_DECISION,

  TRANSFER_STARTED,
  TRANSFER_COMPLETED,
  TRANSFER_FAILED,

  GATEWAY_DISCOVERED,
  GATEWAY_LOST,

  NODE_FAILED,
  NODE_RECOVERED,

  ACK_GENERATED,
  ACK_RECEIVED,

  BUNDLE_EXPIRED,

  SECURITY_EVENT
}

export interface DeliveryRecord {
  bundleId: string;
  timestamp: number;
  success: boolean;
}

export interface ContactRecord {
  nodeId: string;
  encounterCount: number;
  lastSeen: number;
  averageContactInterval: number;
}

export interface NodeMetrics {
  bundlesCreated: number;
  bundlesRelayed: number;
  bundlesDelivered: number;
  bundlesDropped: number;
  totalBytesTransferred: number;
  energyConsumed: number;
}

export interface SimulatedNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number; };
  velocity: { x: number; y: number; };
  battery: number;
  communicationRange: number;
  transports: TransportType[];
  hasInternet: boolean;
  isGateway: boolean;
  isAuthority: boolean;
  isActive: boolean;
  bundleStore: string[];
  deliveryHistory: DeliveryRecord[];
  contactHistory: ContactRecord[];
  metrics: NodeMetrics;
}

export enum EmergencyType {
  MEDICAL,
  FIRE,
  POLICE,
  RESCUE,
  OTHER
}

export enum Severity {
  LOW,
  MEDIUM,
  HIGH,
  CRITICAL
}

export interface EmergencyPayload {
  victimId?: string;
  location: {
    latitude?: number;
    longitude?: number;
    x: number;
    y: number;
    accuracy?: number;
  };
  timestamp: number;
  description?: string;
}

export interface EmergencyBundle {
  bundleId: string;
  originNodeId: string;
  destinationType: 'AUTHORITY';
  priority: Priority;
  emergencyType: EmergencyType;
  severity: Severity;
  createdAt: number;
  ttl: number;
  expiresAt: number;
  payload: EmergencyPayload;
  hopCount: number;
  replicationCount: number;
  state: BundleState;
  currentNodeId: string;
}

export interface SimulationEvent {
  id: string;
  timestamp: number;
  type: SimulationEventType;
  sourceNodeId?: string;
  targetNodeId?: string;
  bundleId?: string;
  data?: unknown;
}
