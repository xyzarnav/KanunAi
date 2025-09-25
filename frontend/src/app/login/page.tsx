'use client';

export default function LoginPage() {

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Use Auth0 to authenticate
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div>
            <button
              onClick={() => window.location.href = '/api/auth/login'}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign in with Auth0
            </button>
          </div>
          <div className="text-center">
            <a 
              href="/" 
              className="text-indigo-600 hover:text-indigo-500"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
