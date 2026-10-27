---
name: component-catalogs-and-ui-kits
description: Master catalog and execution engine for prebuilt UI component libraries, design systems, animated UI kits, 3D/motion tools, and mesomorphic design patterns (shadcn/ui, Aceternity UI, Magic UI, Motion-Primitives, SmoothUI, Retro UI, NeoBrutalism, Radix, Mantine, Tailwind, etc.). Use to instantly pull, adapt, and refine high-converting components, carousels, hero sections, and animations with zero guesswork on spacing, visual hierarchy, and padding.
---

# Component Catalogs, UI Kits & Prebuilt Acceleration Skill

## 🎯 Purpose & Directives
When building, redesigning, or refactoring user interfaces (such as SunSight, SaaS applications, dashboards, or marketing landing pages):
1. **Never Reinvent or Guess Primitive Mechanics**: Do not manually code complex carousels, spring physics, or multi-step animations from scratch when a production-grade component exists in the verified catalog.
2. **Retrieve via CLI & Standardized Patterns**: Pull components from shadcn/ui, Aceternity UI, Magic UI, Motion-Primitives, SmoothUI, Retro UI, or NeoBrutalism registries.
3. **Save Token Budget & Eliminate UI Flaws**: Using pre-validated component patterns guarantees proper responsive padding, accessible ARIA attributes, semantic HTML, and crisp visual hierarchy without iterative correction loops.

---

## 📚 Master Component & Tool Catalog

### 1. Core Component Libraries
- **shadcn/ui** (`https://ui.shadcn.com`): `npx shadcn@latest add <component>` — Foundational accessible primitives.
- **Aceternity UI** (`https://ui.aceternity.com`): `npx shadcn@latest add "https://ui.aceternity.com/r/<component>"` — 3D cards, spotlight effects, background beams, meteor shower effects.
- **Magic UI** (`https://magicui.design`): `npx shadcn@latest add "https://magicui.design/r/<component>"` — Interactive landing page elements (Bento grid, Marquee, Globe, Shimmer button).
- **Radix UI** (`https://www.radix-ui.com`): Headless accessible primitives.
- **Mantine** (`https://mantine.dev`): Rich React components + hooks ecosystem.
- **MUI** (`https://mui.com`): Enterprise dashboards & Material 3.
- **Chakra UI** (`https://chakra-ui.com`): Modular design tokens with style props.
- **Ant Design** (`https://ant.design`): High-density enterprise forms & tables.
- **PrimeReact** (`https://primereact.org`): 80+ rich widgets.
- **Tailwind CSS & daisyUI** (`https://daisyui.com`): Rapid semantic theme classes.
- **Preline UI** (`https://preline.co`), **HyperUI** (`https://www.hyperui.dev`), **PrebuiltUI** (`https://prebuiltui.com`), **Mamba UI** (`https://mambaui.com`), **Flowbite** (`https://flowbite.com`).
- **Park UI** (`https://park-ui.com`): Ark UI + Panda CSS/Tailwind.
- **HeroUI** (`https://heroui.com`): Beautiful modern React UI.

### 2. Animated & Creative Kits
- **Motion-Primitives** (`https://motion-primitives.com`): Animated carousels, morphing dialogs, text roll, magnetic buttons, fluid tabs.
- **SmoothUI** (`https://smoothui.dev`): Spring physics & micro-interactions.
- **Retro UI** (`https://retroui.io`): Nostalgic 90s computing / Y2K desktop UI.
- **NeoBrutalism** (`https://neobrutalism.com`): 2-4px solid black borders, 4px hard drop shadows, punchy colors.
- **Watermelon UI** (`https://ui.watermelon.sh`), **unlumen UI** (`https://ui.unlumen.com`), **Originkit** (`https://originkit.com`), **Flowrift** (`https://flowrift.com`), **morphicons** (`https://morphicons.com`).

### 3. 3D, Motion & Generators
- **ThreeUI** (`https://github.com/MengTo/threeui`): Three.js & R3F interactive spatial 3D.
- **animos** (`https://toolfolio.com/tools/animos`): Animation templates for MicroSaaS.
- **Brand Motion Studios** (`https://brandmotionstudios.com` / `https://brandmotion.in`): High-end studio interaction choreography.
- **Design Prompts Explorer** (`https://designprompts.dev`), **Realtime Colors** (`https://realtimecolors.com`), **Haikei** (`https://haikei.app`), **Driver.js** (`https://driverjs.com`), **Thinking Gods Prompts** (`https://thinkingods.com/prompts`).

---

## 🛠️ Step-by-Step UI Acceleration Workflow

### Step 1: Component & Section Identification
- Identify the UI requirement: (e.g. Hero Section with Carousel + Spotlight Cards + Bento Feature Grid).
- Check the catalog to match the ideal library:
  - Hero Background Effect -> Aceternity UI (`background-beams`, `sparkles`, or `spotlight`)
  - Feature Grid -> Magic UI (`bento-grid`)
  - Testimonial Carousel / Card Slider -> Motion-Primitives (`carousel` or `infinite-slider`)
  - Modal / Navigation -> shadcn/ui (`dialog`, `navigation-menu`)

### Step 2: CLI or Clean Component Injection
- Run the respective registry CLI or copy the clean component implementation:
  ```bash
  npx shadcn@latest add dialog
  npx shadcn@latest add "https://ui.aceternity.com/r/spotlight"
  npx shadcn@latest add "https://magicui.design/r/bento-grid"
  ```
- Ensure dependencies (`framer-motion`, `clsx`, `tailwind-merge`, `lucide-react`) are installed via the detected project package manager.

### Step 3: Mesomorphic Elevation & Aesthetic Tuning
- Apply the **Mesomorphic Styling Standard**:
  - Container: `bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl`
  - Subtle Gradient: `bg-gradient-to-b from-white/10 via-transparent to-transparent`
  - Hover states: `hover:border-white/20 hover:shadow-cyan-500/10 transition-all duration-300`
  - Restrain accent colors to 1 vibrant primary (Cyan, Violet, or Amber).

### Step 4: Spacing & Visual Hierarchy Audit (Zero-Flaw Guarantee)
- **Top-Level Section Padding**: `py-16 sm:py-24 lg:py-32`
- **Max Width**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- **Headlines**: Primary title `text-4xl sm:text-6xl font-extrabold tracking-tight`, Subtitle `text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto`
- **Buttons**: Minimum `min-h-[44px] px-6 py-3 font-semibold rounded-xl` with high contrast CTA.
- **Mobile Check**: Zero horizontal scroll overflow (`overflow-x-hidden` on parent containers).
