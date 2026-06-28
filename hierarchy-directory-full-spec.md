# Hierarchy Directory — Full Product & Technical Spec

**hierarchy.directory**

A visual directory of Catholic bishops — past and present — combining structured hierarchical data with portrait photography and practical tools for building custom printable directories.

---

## Table of Contents

1. [Product Vision & Principles](#1-product-vision--principles)
2. [Design Spec](#2-design-spec)
3. [Data Model](#3-data-model)
4. [Tech Stack](#4-tech-stack)
5. [API Design](#5-api-design)
6. [Build Plan — Step-by-Step Instructions](#6-build-plan--step-by-step-instructions)

---

## 1. Product Vision & Principles

### What this is

A comprehensive, visually-driven directory of Catholic bishops that combines the data depth of Catholic-hierarchy.org with modern design, portrait photography, and practical tools — most notably the ability to build and export custom printable bishop directories.

### Core principles

**Hierarchy-native.** The organizational structure of the Church is the navigation structure. No artificial taxonomies.

**Faces first.** Every view leads with portraits. A bishop is a face, a name, and a title. Data supports the portrait, not the other way around.

**Print-ready.** The "Build a Directory" feature produces output polished enough to hand to a rector, include in a briefing packet, or put in a binder for a papal visit.

**Scalable from day one.** The design works identically whether the database holds 300 US bishops or 15,000 worldwide. No US-centric assumptions baked into the UI.

### Target users

- Diocesan and basilica staff preparing for bishop visits
- Catholic media and journalists covering Church appointments
- Seminarians and researchers studying episcopal history
- Engaged Catholic laypeople interested in Church structure

---

## 2. Design Spec

### 2.1 Design Direction

**Tone:** Refined, editorial, authoritative. A well-designed academic journal or museum catalog — not a church bulletin, not a government database.

**Memorable quality:** Faces. The consistent grid of bishop portraits is the signature visual element.

### 2.2 Color Palette

**Base palette:**

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Background | Warm white | `#FAF8F5` | Page background, content areas |
| Surface | Soft cream | `#F0ECE4` | Cards, panels, hover states |
| Text Primary | Warm black | `#1A1714` | Headlines, names, body text |
| Text Secondary | Dark warm gray | `#6B6560` | Subtitles, metadata, captions |
| Text Tertiary | Medium warm gray | `#9C958D` | Placeholder text, disabled states |
| Accent Primary | Deep burgundy | `#7A1B2E` | Active states, links, selected filters, buttons |
| Accent Hover | Dark burgundy | `#5C1422` | Hover states on primary accent |
| Border | Light warm gray | `#DDD8D0` | Card borders, dividers, table lines |
| Tag Background | Pale stone | `#E8E3DB` | Filter chips, role badges, status tags |

**Rank colors (based on zucchetto):**

| Rank | Color | Hex | Usage |
|------|-------|-----|-------|
| Cardinal | Scarlet | `#C41E3A` | Cardinal title text, cardinal badge, timeline nodes for cardinal events, card accent |
| Archbishop | Amaranth | `#9F2B68` | "Archbishop of ___" title text, timeline nodes, card accent |
| Bishop | Amaranth | `#9F2B68` | "Bishop of ___" title text, timeline nodes, card accent |

The rank color is applied to the **title line** on bishop cards and detail pages. For archbishops and bishops, the title ("Archbishop of Baltimore", "Bishop of Springfield") renders in amaranth, matching the color of their zucchetto. For cardinals, the **entire title block** renders in scarlet — both the cardinal designation and the see title (e.g., "Cardinal — Archbishop of Chicago" is all scarlet). This means a cardinal's card and detail page are immediately distinguishable by the uniform scarlet treatment. On cards, a thin left-border or top-border stripe in the rank color provides quick visual scanning across the grid. On detail pages, the rank color also tints the timeline nodes and the header area left border.

Implement all colors as CSS custom properties / Tailwind theme tokens so they're consistent everywhere.

### 2.3 Typography

| Role | Font | Weight | Size | Usage |
|------|------|--------|------|-------|
| Display | Cormorant Garamond | 600 (SemiBold) | 32–40px | Page titles, diocese names |
| Name/Title | Cormorant Garamond | 500 (Medium) | 18–24px | Bishop names on cards and detail pages |
| Body | Public Sans | 400 | 15–16px | Descriptions, timeline text, metadata |
| Body emphasis | Public Sans | 600 | 15–16px | Labels, column headers |
| UI / Controls | Public Sans | 500 | 13–14px | Buttons, filter chips, nav items |
| Caption | Public Sans | 400 | 12–13px | Photo credits, footnotes |

Cormorant Garamond is available on Google Fonts. Load both Cormorant Garamond and Public Sans via `next/font/google` in the root layout for optimized loading with zero layout shift.

Line height: 1.4 body, 1.2 display. Letter spacing: +0.01em on all-caps UI labels only.

### 2.4 Portrait Treatment

- **Aspect ratio:** 3:4 (portrait orientation)
- **Display shape:** Rounded rectangle, border-radius 8px
- **Border:** 1px solid `#DDD8D0`
- **Shadow:** `0 2px 8px rgba(26, 23, 20, 0.08)`
- **Sizes:** Grid card: 120×160px. Detail hero: 240×320px.
- **Missing photo placeholder:** Solid `#E8E3DB` background with initials in Cormorant Garamond SemiBold, 36px, centered, color `#9C958D`. No silhouettes or icons.

### 2.5 Layout

**Grid:** 12-column, max content width 1200px, centered. Side padding 24px mobile, 48px desktop.

**Spacing scale (px):** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96

**Page structure:**

```
┌─────────────────────────────────────────────┐
│  Top Bar (fixed)                            │
│  Logo · Search · Browse | Search & Filter   │
│  | Print & Collections        · Selection ★ │
├─────────────────────────────────────────────┤
│  Breadcrumb trail                           │
├──────────────┬──────────────────────────────┤
│  Sidebar     │  Main content area           │
│  (filters    │  (portrait grid, detail      │
│  or browse   │   view, or print preview)    │
│  hierarchy)  │                              │
│  240px wide  │  Remaining width             │
│  collapsible │                              │
└──────────────┴──────────────────────────────┘
```

Sidebar collapses to overlay drawer on screens under 768px.

### 2.6 Responsive Breakpoints

| Breakpoint | Layout |
|-----------|--------|
| ≥1024px | Sidebar + content side by side. Grid 4–6 columns. |
| 768–1023px | Sidebar collapses to toggle. Grid 3–4 columns. |
| <768px | Single column. Filters via bottom sheet. Grid 2 columns. Selection bar pinned to bottom. |

### 2.7 Key Screens

#### Screen 1: Home / Landing

- Headline: "A Visual Directory of the Hierarchy of the Catholic Church in the United States" in Cormorant Garamond SemiBold.
- Subtitle: "Current and historical information about the bishops and dioceses connected to the United States." in Public Sans, text-secondary color.
- Prominent centered search bar with placeholder: "Search bishops, dioceses, or locations..."
- Three entry-point cards:
  - **Browse Hierarchy** — "Explore by rite, country, province, and diocese"
  - **Filter & Search** — "Find bishops by role, date, consecrator, and more"
  - **Build a Directory** — "Select bishops and generate a printable directory"

#### Screen 2: Browse View (Hierarchical Drill-Down)

- Progressive disclosure: Rite → Country → Province → Diocese
- Sidebar shows current position in hierarchy as a collapsible tree
- Breadcrumb updates at each level
- Selecting a diocese navigates to the Diocese Detail Page

#### Screen 3: Portrait Grid (Search & Filter Results)

**Card anatomy:**
```
┌───────────────┐
│   [Portrait]  │
│    120×160    │
├───────────────┤
│ Name          │  ← Cormorant Garamond Medium, 16px
│ Current Title │  ← Public Sans Regular, 13px, rank color (scarlet/amaranth)
│ Diocese       │  ← Public Sans Regular, 13px, text-secondary
└───────────────┘
```

- Card width: 180px. Gap: 24px. Responsive columns.
- Hover: translateY -2px, deeper shadow, border shifts to burgundy.
- Checkbox in top-right on hover for selection. Selected cards: burgundy border, filled checkbox.
- **Selection bar (sticky bottom):** "[N] bishops selected · Clear · Build Directory"
- **Sort options (top-right):** Last name, See, Consecration date, Age.
- **Result count (top-left):** "Showing 47 bishops"

#### Screen 4: Filter Panel

Located in sidebar (desktop) or slide-up sheet (mobile). Filter groups, each collapsible:

- **Status:** Active (Ordinary / Auxiliary / Coadjutor) · Retired · Deceased
- **Rank:** Cardinal · Archbishop · Bishop
- **Rite:** Latin · Eastern (individual rites listed)
- **Location:** Country → State/Region → Province → Diocese (searchable dropdowns, not strict cascaders)
- **Religious Order:** Searchable dropdown (S.J., O.F.M., O.P., etc.) or "Diocesan clergy only"
- **Consecration:** Consecrated by [Person search] · Consecrated at [Location] · Consecrated between [Year range]
- **Priesthood Ordination:** Ordained between [Year range] · Ordained for [Diocese search]
- **Age / Birth:** Born between [Year range] · Age range slider
- **Cardinalate:** Is a cardinal · Is an elector · Created cardinal between [Year range]

Each filter shows matching count in parentheses before being applied. Active filters appear as removable chips above the grid. Results update in real time — no "Apply" button.

#### Screen 5: Bishop Detail Page

```
┌────────────┬──────────────────────────────────────┐
│ [Portrait] │  Most Rev. John A. Smith, S.J.       │
│  240×320   │  Archbishop of Springfield [amaranth]  │
│            │  Cardinal (since 2021) [scarlet]      │
│            │                                       │
│            │  Born: March 15, 1952 · Chicago, IL   │
│            │  Ordained priest: June 1, 1978        │
│            │  Ordained bishop: September 14, 2003  │
│            │  Rite: Latin                          │
│            │                                       │
│            │  [Select for Directory] [External ↗]  │
├────────────┴──────────────────────────────────────┤
│  ┌─ Timeline ─┬─ Lineage ─┬─ Consecrations Given ┐│
│                                                    │
│  TIMELINE: Vertical line with rank-colored nodes.  │
│  Each event: date (left column, 80px) +            │
│  description (right). Linked persons are           │
│  clickable with 24×24 circular portrait thumbs.    │
│                                                    │
│  LINEAGE: Ascending chain of consecrators.         │
│  Vertical chain of portrait thumbnails + names.    │
│                                                    │
│  CONSECRATIONS GIVEN: Portrait card grid of        │
│  every bishop this person consecrated.             │
└────────────────────────────────────────────────────┘
```

#### Screen 6: Diocese Detail Page

- Header: Diocese name, type (Metropolitan See / Suffragan), province, date erected
- **Current Leadership:** Large portrait card for ordinary, smaller cards for auxiliaries. Auxiliary portrait thumbnails inline.
- **Succession tab:** Chronological list with portrait thumbnails (48×64), name, years served, how tenure ended.
- **Suffragan Dioceses** (if metropolitan) or **Metropolitan** (if suffragan): Linked list with bishop portrait thumbnails inline beside each diocese name.

#### Screen 7: Build a Directory (Generator)

**Step 1 — Review Selection:** Reorderable list of selected bishops with portrait thumbnails. Drag to reorder, × to remove. Search field at bottom to add more.

**Step 2 — Configure Layout:**
- Detail level: Minimal (Photo + Name + Title) · Standard (+ See + Consecration Date) · Full (+ Consecrator + Ordination Date)
- Grid density: Large (3/row, landscape) · Medium (4/row, landscape) · Compact (6/row, portrait)
- Sort: Alphabetical · By see · By seniority · Manual
- Cover page: Toggle on/off. Title and subtitle fields.
- Page size: US Letter · A4

**Step 3 — Preview:** Live-rendered PDF preview, scrollable page by page.

**Step 4 — Export:** "Download PDF" button.

**Print layout:** Cormorant Garamond for names, Public Sans for metadata. Black on white, no color accents (rank colors are screen-only). Photos in color. Must also look good in grayscale.

#### Screen 8: Admin Interface

The admin interface lives at `/admin` and is a separate layout from the public site — simpler, more utilitarian, no need for the editorial polish of the public pages. Think of it as a well-organized back office. Access is protected by Supabase Auth with a simple email/password login. Only one admin account (yours) exists.

**Admin login (`/admin/login`):** Centered card with email and password fields, burgundy "Sign in" button, "hierarchy.directory" wordmark above. Minimal — no navigation, no distractions.

**Admin layout:** Left sidebar with navigation links (Dashboard, Bishops, Dioceses, Assignments, Consecrations, Import). Top bar shows "Admin" badge and sign-out button. Main content area fills the remaining width. No public-site navigation elements are visible — the admin is a separate experience. A "View live site" link opens the public site in a new tab.

**Dashboard (`/admin`):** At-a-glance stats in cards across the top: total bishops, total dioceses, bishops with portraits, bishops without portraits, recently updated entries. Below, a "Recent Activity" list showing the last 20 create/update actions with timestamps. This helps you track your own data entry progress.

**Bishop list (`/admin/bishops`):** A searchable, sortable data table. Columns: portrait thumbnail (40×40), name, current title, see, status (active/retired/deceased), has portrait (checkmark or ×). Search bar filters instantly. Sort by any column. Click a row to edit. "Add New Bishop" button in the top right.

**Bishop edit form (`/admin/bishops/[id]` or `/admin/bishops/new`):**

The form is organized in sections:

- **Identity:** First name, middle name, last name, suffix, religious order. All text inputs.
- **Portrait:** Drag-and-drop image uploader. Shows current photo if one exists, with "Replace" and "Remove" options. Accepts JPEG/PNG. Shows a preview after upload with the 3:4 crop applied.
- **Biographical:** Date of birth (date picker), place of birth (text), country of birth (country dropdown — separate from diocese), date of death (date picker, nullable), rite (dropdown).
- **Education & Formation:** Seminary (text input with autocomplete from existing values in the database), education notes (text input, e.g., "JCD, Gregorian University"). These are optional research fields — not required for v1 data entry but the fields should be visible and ready to populate.
- **Priesthood Ordination:** Date, location, ordaining bishop (person picker — a searchable dropdown that searches across all persons in the database), diocese of incardination (see picker — searchable dropdown of all sees).
- **Episcopal Consecration:** Date, location, principal consecrator (person picker), co-consecrators (multi-select person picker, typically 2). This section creates/edits the `episcopal_consecration` and `episcopal_consecration_co_consecrator` records.
- **Cardinalate (collapsible, only shown if "Is Cardinal" is checked):** Date created, cardinal order (dropdown: Deacon/Priest/Bishop), titular church (text).
- **Assignments:** Shown as a list of assignment cards below the main form. Each card shows: see (see picker), role (dropdown), start date, end date, start reason, end reason. "Add Assignment" button appends a new blank card. Each card has a delete button. Assignments are saved independently from the person fields — each card has its own save/delete actions.
- **External Links:** Catholic-hierarchy.org ID, GCatholic ID, Wikipedia URL, diocesan bio URL. All text inputs.
- **Source Citations (collapsible):** A list of citation records for this person. Each row: source type (dropdown), source detail (text/URL), accessed date, notes. "Add Citation" button. Optional but available for research rigor.

The form has a "Save" button that saves the person fields, and each assignment/consecration section saves independently. A "Delete Bishop" button at the bottom with a confirmation dialog.

**Diocese edit form (`/admin/dioceses/[id]` or `/admin/dioceses/new`):**

Note: US Latin-rite dioceses are pre-seeded, so this form is primarily for editing existing records, not creating new ones. New diocese creation would only be needed for newly erected dioceses or non-US sees.

- **Identity:** Name (place name only — e.g., "Baltimore", not "Archdiocese of Baltimore"), see type (dropdown — this determines the prefix), name prefix override (text input, nullable — only needed for edge cases like "for the"), rite (dropdown). A live preview below these fields shows the computed full name: "Archdiocese of Baltimore".
- **Location:** Country (dropdown), state/region (text).
- **Cathedral:** Cathedral name (text), cathedral address (text). A "Geocode" button that takes the address and auto-fills latitude/longitude via a geocoding API. Latitude and longitude as number inputs (editable for manual correction).
- **Province:** Metropolitan see (see picker — nullable, only for suffragans). Is metropolitan (checkbox).
- **Dates:** Date erected, date suppressed (nullable).
- **Name History:** Editable list of former names with date ranges.

**Assignments page (`/admin/assignments`):** A bulk view of all assignments as a data table — person name, see, role, start date, end date, status. Sortable and searchable. Useful for spotting data entry errors (e.g., overlapping assignments, missing end dates). Click to jump to the relevant bishop's edit page.

**Consecrations page (`/admin/consecrations`):** Similar bulk table view — person consecrated, date, principal consecrator, co-consecrators. Useful for verifying lineage data.

**CSV Import (`/admin/import`):**

A multi-step import tool for bulk data entry:
1. Upload a CSV file (drag-and-drop or file picker).
2. Select entity type: Bishop, Diocese, or Assignment.
3. Column mapping: the tool shows the CSV headers and lets you map each to a database field via dropdowns. Auto-maps obvious matches (e.g., "first_name" → First Name).
4. Preview: shows the first 10 rows as they would be imported, with validation errors highlighted in red (missing required fields, unrecognized foreign key references, date format issues).
5. Import: "Import [N] rows" button. Shows progress and a summary when complete (created, skipped, errors).

The CSV importer is especially important for the initial data population phase when you're entering hundreds of bishops.

### 2.8 Interaction Patterns

**Search:** Persistent in top bar. Searches bishop names, diocese names, locations, religious orders simultaneously. Typeahead dropdown after 2+ characters, grouped by type (Bishops with thumbnail, Dioceses with country). Enter opens full filtered grid.

**Selection:** Persistent across navigation within a session. Stored in localStorage so an accidental tab close doesn't lose work. Count always visible in top bar when ≥1 selected. "Clear selection" always one click away.

**Breadcrumbs:** Present on every page except Home. Each segment clickable. Mobile: truncated to immediate parent + current, "..." expands full trail.

### 2.9 Accessibility

- All portraits: alt text "[Name], [Title], [Diocese]"
- Filter controls keyboard-navigable and screen-reader friendly
- All text/background combos meet WCAG AA (4.5:1 body, 3:1 large text)
- Burgundy `#7A1B2E` on warm white `#FAF8F5` ≈ 8:1 contrast
- Scarlet `#C41E3A` on warm white `#FAF8F5` ≈ 5.5:1 contrast — passes AA
- Amaranth `#9F2B68` on warm white `#FAF8F5` ≈ 6.2:1 contrast — passes AA comfortably
- PDF export uses semantic heading structure

---

## 3. Data Model

### 3.1 Entity Relationship Overview

```
Person ←──── Assignment ────→ See
  │                              │
  ├── EpiscopalConsecration      ├── Province (self-ref on See)
  │     ├── principal (Person)   │
  │     └── co-consecrators      ├── Country
  │                              │
  ├── PriesthoodOrdination       ├── Rite
  │                              │
  ├── Cardinalate                └── DioceseCounty (FIPS mapping
  │                                   for geographic boundaries)
  ├── Country (of birth)
  │
  └── Portrait (file reference)

SourceCitation ──→ any entity (polymorphic via entity_type + entity_id)
```

### 3.2 Tables

#### `person`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| first_name | VARCHAR(100) | |
| middle_name | VARCHAR(100) | Nullable |
| last_name | VARCHAR(100) | |
| suffix | VARCHAR(20) | Jr., III, etc. Nullable |
| religious_order | VARCHAR(20) | S.J., O.F.M., etc. Nullable |
| date_of_birth | DATE | Nullable (historical figures may lack this) |
| place_of_birth | VARCHAR(200) | Nullable |
| country_of_birth_id | UUID | FK → country. Nullable. Separate from diocese — a bishop born in Ireland serving in Boston tells a story. |
| date_of_death | DATE | Nullable |
| rite_id | UUID | FK → rite |
| seminary | VARCHAR(200) | Nullable. Primary seminary attended (e.g., "North American College", "Mount St. Mary's"). Powers future research on seminary-to-bishop pipelines. |
| education_notes | VARCHAR(500) | Nullable. Degrees and fields (e.g., "JCD, Gregorian University"). Free text for now — can be normalized later if research warrants it. |
| portrait_url | VARCHAR(500) | Path to primary photo. Nullable |
| catholic_hierarchy_id | VARCHAR(50) | External reference. Nullable |
| gcatholic_id | VARCHAR(50) | Nullable |
| wikipedia_url | VARCHAR(500) | Nullable |
| diocesan_bio_url | VARCHAR(500) | Nullable |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### `rite`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | VARCHAR(100) | Latin, Maronite, Melkite, Ukrainian, etc. |
| type | VARCHAR(20) | 'latin' or 'eastern' |

#### `country`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | VARCHAR(100) | |
| iso_code | VARCHAR(3) | ISO 3166-1 alpha-2 |

#### `see`

A diocese, archdiocese, eparchy, titular see, curial office, nunciature, or other jurisdiction. **US Latin-rite dioceses are pre-seeded** — you should almost never need to create one manually. The seed data includes all ~197 Latin-rite sees with their province assignments, state, cathedral info, and coordinates.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | VARCHAR(200) | Place name only — e.g., "Baltimore", not "Archdiocese of Baltimore". The full display name is computed from see_type + name. |
| name_prefix_override | VARCHAR(20) | Nullable. Defaults to "of" (e.g., "Archdiocese of Baltimore"). Set to "for the" for edge cases like "Archdiocese for the Military Services". |
| see_type | VARCHAR(50) | 'archdiocese', 'diocese', 'eparchy', 'titular_see', 'military_ordinariate', 'personal_ordinariate', 'apostolic_vicariate', 'curial_office', 'nunciature', etc. |
| rite_id | UUID | FK → rite |
| country_id | UUID | FK → country. Nullable (titular sees may not have a country) |
| state_region | VARCHAR(100) | Nullable |
| metropolitan_see_id | UUID | FK → see (self-referencing). Nullable. The metropolitan archdiocese this see belongs to. NULL if this see IS a metropolitan or is not part of a province. |
| is_metropolitan | BOOLEAN | Default false |
| date_erected | DATE | Nullable |
| date_suppressed | DATE | Nullable (for merged/suppressed sees) |
| cathedral_name | VARCHAR(200) | Nullable. e.g., "Cathedral of Mary Our Queen". The canonical center of the diocese. |
| cathedral_address | VARCHAR(300) | Nullable. Full street address of the cathedral. |
| cathedral_latitude | DECIMAL(9,6) | Nullable. Geocoded from cathedral address. Used for map features and geographic queries. |
| cathedral_longitude | DECIMAL(9,6) | Nullable. Geocoded from cathedral address. |
| co_cathedral_name | VARCHAR(200) | Nullable. e.g., "Co-Cathedral of the Sacred Heart" (Galveston-Houston). Most dioceses will not have this. |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### `see_name_history`

Tracks name changes (e.g., elevated from diocese to archdiocese, mergers).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| see_id | UUID | FK → see |
| former_name | VARCHAR(200) | |
| start_date | DATE | Nullable |
| end_date | DATE | Nullable |

#### `assignment`

The critical join table. Links a person to a see with a role and date range.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| person_id | UUID | FK → person |
| see_id | UUID | FK → see |
| role | VARCHAR(50) | 'diocesan_bishop', 'coadjutor', 'auxiliary', 'apostolic_administrator', 'apostolic_nuncio', 'curial_prefect', 'curial_secretary', etc. |
| title_override | VARCHAR(200) | Nullable. For unusual titles that don't fit standard roles. |
| start_date | DATE | |
| end_date | DATE | Nullable (null = current assignment) |
| start_reason | VARCHAR(50) | 'appointed', 'elected', 'succeeded', etc. |
| end_reason | VARCHAR(50) | 'resigned', 'transferred', 'died', 'removed', 'retired', etc. Nullable |
| is_current | BOOLEAN | Computed/denormalized for fast queries. True if end_date is null. |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

A single person will have multiple assignment rows (their career timeline). A single see will have multiple assignment rows (its succession of bishops). Concurrent assignments are valid (e.g., auxiliary bishop of X + titular bishop of Y).

#### `episcopal_consecration`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| person_id | UUID | FK → person (the person being consecrated) |
| date | DATE | |
| location | VARCHAR(200) | Nullable |
| principal_consecrator_id | UUID | FK → person. Nullable (historical cases may be unknown) |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### `episcopal_consecration_co_consecrator`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| consecration_id | UUID | FK → episcopal_consecration |
| co_consecrator_id | UUID | FK → person |
| ordinal | INTEGER | 1 = first co-consecrator, 2 = second |

#### `priesthood_ordination`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| person_id | UUID | FK → person |
| date | DATE | |
| location | VARCHAR(200) | Nullable |
| ordaining_bishop_id | UUID | FK → person. Nullable |
| diocese_of_incardination_id | UUID | FK → see. Nullable |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### `cardinalate`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| person_id | UUID | FK → person |
| date_created | DATE | |
| cardinal_order | VARCHAR(20) | 'deacon', 'priest', 'bishop' |
| titular_church | VARCHAR(200) | Nullable |
| is_elector | BOOLEAN | Computed: true if cardinal is under 80 and alive |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### `diocese_county`

Maps US Latin-rite dioceses to their constituent counties using FIPS codes. Diocese boundaries in the US almost always follow county lines. This table enables geographic boundary rendering by merging county polygons from Census Bureau shapefiles. **Pre-seeded for all US Latin-rite dioceses.** Eastern Catholic eparchies are excluded — their boundaries are non-territorial or overlap Latin-rite dioceses.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| see_id | UUID | FK → see |
| county_fips | VARCHAR(5) | 5-digit FIPS code (state + county). Standard federal identifier. |
| state_fips | VARCHAR(2) | 2-digit state FIPS. Redundant with county_fips but useful for state-level queries. |
| county_name | VARCHAR(100) | Human-readable county name for reference/debugging. |
| state_name | VARCHAR(50) | Human-readable state name. |

#### `source_citation`

Tracks the provenance of data entries. Enables scholarly credibility and helps resolve conflicts between sources. Not required for v1 data entry, but the table should exist from day one so citations can be added progressively.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| entity_type | VARCHAR(50) | 'person', 'assignment', 'consecration', 'see', etc. |
| entity_id | UUID | ID of the referenced record |
| source_type | VARCHAR(50) | 'annuario_pontificio', 'vatican_bulletin', 'diocesan_website', 'usccb', 'catholic_hierarchy', 'wikipedia', 'newspaper', 'other' |
| source_detail | TEXT | URL, page number, publication name, or full citation text |
| accessed_date | DATE | When the source was consulted. Nullable for print sources. |
| notes | TEXT | Nullable. E.g., "Conflicts with Catholic-hierarchy.org date of 1987 — Vatican bulletin confirms 1988." |
| created_at | TIMESTAMPTZ | |

### 3.3 Key Indexes

```sql
-- Fast lookups for browse/filter
CREATE INDEX idx_assignment_person ON assignment(person_id);
CREATE INDEX idx_assignment_see ON assignment(see_id);
CREATE INDEX idx_assignment_current ON assignment(is_current) WHERE is_current = true;
CREATE INDEX idx_see_metropolitan ON see(metropolitan_see_id);
CREATE INDEX idx_see_country ON see(country_id);
CREATE INDEX idx_person_last_name ON person(last_name);
CREATE INDEX idx_person_rite ON person(rite_id);
CREATE INDEX idx_consecration_principal ON episcopal_consecration(principal_consecrator_id);
CREATE INDEX idx_consecration_person ON episcopal_consecration(person_id);

-- Diocese county mapping (for map rendering)
CREATE INDEX idx_diocese_county_see ON diocese_county(see_id);
CREATE INDEX idx_diocese_county_fips ON diocese_county(county_fips);

-- Source citations (for research lookups)
CREATE INDEX idx_source_citation_entity ON source_citation(entity_type, entity_id);

-- Full-text search
CREATE INDEX idx_person_search ON person USING gin(
  to_tsvector('english', first_name || ' ' || coalesce(middle_name, '') || ' ' || last_name)
);
CREATE INDEX idx_see_search ON see USING gin(to_tsvector('english', name));
```

### 3.4 Key Queries the Data Model Supports

**Directory & browse queries:**
- **"All active bishops in Texas"**: Join assignment (is_current, role in diocesan/auxiliary/coadjutor) → see (state_region = 'Texas')
- **"Bishops consecrated by Cardinal Wuerl"**: Query episcopal_consecration where principal_consecrator_id = Wuerl's person_id, join to person
- **"Succession of the Archdiocese of Baltimore"**: Query assignment where see_id = Baltimore, order by start_date
- **"Episcopal lineage of Bishop X"**: Recursive: get X's consecration → principal_consecrator → their consecration → their principal_consecrator → etc.
- **"All Jesuit bishops currently active"**: Query person (religious_order = 'S.J.') joined to assignment (is_current = true)
- **"Cardinals under 80"**: Query cardinalate joined to person where age < 80 and date_of_death is null

**Research & visualization queries (enabled by new tables):**
- **"Which seminaries produce the most bishops?"**: Group by person.seminary, count, order desc
- **"Geographic boundary of the Archdiocese of Baltimore"**: Query diocese_county where see_id = Baltimore, return FIPS codes, merge county polygons client-side
- **"Bishops born outside the US serving in US dioceses"**: Join person.country_of_birth_id ≠ US to assignment.see where see.country = US
- **"Consecration network — who are the hub consecrators?"**: Count episcopal_consecration grouped by principal_consecrator_id, order desc
- **"Average age at episcopal appointment by decade"**: Compute age at first assignment start_date grouped by decade
- **"How did dioceses spread westward?"**: Query see.date_erected + see.cathedral_latitude/longitude, render as an animated timeline map

---

## 4. Tech Stack

### 4.1 Architecture Overview

```
┌──────────────────────────┐
│  Next.js 14+ (App Router)│
│  React Server Components │
│  + Client Components     │
├──────────────────────────┤
│  Admin Interface (/admin)│
│  Protected via Supabase  │
│  Auth (single admin)     │
├──────────────────────────┤
│  Prisma ORM              │
├──────────────────────────┤
│  PostgreSQL (Supabase)   │
├──────────────────────────┤
│  Supabase Storage        │
│  (portrait images)       │
├──────────────────────────┤
│  Vercel (hosting)        │
└──────────────────────────┘
```

### 4.2 Stack Choices & Rationale

| Layer | Choice | Why |
|-------|--------|-----|
| **Framework** | Next.js 14+ (App Router) | Server-side rendering for SEO (bishops' pages should be indexable). React Server Components for fast data-heavy pages. API routes for the filter/search endpoints. |
| **Language** | TypeScript | Type safety across the full stack, especially important for the complex data model. |
| **ORM** | Prisma | Excellent TypeScript integration, migration management, works perfectly with Supabase Postgres. Makes complex relational queries readable. |
| **Database** | PostgreSQL via Supabase | Relational data is essential for this domain. Supabase gives you managed Postgres with a generous free tier, plus built-in auth. |
| **Auth** | Supabase Auth | Simple email/password auth for a single admin user. Protects the `/admin` routes. No public registration — you create your one admin account directly in the Supabase dashboard. |
| **Image storage** | Supabase Storage | Same platform as the database. Handles image uploads, serves via CDN, supports image transforms (resizing/cropping) out of the box. |
| **Styling** | Tailwind CSS | Utility-first fits the component-based architecture. Extend the config with the custom color palette and font definitions from the design spec. |
| **PDF generation** | @react-pdf/renderer | React-based PDF generation. Lets you build the directory layout using React components, which keeps the print layout code consistent with the web layout patterns. |
| **Search** | PostgreSQL full-text search | Good enough for v1. The dataset is small enough (thousands, not millions) that Postgres FTS with GIN indexes will be fast. Upgrade to a dedicated search engine only if needed. |
| **Hosting** | Vercel | Native Next.js hosting, edge functions, automatic preview deployments. Free tier is sufficient for early development. |
| **Font loading** | next/font (Google Fonts) | Both Cormorant Garamond and Public Sans load via `next/font/google` for optimized delivery and zero layout shift. No external dependencies. |

### 4.3 Project Structure

```
hierarchy-directory/
├── prisma/
│   ├── schema.prisma          # Data model definition
│   ├── migrations/            # Database migrations
│   └── seed.ts                # Seed script for sample data
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout (top bar, fonts, global styles)
│   │   ├── page.tsx           # Home / Landing page
│   │   ├── browse/
│   │   │   └── [...slug]/
│   │   │       └── page.tsx   # Hierarchical drill-down (rite/country/province/diocese)
│   │   ├── bishops/
│   │   │   ├── page.tsx       # Portrait grid with filters
│   │   │   └── [id]/
│   │   │       └── page.tsx   # Bishop detail page
│   │   ├── dioceses/
│   │   │   └── [id]/
│   │   │       └── page.tsx   # Diocese detail page
│   │   ├── build-directory/
│   │   │   └── page.tsx       # Directory generator (client component)
│   │   ├── admin/
│   │   │   ├── layout.tsx     # Admin layout (auth guard, admin nav)
│   │   │   ├── page.tsx       # Admin dashboard (counts, recent activity)
│   │   │   ├── login/
│   │   │   │   └── page.tsx   # Login page
│   │   │   ├── bishops/
│   │   │   │   ├── page.tsx       # Bishop list (searchable, sortable table)
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx   # Create new bishop
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx   # Edit bishop (all fields + assignments + photo)
│   │   │   ├── dioceses/
│   │   │   │   ├── page.tsx       # Diocese list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx   # Create new diocese
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx   # Edit diocese
│   │   │   ├── assignments/
│   │   │   │   └── page.tsx       # Manage assignments (bulk view)
│   │   │   ├── consecrations/
│   │   │   │   └── page.tsx       # Manage consecration records
│   │   │   └── import/
│   │   │       └── page.tsx       # CSV/bulk import tool
│   │   └── api/
│   │       ├── bishops/
│   │       │   ├── route.ts       # GET with filters, search, pagination
│   │       │   └── [id]/route.ts  # GET single bishop with full relations
│   │       ├── dioceses/
│   │       │   ├── route.ts       # GET with filters
│   │       │   └── [id]/route.ts  # GET single diocese with succession
│   │       ├── search/
│   │       │   └── route.ts       # Typeahead search endpoint
│   │       ├── directory/
│   │       │   └── pdf/route.ts   # POST: generate PDF from selection
│   │       └── admin/             # All admin API routes (auth-protected)
│   │           ├── bishops/
│   │           │   ├── route.ts       # GET list, POST create
│   │           │   └── [id]/route.ts  # GET, PUT, DELETE single bishop
│   │           ├── dioceses/
│   │           │   ├── route.ts       # GET list, POST create
│   │           │   └── [id]/route.ts  # GET, PUT, DELETE single diocese
│   │           ├── assignments/
│   │           │   ├── route.ts       # POST create
│   │           │   └── [id]/route.ts  # PUT, DELETE
│   │           ├── consecrations/
│   │           │   ├── route.ts       # POST create
│   │           │   └── [id]/route.ts  # PUT, DELETE
│   │           ├── upload/
│   │           │   └── route.ts       # POST portrait image upload
│   │           └── import/
│   │               └── route.ts       # POST CSV bulk import
│   ├── components/
│   │   ├── layout/
│   │   │   ├── TopBar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Breadcrumbs.tsx
│   │   │   └── SelectionBar.tsx
│   │   ├── bishop/
│   │   │   ├── BishopCard.tsx         # Portrait card for grid
│   │   │   ├── BishopDetail.tsx       # Full detail view
│   │   │   ├── BishopTimeline.tsx     # Career timeline
│   │   │   ├── BishopLineage.tsx      # Consecration lineage chain
│   │   │   └── BishopPortrait.tsx     # Portrait with fallback initials
│   │   ├── diocese/
│   │   │   ├── DioceseHeader.tsx
│   │   │   ├── DioceseSuccession.tsx
│   │   │   └── DioceseSuffragans.tsx
│   │   ├── filters/
│   │   │   ├── FilterPanel.tsx
│   │   │   ├── FilterGroup.tsx
│   │   │   ├── FilterChips.tsx
│   │   │   └── SearchableDropdown.tsx
│   │   ├── search/
│   │   │   └── SearchBar.tsx          # Typeahead with grouped results
│   │   ├── browse/
│   │   │   └── HierarchyTree.tsx      # Collapsible tree sidebar
│   │   ├── directory/
│   │   │   ├── DirectoryBuilder.tsx    # Step-by-step generator
│   │   │   ├── DirectoryPreview.tsx    # Live PDF preview
│   │   │   └── DirectoryPDFDocument.tsx # @react-pdf/renderer template
│   │   └── admin/
│   │       ├── AdminNav.tsx           # Admin sidebar navigation
│   │       ├── AdminDashboard.tsx     # Dashboard with counts and recent activity
│   │       ├── BishopForm.tsx         # Create/edit bishop form (all fields)
│   │       ├── DioceseForm.tsx        # Create/edit diocese form
│   │       ├── AssignmentForm.tsx     # Add/edit assignment (inline on bishop page)
│   │       ├── ConsecrationForm.tsx   # Add/edit consecration record
│   │       ├── PortraitUploader.tsx   # Drag-and-drop photo upload with crop/preview
│   │       ├── PersonPicker.tsx       # Searchable person selector (for consecrators, etc.)
│   │       ├── SeePicker.tsx          # Searchable see/diocese selector
│   │       ├── DataTable.tsx          # Reusable sortable/searchable admin table
│   │       └── CSVImporter.tsx        # CSV upload, column mapping, preview, import
│   ├── hooks/
│   │   ├── useSelection.ts           # Selection state + localStorage persistence
│   │   ├── useFilters.ts             # Filter state management
│   │   └── useDebounce.ts            # For typeahead search
│   ├── lib/
│   │   ├── prisma.ts                 # Prisma client singleton
│   │   ├── supabase.ts              # Supabase client (for auth + storage)
│   │   ├── auth.ts                  # Auth helpers (getSession, requireAdmin)
│   │   ├── queries/                  # Reusable Prisma query builders
│   │   │   ├── bishops.ts
│   │   │   ├── dioceses.ts
│   │   │   └── search.ts
│   │   └── utils/
│   │       ├── formatName.ts         # "Most Rev. First M. Last, S.J."
│   │       ├── formatTitle.ts        # "Archbishop of Springfield"
│   │       ├── formatSeeName.ts      # "Baltimore" + "archdiocese" → "Archdiocese of Baltimore"
│   │       └── getInitials.ts        # For portrait placeholders
│   └── styles/
│       └── globals.css               # Tailwind directives + custom properties
├── public/
│   └── fonts/                        # If self-hosting fonts instead of Google
├── tailwind.config.ts                # Extended with design spec tokens
├── next.config.js
├── package.json
└── tsconfig.json
```

### 4.4 Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#FAF8F5',
        surface: '#F0ECE4',
        'text-primary': '#1A1714',
        'text-secondary': '#6B6560',
        'text-tertiary': '#9C958D',
        burgundy: {
          DEFAULT: '#7A1B2E',
          hover: '#5C1422',
        },
        // Rank colors (zucchetto)
        scarlet: '#C41E3A',       // Cardinals
        amaranth: '#9F2B68',      // Archbishops and Bishops
        border: '#DDD8D0',
        tag: '#E8E3DB',
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Palatino', 'Palatino Linotype', 'serif'],
        body: ['Public Sans', 'sans-serif'],
      },
      maxWidth: {
        content: '1200px',
      },
    },
  },
  plugins: [],
}

export default config
```

---

## 5. API Design

### 5.1 Endpoints

#### `GET /api/bishops`

Returns paginated, filterable list of bishops.

**Query parameters:**
- `search` (string) — Full-text search across names
- `status` (string, comma-separated) — 'active', 'retired', 'deceased'
- `rank` (string, comma-separated) — 'cardinal', 'archbishop', 'bishop'
- `rite` (string) — Rite ID
- `country` (string) — Country ID
- `state` (string) — State/region name
- `province` (string) — Metropolitan see ID
- `diocese` (string) — See ID
- `religious_order` (string) — Order abbreviation
- `consecrated_by` (string) — Person ID of consecrator
- `consecrated_after` (string) — Year
- `consecrated_before` (string) — Year
- `born_after` (string) — Year
- `born_before` (string) — Year
- `sort` (string) — 'last_name', 'see', 'consecration_date', 'age'. Default 'last_name'
- `page` (integer) — Default 1
- `per_page` (integer) — Default 48

**Response:**
```json
{
  "bishops": [
    {
      "id": "uuid",
      "first_name": "William",
      "middle_name": "E.",
      "last_name": "Lori",
      "suffix": null,
      "religious_order": null,
      "portrait_url": "https://...",
      "current_assignment": {
        "role": "diocesan_bishop",
        "title": "Archbishop of Baltimore",
        "see_name": "Archdiocese of Baltimore"
      },
      "is_cardinal": false,
      "episcopal_consecration_date": "2001-10-06"
    }
  ],
  "total": 274,
  "page": 1,
  "per_page": 48,
  "filter_counts": {
    "status": { "active": 92, "retired": 38, "deceased": 13 },
    "rank": { "cardinal": 14, "archbishop": 62, "bishop": 85 }
  }
}
```

The `filter_counts` object powers the "(143)" numbers next to each filter option.

#### `GET /api/bishops/[id]`

Full bishop detail with all relations.

**Response includes:** Person data, all assignments (ordered by date), episcopal consecration with principal + co-consecrators (as person stubs with portraits), priesthood ordination, cardinalate (if applicable), bishops they have consecrated.

#### `GET /api/dioceses/[id]`

Full diocese detail.

**Response includes:** See data, current leadership (ordinary + auxiliaries as person stubs), succession (all assignments ordered by date with person stubs), suffragan dioceses (if metropolitan) or metropolitan see (if suffragan).

#### `GET /api/search`

Typeahead search endpoint.

**Query parameters:** `q` (string, minimum 2 characters)

**Response:**
```json
{
  "bishops": [
    { "id": "uuid", "name": "Most Rev. William E. Lori", "title": "Archbishop of Baltimore", "portrait_url": "..." }
  ],
  "dioceses": [
    { "id": "uuid", "name": "Archdiocese of Baltimore", "country": "United States" }
  ]
}
```

#### `GET /api/browse/[...path]`

Returns children for a given level in the hierarchy.

- `/api/browse` → list of rites
- `/api/browse/latin` → list of countries
- `/api/browse/latin/united-states` → list of provinces
- `/api/browse/latin/united-states/province-of-baltimore` → list of dioceses in province

#### `POST /api/directory/pdf`

Generates a PDF from a selection of bishops.

**Request body:**
```json
{
  "bishop_ids": ["uuid1", "uuid2", "uuid3"],
  "detail_level": "standard",
  "grid_density": "medium",
  "sort": "last_name",
  "cover_page": {
    "enabled": true,
    "title": "Visiting Bishops",
    "subtitle": "Fall General Assembly 2026"
  },
  "page_size": "letter"
}
```

**Response:** PDF file stream.

### 5.2 Admin API Endpoints

All admin endpoints are protected by Supabase Auth. Every request must include a valid session token. If the token is missing or invalid, the endpoint returns 401.

#### `POST /api/admin/bishops`

Create a new bishop. Request body includes all person fields. Returns the created bishop with ID.

#### `PUT /api/admin/bishops/[id]`

Update an existing bishop's person fields (name, dates, rite, religious order, external links). Does NOT manage assignments or consecrations — those have their own endpoints.

#### `DELETE /api/admin/bishops/[id]`

Delete a bishop and all associated records (assignments, consecrations, ordination, cardinalate). Requires confirmation param `?confirm=true`. Returns 400 if the bishop is referenced as a consecrator for other bishops — those links must be reassigned or removed first.

#### `POST /api/admin/assignments`

Create a new assignment. Request body: `{ person_id, see_id, role, start_date, end_date, start_reason, end_reason }`. Automatically computes `is_current` based on whether `end_date` is null.

#### `PUT /api/admin/assignments/[id]`

Update an assignment. Recomputes `is_current`.

#### `DELETE /api/admin/assignments/[id]`

Delete an assignment.

#### `POST /api/admin/consecrations`

Create an episcopal consecration record. Request body: `{ person_id, date, location, principal_consecrator_id, co_consecrator_ids: [id, id] }`. Creates the consecration and co-consecrator join records in a single transaction.

#### `PUT /api/admin/consecrations/[id]`

Update a consecration record (including replacing co-consecrators).

#### `POST /api/admin/dioceses`

Create a new see/diocese. Request body includes all see fields.

#### `PUT /api/admin/dioceses/[id]`

Update a diocese's fields.

#### `DELETE /api/admin/dioceses/[id]`

Delete a diocese. Returns 400 if any assignments reference it — those must be reassigned first.

#### `POST /api/admin/upload`

Upload a portrait image. Accepts multipart form data with the image file and the `person_id`. Uploads to Supabase Storage, generates a CDN URL, and updates the person's `portrait_url`. Accepts JPEG and PNG. Images are resized server-side to a max of 800px on the long edge to keep storage manageable.

#### `POST /api/admin/import`

Bulk import from CSV. Request body: `{ csv_data, entity_type: 'bishop' | 'diocese' | 'assignment', column_mapping: { csv_column: db_field } }`. Validates all rows before importing. Returns a summary of created/skipped/errored rows. Runs in a database transaction — if any row fails validation, none are imported.

---

## 6. Build Plan — Step-by-Step Instructions

These are written for you (Alex) as an implementation plan. Each phase is a self-contained chunk that results in something runnable and testable before moving on.

### Phase 0: Project Setup

**Implementation prompt:**

> Initialize a Next.js 14 project with TypeScript, Tailwind CSS, and the App Router. Use `create-next-app`. Name the project `hierarchy-directory`. Add Prisma as a dependency. Add `@react-pdf/renderer` as a dependency. Configure Tailwind with these custom colors and fonts: [paste the Tailwind config from section 4.4]. Load both Cormorant Garamond and Public Sans via `next/font/google` in the root layout. Set the page background to `#FAF8F5` and default text color to `#1A1714`.

**What you should have when done:** A running Next.js app at localhost:3000 with Cormorant Garamond and Public Sans rendering correctly on a blank page with the warm white background.

---

### Phase 1: Database & Data Model

**Step 1.1 — Set up Supabase**

Do this yourself:
1. Go to supabase.com, create a free account and a new project.
2. Copy the database connection string from Settings → Database → Connection String (URI).
3. Create a `.env` file in your project root with `DATABASE_URL="your_connection_string"`.

**Step 1.2 — Define the Prisma schema**

Implementation prompt:

> Create the Prisma schema at `prisma/schema.prisma` based on the data model in the spec. Use PostgreSQL as the provider. Define models for: Rite, Country, Person (including country_of_birth, seminary, and education_notes fields), See (including cathedral_name, cathedral_address, cathedral_latitude, cathedral_longitude), SeeNameHistory, Assignment, EpiscopalConsecration, EpiscopalConsecrationCoConsecrator, PriesthoodOrdination, Cardinalate, DioceseCounty, and SourceCitation. Use UUIDs for all primary keys with `@default(uuid())`. Add `createdAt` and `updatedAt` timestamps where specified. Set up all foreign key relations with appropriate `@relation` annotations. Add the indexes specified in section 3.3 of the spec.

**Step 1.3 — Create US diocese seed data**

Implementation prompt:

> Create a comprehensive seed script at `prisma/seed.ts`. This is the most important seed step — it pre-populates ALL US Latin-rite dioceses as reference data so they never need to be entered manually. The script should:
>
> 1. Create the Latin rite and the major Eastern rites (Maronite, Melkite, Ukrainian, Syro-Malabar, Romanian, Ruthenian, Chaldean, Armenian, Syriac).
> 2. Create the United States as a country (and a few others like Vatican City, Canada, Mexico for future use).
> 3. Create ALL 197 US Latin-rite sees: 33 metropolitan archdioceses, ~163 suffragan dioceses, plus the Archdiocese for the Military Services and the Personal Ordinariate of the Chair of St. Peter. For each, include: name (place name only, e.g., "Baltimore" not "Archdiocese of Baltimore"), see_type (archdiocese or diocese), name_prefix_override (null for most — set to "for the" for the Archdiocese for the Military Services), rite (Latin), country (United States), state_region, metropolitan_see_id (linking suffragans to their metropolitan), is_metropolitan flag, date_erected, cathedral_name, and cathedral_address. Source this data from the USCCB directory and Wikipedia's "List of Catholic dioceses in the United States."
> 4. Geocode the cathedral addresses to populate cathedral_latitude and cathedral_longitude. Use a geocoding service or hardcode coordinates from Google Maps for the initial seed.
> 5. Create 20 sample bishops with realistic data for testing — use real names and dates for the current and recent bishops of the Province of Baltimore (Archdiocese of Baltimore, Arlington, Richmond, Wheeling-Charleston, Wilmington). Include assignments, episcopal consecrations with principal and co-consecrators, priesthood ordinations, and at least 2 cardinals. Make sure some bishops have multiple assignments (career history) and that the consecration lineage links between bishops where possible.
> 6. Add the seed script to package.json scripts.
>
> The diocese seed data is a one-time investment — once seeded, the admin interface will only need to pick from these existing sees via dropdown, not create them.

**Step 1.4 — Create US county-to-diocese mapping seed**

Implementation prompt:

> Create a separate seed file at `prisma/seed-counties.ts` that populates the `diocese_county` table mapping every US county (by FIPS code) to its Latin-rite diocese. There are ~3,243 counties/county-equivalents in the US and ~197 Latin-rite dioceses. The mapping data can be compiled from the Official Catholic Directory's territorial descriptions. For the initial seed, create a JSON or CSV file at `prisma/data/diocese-counties.json` with the structure `{ see_name: string, counties: [{ fips: string, county_name: string, state_name: string, state_fips: string }] }` and write a script that reads this file and creates the DioceseCounty records by looking up the see_id from the name. Note: this seed file will need to be populated manually from reference data — generate the script structure and a sample entry for the Archdiocese of Baltimore (Baltimore City + surrounding counties), and include instructions for how to complete the rest of the mapping. Add this as a separate npm script: `"seed:counties": "ts-node prisma/seed-counties.ts"`.

**Step 1.5 — Run migration and seed**

Do this yourself in terminal:
```bash
npx prisma migrate dev --name init
npx prisma db seed
npx prisma studio  # Open Prisma Studio to verify data looks right
```

**What you should have when done:** A populated PostgreSQL database with all 197 US Latin-rite dioceses (with cathedral coordinates), 20 sample bishops, proper relations, and a county mapping structure ready to be filled in. Prisma Studio should show the full diocese list when you open the See table.

---

### Phase 2: Core API & Data Layer

**Step 2.1 — Prisma client and query helpers**

Implementation prompt:

> Create the Prisma client singleton at `src/lib/prisma.ts`. Then create query helper functions in `src/lib/queries/`: `bishops.ts` with functions for `getBishops(filters, sort, page)`, `getBishopById(id)`, and `getBishopFilterCounts(filters)`. `dioceses.ts` with `getDioceseById(id)` including succession and current leadership. `search.ts` with `typeaheadSearch(query)` that searches across person names and see names. Also create a `formatSeeName.ts` utility in `src/lib/utils/` that computes the full display name from the `name`, `see_type`, and `name_prefix_override` fields. The function should handle: standard cases ("Baltimore" + "archdiocese" → "Archdiocese of Baltimore"), prefix overrides ("Military Services" + "archdiocese" + "for the" → "Archdiocese for the Military Services"), and titular sees ("Nova Germania" + "titular_see" → "Titular See of Nova Germania"). Use this utility everywhere a see name is displayed. The `getBishops` function should accept all the filter parameters from the API spec (status, rank, rite, country, state, province, diocese, religious_order, consecrated_by, year ranges) and build the Prisma where clause dynamically. Include the `filter_counts` computation — for each filter category, count how many results match each option given the OTHER active filters.

**Step 2.2 — API routes**

Implementation prompt:

> Create Next.js API route handlers based on the API spec: `GET /api/bishops` using the getBishops query helper with all filter params from searchParams. `GET /api/bishops/[id]` using getBishopById. `GET /api/dioceses/[id]` using getDioceseById. `GET /api/search` using typeaheadSearch. `GET /api/browse/[...path]` that returns the appropriate level of hierarchy based on the path segments. All endpoints should return proper JSON responses with appropriate HTTP status codes and error handling.

**Step 2.3 — Test the API**

Open your browser or use curl to test:
- `http://localhost:3000/api/bishops` — should return all 20 seed bishops
- `http://localhost:3000/api/bishops?status=active&country=[us-uuid]` — should filter
- `http://localhost:3000/api/search?q=Lori` — should return matching results
- `http://localhost:3000/api/dioceses/[baltimore-uuid]` — should return full diocese data

**What you should have when done:** A working API that returns real data from your database with filtering, search, and detail endpoints.

---

### Phase 3: Layout Shell & Navigation

**Implementation prompt:**

> Build the app layout shell. Create the root layout at `src/app/layout.tsx` with: a fixed TopBar component containing the Hierarchy Directory logo (text-based for now — "HIERARCHY DIRECTORY" in Cormorant Garamond with a small cross icon), the search bar (input with magnifying glass icon), and navigation links: Browse, Search & Filter, Build a Directory. On the right side of the top bar, show a selection indicator (star icon + count, hidden when 0 selected). Build the Breadcrumbs component that renders based on the current route path. Build the SelectionBar component — a sticky bottom bar that appears when 1+ bishops are selected, showing "[N] bishops selected · Clear selection · Build Directory" with the Build Directory button in burgundy. Create a `useSelection` hook in `src/hooks/useSelection.ts` that manages selected bishop IDs in React state synced to localStorage. Use the design spec colors and typography throughout. The top bar background should be white with a subtle bottom border.

**What you should have when done:** A fully styled layout shell with working navigation, a search bar (not yet functional), and a selection system that persists across page loads.

---

### Phase 4: Home Page

**Implementation prompt:**

> Build the home page at `src/app/page.tsx`. Center the content vertically in the viewport above the fold. Show the headline "A Visual Directory of the Hierarchy of the Catholic Church in the United States" in Cormorant Garamond SemiBold, 36px, text-primary color, max-width 700px so it wraps gracefully. Below it, the subtitle "Current and historical information about the bishops and dioceses connected to the United States." in Public Sans, 16px, text-secondary color. Below that, a large search bar (wider than the nav search bar, with a burgundy search button). Below the search bar, three entry-point cards in a row: "Browse Hierarchy" with description "Explore by rite, country, province, and diocese", "Filter & Search" with "Find bishops by role, date, consecrator, and more", and "Build a Directory" with "Select bishops and generate a printable directory". Each card should have a subtle arrow icon and link to the respective route. Use the full design spec styling — warm white background, proper spacing, shadows on cards.

**What you should have when done:** A polished home page with the headline, subtitle, search bar, and three entry-point cards.

---

### Phase 5: Portrait Grid & Filters

**Step 5.1 — Portrait grid page**

Implementation prompt:

> Build the bishops grid page at `src/app/bishops/page.tsx`. This is a client component (needs interactivity). On the left, render the FilterPanel sidebar (240px wide, collapsible). On the right, render a responsive grid of BishopCard components. Above the grid, show "Showing [N] bishops" on the left and sort dropdown (Last name, See, Consecration date, Age) on the right. Below the count, show active filter chips (removable). The grid should fetch from `/api/bishops` with the current filter and sort state as query params. Use the `useFilters` hook to manage filter state in URL search params (so filtered views are shareable/bookmarkable). Each BishopCard should show a selection checkbox on hover (top-right corner). Clicking the checkbox toggles selection via the `useSelection` hook. Selected cards should have a burgundy border. Cards link to `/bishops/[id]` on click (except when clicking the checkbox). Implement pagination at the bottom — simple "Load more" button or numbered pages.

**Step 5.2 — Filter panel**

Implementation prompt:

> Build the FilterPanel component with collapsible filter groups for: Status (Active with sub-options Ordinary/Auxiliary/Coadjutor, Retired, Deceased), Rank (Cardinal, Archbishop, Bishop), Rite (Latin, Eastern with sub-rites), Location (cascading searchable dropdowns for Country → State → Province → Diocese — each dropdown should be searchable by typing, not just a strict cascade), Religious Order (searchable dropdown), Consecration (person search field for "consecrated by", location field, year range with two inputs), Priesthood Ordination (year range), Age/Birth (year range), Cardinalate (checkboxes for is cardinal, is elector, year range). Each option should show a count in parentheses of matching results — fetch these from the `filter_counts` field in the API response. Changing any filter should immediately update the grid (no Apply button). On mobile (<768px), the filter panel should render as a slide-up bottom sheet triggered by a floating filter button.

**What you should have when done:** A fully functional browse experience — you can filter, sort, search, and select bishops from a responsive portrait grid.

---

### Phase 6: Detail Pages

**Step 6.1 — Bishop detail page**

Implementation prompt:

> Build the bishop detail page at `src/app/bishops/[id]/page.tsx`. This is a Server Component that fetches data via the Prisma query helpers directly (no API call needed — it's server-side). Layout: Back link at top. Below, two columns — portrait (240×320) on the left, biographical info on the right. The name renders in Cormorant Garamond (full formatted name: "Most Rev. First M. Last, S.J."). The current title renders in a rank color: for cardinals, the ENTIRE title block renders in scarlet `#C41E3A` — both "Cardinal" and the see title (e.g., "Cardinal — Archbishop of Chicago" is all scarlet). For non-cardinal archbishops and bishops, the title ("Archbishop of Springfield" or "Bishop of Lincoln") renders in amaranth `#9F2B68`. Birth info, ordination dates, and rite render in Public Sans, text-secondary. Below the two-column header, three tabs: Timeline, Lineage, and Consecrations Given. The Timeline tab shows a vertical timeline with a thin line in border color and circular nodes colored by rank (scarlet for cardinal events, amaranth for episcopal events, burgundy for other events). Each event shows the date on the left (fixed 80px column) and description on the right. Events include: birth, priesthood ordination, each assignment (start and end), episcopal consecration (with linked principal consecrator and co-consecrators showing 24×24 circular portrait thumbnails), and cardinalate creation if applicable. Most recent at top. The Lineage tab shows the ascending chain of consecrators — this bishop's consecrator, then their consecrator, etc. — as a vertical chain of portrait thumbnails (48×64) with names, clickable to their detail pages. Query this recursively. The Consecrations Given tab shows a portrait grid of all bishops this person served as principal consecrator for. Include a "Select for Directory" button that adds/removes this bishop from the selection.

**Step 6.2 — Diocese detail page**

Implementation prompt:

> Build the diocese detail page at `src/app/dioceses/[id]/page.tsx`. Server Component. Show the diocese name as the page title in Cormorant Garamond SemiBold, with type (Metropolitan See / Suffragan Diocese), province, and date erected below in Public Sans. Current Leadership section: large portrait card for the ordinary, smaller cards for auxiliaries, arranged in a row. Each bishop's title renders in the appropriate rank color. Below, two side-by-side sections (or tabs): Succession on the left (chronological list of all bishops, each with 48×64 portrait thumbnail, name, years served, and how tenure ended — most recent first), and Suffragan Dioceses on the right (if metropolitan) listing each suffragan with its current bishop's portrait thumbnail and name, linked to the diocese detail page. Or Metropolitan (if suffragan) showing the metropolitan see with its archbishop's portrait.

**What you should have when done:** Fully functional detail pages for both bishops and dioceses with real relational data, timeline, lineage, and succession.

---

### Phase 7: Browse Hierarchy

**Implementation prompt:**

> Build the hierarchical browse experience at `src/app/browse/[...slug]/page.tsx`. The slug path determines the current level: no slug = list of rites, one segment = countries for that rite, two segments = provinces for that country, three segments = dioceses for that province. The main content area shows the items for the current level as a clean list — each item shows the name, and for dioceses, the current bishop's portrait thumbnail. The sidebar shows a collapsible tree of the full hierarchy with the current path expanded and highlighted. Clicking an item in the tree or the main list navigates deeper. At the diocese level, clicking navigates to the diocese detail page. Use URL-friendly slugs (e.g., "latin/united-states/province-of-baltimore"). Breadcrumbs should update to show the full path.

**What you should have when done:** A complete hierarchical browsing experience from rite down to individual diocese.

---

### Phase 8: Search

**Implementation prompt:**

> Build the SearchBar component with typeahead functionality. When the user types 2+ characters, debounce 300ms, then call `/api/search?q=...`. Show results in a dropdown below the search bar, grouped into two sections: "Bishops" (each showing 32×32 circular portrait thumbnail, formatted name, current title) and "Dioceses" (name, country). Clicking a bishop result navigates to `/bishops/[id]`. Clicking a diocese result navigates to `/dioceses/[id]`. Pressing Enter with text in the field navigates to `/bishops?search=[query]` to show the full filtered grid. The dropdown should close on outside click or Escape. Style the dropdown with the surface color background, border color border, and proper hover states. Use this SearchBar in both the top bar (compact) and the home page (large).

**What you should have when done:** Working typeahead search from any page in the app.

---

### Phase 9: Build a Directory (PDF Generator)

**Step 9.1 — Directory builder UI**

Implementation prompt:

> Build the directory builder page at `src/app/build-directory/page.tsx`. This is a multi-step client component. Step 1 (Review Selection): Show the currently selected bishops as a reorderable list (use drag handles). Each row shows a 48×64 portrait thumbnail, formatted name, current title and see, and an × button to remove. At the bottom, a search field to add more bishops (reuse the typeahead search, but clicking a result adds to selection instead of navigating). Show "Selected Bishops ([N])" as the section header. Step 2 (Configure Layout): Show options as visual toggle groups — Detail level (Minimal / Standard / Full with visual previews of each), Grid density (Large 3/row / Medium 4/row / Compact 6/row), Sort (Alphabetical / By see / By seniority / Manual), Cover page toggle with title and subtitle text inputs, Page size (US Letter / A4). Step 3 (Preview): Render a live preview of the PDF — show it as pages in the browser using the @react-pdf/renderer `PDFViewer` component. Step 4 (Export): "Download PDF" button using @react-pdf/renderer's `pdf()` function to generate and download. Show a step indicator at the top (1 Review → 2 Configure → 3 Preview → 4 Export) with Next/Back navigation buttons.

**Step 9.2 — PDF template**

Implementation prompt:

> Create the PDF document component at `src/components/directory/DirectoryPDFDocument.tsx` using @react-pdf/renderer. Register the Cormorant Garamond and Public Sans fonts — for @react-pdf/renderer you need the actual TTF font files (the `next/font` integration won't work in PDF generation). Download both Cormorant Garamond and Public Sans TTF files from Google Fonts and place them in `/public/fonts/`. Register both with `Font.register()`. The document should accept props for: bishops array (with portrait URLs), detail level, grid density, sort order, cover page config, and page size. If cover page is enabled, render a first page with the title centered in Cormorant Garamond 28pt and subtitle in Public Sans 16pt, with "hierarchy.directory" in small text at the bottom. Subsequent pages render bishops in a grid — for "medium" density, 4 columns × as many rows as fit per page. Each bishop cell shows: the portrait image (fetched from URL), name in Cormorant Garamond 11pt bold, and metadata fields based on detail level in Public Sans 9pt. All text black on white, no color accents (rank colors are screen-only). Page numbers at bottom right. Ensure the layout handles missing portraits gracefully (show initials on a light gray rectangle).

**What you should have when done:** A complete end-to-end flow: select bishops from anywhere in the app → configure a layout → preview a polished PDF → download it.

---

### Phase 10: Admin Interface — Auth & Layout

**Step 10.1 — Set up Supabase Auth**

Do this yourself:
1. In your Supabase dashboard, go to Authentication → Settings. Keep email/password enabled, disable all other providers (Google, GitHub, etc.).
2. Go to Authentication → Users and manually create your admin account with your email and a strong password. This is the only account that will exist — there is no sign-up flow.
3. Copy your Supabase project URL and anon key from Settings → API.
4. Add to your `.env`: `NEXT_PUBLIC_SUPABASE_URL="..."` and `NEXT_PUBLIC_SUPABASE_ANON_KEY="..."`.

**Step 10.2 — Auth helpers and admin layout**

Implementation prompt:

> Install `@supabase/supabase-js` and `@supabase/ssr`. Create a Supabase client helper at `src/lib/supabase.ts` with both a browser client (for client components) and a server client (for server components and API routes, using cookies). Create an auth helper at `src/lib/auth.ts` with a `requireAdmin` function that checks for a valid Supabase session and redirects to `/admin/login` if not authenticated. Build the admin login page at `src/app/admin/login/page.tsx` — a centered card with email and password inputs, a burgundy "Sign in" button, and "hierarchy.directory" in Cormorant Garamond above the card. On successful login, redirect to `/admin`. Build the admin layout at `src/app/admin/layout.tsx` that wraps all admin pages in an auth guard (redirect to login if no session). The layout has a left sidebar (200px) with navigation links: Dashboard, Bishops, Dioceses, Assignments, Consecrations, Import. The sidebar uses Public Sans, text-primary color, with the active link highlighted in burgundy. A top bar shows "Admin" as a badge and a "Sign out" button. Include a "View live site →" link that opens the public site in a new tab.

**Step 10.3 — Admin dashboard**

Implementation prompt:

> Build the admin dashboard at `src/app/admin/page.tsx`. Show summary stat cards across the top: Total Bishops (count from person table), Total Dioceses (count from see table), Portraits Uploaded (count of persons where portrait_url is not null), Missing Portraits (count where portrait_url is null). Style the cards with the surface background color and border. Below the stats, show a "Recent Activity" section — query the 20 most recently updated person and see records (by updatedAt), and display them in a simple list showing the entity name, what type it is, and the timestamp. This helps track data entry progress.

**What you should have when done:** A working admin login and dashboard at `/admin` that only you can access.

---

### Phase 11: Admin Interface — Data Management

**Step 11.1 — Reusable admin components**

Implementation prompt:

> Build the following reusable admin components: `DataTable` — a sortable, searchable table component that accepts columns config and data array, with built-in search input that filters all text columns, clickable column headers for sorting, and row click handler. `PersonPicker` — a searchable dropdown that queries `/api/search` and shows person results with portrait thumbnails, used for selecting consecrators and ordaining bishops. `SeePicker` — same pattern but for selecting sees/dioceses. `PortraitUploader` — a drag-and-drop image upload zone that shows a preview in 3:4 aspect ratio after selection, accepts JPEG and PNG, and calls the upload API endpoint. Shows the current portrait if one exists with "Replace" and "Remove" buttons. All components should use the admin styling (Public Sans, surface/border colors, burgundy accent for interactive elements).

**Step 11.2 — Bishop CRUD**

Implementation prompt:

> Build the bishop list page at `src/app/admin/bishops/page.tsx` using the DataTable component. Columns: portrait thumbnail (40×40), full name, current title, current see, status (Active/Retired/Deceased as a colored badge), has portrait (checkmark or ×). "Add New Bishop" button in the top right navigates to `/admin/bishops/new`. Clicking a row navigates to `/admin/bishops/[id]`. Build the bishop form page at `src/app/admin/bishops/[id]/page.tsx` (also used for `/admin/bishops/new`). The form is organized in sections as described in the design spec: Identity fields (first/middle/last name, suffix, religious order), Portrait (using PortraitUploader), Biographical (date pickers for birth/death, place of birth text input, country of birth dropdown, rite dropdown), Education & Formation (seminary text input with autocomplete from existing values in the database, education notes text input), Priesthood Ordination (date, location, ordaining bishop via PersonPicker, diocese of incardination via SeePicker), Episcopal Consecration (date, location, principal consecrator via PersonPicker, co-consecrators as a multi-select PersonPicker), Cardinalate (toggle to show/hide, with date, cardinal order dropdown, titular church text), External Links (text inputs for catholic-hierarchy ID, GCatholic ID, Wikipedia URL, diocesan bio URL), Source Citations (collapsible section — list of citation rows with source type dropdown, source detail text, accessed date, notes, plus "Add Citation" button). Below the main form, an Assignments section showing existing assignments as cards — each with see (SeePicker), role (dropdown with options: diocesan_bishop, coadjutor, auxiliary, apostolic_administrator, apostolic_nuncio, curial_prefect, curial_secretary), start date, end date, start reason, end reason. Each assignment card has Save and Delete buttons. An "Add Assignment" button adds a blank card. The main form has a "Save Bishop" button that saves person fields via `PUT /api/admin/bishops/[id]` (or `POST /api/admin/bishops` for new). A "Delete Bishop" button at the very bottom with a confirmation dialog. Build the corresponding admin API routes: `POST /api/admin/bishops` (create), `PUT /api/admin/bishops/[id]` (update), `DELETE /api/admin/bishops/[id]` (delete with confirmation), `POST /api/admin/assignments` (create), `PUT /api/admin/assignments/[id]` (update), `DELETE /api/admin/assignments/[id]` (delete), `POST /api/admin/consecrations` (create/update), `POST /api/admin/upload` (portrait upload to Supabase Storage), `POST /api/admin/citations` (create), `DELETE /api/admin/citations/[id]` (delete). All admin API routes must check for a valid Supabase session and return 401 if not authenticated.

**Step 11.3 — Diocese CRUD**

Implementation prompt:

> Build the diocese list page at `src/app/admin/dioceses/page.tsx` using DataTable. Columns: name, see type, country, state, province (metropolitan see name), cathedral name, has coordinates (checkmark or ×), date erected. "Add New Diocese" button (rarely needed — US dioceses are pre-seeded). Click to edit. Build the diocese form at `src/app/admin/dioceses/[id]/page.tsx` with fields: name (place name only, e.g., "Baltimore" — NOT the full "Archdiocese of Baltimore"), see type (dropdown), name prefix override (text input, nullable, defaults to "of" — set to "for the" for edge cases), a live preview that shows the computed full display name based on these three fields, rite (dropdown), country (dropdown), state/region (text), metropolitan see (SeePicker, nullable), is metropolitan (checkbox), date erected (date picker), date suppressed (nullable date picker). A Cathedral section with: cathedral name (text), cathedral address (text), a "Geocode" button that calls a geocoding API to auto-fill latitude/longitude from the address, and manual latitude/longitude number inputs for correction. Include a Name History section for tracking former names with date ranges — shown as an editable list of rows. Build the corresponding admin API routes: `POST /api/admin/dioceses`, `PUT /api/admin/dioceses/[id]`, `DELETE /api/admin/dioceses/[id]`.

**Step 11.4 — Assignments and Consecrations bulk views**

Implementation prompt:

> Build the assignments bulk view at `src/app/admin/assignments/page.tsx` — a DataTable showing all assignments with columns: bishop name (with portrait thumb), see name, role, start date, end date, is current (badge). Sortable and searchable. Clicking a row navigates to `/admin/bishops/[person_id]` to edit in context. Build the consecrations bulk view at `src/app/admin/consecrations/page.tsx` — a DataTable with columns: bishop consecrated (with portrait thumb), date, principal consecrator name, co-consecrator names. Clicking navigates to the relevant bishop edit page. These views are for data quality review — spotting missing end dates, orphaned records, incomplete consecration data.

**Step 11.5 — CSV Import tool**

Implementation prompt:

> Build the CSV import page at `src/app/admin/import/page.tsx`. Step 1: drag-and-drop or file-picker for a CSV file. Use papaparse to parse the CSV client-side. Step 2: select entity type (Bishop, Diocese, Assignment) from a dropdown. Step 3: column mapping — show the CSV column headers on the left and a dropdown of database fields on the right for each. Auto-map columns whose names match field names (case-insensitive). For Bishop imports, the fields are: first_name, middle_name, last_name, suffix, religious_order, date_of_birth, place_of_birth, date_of_death, rite (matched by name). For Diocese imports: name, see_type, country (matched by name), state_region, metropolitan_see (matched by name), is_metropolitan, date_erected. For Assignment imports: person (matched by last_name + first_name), see (matched by name), role, start_date, end_date, start_reason, end_reason. Step 4: preview the first 10 rows as they would be imported, with validation errors highlighted in red per cell (required fields missing, unrecognized foreign key references, date parse failures). Show a count of valid vs invalid rows. Step 5: "Import [N] valid rows" button. Call `POST /api/admin/import` with the mapped data. Show a progress indicator and final summary (created, skipped, errors with row numbers and reasons). Build the corresponding `POST /api/admin/import` route that validates all rows, runs the import in a database transaction, and returns the summary.

**What you should have when done:** A complete admin interface for managing all data — create, edit, and delete bishops and dioceses, manage assignments and consecrations, upload portraits, and bulk import from CSV.

---

### Phase 12: Polish & Refinement

**Implementation prompt:**

> Review the entire application for visual polish and consistency against the design spec. Specifically: ensure all portrait images use the 3:4 aspect ratio with 8px border-radius, 1px border in `#DDD8D0`, and the subtle shadow. Ensure the initials fallback for missing photos uses Cormorant Garamond SemiBold on `#E8E3DB` background. Ensure hover states on cards use translateY(-2px) with a deeper shadow and burgundy border. Ensure all typography matches the spec — Cormorant Garamond for display/names, Public Sans for everything else. Ensure the burgundy accent is used consistently for interactive elements (links, active states, primary buttons, selected states). Ensure rank colors are applied correctly: cardinals get their ENTIRE title block in scarlet `#C41E3A` (both "Cardinal" and the see title), while non-cardinal archbishops and bishops get their title in amaranth `#9F2B68`. On bishop cards, a thin left-border stripe in the rank color (scarlet or amaranth) should aid visual scanning. Add subtle page transition animations. Add loading states (skeleton cards in the grid, shimmer on detail pages). Add empty states (no results found, no bishops selected). Add proper error handling (API errors, 404 for unknown bishop/diocese IDs). Make sure the responsive behavior works correctly at all three breakpoints (desktop, tablet, mobile). Test the selection persistence across page navigation and browser refresh. Also review the admin interface for consistency — forms should have clear validation messages, save/delete confirmations, and success/error toast notifications.

---

### Phase 13: Data Population

This is the ongoing work after the app is built. Use the admin interface you built in Phases 10–11 for all data entry.

**For your existing photo database:** Upload portraits through the admin's PortraitUploader on each bishop's edit page, or build a batch upload script if you have hundreds of images to process at once.

**For structured data:** The Annuario Pontificio, Vatican press bulletins, and diocesan websites are your primary sources. Catholic-hierarchy.org can be used as a cross-reference for dates and assignments, but build your dataset from primary sources. The CSV import tool is your best friend here — structure your initial data as spreadsheets and import in bulk.

**Suggested data entry order:**
1. All active US Latin-rite diocesan bishops and their current sees (~180 entries). Sees are already seeded — you're just creating person records and assignments.
2. All active US auxiliaries (~90 entries)
3. Retired US bishops still living (~100 entries)
4. Episcopal consecration data for all of the above (linking consecrators)
5. County-to-diocese FIPS mapping (compile from Official Catholic Directory — ~3,200 rows, but can be done in batches by state)
6. Historical succession for major sees (Baltimore, New York, Chicago, Los Angeles, etc.)
7. Eastern Catholic eparchs
8. Backfill research fields (seminary, education, country of birth) as time permits
9. Expand internationally

---

### Phase 14: Future Features (Not in V1)

These are noted for planning purposes but should NOT be built in the initial release. The data model already supports all of them — they're visualization and UI work, not schema changes.

**Map view (data-ready now, build when county mapping is complete):**
- Interactive US map showing diocese boundaries as colored polygons (merged from county FIPS data via Census Bureau GeoJSON + Turf.js)
- Color-coded by province, vacancy status, bishop age, or date erected
- Click a diocese to see its bishop(s) and navigate to the diocese detail page
- Cathedral locations as point markers
- Tech: `react-map-gl` (Mapbox GL JS) or `react-leaflet`, `@turf/union` for polygon merging, simplified US counties GeoJSON (~5-10MB, lazy-loaded)
- Animated timeline mode: show dioceses appearing on the map as they were erected over the centuries

**Data visualization & research tools:**
- Consecration network graph — interactive force-directed graph (D3.js) showing who consecrated whom, with hub consecrators visually prominent
- Seminary pipeline analysis — which seminaries produce the most bishops, visualized as a bar chart or Sankey diagram
- Demographic trends — average age at appointment over time, bishops by religious order, nationality of origin
- Lineage tree visualization — expandable tree diagram of apostolic succession chains
- Geographic flow — where bishops are born vs. where they serve, shown as origin-destination arcs on a map

**Other future features:**
- User accounts and saved collections — save a set of bishops and return to it later, share via link
- Multi-admin support — role-based access for collaborators
- Coat of arms — episcopal and diocesan heraldry alongside portraits
- "Today in history" — ordination anniversaries, appointment dates
- Papal conclave tracker — filtered view of cardinal electors
- API access — public API for other Catholic media/tools to consume
- Contribution pipeline — allow users to submit corrections or photos with editorial review
- Multilingual support — especially Spanish and Italian

