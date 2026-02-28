export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
        <a 
          href="/" 
          className="inline-block px-6 py-3 text-white rounded-lg transition-colors"
          style={{ backgroundColor: 'var(--ao-navy)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ao-text)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--ao-navy)'}
        >
          Go Home
        </a>
      </div>
    </div>
  );
}