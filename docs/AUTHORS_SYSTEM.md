# Authors System Documentation

## Overview
This document describes the authors system implementation in the OJS application.

## Database Schema

### Table: `authors`
Stores author information for submissions.

**Columns:**
- `id` (BIGINT, PRIMARY KEY, AUTO INCREMENT)
- `article_id` (BIGINT, FOREIGN KEY → submissions.id)
- `first_name` (TEXT)
- `last_name` (TEXT)
- `email` (TEXT)
- `affiliation` (TEXT, NULLABLE)
- `orcid` (TEXT, NULLABLE)
- `primary_contact` (BOOLEAN)
- `seq` (INTEGER) - Display order

**Important Notes:**
- Uses `article_id` to link to submissions (NOT `publication_id`)
- Stores author data directly in this table (NOT in `author_settings`)
- `seq` starts from 1 (not 0)
- First author (seq=1) is automatically set as primary_contact if not specified

## API Endpoints

### POST /api/submissions
Creates a new submission with authors.

**Request Body:**
```json
{
  "title": "Article Title",
  "abstract": "Article abstract",
  "sectionId": 1,
  "authors": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "affiliation": "University",
      "isPrimaryContact": true
    }
  ]
}
```

### GET /api/submissions/:id
Fetches submission with authors.

**Response:**
```json
{
  "id": 100,
  "title": "Article Title",
  "authors": [
    {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "affiliation": "University",
      "primaryContact": true,
      "seq": 1
    }
  ]
}
```

### PATCH /api/submissions/:id
Updates submission including authors.

**Request Body:**
```json
{
  "title": "Updated Title",
  "authors": [
    {
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com",
      "isPrimary": true
    }
  ]
}
```

## Utility Functions

Located in `lib/utils/authors.ts`:

### `transformAuthorForDB(author, articleId, index)`
Transforms author input from wizard/API to database format.

### `fetchAuthors(supabase, submissionId)`
Fetches all authors for a submission, ordered by sequence.

### `saveAuthors(supabase, submissionId, authors)`
Replaces all authors for a submission (delete + insert).

### `validateAuthors(authors)`
Validates author data before saving.

**Validation Rules:**
- At least one author required
- First name and last name required
- Valid email format required
- Exactly one primary contact required

## Wizard Integration

### Step 3: Enter Metadata
The submission wizard auto-populates the logged-in user as the first author.

**Auto-populated fields:**
- First Name (from user.firstName)
- Last Name (from user.lastName)
- Email (from user.email)
- Primary Contact (true)
- Include in Browse (true)

**Field Mapping:**
- Wizard uses `contributors` array
- API expects `authors` array
- Wizard sends `isPrimary`, API accepts both `isPrimary` and `isPrimaryContact`

## Migration

### Initial Setup
Run `add_authors_to_all_submissions.sql` to add authors to existing submissions.

This migration:
1. Loops through all submissions
2. Gets submitter info from users table
3. Creates author record with submitter data
4. Sets as primary contact

## Common Issues & Solutions

### Issue: Authors not displaying
**Solution:** Ensure API includes authors in query:
```typescript
.select(`
  *,
  authors(id, first_name, last_name, email, affiliation, primary_contact, seq)
`)
```

### Issue: "0 authors" in submissions list
**Solution:** Check that GET /api/submissions includes authors relation in select query.

### Issue: Authors not saving
**Solution:** Verify that:
1. `article_id` is used (not `publication_id`)
2. Data is saved directly to `authors` table (not `author_settings`)
3. Wizard sends `authors` field in request body

## Best Practices

1. **Always use utility functions** from `lib/utils/authors.ts`
2. **Validate authors** before saving
3. **Handle both field name formats** (camelCase and snake_case)
4. **Log all operations** for debugging
5. **Use transactions** when updating authors to ensure data consistency

## Future Improvements

1. Add support for multiple affiliations
2. Implement ORCID validation
3. Add author profile pictures
4. Support for co-author invitations
5. Author contribution roles (CRediT taxonomy)
