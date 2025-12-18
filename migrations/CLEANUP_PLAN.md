# Migration Files Cleanup

## Files to Keep (Active Migrations)
- `add_authors_to_all_submissions.sql` - Main migration for adding authors to existing submissions

## Files to Archive/Delete (Debug/Test Files)
The following files were created during debugging and can be safely deleted:

### Debug Queries
- `check_authors_columns.sql`
- `check_author_settings.sql`
- `check_columns.sql`
- `check_data_exists.sql`
- `check_new_submissions.sql`
- `check_simple.sql`
- `check_submission_103.sql`
- `check_submissions_columns.sql`
- `check_all_data.sql`
- `check_all_data_camelcase.sql`
- `check_real_schema.sql`
- `check_schemas.sql`
- `check_multiple_schemas.sql`
- `debug_authors_complete.sql`
- `debug_full_check.sql`
- `debug_publication_id.sql`
- `find_gemini_submission.sql`
- `find_submission_id.sql`

### Obsolete Migrations (Wrong Schema)
- `populate_authors_from_submitters.sql` - Used wrong schema (publication_id)
- `fix_submission_100.sql` - Specific fix, no longer needed
- `fix_all_submissions_authors.sql` - Replaced by add_authors_to_all_submissions.sql
- `add_authors_to_gemini.sql` - Specific fix, no longer needed
- `update_existing_author.sql` - Specific fix, no longer needed

## Recommendation
Move all debug/obsolete files to `migrations/archive/` folder to keep migrations directory clean.
