---
name: PTIT Academic Portal
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#5c403b'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#906f6a'
  outline-variant: '#e5beb7'
  surface-tint: '#bb190e'
  primary: '#790000'
  on-primary: '#ffffff'
  primary-container: '#a50000'
  on-primary-container: '#ffaea1'
  inverse-primary: '#ffb4a8'
  secondary: '#005ac1'
  on-secondary: '#ffffff'
  secondary-container: '#4d8efe'
  on-secondary-container: '#00285c'
  tertiary: '#0019b6'
  on-tertiary: '#ffffff'
  tertiary-container: '#0025f6'
  on-tertiary-container: '#b8beff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad4'
  primary-fixed-dim: '#ffb4a8'
  on-primary-fixed: '#410000'
  on-primary-fixed-variant: '#930000'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a41'
  on-secondary-fixed-variant: '#004494'
  tertiary-fixed: '#dfe0ff'
  tertiary-fixed-dim: '#bdc2ff'
  on-tertiary-fixed: '#000965'
  on-tertiary-fixed-variant: '#0020dd'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
  ptit-red-dark: '#7A0000'
  ptit-red-light: '#FFEBEE'
  success-green: '#2E7D32'
  warning-yellow: '#FBC02D'
  surface-gray: '#E9ECEF'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
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
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.5px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  margin-mobile: 16px
  margin-desktop: 32px
  gutter: 16px
  container-max-width: 1200px
---

## Brand & Style

The design system for the PTIT Student and Grade Management System is rooted in a **Corporate / Modern** aesthetic, emphasizing institutional prestige, reliability, and mobile-first efficiency. The brand personality is professional and authoritative yet accessible, ensuring students and faculty feel a sense of trust when managing sensitive academic data. 

The visual language balances the high-energy PTIT Red with a calm, expansive use of white space and soft neutrals. This approach prevents the bold primary color from overwhelming the user, focusing its power on critical actions and wayfinding. The interface utilizes clean lines, subtle depth, and a structured layout to facilitate high-density information management (like grade tables and course schedules) without visual clutter.

## Colors

The color palette is dominated by **PTIT Red (#A50000)**, used strategically for the primary brand presence, main navigation headers, and primary call-to-action buttons. 

- **Primary:** Used for the most important interactive elements and institutional branding.
- **Secondary:** A professional blue used for secondary actions, information links, and progress indicators to provide a harmonious contrast to the red.
- **Neutral/Background:** A very light gray (`#F8F9FA`) is the default canvas color to reduce eye strain, while pure white is reserved for content cards and surface containers.
- **Semantic Colors:** Traditional red/yellow/green indicators are used specifically for grade status (fail, pass, excellent) and system alerts.

## Typography

This design system uses a dual-font strategy to optimize for both institutional impact and high-density readability. 

**Hanken Grotesk** is used for headlines and display text. Its sharp, modern geometry reflects the technological focus of the institute. **Inter** is the workhorse for all body text, data tables, and input labels, chosen for its exceptional legibility on small mobile screens and its neutral, systematic feel.

For mobile layouts, font sizes for headings are automatically scaled down to ensure that academic titles and long names do not wrap awkwardly.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a base-8 rhythm. On mobile devices, the system uses a single-column layout with 16px side margins to maximize the readability of grade lists and schedules. On tablet and desktop, the system transitions to a 12-column grid.

Content is organized into logical "Surface Containers" (cards). Spacing between cards should be consistent at 16px or 24px to maintain a clear visual hierarchy. For data-heavy views like transcript tables, "Compact" spacing (8px padding) can be toggled to allow more data to be visible at once.

## Elevation & Depth

To maintain a clean and professional look, the design system utilizes **Tonal Layers** combined with **Low-Contrast Outlines**. 

- **Level 0 (Background):** Soft neutral gray (`#F8F9FA`).
- **Level 1 (Cards/Surfaces):** Pure white with a 1px border (`#E9ECEF`). No shadows are used at this level to keep the interface flat and modern.
- **Level 2 (Interactive/Floating):** Used for dropdowns, modals, and floating action buttons. These use a very soft, highly diffused ambient shadow (`rgba(0, 0, 0, 0.05)` with a 12px blur) to suggest elevation without appearing heavy.

This approach ensures the UI feels light and "fast," which is critical for mobile performance.

## Shapes

The shape language uses **Rounded** (0.5rem / 8px) corners for standard UI components. This softens the "industrial" feel of a management system, making the portal feel more modern and user-friendly.

- **Standard Buttons & Inputs:** 8px radius.
- **Cards & Large Containers:** 12px or 16px radius.
- **Status Chips:** Full pill-shape (circular ends) to distinguish them from interactive buttons.

## Components

### Buttons
- **Primary:** Solid PTIT Red with white text. High-emphasis for "Login," "Submit Grade," or "Register."
- **Secondary:** Outlined red or light gray background with red text. Used for "Cancel" or "View Details."

### Cards
Cards are the primary way to display student profiles or individual course grades. They should feature a white background, an 8px corner radius, and a subtle 1px border.

### Data Lists
For mobile views, tables should transform into expandable list items. Each item shows the subject name and final grade prominently, with secondary details (credits, instructor) available on tap.

### Inputs & Selects
Form fields use a light gray background (`#F8F9FA`) with a 1px border that turns PTIT Red on focus. Labels must always be visible (above the field) to ensure accessibility.

### Grade Chips
Status indicators for grades (A, B, C, D, F) should use semantic colors. For example, "A" grades are paired with a light green background and dark green text, while "F" grades use PTIT Red light background and dark red text.