export interface CategoryCount {
  category: string;
  count: number;
}

export interface MonthlyTrend {
  month: string;
  reported: number;
  resolved: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

export interface PriorityDistribution {
  priority: string;
  count: number;
}

export interface AnalyticsSummary {
  totalIssues: number;
  pendingIssues: number;
  resolvedIssues: number;
  inProgressIssues: number;
  resolutionRate: number;
  avgResolutionDays: number;
  categoryBreakdown: CategoryCount[];
  monthlyTrend: MonthlyTrend[];
  statusDistribution: StatusDistribution[];
  priorityDistribution: PriorityDistribution[];
}