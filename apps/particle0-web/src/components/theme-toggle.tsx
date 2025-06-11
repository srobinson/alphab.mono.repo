import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/theme-provider';
import { Button } from './ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  // After mounting, we can show the toggle without worrying about SSR mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const handleToggle = () => {
    setIsRotating(true);
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);

    // Reset rotation after animation completes
    setTimeout(() => {
      setIsRotating(false);
    }, 500); // Animation duration is 0.5s
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      className={`w-10 h-10 rounded-full ${isRotating ? 'animate-spin' : ''}`}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Moon /> : <Sun />}
    </Button>
  );
}
