import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './pages/Hero';
// import Features from './pages/Features';
// import AIAssistant from './pages/AIAssistant';
// import Institutions from './pages/Institutions';
// import Resources from './pages/Resources';
// import Contact from './pages/Contact';
// import Login from './pages/Login';
// import Signup from './pages/Signup';

function App() {
  return (
    <BrowserRouter>
      <div className="">
        <Navbar />
        <Routes>
          <Route path="/" element={<Hero />} />
          {/* <Route path="/features" element={<Features />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/institutions" element={<Institutions />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} /> */}
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
