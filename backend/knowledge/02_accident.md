# Dashboard 2 — Accident Review (`accident`)

Page title: "Post-Incident Response Review - #67582749" (browser title "Incident Command
Review"). This is an after-action review of a single, now-closed incident.

## KPI row (6 tiles)

| KPI | Value |
|---|---|
| Initial Call Time | **27th Feb, 2025 10:30AM** |
| Location | **Al Qusais, Baghdad Street** |
| Incident Status | **Case Under Review** |
| Medical Severity | **Medium** (amber) |
| Workforce Deployed | **Wave 1 - 1 Police Officer, 2 Paramedics** (amber) |
| Response Time | **8.5 minutes** (red — breaches the 5-minute SLA) |

## Left column

### Linked VMS Camera : #C001
A still image from video-management-system camera #C001 showing the accident scene (a
single-vehicle collision). The assistant cannot see the image content beyond this caption.

### Response Timeline Breakdown (Minutes)
A horizontal Gantt-style bar chart (x-axis 0–9 minutes) of the six response steps, in order.
Durations and cumulative times:

| Step | Duration | Window | Colour |
|---|---|---|---|
| Call Received | 0.3 min | 0.0 → 0.3 | green |
| Incident Verified | 0.7 min | 0.3 → 1.0 | green |
| Resource Assessment | 1.0 min | 1.0 → 2.0 | green |
| Units Dispatched | 1.0 min | 2.0 → 3.0 | **amber** (minor delay) |
| Units En Route | **5.0 min** | 3.0 → 8.0 | **red** (critical delay) |
| Units On Scene | 0.5 min | 8.0 → 8.5 | green |

Total: **8.5 minutes** from call to units on scene. The travel leg ("Units En Route",
5 minutes) is the single biggest contributor — on its own it equals the whole 5-minute SLA.
Everything before dispatch took 3.0 minutes.

## Right column

### AI Generated Accident Summary
- Distress call received at 27th Feb, 2025 10:30AM from Al Qusais reporting a
  **single-vehicle collision**.
- Wave 1 response dispatched immediately, including **1 ambulance and 1 patrol unit**.
- Total time to units on scene: **8.5 minutes**.
- Medical assessment confirmed **medium severity**.
- Injured passengers stabilized and transferred to nearby standby hospital.
- Incident formally closed following scene clearance.

(The KPI tile lists the people — 1 police officer and 2 paramedics; the summary lists the
vehicles — 1 patrol unit and 1 ambulance. They are consistent: the two paramedics crewed the
ambulance.)

### Note for Investigation - Case #123 Opened

| Field | Content |
|---|---|
| Issue | **SLA Response Time Breach (170%)** — 8.5 min is 170% of the 5-min SLA |
| Primary Contributing Factor | Severe congestion during peak-hour traffic in the Al Qusais area |
| Additional Factors to Investigate | Dispatch latency, resource availability, inter-team coordination |
| Recommendation | Conduct further investigation to identify all contributors to the delay |

### Responder Activity & Performance

| Staff | Start | End | Active (mins) | Travel (mins) | On-Scene (mins) |
|---|---|---|---|---|---|
| Patrol Officer 1 | 10:30 | 11:00 | 30 | **12** (red — critical delay) | 18 (green) |
| Paramedic 1 | 10:31 | 11:05 | 34 | **8.5** (amber — minor delay) | 25.5 (green) |
| Paramedic 2 | 10:31 | 11:08 | 37 | **8.5** (amber — minor delay) | 28.5 (green) |

Legend: green = On Track, amber = Minor Delay, red = Critical Delay.

Observations the table supports:
- The patrol officer's travel time (12 min) was the worst and is marked a critical delay; the
  paramedics (the ambulance crew) arrived in 8.5 min — that ambulance arrival is the 8.5-minute
  "response time" on the KPI tile.
- Paramedic 2 was the longest-active responder (37 min, until 11:08).
- All on-scene durations are green (on track); the delays are entirely in travel.

## Relationship to other dashboards

- The same incident (#67582749, Al Qusais – Baghdad Street) is shown as an open incident on
  Unified Intelligence (Risk Priority #2, Wave 1 en route ETA 7 mins) with a different date
  (24 Feb 2026 – 14:32). The Unified recommendation "Trigger SLA breach early-warning
  protocol" is the pre-emptive counterpart of the breach reviewed here.
- The Al Qusais congestion named as the primary factor is also why Predictive Intelligence
  flags Al Qusais as the next-hour critical area.
