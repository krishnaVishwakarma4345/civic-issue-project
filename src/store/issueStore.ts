import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { Issue, IssueFilters } from "@/types/issue";

// ─── Types ───────────────────────────────────────────────────

interface IssueState {
  // Data
  issues:          Issue[];
  selectedIssue:   Issue | null;
  myIssues:        Issue[];

  // UI State
  loading:         boolean;
  submitting:      boolean;
  error:           string | null;
  filters:         IssueFilters;

  // Pagination
  hasMore:         boolean;
  total:           number;

  // Actions
  setIssues:       (issues: Issue[]) => void;
  setMyIssues:     (issues: Issue[]) => void;
  addIssue:        (issue: Issue) => void;
  updateIssue:     (id: string, updates: Partial<Issue>) => void;
  setSelected:     (issue: Issue | null) => void;
  setLoading:      (v: boolean) => void;
  setSubmitting:   (v: boolean) => void;
  setError:        (e: string | null) => void;
  setFilters:      (filters: IssueFilters) => void;
  resetFilters:    () => void;
  setHasMore:      (v: boolean) => void;
  setTotal:        (v: number) => void;
  clearIssues:     () => void;
}

const DEFAULT_FILTERS: IssueFilters = {
  category: "all",
  status:   "all",
  priority: "all",
  search:   "",
};

// ─── Store ───────────────────────────────────────────────────

export const useIssueStore = create<IssueState>()(
  devtools(
    (set, get) => ({
      issues:        [],
      selectedIssue: null,
      myIssues:      [],
      loading:       false,
      submitting:    false,
      error:         null,
      filters:       DEFAULT_FILTERS,
      hasMore:       false,
      total:         0,

      setIssues: (issues) =>
        set({ issues }, false, "issues/setIssues"),

      setMyIssues: (myIssues) =>
        set({ myIssues }, false, "issues/setMyIssues"),

      addIssue: (issue) =>
        set(
          (state) => ({
            issues:   [issue, ...state.issues],
            myIssues: [issue, ...state.myIssues],
            total:    state.total + 1,
          }),
          false,
          "issues/addIssue"
        ),

      updateIssue: (id, updates) =>
        set(
          (state) => ({
            issues: state.issues.map((i) =>
              i.id === id ? { ...i, ...updates } : i
            ),
            myIssues: state.myIssues.map((i) =>
              i.id === id ? { ...i, ...updates } : i
            ),
            selectedIssue:
              state.selectedIssue?.id === id
                ? { ...state.selectedIssue, ...updates }
                : state.selectedIssue,
          }),
          false,
          "issues/updateIssue"
        ),

      setSelected: (issue) =>
        set({ selectedIssue: issue }, false, "issues/setSelected"),

      setLoading: (loading) =>
        set({ loading }, false, "issues/setLoading"),

      setSubmitting: (submitting) =>
        set({ submitting }, false, "issues/setSubmitting"),

      setError: (error) =>
        set({ error }, false, "issues/setError"),

      setFilters: (filters) =>
        set(
          (state) => ({ filters: { ...state.filters, ...filters } }),
          false,
          "issues/setFilters"
        ),

      resetFilters: () =>
        set({ filters: DEFAULT_FILTERS }, false, "issues/resetFilters"),

      setHasMore: (hasMore) =>
        set({ hasMore }, false, "issues/setHasMore"),

      setTotal: (total) =>
        set({ total }, false, "issues/setTotal"),

      clearIssues: () =>
        set(
          { issues: [], myIssues: [], selectedIssue: null, total: 0 },
          false,
          "issues/clearIssues"
        ),
    }),
    { name: "IssueStore" }
  )
);