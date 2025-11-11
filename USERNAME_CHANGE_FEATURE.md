# Username Change Feature

## Overview
Users can now change their username from the Profile Settings page with proper validation and restrictions.

## Restrictions
- **Only lowercase letters** (a-z)
- **Numbers** (0-9)
- **Periods** (.)
- **Underscores** (_)
- **Minimum length**: 3 characters
- **Maximum length**: 30 characters
- **Must be unique**: No two users can have the same username

## Features Implemented

### 1. Frontend (Profile Settings Page)
**File**: `app/profile/[username]/settings/page.tsx`

#### New Username Field
- Added username input field in the Profile Information section
- Real-time validation: Automatically converts to lowercase and filters invalid characters
- Character limit: 30 characters max
- Helper text showing allowed characters and requirements

#### Client-Side Validation
- Format validation (lowercase, numbers, periods, underscores only)
- Length validation (3-30 characters)
- User-friendly error messages via toast notifications

#### Auto-Redirect
- After successful username change, automatically redirects to new profile URL
- Example: If you change username from "john_doe" to "john.smith", redirects to `/profile/john.smith/settings`

### 2. Backend (API Route)
**File**: `app/api/profile/update/route.ts`

#### Server-Side Validation
- Format validation using regex: `/^[a-z0-9._]+$/`
- Length validation (3-30 characters)
- Uniqueness check: Prevents duplicate usernames
- Returns specific error messages for each validation failure

#### Database Update
- Updates username in the database
- Returns updated user data including new username
- Transaction-safe update

### 3. Session Management
**File**: `lib/auth-config.ts`

#### Session Refresh
- Session callback now fetches latest username from database
- Ensures navbar and profile links use updated username immediately
- No need to log out and log back in after username change

## User Experience

### How to Change Username
1. Go to Profile Settings (click your profile → Settings)
2. Find the "Username" field at the top of Profile Information
3. Enter your new username (lowercase, numbers, dots, underscores only)
4. Click "Save Profile"
5. You'll be automatically redirected to your new profile URL

### Error Messages
Users will see clear error messages for:
- ❌ Invalid characters: "Username can only contain lowercase letters, numbers, periods (.) and underscores (_)"
- ❌ Too short: "Username must be at least 3 characters long"
- ❌ Too long: "Username must be less than 30 characters"
- ❌ Already taken: "Username is already taken"
- ✅ Success: "Profile updated successfully!"

### Example Valid Usernames
- `john_doe`
- `maker.123`
- `green_remaker`
- `user_2025`
- `eco.warrior`

### Example Invalid Usernames
- `John_Doe` ❌ (uppercase)
- `user@123` ❌ (@ not allowed)
- `my username` ❌ (spaces not allowed)
- `ab` ❌ (too short)
- `User-Name` ❌ (hyphens not allowed, uppercase)

## Technical Details

### Files Modified
1. `app/profile/[username]/settings/page.tsx` - Added username field and validation
2. `app/api/profile/update/route.ts` - Added server-side username handling
3. `lib/auth-config.ts` - Updated session to refresh username

### Database
- Uses existing `username` field in User model (Prisma)
- Enforces uniqueness at database level
- Index on username for fast lookups

### Security
- All validation done both client-side (UX) and server-side (security)
- SQL injection protected via Prisma ORM
- Authenticated users only can change their own username
- Username change doesn't affect user ID or relationships

## Testing Checklist

- [ ] Change username with valid format
- [ ] Try uppercase letters (should convert to lowercase)
- [ ] Try special characters (should be filtered)
- [ ] Try username less than 3 characters
- [ ] Try username more than 30 characters
- [ ] Try taking an existing username
- [ ] Verify redirect after successful change
- [ ] Verify old profile URL redirects or shows 404
- [ ] Verify navbar updates with new username
- [ ] Verify all user links update across the site

## Future Enhancements (Optional)

1. **Username History**: Track username changes for audit
2. **Cooldown Period**: Limit username changes to once per week/month
3. **Reserved Usernames**: Block system reserved names (admin, prieelo, etc.)
4. **Username Availability Check**: Real-time check while typing
5. **Profile URL Redirect**: Redirect old username URL to new one for a period

## Notes
- Username changes are immediate and permanent
- Old profile URLs will return 404 after username change
- All user content (projects, posts, comments) automatically associated with new username via user ID

