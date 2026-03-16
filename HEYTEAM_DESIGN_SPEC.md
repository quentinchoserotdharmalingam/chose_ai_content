# HeyTeam Design System Specification

> Reference file for reproducing the HeyTeam admin UI visual style.
> Based on the "Formations" (Trainings) listing page.

---

## Screenshot Reference

The reference page is a **resource listing page** with:
- Left sidebar navigation (dark items on white background)
- Main content area with a header (title + count + search + filters + CTA button)
- Data table with sortable columns, pagination, and row actions

---

## Typography

- **Font Family**: `'Poppins', sans-serif`
- **Legacy Font**: `'Lato', sans-serif` (older components)

| Token | Size | Weight | Line Height | Letter Spacing |
|-------|------|--------|-------------|----------------|
| Heading XL (h1) | 28px | 500 | 1.5 | -0.02em |
| Heading L (h2) | 24px | 500 | 1.5 | -0.02em |
| Heading M (h3) | 20px | 500 | 1.5 | -0.02em |
| Heading S (h4) | 16px | 500 | 1.5 | -0.02em |
| Body | 13px | 500 | 20px | -0.01em |
| Body Semi | 13px | 600 | 20px | -0.01em |
| Caption | 12px | 400 | 1.5 | -0.01em |

---

## Color Palette

### Core Colors

| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#FF6058` | CTA buttons, active states, links, brand accent |
| Primary Dark | `#F64A49` | Hover on primary |
| Text Primary | `#272727` | Main text, headings, icons |
| Text Secondary | `#A4A4A4` | Secondary text, placeholder, inactive icons |
| Text Inactive | `#DDDDDD` | Disabled/inactive text |

### Backgrounds & Fills

| Token | Hex | Usage |
|-------|-----|-------|
| Fill Primary | `#FFFFFF` | Main background, cards, table rows |
| Fill Secondary | `#F7F7F7` | Subtle backgrounds, sidebar hover |
| Fill Container | `#FBFBFB` | Container backgrounds |
| Fill Active | `#FF6058` | Active/selected backgrounds |
| Fill Active Warm | `#FCEDEC` | Light coral background for active items |
| Fill Overlay | `rgba(47, 49, 52, 0.4)` | Modal overlays |

### Borders

| Token | Hex | Usage |
|-------|-----|-------|
| Border Primary | `#F5F4F4` | Default borders, table dividers |
| Border Secondary | `#DDDDDD` | Stronger borders |
| Border Active | `#FF6058` | Active/focused borders |

### Semantic Colors

| Token | Hex | Warm Variant |
|-------|-----|-------------|
| Success | `#53B483` | `#EFFDF6` |
| Error | `#F34141` | `#FEF2F2` |
| Warning | `#E9A23B` | `#FEFAF5` |
| Info | `#2563EB` | `#F4F7FE` |

---

## Spacing & Layout

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| Radius Small | `4px` | Small elements, tags |
| Radius Default | `8px` | Buttons, inputs, cards |
| Radius Block | `12px` | Large cards, modals |
| Radius Full | `100px` | Pills, avatars |

### Shadows

```css
--shadow-1: 0px 1px 3px 0px rgba(47, 43, 67, 0.10), 0px -1px 0px 0px rgba(47, 43, 67, 0.10) inset;
--shadow-2: 0px -1px 0px 0px rgba(47, 43, 67, 0.10) inset, 0px 4px 8px 0px rgba(47, 43, 67, 0.10);
--shadow-3: 0px 6px 12px 0px rgba(47, 43, 67, 0.10);
--shadow-4: 0px 8px 24px 0px rgba(47, 43, 67, 0.10);
--shadow-5: 0px 12px 36px 0px rgba(47, 43, 67, 0.12);
--focus-ring: 0px 0px 0px 3px rgba(222, 222, 222, 0.48);
```

### Transitions

```css
--transition-s: 0.2s ease-in-out;
--transition-default: 0.3s ease-in-out;
```

### Breakpoints

| Token | Value |
|-------|-------|
| Desktop Large | 1920px |
| Desktop Medium | 1440px |
| Desktop Small | 1366px |
| Tablet Large | 1024px |
| Tablet | 780px |
| Phone | 576px |
| Phone Small | 400px |

---

## Component Patterns

### Page Layout

```
┌──────────────────────────────────────────────────┐
│ ← Retour au menu                                 │
├────────────┬─────────────────────────────────────┤
│            │                                     │
│  Sidebar   │  Page Title        [Search] [F] [+] │
│  Nav       │  XX résultats                       │
│            │─────────────────────────────────────│
│  - Item 1  │  Table Header (sortable)            │
│  - Item 2  │  ─────────────────────────────────  │
│  - Item 3  │  Row 1                          ... │
│  - Item 4  │  Row 2                          ... │
│  ...       │  ...                                │
│            │  ─────────────────────────────────  │
│            │           < 1  2  3 >               │
│ [User] ◇   │                                     │
└────────────┴─────────────────────────────────────┘
```

### Sidebar Navigation

- **Width**: ~200px
- **Background**: White (`#FFFFFF`)
- **Items**: Text with icon, font-size 13-14px, color `#272727`
- **Active item**: Background `#FF6058` (coral), text white, border-radius 8px
- **Hover**: Subtle light background
- **Bottom**: User avatar + name + dropdown chevron

### Resource Listing Header

- **Title**: Heading H2 (24px, weight 500), color `#272727`
- **Count badge**: "XX résultats" in caption style below title
- **Search bar**: Right-aligned, border `#F5F4F4`, radius 8px, placeholder text `#A4A4A4`
- **Filter button**: Icon button with funnel icon
- **Add button ("Ajouter")**: Background `#FF6058`, text white, border-radius 100px (pill), padding ~12px 24px, font-weight 600

### Data Table (HtTableExtended)

- **Header row**: Background `#FFFFFF`, text `#A4A4A4` (secondary), font-size 12px, uppercase or regular weight
- **Sort indicator**: Small arrow icon next to sortable column names
- **Body rows**: Background white, border-bottom `1px solid #F5F4F4`
- **Row hover**: Subtle background change
- **Cell text**: `#272727`, font-size 13px
- **Cell padding**: ~12-16px vertical, ~16-20px horizontal

#### Table Columns (Formations page)

| Column | Style |
|--------|-------|
| Nom | Text primary, sortable (arrow icon) |
| Participants | Avatar circles (colored initials) |
| Parcours | Text with optional icon prefix (microphone icon for "Programme de sen...") |
| Filtres | Tag/badge style: "Tous les filtres" or "Tech" in pill with light background |
| Type | Text: "Lien" or "Fichier" |
| Bloqué | Empty or indicator |
| Actions | "..." menu icon (three dots), right-aligned |

### Tags / Badges (Filters column)

- **Background**: Light grey `#F7F7F7` or specific category color
- **Text**: 12px, color `#272727`
- **Border-radius**: 100px (pill)
- **Padding**: ~4px 12px

### Pagination

- **Style**: Centered, numbered pages with prev/next arrows
- **Active page**: Background `#FF6058`, text white, border-radius 8px
- **Inactive pages**: Text `#272727`, no background
- **Arrows**: `<` and `>` in circles or subtle buttons

### Action Menu ("...")

- **Trigger**: Three-dot icon, text `#A4A4A4`
- **Dropdown**: White background, shadow-3, border-radius 8px
- **Items**: Text 13px, padding ~8-12px, hover background `#F7F7F7`

---

## Icons

- **Library**: FontAwesome Pro (light, regular, solid, duotone variants)
- **Default size**: 16px (`--icon-default`)
- **Sizes**: 8px / 16px / 24px / 30px

---

## CSS Custom Properties (copy-paste ready)

```css
:root {
    /* Typography */
    --poppins: 'Poppins', sans-serif;
    --heading-xlarge: 28px;
    --heading-large: 24px;
    --heading-medium: 20px;
    --heading-small: 16px;
    --text-medium: 13px;
    --text-small: 12px;
    --line-height-auto: 1.5;
    --line-height-medium: 20px;
    --letter-spacing-xsmall: -0.02em;
    --letter-spacing-small: -0.01em;

    /* Transitions */
    --transition-s: 0.2s ease-in-out;
    --transition-default: 0.3s ease-in-out;

    /* Border Radius */
    --radius-1: 4px;
    --radius-default: 8px;
    --radius-2: 12px;
    --radius-full: 100px;
    --radius-block: 12px;

    /* Shadows */
    --shadow-1: 0px 1px 3px 0px rgba(47, 43, 67, 0.10), 0px -1px 0px 0px rgba(47, 43, 67, 0.10) inset;
    --shadow-2: 0px -1px 0px 0px rgba(47, 43, 67, 0.10) inset, 0px 4px 8px 0px rgba(47, 43, 67, 0.10);
    --shadow-3: 0px 6px 12px 0px rgba(47, 43, 67, 0.10);
    --shadow-4: 0px 8px 24px 0px rgba(47, 43, 67, 0.10);
    --shadow-5: 0px 12px 36px 0px rgba(47, 43, 67, 0.12);
    --focus-ring: 0px 0px 0px 3px rgba(222, 222, 222, 0.48);

    /* Text Colors */
    --text-primary: #272727;
    --text-secondary: #A4A4A4;
    --text-active: #FF6058;
    --text-inactive: #DDDDDD;
    --text-disabled: #F5F4F4;
    --text-link: #FF6058;
    --text-success: #53B483;
    --text-error: #F34141;
    --text-warning: #E9A23B;
    --text-info: #2563EB;
    --text-inversed-primary: #FFFFFF;

    /* Icon Colors */
    --icon-primary: #272727;
    --icon-secondary: #A4A4A4;
    --icon-active: #FF6058;

    /* Border Colors */
    --border-primary: #F5F4F4;
    --border-secondary: #DDDDDD;
    --border-active: #FF6058;
    --border-success: #2F9461;
    --border-error: #F7A1A1;
    --border-warning: #C8811A;
    --border-info: #1F54C8;

    /* Fill Colors */
    --fill-primary: #FFFFFF;
    --fill-secondary: #F7F7F7;
    --fill-active: #FF6058;
    --fill-active-warm: #FCEDEC;
    --fill-inactive: #F7F7F7;
    --fill-disabled: #FBFBFB;
    --fill-success: #53B483;
    --fill-success-warm: #EFFDF6;
    --fill-error: #F34141;
    --fill-error-warm: #FEF2F2;
    --fill-warning: #E9A23B;
    --fill-warning-warm: #FEFAF5;
    --fill-info: #2563EB;
    --fill-info-warm: #F4F7FE;
    --fill-container: #FBFBFB;
    --fill-overlay: #2F313466;
}
```

---

## Component Hierarchy (Vue.js)

```
Resources Layout (sidebar + content)
└── ResourceListing
    ├── ResourceBarFilters (header: title, search, filters, CTA)
    ├── HtTableExtended (sortable table with checkboxes)
    │   ├── Thead (sort icons, resizable columns)
    │   └── Tbody (rows with loading skeletons)
    ├── HtPagination (page navigation)
    └── Modalable (edit/create modals)
```

---

## Key Visual Characteristics

1. **Clean & minimal**: Lots of white space, subtle borders (`#F5F4F4`), no heavy shadows
2. **Coral accent**: `#FF6058` is the only strong color — used sparingly for CTAs, active nav, links
3. **Soft UI**: Rounded corners (8-12px), light shadows, smooth transitions (0.3s ease-in-out)
4. **Table-centric**: Data is presented in clean tables with sortable headers, subtle row dividers
5. **Pill buttons**: Primary CTA uses full border-radius (100px) for pill shape
6. **Grey scale for hierarchy**: `#272727` → `#A4A4A4` → `#DDDDDD` → `#F5F4F4` → `#FFFFFF`
