import React from 'react';

export interface EnvironmentConfig {
  backgroundKey?: string;
  audioKey?: string;
  companionPresence?: 'avatar' | 'orb';
  primaryPanelType?: string;
  colorTemperature?: 'cool' | 'warm' | 'neutral';
  typographyScale?: 'standard' | 'large' | 'children';
  categoryAccentColor?: string;
  sessionMood?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
}

const GRADIENTS: Record<string, string> = {
  cool: 'linear-gradient(160deg, #0A1628 0%, #0D1F3C 40%, #132744 100%)',
  warm: 'linear-gradient(160deg, #1A1008 0%, #1C1410 40%, #1A1628 100%)',
  neutral: 'linear-gradient(160deg, #0A1628 0%, #111827 40%, #0F172A 100%)',
};

function getGradient(colorTemp?: string): string {
  return GRADIENTS[colorTemp || 'cool'] || GRADIENTS.cool;
}

function getParticleColor(accentColor?: string): string {
  return accentColor || 'rgba(30,111,255,0.4)';
}

interface EnvironmentRendererProps {
  config: EnvironmentConfig;
  children: React.ReactNode;
}

export function EnvironmentRenderer({ config, children }: EnvironmentRendererProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const particlesRef = React.useRef<Particle[]>([]);
  const animFrameRef = React.useRef<number>(0);
  const prevConfigRef = React.useRef<string>('');

  const configKey = JSON.stringify({
    colorTemperature: config.colorTemperature,
    categoryAccentColor: config.categoryAccentColor,
  });

  // Initialize particles
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const count = 40;
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
      });
    }
    particlesRef.current = particles;
  }, []);

  // Animate particles
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const accentColor = getParticleColor(config.categoryAccentColor);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = accentColor.replace(/[\d.]+\)$/, `${p.opacity})`);
        ctx.fill();
      }

      // Draw connecting lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = accentColor.replace(/[\d.]+\)$/, `${0.05 * (1 - dist / 120)})`);
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [config.categoryAccentColor]);

  // Smooth gradient transition
  const [transitionOpacity, setTransitionOpacity] = React.useState(1);
  React.useEffect(() => {
    if (prevConfigRef.current && prevConfigRef.current !== configKey) {
      setTransitionOpacity(0);
      const timer = setTimeout(() => setTransitionOpacity(1), 50);
      return () => clearTimeout(timer);
    }
    prevConfigRef.current = configKey;
  }, [configKey]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Gradient background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: getGradient(config.colorTemperature),
          opacity: transitionOpacity,
          transition: 'opacity 600ms ease-in-out',
          zIndex: 0,
        }}
      />

      {/* Accent glow */}
      {config.categoryAccentColor && (
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 600,
            height: 300,
            borderRadius: '50%',
            background: `radial-gradient(ellipse, ${config.categoryAccentColor}15 0%, transparent 70%)`,
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          width: '100%',
          height: '100%',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default EnvironmentRenderer;
