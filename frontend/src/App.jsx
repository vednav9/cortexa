import React, { createContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, Navigate } from 'react-router-dom';

// Data
import { getInstitutionBySlug } from './data/institutionsData';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import InstituteSignUp from './pages/InstituteSignUp';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';

// Institution Components
import InstitutionHome from './components/institution/InstitutionHome';
import CourseCatalog from './components/institution/CourseCatalog';
import CourseDetails from './components/institution/CourseDetails';

// Layout Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import InstitutionNavbar from './components/InstitutionNavbar';
import Sidebar from './components/dashboard/Sidebar';

// Context
export const InstitutionContext = createContext(null);
export const AuthContext = createContext(null);

// ============================================
// INSTITUTION LAYOUT (Institution Pages)
// ============================================
function InstitutionLayout({ children, institution, institutionSlug }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="flex flex-1">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          isInstitution={true} 
        />
        
        <div className="flex-1 flex flex-col">
          <InstitutionNavbar 
            institution={institution} 
            institutionSlug={institutionSlug}
            onMenuClick={() => setSidebarOpen(true)} 
          />
          
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

// ============================================
// INSTITUTION ROUTER (Handle Dynamic Slugs)
// ============================================
function InstitutionRouter() {
  const { institutionSlug } = useParams();
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const inst = getInstitutionBySlug(institutionSlug);
    setInstitution(inst);
    setLoading(false);
  }, [institutionSlug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!institution) {
    return <Navigate to="/404" replace />;
  }

  return (
    <InstitutionContext.Provider value={{ institution }}>
      <Routes>
        <Route 
          path="/" 
          element={
            <InstitutionLayout institution={institution} institutionSlug={institutionSlug}>
              <InstitutionHome />
            </InstitutionLayout>
          } 
        />
        <Route 
          path="/courses" 
          element={
            <InstitutionLayout institution={institution} institutionSlug={institutionSlug}>
              <CourseCatalog />
            </InstitutionLayout>
          } 
        />
        <Route 
          path="/courses/:courseId" 
          element={
            <InstitutionLayout institution={institution} institutionSlug={institutionSlug}>
              <CourseDetails />
            </InstitutionLayout>
          } 
        />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </InstitutionContext.Provider>
  );
}

// ============================================
// MAIN APP COMPONENT
// ============================================
function App() {
  const [user, setUser] = useState(null);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/institute-signup" element={<InstituteSignUp />} />

          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/:institutionSlug/*" element={<InstitutionRouter />} />

          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
