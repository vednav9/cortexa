import React, { createContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, Navigate, Outlet } from 'react-router-dom';

// Data
import { getInstitutionBySlug } from './data/institutionsData';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import InstituteSignUp from './pages/InstituteSignUp';
import CortexaDashboard from "./components/dashboard/CortexaDashboard";
// import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import { useAuth } from "./context/authcontext";



// Institution Components
import InstitutionHome from './components/institution/InstitutionHome';
import CourseCatalog from './components/institution/CourseCatalog';
import CourseDetails from './components/institution/CourseDetails';

// Layout Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import InstitutionNavbar from './components/InstitutionNavbar';
import Sidebar from './components/dashboard/Sidebar';
import Notifications from './components/dashboard/Notifications';
import AddUsersTab from './components/dashboard/AddUsersTab';
import { AuthProvider } from "./context/authcontext";


// Context
export const InstitutionContext = createContext(null);
// export const AuthContext = createContext(null);

// ============================================
// INSTITUTION LAYOUT (Institution Pages)
// ============================================
function InstitutionLayout({ children, institution, institutionSlug }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
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
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-emerald-400 text-xl">Loading...</p>
        </div>
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

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-emerald-400">
        Checking session…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

function App() {
  // const [user, setUser] = useState(null);

  return (
    <AuthProvider>

      <Router>
        <div className="flex flex-col min-h-screen bg-black">
          <Navbar />

          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/institute-signup" element={<InstituteSignUp />} />

              <Route path="/dashboard" element={<ProtectedRoute />}>
                <Route index element={<CortexaDashboard />} />
              </Route>


              <Route path="/:institutionSlug/*" element={<InstitutionRouter />} />
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>

          {/* <Footer /> */}
        </div>
      </Router>
    </AuthProvider>

  );
}

export default App;
