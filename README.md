# Waylight 🎢

> A little light for better plans.

Waylight is a cross-platform theme park planning application that helps visitors plan and manage their days with clarity and calm. Built with offline-first capabilities for pre-trip planning and in-park guidance.

## 🚀 Project Status

Currently in **Phase 1: Foundation** of development. MVP target: November 2025 alpha test at Walt Disney World.

## 📱 Platform Support

- **Web (Desktop-first)**: Pre-trip planning with React + Vite
- **Mobile (iOS & Android)**: In-park use with Expo React Native  
- **Offline Mode**: Full functionality without internet connection

## 🛠️ Tech Stack

### Shared Core
- TypeScript for type safety
- Shared business logic and data models
- Unified storage interfaces

### Web
- React 18 + Vite
- Tailwind CSS + Framer Motion
- Zustand state management
- Dexie.js (IndexedDB) for offline storage

### Mobile
- Expo SDK 50+ with React Native
- NativeWind (Tailwind for RN)
- React Navigation 6
- AsyncStorage with SQLite migration path

## 📦 Project Structure

```
waylight/
├── packages/
│   ├── shared/          # Shared types, utils, business logic
│   ├── web/             # React web application
│   └── mobile/          # React Native mobile app
├── .github/workflows/   # CI/CD pipelines
├── Development documents/ # PRD, plans, research
└── pnpm-workspace.yaml  # Monorepo configuration
```

## 🏗️ Development Setup

### Prerequisites
- Node.js 18+
- pnpm 8+
- Git

### Quick Start
```bash
# Clone the repository
git clone https://github.com/Pallarran/Waylight.git
cd Waylight

# Install dependencies
pnpm install

# Start development mode (all packages)
pnpm dev

# Or run individual packages:
pnpm web:dev          # Web development server
pnpm mobile:start     # Mobile development server  
pnpm shared:dev       # Shared package in watch mode
```

### Available Scripts

#### Root Level
- `pnpm dev` - Start all packages in development mode
- `pnpm build` - Build all packages
- `pnpm lint` - Lint all packages
- `pnpm type-check` - Type check all packages
- `pnpm format` - Format all files with Prettier
- `pnpm clean` - Clean all build artifacts

#### Package Specific
- `pnpm shared:build` - Build shared package
- `pnpm shared:dev` - Watch shared package
- `pnpm web:dev` - Start web dev server
- `pnpm web:build` - Build web for production
- `pnpm mobile:start` - Start Expo dev server
- `pnpm mobile:ios` - Open iOS simulator
- `pnpm mobile:android` - Open Android emulator

## 🎯 Key Features (MVP Scope)

### ✅ Foundation Complete
- [x] Monorepo setup with TypeScript
- [x] Shared package with types and utilities
- [x] Development environment configured
- [x] CI/CD pipeline setup

### 🚧 In Development
- [ ] Trip itinerary builder
- [ ] Attraction information system
- [ ] Toggleable tips system
- [ ] Offline storage implementation
- [ ] Basic park maps
- [ ] Export/share functionality

### 📅 Planned Features
- [ ] View modes (List, Card, Calendar)
- [ ] Personalization & utilities
- [ ] Mobile-optimized interface
- [ ] Web desktop experience

## 🎨 Design System

### Color Palette
- **Ink**: `#0F172A` (primary text/icons)
- **Surface**: `#F8FAFC` (background)  
- **Sea**: `#0EA5A8` (accent)
- **Glow**: `#FBBF24` (highlights)

### Typography
- **Primary**: Manrope or Inter
- **Fallback**: System UI stack

### Iconography
- Lucide icons with ~2px stroke weight
- Consistent outline style

## 🧪 Testing

```bash
# Run linting
pnpm lint

# Type checking
pnpm type-check

# Format checking
pnpm format:check
```

## 📱 Mobile Development

### iOS Development
```bash
# Start development server
pnpm mobile:start

# Open iOS Simulator
pnpm mobile:ios
```

### Android Development
```bash
# Start development server  
pnpm mobile:start

# Open Android Emulator
pnpm mobile:android
```

## 🌐 Web Development

```bash
# Development server (http://localhost:5173)
pnpm web:dev

# Build for production
pnpm web:build

# Preview production build
pnpm web:preview
```

## 📊 Deployment

### Web (Vercel)
- Automatic deployment on `main` branch pushes
- Preview deployments on pull requests
- Environment variables managed via Vercel dashboard

### Mobile (EAS Build)
- iOS: TestFlight distribution  
- Android: Google Play Internal Testing
- Manual builds until beta release

## 🤝 Development Workflow

1. **Feature branches**: Create from `main` for new features
2. **Pull requests**: All changes must go through PR review
3. **CI/CD**: Automated testing and building on all PRs
4. **Code quality**: ESLint, Prettier, and TypeScript strict mode
5. **Monorepo**: Shared code in `@waylight/shared` package

## 📝 VS Code Setup

Recommended extensions (auto-suggested):
- ESLint
- Prettier  
- Tailwind CSS IntelliSense
- TypeScript + React snippets
- Path Intellisense

Settings configured for:
- Format on save
- Auto-fix ESLint errors
- Tailwind CSS autocomplete

## 🔧 Troubleshooting

### Common Issues

**Dependency issues:**
```bash
pnpm reset  # Clean install everything
```

**TypeScript errors:**
```bash
pnpm type-check  # Check all packages
```

**Build failures:**
```bash
pnpm clean && pnpm build  # Clean rebuild
```

### Development Environment
- Node.js 18+ required
- Use pnpm (not npm/yarn) for consistency  
- Enable TypeScript strict mode
- Follow existing code patterns

## 🗺️ Roadmap

### Phase 1: Foundation ✅ (Weeks 1-2)
- [x] Project setup and monorepo configuration
- [x] Development environment
- [x] CI/CD pipeline

### Phase 2: Shared Package (Weeks 3-4)
- [x] Core types and interfaces ✅
- [x] Business logic utilities ✅ 
- [ ] Static content management
- [ ] Storage abstractions

### Phase 3: Web Application (Weeks 5-8)
- [ ] React app foundation
- [ ] Trip builder interface
- [ ] Attraction browser
- [ ] Offline storage integration

### Phase 4: Mobile Application (Weeks 9-12)
- [ ] Expo app setup
- [ ] Native navigation
- [ ] Cross-platform components
- [ ] Mobile optimizations

### Phase 5: Content & Testing (Weeks 13-16)
- [ ] Magic Kingdom attraction data
- [ ] Tips system implementation  
- [ ] Comprehensive testing
- [ ] Performance optimization

### Alpha Testing: November 2025
- [ ] Real-world testing at Walt Disney World
- [ ] Feedback collection and iteration

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🔗 Links

- [Product Requirements Document](Development%20documents/Waylight_PRD.md)
- [Development Plan](Development%20documents/Waylight_Development_Plan.md)
- [GitHub Repository](https://github.com/Pallarran/Waylight)

---

**Built with ❤️ for theme park enthusiasts**