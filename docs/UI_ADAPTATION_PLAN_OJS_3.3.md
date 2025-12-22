# 📋 RENCANA ADAPTASI UI OJS 3.3 → PROJECT CUSTOM
**Tanggal**: 2025-12-22  
**Tujuan**: Menyesuaikan layout UI project custom agar menyerupai OJS 3.3 asli  
**Prinsip**: HANYA ADAPTASI UI, TIDAK MENGUBAH SISTEM

---

## 🎯 EXECUTIVE SUMMARY

### Temuan Analisis OJS 3.3 Asli:
Setelah menganalisis source code OJS PHP 3.3 (`templates/workflow/workflow.tpl` dan `templates/authorDashboard/authorDashboard.tpl`), saya menemukan struktur UI berikut:

#### 1. **Workflow Header Structure** (OJS 3.3):
```html
<pkp-header class="pkpWorkflow__header">
  <h1 class="pkpWorkflow__identification">
    <badge>STATUS</badge>
    <span>ID</span> / <span>AUTHOR</span> / <span>TITLE</span>
  </h1>
  <template slot="actions">
    <pkp-button>View/Preview</pkp-button>
    <pkp-button>Activity Log</pkp-button>
    <pkp-button>Submission Library</pkp-button>
  </template>
</pkp-header>
```

**Karakteristik**:
- Status badge di awal (Published/Scheduled/Declined)
- Format: `ID / Author / Title` dalam satu baris
- Action buttons di header (tidak tersebar)
- Compact dan informatif

#### 2. **Tab Structure** (OJS 3.3):
```html
<tabs>
  <tab id="workflow" label="Workflow">
    <!-- Stage tabs: Submission, Review, Copyediting, Production -->
  </tab>
  <tab id="publication" label="Publication">
    <!-- Side tabs: Title/Abstract, Contributors, Metadata, Citations, Galleys -->
  </tab>
</tabs>
```

**Karakteristik**:
- 2 main tabs: Workflow & Publication
- Workflow tab berisi stage progression
- Publication tab berisi metadata management
- Side tabs untuk sub-sections

#### 3. **Stage Progression** (OJS 3.3):
```html
<div id="stageTabs">
  <ul>
    <li class="pkp_workflow_submission stageId1 initiated">
      <a>Submission</a>
    </li>
    <li class="pkp_workflow_review stageId3 initiated">
      <a>Review</a>
    </li>
    <li class="pkp_workflow_editing stageId4">
      <a>Copyediting</a>
    </li>
    <li class="pkp_workflow_production stageId5">
      <a>Production</a>
    </li>
  </ul>
</div>
```

**Karakteristik**:
- Visual progress indicator
- Class "initiated" untuk stage yang sudah dilalui
- Horizontal tab layout
- Clear stage names

---

## 📊 ANALISIS GAP: PROJECT CUSTOM vs OJS 3.3

### Current Project Structure (Submission Detail Page):

**File**: `app/submissions/[id]/page.tsx`

**Current Header**:
```tsx
<DashboardLayout title="Submission Details" subtitle="ID: ...">
  <Button>Back to Submissions</Button>
  <Card>
    <CardTitle>{title}</CardTitle>
    <Badge>{status}</Badge>
  </Card>
</DashboardLayout>
```

**Current Tabs**:
```tsx
<Tabs>
  <TabsTrigger value="files">Files</TabsTrigger>
  <TabsTrigger value="participants">Participants</TabsTrigger>
  <TabsTrigger value="review">Review</TabsTrigger>
  <TabsTrigger value="discussion">Discussion</TabsTrigger>
  <TabsTrigger value="history">History</TabsTrigger>
</Tabs>
```

### 🔍 GAP ANALYSIS TABLE

| Aspek UI | OJS 3.3 Asli | Project Custom Saat Ini | Gap | Priority |
|----------|--------------|-------------------------|-----|----------|
| **HEADER STRUCTURE** |
| Submission ID Format | `ID / Author / Title` | `ID: xxx` di subtitle | ❌ Berbeda | HIGH |
| Status Badge Position | Di awal header | Di dalam card | ❌ Berbeda | HIGH |
| Action Buttons | Header-level (View, Activity, Library) | Scattered dalam page | ❌ Berbeda | MEDIUM |
| **TAB STRUCTURE** |
| Main Tabs | Workflow + Publication | Files, Participants, Review, etc | ❌ Berbeda | HIGH |
| Workflow Stages | Submission → Review → Copyediting → Production | Tidak ada visual progression | ❌ Missing | HIGH |
| Publication Tab | Side tabs (metadata, contributors, citations) | Tidak ada | ❌ Missing | MEDIUM |
| **STAGE PROGRESSION** |
| Visual Indicator | Progress bar dengan stage tabs | Hanya status badge | ❌ Missing | HIGH |
| Stage Status | "initiated" class untuk completed stages | Tidak ada | ❌ Missing | MEDIUM |
| **ROLE-BASED VIEW** |
| Author View | Simplified (upload file, library) | Full view sama dengan editor | ⚠️ Perlu penyesuaian | MEDIUM |
| Editor View | Full control (activity log, decisions) | Ada tapi layout berbeda | ⚠️ Perlu penyesuaian | HIGH |
| **COMPONENTS** |
| File Upload | Header button | Di dalam tabs | ❌ Berbeda | LOW |
| Submission Library | Header button | Tidak ada | ❌ Missing | LOW |
| Activity Log | Header button | Di History tab | ⚠️ Berbeda | LOW |

---

## 🎨 PENYESUAIAN UI YANG DIPERLUKAN

### PRIORITY 1: HIGH - CRITICAL LAYOUT CHANGES

#### 1.1 Header Restructuring
**Tujuan**: Menyesuaikan header agar format `ID / Author / Title`

**Current**:
```tsx
<DashboardLayout title="Submission Details" subtitle="ID: 112">
  <Card>
    <CardTitle>Article Title</CardTitle>
    <Badge>Status</Badge>
  </Card>
</DashboardLayout>
```

**Target (OJS 3.3 Style)**:
```tsx
<div className="pkpWorkflow">
  <header className="pkpWorkflow__header">
    <h1 className="pkpWorkflow__identification">
      {status === 'published' && (
        <Badge variant="success">Published</Badge>
      )}
      <span className="pkpWorkflow__identificationId">{submission.id}</span>
      <span className="pkpWorkflow__identificationDivider">/</span>
      <span className="pkpWorkflow__identificationAuthor">
        {submission.authors[0]?.name}
      </span>
      <span className="pkpWorkflow__identificationDivider">/</span>
      <span className="pkpWorkflow__identificationTitle">
        {submission.title}
      </span>
    </h1>
    <div className="pkpWorkflow__actions">
      {isPublished && <Button>View</Button>}
      {isEditor && <Button>Activity Log</Button>}
      <Button>Submission Library</Button>
    </div>
  </header>
</div>
```

**Implementation**:
- File: `app/submissions/[id]/page.tsx`
- Lines: ~640-680 (header section)
- Complexity: MEDIUM
- Estimated Time: 30 minutes

#### 1.2 Main Tab Restructuring
**Tujuan**: Mengubah tab structure menjadi "Workflow" + "Publication"

**Current**:
```tsx
<Tabs>
  <TabsTrigger value="files">Files</TabsTrigger>
  <TabsTrigger value="participants">Participants</TabsTrigger>
  <TabsTrigger value="review">Review</TabsTrigger>
  <TabsTrigger value="discussion">Discussion</TabsTrigger>
  <TabsTrigger value="history">History</TabsTrigger>
</Tabs>
```

**Target (OJS 3.3 Style)**:
```tsx
<Tabs defaultValue="workflow">
  <TabsList>
    <TabsTrigger value="workflow">Workflow</TabsTrigger>
    <TabsTrigger value="publication">Publication</TabsTrigger>
  </TabsList>
  
  <TabsContent value="workflow">
    {/* Stage tabs: Submission, Review, Copyediting, Production */}
    <StageTabs 
      stages={workflowStages}
      currentStage={submission.stageId}
    />
  </TabsContent>
  
  <TabsContent value="publication">
    {/* Side tabs untuk metadata */}
    <PublicationTabs submission={submission} />
  </TabsContent>
</Tabs>
```

**Implementation**:
- File: `app/submissions/[id]/page.tsx`
- Lines: ~860-870 (tabs section)
- Complexity: HIGH
- Estimated Time: 2 hours
- **Note**: Ini perubahan besar, perlu careful planning

#### 1.3 Stage Progression Component
**Tujuan**: Menambahkan visual progress bar untuk workflow stages

**New Component**: `components/workflow/StageTabs.tsx`

```tsx
interface StageTabsProps {
  stages: WorkflowStage[]
  currentStage: number
}

export function StageTabs({ stages, currentStage }: StageTabsProps) {
  return (
    <div className="stageTabs">
      <ul className="stageTabs__list">
        {stages.map((stage) => (
          <li 
            key={stage.id}
            className={cn(
              "stageTabs__item",
              `stageId${stage.id}`,
              stage.id <= currentStage && "initiated"
            )}
          >
            <a href={`#stage-${stage.path}`}>
              {stage.label}
              {stage.id <= currentStage && (
                <CheckCircle className="h-4 w-4 ml-2" />
              )}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

**Implementation**:
- Create: `components/workflow/StageTabs.tsx`
- Complexity: MEDIUM
- Estimated Time: 1 hour

---

### PRIORITY 2: MEDIUM - FEATURE ADDITIONS

#### 2.1 Publication Tab Component
**Tujuan**: Menambahkan Publication tab dengan side tabs

**New Component**: `components/workflow/PublicationTabs.tsx`

```tsx
export function PublicationTabs({ submission }: { submission: Submission }) {
  return (
    <div className="pkpPublication">
      <div className="pkpPublication__header">
        <span className="pkpPublication__status">
          <strong>{getStatusLabel(submission.status)}</strong>
        </span>
      </div>
      
      <Tabs orientation="vertical" className="pkpPublication__tabs">
        <TabsList>
          <TabsTrigger value="titleAbstract">Title & Abstract</TabsTrigger>
          <TabsTrigger value="contributors">Contributors</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
          <TabsTrigger value="citations">Citations</TabsTrigger>
          {canAccessProduction && (
            <TabsTrigger value="galleys">Galleys</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="titleAbstract">
          {/* Title & Abstract form */}
        </TabsContent>
        
        <TabsContent value="contributors">
          {/* Authors list */}
        </TabsContent>
        
        {/* ... other tabs */}
      </Tabs>
    </div>
  )
}
```

**Implementation**:
- Create: `components/workflow/PublicationTabs.tsx`
- Complexity: HIGH
- Estimated Time: 3 hours

#### 2.2 Submission Library Button
**Tujuan**: Menambahkan akses ke submission library

**Implementation**:
- Add button to header actions
- Create modal/dialog untuk library view
- Complexity: MEDIUM
- Estimated Time: 1 hour

#### 2.3 Activity Log Button (Editor Only)
**Tujuan**: Menambahkan akses ke activity log

**Implementation**:
- Add button to header actions (editor only)
- Create modal/dialog untuk activity log
- Complexity: MEDIUM
- Estimated Time: 1 hour

---

### PRIORITY 3: LOW - POLISH & REFINEMENTS

#### 3.1 Status Badge Styling
**Tujuan**: Menyesuaikan warna dan style badge sesuai OJS 3.3

**OJS 3.3 Badge Colors**:
- Published: Green (`is-success`)
- Scheduled: Blue (`is-primary`)
- Declined: Red (`is-warnable`)
- Unpublished: Gray

**Implementation**:
- Update: `lib/ui/status-colors.ts`
- Complexity: LOW
- Estimated Time: 15 minutes

#### 3.2 CSS Class Naming
**Tujuan**: Menggunakan naming convention OJS 3.3 untuk consistency

**OJS 3.3 Conventions**:
- `pkpWorkflow__*` untuk workflow components
- `pkpPublication__*` untuk publication components
- `stageTabs__*` untuk stage tabs

**Implementation**:
- Add CSS classes to match OJS 3.3
- Complexity: LOW
- Estimated Time: 30 minutes

---

## 🗺️ IMPLEMENTATION ROADMAP

### FASE 1: HEADER & MAIN STRUCTURE (Week 1)
**Goal**: Menyesuaikan header dan main tab structure

**Tasks**:
1. ✅ Restructure header (ID / Author / Title format)
2. ✅ Add status badge to header
3. ✅ Add action buttons (View, Activity, Library)
4. ✅ Reorganize main tabs (Workflow + Publication)

**Deliverables**:
- Updated `app/submissions/[id]/page.tsx` header
- New header component structure
- Main tab reorganization

**Estimated Time**: 4-6 hours

---

### FASE 2: WORKFLOW STAGES (Week 1-2)
**Goal**: Implement visual stage progression

**Tasks**:
1. ✅ Create StageTabs component
2. ✅ Add stage progression logic
3. ✅ Implement "initiated" status indicator
4. ✅ Add stage-specific content

**Deliverables**:
- `components/workflow/StageTabs.tsx`
- Stage progression visual
- Stage-based content display

**Estimated Time**: 3-4 hours

---

### FASE 3: PUBLICATION TAB (Week 2)
**Goal**: Add Publication tab with metadata management

**Tasks**:
1. ✅ Create PublicationTabs component
2. ✅ Implement side tabs (Title/Abstract, Contributors, etc)
3. ✅ Add metadata forms
4. ✅ Add galleys management (if production stage)

**Deliverables**:
- `components/workflow/PublicationTabs.tsx`
- Metadata management UI
- Contributors management

**Estimated Time**: 4-6 hours

---

### FASE 4: ADDITIONAL FEATURES (Week 2-3)
**Goal**: Add missing features (Library, Activity Log)

**Tasks**:
1. ✅ Implement Submission Library
2. ✅ Implement Activity Log (editor only)
3. ✅ Add file upload to header
4. ✅ Polish and refinements

**Deliverables**:
- Submission Library modal
- Activity Log modal
- Polished UI

**Estimated Time**: 3-4 hours

---

### FASE 5: ROLE-BASED VIEWS (Week 3)
**Goal**: Customize views per role

**Tasks**:
1. ✅ Author view simplification
2. ✅ Editor view full features
3. ✅ Reviewer view (if applicable)
4. ✅ Testing per role

**Deliverables**:
- Role-specific UI
- Tested workflows per role

**Estimated Time**: 2-3 hours

---

## 📋 DETAILED COMPONENT MAPPING

### OJS 3.3 → Project Custom Component Mapping

| OJS 3.3 Component | Project Custom Equivalent | Status | Action |
|-------------------|---------------------------|--------|--------|
| `pkp-header` | `DashboardLayout` header | ⚠️ Partial | Modify |
| `pkpWorkflow__identification` | Custom header component | ❌ Missing | Create |
| `tabs` (main) | `Tabs` component | ✅ Exists | Modify structure |
| `stageTabs` | N/A | ❌ Missing | Create `StageTabs` |
| `pkpPublication` | N/A | ❌ Missing | Create `PublicationTabs` |
| `pkp-button` | `Button` component | ✅ Exists | Use as-is |
| `badge` | `Badge` component | ✅ Exists | Modify styling |
| `pkp-form` | Form components | ✅ Exists | Use as-is |
| `dropdown` | `DropdownMenu` | ✅ Exists | Use as-is |
| `spinner` | Loading spinner | ✅ Exists | Use as-is |

---

## 🎨 STYLING GUIDELINES

### CSS Classes to Add (OJS 3.3 Convention)

```css
/* Workflow Container */
.pkpWorkflow {
  /* Main workflow container */
}

.pkpWorkflow__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--border);
}

.pkpWorkflow__identification {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
}

.pkpWorkflow__identificationId,
.pkpWorkflow__identificationAuthor,
.pkpWorkflow__identificationTitle {
  /* Individual parts */
}

.pkpWorkflow__identificationDivider {
  color: var(--muted-foreground);
}

.pkpWorkflow__actions {
  display: flex;
  gap: 0.5rem;
}

/* Stage Tabs */
.stageTabs {
  margin: 1rem 0;
}

.stageTabs__list {
  display: flex;
  gap: 0;
  border-bottom: 2px solid var(--border);
}

.stageTabs__item {
  flex: 1;
  text-align: center;
  position: relative;
}

.stageTabs__item.initiated {
  /* Completed stage styling */
  background: var(--muted);
}

.stageTabs__item.initiated::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--primary);
}

/* Publication */
.pkpPublication {
  /* Publication tab container */
}

.pkpPublication__header {
  padding: 1rem;
  border-bottom: 1px solid var(--border);
}

.pkpPublication__status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pkpPublication__tabs {
  /* Side tabs styling */
}
```

---

## ⚠️ IMPORTANT NOTES & CONSTRAINTS

### TIDAK BOLEH DIUBAH:
1. ❌ **Backend Logic**: Semua API endpoints tetap sama
2. ❌ **Database Schema**: Tidak ada perubahan struktur data
3. ❌ **Workflow Logic**: State machine tetap sama
4. ❌ **Tema Warna**: Tetap gunakan tema project saat ini
5. ❌ **Authentication**: Role-based access tetap sama

### BOLEH DIUBAH:
1. ✅ **Layout Structure**: Reorganisasi komponen UI
2. ✅ **Tab Organization**: Perubahan struktur tabs
3. ✅ **Component Placement**: Posisi buttons dan actions
4. ✅ **Visual Indicators**: Progress bars, badges, icons
5. ✅ **CSS Classes**: Naming conventions untuk consistency

### PERLU HATI-HATI:
1. ⚠️ **Existing Functionality**: Pastikan semua fitur tetap berfungsi
2. ⚠️ **Role-Based Access**: Jangan bocorkan data antar role
3. ⚠️ **Responsive Design**: Pastikan mobile-friendly
4. ⚠️ **Performance**: Jangan tambahkan overhead yang berat

---

## 🧪 TESTING CHECKLIST

### Per Role Testing:

#### Author:
- [ ] Dapat melihat submission detail
- [ ] Dapat upload revision files
- [ ] Dapat akses submission library
- [ ] TIDAK dapat lihat editorial decisions
- [ ] TIDAK dapat assign reviewers

#### Editor:
- [ ] Dapat melihat full workflow
- [ ] Dapat akses activity log
- [ ] Dapat assign reviewers
- [ ] Dapat make editorial decisions
- [ ] Dapat akses publication tab

#### Reviewer:
- [ ] Dapat melihat assigned submissions
- [ ] Dapat submit review
- [ ] TIDAK dapat lihat other reviewers
- [ ] TIDAK dapat make decisions

### Functional Testing:
- [ ] All tabs berfungsi
- [ ] Stage progression accurate
- [ ] Status badges correct
- [ ] Action buttons work
- [ ] Forms submit correctly
- [ ] File uploads work
- [ ] Responsive on mobile

---

## 📊 PROGRESS TRACKING

### Implementation Status:

| Component | Status | Progress | Notes |
|-----------|--------|----------|-------|
| Header Restructure | 🔄 Pending | 0% | Ready to start |
| Main Tabs | 🔄 Pending | 0% | Needs planning |
| StageTabs Component | 🔄 Pending | 0% | Design ready |
| PublicationTabs | 🔄 Pending | 0% | Design ready |
| Submission Library | 🔄 Pending | 0% | Low priority |
| Activity Log | 🔄 Pending | 0% | Low priority |
| Status Badges | 🔄 Pending | 0% | Quick win |
| CSS Styling | 🔄 Pending | 0% | Ongoing |

**Legend**:
- 🔄 Pending
- 🚧 In Progress
- ✅ Complete
- ⏸️ On Hold
- ❌ Blocked

---

## 🎯 NEXT STEPS

### Immediate Actions (Today):
1. **Review this plan** dengan user
2. **Get approval** untuk perubahan yang diusulkan
3. **Prioritize** features berdasarkan feedback
4. **Start with** header restructuring (quick win)

### This Week:
1. Implement header changes
2. Restructure main tabs
3. Create StageTabs component
4. Test dengan different roles

### Next Week:
1. Implement PublicationTabs
2. Add Submission Library
3. Add Activity Log
4. Polish and refinements

---

## 📞 QUESTIONS FOR USER

Sebelum mulai implementasi, saya perlu konfirmasi:

1. **Priority**: Apakah urutan priority sudah sesuai? (Header → Tabs → Stages → Publication)
2. **Scope**: Apakah semua perubahan ini perlu dilakukan, atau ada yang bisa di-skip?
3. **Timeline**: Berapa lama waktu yang tersedia untuk implementasi?
4. **Testing**: Apakah ada user testing yang perlu dilakukan?
5. **Deployment**: Apakah perubahan ini akan di-deploy bertahap atau sekaligus?

---

**Status**: ✅ PLAN READY FOR REVIEW  
**Next Action**: Tunggu approval untuk mulai implementasi  
**Estimated Total Time**: 20-30 hours (2-3 weeks part-time)
