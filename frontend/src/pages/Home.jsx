import React from 'react';
import Hero from '../components/Hero';
import About from '../components/About';
import Features from '../components/Features';
import Reviews from '../components/Reviews';
import ContactUs from '../components/ContactUs';
import Footer from '../components/Footer';

const Home = () => {
  return (
    <div className="bg-black">
      <Hero />
      <About />
      <Features />
      <Reviews />
      <ContactUs />
      <Footer />
    </div>
  );
};

export default Home;
