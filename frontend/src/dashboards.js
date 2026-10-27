// The four dashboards, in navigation order. Ids are shared with the backend
// (backend/services/dashboards.py) and with the assistant's open_dashboard tool.
export const DASHBOARDS = [
  {
    id: 'unified',
    label: 'Unified Intelligence',
    file: 'unified_intelligence.html',
    title: 'Simulation for Unified Operational Intelligence',
    description: 'Live map of incidents and patrol ops, city KPIs, risk gauges, recommendations',
    suggestions: [
      'Which incident is the highest priority right now?',
      'Summarize the Rashidiya patrol situation',
      'What are the city-wide KPIs telling me?',
    ],
  },
  {
    id: 'accident',
    label: 'Accident Review',
    file: 'accident.html',
    title: 'Post-Incident Response Review - #67582749',
    description: 'Post-incident review of #67582749: timeline, responders, SLA breach',
    suggestions: [
      'Why did incident #67582749 breach the SLA?',
      'Where did the 8.5 minutes go?',
      'Which responder had the worst travel time?',
    ],
  },
  {
    id: 'predictive',
    label: 'Predictive Intelligence',
    file: 'predictive.html',
    title: 'Predictive Accident Forecasting & Intelligence',
    description: '24-hour forecast, early-warning alert, weekly risk heatmap, risk drivers',
    suggestions: [
      'When is the accident peak in the next 24 hours?',
      'Which weekday hours are critical?',
      'What drives the risk model the most?',
    ],
  },
  {
    id: 'response',
    label: 'Response Optimization',
    file: 'simulation.html',
    title: 'Simulation for Incident Response Optimization',
    description: 'Next-hour staffing needs, high-risk segments, unit repositioning, workforce',
    suggestions: [
      'Which street segments are understaffed?',
      'Which unit move saves the most time?',
      'How is the workforce distributed right now?',
    ],
  },
];

// The fifth tab: the full-page assistant.
export const ASSISTANT_TAB = { id: 'assistant', label: 'Assistant' };
export const NAV_TABS = [...DASHBOARDS, ASSISTANT_TAB];

export const DEFAULT_DASHBOARD = DASHBOARDS[0].id;
export const dashboardById = (id) => DASHBOARDS.find(d => d.id === id) || null;
export const isTab = (id) => NAV_TABS.some(t => t.id === id);
