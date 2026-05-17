# WebSocket Support Fix for Supabase Storage

## Problem
Leapcell uses Node.js 20, which doesn't have native WebSocket support. The `@supabase/supabase-js` package requires WebSocket for real-time features.

## Error Message
```
Node.js 20 detected without native webSocket support.
Suggested solution: For Node.js < 22, install "ws" package and provide it via the transport option
```

## Solution Applied

### 1. Installed `ws` Package
```bash
npm install ws
```

### 2. Updated Supabase Storage Service
Modified `backend-nodejs/src/services/supabase-storage.service.js` to:
- Import the `ws` package
- Configure Supabase client with WebSocket transport
- Add proper error handling
- Add initialization logging

### 3. Configuration
The Supabase client now initializes with:
```javascript
const ws = require('ws');
supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'x-client-info': 'supabase-js-node',
    },
  },
  realtime: {
    transport: ws,
  },
});
```

## Verification

After deployment, check:
```
https://newtwotourism-yomugdagaba9439-uhal9g6y.leapcell.dev/api/debug/env
```

Expected response:
```json
{
  "supabaseConfigured": true,
  "supabaseUrl": "https://gclzstgdcguzocxxgkdv.supabase.co",
  "hasServiceKey": true
}
```

## Next Steps

1. ✅ Code pushed to GitHub
2. ⏳ Wait for Leapcell auto-deployment (1-2 minutes)
3. ⏳ Test debug endpoint
4. ⏳ Test image upload
5. ⏳ Verify images display correctly

## Files Changed
- `backend-nodejs/package.json` - Added `ws` dependency
- `backend-nodejs/package-lock.json` - Updated lock file
- `backend-nodejs/src/services/supabase-storage.service.js` - Added WebSocket support
- `backend-nodejs/src/index.js` - Added error handling to debug endpoint
