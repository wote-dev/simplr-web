import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  velocity: { x: number; y: number };
}

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
  particleCount?: number;
  origin?: { x: number; y: number };
}

const colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

export function Confetti({ 
  isActive, 
  duration = 3000, 
  particleCount = 50,
  origin = { x: 50, y: 50 }
}: ConfettiProps) {
  const [particles, setParticles] = useState<ConfettiPiece[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isActive) {
      setShowConfetti(true);
      
      // Generate confetti particles
      const newParticles: ConfettiPiece[] = [];
      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: i,
          x: origin.x,
          y: origin.y,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 8 + 4,
          rotation: Math.random() * 360,
          velocity: {
            x: (Math.random() - 0.5) * 400,
            y: Math.random() * -300 - 100
          }
        });
      }
      setParticles(newParticles);

      // Clean up after duration
      const timer = setTimeout(() => {
        setShowConfetti(false);
        setParticles([]);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isActive, duration, particleCount, origin.x, origin.y]);

  if (!showConfetti) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{
              x: `${particle.x}%`,
              y: `${particle.y}%`,
              rotate: particle.rotation,
              scale: 1,
              opacity: 1
            }}
            animate={{
              x: `${particle.x + particle.velocity.x / 10}%`,
              y: `${particle.y + particle.velocity.y / 5}%`,
              rotate: particle.rotation + 720,
              scale: 0,
              opacity: 0
            }}
            exit={{
              opacity: 0,
              scale: 0
            }}
            transition={{
              duration: duration / 1000,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            className="absolute rounded-sm"
            style={{
              backgroundColor: particle.color,
              width: particle.size,
              height: particle.size,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Hook for easy confetti triggering
export function useConfetti() {
  const [isActive, setIsActive] = useState(false);

  const triggerConfetti = () => {
    setIsActive(true);
    setTimeout(() => setIsActive(false), 100); // Reset quickly
  };

  return { isActive, triggerConfetti };
}