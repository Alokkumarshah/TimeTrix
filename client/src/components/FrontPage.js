import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import Tilt from "react-parallax-tilt";
import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import ThemeToggle from "./ThemeToggle";
import CosmicBackground from "./CosmicBackground";
import {
  Building,
  Users,
  CalendarCheck,
  Sparkles,
  Zap,
  Cpu,
  Brain,
  Rocket,
  ClipboardCheck,
  Mail,
  Phone,
  MapPin,
  LogIn,
  UserPlus,
  Clock,
  Calendar,
} from "lucide-react";

const features = [
  {
    icon: React.createElement(Building, { className: "w-12 h-12 text-purple-700" }),
    title: "Smart Classroom Management",
    desc: "Intelligent room allocation with real-time availability tracking and conflict resolution for optimal space utilization.",
    color: "purple-700",
  },
  {
    icon: React.createElement(Users, { className: "w-12 h-12 text-pink-600" }),
    title: "Faculty Workload Balance",
    desc: "AI-powered distribution ensuring fair teaching loads and preventing faculty burnout through smart scheduling.",
    color: "pink-600",
  },
  {
    icon: React.createElement(CalendarCheck, { className: "w-12 h-12 text-cyan-700" }),
    title: "Automated Timetable Generation",
    desc: "Advanced algorithms handle complex scheduling constraints, curriculum requirements, and institutional policies.",
    color: "cyan-700",
  },
  {
    icon: React.createElement(Sparkles, { className: "w-12 h-12 text-yellow-400" }),
    title: "Real-time Optimization",
    desc: "Dynamic scheduling adjustments with instant conflict detection and resolution for seamless academic operations.",
    color: "yellow-400",
  },
];

const parameters = [
  "Smart classroom mapping",
  "Automated batch processing",
  "AI subject optimization",
  "Dynamic class allocation",
  "Smart frequency analysis",
  "Faculty availability matrix",
  "Predictive leave modeling",
  "Priority slot management",
];

const stats = [
  { number: "99.8%", label: "Conflict Resolution", icon: React.createElement(Zap, { className: "w-8 h-8" }), color: "purple-700" },
  { number: "95%", label: "Time Savings", icon: React.createElement(Cpu, { className: "w-8 h-8" }), color: "pink-600" },
  { number: "100%", label: "Room Utilization", icon: React.createElement(Brain, { className: "w-8 h-8" }), color: "cyan-700" },
  { number: "24/7", label: "Support", icon: React.createElement(Rocket, { className: "w-8 h-8" }), color: "yellow-400" },
];

const glowColors = {
  "purple-700": "rgba(104,29,148,0.8)",
  "pink-600": "rgba(204,65,122,0.8)",
  "cyan-700": "rgba(6,182,212,0.8)",
  "yellow-400": "rgba(250,204,21,0.8)",
};

function SectionWrapper({ children, glowColor }) {
  const ref = useRef(null);
  const { isDark } = useTheme();

  // Determine border and glow colors based on glowColor prop
  const getBorderColors = (glowColor) => {
    if (glowColor === glowColors["purple-700"]) {
      return {
        border: "border-purple-500/10 dark:border-purple-400/10",
        hoverBorder: "hover:border-purple-500/50 dark:hover:border-purple-400/50",
        hoverShadow: "hover:shadow-purple-500/30 dark:hover:shadow-purple-400/30",
        glareColor: isDark ? "rgba(147, 51, 234, 0.3)" : "rgba(147, 51, 234, 0.2)",
        glowClass: "border-glow-hover"
      };
    } else if (glowColor === glowColors["pink-600"]) {
      return {
        border: "border-pink-500/10 dark:border-pink-400/10",
        hoverBorder: "hover:border-pink-500/50 dark:hover:border-pink-400/50",
        hoverShadow: "hover:shadow-pink-500/30 dark:hover:shadow-pink-400/30",
        glareColor: isDark ? "rgba(236, 72, 153, 0.3)" : "rgba(236, 72, 153, 0.2)",
        glowClass: "border-glow-hover pink"
      };
    } else if (glowColor === glowColors["cyan-700"]) {
      return {
        border: "border-cyan-500/10 dark:border-cyan-400/10",
        hoverBorder: "hover:border-cyan-500/50 dark:hover:border-cyan-400/50",
        hoverShadow: "hover:shadow-cyan-500/30 dark:hover:shadow-cyan-400/30",
        glareColor: isDark ? "rgba(6, 182, 212, 0.3)" : "rgba(6, 182, 212, 0.2)",
        glowClass: "border-glow-hover cyan"
      };
    } else if (glowColor === glowColors["yellow-400"]) {
      return {
        border: "border-yellow-500/10 dark:border-yellow-400/10",
        hoverBorder: "hover:border-yellow-500/50 dark:hover:border-yellow-400/50",
        hoverShadow: "hover:shadow-yellow-500/30 dark:hover:shadow-yellow-400/30",
        glareColor: isDark ? "rgba(250, 204, 21, 0.3)" : "rgba(250, 204, 21, 0.2)",
        glowClass: "border-glow-hover yellow"
      };
    } else {
      // Default blue
      return {
        border: "border-blue-500/10 dark:border-blue-400/10",
        hoverBorder: "hover:border-blue-500/50 dark:hover:border-blue-400/50",
        hoverShadow: "hover:shadow-blue-500/30 dark:hover:shadow-blue-400/30",
        glareColor: isDark ? "rgba(59, 130, 246, 0.3)" : "rgba(59, 130, 246, 0.2)",
        glowClass: "border-glow-hover blue"
      };
    }
  };

  const colors = getBorderColors(glowColor);

  return React.createElement("div", {
    className: `w-4/5 mx-auto my-16`
  }, React.createElement("div", {
    className: "w-full"
  }, React.createElement(Tilt, {
    glareEnable: true,
    glareMaxOpacity: 0.15,
    glareColor: colors.glareColor,
    glarePosition: "all",
    scale: 1.01,
    tiltMaxAngleX: 3,
    tiltMaxAngleY: 3,
    transitionSpeed: 2000,
    className: "w-full backdrop-blur-xl relative"
  }, React.createElement("div", {
    ref: ref,
    className: `p-12 transition-all duration-500 rounded-2xl border-2 ${colors.border} hover:shadow-lg ${colors.hoverShadow} ${colors.hoverBorder} hover:border-4 hover:scale-[1.02] group ${colors.glowClass}`,
    style: {
      background: isDark ? "rgba(255 255 255 / 0.03)" : "rgba(0 0 0 / 0.03)",
      transition: "box-shadow 0.5s ease, border-color 0.5s ease, border-width 0.5s ease, transform 0.5s ease",
    }
  }, children))));
}

export default function FrontPage() {
  const { isDark } = useTheme();
  const [activeSection, setActiveSection] = useState('home');
  
  // Section refs for smooth scrolling
  const homeRef = useRef(null);
  const featuresRef = useRef(null);
  const parametersRef = useRef(null);
  const contactRef = useRef(null);
  
  const sections = React.useMemo(() => ({
    home: homeRef,
    features: featuresRef,
    parameters: parametersRef,
    contact: contactRef
  }), [homeRef, featuresRef, parametersRef, contactRef]);

  // Smooth scroll function
  const scrollToSection = (sectionName) => {
    const section = sections[sectionName];
    if (section && section.current) {
      section.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      setActiveSection(sectionName);
    }
  };

  // Scroll spy effect
  React.useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      
      Object.entries(sections).forEach(([sectionName, ref]) => {
        if (ref.current) {
          const sectionTop = ref.current.offsetTop;
          const sectionHeight = ref.current.offsetHeight;
          
          if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            setActiveSection(sectionName);
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  return React.createElement("div", { className: `min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 ${isDark ? 'text-white' : 'text-slate-800'} overflow-hidden relative` }, [
    // Background
    React.createElement(CosmicBackground, { key: "bg", type: "stars" }),
    React.createElement(CosmicBackground, { key: "light", type: "light-spot", followMouse: true }),
    
    // Neon Decorations
    React.createElement("div", {
      key: "decorations",
      className: "fixed inset-0 overflow-hidden pointer-events-none"
    }, [
      React.createElement(motion.div, {
        key: "decoration-1",
        className: "absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-xl",
        animate: {
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        },
        transition: {
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }),
      React.createElement(motion.div, {
        key: "decoration-2",
        className: "absolute top-40 right-32 w-24 h-24 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full blur-xl",
        animate: {
          scale: [1, 0.8, 1],
          opacity: [0.4, 0.7, 0.4],
        },
        transition: {
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }),
      React.createElement(motion.div, {
        key: "decoration-3",
        className: "absolute bottom-32 left-1/3 w-40 h-40 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-full blur-2xl",
        animate: {
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.5, 0.2],
        },
        transition: {
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }
      })
    ]),
    // Navigation
    React.createElement("nav", { 
      key: "nav",
      className: `fixed top-0 left-0 w-full z-50 backdrop-blur-xl border-b ${isDark ? 'bg-slate-900/90 border-slate-700 shadow-2xl' : 'bg-white/95 border-gray-200'}` 
    }, React.createElement("div", { 
      className: "max-w-7xl mx-auto flex justify-between items-center p-6" 
    }, [
      React.createElement(Link, {
        key: "title-link",
        to: "/"
      }, React.createElement(motion.h1, {
        key: "title",
        initial: { opacity: 0, x: -50 },
        animate: { opacity: 1, x: 0 },
        whileHover: { 
          scale: 1.05
        },
        whileTap: { scale: 0.95 },
        className: "text-3xl font-black gradient-text cursor-pointer transition-all duration-500 toggle-effect flex items-center gap-2"
      }, [
        React.createElement(Calendar, { 
          key: "logo-icon", 
          className: "w-8 h-8 text-transparent bg-gradient-to-r from-purple-700 via-pink-600 to-cyan-700 bg-clip-text" 
        }),
        "TimeTrix"
      ])),
      React.createElement("ul", {
        key: "nav-list",
        className: "flex gap-8 font-semibold items-center"
      }, [
        ...["Home", "Features", "Parameters", "Contact"].map((item, i) => {
          const sectionKey = item.toLowerCase();
          return React.createElement(motion.li, {
            key: i,
            initial: { opacity: 0, y: -20 },
            animate: { opacity: 1, y: 0 },
            transition: { delay: i * 0.1 },
            whileHover: { 
              scale: 1.1
            },
            whileTap: { scale: 0.95 },
            onClick: () => scrollToSection(sectionKey),
            className: `cursor-pointer transition-all duration-500 toggle-effect ${
              activeSection === sectionKey 
                ? 'text-transparent bg-gradient-to-r from-purple-700 via-pink-600 to-cyan-700 bg-clip-text' 
                : 'text-slate-600 dark:text-slate-300 hover:text-transparent hover:bg-gradient-to-r hover:from-purple-700 hover:via-pink-600 hover:to-cyan-700 hover:bg-clip-text'
            }`
          }, item);
        }),
        React.createElement(motion.div, {
          key: "auth-buttons",
          initial: { opacity: 0, y: -20 },
          animate: { opacity: 1, y: 0 },
          transition: { delay: 0.7 },
          className: "flex gap-4 ml-8 items-center"
        }, [
          React.createElement(ThemeToggle, { key: "theme-toggle" }),
          React.createElement(motion.div, {
            key: "login-wrapper",
            whileHover: { 
              scale: 1.05
            },
            whileTap: { scale: 0.95 }
          },           React.createElement(Link, {
            to: "/login",
            className: "frontpage-nav-button login toggle-effect btn-toggle-effect"
          }, [
            React.createElement(LogIn, { key: "login-icon", className: "w-4 h-4" }),
            "Login"
          ])),
          React.createElement(motion.div, {
            key: "register-wrapper",
            whileHover: { 
              scale: 1.05
            },
            whileTap: { scale: 0.95 }
          },           React.createElement(Link, {
            to: "/register",
            className: "frontpage-nav-button register toggle-effect btn-toggle-effect"
          }, [
            React.createElement(UserPlus, { key: "register-icon", className: "w-4 h-4" }),
            "Register"
          ]))
        ])
      ])
    ])),

    // Hero Section
    React.createElement(SectionWrapper, {
      key: "hero",
      glowColor: glowColors["purple-700"]
    }, React.createElement("div", { 
      ref: sections.home,
      className: "pt-32 pb-20 text-center" 
    }, 
      React.createElement(motion.div, {
        initial: { opacity: 0, scale: 0.5 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 1 },
        className: "mb-8"
      }, [
        React.createElement(motion.div, { 
          key: "clock-icon", 
          className: "text-8xl mb-4 animate-pulse cursor-pointer transition-all duration-500 toggle-effect flex justify-center",
          whileHover: { 
            scale: 1.2
          },
          whileTap: { scale: 0.9 }
        }, React.createElement(Clock, { 
          className: "w-20 h-20 text-transparent bg-gradient-to-r from-purple-700 via-pink-600 to-cyan-700 bg-clip-text drop-shadow-[0_0_50px_rgba(104,29,148,0.8)]" 
        })),
        React.createElement(motion.h1, {
          key: "main-title",
          className: "text-6xl md:text-8xl font-black leading-tight mb-6",
          whileHover: { scale: 1.02 },
          transition: { duration: 0.3 }
        }, [
          React.createElement(motion.span, {
            key: "cosmic",
            className: "text-transparent bg-gradient-to-r from-purple-700 via-pink-600 to-cyan-700 bg-clip-text drop-shadow-[0_0_50px_rgba(104,29,148,0.8)] animate-pulse cursor-pointer transition-all duration-500 toggle-effect",
            whileHover: { 
              scale: 1.05
            },
            whileTap: { scale: 0.95 }
          }, "QUANTUM"),
          React.createElement("br", { key: "br1" }),
          React.createElement(motion.span, {
            key: "timetable",
            className: `${isDark ? 'text-white' : 'text-slate-800'} cursor-pointer transition-all duration-500 toggle-effect`,
            whileHover: { 
              scale: 1.05
            },
            whileTap: { scale: 0.95 }
          }, "TIMETABLE"),
          React.createElement("br", { key: "br2" }),
          React.createElement(motion.span, {
            key: "scheduler",
            className: "text-transparent bg-gradient-to-r from-cyan-700 via-purple-700 to-pink-600 bg-clip-text drop-shadow-[0_0_50px_rgba(6,182,212,0.8)] cursor-pointer transition-all duration-500 toggle-effect",
            whileHover: { 
              scale: 1.05
            },
            whileTap: { scale: 0.95 }
          }, "SCHEDULER")
        ]),
        React.createElement(motion.p, {
          key: "description",
          initial: { opacity: 0, y: 30 },
          animate: { opacity: 1, y: 0 },
          transition: { delay: 0.5, duration: 1 },
          className: `text-xl md:text-3xl max-w-4xl mx-auto ${isDark ? 'text-gray-300' : 'text-slate-600'} leading-relaxed mb-12 cursor-pointer transition-all duration-500 toggle-effect`,
          whileHover: { scale: 1.02 },
          whileTap: { scale: 0.98 }
        }, [
          "Transform your educational institution with our intelligent ",
          React.createElement(motion.span, {
            key: "highlight",
            className: "text-transparent bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text font-bold cursor-pointer transition-all duration-500 toggle-effect",
            whileHover: { 
              scale: 1.1
            },
            whileTap: { scale: 0.95 }
          }, "timetable management system"),
          " that automates scheduling, eliminates conflicts, and optimizes resource utilization."
        ]),
        React.createElement(motion.div, {
          key: "stats",
          initial: { opacity: 0, y: 50 },
          animate: { opacity: 1, y: 0 },
          transition: { delay: 0.8, duration: 1 },
          className: "grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mb-12"
        }, stats.map(({ number, label, icon, color }, i) => 
          React.createElement(motion.div, { 
            key: i, 
            className: "text-center cursor-pointer transition-all duration-500 toggle-effect",
            whileHover: { 
              scale: 1.1
            },
            whileTap: { scale: 0.95 }
          }, [
            React.createElement(motion.div, {
              key: "icon",
              className: `text-transparent bg-gradient-to-r from-${color} to-${color} bg-clip-text mb-2 transition-all duration-500 toggle-effect`,
              whileHover: { 
                scale: 1.2
              }
            }, icon),
            React.createElement(motion.div, {
              key: "number",
              className: `text-3xl font-black ${isDark ? 'text-white' : 'text-slate-800'} transition-all duration-500 toggle-effect`,
              whileHover: { 
                scale: 1.1
              }
            }, number),
            React.createElement(motion.div, {
              key: "label",
              className: `${isDark ? 'text-gray-300' : 'text-slate-600'} font-semibold transition-all duration-500 toggle-effect`,
              whileHover: { 
                scale: 1.05,
                color: isDark ? "#ffffff" : "#000000"
              }
            }, label)
          ])
        )),
        React.createElement(Link, {
          key: "cta-button",
          to: "/login"
        },         React.createElement(motion.button, {
          whileHover: { 
            scale: 1.1
          },
          whileTap: { scale: 0.9 },
          className: `px-12 py-6 rounded-full bg-gradient-to-r from-purple-700 via-pink-600 to-cyan-700 font-black text-xl transition-all duration-500 toggle-effect btn-toggle-effect cursor-pointer ${isDark ? 'shadow-[0_0_50px_rgba(104,29,148,0.8)] hover:shadow-[0_0_100px_rgba(104,29,148,1)]' : ''}`
        }, "Get Started Today"))
      ])
    )),


    // Features Section
    React.createElement(SectionWrapper, {
      key: "features",
      glowColor: glowColors["purple-700"]
    }, React.createElement("div", { 
      ref: sections.features,
      className: "py-20" 
    }, [
      React.createElement(motion.h2, {
        key: "features-title",
        initial: { opacity: 0, y: 50 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        whileHover: { scale: 1.05, rotate: [0, -1, 1, 0] },
        className: "text-5xl font-black text-center mb-16 toggle-effect cosmic-gradient-text"
      }, "SMART FEATURES"),
      React.createElement("div", {
        key: "features-grid",
        className: "grid md:grid-cols-2 lg:grid-cols-4 gap-8"
      }, features.map(({ icon, title, desc, color }) => 
        React.createElement(motion.div, {
          key: title,
          initial: { opacity: 0, y: 100 },
          whileInView: { opacity: 1, y: 0 },
          transition: { duration: 0.8 },
          viewport: { once: true }
        }, React.createElement(SectionWrapper, {
          glowColor: glowColors[color]
        }, [
          React.createElement("div", {
            key: "icon",
            className: "text-center mb-6 h-16 flex items-center justify-center"
          }, icon),
          React.createElement("h3", {
            key: "title",
            className: `text-xl font-bold mb-4 text-${color} min-h-[3rem] flex items-center justify-center text-center`
          }, title),
          React.createElement("p", {
            key: "desc",
            className: `${isDark ? 'text-gray-300' : 'text-slate-600'} min-h-[5rem] flex items-center text-center text-sm leading-relaxed`
          }, desc)
        ]))
      ))
    ])),

    // Parameters Section
    React.createElement(SectionWrapper, {
      key: "parameters",
      glowColor: glowColors["pink-600"]
    }, React.createElement("div", { 
      ref: sections.parameters,
      className: "py-20" 
    }, [
      React.createElement(motion.h2, {
        key: "parameters-title",
        initial: { opacity: 0, y: 50 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        whileHover: { scale: 1.05, rotate: [0, -1, 1, 0] },
        className: "text-5xl font-black text-center mb-16 toggle-effect cosmic-gradient-text"
      }, "ADVANCED PARAMETERS"),
      React.createElement("div", {
        key: "parameters-grid",
        className: "grid md:grid-cols-2 lg:grid-cols-4 gap-6"
      }, parameters.map((param, i) => 
        React.createElement(motion.div, {
          key: i,
          initial: { opacity: 0, scale: 0.5 },
          whileInView: { opacity: 1, scale: 1 },
          transition: { duration: 0.6 },
          viewport: { once: true }
        }, React.createElement(SectionWrapper, {
          glowColor: glowColors["pink-600"]
        }, [
          React.createElement(ClipboardCheck, {
            key: "icon",
            className: "w-10 h-10 text-cyan-600 mx-auto mb-4 animate-pulse"
          }),
          React.createElement("p", {
            key: "text",
            className: `${isDark ? 'text-gray-300' : 'text-slate-600'} font-semibold leading-relaxed`
          }, param)
        ]))
      ))
    ])),

    // Contact Section
    React.createElement(SectionWrapper, {
      key: "contact",
      glowColor: glowColors["purple-700"]
    }, React.createElement("div", { 
      ref: sections.contact,
      className: "py-20 text-center" 
    }, [
      React.createElement(motion.h2, {
        key: "contact-title",
        initial: { opacity: 0, y: 50 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        whileHover: { scale: 1.05, rotate: [0, -1, 1, 0] },
        className: "text-5xl font-black mb-16 toggle-effect cosmic-gradient-text"
      }, "CONTACT US"),
      React.createElement("div", {
        key: "contact-grid",
        className: "max-w-5xl mx-auto grid md:grid-cols-3 gap-8 px-6"
      }, [
        { icon: React.createElement(Mail, { className: "w-12 h-12 text-cyan-600 mx-auto" }), title: "Email", text: "support@timetrix.edu" },
        { icon: React.createElement(Phone, { className: "w-12 h-12 text-pink-600 mx-auto" }), title: "Phone", text: "+91 9876543210" },
        { icon: React.createElement(MapPin, { className: "w-12 h-12 text-purple-700 mx-auto" }), title: "Location", text: "NIT Warangal, India" },
      ].map((c, i) => 
        React.createElement(motion.div, {
          key: i,
          initial: { opacity: 0, y: 50 },
          whileInView: { opacity: 1, y: 0 },
          transition: { duration: 0.8 },
          viewport: { once: true }
        }, React.createElement(SectionWrapper, {
          glowColor: glowColors["purple-700"]
        }, [
          React.createElement("div", {
            key: "icon",
            className: "mb-6 animate-bounce"
          }, c.icon),
          React.createElement("h3", {
            key: "title",
            className: "text-2xl font-black mb-4 text-transparent bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text"
          }, c.title),
          React.createElement("p", {
            key: "text",
            className: `${isDark ? 'text-gray-300' : 'text-slate-600'} font-semibold text-lg`
          }, c.text)
        ]))
      ))
    ])),

    // Professional Footer
    React.createElement("footer", {
      key: "footer",
      className: "bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white relative z-10"
    }, [
      React.createElement("div", {
        key: "footer-content",
        className: "max-w-7xl mx-auto px-6 py-16"
      }, [
        React.createElement("div", {
          key: "footer-grid",
          className: "grid md:grid-cols-4 gap-8 mb-12"
        }, [
          // Company Info
          React.createElement("div", {
            key: "company-info",
            className: "md:col-span-2"
          }, [
            React.createElement("div", {
              key: "logo",
              className: "flex items-center gap-3 mb-6"
            }, [
              React.createElement(Calendar, { 
                key: "footer-logo", 
                className: "w-8 h-8 text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text" 
              }),
              React.createElement("h3", {
                key: "company-name",
                className: "text-2xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text"
              }, "TimeTrix")
            ]),
            React.createElement("p", {
              key: "company-desc",
              className: "text-gray-300 mb-6 leading-relaxed"
            }, "Revolutionizing educational scheduling with AI-powered timetable management. Streamline your institution's operations with intelligent automation."),
            React.createElement("div", {
              key: "social-links",
              className: "flex gap-4"
            }, [
              React.createElement("a", {
                key: "email",
                href: "mailto:support@timetrix.edu",
                className: "p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors duration-300"
              }, React.createElement(Mail, { className: "w-5 h-5" })),
              React.createElement("a", {
                key: "phone",
                href: "tel:+919876543210",
                className: "p-2 bg-pink-600 hover:bg-pink-700 rounded-lg transition-colors duration-300"
              }, React.createElement(Phone, { className: "w-5 h-5" })),
              React.createElement("a", {
                key: "location",
                href: "#",
                className: "p-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors duration-300"
              }, React.createElement(MapPin, { className: "w-5 h-5" }))
            ])
          ]),
          
          // Quick Links
          React.createElement("div", {
            key: "quick-links"
          }, [
            React.createElement("h4", {
              key: "links-title",
              className: "text-lg font-semibold mb-4 text-white"
            }, "Quick Links"),
            React.createElement("ul", {
              key: "links-list",
              className: "space-y-3"
            }, [
              "Features", "Pricing", "Documentation", "Support", "About Us"
            ].map((link, i) => 
              React.createElement("li", {
                key: i,
                className: "text-gray-300 hover:text-purple-400 transition-colors duration-300 cursor-pointer"
              }, link)
            ))
          ]),
          
          // Contact Info
          React.createElement("div", {
            key: "contact-info"
          }, [
            React.createElement("h4", {
              key: "contact-title",
              className: "text-lg font-semibold mb-4 text-white"
            }, "Contact Info"),
            React.createElement("div", {
              key: "contact-details",
              className: "space-y-3"
            }, [
              React.createElement("div", {
                key: "email-contact",
                className: "flex items-center gap-3 text-gray-300"
              }, [
                React.createElement(Mail, { key: "email-icon", className: "w-4 h-4 text-purple-400" }),
                "support@timetrix.edu"
              ]),
              React.createElement("div", {
                key: "phone-contact",
                className: "flex items-center gap-3 text-gray-300"
              }, [
                React.createElement(Phone, { key: "phone-icon", className: "w-4 h-4 text-pink-400" }),
                "+91 9876543210"
              ]),
              React.createElement("div", {
                key: "location-contact",
                className: "flex items-center gap-3 text-gray-300"
              }, [
                React.createElement(MapPin, { key: "location-icon", className: "w-4 h-4 text-cyan-400" }),
                "NIT Warangal, India"
              ])
            ])
          ])
        ]),
        
        // Bottom Bar
        React.createElement("div", {
          key: "bottom-bar",
          className: "border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center"
        }, [
          React.createElement("p", {
            key: "copyright",
            className: "text-gray-400 mb-4 md:mb-0"
          }, [
            "© ",
            new Date().getFullYear(),
            " TimeTrix. All rights reserved."
          ]),
          React.createElement("div", {
            key: "footer-links",
            className: "flex gap-6 text-sm"
          }, [
            React.createElement("a", {
              key: "privacy",
              href: "#",
              className: "text-gray-400 hover:text-purple-400 transition-colors duration-300"
            }, "Privacy Policy"),
            React.createElement("a", {
              key: "terms",
              href: "#",
              className: "text-gray-400 hover:text-purple-400 transition-colors duration-300"
            }, "Terms of Service"),
            React.createElement("span", {
              key: "powered-by",
              className: "text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text font-semibold"
            }, "Powered by Smart AI")
          ])
        ])
      ])
    ])
  ]);
}
