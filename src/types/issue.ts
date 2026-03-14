export type IssueCategory =
  | "road"
  | "garbage"
  | "water"
  | "streetlight"
  | "sanitation";

export type IssuePriority = "low" | "medium" | "high";

export type IssueStatus =
  | "reported"
  | "assigned"
  | "in-progress"
  | "resolved";

export interface IssueLocation {
  latitude: number;
  longitude: number;
  address: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  priority: IssuePriority;
  status: IssueStatus;
  location: IssueLocation;
  images: string[];
  audioUrl?: string;
  resolvedImageUrl?: string;
  citizenId: string;
  citizenName?: string;
  citizenEmail?: string;
  assignedDepartment?: string;
  adminRemarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIssuePayload {
  title: string;
  description: string;
  category: IssueCategory;
  priority: IssuePriority;
  location: IssueLocation;
  images?: string[];
  audioUrl?: string;
}

export interface UpdateIssuePayload {
  id: string;
  status?: IssueStatus;
  assignedDepartment?: string;
  adminRemarks?: string;
  priority?: IssuePriority;
  resolvedImageUrl?: string;
}

export interface IssueFilters {
  category?: IssueCategory | "all";
  status?: IssueStatus | "all";
  priority?: IssuePriority | "all";
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface IssueStats {
  total: number;
  reported: number;
  assigned: number;
  inProgress: number;
  resolved: number;
}