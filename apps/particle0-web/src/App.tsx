import { Button } from './components/ui/button';
import { ThemeToggle } from './components/theme-toggle';
import { AuthStatus } from './components/auth-status';
import './animations.css';

function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4 flex items-center gap-4">
        <AuthStatus />
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight animate-gradient-text">Particle0</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            A next-generation AI-powered platform
          </p>
        </div>

        <div className="space-y-6 mt-8">
          <h2 className="text-xl font-semibold">UI Components Demo</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Button Variants</h3>
              <div className="flex flex-col space-y-3">
                <Button variant="default" className="hover-grow">
                  Default
                </Button>
                <Button variant="destructive" className="hover-grow">
                  Destructive
                </Button>
                <Button variant="outline" className="hover-grow">
                  Outline
                </Button>
                <Button variant="secondary" className="hover-grow">
                  Secondary
                </Button>
                <Button variant="ghost" className="hover-grow">
                  Ghost
                </Button>
                <Button variant="link" className="hover-grow">
                  Link
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium">Interactive Elements</h3>
              <div className="flex flex-col space-y-3">
                <Button variant="outline" className="hover-glow animate-pulse-slow">
                  Pulsing Button
                </Button>
                <div className="p-4 rounded-lg bg-card text-card-foreground border shadow-sm animate-bounce-subtle">
                  <p className="text-sm">Bouncing Card</p>
                </div>
                <div className="p-3 rounded-md bg-secondary relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                  <p className="text-sm text-secondary-foreground relative z-10">Shimmer Effect</p>
                </div>
                <p className="font-bold animate-rainbow-text">Rainbow Text Effect</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Chart Colors</h3>
            <div className="flex space-x-2">
              <div className="h-8 w-8 rounded-full bg-chart-1"></div>
              <div className="h-8 w-8 rounded-full bg-chart-2"></div>
              <div className="h-8 w-8 rounded-full bg-chart-3"></div>
              <div className="h-8 w-8 rounded-full bg-chart-4"></div>
              <div className="h-8 w-8 rounded-full bg-chart-5"></div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            Built with React, TypeScript, and Tailwind CSS
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
