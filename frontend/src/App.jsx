import { BrowserRouter as Router, Routes, Route, useParams, Navigate } from 'react-router-dom';
import { useEffect, useState, createContext } from 'react';
import { getInstitutionBySlug } from './data/institutionsData';

import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import InstituteSignUp from './pages/InstituteSignUp';
import NotFound from './pages/NotFound';
import Dashboard from './pages/Dashboard';

import InstitutionHome from './components/institution/InstitutionHome';
import CourseCatalog from './components/institution/CourseCatalog';
import CourseDetails from './components/institution/CourseDetails';

import About from './components/About';
import Features from './components/Features';
import Reviews from './components/Reviews';
import Contact from './components/ContactUs';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import InstitutionNavbar from './components/InstitutionNavbar';

export const InstitutionContext = createContext(null);
export const AuthContext = createContext(null);

function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}

function InstitutionLayout({ children, institution, institutionSlug }) {
  return (
    <>
      <Navbar/>
      <InstitutionNavbar institution={institution} institutionSlug={institutionSlug} />
      {children}
      <Footer />
    </>
  );
}

// Institution Router with Access Control
function InstitutionRouter() {
  const { institutionSlug } = useParams();
  const [institutionData, setInstitutionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Mock user - Replace with real auth
  const [user] = useState({
    id: 1,
    isAuthenticated: true,
    institutionAccess: {
      [institutionSlug]: {
        hasAccess: true,
        role: 'student',
        status: 'active'
      }
    }
  });

  useEffect(() => {
    const fetchInstitution = async () => {
      try {
        const data = getInstitutionBySlug(institutionSlug);
        
        if (data) {
          setInstitutionData(data);
          setLoading(false);
        } else {
          setError(true);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching institution:', err);
        setError(true);
        setLoading(false);
      }
    };
    
    fetchInstitution();
  }, [institutionSlug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading {institutionSlug}...</p>
        </div>
      </div>
    );
  }

  if (error || !institutionData) {
    return <NotFound />;
  }

  const userAccess = user.institutionAccess?.[institutionSlug];
  const hasAccess = userAccess?.hasAccess && userAccess?.status === 'active';

  return (
    <InstitutionContext.Provider value={{ 
      institution: institutionData, 
      userAccess: userAccess || null,
      hasAccess 
    }}>
      <AuthContext.Provider value={{ user }}>
        <Routes>
          {/* Public Institution Pages */}
          <Route 
            path="/" 
            element={
              <InstitutionLayout institution={institutionData} institutionSlug={institutionSlug}>
                <InstitutionHome />
              </InstitutionLayout>
            } 
          />
          <Route 
            path="/courses" 
            element={
              <InstitutionLayout institution={institutionData} institutionSlug={institutionSlug}>
                <CourseCatalog hasAccess={hasAccess} />
              </InstitutionLayout>
            } 
          />
          <Route 
            path="/courses/:courseId" 
            element={
              <InstitutionLayout institution={institutionData} institutionSlug={institutionSlug}>
                <CourseDetails hasAccess={hasAccess} />
              </InstitutionLayout>
            } 
          />
          
          <Route 
            path="/login" 
            element={
              <InstitutionLayout institution={institutionData} institutionSlug={institutionSlug}>
                <Login institutionSlug={institutionSlug} />
              </InstitutionLayout>
            } 
          />
          <Route 
            path="/signup" 
            element={
              <InstitutionLayout institution={institutionData} institutionSlug={institutionSlug}>
                <SignUp institutionSlug={institutionSlug} />
              </InstitutionLayout>
            } 
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthContext.Provider>
    </InstitutionContext.Provider>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Main Platform Routes */}
        <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
        <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
        <Route path="/features" element={<PublicLayout><Features /></PublicLayout>} />
        <Route path="/reviews" element={<PublicLayout><Reviews /></PublicLayout>} />
        <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
        <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
        <Route path="/signup" element={<PublicLayout><SignUp /></PublicLayout>} />
        <Route path="/institute-signup" element={<PublicLayout><InstituteSignUp /></PublicLayout>} />

        <Route path="/dashboard" element={<PublicLayout><Dashboard /></PublicLayout>} />

        <Route path="/:institutionSlug/*" element={<InstitutionRouter />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
