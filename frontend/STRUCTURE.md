# Frontend Structure Documentation

Complete guide to the North Wollo Tourism frontend architecture, files, and folders.

---

## 📁 Project Structure

```
frontend/
├── .next/                    # ⚠️ Build output (auto-generated, gitignored)
├── certificates/             # 🔒 SSL certificates for local HTTPS development
├── node_modules/             # 📦 Installed npm packages (gitignored)
├── public/                   # 🖼️ Static assets served at root URL
│   ├── images/              # Image files
│   └── *.svg                # Icon files
├── src/                      # 💻 Application source code
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility libraries
│   ├── services/            # API service layer
│   ├── store/               # State management (Zustand)
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Helper functions
│   └── middleware.ts        # Next.js middleware (auth guards)
├── tests/                    # 🧪 Test files
│   └── e2e/                 # Playwright end-to-end tests
├── test-results/             # ⚠️ Test artifacts (auto-generated, gitignored)
├── .env.example              # 📝 Environment variable template
├── .env.local                # 🔐 Local environment variables (gitignored)
├── .gitignore                # 🚫 Git exclusion rules
├── eslint.config.mjs         # 🔍 Code linting configuration
├── next.config.ts            # ⚙️ Next.js framework configuration
├── next-env.d.ts             # 📘 Next.js TypeScript declarations (auto-generated)
├── package.json              # 📦 Dependencies and scripts
├── package-lock.json         # 🔒 Locked dependency versions
├── playwright.config.ts      # 🎭 E2E test configuration
├── postcss.config.mjs        # 🎨 CSS processing configuration
├── README.md                 # 📖 Project documentation
├── tailwind.config.ts        # 🎨 Tailwind CSS configuration
├── tsconfig.json             # 📘 TypeScript compiler configuration
└── tsconfig.tsbuildinfo      # ⚠️ TypeScript build cache (auto-generated, gitignored)
```

---

## 📂 Folder Details

### **`src/` - Application Source Code**

The heart of your application. All custom code lives here.

#### **`src/app/` - Next.js App Router**
Next.js 13+ uses file-based routing. Each folder represents a route.

```
src/app/
├── (auth)/                   # Route group (doesn't affect URL)
│   ├── login/               # /login
│   ├── register/            # /register
│   └── verify-email/        # /verify-email
├── admin/                    # /admin (protected)
│   ├── audit/               # /admin/audit
│   ├── bookings/            # /admin/bookings
│   ├── guiders/             # /admin/guiders
│   ├── hero-images/         # /admin/hero-images
│   ├── hotels/              # /admin/hotels
│   ├── map-points/          # /admin/map-points
│   ├── roads/               # /admin/roads
│   ├── security/            # /admin/security
│   ├── tourism/             # /admin/tourism
│   └── users/               # /admin/users
├── bookings/                 # /bookings (user bookings)
├── dashboard/                # /dashboard (user dashboard)
├── hotels/                   # /hotels (hotel listings)
├── owner/                    # /owner (hotel owner area)
│   └── bookings/            # /owner/bookings
├── tourism/                  # /tourism (tourism places)
│   └── [id]/                # /tourism/123 (dynamic route)
├── layout.tsx                # Root layout (wraps all pages)
├── page.tsx                  # Homepage (/)
└── globals.css               # Global styles
```

**Key concepts:**
- `page.tsx` = Publicly accessible page
- `layout.tsx` = Shared layout wrapper
- `[id]/` = Dynamic route parameter
- `(auth)/` = Route group (organizational only)

#### **`src/components/` - React Components**
Reusable UI components organized by feature.

```
src/components/
├── admin/                    # Admin-specific components
│   ├── AdminBookingCard.tsx
│   ├── AdminSidebar.tsx
│   └── ...
├── auth/                     # Authentication components
│   ├── LoginModal.tsx
│   ├── RegisterModal.tsx
│   └── ...
├── bookings/                 # Booking-related components
│   ├── BookingCard.tsx
│   ├── BookingStatusBadge.tsx
│   └── ...
├── common/                   # Shared/generic components
│   ├── Button.tsx
│   ├── Modal.tsx
│   ├── PhoneInput.tsx
│   └── ...
├── home/                     # Homepage components
│   ├── Hero.tsx
│   ├── HorizontalTourismSlider.tsx
│   └── ...
├── hotels/                   # Hotel components
│   ├── HotelCard.tsx
│   ├── HotelRatingModal.tsx
│   └── ...
├── layout/                   # Layout components
│   ├── TopBar.tsx
│   ├── Footer.tsx
│   └── ...
└── tourism/                  # Tourism place components
    ├── TourismCard.tsx
    ├── TourismDetail.tsx
    ├── TourismTabs.tsx
    └── ...
```

#### **`src/services/` - API Service Layer**
All backend API calls are centralized here.

```
src/services/
├── api.ts                    # Base API configuration & interceptors
├── admin.service.ts          # Admin CRUD operations
├── audit.service.ts          # Audit log operations
├── auth.service.ts           # Login, register, token refresh
├── booking.service.ts        # Hotel booking operations
├── guider.service.ts         # Language guider operations
├── horse.service.ts          # Horse service operations
├── hotel.service.ts          # Hotel operations
├── location.service.ts       # Ethiopian location data
├── map.service.ts            # Map & routing operations
├── rating.service.ts         # Rating & review operations
├── road.service.ts           # Road information operations
├── security.service.ts       # Admin security operations
├── tourism.service.ts        # Tourism place operations
└── tourismImage.service.ts   # Tourism image operations
```

**Pattern:**
```typescript
// Example: auth.service.ts
export async function login(username: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return response.json();
}
```

#### **`src/store/` - State Management**
Global state using Zustand.

```
src/store/
└── useAuthStore.ts           # Authentication state (user, token, role)
```

**Usage:**
```typescript
const { user, token, login, logout } = useAuthStore();
```

#### **`src/types/` - TypeScript Types**
Type definitions for API responses and data models.

```
src/types/
├── audit.ts                  # Audit log types
├── auth.ts                   # Auth request/response types
├── booking.ts                # Booking types
├── guider.ts                 # Language guider types
├── horse.ts                  # Horse service types
├── hotel.ts                  # Hotel types
├── map.ts                    # Map & location types
├── rating.ts                 # Rating types
├── road.ts                   # Road types
├── tourism.ts                # Tourism place types
└── tourismImage.ts           # Tourism image types
```

#### **`src/hooks/` - Custom React Hooks**
Reusable React logic.

```
src/hooks/
└── useAuthGuard.tsx          # Route protection hook
```

**Usage:**
```typescript
useAuthGuard({ requiredRole: 'ADMIN', redirectTo: '/login' });
```

#### **`src/utils/` - Helper Functions**
Utility functions and validators.

```
src/utils/
├── auth.ts                   # Token management utilities
├── ethiopianValidation.ts    # Ethiopian phone/name validation
└── hasUserRated.ts           # Rating check utility
```

#### **`src/middleware.ts` - Next.js Middleware**
Runs before requests to protect routes.

```typescript
// Protects /admin, /dashboard, /owner routes
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token');
  if (!token) return NextResponse.redirect('/login');
  // ... role-based checks
}
```

---

### **`public/` - Static Assets**

Files served directly at the root URL path.

```
public/
├── images/
│   ├── hero.jpg              # Homepage hero image
│   ├── tourism1.jpg          # Sample tourism images
│   └── tourism2.jpg
├── file.svg                  # Icon files
├── globe.svg
├── next.svg
├── vercel.svg
└── window.svg
```

**Access:** `<img src="/images/hero.jpg" />` → Served from `public/images/hero.jpg`

---

### **`tests/e2e/` - End-to-End Tests**

Playwright tests simulating real user interactions.

```
tests/e2e/
├── st01-registration.spec.ts         # User registration flow
├── st02-tourism-discovery.spec.ts    # Tourism browsing & search
├── st03-booking-lifecycle.spec.ts    # Hotel booking flow
└── st06-st18-admin-workflows.spec.ts # Admin operations
```

**Run tests:**
```bash
npm run test:e2e
```

---

## 📄 Configuration Files Explained

### **Environment Configuration**

#### **`.env.local`** (gitignored)
Your local environment variables. Contains secrets.

```bash
NEXT_PUBLIC_API_URL=https://localhost:9001/api
```

**Note:** Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

#### **`.env.example`**
Template for other developers. No secrets.

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

### **TypeScript Configuration**

#### **`tsconfig.json`**
TypeScript compiler settings.

**Key settings:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]        // Import alias: import X from "@/components/X"
    },
    "jsx": "preserve",          // Keep JSX for Next.js to process
    "strict": true,             // Enable all strict type checks
    "incremental": true         // Faster rebuilds with cache
  }
}
```

#### **`next-env.d.ts`** (auto-generated)
Next.js TypeScript declarations. Don't edit manually.

#### **`tsconfig.tsbuildinfo`** (auto-generated, gitignored)
TypeScript incremental build cache. Speeds up compilation.

---

### **Next.js Configuration**

#### **`next.config.ts`**
Next.js framework settings.

**Key configurations:**
```typescript
{
  images: {
    remotePatterns: [...]       // Whitelist external image domains
  },
  onDemandEntries: {
    maxInactiveAge: 60000,      // Memory optimization
    pagesBufferLength: 5
  }
}
```

---

### **Styling Configuration**

#### **`tailwind.config.ts`**
Tailwind CSS utility class configuration.

```typescript
{
  content: [
    "./src/**/*.{js,ts,jsx,tsx}"  // Scan these files for classes
  ],
  theme: {
    extend: {}                     // Custom theme extensions
  }
}
```

#### **`postcss.config.mjs`**
CSS processing pipeline.

```javascript
{
  plugins: {
    tailwindcss: {},              // Process Tailwind classes
    autoprefixer: {}              // Add vendor prefixes (-webkit-, -moz-)
  }
}
```

**How it works:**
1. You write: `className="bg-blue-500"`
2. Tailwind generates: `.bg-blue-500 { background-color: #3b82f6; }`
3. Autoprefixer adds: `-webkit-background-color: #3b82f6;`

---

### **Code Quality Configuration**

#### **`eslint.config.mjs`**
ESLint rules for code quality and consistency.

**What it checks:**
- TypeScript type errors
- React hooks rules (useEffect dependencies)
- Next.js best practices (Image optimization)
- Unused variables
- Code style consistency

**Run linter:**
```bash
npx eslint . --fix
```

---

### **Testing Configuration**

#### **`playwright.config.ts`**
E2E test settings.

```typescript
{
  testDir: './tests/e2e',
  baseURL: 'https://localhost:9000',
  ignoreHTTPSErrors: true,        // Accept self-signed certs
  retries: 1,                     // Retry failed tests once
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  }
}
```

---

### **Package Management**

#### **`package.json`**
Project metadata, dependencies, and scripts.

**Scripts:**
```json
{
  "dev": "next dev --experimental-https -p 9000",  // Local dev with HTTPS
  "build": "next build",                           // Production build
  "start": "next start",                           // Production server
  "test:e2e": "playwright test"                    // Run E2E tests
}
```

**Dependencies:**
- `next` - React framework
- `react` - UI library
- `typescript` - Type safety
- `tailwindcss` - Styling
- `zustand` - State management
- `axios` - HTTP client
- `leaflet` - Maps
- `@playwright/test` - E2E testing

#### **`package-lock.json`**
Locked dependency versions. Ensures consistent installs across environments.

---

## 🗑️ Auto-Generated Files (Gitignored)

These files are automatically created and should **never** be committed:

| File/Folder | Generated By | Regenerated By |
|-------------|--------------|----------------|
| `.next/` | `npm run build` | Every build |
| `node_modules/` | `npm install` | Every install |
| `test-results/` | `npm run test:e2e` | Every test run |
| `tsconfig.tsbuildinfo` | TypeScript compiler | Every compilation |
| `.env.local` | You (manually) | N/A (contains secrets) |

---

## 🔒 Security Files

### **SSL Certificates** (`certificates/`)

**Purpose:** Enable HTTPS for local development.

**Files:**
- `localhost.pem` - SSL certificate
- `localhost-key.pem` - Private key

**Usage:**
```bash
npm run dev  # Runs on https://localhost:9000
```

**Production:** Not needed. Hosting platforms (Vercel, Netlify) provide SSL automatically.

**Generate new certificates:**
```bash
# Using mkcert (recommended)
mkcert -install
mkcert -key-file certificates/localhost-key.pem -cert-file certificates/localhost.pem localhost
```

---

## 🚀 Common Commands

### Development
```bash
npm run dev              # Start dev server (https://localhost:9000)
npm run build            # Build for production
npm run start            # Start production server
```

### Testing
```bash
npm run test:e2e         # Run E2E tests
npm run test:e2e:ui      # Run E2E tests with UI
```

### Code Quality
```bash
npx eslint . --fix       # Lint and auto-fix code
npx tsc --noEmit         # Type check without building
```

### Cleanup
```bash
rm -rf .next test-results tsconfig.tsbuildinfo  # Remove build artifacts
rm -rf node_modules && npm install              # Fresh dependency install
```

---

## 📦 Build Process

### Development Build (`npm run dev`)
1. Next.js starts dev server
2. TypeScript compiles on-the-fly
3. Tailwind processes CSS
4. Hot reload on file changes

### Production Build (`npm run build`)
1. TypeScript compiles all files
2. Next.js optimizes pages
3. Tailwind purges unused CSS
4. Images optimized
5. Output: `.next/` folder

### Production Deployment
1. Build locally: `npm run build`
2. Deploy `.next/` folder to hosting
3. Or: Connect Git repo to Vercel (auto-builds)

---

## 🔗 File Relationships

```
package.json
  ├─> Defines dependencies
  └─> Defines scripts (dev, build, test)

next.config.ts
  └─> Configures Next.js framework

tsconfig.json
  └─> Configures TypeScript compiler
      └─> Generates tsconfig.tsbuildinfo (cache)

tailwind.config.ts
  └─> Defines Tailwind CSS classes
      └─> Used by postcss.config.mjs
          └─> Processes CSS during build

eslint.config.mjs
  └─> Validates code quality

playwright.config.ts
  └─> Configures E2E tests in tests/e2e/

.env.local
  └─> Provides environment variables
      └─> Used by src/ code
          └─> Accessed via process.env.NEXT_PUBLIC_*

src/middleware.ts
  └─> Runs before every request
      └─> Protects routes based on auth

src/app/layout.tsx
  └─> Wraps all pages
      └─> Provides global layout

src/services/api.ts
  └─> Base API configuration
      └─> Used by all service files
          └─> Called by components
```

---

## 🎯 Best Practices

### File Organization
- ✅ Group by feature (components/admin/, components/auth/)
- ✅ Keep components small and focused
- ✅ Use TypeScript for type safety
- ✅ Centralize API calls in services/

### Naming Conventions
- **Components:** PascalCase (`TourismCard.tsx`)
- **Services:** camelCase with .service suffix (`auth.service.ts`)
- **Types:** PascalCase with Dto suffix (`AuthResponseDto`)
- **Hooks:** camelCase with use prefix (`useAuthGuard`)
- **Utils:** camelCase (`ethiopianValidation.ts`)

### Import Aliases
Use `@/` instead of relative paths:
```typescript
// ❌ Bad
import Button from '../../../components/common/Button';

// ✅ Good
import Button from '@/components/common/Button';
```

### Environment Variables
- Prefix with `NEXT_PUBLIC_` for browser access
- Never commit `.env.local`
- Always provide `.env.example`

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Playwright Docs](https://playwright.dev/)
- [React Documentation](https://react.dev/)

---

## 🆘 Troubleshooting

### "Module not found" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors after pulling changes
```bash
rm tsconfig.tsbuildinfo
npx tsc --noEmit
```

### Build fails
```bash
rm -rf .next
npm run build
```

### Tests fail with certificate errors
```bash
# Set in .env.local
NODE_TLS_REJECT_UNAUTHORIZED=0
```

---

**Last Updated:** May 2026  
**Maintained By:** North Wollo Tourism Development Team
