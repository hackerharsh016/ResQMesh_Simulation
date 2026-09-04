# Adaptive Emergency Relay Score (AERS)

## 1. Objective

AERS ranks candidate relay nodes according to their estimated usefulness for delivering an emergency bundle to an authority within its remaining lifetime.

The router should answer:

> **Which available neighbor currently provides the best delivery opportunity for this SOS?**

AERS does **not guarantee delivery**.

---

# 2. Core Formula

For candidate relay node \(i\):

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

All feature values are normalized to:

\[
0 \leq X_i \leq 1
\]

The score is then clamped:

\[
AERS_i = clamp(AERS_i,0,1)
\]

---

# 3. Default Weights

For the initial implementation:

| Feature | Symbol | Weight |
|---|---:|---:|
| Gateway Probability | G | 0.25 |
| Contact Opportunity | C | 0.15 |
| Link Quality | L | 0.15 |
| Battery | B | 0.10 |
| Destination Progress | P | 0.10 |
| Delivery History | D | 0.10 |
| Latency | T | 0.10 |
| Hop Penalty | H | 0.025 |
| Congestion Penalty | Q | 0.025 |

Total:

\[
0.25+0.15+0.15+0.10+0.10+0.10+0.10+0.025+0.025=1
\]

Therefore:

\[
0 \leq AERS_i \leq 1
\]

---

# 4. Feature Computation

## 4.1 Gateway Probability — G

Gateway probability estimates how likely the candidate node is to eventually provide a path to an authority.

### Direct gateway

If:

```text
Candidate is Gateway
AND
Internet is available
```

then:

\[
G=1.0
\]

If it is a gateway but Internet is currently unavailable:

\[
G=0.5
\]

The value can recover when connectivity returns.

---

## 4.1.1 Historical Gateway Success

For non-gateway nodes, estimate gateway usefulness from observed successful gateway contacts.

Maintain:

```typescript
interface GatewayHistory {
  successfulGatewayContacts: number;
  totalGatewayContacts: number;
}
```

Calculate:

\[
G_{history} =
\frac{successfulGatewayContacts+\alpha}
{totalGatewayContacts+\alpha+\beta}
\]

Use Laplace/Beta smoothing.

Initial values:

```text
α = 1
β = 1
```

If no history exists:

\[
G_{history}=0.5
\]

This prevents unknown nodes from automatically receiving a score of zero.

---

# 5. Contact Opportunity — C

Contact opportunity estimates whether the current node is likely to encounter the candidate again.

The simplest MVP implementation should use historical contact frequency.

Maintain:

```typescript
interface ContactHistory {
  encounterCount: number;
  recentEncounters: number;
  averageContactInterval: number;
  lastSeen: number;
}
```

Define:

\[
C_{frequency} =
min\left(
\frac{encounterCount}{N_{target}},
1
\right)
\]

For example:

```text
N_target = 10
```

10 or more observed encounters gives:

\[
C_{frequency}=1
\]

---

## 5.1 Recency

Let:

\[
\Delta t = currentTime-lastSeen
\]

Use exponential decay:

\[
C_{recency}=e^{-\Delta t/\tau}
\]

where \(\tau\) is a configurable decay constant.

For example:

```text
τ = 60 seconds
```

Then:

\[
C = 0.6C_{frequency}+0.4C_{recency}
\]

Finally:

\[
C=clamp(C,0,1)
\]

---

# 6. Link Quality — L

Link quality should be based on the currently available transport.

The simulator should model:

- Signal strength
- Packet loss
- Connection reliability
- Transport type

For MVP:

\[
L =
0.5(1-P_{loss})+
0.5R_{link}
\]

Where:

- \(P_{loss}\) = packet loss probability
- \(R_{link}\) = historical transfer success rate

Example:

```text
Packet loss = 10%
Link success history = 90%

L = 0.5(0.90) + 0.5(0.90)
L = 0.90
```

---

# 7. Battery Score — B

Battery should discourage selecting nodes that are close to exhaustion.

Let:

\[
B = \frac{batteryPercentage}{100}
\]

However, a linear score is not ideal because a node with 10% battery should be penalized more heavily.

Use:

\[
B =
\begin{cases}
0.1 & battery < 10\\
0.3 & 10 \le battery < 20\\
battery/100 & battery \ge 20
\end{cases}
\]

Example:

```text
Battery = 75%
B = 0.75

Battery = 15%
B = 0.30

Battery = 5%
B = 0.10
```

---

# 8. Destination Progress — P

Destination progress estimates whether forwarding to candidate \(i\) moves the bundle closer to an authority/gateway.

For the initial simulator, use gateway distance.

Let:

- \(d_{current}\) = current node's distance to nearest reachable gateway
- \(d_i\) = candidate's distance to nearest reachable gateway

Then:

\[
P =
clamp
\left(
\frac{d_{current}-d_i}
{d_{current}+\epsilon},
0,
1
\right)
\]

where:

\[
\epsilon=0.001
\]

Example:

```text
Current node → gateway = 1000 m
Candidate     → gateway = 400 m

P = (1000 - 400) / 1000
P = 0.60
```

If the candidate is farther from the gateway:

\[
P=0
\]

---

# 9. Delivery History — D

Delivery history represents how reliably this node has forwarded bundles in previous encounters.

Maintain:

```typescript
interface DeliveryHistory {
  successfulTransfers: number;
  failedTransfers: number;
}
```

Calculate:

\[
D=
\frac{SuccessfulTransfers+\alpha}
{SuccessfulTransfers+FailedTransfers+\alpha+\beta}
\]

Use:

\[
\alpha=1,\quad\beta=1
\]

Therefore, a node with no history gets:

\[
D=0.5
\]

Example:

```text
Successful = 8
Failed = 2

D = (8 + 1) / (8 + 2 + 2)
D = 0.75
```

---

# 10. Latency Score — T

Estimate the time required to transfer a bundle through the candidate.

Let:

\[
L_{estimated}
=
DiscoveryTime+
ConnectionTime+
TransferTime+
ExpectedWaitingTime
\]

Then:

\[
T =
1-
\frac{L_{estimated}}
{L_{max}}
\]

Clamp:

\[
T=clamp(T,0,1)
\]

Example:

```text
Estimated latency = 3 seconds
Maximum acceptable latency = 10 seconds

T = 1 - 3/10
T = 0.70
```

If:

\[
L_{estimated}\ge L_{max}
\]

then:

\[
T=0
\]

---

# 11. Hop Penalty — H

Every additional hop introduces:

- Transfer overhead
- Failure opportunities
- Battery consumption
- Delay

Use:

\[
H=
min
\left(
\frac{currentHopCount+1}{H_{max}},
1
\right)
\]

Example:

```text
Current hop count = 2
Maximum preferred hops = 10

H = 3/10
H = 0.30
```

The penalty contribution is:

\[
w_HH
\]

---

# 12. Congestion Penalty — Q

Each node maintains a bundle queue.

Let:

\[
Q=
\frac{currentQueueSize}
{maximumQueueCapacity}
\]

Example:

```text
Queue = 20
Capacity = 100

Q = 0.20
```

A congested node therefore receives a lower score.

---

# 13. Emergency Priority

Emergency priority should influence routing behavior.

Instead of modifying the feature values, modify the weights.

### Critical

```typescript
{
  gateway: 0.30,
  contact: 0.15,
  link: 0.15,
  battery: 0.05,
  progress: 0.10,
  delivery: 0.10,
  latency: 0.10,
  hop: 0.025,
  congestion: 0.025
}
```

### High

```typescript
{
  gateway: 0.27,
  contact: 0.15,
  link: 0.15,
  battery: 0.08,
  progress: 0.10,
  delivery: 0.10,
  latency: 0.10,
  hop: 0.025,
  congestion: 0.025
}
```

### Medium / Low

Use the default profile.

These values should remain configurable rather than hard-coded into the protocol.

---

# 14. TypeScript Implementation

```typescript
export interface AERSFeatures {
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

export interface AERSWeights {
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

export interface AERSResult {
  score: number;
  features: AERSFeatures;
  weightedContributions: AERSFeatures;
}
```

---

# 15. Clamp Utility

```typescript
export function clamp(
  value: number,
  min = 0,
  max = 1
): number {
  return Math.max(min, Math.min(max, value));
}
```

---

# 16. AERS Function

```typescript
export function calculateAERS(
  features: AERSFeatures,
  weights: AERSWeights
): AERSResult {

  const contributions = {
    gateway:
      features.gateway * weights.gateway,

    contact:
      features.contact * weights.contact,

    link:
      features.link * weights.link,

    battery:
      features.battery * weights.battery,

    progress:
      features.progress * weights.progress,

    delivery:
      features.delivery * weights.delivery,

    latency:
      features.latency * weights.latency,

    hopPenalty:
      features.hopPenalty * weights.hopPenalty,

    congestion:
      features.congestion * weights.congestion,
  };

  const rawScore =
    contributions.gateway +
    contributions.contact +
    contributions.link +
    contributions.battery +
    contributions.progress +
    contributions.delivery +
    contributions.latency -
    contributions.hopPenalty -
    contributions.congestion;

  return {
    score: clamp(rawScore),
    features,
    weightedContributions: contributions,
  };
}
```

---

# 17. Candidate Selection

AERS should not simply select the highest score.

Use two conditions.

### Condition 1 — Minimum threshold

\[
AERS_i \geq Threshold
\]

### Condition 2 — Hysteresis

\[
AERS_i >
AERS_{current}+\Delta
\]

Where:

```text
Threshold = 0.50
Δ = 0.05
```

This prevents unnecessary bundle movement between nodes with nearly identical scores.

---

# 18. Candidate Selection Algorithm

```typescript
export function selectRelay(
  candidates: CandidateScore[],
  currentScore: number,
  threshold: number,
  hysteresis: number
): CandidateScore | null {

  const eligible = candidates
    .filter(candidate =>
      candidate.score >= threshold
    )
    .filter(candidate =>
      candidate.score >
      currentScore + hysteresis
    )
    .sort(
      (a, b) => b.score - a.score
    );

  return eligible[0] ?? null;
}
```

---

# 19. Example

Suppose the victim sees three relay candidates:

| Feature | Node A | Node B | Node C |
|---|---:|---:|---:|
| Gateway | 0.20 | 0.80 | 0.40 |
| Contact | 0.90 | 0.60 | 0.70 |
| Link | 0.95 | 0.85 | 0.70 |
| Battery | 0.90 | 0.70 | 0.95 |
| Progress | 0.30 | 0.75 | 0.50 |
| Delivery | 0.80 | 0.90 | 0.60 |
| Latency | 0.90 | 0.75 | 0.80 |
| Hop Penalty | 0.10 | 0.10 | 0.20 |
| Congestion | 0.70 | 0.20 | 0.40 |

With the default weights:

```text
Node A → lower score because of low gateway probability
Node B → high score because of gateway + progress + reliability
Node C → moderate score
```

The router selects:

```text
Node B
```

even though Node A may have the better immediate link.

This demonstrates the central principle:

> **The best relay is not necessarily the nearest or strongest-connected node; it is the node with the highest estimated delivery utility.**

---

# 20. Unknown Data Handling

A real network will not know every feature.

Do not use:

```text
undefined → 0
```

because that unfairly penalizes newly discovered nodes.

Instead use a neutral prior:

| Feature | Unknown Value |
|---|---:|
| Gateway | 0.50 |
| Contact | 0.50 |
| Link | 0.50 |
| Delivery History | 0.50 |
| Battery | Actual reported value |
| Progress | Calculated |
| Latency | Estimated |
| Congestion | Observed |

As the node collects information, the estimate should replace the prior.

---

# 21. Time-Based Feature Updates

AERS should be recalculated when meaningful network changes occur.

Recalculate when:

```text
NEW_NEIGHBOR
NODE_LEFT
GATEWAY_APPEARED
GATEWAY_DISAPPEARED
BATTERY_CHANGED
QUEUE_CHANGED
TRANSFER_FAILED
TRANSFER_SUCCEEDED
CONTACT_HISTORY_UPDATED
TTL_CHANGED
```

Do not recalculate every animation frame.

The UI may render at 60 FPS, but routing decisions should be event-driven.

---

# 22. TTL-Aware Routing

A critical improvement is to make the routing decision aware of the remaining bundle lifetime.

Let:

\[
R = expiresAt-currentTime
\]

If:

\[
EstimatedLatency > R
\]

then:

\[
T=0
\]

For emergency-critical bundles, the router should also increase the importance of latency as the deadline approaches.

Example:

```text
Remaining TTL > 60 sec
→ normal latency weight

Remaining TTL < 30 sec
→ high latency weight

Remaining TTL < 10 sec
→ very high latency weight
```

This makes AERS genuinely **emergency-aware**, rather than simply being a generic node score.

---

# 23. Deadline Pressure

Define:

\[
DeadlinePressure =
1-
\frac{RemainingTTL}
{InitialTTL}
\]

Clamp to `[0,1]`.

Example:

```text
Initial TTL = 100 sec
Remaining TTL = 20 sec

DeadlinePressure = 0.80
```

The routing engine can dynamically modify weights:

\[
w_T' = w_T + k \cdot DeadlinePressure
\]

Weights should then be renormalized.

---

# 24. Dynamic Weight Generation

```typescript
function getEmergencyWeights(
  priority: Priority,
  deadlinePressure: number
): AERSWeights {

  const weights = getBaseWeights(priority);

  weights.latency +=
    0.10 * deadlinePressure;

  return normalizeWeights(weights);
}
```

This means the protocol becomes increasingly latency-sensitive as the SOS approaches expiration.

---

# 25. Routing Decision Explainability

Every AERS decision must be explainable.

Example:

```text
Selected Relay: Node-27

AERS: 0.82

Why?
✓ Gateway probability: High
✓ Delivery history: Excellent
✓ Contact opportunity: Good
✓ Link quality: Good
✓ Low congestion
✓ Acceptable latency

Rejected Node-12:
✗ High congestion
✗ Low gateway probability
```

This is valuable both for debugging and for the SIH demonstration.

---

# 26. AERS Data Pipeline

```text
                    Candidate Node
                          │
        ┌─────────────────┼──────────────────┐
        ▼                 ▼                  ▼
 Gateway History    Contact History     Link Metrics
        │                 │                  │
        └─────────────────┼──────────────────┘
                          ▼
                  Feature Normalization
                          │
                          ▼
                    AERS Calculator
                          │
                          ▼
                   Score Candidates
                          │
                          ▼
                Threshold + Hysteresis
                          │
                          ▼
                  Relay Selection
                          │
                          ▼
                     Forward SOS
```

---

# 27. Recommended Initial MVP

Do not implement every sophisticated estimation technique immediately.

### Version 1

Implement only:

```text
G = Gateway availability/history
C = Contact frequency + recency
L = Link reliability
B = Battery
P = Gateway distance progress
D = Delivery success history
T = Estimated latency
H = Hop count
Q = Queue utilization
```

All values should be `[0,1]`.

Then implement:

```text
AERS
 ↓
Threshold
 ↓
Hysteresis
 ↓
Best Relay
```

---

# 28. Later Enhancements

Once the basic simulator works, you can replace simple estimates with more advanced models.

Potential future improvements:

- Exponential contact prediction
- Time-dependent contact probability
- Mobility prediction
- Gateway encounter prediction
- EWMA delivery reliability
- Historical latency prediction
- Link-quality prediction
- Multi-path delivery probability
- Learned routing weights
- Reinforcement-learning-based routing

These should be **extensions**, not prerequisites for the first working implementation.

---

# 29. Validation Requirements

The simulator must verify that AERS behaves logically.

### Test 1

Increase gateway probability.

Expected:

```text
AERS ↑
```

### Test 2

Increase congestion.

Expected:

```text
AERS ↓
```

### Test 3

Increase battery.

Expected:

```text
AERS ↑
```

### Test 4

Improve delivery history.

Expected:

```text
AERS ↑
```

### Test 5

Increase estimated latency.

Expected:

```text
AERS ↓
```

### Test 6

Gateway disappears.

Expected:

```text
G ↓
AERS ↓
```

and another suitable relay may be selected.

### Test 7

Critical SOS approaches TTL expiration.

Expected:

```text
Latency weight ↑
```

and the router becomes more deadline-sensitive.

---

# 30. Important Implementation Rule

AERS should be treated as a **routing utility score**, not as an actual probability.

Do not write:

```text
AERS = 0.82
→ 82% probability of delivery
```

That is incorrect.

Instead:

```text
AERS = 0.82
→ candidate has higher routing utility than
  candidates with lower AERS
```

Actual delivery probability must be measured experimentally:

\[
P_{delivery} =
\frac{successful\ deliveries}
{total\ generated\ bundles}
\]

and:

\[
P_{deadline} =
\frac{deliveries\ within\ deadline}
{total\ generated\ bundles}
\]

The simulator should ultimately determine whether higher AERS decisions actually correlate with improved emergency delivery performance.

---

# 31. Final Implementable Definition

**AERS is a normalized, weighted, deadline-aware routing utility function that ranks currently reachable relay candidates using gateway reachability, contact opportunity, link reliability, battery, destination progress, delivery history, estimated latency, hop overhead, and congestion.**

Its implementation pipeline is:

```text
Raw Node Data
      ↓
Feature Estimation
      ↓
Normalize to [0,1]
      ↓
Priority + TTL Weight Adjustment
      ↓
Weighted AERS Calculation
      ↓
Threshold Filtering
      ↓
Hysteresis Filtering
      ↓
Highest-Score Relay
      ↓
Forward / Replicate / Wait
```

The simulator should therefore be able to show **not only which node was selected, but exactly why it was selected and whether that decision actually improved deadline-aware SOS delivery.**