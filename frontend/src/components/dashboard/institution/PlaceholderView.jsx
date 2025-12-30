import React from 'react';

export default function PlaceholderView({ title, description, icon: Icon, color = 'emerald' }) {
  const colorClasses = {
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      gradient: 'from-emerald-100 to-emerald-200'
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      gradient: 'from-blue-100 to-blue-200'
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      gradient: 'from-purple-100 to-purple-200'
    },
    orange: {
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      gradient: 'from-orange-100 to-orange-200'
    },
    pink: {
      bg: 'bg-pink-50',
      text: 'text-pink-600',
      gradient: 'from-pink-100 to-pink-200'
    }
  };

  const colors = colorClasses[color] || colorClasses.emerald;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <div className={`w-20 h-20 bg-gradient-to-br ${colors.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
          {Icon && <Icon className={`w-10 h-10 ${colors.text}`} />}
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-500 max-w-md mx-auto">{description}</p>
        <div className="mt-6">
          <span className="inline-block px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
            Coming Soon
          </span>
        </div>
      </div>
    </div>
  );
}
