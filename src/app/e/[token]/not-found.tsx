export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-white border-b border-gray-100">
        <div className="px-5 py-4 flex items-center gap-1.5">
          <svg
            className="w-4 h-4 text-red-600"
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
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Record Not Found
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            This medical ID link is no longer active. The record may have been
            deleted by the owner or expired due to inactivity.
          </p>
        </div>
      </div>
    </div>
  );
}
