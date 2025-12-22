# 📋 IMPLEMENTATION PLAN: Priority 1 Features - OJS 3.3 Public Access

**Project**: iamJOS - Post-Publication Features  
**Timeline**: 4-5 weeks  
**Priority**: 🔴 CRITICAL  
**Goal**: Make published articles publicly accessible & OJS 3.3 compliant

---

## 🎯 OVERVIEW

### Objectives
1. ✅ Published articles accessible to public
2. ✅ Articles organized in issues (Volume & Number)
3. ✅ Articles discoverable by search engines
4. ✅ Compliant with OJS 3.3 standards

### Success Criteria
- [ ] Public can view published articles without login
- [ ] Articles appear in issue Table of Contents
- [ ] Google Scholar can index articles
- [ ] Metadata properly displayed
- [ ] PDF downloadable by public

---

## 📦 PHASE 1: PUBLIC ARTICLE PAGES (Week 1-2)

### 1.1 Article Landing Page

**Route**: `/article/view/[id]`

**Features**:
- Display article metadata (title, authors, abstract, keywords)
- Show PDF download link
- Display citation information
- Show article metrics (views, downloads)
- Related articles section

**Components to Create**:
```
app/
  article/
    view/
      [id]/
        page.tsx          # Article landing page
        layout.tsx        # Public layout (no auth required)
    
components/
  article/
    ArticleHeader.tsx     # Title, authors, date
    ArticleMetadata.tsx   # Abstract, keywords, etc
    ArticleFiles.tsx      # PDF/HTML download links
    ArticleCitation.tsx   # Citation formats
    ArticleMetrics.tsx    # View/download counts
```

**API Endpoints**:
```
GET /api/article/[id]           # Get article data
GET /api/article/[id]/metrics   # Get view/download stats
GET /api/article/[id]/pdf       # Download PDF (public)
```

**Database Changes**:
```sql
-- Add view counter
ALTER TABLE submissions ADD COLUMN views INTEGER DEFAULT 0;
ALTER TABLE submissions ADD COLUMN downloads INTEGER DEFAULT 0;

-- Add public access flag
ALTER TABLE submissions ADD COLUMN public_access BOOLEAN DEFAULT true;
```

**SEO & Indexing**:
```tsx
// Add meta tags for Google Scholar
<Head>
  <meta name="citation_title" content={article.title} />
  <meta name="citation_author" content={author.name} />
  <meta name="citation_publication_date" content={article.datePublished} />
  <meta name="citation_pdf_url" content={pdfUrl} />
  <meta name="citation_journal_title" content={journal.name} />
  <meta name="citation_volume" content={issue.volume} />
  <meta name="citation_issue" content={issue.number} />
  <meta name="citation_firstpage" content={article.pages} />
  <meta name="DC.title" content={article.title} />
  <meta name="DC.creator" content={author.name} />
  <meta name="DC.date" content={article.datePublished} />
</Head>
```

---

### 1.2 Issue Table of Contents

**Route**: `/issue/view/[id]`

**Features**:
- Display issue information (Volume, Number, Year)
- List all articles in issue
- Show article titles, authors, pages
- Link to individual articles
- Download full issue PDF (optional)

**Components to Create**:
```
app/
  issue/
    view/
      [id]/
        page.tsx          # Issue TOC page
    archive/
      page.tsx            # All issues archive
    current/
      page.tsx            # Current issue

components/
  issue/
    IssueHeader.tsx       # Issue info (Vol, No, Year)
    IssueTOC.tsx          # Table of contents
    IssueArticleList.tsx  # Article list component
    IssueCover.tsx        # Issue cover image
```

**API Endpoints**:
```
GET /api/issue/[id]             # Get issue data
GET /api/issue/[id]/articles    # Get articles in issue
GET /api/issue/current          # Get current issue
GET /api/issue/archive          # Get all published issues
```

---

### 1.3 Browse & Archive Pages

**Routes**:
- `/issue/archive` - All published issues
- `/article/browse` - Browse all articles
- `/search` - Search articles

**Features**:
- List all published issues
- Filter by year, volume
- Search articles by title, author, keyword
- Pagination

---

## 📦 PHASE 2: ISSUE MANAGEMENT (Week 3-4)

### 2.1 Issue Creation & Management

**Admin Routes**:
```
/admin/issues/create          # Create new issue
/admin/issues/[id]/edit       # Edit issue
/admin/issues/[id]/publish    # Publish issue
```

**Features**:
- Create issue (Volume, Number, Year, Title)
- Assign articles to issue
- Set article order in TOC
- Set page numbers
- Upload cover image
- Publish/unpublish issue

**Database Schema**:
```sql
CREATE TABLE IF NOT EXISTS issues (
    id BIGSERIAL PRIMARY KEY,
    journal_id BIGINT NOT NULL,
    volume INTEGER NOT NULL,
    number INTEGER NOT NULL,
    year INTEGER NOT NULL,
    title TEXT,
    description TEXT,
    cover_image TEXT,
    published BOOLEAN DEFAULT false,
    date_published TIMESTAMP,
    current BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS issue_articles (
    id BIGSERIAL PRIMARY KEY,
    issue_id BIGINT NOT NULL REFERENCES issues(id),
    submission_id BIGINT NOT NULL,
    seq INTEGER DEFAULT 0,  -- Order in TOC
    pages TEXT,  -- e.g., "1-15"
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_issues_journal ON issues(journal_id);
CREATE INDEX idx_issues_published ON issues(published);
CREATE INDEX idx_issue_articles_issue ON issue_articles(issue_id);
CREATE INDEX idx_issue_articles_submission ON issue_articles(submission_id);
```

**API Endpoints**:
```
POST   /api/admin/issues              # Create issue
GET    /api/admin/issues              # List all issues
GET    /api/admin/issues/[id]         # Get issue details
PUT    /api/admin/issues/[id]         # Update issue
DELETE /api/admin/issues/[id]         # Delete issue
POST   /api/admin/issues/[id]/publish # Publish issue
POST   /api/admin/issues/[id]/assign  # Assign article to issue
```

---

### 2.2 Integrate Issue Assignment with Publish Workflow

**Update Publish Endpoint**:
```typescript
// File: app/api/production/[id]/publish/route.ts

// Add issue assignment option
const { issueId, pages } = await request.json()

// If issue specified, assign article
if (issueId) {
    await supabaseAdmin
        .from('issue_articles')
        .insert({
            issue_id: issueId,
            submission_id: submissionId,
            pages: pages || null,
            seq: nextSeq  // Auto-increment
        })
}

// Update submission with issue reference
await supabaseAdmin
    .from('submissions')
    .update({
        status: 3,
        stage_id: 6,
        issue_id: issueId || null,  // Store issue reference
        updated_at: NOW()
    })
```

**Update Production Page**:
```tsx
// File: app/production/[id]/page.tsx

// Add issue selection
<Select value={selectedIssue} onValueChange={setSelectedIssue}>
    <SelectTrigger>
        <SelectValue placeholder="Select issue (optional)" />
    </SelectTrigger>
    <SelectContent>
        {issues.map(issue => (
            <SelectItem key={issue.id} value={String(issue.id)}>
                Vol. {issue.volume}, No. {issue.number} ({issue.year})
            </SelectItem>
        ))}
    </SelectContent>
</Select>

// Pass to publish API
await apiPost(`/api/production/${params.id}/publish`, {
    issueId: selectedIssue,
    pages: pageNumbers
})
```

---

## 📦 PHASE 3: INDEXING METADATA (Week 5)

### 3.1 Google Scholar Meta Tags

**Implementation**:
```tsx
// File: app/article/view/[id]/page.tsx

export async function generateMetadata({ params }) {
    const article = await getArticle(params.id)
    
    return {
        title: article.title,
        description: article.abstract,
        openGraph: {
            title: article.title,
            description: article.abstract,
            type: 'article',
            publishedTime: article.datePublished,
            authors: article.authors.map(a => a.name),
        },
        other: {
            // Google Scholar
            'citation_title': article.title,
            'citation_author': article.authors.map(a => a.name),
            'citation_publication_date': article.datePublished,
            'citation_journal_title': article.journal.name,
            'citation_volume': article.issue?.volume,
            'citation_issue': article.issue?.number,
            'citation_firstpage': article.pages?.split('-')[0],
            'citation_lastpage': article.pages?.split('-')[1],
            'citation_pdf_url': `${baseUrl}/article/download/${article.id}/pdf`,
            
            // Dublin Core
            'DC.title': article.title,
            'DC.creator': article.authors.map(a => a.name),
            'DC.date': article.datePublished,
            'DC.identifier': article.doi || article.id,
            'DC.publisher': article.journal.publisher,
            'DC.type': 'Text',
            'DC.format': 'application/pdf',
        }
    }
}
```

---

### 3.2 OAI-PMH Support (Optional)

**Endpoint**: `/oai`

**Features**:
- Expose article metadata via OAI-PMH protocol
- Support Dublin Core format
- Enable harvesting by indexers

**Implementation**:
```
app/
  oai/
    route.ts    # OAI-PMH endpoint
```

---

## 📦 PHASE 4: PUBLIC PDF ACCESS

### 4.1 Public Download Endpoint

**Route**: `/article/download/[id]/pdf`

**Features**:
- Allow public download of published articles
- Track download count
- Support different file formats (PDF, HTML, XML)

**API Implementation**:
```typescript
// File: app/article/download/[id]/[format]/route.ts

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string, format: string } }
) {
    const submissionId = parseInt(params.id)
    const format = params.format.toUpperCase()
    
    // Get published article
    const { data: submission } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', submissionId)
        .eq('status', 3)  // Published only
        .single()
    
    if (!submission) {
        return new Response('Article not found or not published', { status: 404 })
    }
    
    // Get galley file
    const { data: file } = await supabase
        .from('submission_files')
        .select('*')
        .eq('submission_id', submissionId)
        .eq('file_stage', 10)  // Galley files
        .eq('label', format)
        .single()
    
    if (!file) {
        return new Response('File not found', { status: 404 })
    }
    
    // Increment download counter
    await supabase
        .from('submissions')
        .update({ downloads: submission.downloads + 1 })
        .eq('id', submissionId)
    
    // Stream file from storage
    const { data: fileData } = await supabase.storage
        .from('submissions')
        .download(file.file_path)
    
    return new Response(fileData, {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${file.original_file_name}"`,
        },
    })
}
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Week 1: Article Landing Page
- [ ] Create `/article/view/[id]` route
- [ ] Build ArticleHeader component
- [ ] Build ArticleMetadata component
- [ ] Build ArticleFiles component
- [ ] Add Google Scholar meta tags
- [ ] Create public download endpoint
- [ ] Test with published article

### Week 2: Issue TOC & Archive
- [ ] Create `/issue/view/[id]` route
- [ ] Build IssueHeader component
- [ ] Build IssueTOC component
- [ ] Create `/issue/archive` route
- [ ] Create `/issue/current` route
- [ ] Test issue display

### Week 3: Issue Management Backend
- [ ] Create `issues` table
- [ ] Create `issue_articles` table
- [ ] Create issue CRUD APIs
- [ ] Create assign article API
- [ ] Create publish issue API
- [ ] Test issue creation

### Week 4: Issue Management Frontend
- [ ] Create `/admin/issues` page
- [ ] Build IssueForm component
- [ ] Build AssignArticles component
- [ ] Integrate with publish workflow
- [ ] Test end-to-end flow

### Week 5: Indexing & Polish
- [ ] Add all meta tags
- [ ] Test Google Scholar indexing
- [ ] Add Dublin Core metadata
- [ ] Implement OAI-PMH (optional)
- [ ] Performance optimization
- [ ] Final testing

---

## 🧪 TESTING PLAN

### Test Scenarios

**1. Public Article Access**
- [ ] Public user can view article without login
- [ ] PDF downloadable
- [ ] Metadata displays correctly
- [ ] Citation formats work
- [ ] Download counter increments

**2. Issue Management**
- [ ] Admin can create issue
- [ ] Articles can be assigned to issue
- [ ] Issue can be published
- [ ] TOC displays correctly
- [ ] Article order correct

**3. Search Engine Indexing**
- [ ] Google Scholar meta tags present
- [ ] Dublin Core metadata present
- [ ] robots.txt allows crawling
- [ ] Sitemap includes articles

**4. Workflow Integration**
- [ ] Publish with issue assignment works
- [ ] Publish without issue works
- [ ] Article appears in issue TOC
- [ ] Stage transitions correct

---

## 📊 DELIVERABLES

### Code
- [ ] Public article pages
- [ ] Issue management system
- [ ] Admin interface for issues
- [ ] API endpoints
- [ ] Database migrations

### Documentation
- [ ] User guide (how to create issues)
- [ ] Admin guide (how to publish)
- [ ] API documentation
- [ ] SEO best practices

### Testing
- [ ] Unit tests for APIs
- [ ] Integration tests
- [ ] E2E tests for public access
- [ ] Performance tests

---

## 🎯 SUCCESS METRICS

**After Implementation**:
- ✅ Published articles accessible at `/article/view/{id}`
- ✅ Issues organized at `/issue/view/{id}`
- ✅ Google Scholar can index articles
- ✅ Public can download PDFs
- ✅ OJS 3.3 compliance: 80%+

---

## 📝 NOTES

**Important Considerations**:
1. **Backward Compatibility**: Existing published articles need migration
2. **Performance**: Add caching for public pages
3. **Security**: Ensure only published articles are public
4. **SEO**: Submit sitemap to Google after implementation
5. **Analytics**: Track article views and downloads

**Dependencies**:
- Supabase storage for PDF files
- Next.js 14+ for metadata API
- Existing authentication system

---

**Created**: 21 Desember 2025, 05:30 WIB  
**Estimated Completion**: 5 weeks  
**Priority**: 🔴 CRITICAL  
**Status**: Ready to implement
