---
name: checklist-design
description: Seven-Principle Premium Site Checklist & official Checklist Design criteria to build pixel-perfect, high-converting, premium web and mobile UIs.
---

# Seven-Principle Premium Site Checklist & UI Audit Discipline

Derived directly from the official **Seven Principle Premium Site Checklist** and **Checklist Design** standards. Every UI component, page layout, and user flow must pass these 7 principles before release.

---

## 🎨 The 7 Principles of Premium UI Design

### 01. The Hero Section — *A complete pitch in one screen*
- ❌ **WEAK**: Vague headline, missing context, proof buried below fold, soft link instead of button. Visitor lands with no idea what this is or why to trust it.
- ✅ **STRONG**: Headline, clear context, visible proof, and ONE primary high-contrast action—all visible without scrolling. The visitor can decide from this screen alone.

### 02. Visual Hierarchy — *Decide what the eye sees first*
- ❌ **WEAK**: Everything same size/weight; eye has nowhere to land; page reads as one grey block of visual noise.
- ✅ **STRONG**: The most important element is biggest and boldest, each step down is quieter. **The Squint Test**: Squint your eyes—you can still tell what leads.

### 03. Whitespace — *Space is what looks expensive*
- ❌ **WEAK**: Every gap filled because empty space feels wasted. Nothing breathes, nothing stands out, page looks busy and amateur.
- ✅ **STRONG**: Generous padding around text, real gaps between sections. When a section feels off, **the answer is more space, not more stuff**.

### 04. Contrast & Colour — *The biggest visible upgrade*
- ❌ **WEAK**: Low-contrast light grey text that strains eyes, primary action button blending into background.
- ✅ **STRONG**: Text reads comfortably (WCAG AA min 4.5:1), color palette stays calm, and the single primary action you want clicked is the highest-contrast element on the page.

### 05. Social Proof Placement — *Put it at the point of doubt*
- ❌ **WEAK**: Testimonials page nobody clicks, or a wall of quotes parked far from decision points.
- ✅ **STRONG**: Trust logos in the hero section, client testimonial right next to pricing/CTA, review score directly on the item being decided. Proof sits exactly where anxiety lives.

### 06. Typography — *Restraint reads as control*
- ❌ **WEAK**: 4-5 fonts fighting each other, decorative typeface used on body copy, zero consistency.
- ✅ **STRONG**: Max 1-2 fonts across the whole site, clear scale ratio (H1 > H2 > H3 > Body), clean readable body text. Personality stays strictly in the headline.

### 07. Mobile First — *Where most of them actually land*
- ❌ **WEAK**: Built on big monitor, bolted onto mobile at the end. Text too small, touch targets cramped, horizontal scroll overflow.
- ✅ **STRONG**: Designed and verified on a real phone held in one hand. Readable without zooming, main button cleanly reachable under the thumb (minimum 48x48px touch target).

---

## 🛠️ Mandatory UI Audit Checklist Before Shipping

- [ ] **Squint Test**: Does the primary CTA stand out clearly when squinting?
- [ ] **Whitespace Check**: Are section paddings generous (e.g. `py-16` to `py-24` or `64px` - `96px`)?
- [ ] **Typography Scale**: Are there maximum 2 font families? Is body text clean and readable (16px / 1rem base)?
- [ ] **Social Proof Placement**: Is trust proof placed near the conversion button/pricing?
- [ ] **Mobile Responsiveness**: Is there zero horizontal overflow? Are touch targets >= 48px?
