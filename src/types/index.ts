export type HazardCategory =
  | 'pothole'
  | 'damaged_road'
  | 'traffic_signal'
  | 'streetlight'
  | 'open_manhole'
  | 'road_obstruction'
  | 'unsafe_intersection'
  | 'damaged_sign'
  | 'waterlogging'
  | 'other';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';
export type ReportStatus = 'Reported' | 'Assigned' | 'In Progress' | 'Resolved' | 'Rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface Report {
  id: string;
  user_id: string | null;
  incident_id: string | null;
  category: HazardCategory;
  description: string;
  image_url: string;
  latitude: number;
  longitude: number;
  location_name: string;
  landmark: string | null;
  city: string;
  ward: string | null;
  severity: SeverityLevel;
  priority: PriorityLevel;
  priority_score: number;
  priority_reasoning: string;
  ai_confidence: number;
  ai_analysis: string; // JSON string
  is_duplicate: number;
  duplicate_of_report_id: string | null;
  status: ReportStatus;
  assigned_to: string | null;
  upvotes: number;
  created_at: string;
  updated_at: string;
  reporter_name?: string;
  reporter_email?: string;
  related_count?: number;
}

export interface Incident {
  id: string;
  title: string;
  category: HazardCategory;
  latitude: number;
  longitude: number;
  priority: PriorityLevel;
  status: ReportStatus;
  assigned_to: string | null;
  report_count: number;
  created_at: string;
  updated_at: string;
}

export interface ParsedAIAnalysis {
  category: HazardCategory;
  severity: SeverityLevel;
  confidence: number;
  visible_evidence: string;
  safety_risk: string;
  suggested_priority: PriorityLevel;
  source?: 'gemini' | 'heuristic_engine';
}

export interface StatusHistoryItem {
  id: string;
  report_id: string;
  status: ReportStatus;
  changed_by: string;
  comment: string | null;
  created_at: string;
}

export interface AdminNote {
  id: string;
  report_id: string;
  admin_id: string;
  admin_name: string;
  note: string;
  created_at: string;
}

export interface AdminStats {
  summary: {
    totalReports: number;
    newReports: number;
    highPriority: number;
    criticalIssues: number;
    resolvedIssues: number;
    inProgressIssues: number;
    assignedIssues: number;
    duplicateGroups: number;
  };
  charts: {
    byCategory: Array<{ category: string; count: number }>;
    byPriority: Array<{ priority: string; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
    byCity: Array<{ city: string; count: number }>;
  };
}
