# Alphab Molecule/Vault POC Development Environment Prompt

## Project Overview

Create a modern, scalable monorepo development environment for the Alphab Molecule/Vault POC project. This is a next-generation AI-powered platform with a microservices architecture, featuring a Python FastAPI backend and a React + TypeScript frontend. The development environment should prioritize developer experience, code quality, and seamless deployment to Vercel.

## Core Requirements

### 1. Monorepo Structure

Create a monorepo with the following directory structure:

- `/frontend` - React + TypeScript frontend
- `/backend` - Python FastAPI backend
- `/.vscode` - VSCode configuration
- `/.github` - GitHub Actions workflows
- `/docs` - Documentation

### 2. Frontend Setup

- Initialize a Vite project with React and TypeScript
- Install and configure:
  - PNPM as package manager
  - TailwindCSS with a comprehensive theming system
  - React Context API for theme management (light/dark mode)
  - ESLint and Prettier for code quality
  - Lucide React for icons
  - Modern animation utilities
  - Radix UI for accessible components

### 3. Backend Setup

- Create a Python FastAPI application
- Configure for serverless deployment on Vercel
- Set up proper environment management with virtual environments
- Add linting with Black and Flake8

### 4. Development Environment

- Configure VSCode with recommended extensions and settings
- Create EditorConfig for consistent formatting
- Set up comprehensive .gitignore
- Configure proper script commands for development
- Create a setup script to simplify environment setup

### 5. Theme System Implementation

Implement a comprehensive theme system with:

- CSS variables for all theme tokens
- Light and dark mode support
- Theme toggle component with animations
- Mobile-optimized utilities
- Accessibility features (reduced motion, high contrast)
- Animation utilities (gradient text, shimmer, bounce effects)

### 6. CI/CD Integration

- Set up GitHub Actions workflows for:
  - Linting and testing
  - Building and deployment to Vercel

### 7. Documentation

- Create README files with setup instructions
- Add comprehensive documentation for the theme system
- Document all available commands and workflows

## Implementation Details

### Theme Toggle Component

Create a theme toggle component that:

- Switches between light and dark mode
- Uses a Sun icon for light mode and Moon icon for dark mode
- Has smooth animations when toggling
- Includes hover animations (opacity, scale, rotation)

### Theme Provider

Implement a React Context Provider that:

- Manages theme state (light/dark)
- Persists theme preference in localStorage
- Detects and respects system theme preferences
- Applies theme classes to the document root

### TailwindCSS Configuration

Set up TailwindCSS with:

- Custom color palette with HSL variables
- Semantic color tokens (primary, secondary, accent, etc.)
- Chart color palette for data visualization
- Sidebar-specific theme tokens
- Animation keyframes and utilities
- Responsive mobile utilities

### Animation System

Create an animation system with:

- Gradient text animations
- Loading/shimmer effects
- Micro-interactions (bounce, pulse, glow)
- Entrance animations
- Interactive hover utilities

## Example Component

```tsx
// Example ThemeToggle component with hover animation
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleToggle = () => {
    setIsRotating(true);
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);

    setTimeout(() => {
      setIsRotating(false);
    }, 500);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className="w-10 h-10 rounded-full"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Moon /> : <Sun />}
    </Button>
  );
}
```

## Testing

Create a simple demo page that showcases:

- Button variants
- Interactive animations
- Theme toggle functionality
- Responsive design
- Chart color palette

## Deployment

Configure the project for deployment to Vercel with:

- Frontend as a static site
- Backend as serverless functions
- Proper environment variable handling
- Production build optimizations

## Scripts and Commands

Implement the following scripts:

- `pnpm run dev:all` - Run both frontend and backend
- `pnpm run dev:frontend` - Run frontend only
- `pnpm run dev:backend` - Run backend only
- `pnpm run lint` - Lint all code
- `pnpm run format` - Format all code
- `pnpm run build` - Build for production

## Additional Guidelines

- Prioritize developer experience and code quality
- Use modern best practices for React and TypeScript
- Ensure accessibility compliance
- Optimize for mobile devices
- Create a clean, minimal design that can be extended
- Implement proper error handling and loading states
