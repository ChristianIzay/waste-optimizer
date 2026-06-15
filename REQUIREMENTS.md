# Requirements - Matadi Waste Optimizer

## System Requirements

### Prerequisites

- **Node.js**: Version 18.x or higher
- **npm**: Version 9.x or higher (comes with Node.js)
- **Git**: For version control

### Runtime Dependencies

#### Core Dependencies
- `next@14.2.5` - React framework for production
- `react@18.3.1` - JavaScript library for building user interfaces
- `react-dom@18.3.1` - React package for working with the DOM
- `@prisma/client@6.19.3` - Database ORM client
- `leaflet@1.9.4` - Interactive map library
- `react-leaflet@4.2.1` - React components for Leaflet maps
- `lucide-react@0.400.0` - Icon library
- `proj4@2.20.9` - Coordinate transformation library
- `@types/proj4@2.5.6` - TypeScript types for proj4
- `@types/leaflet@1.9.12` - TypeScript types for Leaflet

#### Development Dependencies
- `typescript@5.5.2` - TypeScript compiler
- `@types/node@20.14.0` - TypeScript definitions for Node.js
- `@types/react@18.3.3` - TypeScript definitions for React
- `@types/react-dom@18.3.0` - TypeScript definitions for React DOM
- `tailwindcss@3.4.4` - Utility-first CSS framework
- `postcss@8.4.38` - CSS processing tool
- `autoprefixer@10.4.19` - PostCSS plugin for vendor prefixes
- `tsx@4.15.7` - TypeScript execution engine
- `prisma@6.19.3` - Database toolkit
- `eslint` - Code linting

### Database Requirements

- **SQLite**: Embedded database (included with Prisma)
- Database file location: `prisma/dev.db`

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
DATABASE_URL="file:./dev.db"
```

## Installation Steps

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Generate Prisma client**:
   ```bash
   npm run db:generate
   ```

3. **Push database schema**:
   ```bash
   npm run db:push
   ```

4. **Seed the database** (optional, for demo data):
   ```bash
   npm run db:seed
   ```

5. **Or run all database setup commands at once**:
   ```bash
   npm run db:setup
   ```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on http://localhost:3000 |
| `npm run build` | Build production application |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint for code quality checks |
| `npm run db:generate` | Generate Prisma client from schema |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:seed` | Seed database with initial data |
| `npm run db:setup` | Run all database setup commands |

## Project Structure

```
matadi-waste-optimizer/
├── prisma/
│   ├── schema.prisma      # Database schema definition
│   ├── seed.ts            # Database seeding script
│   └── dev.db             # SQLite database file
├── src/
│   ├── app/
│   │   ├── layout.tsx     # Root layout component
│   │   ├── page.tsx       # Main application page
│   │   ├── globals.css    # Global styles
│   │   └── favicon.ico    # Application favicon
│   ├── components/
│   │   ├── WasteMap.tsx   # Interactive map component
│   │   └── VolumeChart.tsx # Volume visualization chart
│   ├── lib/
│   │   ├── prisma.ts      # Prisma client instance
│   │   └── routeOptimizer.ts # Route optimization algorithms
│   └── data/
│       └── mockLocations.ts # Mock location data
├── public/                 # Static assets
├── .env                    # Environment variables
├── next.config.ts          # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Project dependencies and scripts
```

## Architecture Overview

### Database Schema

The application uses four main models:

1. **CollectionPoint**: Represents waste collection points with location coordinates and status
2. **Alert**: Tracks when collection points reach capacity
3. **Route**: Stores calculated optimization routes
4. **RoutePoint**: Defines the order of collection points within a route

### Key Features

- Interactive map visualization using Leaflet
- Real-time collection point monitoring
- Automated route optimization algorithms
- Alert system for full collection points
- Volume tracking and analytics

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development Guidelines

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS for styling
- Functional React components with hooks

### Best Practices
- Use environment variables for configuration
- Keep components small and focused
- Implement proper error handling
- Follow React best practices for state management
- Use Prisma for type-safe database operations
