# Dashboard 1 — Unified Intelligence (`unified`)

Page title: "Simulation for Unified Operational Intelligence".
Subtitle: "Real-time incident awareness, risk indicators, and AI recommendations across Dubai."

## Layout

- Header with the title and a row of **5 KPI tiles**.
- Left: a 3D **Mapbox operational map** of Dubai (centred roughly on 25.106 N, 55.256 E,
  zoom 9.8, pitch 40°). A badge in the top-left says "Operational Map — Click a pulsing alert
  to view details". Pulsing dots mark incidents (red) and the patrol operation (green).
  Clicking a dot flies the map to it and shows a **Re-center** button (top-right) that
  returns to the city-wide view and clears the panel. Clicking empty map resets the panel.
- Right: an **Incident Details** side panel. Before a selection it reads "Awaiting
  selection" / "No area selected" and asks the user to click an area on the map. After a
  selection it shows "Selected Area" + the incident name, a tag (red when it says "Risk
  Priority ..." or "Understaffed"), and three cards: **Context**, **Real-Time Risk
  Indicators** (or **Operational Indicators** for the patrol op), and **AI-Generated
  Recommendations** with "Take Action" / "Dismiss" buttons. The Context card has an
  "Open in Google Maps ↗" link.

## KPI tiles (city-wide)

| KPI | Value | Bar |
|---|---|---|
| Active Incidents | **3 open** | red, 65% |
| Avg. Response Time (SLA = 5 mins) | **2.5 min** | green, 50% |
| High-risk Zones | **3 zones** | red, 58% |
| SLA Compliance % | **87%** | green |
| Workforce Utilization % | **55%** | yellow |

(There are 3 incident markers plus 1 patrol-operation marker on the map, which matches the
"3 open" active incidents.)

## Map markers / scenarios (4)

Gauge colour rule for the risk indicators: ≤40% green, 41–70% orange, >70% red.

### 1. Incident #67582749 — tag "Risk Priority #2" (red pulsing dot)
- Location: **Al Qusais – Baghdad Street** (map point 25.266363 N, 55.405683 E)
- Time: 24 Feb 2026 – 14:32
- Medical Severity: **Medium, 0 Casualties**
- Status: **Wave 1 en route with ETA 7 mins**
- Real-Time Risk Indicators: Incident Escalation Risk **20%** (green); SLA Breach Risk
  **50%** (orange); Secondary Collision Risk **30%** (green)
- AI-Generated Recommendations:
  1. **Trigger SLA breach early-warning protocol** — improves inter-team coordination and
     reduces operational friction
  2. **Notify traffic police for lane management** — reduces congestion delay
- Google Maps link: https://maps.app.goo.gl/Sk9zbK39JC5m2G4K8
- This is the same incident reviewed on the Accident Review dashboard.

### 2. Incident #19285538 — tag "Risk Priority #1" (red pulsing dot)
- Location: **Jebel Ali – Expo Road** (24.988980 N, 55.088665 E)
- Time: 24 Feb 2026 – 18:07
- Medical Severity: **CRITICAL**
- Status: **Wave 2 en route with ETA 10 mins, Ambulance and Police on scene**
- Risk Indicators: Incident Escalation Risk **91%** (red); SLA Breach Risk **77%** (red);
  Secondary Collision Risk **83%** (red)
- AI-Generated Recommendations:
  1. **Reallocate nearest patrol unit to secure accident perimeter**
  2. **Pre-alert trauma center - shortens critical intervention window**
- Google Maps link: https://maps.app.goo.gl/HgbfoRzCpSpcvgbR7
- This is the highest-priority incident on the board.

### 3. Incident #37582759 — tag "21060 - Chemical Leakage/Contamination" (red pulsing dot)
- Location: **Jebel Ali – Expo Road** (25.03 N, 55.11 E — a second marker a little north-east
  of #19285538)
- Time: 24 Feb 2026 – 18:07
- Medical Severity: **CRITICAL**
- Status: **Ambulance and Police with ETA 10 mins**
- Risk Indicators: Incident Escalation Risk **91%**; SLA Breach Risk **77%**; Secondary
  Collision Risk **83%** (all red — identical to #19285538)
- AI-Generated Recommendations: the same two as #19285538 (reallocate nearest patrol unit to
  secure the perimeter; pre-alert trauma center)
- Google Maps link: https://maps.app.goo.gl/HgbfoRzCpSpcvgbR7
- "21060" is the incident-type code shown for chemical leakage / contamination.

### 4. Patrolling Op #27624 — tag "Understaffed" (GREEN pulsing dot)
- Location: **Rashidiya Police Station Cluster** (25.227152 N, 55.385820 E)
- Time: Evening Peak – 19:10
- Medical Severity: "-" (not applicable — this is a patrol operation, not an accident)
- Status: **Understaffed - SLA breach risk rising**
- When selected, a red banner appears on the map above the dot: **"Additional +3 Patrols
  Required"**.
- Operational Indicators card:
  - Area Risk Score: **85%** (red bar)
  - Additional Patrol Cars Needed: **+3**
  - ETA to High-Risk Streets: **12 min 🔴** — above the **SLA threshold of 5 mins**
- AI-Generated Recommendations:
  1. **Deploy 4 additional patrol units to Rashidiya cluster** — reduces SLA breach risk by 18%
  2. **Increase staffing during evening peak hours** — prevents expected queue overflow
- Google Maps link: https://maps.app.goo.gl/vm5KbJoQ6t3kVf9NA

## Quick facts

- Highest risk priority: #19285538 (Risk Priority #1, Jebel Ali – Expo Road, CRITICAL).
- Lowest-risk open incident: #67582749 (Al Qusais, escalation risk 20%).
- Only one incident has an SLA breach risk below the red band: #67582749 at 50% (orange).
- The Rashidiya patrol op is the only green marker and the only "Understaffed" item.
- All three accident incidents are dated 24 Feb 2026; two of them are at 18:07 on Expo Road.
