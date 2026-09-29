import React from 'react';
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const interRegular = fetch(new URL('../../../../../public/fonts/Inter-Regular.otf', import.meta.url)).then(r => r.arrayBuffer());
const interBold = fetch(new URL('../../../../../public/fonts/Inter-Bold.otf', import.meta.url)).then(r => r.arrayBuffer());

// ─────────────────────────────────────────────────────────────────────────────
// Shared token extractors
// ─────────────────────────────────────────────────────────────────────────────
function q(url: URL, key: string, fallback = ''): string {
  return url.searchParams.get(key) || fallback;
}
function parsePoints(raw: string | null): string[] {
  if (!raw) return [];
  try { return JSON.parse(decodeURIComponent(raw)); } catch { return []; }
}

export async function GET(request: Request) {
  const [regularFont, boldFont] = await Promise.all([interRegular, interBold]);
  const url = new URL(request.url);

  const type      = q(url, 'type', 'numbered-steps');
  const title     = q(url, 'title', 'Engineering Insight');
  const subtitle  = q(url, 'subtitle', 'Engineering Journal');
  const quoteText = q(url, 'quote', '');
  const author    = q(url, 'author', 'Aniket Shinde');
  const points    = parsePoints(url.searchParams.get('points'));

  const fonts = [
    { name: 'Inter', data: regularFont, weight: 400 as const, style: 'normal' as const },
    { name: 'Inter', data: boldFont,    weight: 800 as const, style: 'normal' as const },
  ];

  // ─── Route to the correct template family ─────────────────────────────────
  let jsx: React.ReactElement;

  switch (type) {
    case 'quote-large':
      jsx = QuoteLarge({ title, subtitle, quoteText, author });
      break;
    case 'launch-banner':
      jsx = LaunchBanner({ title, subtitle, points });
      break;
    case 'checklist-card':
      jsx = ChecklistCard({ title, subtitle, points });
      break;
    case 'metrics-card':
      jsx = MetricsCard({ title, subtitle, points });
      break;
    case 'timeline-card':
      jsx = TimelineCard({ title, subtitle, points });
      break;
    case 'minimal-editorial':
      jsx = MinimalEditorial({ title, subtitle, points });
      break;
    case 'bold-poster':
      jsx = BoldPoster({ title, subtitle, points });
      break;
    case 'blueprint':
      jsx = Blueprint({ title, subtitle, points });
      break;
    default: // numbered-steps
      jsx = NumberedSteps({ title, subtitle, points });
  }

  return new ImageResponse(jsx, {
    width: 1080, height: 1080,
    fonts,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 1: NUMBERED STEPS
// Dark navy, accent blue, numbered card rows — clean developer infographic
// ─────────────────────────────────────────────────────────────────────────────
function NumberedSteps({ title, subtitle, points }: { title: string; subtitle: string; points: string[] }) {
  const accent = '#3B82F6';
  const bg = '#060B13';
  const surface = '#0D1524';
  const border = '#1E293B';
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: bg, padding: '80px', justifyContent: 'space-between' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '4px', height: '32px', background: accent, borderRadius: '2px', display: 'flex' }} />
          <span style={{ color: accent, fontSize: '20px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex' }}>{subtitle}</span>
        </div>
        <div style={{ fontSize: '64px', fontWeight: 800, lineHeight: '1.08', letterSpacing: '-0.03em', color: '#F8FAFC', display: 'flex', flexWrap: 'wrap' }}>{title}</div>
      </div>

      {/* Numbered Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '48px' }}>
        {points.slice(0, 4).map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '24px', backgroundColor: surface, border: `1px solid ${border}`, borderRadius: '16px', padding: '28px 32px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: `${accent}22`, border: `1.5px solid ${accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: accent, fontSize: '22px', fontWeight: 800, display: 'flex' }}>0{i + 1}</span>
            </div>
            <span style={{ color: '#E2E8F0', fontSize: '28px', fontWeight: 600, lineHeight: '1.3', display: 'flex', flex: 1, flexWrap: 'wrap' }}>{p}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '48px', paddingTop: '24px', borderTop: `1px solid ${border}` }}>
        <span style={{ fontSize: '22px', fontWeight: 800, color: '#CBD5E1', display: 'flex' }}>Aniket Shinde</span>
        <span style={{ fontSize: '18px', color: '#64748B', display: 'flex' }}>aniketsworld.com</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 2: QUOTE LARGE
// High contrast single quote — warm off-white, typographic emphasis
// ─────────────────────────────────────────────────────────────────────────────
function QuoteLarge({ title, subtitle, quoteText, author }: { title: string; subtitle: string; quoteText: string; author: string }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#F7F5F0', padding: '100px', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.12em', color: '#111', textTransform: 'uppercase', display: 'flex' }}>{subtitle}</span>
        <span style={{ fontSize: '20px', color: '#888', display: 'flex' }}>2026</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {/* Decorative quote mark */}
        <div style={{ fontSize: '160px', lineHeight: '0.7', color: '#E2DDD5', fontWeight: 900, display: 'flex' }}>"</div>
        <div style={{ fontSize: '56px', fontWeight: 700, lineHeight: '1.2', color: '#111', display: 'flex', flexWrap: 'wrap', letterSpacing: '-0.02em' }}>
          {quoteText || title}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '2px solid #111', paddingTop: '32px' }}>
        <span style={{ fontSize: '26px', fontWeight: 800, color: '#111', display: 'flex' }}>— {author}</span>
        <span style={{ fontSize: '18px', color: '#888', display: 'flex' }}>LinkedIn · {new Date().getFullYear()}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 3: LAUNCH BANNER
// Wide proclamation — bold black/white neobrutalist
// ─────────────────────────────────────────────────────────────────────────────
function LaunchBanner({ title, subtitle, points }: { title: string; subtitle: string; points: string[] }) {
  const accent = '#22C55E';
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#000', border: '6px solid #fff', padding: '0', justifyContent: 'space-between', overflow: 'hidden' }}>
      {/* Header stripe */}
      <div style={{ display: 'flex', background: '#fff', padding: '20px 60px', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '22px', fontWeight: 900, color: '#000', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex' }}>{subtitle}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: accent, display: 'flex' }} />
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#000', display: 'flex' }}>LIVE</span>
        </div>
      </div>

      {/* Hero title */}
      <div style={{ padding: '60px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div style={{ fontSize: '80px', fontWeight: 900, lineHeight: '1.0', letterSpacing: '-0.04em', color: '#fff', display: 'flex', flexWrap: 'wrap' }}>{title}</div>
        {points.length > 0 && (
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {points.slice(0, 3).map((p, i) => (
              <div key={i} style={{ background: '#fff', padding: '10px 20px', borderRadius: '6px', display: 'flex' }}>
                <span style={{ color: '#000', fontSize: '20px', fontWeight: 700, display: 'flex' }}>{p}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ background: accent, padding: '24px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '24px', fontWeight: 900, color: '#000', display: 'flex' }}>Aniket Shinde</span>
        <span style={{ fontSize: '22px', fontWeight: 700, color: '#000', display: 'flex' }}>aniketsworld.com ↗</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 4: CHECKLIST CARD
// Clean light card with checkbox rows — actionable list feel
// ─────────────────────────────────────────────────────────────────────────────
function ChecklistCard({ title, subtitle, points }: { title: string; subtitle: string; points: string[] }) {
  const accent = '#7C3AED';
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#0F0A1E', padding: '80px' }}>
      {/* Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
        <div style={{ background: accent, padding: '6px 16px', borderRadius: '50px', display: 'flex' }}>
          <span style={{ color: '#fff', fontSize: '18px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex' }}>{subtitle}</span>
        </div>
      </div>

      <div style={{ fontSize: '60px', fontWeight: 800, lineHeight: '1.1', color: '#FFFFFF', letterSpacing: '-0.03em', display: 'flex', flexWrap: 'wrap', marginBottom: '52px' }}>{title}</div>

      {/* Checklist items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
        {points.slice(0, 5).map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', backgroundColor: '#1A0F30', borderRadius: '12px', padding: '24px 28px', border: '1px solid #2D1F50' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
              <span style={{ color: '#fff', fontSize: '18px', fontWeight: 900, display: 'flex' }}>✓</span>
            </div>
            <span style={{ color: '#E2D9F3', fontSize: '26px', fontWeight: 500, lineHeight: '1.35', display: 'flex', flexWrap: 'wrap', flex: 1 }}>{p}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 5: METRICS CARD
// Data-first — teal/dark, large number emphasis, minimal structure
// ─────────────────────────────────────────────────────────────────────────────
function MetricsCard({ title, subtitle, points }: { title: string; subtitle: string; points: string[] }) {
  const accent = '#14B8A6';
  const bg = '#040D0B';
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: bg, padding: '80px', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <span style={{ color: accent, fontSize: '20px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex' }}>{subtitle}</span>
        <div style={{ fontSize: '58px', fontWeight: 800, lineHeight: '1.1', color: '#fff', letterSpacing: '-0.03em', display: 'flex', flexWrap: 'wrap' }}>{title}</div>
      </div>

      {/* Metric blocks */}
      <div style={{ display: 'flex', gap: '24px', flex: 1, marginTop: '48px', marginBottom: '48px' }}>
        {points.slice(0, 3).map((p, i) => (
          <div key={i} style={{ flex: 1, background: '#071512', border: `1px solid ${accent}33`, borderRadius: '16px', padding: '36px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px' }}>
            <div style={{ width: '40px', height: '4px', background: accent, borderRadius: '2px', display: 'flex' }} />
            <span style={{ color: '#E2F9F7', fontSize: '26px', fontWeight: 600, lineHeight: '1.3', display: 'flex', flexWrap: 'wrap' }}>{p}</span>
            <span style={{ color: accent, fontSize: '22px', fontWeight: 800, display: 'flex' }}>0{i + 1}</span>
          </div>
        ))}
      </div>

      <div style={{ borderTop: `1px solid ${accent}33`, paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#94A3B8', fontSize: '20px', display: 'flex' }}>Aniket Shinde</span>
        <span style={{ color: accent, fontSize: '18px', fontWeight: 600, display: 'flex' }}>Data · {new Date().getFullYear()}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 6: TIMELINE CARD
// Sequential journey — left accent spine with vertical flow
// ─────────────────────────────────────────────────────────────────────────────
function TimelineCard({ title, subtitle, points }: { title: string; subtitle: string; points: string[] }) {
  const accent = '#F59E0B';
  const bg = '#0A0700';
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: bg, padding: '80px', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '48px' }}>
        <span style={{ color: accent, fontSize: '20px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex' }}>{subtitle}</span>
        <div style={{ fontSize: '62px', fontWeight: 800, lineHeight: '1.08', color: '#FFFBEB', letterSpacing: '-0.03em', display: 'flex', flexWrap: 'wrap' }}>{title}</div>
      </div>

      {/* Timeline rows */}
      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '0' }}>
        {points.slice(0, 4).map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: '24px', alignItems: 'stretch' }}>
            {/* Spine */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '32px', flexShrink: 0 }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: accent, border: '3px solid #0A0700', display: 'flex', flexShrink: 0 }} />
              {i < points.length - 1 && <div style={{ width: '2px', flex: 1, background: `${accent}44`, display: 'flex', minHeight: '40px' }} />}
            </div>
            {/* Content */}
            <div style={{ paddingBottom: i < points.length - 1 ? '32px' : '0', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <span style={{ color: accent, fontSize: '16px', fontWeight: 700, display: 'flex' }}>STEP {String(i + 1).padStart(2, '0')}</span>
              <span style={{ color: '#FEF3C7', fontSize: '26px', fontWeight: 500, lineHeight: '1.3', display: 'flex', flexWrap: 'wrap' }}>{p}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: `1px solid ${accent}22`, paddingTop: '24px', marginTop: '40px', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#78716C', fontSize: '20px', display: 'flex' }}>Aniket Shinde</span>
        <span style={{ color: accent, fontSize: '18px', fontWeight: 600, display: 'flex' }}>Journey · {new Date().getFullYear()}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 7: MINIMAL EDITORIAL
// Warm white, typographic, editorial magazine feel
// ─────────────────────────────────────────────────────────────────────────────
function MinimalEditorial({ title, subtitle, points }: { title: string; subtitle: string; points: string[] }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#FAFAF8', padding: '100px', justifyContent: 'space-between' }}>
      {/* Masthead */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #111', paddingBottom: '24px' }}>
        <span style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '0.12em', color: '#111', textTransform: 'uppercase', display: 'flex' }}>{subtitle}</span>
        <span style={{ fontSize: '20px', color: '#888', display: 'flex' }}>Vol. {new Date().getFullYear()}</span>
      </div>

      {/* Title */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '48px', marginBottom: '48px' }}>
        <div style={{ fontSize: '68px', fontWeight: 700, lineHeight: '1.05', color: '#111', display: 'flex', flexWrap: 'wrap', letterSpacing: '-0.02em' }}>{title}</div>
        <div style={{ width: '80px', height: '4px', background: '#111', display: 'flex' }} />
      </div>

      {/* Points in editorial column style */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0', flex: 1 }}>
        {points.slice(0, 3).map((p, i) => (
          <div key={i} style={{ borderTop: '1px solid #D1D5DB', paddingTop: '20px', paddingBottom: '20px', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#999', width: '32px', flexShrink: 0, display: 'flex' }}>0{i + 1}</span>
            <span style={{ fontSize: '24px', color: '#333', lineHeight: '1.45', display: 'flex', flexWrap: 'wrap', flex: 1 }}>{p}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #111', paddingTop: '28px', marginTop: '32px' }}>
        <span style={{ fontSize: '22px', fontWeight: 800, color: '#111', display: 'flex' }}>Aniket Shinde</span>
        <span style={{ fontSize: '18px', color: '#888', fontStyle: 'italic', display: 'flex' }}>aniketsworld.com</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 8: BOLD POSTER
// Full bleed color, massive single headline, social-first impact
// ─────────────────────────────────────────────────────────────────────────────
function BoldPoster({ title, subtitle, points }: { title: string; subtitle: string; points: string[] }) {
  // Pick a distinct accent from the category instead of always orange
  const colorMap: Record<string, { bg: string; accent: string; text: string }> = {
    'Freelance Journal':    { bg: '#4F46E5', accent: '#C7D2FE', text: '#FFFFFF' },
    'System Architecture':  { bg: '#1E40AF', accent: '#BFDBFE', text: '#fff' },
    'Build Log':            { bg: '#065F46', accent: '#6EE7B7', text: '#fff' },
    'Performance Engineering': { bg: '#1F1235', accent: '#A78BFA', text: '#fff' },
    'Product Launch':       { bg: '#000', accent: '#22C55E', text: '#fff' },
  };
  const palette = colorMap[subtitle] || { bg: '#111827', accent: '#F3F4F6', text: '#fff' };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: palette.bg, padding: '80px', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: palette.accent, fontSize: '20px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'flex' }}>{subtitle}</span>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: palette.accent, display: 'flex' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ fontSize: '88px', fontWeight: 900, lineHeight: '1.0', letterSpacing: '-0.04em', color: palette.text, display: 'flex', flexWrap: 'wrap' }}>{title}</div>
        {points.slice(0, 2).map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: palette.accent, display: 'flex' }} />
            <span style={{ color: palette.text, fontSize: '26px', fontWeight: 400, opacity: 0.85, display: 'flex' }}>{p}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: palette.text, fontSize: '22px', fontWeight: 800, opacity: 0.7, display: 'flex' }}>— Aniket Shinde</span>
        <div style={{ background: palette.accent, padding: '10px 24px', borderRadius: '50px', display: 'flex' }}>
          <span style={{ color: palette.bg, fontSize: '18px', fontWeight: 800, display: 'flex' }}>Read the post →</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 9: BLUEPRINT
// Technical dark with grid lines — architecture/system design posts
// ─────────────────────────────────────────────────────────────────────────────
function Blueprint({ title, subtitle, points }: { title: string; subtitle: string; points: string[] }) {
  const accent = '#38BDF8';
  const bg = '#020C18';
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      backgroundColor: bg, padding: '80px', justifyContent: 'space-between',
      backgroundImage: `linear-gradient(${accent}08 1px, transparent 1px), linear-gradient(90deg, ${accent}08 1px, transparent 1px)`,
      backgroundSize: '60px 60px'
    }}>
      {/* Top label */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ background: `${accent}22`, border: `1px solid ${accent}55`, borderRadius: '6px', padding: '8px 18px', display: 'flex' }}>
          <span style={{ color: accent, fontSize: '18px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex' }}>{subtitle}</span>
        </div>
        <span style={{ color: `${accent}55`, fontSize: '16px', fontFamily: 'monospace', display: 'flex' }}>REV {new Date().getFullYear()}.1</span>
      </div>

      {/* Title */}
      <div style={{ fontSize: '64px', fontWeight: 800, lineHeight: '1.1', color: '#E0F2FE', letterSpacing: '-0.03em', display: 'flex', flexWrap: 'wrap' }}>{title}</div>

      {/* Block rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {points.slice(0, 4).map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: '20px', alignItems: 'center', background: `${accent}0A`, border: `1px solid ${accent}22`, borderRadius: '8px', padding: '20px 24px' }}>
            <span style={{ color: accent, fontFamily: 'monospace', fontSize: '18px', fontWeight: 700, display: 'flex', flexShrink: 0 }}>[{String(i + 1).padStart(2, '0')}]</span>
            <span style={{ color: '#BAE6FD', fontSize: '24px', lineHeight: '1.3', display: 'flex', flexWrap: 'wrap', flex: 1 }}>{p}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${accent}22`, paddingTop: '24px', marginTop: '32px' }}>
        <span style={{ color: `${accent}88`, fontSize: '18px', fontFamily: 'monospace', display: 'flex' }}>AUTHORED BY: Aniket Shinde</span>
        <span style={{ color: `${accent}44`, fontSize: '16px', fontFamily: 'monospace', display: 'flex' }}>STATUS: PRODUCTION</span>
      </div>
    </div>
  );
}
