import React from 'react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-6">Institution not found</p>
          <a href="/" className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            Go to Home
          </a>
        </div>
      </div>
  )
}
