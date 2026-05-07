# North Wollo Tourism - Frontend

Next.js 15 frontend application for the North Wollo Tourism Management System.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
# Opens https://localhost:9000
```

### Production Build
```bash
npm run build
npm start
```

### Testing
```bash
npm run test:e2e        # Run E2E tests
npm run test:e2e:ui     # Run with Playwright UI
```

## 📁 Project Structure

For detailed documentation on the project structure, see **[STRUCTURE.md](./STRUCTURE.md)**.

### Quick Overview
```
frontend/
├── src/
│   ├── app/              # Next.js pages (file-based routing)
│   ├── components/       # React components
│   ├── services/         # API service layer
│   ├── store/            # State management (Zustand)
│   ├── types/            # TypeScript types
│   ├── hooks/            # Custom React hooks
│   └── utils/            # Helper functions
├── public/               # Static assets
├── tests/e2e/            # Playwright tests
└── [config files]        # See STRUCTURE.md for details
```

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `next.config.ts` | Next.js framework settings |
| `tsconfig.json` | TypeScript compiler configuration |
| `tailwind.config.ts` | Tailwind CSS configuration |
| `eslint.config.mjs` | Code linting rules |
| `playwright.config.ts` | E2E test configuration |
| `.env.local` | Environment variables (gitignored) |

## 🌐 Environment Variables

Create a `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=https://localhost:9001/api
```

**Note:** Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

## 🔒 Local HTTPS Development

The frontend runs on HTTPS locally to match the backend and prevent mixed content warnings.

**Certificates are auto-generated** by Next.js when you run `npm run dev --experimental-https`.

To generate manually:
```bash
# Using mkcert (recommended)
mkcert -install
mkcert -key-file certificates/localhost-key.pem -cert-file certificates/localhost.pem localhost
```

## 🧪 Testing

### E2E Tests (Playwright)
```bash
# Run all tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run specific test file
npx playwright test tests/e2e/st01-registration.spec.ts
```

**Test Coverage:**
- User registration and authentication
- Tourism place discovery and search
- Hotel booking lifecycle
- Admin workflows

## 🎨 Styling

This project uses **Tailwind CSS** for styling.

```tsx
// Example
<button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
  Click Me
</button>
```

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `next` | React framework |
| `react` | UI library |
| `typescript` | Type safety |
| `tailwindcss` | Utility-first CSS |
| `zustand` | State management |
| `axios` | HTTP client |
| `leaflet` | Interactive maps |
| `@playwright/test` | E2E testing |

## 🔗 API Integration

All API calls are centralized in `src/services/`:

```typescript
// Example: src/services/auth.service.ts
import { API_BASE_URL } from './api';

export async function login(username: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return response.json();
}
```

## 🛡️ Authentication

Authentication is handled via JWT tokens stored in localStorage.

**Protected routes** are guarded by `src/middleware.ts`:
- `/admin/*` - Admin only
- `/dashboard` - Authenticated users
- `/owner/*` - Hotel owners

## 🗺️ Routing

Next.js uses file-based routing:

| File Path | URL | Access |
|-----------|-----|--------|
| `src/app/page.tsx` | `/` | Public |
| `src/app/login/page.tsx` | `/login` | Public |
| `src/app/tourism/[id]/page.tsx` | `/tourism/123` | Public |
| `src/app/dashboard/page.tsx` | `/dashboard` | Protected |
| `src/app/admin/users/page.tsx` | `/admin/users` | Admin only |

## 🧹 Cleanup Commands

```bash
# Remove build artifacts
rm -rf .next test-results tsconfig.tsbuildinfo

# Fresh install
rm -rf node_modules package-lock.json
npm install

# Type check
npx tsc --noEmit

# Lint and fix
npx eslint . --fix
```

## 📚 Documentation

- **[STRUCTURE.md](./STRUCTURE.md)** - Detailed project structure guide
- **[Next.js Docs](https://nextjs.org/docs)** - Framework documentation
- **[Tailwind CSS](https://tailwindcss.com/docs)** - Styling documentation
- **[Playwright](https://playwright.dev/)** - Testing documentation

## 🚢 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = Your backend URL

### Manual Deployment
```bash
npm run build
# Deploy the .next/ folder to your hosting provider
```

## 🆘 Troubleshooting

### Module not found errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors
```bash
rm tsconfig.tsbuildinfo
npx tsc --noEmit
```

### Build fails
```bash
rm -rf .next
npm run build
```

### Certificate errors in tests
Set in `.env.local`:
```bash
NODE_TLS_REJECT_UNAUTHORIZED=0
```

## 📄 License

MIT

---

**For detailed structure documentation, see [STRUCTURE.md](./STRUCTURE.md)**
