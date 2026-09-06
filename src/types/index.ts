export type UserRole = "mentor" | "talent";

export interface StudentUser {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  region?: string;
  age?: number;
  occupation?: string;
  profile_picture?: string;
  is_verified?: boolean;
  is_active?: boolean;
}

export interface PortalEvent {
  id: number;
  title: string;
  description: string;
  event_date: string;
  event_type: "webinar" | "workshop" | "competition" | "mentoring";
  thumbnail_url?: string;
  target_role: "all" | "mentor" | "talent";
  is_active: boolean;
  tasks_count?: number;
}

export interface TaskSubmission {
  id: number;
  student_id: number;
  event_id: number;
  file_url: string;
  file_name?: string;
  status: "submitted" | "reviewed" | "revision";
  mentor_note?: string;
  submitted_at: string;
  reviewed_at?: string;
  student_name?: string;
  event_title?: string;
}

export interface MaterialItem {
  id: number;
  title: string;
  category: string;
  description: string;
  read_time_minutes: number;
  content: string;
  file_download_url?: string;
  target_role: "all" | "mentor" | "talent";
  published_at: string;
}

export interface ActivityLog {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: "auth" | "event" | "task" | "material";
}
