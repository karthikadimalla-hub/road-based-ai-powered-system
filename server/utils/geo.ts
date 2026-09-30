export interface GeoPoint {
  latitude: number;
  longitude: number;
}

/**
 * Calculates the Haversine distance in meters between two points
 */
export function calculateDistanceMeters(
  point1: GeoPoint,
  point2: GeoPoint
): number {
  const R = 6371000; // Radius of Earth in meters
  const dLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const dLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const lat1 = (point1.latitude * Math.PI) / 180;
  const lat2 = (point2.latitude * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Calculates text similarity score (0.0 to 1.0) using word set overlap (Jaccard index)
 */
export function calculateTextSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  const tokenize = (t: string) =>
    new Set(
      t
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 2)
    );

  const words1 = tokenize(text1);
  const words2 = tokenize(text2);

  if (words1.size === 0 || words2.size === 0) return 0;

  let intersection = 0;
  words1.forEach((w) => {
    if (words2.has(w)) intersection++;
  });

  const union = new Set([...words1, ...words2]).size;
  return union === 0 ? 0 : Number((intersection / union).toFixed(2));
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  relatedReportId: string | null;
  incidentId: string | null;
  distanceMeters: number;
  similarityScore: number;
  confidenceReason: string;
  clusterCount: number;
}

/**
 * Check if a new report matches any existing open or reported hazard within 200m
 */
export function detectDuplicates(
  newReport: {
    latitude: number;
    longitude: number;
    category: string;
    description: string;
  },
  existingReports: Array<{
    id: string;
    incident_id: string | null;
    latitude: number;
    longitude: number;
    category: string;
    description: string;
    created_at: string;
    status: string;
  }>
): DuplicateCheckResult {
  // We check existing reports not rejected
  const candidates = existingReports.filter(
    (r) => r.status !== 'Rejected'
  );

  let bestMatch: {
    reportId: string;
    incidentId: string | null;
    distance: number;
    similarity: number;
  } | null = null;

  let clusterMatches = 0;

  for (const existing of candidates) {
    const dist = calculateDistanceMeters(
      { latitude: newReport.latitude, longitude: newReport.longitude },
      { latitude: existing.latitude, longitude: existing.longitude }
    );

    // Consider hazards within 200 meters as potentially related
    if (dist <= 200) {
      clusterMatches++;

      const isSameCategory = newReport.category === existing.category;
      const isRelatedCategory =
        (newReport.category === 'pothole' && existing.category === 'damaged_road') ||
        (newReport.category === 'damaged_road' && existing.category === 'pothole');

      const textSim = calculateTextSimilarity(
        newReport.description,
        existing.description
      );

      // Higher weight for category match & close proximity
      let score = 0;
      if (dist <= 50) score += 0.5;
      else if (dist <= 100) score += 0.35;
      else score += 0.2;

      if (isSameCategory) score += 0.4;
      else if (isRelatedCategory) score += 0.25;

      score += textSim * 0.2;

      if (score >= 0.5 && (!bestMatch || score > bestMatch.similarity)) {
        bestMatch = {
          reportId: existing.id,
          incidentId: existing.incident_id,
          distance: dist,
          similarity: Number(score.toFixed(2)),
        };
      }
    }
  }

  if (bestMatch) {
    return {
      isDuplicate: true,
      relatedReportId: bestMatch.reportId,
      incidentId: bestMatch.incidentId,
      distanceMeters: bestMatch.distance,
      similarityScore: bestMatch.similarity,
      confidenceReason: `Located ~${bestMatch.distance}m from previous report ${bestMatch.reportId} with matching hazard characteristics.`,
      clusterCount: Math.max(1, clusterMatches),
    };
  }

  return {
    isDuplicate: false,
    relatedReportId: null,
    incidentId: null,
    distanceMeters: 0,
    similarityScore: 0,
    confidenceReason: 'No identical hazard detected within 200-meter radius.',
    clusterCount: clusterMatches,
  };
}

export interface PriorityBreakdown {
  score: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  severityPoints: number;
  clusterPoints: number;
  confidencePoints: number;
  reasoning: string;
}

/**
 * Transparent Priority Calculation System
 * Specified formula:
 * Severity: Critical=40, High=30, Medium=20, Low=10
 * Cluster Reports: 1 report=5, 2-4 reports=10, 5+=20
 * Evidence Confidence: >=0.85=20, 0.65-0.84=10, <0.65=5
 * Brackets: 0-29 Low, 30-49 Medium, 50-69 High, 70+ Critical
 */
export function calculatePriorityScore(
  severity: 'low' | 'medium' | 'high' | 'critical',
  relatedReportCount: number,
  confidence: number
): PriorityBreakdown {
  // 1. Severity Points
  let severityPoints = 20;
  if (severity === 'critical') severityPoints = 40;
  else if (severity === 'high') severityPoints = 30;
  else if (severity === 'medium') severityPoints = 20;
  else if (severity === 'low') severityPoints = 10;

  // 2. Cluster / Related Reports Points
  let clusterPoints = 5;
  if (relatedReportCount >= 5) clusterPoints = 20;
  else if (relatedReportCount >= 2) clusterPoints = 10;
  else clusterPoints = 5;

  // 3. Evidence Confidence Points
  let confidencePoints = 10;
  if (confidence >= 0.85) confidencePoints = 20;
  else if (confidence >= 0.65) confidencePoints = 10;
  else confidencePoints = 5;

  const totalScore = severityPoints + clusterPoints + confidencePoints;

  let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  if (totalScore >= 70) priority = 'critical';
  else if (totalScore >= 50) priority = 'high';
  else if (totalScore >= 30) priority = 'medium';
  else priority = 'low';

  const reasoning = `Computed priority score of ${totalScore}/100 points (${priority.toUpperCase()}): +${severityPoints} pts for ${severity.toUpperCase()} severity, +${clusterPoints} pts for ${relatedReportCount} cluster report(s) in area, +${confidencePoints} pts for ${(confidence * 100).toFixed(0)}% AI evidence confidence.`;

  return {
    score: totalScore,
    priority,
    severityPoints,
    clusterPoints,
    confidencePoints,
    reasoning,
  };
}
