import { useEffect, useRef } from 'react';

export const useWindows10Effect = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const light = lightRef.current;

    if (!container || !light) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      light.style.left = `${x}px`;
      light.style.top = `${y}px`;
    };

    const handleMouseEnter = () => {
      if (light) {
        light.style.opacity = '1';
      }
    };

    const handleMouseLeave = () => {
      if (light) {
        light.style.opacity = '0';
      }
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return { containerRef, lightRef };
};