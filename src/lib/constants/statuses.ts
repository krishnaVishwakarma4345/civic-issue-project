import { IssueStatus } from "@/types/issue";

export interface StatusMeta {
  value: IssueStatus;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
  step: number;
  description: string;
}

export const STATUSES: StatusMeta[] = [
  {
    value: "reported",
    label: "Reported",
    color: "text-red-700",
    bgColor: "bg-red-100",
    borderColor: "border-red-300",
    dotColor: "bg-red-500",
    step: 1,
    description: "Issue has been reported by citizen",
  },
  {
    value: "assigned",
    label: "Assigned",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
    borderColor: "border-orange-300",
    dotColor: "bg-orange-500",
    step: 2,
    description: "Issue assigned to a department",
  },
  {
    value: "in-progress",
    label: "In Progress",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
    borderColor: "border-yellow-300",
    dotColor: "bg-yellow-500",
    step: 3,
    description: "Department is working on the issue",
  },
  {
    value: "resolved",
    label: "Resolved",
    color: "text-green-700",
    bgColor: "bg-green-100",
    borderColor: "border-green-300",
    dotColor: "bg-green-500",
    step: 4,
    description: "Issue has been fully resolved",
  },
];

export const STATUS_MAP = STATUSES.reduce(
  (acc, s) => {
    acc[s.value] = s;
    return acc;
  },
  {} as Record<IssueStatus, StatusMeta>
);

export const getStatusMeta = (value: IssueStatus): StatusMeta => {
  return STATUS_MAP[value] ?? STATUSES[0];
};

export const STATUS_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  reported: ["assigned"],
  assigned: ["in-progress"],
  "in-progress": ["resolved"],
  resolved: [],
};