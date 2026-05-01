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

export default function MedicalCard({ data }: { data: MedicalData }) {
  const allergies = parseJsonArray(data.allergies);
  const medications = parseJsonArray(data.medications);
  const conditions = parseJsonArray(data.conditions);

  const formattedDate = new Date(data.lastUpdated).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative bg-white border-b border-gray-100">
        <div className="absolute top-0 left-0 right-0 h-1 bg-red-600" />
        <div className="max-w-lg mx-auto px-5 pt-5 pb-4 flex items-center gap-3">
          <div className="flex items-center gap-1.5 flex-1">
            <svg
              className="w-4 h-4 text-red-600 flex-shrink-0"
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
            <span className="text-xs font-bold tracking-widest uppercase text-gray-900">
              emergID
            </span>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-gray-400 text-xs">Updated</div>
            <div className="text-gray-700 text-xs font-semibold tabular-nums">
              {formattedDate}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {/* Name notice */}
        <p className="text-center text-xs text-gray-400 py-1">
          Patient name is on the physical NFC tag — check tag label for ID
        </p>

        {/* Blood Type */}
        {data.bloodType && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 pt-5 pb-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
                Blood Type
              </div>
              <div className="text-8xl font-black text-gray-900 leading-none tracking-tight">
                {data.bloodType}
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-red-600 to-red-300" />
          </div>
        )}

        {/* Allergies */}
        {allergies.length > 0 ? (
          <div className="bg-red-600 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <svg
                className="w-5 h-5 text-white flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
              <span className="text-white font-bold text-sm uppercase tracking-wider">
                Allergy Alert
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {allergies.map((a, i) => (
                <span
                  key={i}
                  className="bg-white/20 text-white px-3 py-1.5 rounded-lg font-bold text-base"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 flex items-center gap-3">
            <svg
              className="w-5 h-5 text-emerald-500 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-emerald-800 font-medium text-sm">
              No known allergies on file
            </span>
          </div>
        )}

        {/* Medical Conditions */}
        {conditions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              Medical Conditions
            </div>
            <div className="flex flex-wrap gap-2">
              {conditions.map((c, i) => (
                <span
                  key={i}
                  className="bg-gray-100 text-gray-800 px-3 py-1.5 rounded-lg text-sm font-medium"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Medications */}
        {medications.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              Current Medications
            </div>
            <div className="flex flex-wrap gap-2">
              {medications.map((m, i) => (
                <span
                  key={i}
                  className="bg-blue-50 border border-blue-100 text-blue-800 px-3 py-1.5 rounded-lg text-sm font-medium"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Physician */}
        {(data.physicianName || data.physicianPhone) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
              Physician
            </div>
            {data.physicianName && (
              <div className="font-semibold text-gray-900">
                {data.physicianName}
              </div>
            )}
            {data.physicianPhone && (
              <a
                href={`tel:${data.physicianPhone}`}
                className="text-blue-600 font-medium text-sm mt-1 inline-block"
              >
                {data.physicianPhone}
              </a>
            )}
          </div>
        )}

        {/* Emergency Contact */}
        {(data.emergencyContactRelation || data.emergencyContactPhone) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
              Emergency Contact
            </div>
            {data.emergencyContactRelation && (
              <div className="font-semibold text-gray-900 mb-3">
                {data.emergencyContactRelation}
              </div>
            )}
            {data.emergencyContactPhone && (
              <a
                href={`tel:${data.emergencyContactPhone}`}
                className="flex items-center justify-center gap-2.5 w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-semibold text-lg transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                  />
                </svg>
                {data.emergencyContactPhone}
              </a>
            )}
          </div>
        )}

        <div className="pb-2" />
      </div>
    </div>
  );
}
