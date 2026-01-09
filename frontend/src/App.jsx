import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import InstituteSignUp from "./pages/InstituteSignUp";
import NotFound from "./pages/NotFound";
import InstitutionLayout from "./layout/InstitutionLayout";
import InstitutionHome from "./components/institution/InstitutionHome";
import CourseCatalog from "./components/institution/CourseCatalog";
import CourseDetails from "./components/institution/CourseDetails";

// Institution Pages - Organized by Role
// Admin Pages
import ManageUsers from "./components/institution/admin/ManageUsers";
import InvitePeople from "./components/institution/admin/InvitePeople";

// Teacher Pages
import SeeStudents from "./components/institution/teacher/SeeStudents";
import UploadNotes from "./components/institution/teacher/UploadNotes";
import GenerateMCQ from "./components/institution/teacher/GenerateMCQ";
import VoiceToText from "./components/institution/teacher/VoiceToText";
import Assessment from "./components/institution/teacher/Assessment";

// Student Pages
import RAGChatbot from "./components/institution/student/RAGChatbot";
import MCQTest from "./components/institution/student/MCQTest";
import QASection from "./components/institution/student/QASection";

// Shared Pages (All Roles)
import Announcements from "./components/institution/shared/Announcements";
import QueryDesk from "./components/institution/shared/QueryDesk";
import QAPortal from "./components/institution/shared/QAPortal";
import AIChatbot from "./components/institution/shared/AIChatbot";

// Academic Structure Pages
import AcademicStructure from "./components/institution/academic/AcademicStructure";
import Departments from "./components/institution/academic/academic-structure/Departments";
import AcademicCourses from "./components/institution/academic/academic-structure/Courses";
import Semesters from "./components/institution/academic/academic-structure/Semesters";
import Calendar from "./components/institution/academic/academic-structure/Calendar";
import Faculty from "./components/institution/academic/academic-structure/Faculty";


// Dashboard
import CortexaDashboard from "./components/dashboard/CortexaDashboard";
import CortexaAdminLogin from "./components/dashboard/cortexaAdminLogin";
// Layout
import Navbar from "./components/Navbar";

// Auth
import { useAuth } from "./context/authcontext";

/* ===========================
   Protected Route (OLD STYLE)
=========================== */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Checking session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

/* ===========================
   App
=========================== */
function App() {
  return (

    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar />

        <main className="flex-1">
          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cortexaAdminLogin" element={<CortexaAdminLogin />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/institute-signup" element={<InstituteSignUp />} />

            {/* Protected */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <CortexaDashboard />
                </ProtectedRoute>
              }
            />

            {/* Institution Routes */}   {/* PUBLIC INSTITUTION ROUTES */}
            <Route path="/:slug" element={<InstitutionLayout />}>
              <Route index element={<InstitutionHome />} />
              <Route path="announcements" element={<Announcements />} />
              <Route path="invite-people" element={<InvitePeople />} />
              <Route path="manage-users" element={<ManageUsers />} />
              <Route path="query-desk" element={<QueryDesk />} />
              <Route path="academic-structure" element={<AcademicStructure />} />

              {/* Academic Structure Nested Routes */}
              <Route path="academic-structure/departments" element={<Departments />} />
              <Route path="academic-structure/courses" element={<AcademicCourses />} />
              <Route path="academic-structure/semesters" element={<Semesters />} />
              <Route path="academic-structure/calendar" element={<Calendar />} />
              <Route path="academic-structure/faculty" element={<Faculty />} />

              <Route path="see-students" element={<SeeStudents />} />
              <Route path="upload-notes" element={<UploadNotes />} />
              <Route path="generate-mcq" element={<GenerateMCQ />} />
              <Route path="voice-to-text" element={<VoiceToText />} />
              <Route path="qa-portal" element={<QAPortal />} />
              <Route path="assessment" element={<Assessment />} />
              <Route path="ai-chatbot" element={<AIChatbot />} />
              <Route path="rag-chatbot" element={<RAGChatbot />} />
              <Route path="mcq-test" element={<MCQTest />} />
              <Route path="qa-section" element={<QASection />} />
              <Route path="courses" element={<CourseCatalog />} />
              <Route path="courses/:courseCode" element={<CourseDetails />} />
            </Route>

            {/* Fallback */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </Router>




  );
}

export default App;
