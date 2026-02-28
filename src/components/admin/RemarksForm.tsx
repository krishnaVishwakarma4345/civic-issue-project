"use client";

import React               from "react";
import { useForm }         from "react-hook-form";
import { zodResolver }     from "@hookform/resolvers/zod";
import { Save }            from "lucide-react";
import Textarea            from "@/components/ui/Textarea";
import Button              from "@/components/ui/Button";
import { z }               from "zod";

const schema = z.object({
  remarks: z
    .string()
    .min(1, "Remarks cannot be empty")
    .max(500, "Must be under 500 characters"),
});

type FormData = z.infer<typeof schema>;

interface RemarksFormProps {
  defaultValue?: string;
  onSave:        (remarks: string) => Promise<void>;
  loading?:      boolean;
}

export default function RemarksForm({
  defaultValue = "",
  onSave,
  loading      = false,
}: RemarksFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver:      zodResolver(schema),
    defaultValues: { remarks: defaultValue },
  });

  const onSubmit = async (data: FormData) => {
    await onSave(data.remarks);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <Textarea
        label="Admin Remarks"
        placeholder="Add remarks visible to the citizen..."
        rows={4}
        showCount
        maxLength={500}
        value={watch("remarks")}
        error={errors.remarks?.message}
        {...register("remarks")}
      />
      <Button
        type="submit"
        variant="primary"
        size="sm"
        fullWidth
        loading={loading}
        leftIcon={<Save size={14} />}
      >
        Save Remarks
      </Button>
    </form>
  );
}