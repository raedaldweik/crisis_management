# Crisis Management suite — overview

The application is a suite of four emergency-response dashboards for Dubai, built for
incident command and patrol/workforce optimisation. Every figure on the dashboards is
**simulated demo data** (the pages themselves say "Simulation" / "simulated"); there is no
live feed behind them. Treat the numbers as the authoritative "current state" of the demo
and quote them exactly as shown.

## The four dashboards (navigation order, left to right)

| # | Dashboard id | Nav label | Page title | What it is for |
|---|---|---|---|---|
| 1 | `unified` | Unified Intelligence | Simulation for Unified Operational Intelligence | Live operational picture: map of active incidents and patrol ops across Dubai, city KPIs, per-incident risk gauges and AI recommendations |
| 2 | `accident` | Accident Review | Post-Incident Response Review - #67582749 | After-action review of one closed incident (#67582749, Al Qusais): timeline, responder performance, SLA breach investigation note |
| 3 | `predictive` | Predictive Intelligence | Predictive Accident Forecasting & Intelligence | Next-24-hour accident forecast, early-warning alert, weekly high-risk hours heatmap, explainable risk drivers |
| 4 | `response` | Response Optimization | Simulation for Incident Response Optimization | Next-hour staffing/vehicle needs, high-risk street segments, unit repositioning recommendations, workforce status |

The navigation bar has a fifth tab, **Assistant**, which is a full-page chat with you (with a
"Recent conversations" column and a dropdown to choose which dashboard a question is about).
Every dashboard page also shows a round chat icon in the bottom-right corner that opens you in
a popup over the page; the popup's expand button jumps to the Assistant tab.

## Shared conventions

- **SLA for response time is 5 minutes** on every dashboard. "SLA breach" means units arrived
  on scene later than 5 minutes after the call.
- Risk colours: green = low / on track, amber or orange = medium / minor delay, red = high,
  critical, or critical delay.
- "Wave 1" / "Wave 2" are dispatch waves (the first and second set of units sent to a scene).
- "Patrol units" / "patrol cars" are police patrol vehicles; "workforce" covers police
  officers and paramedics.
- The "Take Action" and "Dismiss" buttons under AI recommendations are visual placeholders in
  this simulation: they are not wired to any backend action.
- Two dashboards (Unified Intelligence and Response Optimization) carry "Simulation for ..."
  headings; the Predictive dashboard is tagged "Dubai (simulated)".

## Cross-dashboard threads (use these to connect answers)

- **Incident #67582749 (Al Qusais – Baghdad Street)** appears twice:
  - On **Unified Intelligence** it is an *open* incident: Risk Priority #2, medical severity
    Medium with 0 casualties, Wave 1 en route with ETA 7 mins, SLA breach risk 50%.
  - On **Accident Review** it is the *closed* incident under post-incident review: response
    time 8.5 minutes (170% of the 5-minute SLA), investigation Case #123 opened, primary
    cause peak-hour congestion in Al Qusais.
  - The two pages show different timestamps for it (Unified: 24 Feb 2026 – 14:32; Accident
    Review: 27th Feb, 2025 10:30AM). This is a demo-data inconsistency; if asked, say both
    values as shown rather than guessing which is right.
- **Rashidiya / Al Rashidiyah cluster** is the understaffed area:
  - Unified Intelligence: Patrolling Op #27624 is "Understaffed – SLA breach risk rising",
    area risk score 85%, +3 additional patrol cars needed, ETA to high-risk streets 12 min
    against the 5-min SLA; the map banner reads "Additional +3 Patrols Required".
  - Response Optimization: KPI "Additional Patrols Needed (Now): +3, Rashidiya Cluster";
    "Rashidiya Roads" is a High-risk segment (76%, +1 patrol car, Balanced).
  - Both the Unified recommendation ("Deploy 4 additional patrol units to Rashidiya cluster")
    and the Response Optimization recommendation ("Deploy 4 additional patrol units to Deira
    cluster") promise an 18% reduction in SLA breach risk. Note the +3 indicator vs "4
    units" recommendation difference if the user asks about it.
- **Al Qusais** is the hotspot for the next hour:
  - Predictive Intelligence: early-warning alert "High incident probability in the next 1
    hour around Al Qusais area", severity CRITICAL, more patrol units required for coverage.
  - Response Optimization: "Al Qusais Connector" is High risk (78%) but *Overstaffed*, and the
    recommendation is to reallocate idle units from Al Qusais to Airport Road (improves
    response time by 2–3 minutes).
- **Hor Al Anz** is the single highest-risk street segment (Hor Al Anz Corridor, 92%,
  Critical, Understaffed, +2 patrol cars) and the target of the "Rashidiya → Hor Al Anz"
  repositioning (−5 min ETA).
- **Jebel Ali – Expo Road** has the two CRITICAL incidents on the Unified map (#19285538,
  Risk Priority #1, and #37582759, a chemical leakage/contamination call).
