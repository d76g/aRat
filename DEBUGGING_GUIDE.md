# Debugging Client-Side Errors

## What I've Implemented

### 1. Error Boundaries
- **`app/error.tsx`**: Catches errors in page components
- **`app/global-error.tsx`**: Catches errors in the root layout
- Both log detailed error information to the console

### 2. Fixed Hydration Issues
- **`components/providers.tsx`**: Removed the `mounted` state check that was causing hydration mismatches
- **`components/local-image.tsx`**: Added better error handling and try-catch blocks

### 3. Error Logging
All errors now log:
- Error message
- Stack trace
- Error digest (unique ID)
- Timestamp
- User agent
- Current URL

## How to Debug "Application Error: A Client-Side Exception Has Occurred"

### Step 1: Check Browser Console
Ask users to:
1. Open Developer Tools (F12 or Right-click → Inspect)
2. Go to the Console tab
3. Look for red error messages
4. Take a screenshot and send it

### Step 2: Common Causes

#### A. Hydration Mismatch
**Symptoms**: "Text content does not match server-rendered HTML"
**Solution**: Check for:
- Components using `window` or `document` during initial render
- Date formatting differences between server/client
- Random values generated during render

#### B. Invalid Image URLs
**Symptoms**: Network errors or image loading failures
**Check**: 
- `/uploads/` directory exists and is accessible
- Image paths are correctly formatted
- No broken S3 URLs with "undefined" in them

#### C. Session/Auth Issues
**Symptoms**: "Cannot read property of undefined" related to session
**Check**:
- NextAuth configuration
- Session cookies
- Token expiration

#### D. Special Characters in URLs
**Symptoms**: 404 errors for profiles with apostrophes, accents
**Status**: ✅ FIXED - URLs are now decoded properly

### Step 3: Check Server Logs
In your production environment:
```bash
# If using PM2
pm2 logs prieelo

# Or check your VPS logs
journalctl -u prieelo -n 100
```

### Step 4: Test in Different Browsers
Ask users to try:
- Chrome/Edge
- Firefox
- Safari
- Mobile browsers

### Step 5: Check Network Tab
1. Open Developer Tools → Network tab
2. Refresh the page
3. Look for:
   - Failed requests (red)
   - 404 errors (missing resources)
   - 500 errors (server errors)
   - CORS errors

## Monitoring Recommendations

### Production Error Tracking
Consider implementing:
1. **Sentry** - Free tier available, excellent error tracking
2. **LogRocket** - Session replay for debugging
3. **Cloudflare Web Analytics** - Free, privacy-friendly

### Quick Setup for Sentry (Optional)
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

## Quick Fixes to Try

### 1. Clear Browser Cache
Ask users to hard refresh:
- **Windows/Linux**: Ctrl + Shift + R
- **Mac**: Cmd + Shift + R

### 2. Clear Site Data
In Chrome: Developer Tools → Application → Clear site data

### 3. Test Incognito/Private Mode
This rules out extension conflicts

### 4. Check Image Optimization
If many image errors occur:
```bash
# Rebuild Next.js image cache
npm run build
rm -rf .next
npm run start
```

## Testing Checklist

Before deploying fixes:
- [ ] Test on desktop (Chrome, Firefox, Safari)
- [ ] Test on mobile (iOS, Android)
- [ ] Test with slow network (DevTools → Network → Slow 3G)
- [ ] Test as logged-in user
- [ ] Test as logged-out visitor
- [ ] Test profile pages with special characters
- [ ] Test image loading (various formats and sizes)
- [ ] Check all main routes: /, /profile/*, /projects/*

## Contact for Support
If errors persist, email: team@prieelo.com

Include:
- Error message from console
- Browser and OS version
- Steps to reproduce
- Screenshot if possible

