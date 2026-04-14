"use client";

import { useState } from "react";

export interface ProfileData {
  bloodType: string;
  allergies: string[];
  medications: string[];
  conditions: string[];
  physicianName: string;
  physicianPhone: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
}

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function TagInput({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");

  const addItem = () => {
    const trimmed = input.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
      setInput("");
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
          placeholder={placeholder}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
        />
        <button
          type="button"
          onClick={addItem}
          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
        >
          Add
        </button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {values.map((v, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
            >
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter((_, j) => j !== i))}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProfileForm({
  initialData,
  onSubmit,
  submitLabel = "Save",
}: {
  initialData?: Partial<ProfileData>;
  onSubmit: (data: ProfileData) => Promise<void>;
  submitLabel?: string;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProfileData>({
    bloodType: initialData?.bloodType || "",
    allergies: initialData?.allergies || [],
    medications: initialData?.medications || [],
    conditions: initialData?.conditions || [],
    physicianName: initialData?.physicianName || "",
    physicianPhone: initialData?.physicianPhone || "",
    emergencyContactRelation: initialData?.emergencyContactRelation || "",
    emergencyContactPhone: initialData?.emergencyContactPhone || "",
  });

  const update = (field: keyof ProfileData, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Blood Type
        </label>
        <select
          value={form.bloodType}
          onChange={(e) => update("bloodType", e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
        >
          <option value="">Select...</option>
          {BLOOD_TYPES.map((bt) => (
            <option key={bt} value={bt}>
              {bt}
            </option>
          ))}
        </select>
      </div>

      <TagInput
        label="Allergies"
        values={form.allergies}
        onChange={(v) => update("allergies", v)}
        placeholder="e.g. Penicillin"
      />

      <TagInput
        label="Current Medications"
        values={form.medications}
        onChange={(v) => update("medications", v)}
        placeholder="e.g. Metformin 500mg twice daily"
      />

      <TagInput
        label="Medical Conditions"
        values={form.conditions}
        onChange={(v) => update("conditions", v)}
        placeholder="e.g. Type 2 Diabetes"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Physician Name
          </label>
          <input
            type="text"
            value={form.physicianName}
            onChange={(e) => update("physicianName", e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Physician Phone
          </label>
          <input
            type="tel"
            value={form.physicianPhone}
            onChange={(e) => update("physicianPhone", e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Emergency Contact (Relationship)
          </label>
          <input
            type="text"
            value={form.emergencyContactRelation}
            onChange={(e) => update("emergencyContactRelation", e.target.value)}
            placeholder="e.g. Spouse"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Emergency Contact Phone
          </label>
          <input
            type="tel"
            value={form.emergencyContactPhone}
            onChange={(e) => update("emergencyContactPhone", e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
      >
        {saving ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
