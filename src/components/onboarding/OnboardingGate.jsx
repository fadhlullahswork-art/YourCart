import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import WelcomeScreen from "./WelcomeScreen.jsx";

const MOBILE_BREAKPOINT = 768;

function isMobileWidth() {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

export default function OnboardingGate({ children }) {
  const [showWelcome, setShowWelcome] = useState(false);
  const [checked, setChecked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const evaluate = () => {
      const hasSeenWelcome = localStorage.getItem("yourcart_onboarded");
      const onMobile = isMobileWidth();
      setShowWelcome(onMobile && !hasSeenWelcome);
      setChecked(true);
    };

    evaluate();
    window.addEventListener("resize", evaluate);
    return () => window.removeEventListener("resize", evaluate);
  }, []);

  const handleGetStarted = () => {
    localStorage.setItem("yourcart_onboarded", "true");
    setShowWelcome(false);
    navigate("/get-started");
  };

  if (!checked) return null;
  if (showWelcome) return <WelcomeScreen onGetStarted={handleGetStarted} />;
  return children;
}