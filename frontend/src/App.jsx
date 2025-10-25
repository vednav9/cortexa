import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './components/About';
import Features from './components/Features';
import Reviews from './components/Reviews';
import ContactUs from './components/ContactUs';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import InstituteSignUp from './pages/InstituteSignUp';

function App() {
  return (
    <BrowserRouter>
      <div className="">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/features" element={<Features />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/institute-signup" element={<InstituteSignUp />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
