# Particle0 Frontend

This is the React + TypeScript frontend for the Particle0 project, a next-generation AI-powered platform.

## Setup Instructions

### Prerequisites

- Node.js 18.18.0 or later (see `.nvmrc` in the root directory)
- pnpm 8.0.0 or later (preferred package manager)

### Installation

1. **Install dependencies**:

   ```bash
   # From the frontend directory
   pnpm install

   # Or from the project root
   pnpm install
   ```

2. **Environment Variables** (optional):

   Create a `.env.local` file in the frontend directory with:

   ```
   VITE_API_URL=http://localhost:8000/api/v1
   ```

## Running the Application

### Development Server

Start the development server with hot reloading:

```bash
# From the frontend directory
pnpm run dev

# From the project root
pnpm run dev:frontend
```

The application will be available at http://localhost:3000.

### Building for Production

```bash
pnpm run build
```

The build output will be in the `dist` directory.

### Testing

```bash
# Run all tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage
pnpm run test:coverage
```

### Linting and Formatting

```bash
# Lint code
pnpm run lint

# Fix linting issues
pnpm run lint:fix

# Format code
pnpm run format
```

## Project Structure

```
frontend/
├── public/           # Static assets
├── src/
│   ├── assets/       # Images, fonts, etc.
│   ├── components/   # Reusable UI components
│   │   └── ui/       # UI component library
│   ├── features/     # Feature-specific components and logic
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Utilities and helpers
│   ├── api/          # API client and endpoints
│   ├── i18n/         # Internationalization setup
│   ├── contexts/     # React context providers
│   ├── routes/       # Route definitions
│   ├── types/        # TypeScript type definitions
│   ├── App.tsx       # Main application component
│   └── main.tsx      # Application entry point
├── .eslintrc.json    # ESLint configuration
├── .prettierrc       # Prettier configuration
├── vite.config.ts    # Vite configuration
└── tsconfig.json     # TypeScript configuration
```

## UI Components

The project uses Tailwind CSS for styling and includes a set of pre-built UI components:

- Based on [shadcn/ui](https://ui.shadcn.com/) design patterns
- Utilizes [Radix UI](https://www.radix-ui.com/) for accessible primitives
- [Framer Motion](https://www.framer.com/motion/) for animations
- Component customization using [class-variance-authority](https://cva.style/docs)

### Theme

The project uses a custom theme with CSS variables for colors and spacing, supporting both light and dark modes. To customize the theme, edit the CSS variables in `src/index.css`.

### Adding New Components

For consistency, follow these guidelines when creating new components:

1. Create them in the appropriate directory (`components/ui` for reusable UI components)
2. Use the `cn` utility from `lib/utils.ts` for class name merging
3. Follow the same patterns as existing components for props and styling

## Development Guidelines

- Use TypeScript for all new code
- Follow the React component structure
- Write tests for all components and hooks
- Use ESLint and Prettier for code quality
- Follow the feature-based organization for new features

## Deployment

The frontend is configured for deployment to Vercel. The deployment is handled automatically through GitHub Actions when code is merged to the main branch.
