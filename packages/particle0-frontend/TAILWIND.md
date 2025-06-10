# Tailwind CSS Setup

This project uses Tailwind CSS with a custom theme and animation system. Here's a guide to the setup and available utilities.

## Theme System

The theme system is built around CSS variables that control colors and other design tokens. It supports both light and dark modes through the `.dark` class.

### Color Palette

```jsx
// Example usage
<div className="bg-primary text-primary-foreground">Primary colored element</div>
```

Available color scales:

- `primary`: Primary brand color
- `secondary`: Secondary brand color
- `accent`: Accent color for highlighting
- `muted`: Subdued, background color
- `destructive`: Error/danger color
- `card`: Card background and foreground
- `popover`: Popover background and foreground
- `border`: Border color
- `input`: Input background
- `ring`: Focus ring color
- `chart-1` through `chart-5`: Colors for charts and visualizations
- `sidebar`: Colors specifically for sidebar components

### Dark Mode Toggle

The project includes a theme toggle component that switches between light and dark modes:

```jsx
import { ThemeToggle } from './components/theme-toggle';

// In your component
<ThemeToggle />;
```

## Animation Utilities

The project includes many animation utilities:

```jsx
// Example usage
<div className="animate-pulse-slow">Slow pulsing element</div>
```

Available animations:

- `animate-pulse-slow`: Slow opacity pulsing
- `animate-pulse-glow`: Pulsing glow effect
- `animate-gradient-text`: Animated gradient text
- `animate-shimmer`: Shimmer effect for loading states
- `animate-bounce-subtle`: Subtle bouncing animation
- `animate-spin-slow`: Slow spinning animation
- `animate-spin-very-slow`: Very slow spinning
- `animate-count-up`: Count-up entrance animation
- `animate-progress`: Progress bar animation
- `animate-big-bounce`: Large bouncing animation
- `animate-wiggle`: Wiggle animation
- `animate-rainbow-text`: Rainbow text effect
- `animate-slide-left`, `animate-slide-right`, `animate-slide-bottom`: Entrance animations
- `animate-fade-slow`: Slow fade-in animation
- `animate-rotate-sun`, `animate-rotate-moon`: Special animations for theme toggle icons

## Interactive Utilities

Special interactive utilities for hover states:

```jsx
<button className="hover-grow">I grow on hover</button>
```

Available interactions:

- `hover-grow`: Scale up on hover
- `hover-glow`: Glow effect on hover

## Mobile Optimization

Responsive utilities designed specifically for mobile:

```jsx
<div className="mobile-padding">Proper padding on all devices</div>
```

Available mobile utilities:

- `mobile-padding`: Responsive padding
- `mobile-text`: Responsive text sizing
- `mobile-heading`: Responsive heading sizing
- `mobile-button`: Responsive button sizing
- `mobile-card`: Responsive card padding
- `mobile-grid`: Responsive grid columns
- `mobile-gap`: Responsive grid gap
- `safe-area-top`, `safe-area-bottom`, `safe-area-left`, `safe-area-right`: Respect device safe areas

## Accessibility

The CSS includes optimizations for:

- Reduced motion preferences
- High contrast mode
- Touch target sizing on mobile
- Safe font sizes to prevent zoom on mobile inputs

## Configuration

The theme is configured in:

- `tailwind.config.js`: Theme extension and plugin configuration
- `src/index.css`: CSS variables and utility definitions
