export const institutionsData = [
  {
    id: 1,
    slug: 'mumbai-university',
    name: 'University of Mumbai',
    shortName: 'MU',
    tagline: 'Gateway to Excellence',
    type: 'University',
    established: 1857,
    location: {
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      address: 'Kalina, Santacruz East, Mumbai - 400098'
    },
    contact: {
      email: 'info@mu.ac.in',
      phone: '+91 22 2654 3000',
      website: 'https://www.mu.ac.in'
    },
    branding: {
      primaryColor: '#0052A5',
      secondaryColor: '#FFD700',
      accentColor: '#003366',
      logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f5/University_of_Mumbai_coat_of_arms.svg/150px-University_of_Mumbai_coat_of_arms.svg.png',
      banner: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1200',
      favicon: '/favicon-mu.ico'
    },
    description: 'University of Mumbai is one of the oldest and premier universities in India, offering diverse programs across multiple disciplines.',
    departments: [
      { id: 1, name: 'Computer Science', code: 'CS', head: 'Dr. Rajesh Sharma' },
      { id: 2, name: 'Information Technology', code: 'IT', head: 'Dr. Priya Deshmukh' },
      { id: 3, name: 'Electronics', code: 'EXTC', head: 'Dr. Amit Kumar' },
      { id: 4, name: 'Mechanical Engineering', code: 'MECH', head: 'Dr. Suresh Patil' },
      { id: 5, name: 'Commerce', code: 'COM', head: 'Dr. Neha Agarwal' }
    ],
    stats: {
      totalStudents: 45000,
      totalFaculty: 850,
      totalCourses: 320,
      activeSemesters: 2
    }
  },
  
  {
    id: 2,
    slug: 'iit-bombay',
    name: 'Indian Institute of Technology Bombay',
    shortName: 'IIT Bombay',
    tagline: 'Excellence in Science and Technology',
    type: 'Institute',
    established: 1958,
    location: {
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      address: 'Powai, Mumbai - 400076'
    },
    contact: {
      email: 'info@iitb.ac.in',
      phone: '+91 22 2576 4545',
      website: 'https://www.iitb.ac.in'
    },
    branding: {
      primaryColor: '#003D7A',
      secondaryColor: '#FFFFFF',
      accentColor: '#00B4D8',
      logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1d/Indian_Institute_of_Technology_Bombay_Logo.svg/150px-Indian_Institute_of_Technology_Bombay_Logo.svg.png',
      banner: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200',
      favicon: '/favicon-iitb.ico'
    },
    description: 'IIT Bombay is a premier engineering institution recognized globally for research and innovation in science, engineering, and technology.',
    departments: [
      { id: 1, name: 'Computer Science & Engineering', code: 'CSE', head: 'Prof. Sunita Sarawagi' },
      { id: 2, name: 'Electrical Engineering', code: 'EE', head: 'Prof. Vikram Gadre' },
      { id: 3, name: 'Mechanical Engineering', code: 'ME', head: 'Prof. Arunkumar Sridharan' },
      { id: 4, name: 'Civil Engineering', code: 'CE', head: 'Prof. Deepak Kunzru' },
      { id: 5, name: 'Aerospace Engineering', code: 'AE', head: 'Prof. Ravi Ravikumar' }
    ],
    stats: {
      totalStudents: 10500,
      totalFaculty: 650,
      totalCourses: 280,
      activeSemesters: 2
    }
  },
  
  {
    id: 3,
    slug: 'stanford',
    name: 'Stanford University',
    shortName: 'Stanford',
    tagline: 'The wind of freedom blows',
    type: 'University',
    established: 1885,
    location: {
      city: 'Stanford',
      state: 'California',
      country: 'USA',
      address: '450 Serra Mall, Stanford, CA 94305'
    },
    contact: {
      email: 'admission@stanford.edu',
      phone: '+1 (650) 723-2300',
      website: 'https://www.stanford.edu'
    },
    branding: {
      primaryColor: '#8C1515',
      secondaryColor: '#FFFFFF',
      accentColor: '#B1040E',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Seal_of_Leland_Stanford_Junior_University.svg/150px-Seal_of_Leland_Stanford_Junior_University.svg.png',
      banner: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=1200',
      favicon: '/favicon-stanford.ico'
    },
    description: 'Stanford University is a world-renowned research university located in Silicon Valley, known for innovation, entrepreneurship, and academic excellence.',
    departments: [
      { id: 1, name: 'Computer Science', code: 'CS', head: 'Prof. Jennifer Widom' },
      { id: 2, name: 'Artificial Intelligence', code: 'AI', head: 'Prof. Andrew Ng' },
      { id: 3, name: 'Business Administration', code: 'MBA', head: 'Prof. Jonathan Levav' },
      { id: 4, name: 'Medicine', code: 'MED', head: 'Dr. Lloyd Minor' },
      { id: 5, name: 'Law', code: 'LAW', head: 'Prof. Jenny Martinez' }
    ],
    stats: {
      totalStudents: 17200,
      totalFaculty: 2240,
      totalCourses: 450,
      activeSemesters: 4
    }
  },
  
  {
    id: 4,
    slug: 'mit',
    name: 'Massachusetts Institute of Technology',
    shortName: 'MIT',
    tagline: 'Mens et Manus - Mind and Hand',
    type: 'Institute',
    established: 1861,
    location: {
      city: 'Cambridge',
      state: 'Massachusetts',
      country: 'USA',
      address: '77 Massachusetts Avenue, Cambridge, MA 02139'
    },
    contact: {
      email: 'admissions@mit.edu',
      phone: '+1 (617) 253-1000',
      website: 'https://www.mit.edu'
    },
    branding: {
      primaryColor: '#A31F34',
      secondaryColor: '#8A8B8C',
      accentColor: '#750014',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/MIT_logo.svg/150px-MIT_logo.svg.png',
      banner: 'https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=1200',
      favicon: '/favicon-mit.ico'
    },
    description: 'MIT is a world-class research institution dedicated to advancing knowledge and educating students in science, technology, and other areas.',
    departments: [
      { id: 1, name: 'Electrical Engineering & Computer Science', code: 'EECS', head: 'Prof. Anantha Chandrakasan' },
      { id: 2, name: 'Mathematics', code: 'MATH', head: 'Prof. Michel Goemans' },
      { id: 3, name: 'Physics', code: 'PHYS', head: 'Prof. Nergis Mavalvala' },
      { id: 4, name: 'Mechanical Engineering', code: 'ME', head: 'Prof. Evelyn Wang' },
      { id: 5, name: 'Management', code: 'SLOAN', head: 'Prof. David Schmittlein' }
    ],
    stats: {
      totalStudents: 11934,
      totalFaculty: 1050,
      totalCourses: 380,
      activeSemesters: 2
    }
  },
  
  {
    id: 5,
    slug: 'oxford',
    name: 'University of Oxford',
    shortName: 'Oxford',
    tagline: 'Dominus Illuminatio Mea - The Lord is My Light',
    type: 'University',
    established: 1096,
    location: {
      city: 'Oxford',
      state: 'Oxfordshire',
      country: 'United Kingdom',
      address: 'Wellington Square, Oxford OX1 2JD'
    },
    contact: {
      email: 'enquiries@admin.ox.ac.uk',
      phone: '+44 1865 270000',
      website: 'https://www.ox.ac.uk'
    },
    branding: {
      primaryColor: '#002147',
      secondaryColor: '#C5D0E0',
      accentColor: '#003D73',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Oxford-University-Circlet.svg/150px-Oxford-University-Circlet.svg.png',
      banner: 'https://images.unsplash.com/photo-1580537659466-0a9bfa916a54?w=1200',
      favicon: '/favicon-oxford.ico'
    },
    description: 'The University of Oxford is the oldest university in the English-speaking world and a world leader in research and education.',
    departments: [
      { id: 1, name: 'Computer Science', code: 'CS', head: 'Prof. Michael Wooldridge' },
      { id: 2, name: 'Engineering Science', code: 'ENG', head: 'Prof. Patrick Grant' },
      { id: 3, name: 'Mathematics', code: 'MATH', head: 'Prof. Frances Kirwan' },
      { id: 4, name: 'Physics', code: 'PHYS', head: 'Prof. Ian Shipsey' },
      { id: 5, name: 'Economics', code: 'ECON', head: 'Prof. Andrea Prat' }
    ],
    stats: {
      totalStudents: 24299,
      totalFaculty: 7100,
      totalCourses: 520,
      activeSemesters: 3
    }
  }
];

// Helper function to get institution by slug
export const getInstitutionBySlug = (slug) => {
  return institutionsData.find(inst => inst.slug === slug.toLowerCase());
};

// Helper function to get all institution slugs (for routing)
export const getAllInstitutionSlugs = () => {
  return institutionsData.map(inst => inst.slug);
};

// Helper function to search institutions
export const searchInstitutions = (query) => {
  const lowerQuery = query.toLowerCase();
  return institutionsData.filter(inst => 
    inst.name.toLowerCase().includes(lowerQuery) ||
    inst.shortName.toLowerCase().includes(lowerQuery) ||
    inst.location.city.toLowerCase().includes(lowerQuery)
  );
};
