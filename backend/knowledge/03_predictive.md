# Dashboard 3 — Predictive Intelligence (`predictive`)

Page title: "Predictive Accident Forecasting & Intelligence".
Subtitle: "City-wide risk outlook, early warnings, and explainable drivers for the next 24 hours."

## Header controls

- A live clock pill (🕒 current time, updates every 15 s).
- An **area dropdown** with: All Areas (default), Al Qusais, Al Rashidiyah, Hor Al Anz,
  Airport Rd, Al Twar, Muraqqabad. In this simulation, changing the dropdown does not
  re-filter the figures on the page; the numbers below are the city-wide ("All Areas") view.
- A **Reset** button that returns the dropdown to All Areas and resets the panel tags
  ("Dubai (simulated)", "Next 24 Hours").

## KPI tiles (4)

| KPI | Value | Chip |
|---|---|---|
| Overall City Risk Level | **72%** | "+14% from baseline" (red) |
| Critical Risk Streets | **5** | "Risk score > 85%" (red) |
| Accidents Expected (Next 1h) | **4** | "Elevated" (amber) |
| Model Confidence | **91%** | "Stable" (green) |

Interactions: hovering a tile shows a "KPI Details" tooltip; clicking Model Confidence
changes its chip to "Stable (validated)"; clicking Overall City Risk Level changes its chip
to "+14% from baseline (7d avg)".

## Row 1

### Early Warning Alert (tag "Next 1 hour")
- Headline: **High incident probability** — severity chip **CRITICAL**
- Text: "High incident probability in the next 1 hour around **Al Qusais** area"
- Hint: "More Patrol Units required for coverage"
- Described as a "proactive notice based on short-horizon signals".

### Accident Prediction Forecast — Next 24 Hours ("Predicted accidents by hour", with a confidence band)
A line chart from 08:00 today through 08:00 tomorrow (hourly). Predicted accidents per hour,
with the lower–upper confidence band in brackets:

| Hour | Predicted | Band | Hour | Predicted | Band |
|---|---|---|---|---|---|
| 08 | 3 | 2–4 | 21 | 12 | 10–14 |
| 09 | 4 | 3–5 | 22 | 10 | 8–12 |
| 10 | 6 | 4–7 | 23 | 8 | 6–10 |
| 11 | 8 | 6–10 | 00 | 6 | 5–8 |
| 12 | 10 | 8–12 | 01 | 5 | 4–7 |
| 13 | 12 | 10–14 | 02 | 4 | 3–6 |
| 14 | 14 | 11–17 | 03 | 3 | 2–4 |
| 15 | 13 | 10–16 | 04 | 2 | 2–3 |
| 16 | 12 | 10–15 | 05 | 2 | 1–3 |
| 17 | 15 | 12–18 | 06 | 2 | 1–3 |
| 18 | **18** (peak) | 15–21 | 07 | 3 | 2–4 |
| 19 | 16 | 13–19 | 08 (next day) | 3 | 2–4 |
| 20 | 14 | 12–16 | | | |

Shape: a mid-afternoon peak around 14:00 (14), a dip to 12 at 16:00, the daily maximum of
**18 at 18:00** (evening peak), then a steady decline overnight to a floor of 2 between
04:00 and 06:00. Summed over the 24 hours (08:00–07:00) the forecast totals about 200
accidents.

## Row 2

### Weekly High Risk Hours (tag "Dubai (simulated)")
A 7-day × 12-slot heatmap (two-hour slots starting 00, 02, 04 … 22). Severity legend:
Low (green, score 25), Medium (amber, score 50), High (orange, score 75), Critical (red,
score 92). Hovering a cell shows "Day · HH:00 — Severity: X · Score: N"; clicking a cell sets
the panel tag to "Selected: Day HH:00".

| Day | 00 | 02 | 04 | 06 | 08 | 10 | 12 | 14 | 16 | 18 | 20 | 22 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Sun | Low | Low | Low | Med | Med | Med | Med | High | High | High | Med | Low |
| Mon | Low | Low | Med | Med | High | High | Med | High | **Crit** | **Crit** | High | Med |
| Tue | Low | Low | Med | Med | High | High | Med | High | **Crit** | **Crit** | High | Med |
| Wed | Low | Low | Med | Med | High | High | Med | High | **Crit** | **Crit** | High | Med |
| Thu | Low | Med | Med | High | **Crit** | High | Med | High | **Crit** | **Crit** | High | Med |
| Fri | Low | Med | Med | High | **Crit** | High | Med | High | **Crit** | **Crit** | High | Med |
| Sat | Low | Low | Low | Med | Med | Med | Med | High | High | High | Med | Low |

Key patterns: the **16:00 and 18:00 slots are Critical every weekday (Mon–Fri)**; Thursday
and Friday add a Critical **08:00** morning slot (and High at 06:00); weekends (Sat/Sun) never
exceed High and peak at 14:00–18:00; the quietest time everywhere is 00:00–02:00.

### Top Factors Driving Accident Risk (tag "Explainable AI", "Model drivers (normalized importance)")
A bar chart of model feature importances (0–1):

| Factor | Importance |
|---|---|
| Traffic Density | **0.82** |
| School Let-Out | 0.65 |
| Construction | 0.55 |
| Past 7-Day Incidents | 0.48 |
| Increased Fog | 0.40 |

Traffic density is by far the strongest driver, consistent with the congestion-related
breach on the Accident Review dashboard and the evening-peak criticality in the heatmap.

## Relationship to other dashboards

- The Al Qusais early warning lines up with Response Optimization's reallocation advice
  (Al Qusais Connector is overstaffed there, so idle units are moved to Airport Road) and
  with the Al Qusais congestion behind the breach in Accident Review.
- "Critical Risk Streets: 5" here vs. 3 Critical rows on Response Optimization's street
  table: the dashboards use different cut-offs (this KPI counts risk score > 85%; the street
  table labels 92%, 89% and 86% as Critical).
