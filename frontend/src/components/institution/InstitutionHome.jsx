import React, { useContext } from 'react';
import { InstitutionContext } from '../../App';
import { Link } from 'react-router-dom';
import { FiBook, FiUsers, FiTrendingUp } from 'react-icons/fi';

export default function InstitutionHome() {
  const { institution } = useContext(InstitutionContext);

  if (!institution) return null;

  const brandColor = institution.branding.primaryColor;

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <div 
        className="relative h-96 bg-gradient-to-br text-white"
        style={{ 
          background: `linear-gradient(135deg, ${brandColor}, ${institution.branding.accentColor || brandColor})` 
        }}
      >
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center">
          <div>
            <h1 className="text-5xl font-bold mb-4">Welcome to {institution.name}</h1>
            <p className="text-xl mb-6 opacity-90">{institution.description}</p>
            <Link 
              to={`/${institution.slug}/courses`}
              className="px-6 py-3 bg-white text-gray-800 rounded-lg font-semibold hover:bg-gray-100 inline-block"
            >
              Explore {institution.stats.totalCourses} Courses
            </Link>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Departments</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {institution.departments.map((dept) => (
            <div key={dept.id} className="bg-white border-2 rounded-lg p-4 hover:shadow-md transition-shadow" style={{ borderColor: `${brandColor}30` }}>
              <h4 className="font-semibold text-gray-800">{dept.name}</h4>
              <p className="text-sm text-gray-500">{dept.code}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
