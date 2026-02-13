# Project Accomplishments Log

## 🛠️ Database & Infrastructure
- **Fixed RLS Policy Errors**: Resolved the `unrecognized configuration parameter "app.current_user_id"` error by dropping legacy policies and implementing standard Supabase Auth-based RLS policies.
- **Enhanced Schema**: Added `gpa` and `minor` columns to the `student_profiles` table to support richer student data.
- **Fixed Date Handling**: Implemented automatic date formatting (appending `-01` to YYYY-MM) to ensure compatibility with Postgres `DATE` type.

## 🤖 AI-Powered Features
- **Transcript Data Extraction**: Developed a new AI function using Groq's LLM to automatically extract name, student ID, major, minor, and cumulative GPA from academic transcript PDFs.
- **Form Auto-Filling**: Integrated AI extraction into the Onboarding flow, allowing the app to pre-populate student information instantly upon file upload.

## 🖥️ User Interface & Dashboard
- **Corrected ID Display**: Updated the dashboard to show the student's 10-digit university ID instead of the internal database UUID.
- **Profile Edit Feature**: Implemented an "Edit Profile" dialog on the dashboard (pencil icon) allowing students to manually update their information.
- **Logout Functionality**: Added a dedicated logout button to the navigation header for easier account management.
- **UI Polishing**: Refined navigation styling and added sticky header support for better UX.

## 🧹 Code Quality
- **Resolved Build Warnings**: Fixed duplicate key issues in `student-context.ts` that were causing Vite/esbuild warnings.
- **Standardized Context**: Updated `student-context.ts` and `ComprehensiveStudentProfile` interface to properly handle `minor` and `gpa` fields across the application.

---

## 🚧 Current Challenge: Database Schema Mismatch (2026-02-12)

**Problem**: The local `supabase_schema.sql` file is **out of sync** with the actual Supabase database, causing repeated NOT NULL constraint violations.

### Issues Encountered (In Order):
1. ✅ **`student_type` enum mismatch** - DB expected `{international, local}` but code sent `{freshman, existing}` → **FIXED**
2. ✅ **`program_code` missing** - Programs table requires `program_code` NOT NULL → **FIXED** (auto-generated from program name)
3. ✅ **`student_profiles` ON CONFLICT** - No UNIQUE constraint on `user_id` → **FIXED** (replaced upsert with check-then-insert/update)
4. ❌ **`department` missing** - Programs table now requires `department` NOT NULL → **BLOCKING**

### Current Blocker:
- **Cannot create programs** because the `programs` table has a `department` column (NOT NULL) that the code doesn't provide
- Error: `null value in column "department" of relation "programs" violates not-null constraint`
- This prevents `program_id` from being linked to `student_profiles`
- Result: **Major and Minor show as "Undeclared"** on the dashboard

### Root Cause:
The local schema file doesn't reflect the actual database structure. We're discovering missing NOT NULL columns one at a time through runtime errors.

### Next Steps:
1. Get the full `programs` table schema from Supabase
2. Update the program insert to include ALL required fields
3. Consider syncing or regenerating the local schema file from the live database
