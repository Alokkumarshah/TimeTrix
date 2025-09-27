import { useEffect, useState } from 'react';

export const useScrollAnimation = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState({});

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      
      // Check visibility of elements
      const elements = document.querySelectorAll('[data-scroll-animation]');
      elements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const isElementVisible = rect.top < window.innerHeight && rect.bottom > 0;
        
        if (isElementVisible && !isVisible[element.id]) {
          setIsVisible(prev => ({ ...prev, [element.id]: true }));
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isVisible]);

  return { scrollY, isVisible };
};

export const useMousePosition = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return mousePosition;
};

export const useParallax = (speed = 0.5) => {
  const { scrollY } = useScrollAnimation();
  return scrollY * speed;
};
