# MASTER IMPLEMENTATION PROMPT
## Emergency DTN Routing & AERS Simulation Platform

You are a **senior React + TypeScript systems architect, network simulation engineer, and UI/UX engineer**.

Your task is to build a production-quality **Emergency Delay-Tolerant Network (DTN) Simulation Platform** using React and TypeScript.

This is not a simple visualization project.

The simulator must implement the **actual protocol logic** for:

- Emergency SOS generation
- DTN Store-Carry-Forward
- Adaptive Emergency Relay Score (AERS)
- Intelligent relay selection
- Gateway discovery
- Controlled replication
- TTL/deadline handling
- Node movement
- Dynamic connectivity
- Battery constraints
- Congestion
- Packet loss
- Node failures
- Gateway failures
- Multiple virtual communication transports
- Delivery acknowledgment
- Performance analytics
- Routing strategy benchmarking

The final application should be suitable for demonstrating and validating the proposed SIH 2026 emergency communication solution.

---

# 1. CORE PRODUCT CONCEPT

Build a browser-based simulation of a smartphone-based emergency communication network.

The simulated network contains:

```text
Victim Smartphone
       ↓
Relay Smartphones
       ↓
Gateway-capable Smartphone
       ↓
Emergency Authority
```

Communication may occur through:

```text
BLE
Wi-Fi Direct
Wi-Fi Aware
Internet
SMS
```

The simulator models these technologies virtually.

The browser must NOT attempt to directly control Bluetooth or Wi-Fi hardware.

The simulation should answer:

> "Can emergency-aware relay selection improve the probability of delivering an SOS within its deadline under intermittent connectivity and network failures?"

---

# 2. MOST IMPORTANT ARCHITECTURAL RULE

DO NOT build this as an animation pretending to be a network.

Incorrect:

```text
React animation
      ↓
Move dot
      ↓
Show "Delivered"
```

Correct:

```text
React UI
   ↓
Simulation Controller
   ↓
Discrete Event Simulation Engine
   ↓
Environment / Node Model
   ↓
Protocol Engine
   ↓
DTN Engine
   ↓
AERS Routing Engine
   ↓
Virtual Transport
   ↓
Bundle Store
   ↓
Authority
   ↓
ACK
```

Every visual event must correspond to an actual internal simulation state transition.

---

# 3. TECHNOLOGY STACK

Use:

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui where useful
- Zustand for state management
- HTML Canvas or WebGL for network rendering
- Recharts or equivalent for analytics
- Vitest/Jest for unit tests

Do not introduce unnecessary dependencies.

Keep the protocol/simulation engine independent from React.

---

# 4. ARCHITECTURE

Use this architecture:

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
│   ├── analytics/
│   └── controls/
│
├── simulation/
│   ├── engine/
│   ├── environment/
│   ├── models/
│   ├── events/
│   ├── scheduler/
│   └── scenarios/
│
├── protocol/
│   ├── dtn/
│   ├── routing/
│   ├── gateway/
│   ├── replication/
│   └── security/
│
├── transports/
│   ├── VirtualBLE.ts
│   ├── VirtualWifiDirect.ts
│   ├── VirtualWifiAware.ts
│   ├── VirtualInternet.ts
│   └── VirtualSMS.ts
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

# 5. DOMAIN MODEL

Implement strongly typed TypeScript models.

## Node Types

```typescript
enum NodeType {
  VICTIM,
  RELAY,
  GATEWAY,
  AUTHORITY
}
```

## Transport Types

```typescript
enum TransportType {
  BLE,
  WIFI_DIRECT,
  WIFI_AWARE,
  INTERNET,
  SMS
}
```

## Priority

```typescript
enum Priority {
  CRITICAL = 0,
  HIGH = 1,
  MEDIUM = 2,
  LOW = 3
}
```

## Bundle State

```typescript
enum BundleState {
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
```

---

# 6. SIMULATED NODE

Implement:

```typescript
interface SimulatedNode {
  id: string;

  type: NodeType;

  position: {
    x: number;
    y: number;
  };

  velocity: {
    x: number;
    y: number;
  };

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
```

---

# 7. EMERGENCY BUNDLE

Implement:

```typescript
interface EmergencyBundle {
  bundleId: string;

  originNodeId: string;

  destinationType: "AUTHORITY";

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
```

The bundle must be immutable in identity.

Its `bundleId` must remain unchanged throughout forwarding.

---

# 8. DISCRETE-EVENT SIMULATION ENGINE

Implement a virtual simulation clock.

The engine must support:

```text
PLAY
PAUSE
RESET
STEP
0.25x
0.5x
1x
2x
5x
10x
```

Use an event queue.

Example events:

```typescript
enum SimulationEventType {
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
```

Each event must have:

```typescript
interface SimulationEvent {
  id: string;

  timestamp: number;

  type: SimulationEventType;

  sourceNodeId?: string;

  targetNodeId?: string;

  bundleId?: string;

  data?: unknown;
}
```

The engine must be deterministic when given the same random seed.

---

# 9. NODE MOVEMENT

Implement:

### Static

Nodes do not move.

### Random Walk

Nodes move continuously with configurable velocity.

### Manual

User can drag nodes.

### Predefined Scenario

Nodes follow predefined trajectories.

Movement must affect actual connectivity.

---

# 10. CONNECTIVITY ENGINE

Two nodes can communicate when:

```text
distance(A, B) <= communicationRange
```

However, transport-specific range must also be considered.

Create:

```typescript
interface Link {
  sourceNodeId: string;

  targetNodeId: string;

  transport: TransportType;

  distance: number;

  reliability: number;

  packetLossRate: number;

  estimatedLatency: number;

  active: boolean;
}
```

Connectivity must update when nodes move.

---

# 11. VIRTUAL TRANSPORT SYSTEM

Create a common interface:

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

Implement:

```text
VirtualBLE
VirtualWifiDirect
VirtualWifiAware
VirtualInternet
VirtualSMS
```

Each must have configurable:

- Discovery latency
- Transfer latency
- Reliability
- Packet loss
- Range
- Battery cost

These are simulation parameters, NOT claims about real-world guaranteed performance.

---

# 12. DTN STORE-CARRY-FORWARD

Implement actual bundle persistence inside every node.

When a bundle cannot currently reach its destination:

```text
Bundle received
      ↓
Bundle persisted
      ↓
Node carries bundle
      ↓
New contact discovered
      ↓
AERS evaluated
      ↓
Forward
```

A bundle must be able to remain inside a node for an arbitrary period.

---

# 13. BUNDLE LIFECYCLE

Implement:

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

And:

```text
EXPIRED
REJECTED
CANCELLED
```

Every state transition must produce an event.

---

# 14. AERS — ADAPTIVE EMERGENCY RELAY SCORE

This is the most important component.

Implement:

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

Clamp:

\[
AERS_i = clamp(AERS_i,0,1)
\]

Every feature must be normalized to `[0,1]`.

---

# 15. DEFAULT AERS WEIGHTS

Use:

```typescript
const DEFAULT_WEIGHTS = {
  gateway: 0.25,
  contact: 0.15,
  link: 0.15,
  battery: 0.10,
  progress: 0.10,
  delivery: 0.10,
  latency: 0.10,
  hopPenalty: 0.025,
  congestion: 0.025
};
```

Verify that the positive and negative weight structure is intentionally configured.

Weights must be configurable from the UI.

---

# 16. GATEWAY PROBABILITY

For candidate `i`:

If:

```text
isGateway === true
AND
hasInternet === true
```

then:

```text
G = 1.0
```

If gateway capability exists but Internet is currently unavailable:

```text
G = 0.5
```

For ordinary relays use gateway history.

Maintain:

```typescript
interface GatewayHistory {
  successfulGatewayContacts: number;
  totalGatewayContacts: number;
}
```

Calculate:

\[
G =
\frac{successful+\alpha}
{total+\alpha+\beta}
\]

Use:

```text
alpha = 1
beta = 1
```

Unknown:

```text
G = 0.5
```

---

# 17. CONTACT OPPORTUNITY

Maintain:

```typescript
interface ContactHistory {
  encounterCount: number;

  lastSeen: number;

  averageContactInterval: number;
}
```

Frequency:

\[
C_f =
min(
encounterCount/N_{target},
1
)
\]

Use:

```text
N_target = 10
```

Recency:

\[
C_r=e^{-\Delta t/\tau}
\]

Use:

```text
tau = 60 seconds
```

Final:

\[
C=0.6C_f+0.4C_r
\]

Clamp to `[0,1]`.

---

# 18. LINK QUALITY

Calculate:

\[
L =
0.5(1-P_{loss})+
0.5R_{link}
\]

Where:

```text
P_loss = current packet loss probability
R_link = historical successful transfer rate
```

Unknown historical reliability should use:

```text
0.5
```

---

# 19. BATTERY

Use:

```typescript
function batteryScore(battery: number): number
```

Rules:

```text
battery < 10%  → 0.10
10–20%         → 0.30
>= 20%         → battery / 100
```

Clamp to `[0,1]`.

---

# 20. DESTINATION PROGRESS

For the current node:

```text
d_current = distance to nearest reachable gateway
```

For candidate:

```text
d_candidate = distance to nearest reachable gateway
```

Calculate:

\[
P =
clamp
\left(
\frac{d_{current}-d_{candidate}}
{d_{current}+\epsilon},
0,
1
\right)
\]

Use:

```text
epsilon = 0.001
```

If the candidate is farther from a gateway:

```text
P = 0
```

---

# 21. DELIVERY HISTORY

Maintain:

```typescript
interface DeliveryHistory {
  successfulTransfers: number;

  failedTransfers: number;
}
```

Calculate:

\[
D =
\frac{success+\alpha}
{success+failure+\alpha+\beta}
\]

with:

```text
alpha = 1
beta = 1
```

Unknown:

```text
D = 0.5
```

---

# 22. LATENCY SCORE

Estimate:

```text
discovery time
+
connection time
+
transfer time
+
expected waiting time
```

Then:

\[
T =
1 -
\frac{estimatedLatency}
{maximumAcceptableLatency}
\]

Clamp to `[0,1]`.

If estimated latency exceeds the maximum acceptable latency:

```text
T = 0
```

---

# 23. HOP PENALTY

Use:

\[
H =
min(
(currentHopCount+1)/H_{max},
1
)
\]

Use:

```text
H_max = 10
```

---

# 24. CONGESTION PENALTY

For candidate:

\[
Q=
\frac{queueSize}
{maximumQueueCapacity}
\]

Clamp to `[0,1]`.

---

# 25. UNKNOWN DATA

Do NOT treat unknown information as zero.

Use neutral priors:

```text
Gateway        = 0.5
Contact        = 0.5
Link history   = 0.5
Delivery       = 0.5
```

Actual measured values should replace these estimates over time.

---

# 26. AERS IMPLEMENTATION

Create:

```typescript
interface AERSFeatures {
  gateway: number;
  contact: number;
  link: number;
  battery: number;
  progress: number;
  delivery: number;
  latency: number;
  hopPenalty: number;
  congestion: number;
}

interface AERSWeights {
  gateway: number;
  contact: number;
  link: number;
  battery: number;
  progress: number;
  delivery: number;
  latency: number;
  hopPenalty: number;
  congestion: number;
}

interface AERSResult {
  score: number;

  features: AERSFeatures;

  weightedContributions: AERSFeatures;
}
```

Implement:

```typescript
calculateAERS(
  features,
  weights
)
```

The result must expose every contribution.

---

# 27. AERS EXPLAINABILITY

For every routing decision show:

```text
Selected Relay: Node-27

AERS: 0.82

Gateway Probability       +0.22
Contact Opportunity       +0.09
Link Quality              +0.13
Battery                   +0.07
Destination Progress      +0.08
Delivery History          +0.09
Latency                   +0.06
Hop Penalty               -0.02
Congestion                -0.01
--------------------------------
Final AERS                 0.71
```

Use actual calculated values.

Never hard-code demonstration scores.

---

# 28. RELAY SELECTION

Do not blindly select the highest score.

Apply:

```text
AERS >= threshold
```

AND:

```text
AERS > currentRelayScore + hysteresis
```

Defaults:

```text
threshold = 0.50
hysteresis = 0.05
```

Then choose the highest eligible score.

If no candidate satisfies the conditions:

```text
WAIT / STORE
```

Do not force forwarding.

---

# 29. TTL-AWARE ROUTING

Calculate:

```text
remainingTTL =
expiresAt - currentTime
```

If:

```text
estimatedLatency > remainingTTL
```

then:

```text
latencyScore = 0
```

Define:

\[
DeadlinePressure =
1-
\frac{RemainingTTL}
{InitialTTL}
\]

Clamp to `[0,1]`.

As deadline pressure increases, increase latency weight.

For example:

```typescript
latencyWeight =
baseLatencyWeight +
0.10 * deadlinePressure;
```

Then normalize weights.

The implementation must prevent total weights from becoming invalid.

---

# 30. EMERGENCY PRIORITY

Support:

```text
CRITICAL
HIGH
MEDIUM
LOW
```

Priority must influence:

- Queue ordering
- Forwarding priority
- Replication budget
- TTL
- Routing weight profile

CRITICAL messages should receive stronger delivery urgency.

---

# 31. CONTROLLED REPLICATION

Do NOT implement blind flooding as the default.

Use:

\[
ReplicationBudget =
f(Priority,TTL,NetworkDensity,GatewayProbability)
\]

For MVP use configurable values:

```text
CRITICAL → 4
HIGH     → 3
MEDIUM   → 2
LOW      → 1
```

The simulator must track:

```text
original copies
replicated copies
successful copies
expired copies
```

---

# 32. DUPLICATE DETECTION

Before accepting a bundle:

```text
if bundleId exists:
    reject
else:
    store
```

Duplicate rejection must generate an event.

---

# 33. GATEWAY MODEL

Gateway:

```typescript
interface GatewayState {
  nodeId: string;

  internetAvailable: boolean;

  authorityReachability: number;

  latency: number;

  reliability: number;
}
```

Gateway availability can change dynamically.

When a gateway disappears:

```text
recalculate routing
```

and search for an alternative.

---

# 34. AUTHORITY

The authority is the final destination.

When the bundle reaches the authority:

```text
bundle.state = DELIVERED
```

Record:

```text
delivery time
hop count
replication count
origin
route
```

Generate ACK.

---

# 35. ACK

Implement:

```typescript
interface BundleAck {
  bundleId: string;

  deliveredTo: string;

  deliveredAt: number;

  originalSource: string;

  hopCount: number;
}
```

ACK should be logged and optionally propagated back.

---

# 36. FAILURE INJECTION

Provide UI controls for:

```text
Node failure
Gateway failure
Link failure
Packet loss
Battery depletion
Congestion
```

Example:

```text
Gateway X FAILED
      ↓
AERS recalculated
      ↓
Gateway Y becomes preferred
      ↓
SOS rerouted
```

---

# 37. BATTERY SIMULATION

Battery must decrease based on simulated activity:

```text
Discovery
Connection
Transfer
Replication
```

Make costs configurable.

Battery reaching zero must deactivate the node.

---

# 38. NETWORK CONGESTION

Each node must have:

```text
queueSize
maximumQueueCapacity
droppedBundles
```

When capacity is reached:

- Lower priority bundles may be rejected/dropped.
- Critical bundles should receive preferential treatment.
- Event must be logged.

---

# 39. MAIN SIMULATION SCREEN

Create a professional dashboard.

Layout:

```text
┌─────────────────────────────────────────────────────────────┐
│ HEADER                                                      │
│ Scenario | Play | Pause | Step | Speed | Reset             │
├──────────────┬───────────────────────────────┬──────────────┤
│              │                               │              │
│ SIMULATION   │                               │ INSPECTOR    │
│ CONTROLS     │       NETWORK CANVAS         │              │
│              │                               │ Node /       │
│ Nodes        │        ●────●                 │ Bundle       │
│ Movement     │       /      \                │ Details      │
│ Failures     │      ●        ●               │              │
│ Protocol     │              │                │              │
│ AERS         │              ●                │              │
│              │                               │              │
├──────────────┴───────────────────────────────┴──────────────┤
│ EVENT TIMELINE / PROTOCOL LOG                               │
├─────────────────────────────────────────────────────────────┤
│ Delivery | Deadline | Latency | Hops | Replication | Battery│
└─────────────────────────────────────────────────────────────┘
```

---

# 40. NETWORK CANVAS

Render:

- Victim
- Relay
- Gateway
- Authority

Use visually distinct node representations.

Display:

- Communication range
- Active links
- Failed links
- Active transfer
- Bundle route
- Gateway status

Allow:

- Pan
- Zoom
- Node selection
- Node dragging in manual mode

---

# 41. NODE INSPECTOR

When selecting a node show:

```text
Node ID
Node Type
Battery
Position
Internet
Gateway
Active Transports
Neighbors
Bundle Store
Queue
Delivery History
Contact History
Current AERS contributions
```

---

# 42. BUNDLE INSPECTOR

Show:

```text
Bundle ID
Origin
Current Node
Priority
Emergency Type
Severity
TTL
Remaining TTL
State
Hop Count
Replication Count
Route History
```

---

# 43. ROUTING PANEL

Show current candidate ranking:

```text
Candidate      AERS      Status

Node-12        0.82      SELECTED
Node-05        0.71      ELIGIBLE
Node-19        0.43      BELOW THRESHOLD
Node-07        0.31      REJECTED
```

Clicking a candidate must show feature breakdown.

---

# 44. EVENT LOG

Display real simulation events:

```text
00:00.000
Node-17 generated CRITICAL SOS

00:00.020
Bundle B-001 persisted

00:01.200
Node-17 discovered Node-04

00:01.220
AERS calculated

00:01.240
Node-04 selected

00:02.100
Bundle transferred

00:06.800
Gateway discovered

00:08.200
Authority received B-001

00:08.210
ACK generated
```

Do not fabricate events.

---

# 45. AUTHORITY DASHBOARD

Show:

```text
ACTIVE SOS
DELIVERED SOS
EXPIRED SOS
PENDING SOS
```

Map incoming emergency locations.

For each received SOS:

```text
Emergency Type
Priority
Origin
Location
Received Time
Delivery Time
Hop Count
```

---

# 46. ANALYTICS

Calculate:

## Delivery Probability

\[
P_{delivery}
=
\frac{Delivered}
{Generated}
\]

## Deadline Delivery Probability

\[
P_{deadline}
=
\frac{DeliveredWithinDeadline}
{Generated}
\]

This is the primary metric.

Also calculate:

### Average Delivery Time

\[
T_{avg}
=
\frac{\sum DeliveryTime}
{Delivered}
\]

### Average Hop Count

\[
H_{avg}
=
\frac{\sum Hops}
{Delivered}
\]

### Replication Overhead

\[
R=
\frac{TotalCopies}
{OriginalBundles}
\]

### Battery Consumption

\[
B_{consumed}
=
InitialBattery-FinalBattery
\]

### Gateway Discovery Time

Time from:

```text
SOS creation
```

to:

```text
Gateway discovery
```

---

# 47. ROUTING STRATEGY BENCHMARK

Implement a pluggable routing strategy interface.

```typescript
interface RoutingStrategy {
  name: string;

  selectRelay(
    context: RoutingContext
  ): RoutingDecision;
}
```

Implement:

```text
1. Direct
2. Random
3. Nearest Relay
4. Flooding / Epidemic
5. AERS
```

All strategies must run against the same scenario configuration.

---

# 48. BENCHMARK TABLE

Create:

| Metric | Direct | Random | Nearest | Flooding | AERS |
|---|---:|---:|---:|---:|---:|
| Delivery Probability | — | — | — | — | — |
| Deadline Delivery | — | — | — | — | — |
| Avg Delivery Time | — | — | — | — | — |
| Avg Hop Count | — | — | — | — | — |
| Replication | — | — | — | — | — |
| Battery Consumption | — | — | — | — | — |

NEVER hard-code benchmark results.

---

# 49. MONTE CARLO EXPERIMENTS

Allow:

```text
Runs: 10 / 50 / 100 / 500
```

Use deterministic random seeds.

For every run:

1. Reset scenario.
2. Generate network.
3. Generate emergency traffic.
4. Execute simulation.
5. Record metrics.
6. Reset.
7. Repeat.

Calculate:

```text
Mean
Minimum
Maximum
Standard deviation
```

Optionally calculate confidence intervals.

---

# 50. SCENARIO SYSTEM

Create predefined scenarios.

## Scenario 1 — Basic Relay

```text
Victim → Relay → Gateway → Authority
```

## Scenario 2 — Multi-Hop

```text
Victim → Relay A → Relay B → Relay C → Gateway → Authority
```

## Scenario 3 — Gateway Failure

Primary gateway fails during delivery.

## Scenario 4 — Network Partition

Network separates into disconnected clusters and later reconnects.

## Scenario 5 — Congestion

Many SOS messages generated simultaneously.

## Scenario 6 — Low Battery

Potential relays progressively lose battery.

## Scenario 7 — Dense Network

Many potential relays exist and AERS must select intelligently.

## Scenario 8 — Sparse Network

Very few nodes and long contact gaps.

---

# 51. SCENARIO CONFIGURATION

Implement:

```typescript
interface SimulationScenario {
  id: string;

  name: string;

  description: string;

  nodes: SimulatedNode[];

  configuration: SimulationConfig;

  seed: number;
}
```

Allow scenario replay.

---

# 52. SIMULATION CONFIGURATION

Implement:

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

All important values should be editable.

---

# 53. SECURITY SIMULATION

Model:

```text
Invalid Signature
Duplicate Bundle
Replay Attempt
Malicious Relay
Rate Limit Violation
Storage Quota Violation
```

Example:

```text
Invalid signature
      ↓
Bundle rejected
      ↓
Security event logged
```

Do not implement custom cryptography.

This is a routing simulation, not a cryptographic research platform.

---

# 54. VISUAL DESIGN

The UI should look like a modern emergency network operations dashboard.

Design language:

- Dark professional interface
- Glassmorphism used selectively
- High contrast
- Clear status indicators
- Technical dashboard aesthetic
- Minimal unnecessary decoration
- Smooth but meaningful animations
- Strong typography hierarchy

Avoid:

- Excessive gradients
- Gaming-style UI
- Decorative animations
- Fake 3D effects
- Excessive rounded cards

The network visualization must remain the visual focus.

---

# 55. COLOR SEMANTICS

Use semantic colors consistently:

```text
Victim      → emergency/high attention
Relay       → neutral
Gateway     → network-connected
Authority   → destination
Failed      → error
Delivered   → success
Critical    → highest priority
```

Do not use color as the only way to communicate status; include icons/text where appropriate.

---

# 56. PERFORMANCE

Target:

```text
100 nodes → smooth
250 nodes → acceptable
500 nodes → experimental
```

Do not create hundreds of React DOM elements for continuously moving nodes.

Prefer:

```text
Canvas
```

or:

```text
WebGL
```

for the network.

Keep simulation state separate from rendering state.

---

# 57. TESTING

Write unit tests for:

### AERS

- Normal calculation
- Clamping
- Weight normalization
- Unknown data
- Deadline pressure

### DTN

- Bundle persistence
- Forwarding
- TTL expiration
- Duplicate suppression

### Routing

- Threshold
- Hysteresis
- Best relay
- No eligible relay

### Gateway

- Gateway failure
- Alternative gateway selection

### Replication

- Budget enforcement
- Priority behavior

### Analytics

- Delivery probability
- Deadline probability
- Average latency
- Hop count
- Replication overhead

---

# 58. AERS UNIT TEST EXAMPLE

Create a deterministic test:

```typescript
const features = {
  gateway: 1,
  contact: 0.8,
  link: 0.9,
  battery: 0.8,
  progress: 0.9,
  delivery: 0.9,
  latency: 0.8,
  hopPenalty: 0.1,
  congestion: 0.1
};
```

Verify:

```text
score is between 0 and 1
```

and verify every weighted contribution is exposed.

Do not test only the final number.

---

# 59. CRITICAL VALIDATION

The simulator must demonstrate:

### Test A

Two relays:

```text
Relay A = geographically closer
Relay B = better gateway probability
```

Expected:

```text
AERS selects Relay B
```

if B has higher overall score.

### Test B

Gateway fails.

Expected:

```text
AERS recalculates
Alternative relay selected
```

### Test C

No eligible relay.

Expected:

```text
Bundle remains stored
```

### Test D

TTL expires.

Expected:

```text
Bundle → EXPIRED
```

and it must not be forwarded afterward.

### Test E

Duplicate arrives.

Expected:

```text
Bundle rejected
```

### Test F

CRITICAL SOS and LOW message compete.

Expected:

```text
CRITICAL forwarded first
```

according to configured policy.

### Test G

Compare Flooding vs AERS.

Expected conceptually:

```text
Flooding → higher replication overhead
AERS     → selective forwarding
```

Do NOT assume AERS always has better delivery performance.

The simulator must determine the result experimentally.

---

# 60. IMPORTANT SCIENTIFIC REQUIREMENT

Do not design the simulator to make AERS look good.

The simulator must be capable of producing cases where:

```text
AERS performs poorly
```

as well as cases where:

```text
AERS performs better
```

This is essential for credible SIH validation.

The benchmark must use identical:

- Network topology
- Node mobility
- Packet loss
- Failure conditions
- Emergency traffic
- Random seed

for every routing strategy.

---

# 61. DATA EXPORT

Implement:

```text
Export Scenario → JSON
Export Metrics → CSV
Export Event Log → JSON/CSV
```

The exported data should allow external analysis.

---

# 62. REAL-TIME SIMULATION VIEW

The simulation should visually show:

```text
SOS created
   ↓
Bundle stored
   ↓
Neighbors discovered
   ↓
AERS calculated
   ↓
Relay selected
   ↓
Transfer
   ↓
Bundle carried
   ↓
Gateway discovered
   ↓
Authority receives
   ↓
ACK
```

Use animation to explain actual events.

---

# 63. DIGITAL DISASTER ENVIRONMENT

Add optional environment zones:

```text
Normal Zone
High Risk Zone
No Connectivity Zone
Damaged Infrastructure Zone
```

Zones can influence:

- Connectivity
- Node movement
- Packet loss
- Gateway availability

Do not overcomplicate the first MVP.

---

# 64. MVP PRIORITY

Implement in this exact order.

## Phase 1

```text
React setup
Canvas
Nodes
Movement
Connectivity
Simulation clock
```

## Phase 2

```text
Bundle
DTN storage
TTL
Forwarding
Authority
ACK
```

## Phase 3

```text
AERS
Relay selection
Explainability
Gateway
```

## Phase 4

```text
Replication
Battery
Congestion
Packet loss
Node failure
Gateway failure
```

## Phase 5

```text
Analytics
Benchmarking
Routing strategies
Monte Carlo
```

## Phase 6

```text
Scenarios
Authority dashboard
Export
Professional UI
```

Do not attempt to implement everything simultaneously.

---

# 65. CODE QUALITY

Requirements:

- Strict TypeScript
- Avoid `any`
- Avoid giant components
- Avoid business logic inside JSX
- Use pure functions for scoring
- Use dependency injection where useful
- Use interfaces for transport/routing abstractions
- Keep simulation deterministic
- Add comments only where reasoning is non-obvious
- Keep modules independently testable

---

# 66. NO FAKE DATA IN CORE SIMULATION

You may provide default scenario configuration.

But do not fake:

- AERS scores
- Delivery time
- Route
- Gateway availability
- Battery
- Network state
- Analytics

All values displayed during simulation must originate from the simulation engine.

---

# 67. FINAL DEMONSTRATION FLOW

The finished application must be able to demonstrate:

```text
1. Load Disaster Scenario
        ↓
2. Network appears
        ↓
3. Victim generates CRITICAL SOS
        ↓
4. Bundle persisted
        ↓
5. Nearby relays discovered
        ↓
6. AERS scores displayed
        ↓
7. Best relay selected
        ↓
8. Bundle forwarded
        ↓
9. Network topology changes
        ↓
10. Gateway becomes unavailable
        ↓
11. AERS recalculates
        ↓
12. Alternative path selected
        ↓
13. Gateway discovered
        ↓
14. Authority receives SOS
        ↓
15. ACK generated
        ↓
16. Analytics updated
```

---

# 68. SUCCESS CRITERIA

The implementation is successful when:

- The simulation is genuinely event-driven.
- SOS bundles persist when connectivity is unavailable.
- Bundles can traverse multiple nodes.
- AERS produces deterministic, explainable scores.
- Relay selection is based on AERS.
- TTL affects routing.
- Priority affects forwarding.
- Gateway failure triggers rerouting.
- Duplicate bundles are suppressed.
- Node failures affect actual routing.
- Battery affects relay suitability.
- Congestion affects relay suitability.
- Controlled replication works.
- Analytics are calculated from actual simulation data.
- AERS can be objectively compared against alternative routing strategies.
- The same scenario can be replayed using the same random seed.
- The protocol engine is independent of React UI.

---

# 69. FIRST DEVELOPMENT TASK

Before writing the entire application:

1. Create the project structure.
2. Implement the simulation engine.
3. Implement node and connectivity models.
4. Implement the bundle/DTN engine.
5. Implement the AERS engine.
6. Write unit tests.
7. Build the basic Canvas visualization.
8. Connect visualization to real simulation state.
9. Implement the first end-to-end scenario:

```text
Victim → Relay → Gateway → Authority
```

10. Only after this works, proceed to failures, replication, analytics, and advanced UI.

---

# 70. FINAL ENGINEERING PRINCIPLE

The central architectural goal is:

```text
                 SAME PROTOCOL LOGIC
                         │
              ┌──────────┴──────────┐
              │                     │
       WEB SIMULATION         REAL MOBILE APP
              │                     │
      Virtual Transport       BLE/Wi-Fi Transport
```

The simulator must therefore be treated as a **digital test environment for the actual emergency routing protocol**, not merely as a presentation animation.

The ultimate validation target is:

\[
\boxed{
P(T_{delivery}\leq D)
}
\]

and the simulator must determine whether the AERS-based emergency routing policy improves this metric while controlling:

```text
Latency
Hop Count
Replication Overhead
Battery Consumption
Network Congestion
```

Build incrementally, test each subsystem, and keep the architecture extensible for eventual integration with the React Native smartphone implementation.