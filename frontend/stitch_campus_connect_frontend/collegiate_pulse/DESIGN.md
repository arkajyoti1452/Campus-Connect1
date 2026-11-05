---
name: Collegiate Pulse
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#464555'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#9d4300'
  on-secondary: '#ffffff'
  secondary-container: '#fd761a'
  on-secondary-container: '#5c2400'
  tertiary: '#41485e'
  on-tertiary: '#ffffff'
  tertiary-container: '#586076'
  on-tertiary-container: '#d4dbf5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#ffdbca'
  secondary-fixed-dim: '#ffb690'
  on-secondary-fixed: '#341100'
  on-secondary-fixed-variant: '#783200'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 56px
    fontWeight: '800'
    lineHeight: 64px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system blends collegiate authority with the vibrant social energy of campus life. Built for students, faculty organizers, and student union administrators, the aesthetic balances high-trust institutional reliability with dynamic, event-driven momentum.

The visual style relies on **Modern Editorial Surface Layering**:
- Structured, high-clarity content hierarchies that prioritize discoverability and immediate scheduling context.
- High-contrast typography paired with luminous accent pings to communicate deadlines, venue shifts, and live capacity counters.
- Crisp, card-based modularity that prevents visual clutter across dense event feeds, ticket check-in workflows, and administrative dashboards.
- A balanced tone: mature enough for official university administration, yet fresh and kinetic enough to engage student communities.

## Colors

The palette establishes visual discipline through deep structural foundations, electric focus accents, and soft slate reading canvases:

- **Primary (`#4F46E5` - Academic Indigo):** Anchors primary calls-to-action, active navigational states, confirmed registrations, and verified student credentials. Paired with a lighter hover tier (`#6366F1`).
- **Secondary (`#F97316` - Event Amber/Orange):** Reserved strictly for high-urgency notifications, "Selling Out" badges, live countdown tickers, bookmark triggers, and active check-in moments.
- **Tertiary (`#0F172A` - Collegiate Navy):** Grounding neutral-dark applied to structural headers, primary text, dark canvas moments (e.g., student ID barcodes, night orientation banners), and authoritative badges.
- **Neutral Canvas (`#F8FAFC` - Clean Slate):** Canvas background foundation, paired with pure white (`#FFFFFF`) card surfaces and subtle borders (`#E2E8F0`) to ensure crisp separation without visual fatigue.
- **Semantic Accents:** Emerald (`#10B981`) for confirmed RSVPs/open capacity; Rose (`#F43F5E`) for cancelled sessions or conflicts.

## Typography

The type scale combines **Plus Jakarta Sans** for expressive, forward-leaning headings with **Inter** for dense scheduling data, calendar listings, and structural body copy.

- **Headings & Display:** Plus Jakarta Sans features geometric precision with soft humanist details, delivering energetic event branding while maintaining institutional authority. Tight letter spacing (`-0.015em` to `-0.03em`) maintains impact at large sizes.
- **Body & Data:** Inter supplies neutral, high-legibility clarity across timestamps, venue addresses, speaker bios, and tabular attendee lists.
- **Labels & Micro-copy:** `label-caps` is styled uppercase with intentional tracking (`0.08em`) exclusively for department flags, category tags, and date ribbons.

## Layout & Spacing

The layout utilizes a structured 12-column fluid grid system on desktop, an 8-column layout on tablet, and a 4-column layout on mobile devices.

- **Breakpoints:**
  - **Desktop (1200px+):** 12 columns, `margin: 2rem` (capped at `1280px` max-width content container), `gutter: 1.5rem`.
  - **Tablet (768px - 1199px):** 8 columns, `margin: 1.5rem`, `gutter: 1.25rem`.
  - **Mobile (0px - 767px):** 4 columns, `margin-mobile: 1rem`, `gutter-mobile: 1rem`. Reflows side-by-side feed cards into single-column vertical stacks. Sticky registration bottom sheet activates automatically.
- **Spatial Rhythm:** Built upon an 8-point base grid (`space-xs` = 4px, `space-sm` = 8px, `space-md` = 16px, `space-lg` = 24px, `space-xl` = 40px). Use `space-md` for standard card padding and `space-sm` for inline metadata badge clusters.

## Elevation & Depth

Depth is established via **Tonal Stacking** augmented by targeted **Ambient Shadows** tinted with Collegiate Navy:

- **Level 0 (Base Canvas):** `#F8FAFC` flat surface.
- **Level 1 (Resting Cards, Filter Bars):** `#FFFFFF` surface with a delicate perimeter stroke (`1px solid #E2E8F0`) and an ambient tinted drop shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.03)`.
- **Level 2 (Hovered Cards, Dropdown Menus):** Surface lifts with `0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)` and subtle border highlight (`#CBD5E1`).
- **Level 3 (Modals, Slide-over RSVPs, Quick-View Drawers):** `0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.06)`, framed against a backdrop blur overlay (`rgba(15, 23, 42, 0.45)` with `backdrop-filter: blur(4px)`).
- **Interactive Focus:** Keyboard focus rings use an outer ring of `3px solid rgba(99, 102, 241, 0.35)` with a `1px` pure white inner gap.

## Shapes

The design system embraces a **Rounded (Level 2)** shape standard:

- **Default Elements (`0.5rem` / 8px):** Applied to inputs, buttons, status chips, dropdown lists, and segmented filters.
- **Compound Containers (`1rem` / 16px - `rounded-lg`):** Event preview cards, registration summary cards, date-stamp badges, and organizer profiles.
- **Overlays & Hero Banners (`1.5rem` / 24px - `rounded-xl`):** Modal dialogs, student ID passes, and featured campus showcase modules.
- **Full Pill (`9999px`):** Used exclusively for interactive filtering chips, notification count pings, and category tags.

## Components

### Buttons
- **Primary:** Filled `#4F46E5` background, `#FFFFFF` text, `border-radius: 0.5rem`, `font-weight: 600`. Hover shifts to `#4338CA`. Active state translates `1px` downward.
- **Secondary / Accent:** Filled `#F97316` background with white text, strictly reserved for immediate commitments ("RSVP Now", "Claim Ticket").
- **Outline / Quiet:** Transparent background, `1px solid #E2E8F0`, `#0F172A` text. Hover adopts `#F1F5F9`.

### Event Cards
- Built on Level 1 elevation with `1rem` corner rounding.
- Features a two-part anatomy:
  1. **Visual Header:** 16:9 imagery topped with a floating high-contrast Date Badge (Navy block with stark white text) in the top-left, and a Category/Urgency Chip in the top-right.
  2. **Content Core:** Title (`headline-sm`), metadata row (calendar icon + time, location icon + campus hall), capacity progress bar, and organizer micro-avatar.

### Chips & Badges
- **Status Chips:** Low-saturation tinted backgrounds with high-contrast foreground text:
  - *Selling Out / Urgent:* Background `rgba(249, 115, 22, 0.12)`, text `#C2410C`.
  - *Academic / Official:* Background `rgba(79, 70, 229, 0.1)`, text `#4338CA`.
  - *Open RSVP:* Background `rgba(16, 185, 129, 0.12)`, text `#047857`.
- **Filter Chips:** Pill-shaped, `1px solid #E2E8F0`, `#0F172A` text. Selected state inverts to `#0F172A` background with white text.

### Inputs & Form Controls
- Inputs use `#FFFFFF` background, `1px solid #CBD5E1` border, `0.5rem` radius, and `space-md` horizontal padding.
- Focused state applies an indigo border (`#4F46E5`) with an ambient outer glow ring.
- Checkboxes and radio buttons utilize custom `#4F46E5` fill when checked, with crisp white vector checkmarks and standard `4px` corner rounding on checkboxes.

### Lists & Timetables
- Agenda listings feature an anchored left timeline border (`2px solid #E2E8F0`) with dynamic colored nodal points (`#4F46E5` for current/upcoming, `#CBD5E1` for completed). Rows highlight with `#F8FAFC` on hover.

### Specialized Component: Ticket & Campus Pass
- A distinct, cut-out notch card metaphor (`rounded-lg`) containing a crisp QR code, verified student badge, live seat assignment, and university crest watermark for frictionless campus entry.
