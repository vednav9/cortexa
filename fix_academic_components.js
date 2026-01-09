// Fix script for academic structure components
const fs = require('fs');
const path = require('path');

const componentsDir = 'frontend/src/components/institution/academic/academic-structure';

const fixes = [
  {
    file: 'Courses.jsx',
    updates: [
      // Fix data parsing
      {
        find: /setCourses\(Array\.isArray\(coursesRes\.data\) \? coursesRes\.data : \[\]\);/,
        replace: 'setCourses(Array.isArray(coursesRes.data.data || coursesRes.data) ? (coursesRes.data.data || coursesRes.data) : []);'
      },
      {
        find: /setDepartments\(Array\.isArray\(deptsRes\.data\) \? deptsRes\.data : \[\]\);/,
        replace: 'setDepartments(Array.isArray(deptsRes.data.data || deptsRes.data) ? (deptsRes.data.data || deptsRes.data) : []);'
      },
      {
        find: /setSemesters\(Array\.isArray\(semsRes\.data\) \? semsRes\.data : \[\]\);/,
        replace: 'setSemesters(Array.isArray(semsRes.data.data || semsRes.data) ? (semsRes.data.data || semsRes.data) : []);'
      },
      // Add toast import
      {
        find: "import GenericPage from '../../shared/GenericPage';",
        replace: "import GenericPage from '../../shared/GenericPage';\nimport toast from 'react-hot-toast';"
      },
      // Replace alert with toast
      {
        find: /alert\(/g,
        replace: 'toast.error('
      },
      // Add success toasts
      {
        find: /(await academicAPI\.createCourse\(institution\._id, formData\);)/,
        replace: '$1\n        toast.success(\'Course created successfully!\');'
      },
      {
        find: /(await academicAPI\.updateCourse\(editingCourse\._id, formData\);)/,
        replace: '$1\n        toast.success(\'Course updated successfully!\');'
      },
      {
        find: /(await academicAPI\.deleteCourse\(id\);)/,
        replace: '$1\n      toast.success(\'Course deleted successfully!\');'
      }
    ]
  },
  {
    file: 'Calendar.jsx',
    updates: [
      // Similar fixes for Calendar component
    ]
  },
  {
    file: 'Faculty.jsx',
    updates: [
      // Similar fixes for Faculty component
    ]
  }
];

console.log('Fix script created. Run manually for each component.');
