# FOUNDERS HUT — VISUAL IDENTITY REDESIGN SPRINT REPORT

> **Quietly premium. Human. Modern. Confident. Distinctive.**

---

## 1. VISUAL SYSTEM OVERVIEW

The Founders Hut visual system has been transformed from a dense, monochrome enterprise/SaaS dashboard into a calm, elevated, and human-centric private network. 

Key design principles enforced:
- **De-carding**: Heavy borders around every piece of information have been eliminated. Hierarchy is now established using typography, subtle background surface contrast, whitespace, dividers, and semantic color pills.
- **Atmospheric Depth**: Replaced flat gray cards with a restrained 4-tier surface elevation model (`var(--bg-main)`, `var(--bg-surface)`, `var(--bg-surface-elevated)`, `var(--bg-surface-hover)`).
- **Subtle Tinted Surfaces**: Introduced 7% opacity tinted surfaces for atmospheric depth without noise.

---

## 2. COLOR SYSTEM

### Base Palette
```css
--bg-primary: #090B0F;
--bg-secondary: #0F1318;
--surface: #141920;
--surface-elevated: #1A2028;
--surface-hover: #202733;

--text-primary: #F5F7FA;
--text-secondary: #A8B0BE;
--text-muted: #707988;

--border-subtle: rgba(255, 255, 255, 0.07);
--border-visible: rgba(255, 255, 255, 0.12);
```

### Semantic Accent Palette
- **Founders Hut Gold (`#D8B45F`)**: Primary CTAs, key brand moments, active navigation indicators, and high-value actions.
- **Trust / Emerald (`#27C993`)**: Verified badges, accepted introductions, active connections, and trust confirmation moments.
- **Discovery / Blue (`#5B8DEF`)**: Discover view, search, and matching state accents.
- **Communities / Purple (`#9B7AEA`)**: Community circles, expertise tags, and knowledge discussions.
- **Attention / Coral (`#E87968`)**: Urgent request pills, destructive modal actions, and critical status states.

### Tinted Surfaces
```css
--gold-tint: rgba(216, 180, 95, 0.07);
--green-tint: rgba(39, 201, 147, 0.07);
--blue-tint: rgba(91, 141, 239, 0.07);
--purple-tint: rgba(155, 122, 234, 0.07);
--coral-tint: rgba(232, 121, 104, 0.07);
```

---

## 3. TYPOGRAPHY & SPACING

### Typographic Scale
- **Display**: 2.2rem (`35.2px`) / 700 / letter-spacing `-0.02em`
- **Page Title**: 1.6rem (`25.6px`) / 700
- **Section Title**: 1.2rem (`19.2px`) / 700
- **Subsection / H3**: 1.05rem (`16.8px`) / 600
- **Body**: 0.92rem (`14.7px`) / 400–500
- **Secondary**: 0.84rem (`13.4px`) / 400
- **Micro**: 0.75rem (`12px`) / 600

*Rule Enforced*: Body text never shrinks below `0.85rem` to cram information. Uppercase styling is restricted to small category/status tags.

### Spacing Scale
Systematized across standard values: `4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`, `40px`, `48px`, `64px`.

---

## 4. COMPONENT SYSTEM

The UI components were updated to follow a unified design system:
- **Button**: Hover elevation (+1-2px shadow), 150ms ease transition, explicit 44px minimum touch target on primary mobile actions.
- **Card**: Minimal borders; default styling relies on elevation contrast.
- **Avatar**: Prominent avatars (`56px` to `64px`) for profiles and member cards, with initials fallback for users without photos.
- **Badge / Pill**: Round pills with 7% tinted background matching semantic color domains.
- **Toast**: Floating 150ms slide/fade toast notifications for action confirmations ("Introduction request sent", "Request published", etc.).

---

## 5. SCREEN-BY-SCREEN REDESIGN

### 1. Home
- **Hero Unit**: Personal greeting ("Good morning, Vikramaditya. What are you working through right now?") with an atmospheric blue/purple backdrop.
- **Curated Modules**:
  - `Needs Your Attention`: Only rendered when active pending requests exist.
  - `Someone You Should Know`: Maximum 1 prominent member card.
  - `A Request You Can Help With`: Maximum 1 request card.
  - `Quiet Empty State`: Single clean message when no actions remain ("Your network is taking shape...").

### 2. Discover
- Header: `# Discover` — *Find the right person.*
- Clean single-field search bar with suggested query chips (`"Consumer D2C & distribution"`, `"AI & LLM engineering"`, etc.).
- Faceted filters rendered as subtle secondary controls.

### 3. Member Profile & Profile Modal
- Human profile hierarchy: Avatar (`64px`), Name, Title/Company, Location, `✓ Verified` badge.
- Explicit sections for `CAN HELP WITH`, `LOOKING FOR`, and mutual pathway context (`✦ Ananya knows you both`).

### 4. Requests
- Header: `# Requests` — *Business problems worth solving.*
- Primary CTA: `+ Ask the network`
- Request cards formatted around the problem statement, author identity, and single `Offer help →` action.
- Urgent requests feature subtle coral (`#E87968`) status tags.

### 5. Introductions & Connection Visual Moment
- Human language pathway: `Vikramaditya ── Ananya ── Marcus`
- "Ananya knows you both" -> "Ask Ananya to introduce you".
- Preview before sending ("Ananya will see: identity, target, reason, shared information").
- Visual connection moment with emerald check (`✓ Connected`).

### 6. Network
- Simple tabbed navigation: `Connections`, `Pending introductions`, `History`.
- Human context cards ("Ananya introduced you to Vikram").

### 7. Messages
- Header: `# Messages` — *Private conversations with verified members.*
- Intro context banner styled with tinted background surface (`Introduced by Ananya Sharma`).

### 8. Communities
- Restrained purple identity.
- Editorial presentation without vanity metrics or fake member counts.
- Quiet empty state ("Nothing here yet. This circle is still taking shape.").

### 9. Investors
- Selective investor profile cards highlighting Stage, Cheque Range, Sector Focus, and introduction pathways (`Ask [Name] for an introduction`).

### 10. Sidebar & Mobile Navigation
- Sidebar grouped into clear sections (`PRIMARY`, `WORK`, `EXPLORE`, `USER`). Active item indicated by a subtle gold left border accent (`3px`).
- Mobile layout features a fixed 5-item bottom bar (`Home`, `Discover`, `Network`, `Messages`, `Profile`) with 44px+ touch targets.

---

## 6. DELIBERATELY REMOVED & PRESERVED

### What Was Removed:
- Heavy cards-in-cards borders on every element.
- Engineering/PM headers ("HIGH-SIGNAL ASKS", "VERIFICATION AUDIT PILLARS", etc.).
- Generic SaaS icons and crowded metadata columns.

### What Was NOT Changed:
- Backend architecture, databases, Prisma models.
- Authentication, verification logic, intro logic, and matching rules.
- Test assertions (all 45/45 vitest tests remain green).

---

## 7. VERIFICATION & QUALITY CHECKS

1. **Automated Tests**:
   ```bash
   npx vitest run
   # Result: 45 passed (45) in 1.51s
   ```

2. **Production Build**:
   ```bash
   npm run build
   # Result: Built in 387ms cleanly
   ```

3. **Accessibility**:
   - Keyboard focus rings (`:focus-visible` with `var(--accent-gold)` glow).
   - Touch targets 44px+ on mobile controls.
   - High text contrast (`#F5F7FA` on `#090B0F`).
