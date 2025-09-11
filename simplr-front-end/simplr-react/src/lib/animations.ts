/**
 * Mobile-optimized animation configurations
 * Provides faster, more efficient animations for mobile devices
 */

// Detect if user is on a mobile device
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Detect if user prefers reduced motion
const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Base animation configurations
const baseAnimations = {
  // Standard durations
  duration: {
    fast: 0.15,
    normal: 0.2,
    slow: 0.3,
    slower: 0.4
  },
  
  // Mobile-optimized durations (faster)
  mobileDuration: {
    fast: 0.08,
    normal: 0.12,
    slow: 0.15,
    slower: 0.2
  },
  
  // Reduced motion durations (minimal)
  reducedDuration: {
    fast: 0.01,
    normal: 0.01,
    slow: 0.01,
    slower: 0.01
  },
  
  // Optimized easing functions
  easing: {
    // Standard easing (complex)
    standard: [0.25, 0.46, 0.45, 0.94] as const,
    // Mobile easing (simplified)
    mobile: [0.4, 0, 0.2, 1] as const,
    // Reduced motion (linear)
    reduced: [0, 0, 1, 1] as const
  }
};

// Get appropriate duration based on device and user preferences
export const getDuration = (speed: keyof typeof baseAnimations.duration) => {
  if (prefersReducedMotion()) {
    return baseAnimations.reducedDuration[speed];
  }
  if (isMobile()) {
    return baseAnimations.mobileDuration[speed];
  }
  return baseAnimations.duration[speed];
};

// Get appropriate easing based on device and user preferences
export const getEasing = () => {
  if (prefersReducedMotion()) {
    return baseAnimations.easing.reduced;
  }
  if (isMobile()) {
    return baseAnimations.easing.mobile;
  }
  return baseAnimations.easing.standard;
};

// Pre-configured animation variants for common use cases
export const animationVariants = {
  // Fade in/out
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: {
      duration: getDuration('fast'),
      ease: getEasing()
    }
  },
  
  // Slide up/down
  slideUp: {
    initial: { opacity: 0, y: isMobile() ? 4 : 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: isMobile() ? -4 : -8 },
    transition: {
      duration: getDuration('normal'),
      ease: getEasing()
    }
  },
  
  // Scale animation (simplified for mobile)
  scale: {
    initial: { opacity: 0, scale: isMobile() ? 0.95 : 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: isMobile() ? 0.95 : 0.8 },
    transition: {
      duration: getDuration('normal'),
      ease: getEasing()
    }
  },
  
  // Stagger children (reduced delay on mobile)
  stagger: {
    animate: {
      transition: {
        staggerChildren: isMobile() ? 0.02 : 0.05,
        delayChildren: isMobile() ? 0.01 : 0.05
      }
    }
  },
  
  // Task completion pulse (optimized)
  taskPulse: {
    initial: { scale: 1, opacity: 0.5 },
    animate: { 
      scale: isMobile() ? 1.2 : 1.4, 
      opacity: 0 
    },
    transition: {
      duration: getDuration('slow'),
      ease: getEasing()
    }
  }
};

// Mobile-specific style optimizations
export const mobileOptimizedStyle = {
  willChange: 'transform, opacity',
  transform: 'translateZ(0)',
  backfaceVisibility: 'hidden' as const
};

// Utility function to create mobile-optimized motion props
export const createMotionProps = (variant: keyof typeof animationVariants, customProps?: any) => {
  const baseVariant = animationVariants[variant];
  
  return {
    ...baseVariant,
    style: mobileOptimizedStyle,
    ...customProps,
    transition: {
      ...(baseVariant as any).transition,
      ...customProps?.transition
    }
  };
};

// Hook to get current animation preferences
export const useAnimationConfig = () => {
  return {
    isMobile: isMobile(),
    prefersReducedMotion: prefersReducedMotion(),
    getDuration,
    getEasing,
    animationVariants,
    mobileOptimizedStyle,
    createMotionProps
  };
};