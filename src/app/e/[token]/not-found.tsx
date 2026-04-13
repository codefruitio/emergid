export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">&#9888;&#65039;</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Record Not Found
        </h1>
        <p className="text-gray-600">
          This medical ID link is no longer active. The record may have been
          deleted by the owner or expired due to inactivity.
        </p>
      </div>
    </div>
  );
}
