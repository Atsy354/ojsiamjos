# Reviewer Assignment RLS Fix - Session Summary
**Date:** 2025-12-20
**Duration:** ~2 hours

## Problem Statement
Editor tidak bisa assign reviewer karena RLS (Row Level Security) policy error:
```
"new row violates row-level security policy for table review_rounds"
```

Dan reviewer tidak bisa melihat assignments mereka di dashboard.

---

## Root Causes Identified

### 1. **RLS Policy Issues**
- Multiple conflicting policies di `review_assignments` dan `review_rounds`
- Policy menggunakan `app.is_member()` function yang tidak berfungsi
- Policy terlalu restrictive untuk editor

### 2. **Database Schema Mismatch**
- Kolom `review_rounds.id` tidak ada (seharusnya `review_round_id`)
- Type mismatch: UUID vs TEXT comparisons
- Foreign key names tidak sesuai dengan actual schema

### 3. **User Data Issues**
- Reviewer user hanya ada di `auth.users`, tidak di `public.users`
- RLS policy mencari user di `public.users` tapi user tidak ada
- `first_name` dan `last_name` NULL

### 4. **API Query Issues**
- PostgREST foreign key joins gagal karena metadata mismatch
- Query mengembalikan empty array walaupun data ada
- Frontend fetch sebelum user loaded (`user?.id` = undefined)

---

## Solutions Implemented

### 1. **Fixed RLS Policies** ✅
**File:** `migrations/fix_reviewer_assignment_rls.sql`

- Dropped conflicting policies
- Created new comprehensive policies:
  - `review_rounds_access_policy` - allows editors/admins to create/manage
  - `review_assignments_access_policy` - allows editors to assign, reviewers to view their own
- Used correct column names (`review_round_id` instead of `id`)
- Proper UUID-to-UUID comparisons without casting

### 2. **Synced User Data** ✅
**File:** `migrations/sync_reviewer_to_public_users.sql`

- Synced reviewer from `auth.users` to `public.users`
- Extracted data from `raw_user_meta_data`
- Updated `first_name`, `last_name`, and `roles`

### 3. **Fixed API Queries** ✅
**File:** `app/api/reviews/route.ts`

- Removed complex PostgREST foreign key joins
- Implemented manual joins using separate queries
- Created lookup Maps for efficient joining
- Added proper error handling for empty arrays

### 4. **Fixed Frontend** ✅
**File:** `app/reviews/page.tsx`

- Added `user?.id` to useEffect dependency array
- Added guard to prevent fetch when user not loaded
- Fixed `reviewerId=undefined` issue

### 5. **Fixed Respond API** ✅
**File:** `app/api/reviews/[id]/respond/route.ts`

- Removed foreign key joins
- Fixed references to use `assignment.submission_id` directly
- Fixed references to use `assignment.review_round_id` directly

---

## Files Modified

### Migrations
1. `migrations/fix_reviewer_assignment_rls.sql` - RLS policy fixes
2. `migrations/cleanup_conflicting_policies.sql` - Remove old policies
3. `migrations/sync_reviewer_to_public_users.sql` - Sync user data
4. `migrations/update_reviewer_name.sql` - Update reviewer names

### API Routes
1. `app/api/reviews/route.ts` - Fixed GET endpoint with manual joins
2. `app/api/reviews/[id]/respond/route.ts` - Fixed PATCH endpoint

### Frontend
1. `app/reviews/page.tsx` - Fixed useEffect and user loading

---

## Database Changes

### RLS Policies
```sql
-- Only these policies remain (old ones removed):
- review_rounds_access_policy (ALL operations)
- review_assignments_access_policy (ALL operations)
```

### User Data
```sql
-- Reviewer now exists in public.users:
id: c1e95c17-16c7-485e-960c-d28854ebd616
email: reviewer@jcst.org
first_name: JCST
last_name: Reviewer
roles: ['reviewer']
```

---

## Testing Results

### ✅ Working Features
1. **Editor can assign reviewers** - No more RLS errors
2. **Reviewer can see assignments** - Dashboard shows all pending invitations
3. **Reviewer can accept/decline** - Buttons work correctly
4. **Data displays correctly** - Submission titles, dates, status badges

### ⚠️ Known Issues
1. **Article status not updating** - After reviewer accepts, article still shows as pending in editor dashboard
   - Likely cause: Review round status update logic
   - Needs investigation of editorial decision workflow

---

## Next Steps

### Immediate
1. Debug why article status remains pending after reviewer accepts
2. Check `review_rounds.status` update logic
3. Verify editorial decision workflow

### Future Improvements
1. Create database trigger to auto-sync users from auth.users to public.users
2. Add better error messages for RLS violations
3. Add logging for review round status changes
4. Consider removing Prisma schema or clearly mark as documentation only

---

## Key Learnings

1. **Supabase RLS is strict** - Multiple policies can conflict, keep it simple
2. **PostgREST foreign keys** - Can fail silently, manual joins more reliable
3. **Type safety matters** - UUID vs TEXT mismatches cause cryptic errors
4. **User data sync** - auth.users and public.users must be in sync
5. **Frontend timing** - Always wait for auth state before fetching data

---

## Commands to Run (Summary)

```sql
-- 1. Fix RLS policies
\i migrations/fix_reviewer_assignment_rls.sql

-- 2. Cleanup old policies
\i migrations/cleanup_conflicting_policies.sql

-- 3. Sync user data (if needed for other reviewers)
\i migrations/sync_reviewer_to_public_users.sql
```

---

## Contact & Support
For issues with this fix, check:
1. Terminal logs for API errors
2. Browser console for frontend errors
3. Supabase logs for RLS violations
4. Database query logs for SQL errors
