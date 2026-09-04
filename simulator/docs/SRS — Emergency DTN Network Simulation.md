# Software Requirements Specification (SRS)

## Emergency DTN Network Simulation

**Version:** 1.0  
**Platform:** Web  
**Frontend:** React + TypeScript  
**Purpose:** Simulation and validation of the Emergency Delay-Tolerant Network (DTN) routing protocol

---

# 1. Introduction

## 1.1 Purpose

The Emergency DTN Network Simulation is a browser-based simulation platform designed to model, visualize, test, and evaluate the proposed smartphone-based emergency communication protocol.

The simulation will reproduce the behavior of a real emergency network consisting of:

- Victim devices
- Relay smartphones
- Gateway-capable devices
- Emergency authority
- Intermittent communication links
- Device movement
- Battery constraints
- Network congestion
- Packet/message loss
- Node failures
- Gateway failures
- Store-Carry-Forward DTN behavior
- Adaptive Emergency Relay Score (AERS)
- Controlled message replication
- Emergency message priorities
- TTL-based message expiration

The simulator must use a **discrete-event simulation engine** rather than relying on animation alone.

---

# 2. System Objectives

The system shall:

1. Simulate an emergency smartphone network.
2. Generate SOS messages from simulated victim nodes.
3. Discover neighboring nodes dynamically.
4. Calculate relay suitability using AERS.
5. Forward emergency bundles between nodes.
6. Persist undelivered bundles using DTN Store-Carry-Forward.
7. Dynamically discover and use gateway nodes.
8. Support multiple communication technologies.
9. Simulate node movement and changing connectivity.
10. Simulate network failures and disaster conditions.
11. Prevent uncontrolled flooding through controlled replication.
12. Track message delivery from origin to authority.
13. Provide real-time visualization of routing decisions.
14. Measure network performance.
15. Compare different routing strategies.
16. Provide reproducible scenarios for testing and demonstration.

---

# 3. Scope

## 3.1 In Scope

### Network Simulation

- Node creation
- Node deletion
- Node movement
- Node battery simulation
- Node communication range
- Dynamic neighbor discovery
- Gateway availability
- Authority availability
- Network partitioning
- Node failure
- Gateway failure

### Emergency Communication

- SOS generation
- Emergency priority
- Emergency metadata
- Message TTL
- Message persistence
- Message forwarding
- Message replication
- Duplicate detection
- Delivery acknowledgment
- Message expiration

### Routing

- AERS calculation
- Gateway probability
- Contact probability
- Link quality
- Battery score
- Delivery history
- Destination progress
- Latency estimation
- Hop penalty
- Queue/congestion penalty
- Routing decision visualization

### Communication

The simulator shall model:

- BLE
- Wi-Fi Direct
- Wi-Fi Aware
- Internet
- SMS

These are simulated communication channels; the browser does not directly control device radios.

### Analytics

- Delivery probability
- Delivery time
- Hop count
- Replication count
- Message expiration
- Failed transfers
- Gateway discovery time
- Battery consumption
- Network overhead
- Routing efficiency

---

# 4. System Architecture

```text
                    React UI
                       │
                       ▼
              Simulation Controller
                       │
                       ▼
              Discrete Event Engine
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
     Node Engine   Network Engine  Failure Engine
          │            │            │
          └────────────┼────────────┘
                       ▼
                Protocol Engine
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   DTN Engine      AERS Router    Security Engine
        │              │              │
        └──────────────┼──────────────┘
                       ▼
                 Bundle Store
                       │
                       ▼
                 Event Logger
                       │
                       ▼
                  Analytics
```

The UI must not directly implement routing decisions.

---

# 5. Design Principle

## Protocol/UI Separation

The simulation must follow:

```text
UI
 ↓
Simulation Controller
 ↓
Simulation Engine
 ↓
Protocol Engine
 ↓
Virtual Transport
```

The protocol engine must be independent from React components.

This allows the same protocol implementation to later be reused by the real mobile application.

---

# 6. Simulation Modes

## 6.1 Playground Mode

Allows the user to manually create and manipulate the network.

Features:

- Add nodes
- Remove nodes
- Drag nodes
- Change node properties
- Toggle Internet
- Toggle gateway capability
- Trigger SOS
- Fail nodes
- Change battery
- Change communication range

---

## 6.2 Scenario Mode

Provides predefined disaster scenarios.

Example scenarios:

### Scenario A — Basic Relay

```text
Victim → Relay → Gateway → Authority
```

### Scenario B — Multi-Hop

```text
Victim
  ↓
Relay A
  ↓
Relay B
  ↓
Relay C
  ↓
Gateway
  ↓
Authority
```

### Scenario C — Gateway Failure

```text
Victim → Relay A → Gateway X
                       X
                       │
                       ▼
                  Gateway Y
                       │
                       ▼
                   Authority
```

### Scenario D — Network Partition

Two network clusters are temporarily disconnected and later reconnect.

### Scenario E — Congested Disaster Zone

Large number of SOS messages are generated simultaneously.

### Scenario F — Low Battery Network

Relay nodes progressively lose battery.

### Scenario G — Malicious/Unreliable Relay

Selected relay nodes repeatedly fail to forward bundles.

---

## 6.3 Live Protocol Mode

Displays the protocol execution step-by-step.

Example:

```text
SOS CREATED
     ↓
BUNDLE PERSISTED
     ↓
NEIGHBORS DISCOVERED
     ↓
AERS CALCULATED
     ↓
RELAY SELECTED
     ↓
BUNDLE TRANSFERRED
     ↓
STORE-CARRY-FORWARD
     ↓
GATEWAY DISCOVERED
     ↓
AUTHORITY RECEIVED
     ↓
ACKNOWLEDGMENT
```

---

# 7. Simulation Entities

## 7.1 Node

Each simulated smartphone shall contain:

```typescript
interface SimulatedNode {
  id: string;
  type: NodeType;

  position: Position;
  velocity: Velocity;

  battery: number;

  communicationRange: number;

  transports: TransportCapability[];

  hasInternet: boolean;
  isGateway: boolean;
  isAuthority: boolean;
  isActive: boolean;

  bundleStore: string[];

  deliveryHistory: DeliveryRecord[];

  metrics: NodeMetrics;
}
```

---

# 8. Node Types

```typescript
enum NodeType {
  VICTIM,
  RELAY,
  GATEWAY,
  AUTHORITY
}
```

A node may have multiple capabilities.

Example:

```text
Relay Node
 ├── BLE
 ├── Wi-Fi Direct
 ├── Battery: 72%
 └── Internet: No
```

---

# 9. Position Model

Each node shall have:

```typescript
interface Position {
  x: number;
  y: number;
}
```

The simulator will use a 2D coordinate system.

Optional geographic mode may map the simulation to latitude/longitude.

---

# 10. Movement Model

The simulation shall support:

### Static

Nodes remain stationary.

### Random Walk

Nodes move randomly.

### Controlled Movement

User controls node movement.

### Predefined Movement

Nodes follow predefined paths.

Example:

```text
Node A:
(100,100)
 ↓
(150,120)
 ↓
(200,150)
 ↓
(250,180)
```

---

# 11. Communication Model

Two nodes become potential neighbors when:

\[
Distance(A,B) \leq CommunicationRange
\]

The simulator shall continuously update connectivity.

---

# 12. Virtual Transport Layer

```typescript
interface VirtualTransport {
  type: TransportType;

  canConnect(
    source: SimulatedNode,
    destination: SimulatedNode
  ): boolean;

  estimateLatency(
    source: SimulatedNode,
    destination: SimulatedNode
  ): number;

  estimateReliability(
    source: SimulatedNode,
    destination: SimulatedNode
  ): number;

  transfer(
    bundle: EmergencyBundle,
    source: SimulatedNode,
    destination: SimulatedNode
  ): TransferResult;
}
```

---

# 13. Transport Types

```typescript
enum TransportType {
  BLE,
  WIFI_DIRECT,
  WIFI_AWARE,
  INTERNET,
  SMS
}
```

Each transport shall have configurable:

- Range
- Discovery latency
- Transfer latency
- Reliability
- Packet loss
- Battery cost
- Throughput

---

# 14. Emergency Bundle

An SOS shall be represented as a DTN bundle.

```typescript
interface EmergencyBundle {
  bundleId: string;

  originNodeId: string;

  destinationType: DestinationType;

  priority: Priority;

  emergencyType: EmergencyType;

  severity: Severity;

  createdAt: number;

  ttl: number;

  expiresAt: number;

  payload: EmergencyPayload;

  routingMetadata: RoutingMetadata;

  hopCount: number;

  replicationCount: number;

  state: BundleState;
}
```

---

# 15. Emergency Payload

```typescript
interface EmergencyPayload {
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
```

---

# 16. Emergency Priority

```typescript
enum Priority {
  CRITICAL = 0,
  HIGH = 1,
  MEDIUM = 2,
  LOW = 3
}
```

Priority affects:

- Forwarding preference
- Replication budget
- Queue position
- TTL
- Routing weight

---

# 17. DTN Store-Carry-Forward

Every node shall have a local bundle store.

When a destination is unavailable:

```text
Receive Bundle
      ↓
Persist Bundle
      ↓
Wait for Contact
      ↓
Evaluate Neighbors
      ↓
Forward
```

The simulator must support bundles remaining stored for multiple simulation steps.

---

# 18. Bundle Lifecycle

```text
CREATED
   ↓
PERSISTED
   ↓
QUEUED
   ↓
OFFERED
   ↓
TRANSFERRED
   ↓
RELAYED
   ↓
DELIVERED
```

Alternative states:

```text
EXPIRED
REJECTED
CANCELLED
```

---

# 19. AERS Routing Engine

The simulator shall implement:

\[
AERS_i =
w_GG_i+
w_CC_i+
w_LL_i+
w_BB_i+
w_PP_i+
w_DD_i+
w_TT_i-
w_HH_i-
w_QQ_i
\]

Where:

- \(G\) = Gateway Probability
- \(C\) = Contact Opportunity
- \(L\) = Link Quality
- \(B\) = Battery Availability
- \(P\) = Destination Progress
- \(D\) = Delivery History
- \(T\) = Latency Factor
- \(H\) = Hop Penalty
- \(Q\) = Congestion Penalty

All factors shall be normalized to:

```text
0.0 → 1.0
```

---

# 20. Relay Selection

When multiple candidates are available:

```text
Candidate A → AERS 0.61
Candidate B → AERS 0.84
Candidate C → AERS 0.47
```

The router selects:

```text
Candidate B
```

provided:

```text
AERS > Threshold
```

and:

```text
AERS > CurrentRelayScore + HysteresisMargin
```

This prevents unnecessary forwarding.

---

# 21. Routing Decision Object

```typescript
interface RoutingDecision {
  bundleId: string;

  selectedNodeId?: string;

  score: number;

  threshold: number;

  reason: RoutingReason[];

  candidates: CandidateScore[];
}
```

Possible reasons:

```typescript
enum RoutingReason {
  HIGH_GATEWAY_PROBABILITY,
  HIGH_CONTACT_PROBABILITY,
  GOOD_LINK,
  HIGH_BATTERY,
  LOW_CONGESTION,
  HIGH_DELIVERY_HISTORY,
  LOW_LATENCY,
  DESTINATION_PROGRESS,
  HIGH_PRIORITY
}
```

---

# 22. Controlled Replication

The system shall not blindly flood SOS messages.

Replication budget:

\[
ReplicationBudget =
f(Priority, TTL, NetworkDensity, GatewayProbability)
\]

Example:

```text
CRITICAL → Replication Budget: 4
HIGH     → Replication Budget: 3
MEDIUM   → Replication Budget: 2
LOW      → Replication Budget: 1
```

The exact values must be configurable.

---

# 23. Duplicate Detection

Each bundle shall contain a globally unique:

```text
bundleId
```

Before accepting a bundle:

```text
if bundleId already exists
    reject duplicate
else
    store bundle
```

The simulator must visualize duplicate suppression.

---

# 24. TTL

Each bundle shall have:

```typescript
createdAt
expiresAt
ttl
```

When:

```text
currentTime >= expiresAt
```

the bundle becomes:

```text
EXPIRED
```

Expired bundles shall not be forwarded.

---

# 25. Gateway Model

A gateway is a node that can reach the authority through Internet connectivity.

```typescript
interface GatewayState {
  nodeId: string;

  internetAvailable: boolean;

  authorityReachability: number;

  latency: number;

  reliability: number;
}
```

Gateway availability can dynamically change during simulation.

---

# 26. Authority

The authority represents:

- Emergency control room
- Rescue coordination center
- Emergency server

When the authority receives a bundle:

```text
Bundle → AUTHORITY
```

the bundle becomes:

```text
DELIVERED
```

The authority generates an acknowledgment.

---

# 27. Acknowledgment

```typescript
interface BundleAck {
  bundleId: string;

  deliveredTo: string;

  deliveredAt: number;

  originalSource: string;

  hopCount: number;
}
```

ACK propagation may optionally be simulated.

---

# 28. Failure Simulation

The simulator must support:

### Node Failure

```text
ACTIVE → FAILED
```

Failed nodes cannot:

- Discover
- Receive
- Forward
- Generate messages

### Gateway Failure

```text
Gateway Available
       ↓
Gateway Failed
       ↓
Router searches for alternative gateway
```

### Link Failure

A communication link can temporarily become unavailable.

### Packet Loss

Transfers may randomly fail according to configured probability.

---

# 29. Congestion Model

Each node shall have a queue.

```typescript
interface QueueState {
  currentLoad: number;

  maxCapacity: number;

  droppedBundles: number;
}
```

Congestion penalty:

\[
Q_i =
\frac{CurrentQueue}{MaximumQueue}
\]

A congested node receives a lower AERS.

---

# 30. Battery Model

Each node starts with configurable battery:

```text
0–100%
```

Battery decreases based on:

- Discovery
- Connection
- Transfer
- Replication
- Background activity

Example:

```text
BLE Discovery      → -0.01%
Wi-Fi Discovery    → -0.03%
Bundle Transfer    → -0.02%
```

Values must be configurable.

---

# 31. Network Density

The simulator shall calculate:

\[
Density =
\frac{Number\ of\ active\ neighbors}
{Maximum\ expected\ neighbors}
\]

Network density may influence:

- Replication budget
- Routing decisions
- Congestion
- Delivery probability

---

# 32. Simulation Clock

The simulation shall use a virtual clock.

Controls:

```text
▶ Play
⏸ Pause
⏩ Fast Forward
⏪ Slow Motion
↻ Reset
```

Speed options:

```text
0.25x
0.5x
1x
2x
5x
10x
```

---

# 33. Discrete Event Engine

The simulator shall maintain an event queue.

Example events:

```text
NODE_MOVED
NODE_DISCOVERED
LINK_ESTABLISHED
SOS_CREATED
BUNDLE_STORED
AERS_CALCULATED
ROUTING_DECISION
TRANSFER_STARTED
TRANSFER_COMPLETED
TRANSFER_FAILED
GATEWAY_DISCOVERED
GATEWAY_FAILED
ACK_RECEIVED
BUNDLE_EXPIRED
NODE_FAILED
```

---

# 34. Event Structure

```typescript
interface SimulationEvent {
  id: string;

  timestamp: number;

  type: EventType;

  sourceNodeId?: string;

  targetNodeId?: string;

  bundleId?: string;

  data?: unknown;
}
```

---

# 35. Simulation Canvas

The main screen shall contain a 2D network visualization.

Nodes should visually indicate:

- Node type
- Battery
- Connectivity
- Gateway status
- Current activity
- Failure status

Example:

```text
      Relay B
        ●
       / \
      /   \
Victim ●───● Gateway
 A          C
             │
             ▼
         Authority
```

---

# 36. Visual Link States

Links shall indicate:

### Available

Node-to-node communication possible.

### Active

Bundle currently being transferred.

### Failed

Communication attempt failed.

### Expired

Temporary contact no longer available.

---

# 37. Node Interaction

Clicking a node shall open a details panel.

Display:

```text
Node ID
Type
Battery
Position
Active Transports
Internet
Gateway Status
Neighbors
Bundle Count
Delivery History
AERS Contributions
```

---

# 38. Bundle Visualization

Clicking an SOS shall show:

```text
Bundle ID
Origin
Priority
Emergency Type
TTL
Current Node
Hop Count
Replication Count
Current State
Delivery Time
```

---

# 39. Routing Visualization

Whenever AERS is calculated, show:

```text
Nearby Nodes

Node A   0.62
Node B   0.84  ← SELECTED
Node C   0.47
Node D   0.71
```

Also show factor breakdown:

```text
Gateway Probability     +0.22
Contact Opportunity     +0.17
Link Quality            +0.14
Battery                 +0.08
Delivery History        +0.09
Latency                 +0.06
Hop Penalty             -0.03
Congestion              -0.02
--------------------------------
Final AERS                0.71
```

---

# 40. Control Panel

The simulation shall provide controls for:

### Network

- Node count
- Communication range
- Network density
- Movement speed

### Connectivity

- BLE
- Wi-Fi Direct
- Wi-Fi Aware
- Internet
- SMS

### Failure

- Packet loss
- Node failure
- Gateway failure
- Link failure

### Protocol

- AERS weights
- AERS threshold
- Replication budget
- TTL
- Priority

### Environment

- Disaster zones
- Obstacles
- Restricted areas

---

# 41. SOS Generation

The user shall be able to:

```text
Select Node
      ↓
Select Emergency Type
      ↓
Select Severity
      ↓
Generate SOS
```

Emergency types:

```text
MEDICAL
FIRE
TRAPPED
BUILDING_COLLAPSE
FLOOD
EARTHQUAKE
MISSING_PERSON
SECURITY
GENERAL
```

---

# 42. Authority Dashboard

The authority dashboard shall show:

### Incoming SOS

```text
CRITICAL
Location: Zone A
Origin: Node-17
Received: 00:18
```

### Network Overview

- Active nodes
- Active gateways
- Pending SOS
- Delivered SOS
- Expired SOS

### Emergency Map

Display the origin and current route of emergency bundles.

---

# 43. Analytics Dashboard

The simulator shall calculate:

## Delivery Probability

\[
P_{delivery} =
\frac{Delivered\ Bundles}
{Generated\ Bundles}
\]

## Deadline Delivery Probability

\[
P(T_{delivery}\leq D)
\]

This is the primary performance metric.

---

# 44. Additional Metrics

### Average Delivery Time

\[
T_{avg} =
\frac{\sum T_{delivery}}
{Delivered\ Bundles}
\]

### Average Hop Count

\[
H_{avg} =
\frac{\sum Hops}
{Delivered\ Bundles}
\]

### Replication Overhead

\[
R =
\frac{Total\ Forwarded\ Copies}
{Original\ Bundles}
\]

### Battery Consumption

\[
B_{consumed} =
InitialBattery - FinalBattery
\]

### Gateway Discovery Time

Time between:

```text
SOS created
```

and:

```text
Gateway discovered
```

---

# 45. Routing Strategy Comparison

The simulator shall support multiple routing strategies.

## Strategy 1 — Direct

Send only to a directly reachable gateway.

## Strategy 2 — Random

Randomly select a relay.

## Strategy 3 — Nearest Relay

Select the geographically closest relay.

## Strategy 4 — Epidemic/Flooding

Replicate to available neighbors.

## Strategy 5 — AERS

Select relay according to emergency-aware routing score.

This comparison is essential for validating the proposed routing approach.

---

# 46. Benchmark Dashboard

The simulator shall compare:

| Metric | Random | Nearest | Flooding | AERS |
|---|---:|---:|---:|---:|
| Delivery Probability | — | — | — | — |
| Deadline Delivery | — | — | — | — |
| Avg Delivery Time | — | — | — | — |
| Avg Hop Count | — | — | — | — |
| Replication Count | — | — | — | — |
| Battery Consumption | — | — | — | — |

Values must be generated from simulation runs.

No manually fabricated performance numbers shall be displayed.

---

# 47. Monte Carlo Simulation

The system should support repeated experiments.

Example:

```text
Runs: 100
Nodes: 50
SOS Messages: 20
Packet Loss: 10%
Gateway Probability: 20%
```

The simulator executes the scenario multiple times using different random seeds.

Output:

```text
Average Delivery Probability
95% Confidence Interval
Average Delivery Time
Average Replication
Average Battery Consumption
```

---

# 48. Scenario Recording

Users shall be able to save:

```typescript
interface SimulationScenario {
  id: string;

  name: string;

  nodes: SimulatedNode[];

  configuration: SimulationConfig;

  events: SimulationEvent[];

  seed: number;
}
```

Saved scenarios must be reproducible.

---

# 49. Export

The simulator should support exporting:

### JSON

Complete simulation configuration and event history.

### CSV

Performance metrics.

### Screenshot

Network state for presentations.

---

# 50. React Application Structure

Recommended structure:

```text
src/
│
├── app/
│
├── components/
│   ├── simulation/
│   ├── network/
│   ├── nodes/
│   ├── bundles/
│   ├── routing/
│   ├── dashboard/
│   └── controls/
│
├── simulation/
│   ├── engine/
│   ├── models/
│   ├── events/
│   ├── environment/
│   └── scenarios/
│
├── protocol/
│   ├── dtn/
│   ├── routing/
│   ├── replication/
│   ├── gateway/
│   └── security/
│
├── transports/
│   ├── VirtualBLE.ts
│   ├── VirtualWifiDirect.ts
│   ├── VirtualWifiAware.ts
│   ├── VirtualInternet.ts
│   └── VirtualSMS.ts
│
├── storage/
│
├── analytics/
│
├── state/
│
├── types/
│
└── utils/
```

---

# 51. State Management

Use Zustand for global application state.

Separate:

```text
UI State
```

from:

```text
Simulation State
```

and:

```text
Protocol State
```

The React UI must not become the source of truth for simulation behavior.

---

# 52. Rendering Requirements

The network visualization should support at least:

- 100 nodes smoothly
- 250 nodes as a target
- Real-time node movement
- Dynamic links
- Bundle animations
- Selection
- Zoom
- Pan

Rendering technology may use:

- HTML Canvas
- SVG
- WebGL

For larger networks, Canvas/WebGL is preferred over hundreds of individual DOM/SVG elements.

---

# 53. UI Layout

Recommended desktop layout:

```text
┌─────────────────────────────────────────────────────────────┐
│                    HEADER / SIMULATION BAR                  │
├───────────────┬───────────────────────────────┬─────────────┤
│               │                               │             │
│   Controls    │       NETWORK CANVAS         │ Node /      │
│               │                               │ Bundle      │
│   Scenarios   │       ●────●                 │ Inspector   │
│   Failures    │      /      \                │             │
│   Protocol    │     ●        ●               │             │
│   Parameters  │             │                │             │
│               │             ●                │             │
├───────────────┴───────────────────────────────┴─────────────┤
│ Timeline / Event Log                                         │
├─────────────────────────────────────────────────────────────┤
│ Metrics: Delivery | Latency | Hops | Replication | Battery │
└─────────────────────────────────────────────────────────────┘
```

---

# 54. Event Log

Display protocol events chronologically.

Example:

```text
00:00.000  Node-17 generated CRITICAL SOS
00:00.020  Bundle B-001 persisted
00:01.200  Node-17 discovered Node-04
00:01.210  AERS calculated
00:01.220  Node-04 selected
00:02.100  Bundle transferred to Node-04
00:05.600  Node-04 discovered Node-11
00:05.620  Gateway probability = 0.82
00:05.640  Node-11 selected
00:07.100  Gateway connection established
00:08.200  Authority received B-001
00:08.210  ACK generated
```

---

# 55. Security Simulation

The simulator shall model, at minimum:

- Bundle authentication status
- Invalid signature
- Duplicate bundle
- Replay attempt
- Malicious relay
- Rate limiting
- Storage quota

Example:

```text
Invalid Signature
       ↓
Bundle Rejected
       ↓
Security Event Logged
```

Actual production cryptography does not need to be implemented inside the simulator unless required for protocol testing.

---

# 56. Configuration

Example:

```typescript
interface SimulationConfig {
  nodeCount: number;

  communicationRange: number;

  simulationDuration: number;

  packetLossRate: number;

  nodeFailureRate: number;

  gatewayFailureRate: number;

  defaultTTL: number;

  replicationBudget: number;

  aersThreshold: number;

  hysteresisMargin: number;

  movementEnabled: boolean;

  batterySimulationEnabled: boolean;

  congestionSimulationEnabled: boolean;
}
```

---

# 57. Functional Requirements

## FR-01

The system shall allow creation of simulated nodes.

## FR-02

The system shall dynamically calculate node connectivity.

## FR-03

The system shall allow SOS generation.

## FR-04

The system shall persist undelivered bundles.

## FR-05

The system shall calculate AERS for available relay candidates.

## FR-06

The system shall select relays according to routing policy.

## FR-07

The system shall support controlled replication.

## FR-08

The system shall support gateway discovery.

## FR-09

The system shall support store-carry-forward behavior.

## FR-10

The system shall simulate failures.

## FR-11

The system shall track bundle state.

## FR-12

The system shall generate delivery acknowledgments.

## FR-13

The system shall calculate performance metrics.

## FR-14

The system shall support routing strategy comparison.

## FR-15

The system shall allow scenario replay.

---

# 58. Non-Functional Requirements

## Performance

- Simulation should remain responsive at 100+ nodes.
- Event processing must not block the UI.
- Simulation calculations should be decoupled from rendering.

## Reliability

- Simulation runs with the same seed should produce reproducible results.
- No bundle should disappear without an event explaining its state transition.

## Maintainability

- Protocol logic must remain independent of React.
- Transport implementations must follow a common interface.
- Routing algorithms must be pluggable.

## Extensibility

The architecture should allow future addition of:

- New routing algorithms
- New transports
- New failure models
- New disaster scenarios
- Real geographic maps
- Machine-learning routing
- Real-device integration

---

# 59. Testing Requirements

## Unit Testing

Test:

- AERS calculation
- TTL
- Bundle state transitions
- Duplicate detection
- Replication budget
- Gateway selection
- Battery calculation
- Congestion calculation

## Integration Testing

Test:

```text
SOS
 ↓
Relay
 ↓
Relay
 ↓
Gateway
 ↓
Authority
```

## Failure Testing

Test:

```text
Gateway disappears
Relay disappears
Link fails
Packet lost
Battery reaches 0
```

## Benchmark Testing

Compare:

```text
Random
Nearest
Flooding
AERS
```

using identical scenarios and random seeds.

---

# 60. Acceptance Criteria

The simulation is considered MVP-complete when it can demonstrate:

### Scenario 1

```text
Victim
 ↓
Relay
 ↓
Gateway
 ↓
Authority
```

and successfully deliver an SOS.

### Scenario 2

The victim has no Internet but the SOS reaches the authority through multiple relays.

### Scenario 3

The first gateway fails and the system selects another gateway.

### Scenario 4

A higher-scoring relay is selected instead of the geographically nearest relay.

### Scenario 5

A CRITICAL SOS receives higher forwarding priority than LOW priority traffic.

### Scenario 6

Duplicate bundles are detected and suppressed.

### Scenario 7

Expired bundles are not forwarded.

### Scenario 8

Flooding generates greater replication overhead than AERS under the same scenario.

### Scenario 9

AERS performance can be compared quantitatively against Random, Nearest and Flooding routing.

---

# 61. MVP Development Priority

## Phase 1 — Simulation Core

- React application
- Canvas network
- Node model
- Virtual clock
- Node movement
- Connectivity detection

## Phase 2 — DTN

- Bundle model
- Local bundle store
- TTL
- Store-Carry-Forward
- Bundle lifecycle

## Phase 3 — Routing

- AERS
- Relay selection
- Routing visualization
- Gateway selection

## Phase 4 — Failure & Replication

- Controlled replication
- Packet loss
- Node failure
- Gateway failure
- Congestion
- Battery

## Phase 5 — Analytics

- Delivery probability
- Deadline delivery
- Delivery time
- Hop count
- Replication
- Battery consumption

## Phase 6 — Benchmarking

- Random routing
- Nearest routing
- Flooding
- AERS comparison
- Monte Carlo experiments

## Phase 7 — Presentation Layer

- Scenario presets
- Timeline
- Event log
- Authority dashboard
- Professional visualization
- Export

---

# 62. Critical Implementation Principle

The simulator must **not** be implemented as:

```text
Animation
   ↓
Pretend packet moves
   ↓
Show "Delivered"
```

Instead:

```text
Simulation Clock
       ↓
Physical Environment Model
       ↓
Neighbor Discovery
       ↓
Protocol Engine
       ↓
AERS Routing
       ↓
DTN Bundle Store
       ↓
Virtual Transport
       ↓
Gateway
       ↓
Authority
       ↓
ACK
```

Every visual animation must represent a real state transition inside the simulation engine.

---

# 63. Final System Goal

The final simulation should answer the central research/engineering question:

> **Does emergency-aware relay selection improve the probability of delivering an SOS within its deadline compared with simpler routing strategies under intermittent and failing connectivity?**

The simulator must therefore be capable of producing measurable evidence for:

\[
\boxed{
P(T_{delivery}\leq D)
}
\]

while also measuring:

\[
Latency,\ Hops,\ Replication,\ Battery,\ Overhead
\]

This simulation will serve as the **digital validation environment** for the real smartphone-based Emergency DTN application.