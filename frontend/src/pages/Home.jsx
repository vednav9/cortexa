import React from "react";
import Hero from "../components/Hero";
import About from "../components/About";
import Features from "../components/Features";
import Reviews from "../components/Reviews";
import ContactUs from "../components/ContactUs";
import Footer from "../components/Footer";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (location.state?.scrollTo) {
      const sectionId = location.state.scrollTo;
      const element = document.getElementById(sectionId);
      if (element) {
        const offset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        setTimeout(() => {
          window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        }, 300);
      }
      // clear state so it doesn't repeat
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

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
