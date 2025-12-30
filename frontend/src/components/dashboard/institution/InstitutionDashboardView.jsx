import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiBook, FiAward, FiMapPin, FiMail, FiPhone, FiGlobe } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

export default function InstitutionDashboardView({ institution }) {
  const navigate = useNavigate();
  
  if (!institution) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">No institution data available</p>
      </div>
    );
  }

  const brandColor = institution.branding?.primaryColor || '#10b981';
  const accentColor = institution.branding?.accentColor || brandColor;

  const stats = [
    { 
      icon: FiUsers, 
      label: 'Students', 
      value: institution.stats?.totalStudents?.toLocaleString() || '0', 
      color: 'from-blue-500 to-blue-600' 
    },
    { 
      icon: FiBook, 
      label: 'Courses', 
      value: institution.stats?.totalCourses?.toLocaleString() || '0', 
      color: 'from-purple-500 to-purple-600' 
    },
    { 
      icon: FiUsers, 
      label: 'Faculty', 
      value: institution.stats?.totalFaculty?.toLocaleString() || institution.stats?.totalTeachers?.toLocaleString() || '0', 
      color: 'from-green-500 to-green-600' 
    },
    { 
      icon: FiAward, 
      label: 'Departments', 
      value: institution.departments?.length || '0', 
      color: 'from-orange-500 to-orange-600' 
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Hero Section */}
      <div 
        className="relative overflow-hidden rounded-2xl p-8 text-white shadow-xl"
        style={{
          background: `linear-gradient(135deg, ${brandColor}, ${accentColor})`
        }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              {institution.branding?.logo ? (
                <img 
                  src={institution.branding.logo} 
                  alt={institution.name}
                  className="w-16 h-16 rounded-xl bg-white/20 p-2 object-contain"
                />
              ) : (
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <span className="text-2xl font-bold">
                    {institution.code || institution.name?.substring(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold">{institution.name}</h1>
                <p className="text-white/80 text-sm mt-1 capitalize">
                  {institution.type || 'Institution'} • Est. {institution.established || institution.establishedYear || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {institution.description && (
            <p className="text-white/90 max-w-3xl mb-6">{institution.description}</p>
          )}

          {/* Quick Info */}
          <div className="flex flex-wrap gap-4 text-sm">
            {institution.address?.city && (
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
                <FiMapPin className="w-4 h-4" />
                <span>{institution.address.city}, {institution.address.state || institution.address.country}</span>
              </div>
            )}
            {institution.contact?.email && (
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
                <FiMail className="w-4 h-4" />
                <span>{institution.contact.email}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
              <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* View Courses */}
        <button
          onClick={() => navigate(`/${institution.slug || institution._id}/courses`)}
          className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-emerald-500 hover:shadow-lg transition-all text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <FiBook className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Explore Courses</h3>
              <p className="text-sm text-gray-600">Browse available courses and programs</p>
            </div>
          </div>
        </button>

        {/* Contact */}
        {institution.contact?.website && (
          <a
            href={institution.contact.website}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-emerald-500 hover:shadow-lg transition-all text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <FiGlobe className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Visit Website</h3>
                <p className="text-sm text-gray-600">Learn more about the institution</p>
              </div>
            </div>
          </a>
        )}
      </div>

      {/* Departments */}
      {institution.departments && institution.departments.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Departments</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {institution.departments.map((dept, index) => (
              <div
                key={dept._id || dept.id || index}
                className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
              >
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold">
                  {dept.code}
                </span>
                <span className="text-sm text-gray-700 truncate">{dept.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
