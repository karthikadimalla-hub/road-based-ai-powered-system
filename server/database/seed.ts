import { getDatabase, queryOne, runQuery } from './db.js';
import { hashPassword } from '../utils/auth.js';

// Realistic SVG generator for road hazards so images render crisp and locally
function generateHazardSvg(
  hazardType: string,
  title: string,
  city: string,
  accentColor: string
): string {
  const encoded = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="100%" height="100%">
  <defs>
    <linearGradient id="roadGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#334155"/>
      <stop offset="60%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="hazardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${accentColor}"/>
      <stop offset="100%" stop-color="#7c2d12"/>
    </linearGradient>
    <pattern id="roadStripes" width="40" height="20" patternUnits="userSpaceOnUse">
      <line x1="0" y1="10" x2="20" y2="10" stroke="#facc15" stroke-width="3" stroke-dasharray="15,10" />
    </pattern>
  </defs>

  <!-- Background Road Canvas -->
  <rect width="600" height="400" fill="url(#roadGrad)"/>
  
  <!-- Perspective Road Markings -->
  <polygon points="120,400 240,140 360,140 480,400" fill="#1e293b" opacity="0.6"/>
  <line x1="300" y1="140" x2="300" y2="400" stroke="#facc15" stroke-width="4" stroke-dasharray="25,18" opacity="0.75"/>
  <line x1="160" y1="400" x2="255" y2="140" stroke="#ffffff" stroke-width="2" stroke-dasharray="10,15" opacity="0.4"/>
  <line x1="440" y1="400" x2="345" y2="140" stroke="#ffffff" stroke-width="2" stroke-dasharray="10,15" opacity="0.4"/>

  <!-- Hazard Specific Graphic -->
  ${
    hazardType === 'pothole'
      ? `<ellipse cx="310" cy="270" rx="90" ry="45" fill="#020617"/>
         <ellipse cx="308" cy="268" rx="80" ry="38" fill="#090d16" stroke="#475569" stroke-width="2"/>
         <ellipse cx="295" cy="265" rx="55" ry="24" fill="#000000"/>
         <path d="M 230 250 Q 280 230 330 255 Q 380 280 340 300 Q 270 310 230 250 Z" fill="none" stroke="#64748b" stroke-width="3" opacity="0.7"/>`
      : hazardType === 'open_manhole'
      ? `<ellipse cx="300" cy="280" rx="65" ry="35" fill="#000000" stroke="#ef4444" stroke-width="4"/>
         <ellipse cx="300" cy="285" rx="50" ry="25" fill="#020617"/>
         <ellipse cx="300" cy="290" rx="35" ry="15" fill="#000000"/>
         <rect x="360" y="240" width="50" height="25" rx="4" fill="#64748b" transform="rotate(25, 360, 240)" stroke="#334155" stroke-width="2"/>`
      : hazardType === 'waterlogging'
      ? `<path d="M 120 320 C 180 290 280 340 380 300 C 440 280 480 310 520 330 L 520 400 L 80 400 Z" fill="#0284c7" opacity="0.65"/>
         <ellipse cx="260" cy="340" rx="140" ry="35" fill="#38bdf8" opacity="0.3"/>
         <ellipse cx="380" cy="360" rx="90" ry="20" fill="#38bdf8" opacity="0.4"/>`
      : hazardType === 'traffic_signal'
      ? `<rect x="275" y="100" width="50" height="130" rx="8" fill="#1e293b" stroke="#475569" stroke-width="3"/>
         <circle cx="300" cy="125" r="14" fill="#ef4444"/>
         <circle cx="300" cy="165" r="14" fill="#334155"/>
         <circle cx="300" cy="205" r="14" fill="#334155"/>
         <line x1="300" y1="230" x2="300" y2="400" stroke="#64748b" stroke-width="8"/>`
      : hazardType === 'streetlight'
      ? `<line x1="420" y1="60" x2="420" y2="400" stroke="#475569" stroke-width="6"/>
         <path d="M 420 60 Q 380 50 350 70" fill="none" stroke="#475569" stroke-width="6"/>
         <polygon points="340,68 360,68 350,85" fill="#64748b"/>
         <circle cx="350" cy="85" r="8" fill="#334155"/>
         <polygon points="350,85 220,380 460,380" fill="#facc15" opacity="0.08"/>`
      : `<rect x="220" y="180" width="160" height="90" rx="6" fill="#334155" stroke="#e2e8f0" stroke-width="2"/>
         <line x1="200" y1="270" x2="400" y2="270" stroke="#ef4444" stroke-width="4"/>`
  }

  <!-- Watermark HUD Overlay -->
  <rect x="20" y="20" width="260" height="60" rx="6" fill="#0f172a" opacity="0.85"/>
  <circle cx="42" cy="50" r="10" fill="${accentColor}"/>
  <text x="62" y="44" font-family="sans-serif" font-size="13" font-weight="bold" fill="#ffffff">${title}</text>
  <text x="62" y="62" font-family="sans-serif" font-size="11" fill="#94a3b8">Location: ${city} (Verified GPS)</text>
  
  <rect x="420" y="20" width="160" height="34" rx="4" fill="#1e293b" opacity="0.9"/>
  <text x="432" y="42" font-family="monospace" font-size="11" fill="#38bdf8">RoadSafe Sentinel AI</text>
</svg>
`);
  return `data:image/svg+xml;utf8,${encoded}`;
}

export async function seedDemoData(): Promise<void> {
  await getDatabase();

  // Check if users already seeded
  const existingUser = await queryOne('SELECT id FROM users LIMIT 1');
  if (existingUser) {
    return; // Database already seeded
  }

  console.log('Seeding initial Indian road-safety demo dataset...');

  // 1. Demo Citizen User
  const citizenPasswordHash = await hashPassword('Citizen@123');
  const adminPasswordHash = await hashPassword('Admin@123');

  const citizenUser = {
    id: 'usr_citizen_01',
    name: 'Rajesh Kumar',
    email: 'citizen@roadsafe.in',
    phone: '+91 98765 43210',
    password_hash: citizenPasswordHash,
    role: 'user',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  };

  const adminUser = {
    id: 'usr_admin_01',
    name: 'Pooja Sharma (Safety Officer)',
    email: 'admin@roadsafe.in',
    phone: '+91 91234 56789',
    password_hash: adminPasswordHash,
    role: 'admin',
    created_at: new Date(Date.now() - 35 * 86400000).toISOString(),
  };

  await runQuery(
    `INSERT INTO users (id, name, email, phone, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      citizenUser.id,
      citizenUser.name,
      citizenUser.email,
      citizenUser.phone,
      citizenUser.password_hash,
      citizenUser.role,
      citizenUser.created_at,
    ]
  );

  await runQuery(
    `INSERT INTO users (id, name, email, phone, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      adminUser.id,
      adminUser.name,
      adminUser.email,
      adminUser.phone,
      adminUser.password_hash,
      adminUser.role,
      adminUser.created_at,
    ]
  );

  // 2. Demo Incidents (including INC-2026-00125 for demonstrating duplicate grouping)
  const incidents = [
    {
      id: 'INC-2026-00125',
      title: 'Cluster Pothole & Road Crater on Hitec City Flyover Ramp',
      category: 'pothole',
      latitude: 17.4435,
      longitude: 78.3772,
      priority: 'critical',
      status: 'In Progress',
      assigned_to: 'GHMC Road Maintenance Wing 04',
      report_count: 3,
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'INC-2026-00102',
      title: 'Uncovered Underground Sewer Chamber on Outer Ring Road',
      category: 'open_manhole',
      latitude: 12.9352,
      longitude: 77.6953,
      priority: 'critical',
      status: 'Assigned',
      assigned_to: 'BBMP Stormwater & Sewerage Cell',
      report_count: 2,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'INC-2026-00103',
      title: 'Blackout Streetlight Stretch on Western Express Highway',
      category: 'streetlight',
      latitude: 19.1136,
      longitude: 72.8697,
      priority: 'high',
      status: 'Reported',
      assigned_to: 'BMC Electrical Maintenance Division',
      report_count: 1,
      created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
    {
      id: 'INC-2026-00104',
      title: 'Damaged Signal Pole & Broken Red Lens at AIIMS Ring Road',
      category: 'traffic_signal',
      latitude: 28.5672,
      longitude: 77.2100,
      priority: 'high',
      status: 'In Progress',
      assigned_to: 'Delhi Traffic Police Infra Cell',
      report_count: 1,
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'INC-2026-00105',
      title: 'Monsoon Waterlogging & Submerged Carriage Way on Anna Salai',
      category: 'waterlogging',
      latitude: 13.0405,
      longitude: 80.2505,
      priority: 'high',
      status: 'Reported',
      assigned_to: 'Greater Chennai Corp Drainage Cell',
      report_count: 1,
      created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    },
    {
      id: 'INC-2026-00106',
      title: 'Collapsed Highway Signage Board on FC Road Junction',
      category: 'damaged_sign',
      latitude: 18.5283,
      longitude: 73.8427,
      priority: 'medium',
      status: 'Resolved',
      assigned_to: 'PMC Traffic Infrastructure',
      report_count: 1,
      created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: 'INC-2026-00107',
      title: 'Fallen Banyan Tree Branch Blocking Bypass Lane',
      category: 'road_obstruction',
      latitude: 22.5697,
      longitude: 88.4042,
      priority: 'high',
      status: 'Resolved',
      assigned_to: 'KMC Disaster Quick Response Team',
      report_count: 1,
      created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
    {
      id: 'INC-2026-00108',
      title: 'Severe Asphalt Ravelling & Tar Breakdown on SG Highway',
      category: 'damaged_road',
      latitude: 23.0338,
      longitude: 72.5074,
      priority: 'medium',
      status: 'Assigned',
      assigned_to: 'AMC Engineering Dept',
      report_count: 1,
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ];

  for (const inc of incidents) {
    await runQuery(
      `INSERT INTO incidents (id, title, category, latitude, longitude, priority, status, assigned_to, report_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        inc.id,
        inc.title,
        inc.category,
        inc.latitude,
        inc.longitude,
        inc.priority,
        inc.status,
        inc.assigned_to,
        inc.report_count,
        inc.created_at,
        inc.updated_at,
      ]
    );
  }

  // 3. Demo Reports (16 realistic reports across India)
  const reports = [
    // Duplicate Cluster 1 for INC-2026-00125 (Hyderabad)
    {
      id: 'REP-2026-00101',
      user_id: citizenUser.id,
      incident_id: 'INC-2026-00125',
      category: 'pothole',
      description: 'Deep 10-inch pothole near Cyber Towers flyover ascending ramp. Multiple two-wheelers slipping during morning peak hours.',
      image_url: generateHazardSvg('pothole', 'Deep Crater on Flyover Ramp', 'Hyderabad', '#f97316'),
      latitude: 17.4435,
      longitude: 78.3772,
      location_name: 'Near Cyber Towers, Hitec City Main Road',
      landmark: 'Opposite Shilparamam Entrance Gate',
      city: 'Hyderabad',
      ward: 'Ward 104 - Kondapur',
      severity: 'critical',
      priority: 'critical',
      priority_score: 75,
      priority_reasoning: 'Computed priority score of 75/100 (CRITICAL): +40 pts for CRITICAL severity, +15 pts for cluster reports, +20 pts for 94% AI evidence confidence.',
      ai_confidence: 0.94,
      ai_analysis: JSON.stringify({
        category: 'pothole',
        severity: 'critical',
        confidence: 0.94,
        visible_evidence: 'Deep cavity in asphalt with sharp gravel edges and compromised road base.',
        safety_risk: 'High risk of bike tyre blowout or fatal fall during rapid lane merging.',
        suggested_priority: 'critical',
        source: 'gemini',
      }),
      is_duplicate: 0,
      duplicate_of_report_id: null,
      status: 'In Progress',
      assigned_to: 'GHMC Road Maintenance Wing 04',
      upvotes: 24,
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'REP-2026-00102',
      user_id: null,
      incident_id: 'INC-2026-00125',
      category: 'pothole',
      description: 'Huge crater on flyover approach road near Cyber Towers, almost 12 feet long asphalt damage.',
      image_url: generateHazardSvg('pothole', 'Crater Near Flyover Approach', 'Hyderabad', '#f97316'),
      latitude: 17.4438,
      longitude: 78.3774,
      location_name: 'Hitec City Flyover Ascent, Madhapur',
      landmark: '50m after Shilparamam traffic signal',
      city: 'Hyderabad',
      ward: 'Ward 104 - Kondapur',
      severity: 'high',
      priority: 'critical',
      priority_score: 70,
      priority_reasoning: 'Merged into Incident INC-2026-00125. Distance 45m from primary hazard.',
      ai_confidence: 0.91,
      ai_analysis: JSON.stringify({
        category: 'pothole',
        severity: 'high',
        confidence: 0.91,
        visible_evidence: 'Extensive road surface degradation and pothole cluster.',
        safety_risk: 'Severe shock for vehicles, high two-wheeler skid danger.',
        suggested_priority: 'high',
        source: 'gemini',
      }),
      is_duplicate: 1,
      duplicate_of_report_id: 'REP-2026-00101',
      status: 'In Progress',
      assigned_to: 'GHMC Road Maintenance Wing 04',
      upvotes: 11,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'REP-2026-00103',
      user_id: null,
      incident_id: 'INC-2026-00125',
      category: 'damaged_road',
      description: 'Road broke down completely near the cyber towers pillar base, cars are braking suddenly.',
      image_url: generateHazardSvg('pothole', 'Damaged Tarmac near Pillar', 'Hyderabad', '#f97316'),
      latitude: 17.4433,
      longitude: 78.3770,
      location_name: 'Hitec City Flyover Pillar #12',
      landmark: 'Next to Cyber Gateway boundary wall',
      city: 'Hyderabad',
      ward: 'Ward 104 - Kondapur',
      severity: 'high',
      priority: 'critical',
      priority_score: 65,
      priority_reasoning: 'Merged into Incident INC-2026-00125. Located 38m from primary hazard.',
      ai_confidence: 0.88,
      ai_analysis: JSON.stringify({
        category: 'damaged_road',
        severity: 'high',
        confidence: 0.88,
        visible_evidence: 'Deep fractured tarmac surrounding pothole depression.',
        safety_risk: 'Sudden braking creates rear-end bumper collisions.',
        suggested_priority: 'high',
        source: 'gemini',
      }),
      is_duplicate: 1,
      duplicate_of_report_id: 'REP-2026-00101',
      status: 'In Progress',
      assigned_to: 'GHMC Road Maintenance Wing 04',
      upvotes: 8,
      created_at: new Date(Date.now() - 1.5 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },

    // Duplicate Cluster 2 for INC-2026-00102 (Bengaluru Open Manhole)
    {
      id: 'REP-2026-00104',
      user_id: citizenUser.id,
      incident_id: 'INC-2026-00102',
      category: 'open_manhole',
      description: 'Cast iron manhole cover missing on the fast lane of Outer Ring Road. A wooden branch has been stuck by auto drivers to alert vehicles.',
      image_url: generateHazardSvg('open_manhole', 'Open Manhole on Ring Road', 'Bengaluru', '#ef4444'),
      latitude: 12.9352,
      longitude: 77.6953,
      location_name: 'Outer Ring Road, Marathahalli - Bellandur stretch',
      landmark: 'Near Kadubeesanahalli Underpass service road',
      city: 'Bengaluru',
      ward: 'Ward 150 - Bellandur',
      severity: 'critical',
      priority: 'critical',
      priority_score: 80,
      priority_reasoning: 'Computed priority score of 80/100 (CRITICAL): +40 pts for CRITICAL severity, +20 pts for cluster reports, +20 pts for 96% AI evidence confidence.',
      ai_confidence: 0.96,
      ai_analysis: JSON.stringify({
        category: 'open_manhole',
        severity: 'critical',
        confidence: 0.96,
        visible_evidence: 'Completely open stormwater chamber with makeshift tree twig inserted as warning.',
        safety_risk: 'Extreme life risk: An unwary biker or pedestrian could drop into the 8-foot drop chamber.',
        suggested_priority: 'critical',
        source: 'gemini',
      }),
      is_duplicate: 0,
      duplicate_of_report_id: null,
      status: 'Assigned',
      assigned_to: 'BBMP Stormwater & Sewerage Cell',
      upvotes: 42,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'REP-2026-00105',
      user_id: null,
      incident_id: 'INC-2026-00102',
      category: 'open_manhole',
      description: 'Open gutter chamber uncovered on Outer Ring Road, very dangerous at night.',
      image_url: generateHazardSvg('open_manhole', 'Uncovered Gutter Chamber', 'Bengaluru', '#ef4444'),
      latitude: 12.9350,
      longitude: 77.6955,
      location_name: 'Outer Ring Road, Kadubeesanahalli',
      landmark: 'Near JP Morgan tech park exit',
      city: 'Bengaluru',
      ward: 'Ward 150 - Bellandur',
      severity: 'critical',
      priority: 'critical',
      priority_score: 75,
      priority_reasoning: 'Merged into INC-2026-00102. Distance 30m.',
      ai_confidence: 0.93,
      ai_analysis: JSON.stringify({
        category: 'open_manhole',
        severity: 'critical',
        confidence: 0.93,
        visible_evidence: 'Exposed manhole hole on roadway.',
        safety_risk: 'High vehicle collapse risk.',
        suggested_priority: 'critical',
        source: 'gemini',
      }),
      is_duplicate: 1,
      duplicate_of_report_id: 'REP-2026-00104',
      status: 'Assigned',
      assigned_to: 'BBMP Stormwater & Sewerage Cell',
      upvotes: 19,
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },

    // Report 6 - Mumbai Streetlight
    {
      id: 'REP-2026-00106',
      user_id: citizenUser.id,
      incident_id: 'INC-2026-00103',
      category: 'streetlight',
      description: 'Continuous 8 streetlights not functional along Western Express Highway flyover section. Complete pitch dark curve causing pedestrian crossing risks.',
      image_url: generateHazardSvg('streetlight', 'Dark Streetlight Section', 'Mumbai', '#eab308'),
      latitude: 19.1136,
      longitude: 72.8697,
      location_name: 'Western Express Highway, Andheri East',
      landmark: 'Between Gundavali Metro Station and WEH Flyover',
      city: 'Mumbai',
      ward: 'Ward K-East',
      severity: 'high',
      priority: 'high',
      priority_score: 60,
      priority_reasoning: 'Computed priority score of 60/100 (HIGH): +30 pts for HIGH severity, +10 pts for single report cluster, +20 pts for 90% AI confidence.',
      ai_confidence: 0.90,
      ai_analysis: JSON.stringify({
        category: 'streetlight',
        severity: 'high',
        confidence: 0.90,
        visible_evidence: 'Unilluminated highway stretch with multiple dead sodium lamps.',
        safety_risk: 'Lack of lighting blinds drivers to median barriers and pedestrians.',
        suggested_priority: 'high',
        source: 'gemini',
      }),
      is_duplicate: 0,
      duplicate_of_report_id: null,
      status: 'Reported',
      assigned_to: 'BMC Electrical Maintenance Division',
      upvotes: 15,
      created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    },

    // Report 7 - Delhi Traffic Signal
    {
      id: 'REP-2026-00107',
      user_id: null,
      incident_id: 'INC-2026-00104',
      category: 'traffic_signal',
      description: 'Traffic light masthead sheared by truck collision at AIIMS Ring Road intersection. Red and amber lights completely unlit, traffic chaotic.',
      image_url: generateHazardSvg('traffic_signal', 'Broken Signal Pole', 'Delhi', '#dc2626'),
      latitude: 28.5672,
      longitude: 77.2100,
      location_name: 'Ring Road Intersection, AIIMS Flyover below',
      landmark: 'Near Safdarjung Hospital Trauma Center gate',
      city: 'Delhi',
      ward: 'South Delhi Municipal Zone',
      severity: 'high',
      priority: 'high',
      priority_score: 60,
      priority_reasoning: 'Computed priority score of 60/100 (HIGH): +30 pts for HIGH severity, +10 pts for traffic node, +20 pts for 92% AI confidence.',
      ai_confidence: 0.92,
      ai_analysis: JSON.stringify({
        category: 'traffic_signal',
        severity: 'high',
        confidence: 0.92,
        visible_evidence: 'Tilted signal mast with smashed optical cowl and exposed wiring harness.',
        safety_risk: 'Severe junction gridlock and dangerous broadside T-bone collision risk.',
        suggested_priority: 'high',
        source: 'gemini',
      }),
      is_duplicate: 0,
      duplicate_of_report_id: null,
      status: 'In Progress',
      assigned_to: 'Delhi Traffic Police Infra Cell',
      upvotes: 31,
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },

    // Report 8 - Chennai Waterlogging
    {
      id: 'REP-2026-00108',
      user_id: null,
      incident_id: 'INC-2026-00105',
      category: 'waterlogging',
      description: 'Water accumulation above 1.5 feet covering 3 traffic lanes on Anna Salai after moderate rain. Stormwater drain mouth choked with construction silt.',
      image_url: generateHazardSvg('waterlogging', 'Stagnant Water on Anna Salai', 'Chennai', '#0284c7'),
      latitude: 13.0405,
      longitude: 80.2505,
      location_name: 'Anna Salai, T. Nagar Junction',
      landmark: 'In front of Panagal Park signal turn',
      city: 'Chennai',
      ward: 'Ward 117 - T. Nagar',
      severity: 'high',
      priority: 'high',
      priority_score: 55,
      priority_reasoning: 'Computed priority score of 55/100 (HIGH): +30 pts for HIGH severity, +5 pts for single incident, +20 pts for 89% AI confidence.',
      ai_confidence: 0.89,
      ai_analysis: JSON.stringify({
        category: 'waterlogging',
        severity: 'high',
        confidence: 0.89,
        visible_evidence: 'Broad standing pool submerged up to vehicle axle level.',
        safety_risk: 'Hydroplaning risk and invisible submerged median stones causing two-wheeler accidents.',
        suggested_priority: 'high',
        source: 'gemini',
      }),
      is_duplicate: 0,
      duplicate_of_report_id: null,
      status: 'Reported',
      assigned_to: 'Greater Chennai Corp Drainage Cell',
      upvotes: 18,
      created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    },

    // Report 9 - Pune Damaged Sign
    {
      id: 'REP-2026-00109',
      user_id: null,
      incident_id: 'INC-2026-00106',
      category: 'damaged_sign',
      description: 'Direction signboard bent horizontally and hanging into the cyclist track on Fergusson College Road.',
      image_url: generateHazardSvg('damaged_sign', 'Bent Signboard on Cycle Track', 'Pune', '#eab308'),
      latitude: 18.5283,
      longitude: 73.8427,
      location_name: 'FC Road, Shivajinagar',
      landmark: 'Near Goodluck Cafe crossing',
      city: 'Pune',
      ward: 'Ward 14 - Shivajinagar',
      severity: 'medium',
      priority: 'medium',
      priority_score: 35,
      priority_reasoning: 'Computed priority score of 35/100 (MEDIUM): +20 pts for MEDIUM severity, +5 pts for single report, +10 pts for AI confidence.',
      ai_confidence: 0.85,
      ai_analysis: JSON.stringify({
        category: 'damaged_sign',
        severity: 'medium',
        confidence: 0.85,
        visible_evidence: 'Metal board detached from bracket hanging at head height.',
        safety_risk: 'Physical impact risk to cyclists and scooter riders on curb line.',
        suggested_priority: 'medium',
        source: 'gemini',
      }),
      is_duplicate: 0,
      duplicate_of_report_id: null,
      status: 'Resolved',
      assigned_to: 'PMC Traffic Infrastructure',
      upvotes: 7,
      created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },

    // Report 10 - Kolkata Road Obstruction
    {
      id: 'REP-2026-00110',
      user_id: null,
      incident_id: 'INC-2026-00107',
      category: 'road_obstruction',
      description: 'Heavy tree branch fallen across eastern express lane near Salt Lake Stadium entrance.',
      image_url: generateHazardSvg('road_obstruction', 'Fallen Tree Branch', 'Kolkata', '#10b981'),
      latitude: 22.5697,
      longitude: 88.4042,
      location_name: 'EM Bypass near Salt Lake Stadium Gate 3',
      landmark: 'Near Hyatt Regency overpass',
      city: 'Kolkata',
      ward: 'Bidhannagar Municipal Ward 32',
      severity: 'high',
      priority: 'high',
      priority_score: 60,
      priority_reasoning: 'Computed priority score of 60/100 (HIGH): +30 pts for HIGH severity, +10 pts for cluster, +20 pts for AI confidence.',
      ai_confidence: 0.95,
      ai_analysis: JSON.stringify({
        category: 'road_obstruction',
        severity: 'high',
        confidence: 0.95,
        visible_evidence: 'Large timber debris blocking fast lane carriage.',
        safety_risk: 'Immediate crash threat for fast-moving bypass vehicles.',
        suggested_priority: 'high',
        source: 'gemini',
      }),
      is_duplicate: 0,
      duplicate_of_report_id: null,
      status: 'Resolved',
      assigned_to: 'KMC Disaster Quick Response Team',
      upvotes: 14,
      created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    },

    // Report 11 - Ahmedabad Damaged Road
    {
      id: 'REP-2026-00111',
      user_id: null,
      incident_id: 'INC-2026-00108',
      category: 'damaged_road',
      description: 'Extensive road erosion and aggregate loosening along service lane of SG Highway.',
      image_url: generateHazardSvg('damaged_road', 'Ravelling Asphalt on Highway', 'Ahmedabad', '#f97316'),
      latitude: 23.0338,
      longitude: 72.5074,
      location_name: 'SG Highway Service Road, Bodakdev',
      landmark: 'Near Iscon Cross Road circle',
      city: 'Ahmedabad',
      ward: 'New West Zone - Bodakdev',
      severity: 'medium',
      priority: 'medium',
      priority_score: 40,
      priority_reasoning: 'Computed priority score of 40/100 (MEDIUM): +20 pts for MEDIUM severity, +10 pts for road classification, +10 pts for confidence.',
      ai_confidence: 0.86,
      ai_analysis: JSON.stringify({
        category: 'damaged_road',
        severity: 'medium',
        confidence: 0.86,
        visible_evidence: 'Aggregates exposed with surface cracking and uneven leveling.',
        safety_risk: 'Loss of vehicle tyre grip and loose gravel projectile risk.',
        suggested_priority: 'medium',
        source: 'gemini',
      }),
      is_duplicate: 0,
      duplicate_of_report_id: null,
      status: 'Assigned',
      assigned_to: 'AMC Engineering Dept',
      upvotes: 9,
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },

    // Report 12 - Hyderabad Begumpet Unsafe Intersection
    {
      id: 'REP-2026-00112',
      user_id: citizenUser.id,
      incident_id: null,
      category: 'unsafe_intersection',
      description: 'Blind turn under Begumpet railway bridge with no convex mirror and worn-out road studs (cat-eyes). Frequent near misses between RTC buses and bikes.',
      image_url: generateHazardSvg('unsafe_intersection', 'Blind Turn Under Railway Bridge', 'Hyderabad', '#f97316'),
      latitude: 17.4441,
      longitude: 78.4682,
      location_name: 'Begumpet Railway Bridge Underpass',
      landmark: 'Near Hyderabad Public School turn',
      city: 'Hyderabad',
      ward: 'Ward 149 - Begumpet',
      severity: 'high',
      priority: 'high',
      priority_score: 55,
      priority_reasoning: 'Computed priority score of 55/100 (HIGH): +30 pts for HIGH severity, +5 pts for single report, +20 pts for 91% AI confidence.',
      ai_confidence: 0.91,
      ai_analysis: JSON.stringify({
        category: 'unsafe_intersection',
        severity: 'high',
        confidence: 0.91,
        visible_evidence: 'Obstructed sightline geometry under masonry railway pier without optical warning devices.',
        safety_risk: 'High head-on collision probability for oncoming vehicles.',
        suggested_priority: 'high',
        source: 'gemini',
      }),
      is_duplicate: 0,
      duplicate_of_report_id: null,
      status: 'Reported',
      assigned_to: null,
      upvotes: 22,
      created_at: new Date(Date.now() - 1.2 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1.2 * 86400000).toISOString(),
    },

    // Report 13 - Bengaluru Indiranagar Pothole
    {
      id: 'REP-2026-00113',
      user_id: null,
      incident_id: null,
      category: 'pothole',
      description: 'Cluster of 3 sharp potholes on 100 Feet Road right after CMH Road junction.',
      image_url: generateHazardSvg('pothole', 'Potholes on 100 Feet Road', 'Bengaluru', '#f97316'),
      latitude: 12.9716,
      longitude: 77.6412,
      location_name: '100 Feet Road, Indiranagar',
      landmark: 'Opposite Metro Pillar 84',
      city: 'Bengaluru',
      ward: 'Ward 80 - Hoysala Nagar',
      severity: 'medium',
      priority: 'medium',
      priority_score: 40,
      priority_reasoning: 'Computed priority score of 40/100 (MEDIUM): +20 pts for MEDIUM severity, +10 pts for commercial artery, +10 pts for confidence.',
      ai_confidence: 0.89,
      ai_analysis: JSON.stringify({
        category: 'pothole',
        severity: 'medium',
        confidence: 0.89,
        visible_evidence: 'Multiple circular craters in bituminous course.',
        safety_risk: 'Two-wheeler wobble and shock absorber damage.',
        suggested_priority: 'medium',
        source: 'gemini',
      }),
      is_duplicate: 0,
      duplicate_of_report_id: null,
      status: 'Reported',
      assigned_to: null,
      upvotes: 12,
      created_at: new Date(Date.now() - 2.5 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 2.5 * 86400000).toISOString(),
    },

    // Report 14 - Mumbai Marine Drive Damaged Sign
    {
      id: 'REP-2026-00114',
      user_id: null,
      incident_id: null,
      category: 'damaged_sign',
      description: 'Speed limit and curve advisory sign knocked sideways near Nariman Point turn.',
      image_url: generateHazardSvg('damaged_sign', 'Twisted Advisory Sign', 'Mumbai', '#eab308'),
      latitude: 18.9256,
      longitude: 72.8242,
      location_name: 'Netaji Subhash Chandra Bose Road (Marine Drive)',
      landmark: 'Near Air India building promenade',
      city: 'Mumbai',
      ward: 'Ward A - Fort & Colaba',
      severity: 'low',
      priority: 'low',
      priority_score: 25,
      priority_reasoning: 'Computed priority score of 25/100 (LOW): +10 pts for LOW severity, +5 pts for single report, +10 pts for AI confidence.',
      ai_confidence: 0.87,
      ai_analysis: JSON.stringify({
        category: 'damaged_sign',
        severity: 'low',
        confidence: 0.87,
        visible_evidence: 'Post tilted at 45 degree angle away from driver line of sight.',
        safety_risk: 'Minor information gap for motorists approaching promenade curve.',
        suggested_priority: 'low',
        source: 'gemini',
      }),
      is_duplicate: 0,
      duplicate_of_report_id: null,
      status: 'Resolved',
      assigned_to: 'BMC A-Ward Road Dept',
      upvotes: 5,
      created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },

    // Report 15 - Chennai Guindy Broken Signal
    {
      id: 'REP-2026-00115',
      user_id: null,
      incident_id: null,
      category: 'traffic_signal',
      description: 'Pedestrian countdown timer and zebra crossing signal blinking erratically at Kathipara junction.',
      image_url: generateHazardSvg('traffic_signal', 'Malfunctioning Signal Lamp', 'Chennai', '#dc2626'),
      latitude: 13.0067,
      longitude: 80.2016,
      location_name: 'Kathipara Cloverleaf Under-deck, Guindy',
      landmark: 'Near Alandur Metro interchange',
      city: 'Chennai',
      ward: 'Ward 160 - Alandur',
      severity: 'medium',
      priority: 'medium',
      priority_score: 45,
      priority_reasoning: 'Computed priority score of 45/100 (MEDIUM): +20 pts for MEDIUM severity, +5 pts for cluster, +20 pts for AI confidence.',
      ai_confidence: 0.90,
      ai_analysis: JSON.stringify({
        category: 'traffic_signal',
        severity: 'medium',
        confidence: 0.90,
        visible_evidence: 'Digital timer readout scrambled with rapid amber flash.',
        safety_risk: 'Confusion for crossing pedestrians during heavy highway feeder flow.',
        suggested_priority: 'medium',
        source: 'gemini',
      }),
      is_duplicate: 0,
      duplicate_of_report_id: null,
      status: 'Reported',
      assigned_to: null,
      upvotes: 16,
      created_at: new Date(Date.now() - 0.8 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 0.8 * 86400000).toISOString(),
    },

    // Report 16 - Delhi Lajpat Nagar Open Manhole
    {
      id: 'REP-2026-00116',
      user_id: null,
      incident_id: null,
      category: 'open_manhole',
      description: 'Manhole concrete lid cracked and partially collapsed inward on Ring Road service line.',
      image_url: generateHazardSvg('open_manhole', 'Cracked Manhole Cover', 'Delhi', '#ef4444'),
      latitude: 28.5700,
      longitude: 77.2400,
      location_name: 'Ring Road Service Lane, Lajpat Nagar IV',
      landmark: 'Near Central Market pedestrian footbridge',
      city: 'Delhi',
      ward: 'Central Zone - Lajpat Nagar',
      severity: 'critical',
      priority: 'critical',
      priority_score: 75,
      priority_reasoning: 'Computed priority score of 75/100 (CRITICAL): +40 pts for CRITICAL severity, +15 pts for dense market area, +20 pts for 93% AI confidence.',
      ai_confidence: 0.93,
      ai_analysis: JSON.stringify({
        category: 'open_manhole',
        severity: 'critical',
        confidence: 0.93,
        visible_evidence: 'Fractured cement disc caved 60cm into drain chamber.',
        safety_risk: 'Wheels catching inside void could flip auto-rickshaws or cause serious pedestrian injury.',
        suggested_priority: 'critical',
        source: 'gemini',
      }),
      is_duplicate: 0,
      duplicate_of_report_id: null,
      status: 'Assigned',
      assigned_to: 'Delhi Jal Board Sewerage Division',
      upvotes: 38,
      created_at: new Date(Date.now() - 1.8 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 0.5 * 86400000).toISOString(),
    },
  ];

  for (const r of reports) {
    await runQuery(
      `INSERT INTO reports (
        id, user_id, incident_id, category, description, image_url,
        latitude, longitude, location_name, landmark, city, ward,
        severity, priority, priority_score, priority_reasoning,
        ai_confidence, ai_analysis, is_duplicate, duplicate_of_report_id,
        status, assigned_to, upvotes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        r.id,
        r.user_id,
        r.incident_id,
        r.category,
        r.description,
        r.image_url,
        r.latitude,
        r.longitude,
        r.location_name,
        r.landmark,
        r.city,
        r.ward,
        r.severity,
        r.priority,
        r.priority_score,
        r.priority_reasoning,
        r.ai_confidence,
        r.ai_analysis,
        r.is_duplicate,
        r.duplicate_of_report_id,
        r.status,
        r.assigned_to,
        r.upvotes,
        r.created_at,
        r.updated_at,
      ]
    );
  }

  // 4. Report Relations (linking duplicates in cluster 1 and 2)
  const relations = [
    {
      id: 'rel_1',
      report_id: 'REP-2026-00102',
      related_report_id: 'REP-2026-00101',
      relation_type: 'duplicate',
      distance_meters: 45,
      similarity_score: 0.88,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'rel_2',
      report_id: 'REP-2026-00103',
      related_report_id: 'REP-2026-00101',
      relation_type: 'duplicate',
      distance_meters: 38,
      similarity_score: 0.82,
      created_at: new Date(Date.now() - 1.5 * 86400000).toISOString(),
    },
    {
      id: 'rel_3',
      report_id: 'REP-2026-00105',
      related_report_id: 'REP-2026-00104',
      relation_type: 'duplicate',
      distance_meters: 30,
      similarity_score: 0.92,
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ];

  for (const rel of relations) {
    await runQuery(
      `INSERT INTO report_relations (id, report_id, related_report_id, relation_type, distance_meters, similarity_score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        rel.id,
        rel.report_id,
        rel.related_report_id,
        rel.relation_type,
        rel.distance_meters,
        rel.similarity_score,
        rel.created_at,
      ]
    );
  }

  // 5. Admin Notes
  const adminNotes = [
    {
      id: 'note_1',
      admin_id: adminUser.id,
      report_id: 'REP-2026-00101',
      admin_name: adminUser.name,
      note: 'Inspected on-site at Cyber Towers. Cold-mix patch work scheduled for 11:30 PM tonight during low traffic window.',
      created_at: new Date(Date.now() - 1.5 * 86400000).toISOString(),
    },
    {
      id: 'note_2',
      admin_id: adminUser.id,
      report_id: 'REP-2026-00104',
      admin_name: adminUser.name,
      note: 'Temporary barricading and red blinker drum placed around the open manhole. New reinforced cement cover dispatched from BBMP depot.',
      created_at: new Date(Date.now() - 1.2 * 86400000).toISOString(),
    },
    {
      id: 'note_3',
      admin_id: adminUser.id,
      report_id: 'REP-2026-00107',
      admin_name: adminUser.name,
      note: 'Traffic division notified. Temporary manual traffic control deployed while signal circuit board is being replaced.',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
  ];

  for (const n of adminNotes) {
    await runQuery(
      `INSERT INTO admin_notes (id, admin_id, report_id, admin_name, note, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [n.id, n.admin_id, n.report_id, n.admin_name, n.note, n.created_at]
    );
  }

  // 6. Status History
  const statusHistory = [
    {
      id: 'hist_1',
      report_id: 'REP-2026-00101',
      status: 'Reported',
      changed_by: 'Citizen Submission',
      comment: 'Report submitted by citizen via RoadSafe Portal.',
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: 'hist_2',
      report_id: 'REP-2026-00101',
      status: 'Assigned',
      changed_by: adminUser.name,
      comment: 'Triaged and assigned to GHMC Road Maintenance Wing 04.',
      created_at: new Date(Date.now() - 2.5 * 86400000).toISOString(),
    },
    {
      id: 'hist_3',
      report_id: 'REP-2026-00101',
      status: 'In Progress',
      changed_by: adminUser.name,
      comment: 'Work order #GHMC-2026-88 issued; repair crew mobilized.',
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'hist_4',
      report_id: 'REP-2026-00106',
      status: 'Resolved',
      changed_by: adminUser.name,
      comment: 'Signage structure reset and secured to anchor bolts.',
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: 'hist_5',
      report_id: 'REP-2026-00110',
      status: 'Resolved',
      changed_by: adminUser.name,
      comment: 'Tree trunk cut and removed by quick-response chainsaw crew; traffic normalized.',
      created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
  ];

  for (const h of statusHistory) {
    await runQuery(
      `INSERT INTO status_history (id, report_id, status, changed_by, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [h.id, h.report_id, h.status, h.changed_by, h.comment, h.created_at]
    );
  }

  console.log('Demo data successfully populated with 16 reports, 8 incidents, and 2 users.');
}
