export type UserRole = "mentor" | "talent" | "parent" | "visitor" | string;
export type PortalRole = "visitor" | "verified_visitor" | "mentor" | "parent" | "talent";

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
  is_contributor?: boolean;
}

export type KycStatus =
  | "REGISTERED"
  | "KYC_SUBMITTED"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED";

export type OrderStatus =
  | "AWAITING_PAYMENT"
  | "PROOF_SUBMITTED"
  | "ACTIVE"
  | "PAYMENT_REJECTED"
  | "EXPIRED";

export type AssignmentSubmissionStatus = "submitted" | "accepted" | "revision";

export interface MentorKycData {
  id?: number;
  student_id?: number;
  nik?: string;
  ktp_file_path?: string | null;
  has_ktp?: boolean;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_holder?: string;
  instagram_handle?: string;
  facebook_handle?: string;
  status: KycStatus;
  reject_reason?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ActiveProgramInfo {
  program_id: number;
  title: string;
  category?: "MAN" | "TEACHME_SERIES" | "PARENT_ACADEMY" | string;
  level?: "BASIC" | "INTERMEDIATE" | "ADVANCE" | string | null;
  enrolled_at: string;
}

export interface PendingOrderInfo {
  order_id: number;
  program_id: number;
  program_title?: string;
  status: OrderStatus;
  total_amount: number;
  expires_at: string;
}

export interface ProgramAssessmentSnapshot {
  program_id: number;
  title: string;
  category: string;
  level: string | null;
  result: "PASSED" | "FAILED" | "PENDING_EVALUATION" | string;
  note: string | null;
  assessed_at: string;
}

export interface AccessResponseData {
  roles?: PortalRole[];
  effective_role?: PortalRole | string;
  is_contributor?: boolean;
  points_balance?: number;
  kyc: {
    status: KycStatus;
    reject_reason: string | null;
    submitted_at: string | null;
  };
  active_programs: ActiveProgramInfo[];
  pending_orders: PendingOrderInfo[];
  assessments?: ProgramAssessmentSnapshot[];
}

export interface ProgramOrder {
  id: number;
  order_id?: number;
  student_id?: number;
  program_id: number;
  order_code: string;
  base_amount: number;
  unique_code: number;
  total_amount: number;
  status: OrderStatus;
  payment_proof_path?: string | null;
  proof_uploaded_at?: string | null;
  expires_at: string;
  reject_reason?: string | null;
  qris_url?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProgramItem {
  id: number;
  title: string;
  slug: string;
  description?: string;
  category?: "MAN" | "TEACHME_SERIES" | "PARENT_ACADEMY" | string;
  level?: "BASIC" | "INTERMEDIATE" | "ADVANCE" | string | null;
  price: number;
  qris_image_url?: string | null;
  is_active?: boolean;
  is_eligible?: boolean;
  prerequisite_reason?: string | null;
  order?: ProgramOrder | null;
  enrollment?: {
    order_id?: number;
    order_code?: string;
    status?: string;
    total_amount?: number;
    expires_at?: string;
  } | null;
  created_at?: string;
}

export interface ProgramMaterial {
  id: number;
  program_id: number;
  title: string;
  description?: string;
  type: "pdf" | "link";
  file_path?: string | null;
  external_url?: string | null;
  download_url?: string | null;
  order_index: number;
  is_active: boolean;
  createdAt?: string;
}

export interface MentorAssignmentSubmission {
  id: number;
  assignment_id: number;
  mentor_id: number;
  file_path: string;
  file_name: string;
  notes?: string | null;
  status: AssignmentSubmissionStatus;
  admin_grade?: number | null;
  admin_feedback?: string | null;
  submitted_at: string;
  reviewed_at?: string | null;
}

export interface ProgramAssignment {
  id: number;
  program_id: number;
  title: string;
  instructions: string;
  due_date?: string | null;
  is_active?: boolean;
  submission?: MentorAssignmentSubmission | null;
  my_submission?: MentorAssignmentSubmission | null;
  createdAt?: string;
}

export interface ProgramProgressSession {
  event_id: number;
  title: string;
  date: string | null;
  attended: boolean;
  attended_at: string | null;
  method: string | null;
}

export interface ProgramProgressAssignmentItem {
  assignment_id: number;
  title: string;
  status: string;
  grade: number | null;
  feedback: string | null;
}

export interface ProgramProgressData {
  program: {
    id: number;
    title: string;
    category: string;
    level?: string | null;
  };
  attendance: {
    total_sessions: number;
    attended_sessions: number;
    attendance_rate: number;
    sessions: ProgramProgressSession[];
  };
  assignments: {
    total_assignments: number;
    submitted_assignments: number;
    average_grade: number | null;
    items: ProgramProgressAssignmentItem[];
  };
  assessment: {
    status: "PENDING_EVALUATION" | "PASSED" | "FAILED" | string;
    note: string | null;
    assessed_at: string | null;
  };
}

export interface PortalEvent {
  id: number;
  program_id?: number | null;
  title: string;
  description?: string;
  event_date: string;
  event_type: "workshop" | "webinar" | "competition" | "mentoring" | string;
  thumbnail_url?: string;
  documentation_urls?: string[];
  cta_link?: string | null;
  cta_label?: string | null;
  target_role: "all" | "mentor" | "talent" | "parent" | string;
  is_active: boolean;
  tasks_count?: number;
  attendance_is_open?: boolean;
  attendance_opened_at?: string | null;
  attendance_closed_at?: string | null;
  has_attended?: boolean;
  attended?: boolean;
  attended_at?: string | null;
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

export type ContributorArticleStatus = "DRAFT" | "SUBMITTED" | "PUBLISHED" | "REJECTED";

export interface ContributorArticle {
  id: number;
  title: string;
  slug?: string;
  content: string;
  image_heading?: string | null;
  category_id?: number | null;
  category_name?: string | null;
  program_id?: number | null;
  link?: string | null;
  cta_label?: string | null;
  status: ContributorArticleStatus;
  reject_reason?: string | null;
  createdAt?: string;
  updatedAt?: string;
  reviewed_at?: string | null;
}

export interface PointHistoryItem {
  id: number;
  delta: number;
  reason_code: string;
  note?: string | null;
  created_at: string;
}

export interface PointLedgerData {
  balance: number;
  history: PointHistoryItem[];
}

export interface ExclusiveArticle {
  id: number;
  title: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  image_url?: string;
  image_heading?: string;
  admin_name?: string;
  category_color?: string;
  link?: string;
  program_id?: number | null;
  is_exclusive: boolean;
  author_name?: string;
  category_name?: string;
  read_time_minutes?: number;
  createdAt?: string;
}

export interface ActivityLog {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: "auth" | "event" | "task" | "material" | "payment" | "kyc";
  code?: string;
}
