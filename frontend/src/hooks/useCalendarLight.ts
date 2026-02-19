import { useEffect } from 'react';

export const useCalendarLight = () => {
  useEffect(() => {
    // Track mouse position on each calendar day tile
    const handleMouseMove = (e: MouseEvent) => {
      const tile = (e.currentTarget as HTMLElement);
      const rect = tile.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Update CSS custom properties for light position
      tile.style.setProperty('--mouse-x', `${x}px`);
      tile.style.setProperty('--mouse-y', `${y}px`);
    };

    // Attach to all calendar day tiles
    const attachListeners = () => {
      const tiles = document.querySelectorAll('.calendar-day');
      tiles.forEach(tile => {
        tile.addEventListener('mousemove', handleMouseMove as EventListener);
      });
    };

    // Initial attachment
    attachListeners();

    // Re-attach when calendar updates (month change, etc.)
    const observer = new MutationObserver(attachListeners);
    const calendarContainer = document.querySelector('.calendar-container');
    
    if (calendarContainer) {
      observer.observe(calendarContainer, {
        childList: true,
        subtree: true
      });
    }

    return () => {
      const tiles = document.querySelectorAll('.calendar-day');
      tiles.forEach(tile => {
        tile.removeEventListener('mousemove', handleMouseMove as EventListener);
      });
      observer.disconnect();
    };
  }, []);

  return {};
};