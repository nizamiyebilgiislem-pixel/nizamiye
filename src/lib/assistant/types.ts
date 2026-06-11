export type IntentId =
  | "attendance_today"
  | "attendance_class"
  | "infirmary_today"
  | "student_new_today"
  | "schedule_class"
  | "class_info"
  | "tasks_today"
  | "live_session_today"
  | "library_overdue"
  | "summary_today"
  | "announcements_active"
  | "weather_city"
  | "prayer_city"
  | "search_web"
  | "student_query"
  | "unknown";

export type IntentResult = {
  answer: string;
  details?: Record<string, unknown>;
};

export type MatchedIntent = {
  id: IntentId;
  confidence: number;
  params: Record<string, string>;
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};
