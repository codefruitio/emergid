export interface MedicalData {
  bloodType: string | null;
  allergies: string | null;
  medications: string | null;
  conditions: string | null;
  physicianName: string | null;
  physicianPhone: string | null;
  emergencyContactRelation: string | null;
  emergencyContactPhone: string | null;
  lastUpdated: string;
}

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-gray-100 py-4 last:border-b-0">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
        {title}
      </h2>
      <div className="text-gray-900">{children}</div>
    </div>
  );
}

function PillList({ items }: { items: string[] }) {
  if (items.length === 0)
    return <span className="text-gray-400 text-sm">None listed</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span
          key={i}
          className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export default function MedicalCard({ data }: { data: MedicalData }) {
  const allergies = parseJsonArray(data.allergies);
  const medications = parseJsonArray(data.medications);
  const conditions = parseJsonArray(data.conditions);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-red-600 text-white px-6 py-5">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <svg
              className="w-7 h-7 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                Emergency Medical Information
              </h1>
              <p className="text-red-200 text-xs mt-0.5 font-medium tracking-wider uppercase">
                emergID
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-6 py-5">
        {/* Name notice */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-5">
          <p className="text-blue-700 text-sm">
            <strong>Patient name</strong> is printed on the physical NFC tag or
            wearable — check the tag label for identification.
          </p>
        </div>

        {/* Allergies — highlighted if present */}
        {allergies.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-red-600 mb-2">
              ⚠ Allergies
            </h2>
            <div className="flex flex-wrap gap-2">
              {allergies.map((a, i) => (
                <span
                  key={i}
                  className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-lg text-sm font-semibold"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {allergies.length === 0 && (
          <Section title="Allergies">
            <span className="text-gray-400 text-sm">None listed</span>
          </Section>
        )}

        {data.bloodType && (
          <Section title="Blood Type">
            <span className="text-3xl font-bold tracking-tight">
              {data.bloodType}
            </span>
          </Section>
        )}

        <Section title="Medical Conditions">
          <PillList items={conditions} />
        </Section>

        <Section title="Current Medications">
          <PillList items={medications} />
        </Section>

        {(data.physicianName || data.physicianPhone) && (
          <Section title="Physician">
            {data.physicianName && (
              <div className="font-medium">{data.physicianName}</div>
            )}
            {data.physicianPhone && (
              <a
                href={`tel:${data.physicianPhone}`}
                className="text-blue-600 underline text-sm"
              >
                {data.physicianPhone}
              </a>
            )}
          </Section>
        )}

        {(data.emergencyContactRelation || data.emergencyContactPhone) && (
          <Section title="Emergency Contact">
            {data.emergencyContactRelation && (
              <div className="font-medium">{data.emergencyContactRelation}</div>
            )}
            {data.emergencyContactPhone && (
              <a
                href={`tel:${data.emergencyContactPhone}`}
                className="text-blue-600 underline font-semibold text-lg"
              >
                {data.emergencyContactPhone}
              </a>
            )}
          </Section>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-400">
          Last updated:{" "}
          {new Date(data.lastUpdated).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>
    </div>
  );
}
