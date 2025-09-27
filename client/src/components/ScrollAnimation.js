import React, { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const ScrollAnimation = ({ 
  children, 
  animation = 'fadeIn', 
  delay = 0, 
  duration = 0.6,
  className = '',
  threshold = 0.1 
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { 
    once: true, 
    threshold,
    margin: "-100px 0px"
  });

  const animations = {
    fadeIn: {
      initial: { opacity: 0, y: 30 },
      animate: { opacity: 1, y: 0 },
    },
    slideUp: {
      initial: { opacity: 0, y: 50 },
      animate: { opacity: 1, y: 0 },
    },
    slideDown: {
      initial: { opacity: 0, y: -50 },
      animate: { opacity: 1, y: 0 },
    },
    slideLeft: {
      initial: { opacity: 0, x: 50 },
      animate: { opacity: 1, x: 0 },
    },
    slideRight: {
      initial: { opacity: 0, x: -50 },
      animate: { opacity: 1, x: 0 },
    },
    scaleIn: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
    },
    rotateIn: {
      initial: { opacity: 0, rotate: -10, scale: 0.9 },
      animate: { opacity: 1, rotate: 0, scale: 1 },
    },
    bounceIn: {
      initial: { opacity: 0, scale: 0.3 },
      animate: { opacity: 1, scale: 1 },
    },
    stagger: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
    }
  };

  const selectedAnimation = animations[animation] || animations.fadeIn;

  return (
    <motion.div
      ref={ref}
      initial={selectedAnimation.initial}
      animate={isInView ? selectedAnimation.animate : selectedAnimation.initial}
      transition={{
        duration,
        delay,
        ease: "easeOut",
        ...(animation === 'bounceIn' && { type: "spring", stiffness: 200 }),
        ...(animation === 'rotateIn' && { type: "spring", stiffness: 100 }),
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggeredAnimation = ({ 
  children, 
  staggerDelay = 0.1,
  animation = 'fadeIn',
  className = ''
}) => {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <ScrollAnimation
          key={index}
          animation={animation}
          delay={index * staggerDelay}
        >
          {child}
        </ScrollAnimation>
      ))}
    </div>
  );
};

export const ParallaxElement = ({ 
  children, 
  speed = 0.5, 
  className = '',
  direction = 'up' 
}) => {
  const ref = useRef(null);
  const [offsetY, setOffsetY] = React.useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const scrolled = window.pageYOffset;
        const rate = scrolled * -speed;
        setOffsetY(rate);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  const transform = direction === 'up' 
    ? `translateY(${offsetY}px)` 
    : `translateY(${-offsetY}px)`;

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform,
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  );
};

export const FloatingElement = ({ 
  children, 
  intensity = 10, 
  duration = 6,
  className = '' 
}) => {
  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -intensity, 0],
        rotate: [0, 1, -1, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
};

export const GlowEffect = ({ 
  children, 
  color = 'primary', 
  intensity = 'medium',
  className = '' 
}) => {
  const glowIntensities = {
    low: 'shadow-glow',
    medium: 'shadow-glow-lg',
    high: 'shadow-neon-lg'
  };

  return (
    <motion.div
      className={`${glowIntensities[intensity]} ${className}`}
      whileHover={{
        boxShadow: `0 0 30px rgba(59, 130, 246, 0.6), 0 0 60px rgba(59, 130, 246, 0.4)`,
      }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

export default ScrollAnimation;
