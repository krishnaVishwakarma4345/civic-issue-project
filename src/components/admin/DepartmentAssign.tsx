"use client";

import React              from "react";
import { Building2 }      from "lucide-react";
import Select             from "@/components/ui/Select";
import Button             from "@/components/ui/Button";
import { DEPARTMENTS }    from "@/lib/constants/departments";

interface DepartmentAssignProps {
  current?:  string;
  onAssign:  (deptId: string) => Promise<void>;
  loading?:  boolean;
}

const DEPT_OPTIONS = DEPARTMENTS.map((d) => ({
  value: d.id,
  label: d.name,
}));

export default function DepartmentAssign({
  current,
  onAssign,
  loading = false,
}: DepartmentAssignProps) {
  const [selected, setSelected] = React.useState(current ?? "");

  return (
    <div className="space-y-3">
      <Select
        label="Department"
        options={DEPT_OPTIONS}
        placeholder="Select department"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      />
      <Button
        variant="primary"
        size="sm"
        fullWidth
        loading={loading}
        disabled={!selected || selected === current}
        leftIcon={<Building2 size={14} />}
        onClick={() => onAssign(selected)}
      >
        Assign Department
      </Button>
    </div>
  );
}