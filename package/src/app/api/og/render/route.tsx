import { ImageResponse } from 'next/og';
import { DesignSpecification } from '@/lib/studio/models/DesignSpecification';

export const runtime = 'edge';

// Static fallbacks for Inter
const interRegular = fetch(new URL('../../../../../public/fonts/Inter-Regular.otf', import.meta.url)).then(res => res.arrayBuffer());
const interBold = fetch(new URL('../../../../../public/fonts/Inter-Bold.otf', import.meta.url)).then(res => res.arrayBuffer());

export async function POST(request: Request) {
  try {
    const spec: DesignSpecification = await request.json();
    const [regularFontData, boldFontData] = await Promise.all([interRegular, interBold]);

    const { spec: design, content, dimensions } = spec;
    const family = design?.layoutFamily || 'carousel-playbook';
    const color = design?.color || {
      background: '#090A0F', surface: '#131722', primary: '#3B82F6',
      secondary: '#1E2433', textPrimary: '#FFFFFF', textSecondary: '#A1A8B8',
      accent: '#60A5FA', border: '#2A3042'
    };
    const typo = design?.typography || {
      headline: { family: 'Inter', weight: 800, tracking: '-0.03em', leading: '1.1', size: 64 },
      body: { family: 'Inter', weight: 400, tracking: '0em', leading: '1.5', size: 26 },
      caption: { family: 'Monospace', weight: 600, size: 15 }
    };
    const comp = design?.composition || { padding: '64px', gap: 24, safeZones: { top: 60, right: 60, bottom: 80, left: 60 } };
    const assets = design?.assets || { showBadge: true, badgeText: 'PLAYBOOK', backgroundPattern: 'none' };

    // Satori Flexbox Component Assembly
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: color.background,
            fontFamily: '"Inter", sans-serif',
            color: color.textPrimary,
            padding: comp.padding,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* DECORATION LAYER */}
          {color.gradient && color.gradient !== 'none' && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: color.gradient, display: 'flex' }} />
          )}

          {assets.backgroundPattern === 'dots' && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `radial-gradient(${color.textSecondary}22 1px, transparent 1px)`, backgroundSize: '36px 36px', display: 'flex' }} />
          )}

          {/* FAMILY 01: LINEAR TECH / SAAS SHOWCASE / GLASS SURFACE */}
          {(family === 'linear-tech' || family === 'saas-showcase' || family === 'glass-surface') ? (
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', justifyContent: 'space-between' }}>
              {/* Header Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', borderBottom: `1px solid ${color.border}`, paddingBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {assets.showWindowControls && (
                    <div style={{ display: 'flex', gap: '8px', marginRight: '12px' }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#EF4444', display: 'flex' }} />
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#F59E0B', display: 'flex' }} />
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#10B981', display: 'flex' }} />
                    </div>
                  )}
                  <div style={{ background: `${color.primary}22`, border: `1px solid ${color.primary}`, color: color.primary, padding: '6px 14px', borderRadius: '6px', fontSize: typo.caption.size, fontWeight: 700, letterSpacing: '0.05em', display: 'flex' }}>
                    {assets.badgeText || 'API SPECIFICATION'}
                  </div>
                </div>
                <div style={{ color: color.textSecondary, fontSize: typo.caption.size, fontFamily: 'monospace', display: 'flex' }}>
                  SLA: 99.99% VERIFIED
                </div>
              </div>

              {/* Headline & Core Hook */}
              <div style={{ display: 'flex', flexDirection: 'column', marginTop: '30px', marginBottom: '30px', gap: '16px' }}>
                <div style={{ fontSize: typo.headline.size, fontWeight: typo.headline.weight, lineHeight: typo.headline.leading, letterSpacing: typo.headline.tracking, color: color.textPrimary, display: 'flex', flexWrap: 'wrap' }}>
                  {content.title}
                </div>
                {content.subtitle && (
                  <div style={{ fontSize: typo.body.size, color: color.textSecondary, lineHeight: '1.4', display: 'flex', flexWrap: 'wrap' }}>
                    {content.subtitle}
                  </div>
                )}
              </div>

              {/* Structured Cards Matrix */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', marginTop: '20px', marginBottom: '20px' }}>
                {content.points?.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px', background: color.surface, border: `1px solid ${color.border}`, borderRadius: '12px', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{ color: color.primary, fontWeight: 800, fontSize: '24px', display: 'flex' }}>0{idx + 1}</div>
                      <div style={{ color: color.textPrimary, fontSize: typo.body.size, fontWeight: 500, display: 'flex' }}>{item.text}</div>
                    </div>
                    {item.label && <div style={{ color: color.accent, fontSize: '18px', fontWeight: 600, fontFamily: 'monospace', display: 'flex' }}>{item.label}</div>}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: `1px solid ${color.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '22px' }}>
                  <span style={{ color: color.textPrimary, display: 'flex' }}>Build</span>
                  <span style={{ color: color.primary, display: 'flex' }}>OS</span>
                  <span style={{ color: color.textSecondary, fontSize: '14px', fontWeight: 500, marginLeft: '12px', display: 'flex' }}>Creative Operating System</span>
                </div>
                <div style={{ color: color.primary, fontWeight: 700, fontSize: '20px', display: 'flex' }}>
                  {content.ctaText || 'Read Documentation ↗'}
                </div>
              </div>
            </div>

          ) : (family === 'editorial-magazine' || family === 'warm-humanist') ? (
            /* FAMILY 02: EDITORIAL MAGAZINE / WARM HUMANIST */
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', justifyContent: 'space-between', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', borderBottom: `2px solid ${color.textPrimary}`, paddingBottom: '16px' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '0.15em', color: color.textPrimary, textTransform: 'uppercase', display: 'flex' }}>
                  {assets.badgeText || 'THE EDITORIAL REVIEW'}
                </div>
                <div style={{ fontSize: '18px', color: color.textSecondary, display: 'flex' }}>
                  ISSUE NO. 2026
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '40px', marginBottom: '40px' }}>
                <div style={{ fontSize: typo.headline.size + 8, fontWeight: 700, lineHeight: '1.05', color: color.textPrimary, display: 'flex', flexWrap: 'wrap' }}>
                  {content.title}
                </div>
                <div style={{ width: '120px', height: '4px', background: color.accent, display: 'flex' }} />
                <div style={{ fontSize: typo.body.size + 4, color: color.textSecondary, lineHeight: '1.6', display: 'flex', flexWrap: 'wrap', maxWidth: '85%' }}>
                  {content.subtitle || "Exploring the rigorous intersections of artificial intelligence and humanist visual architecture."}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '24px' }}>
                {content.points?.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', flex: 1, borderTop: `1px solid ${color.border}`, paddingTop: '16px', gap: '8px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: color.accent, letterSpacing: '0.05em', display: 'flex' }}>SECTION 0{idx + 1}</div>
                    <div style={{ fontSize: '20px', color: color.textPrimary, fontWeight: 500, lineHeight: '1.4', display: 'flex' }}>{item.text}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '24px', borderTop: `1px solid ${color.border}`, marginTop: '32px' }}>
                <div style={{ fontWeight: 800, fontSize: '20px', color: color.textPrimary, display: 'flex' }}>BuildOS • Art Direction</div>
                <div style={{ fontSize: '18px', color: color.textSecondary, fontStyle: 'italic', display: 'flex' }}>{content.ctaText || "Continue Reading ➔"}</div>
              </div>
            </div>

          ) : (family === 'swiss-grid' || family === 'neo-brutalist') ? (
            /* FAMILY 03: SWISS GRID / NEO-BRUTALIST */
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', border: `4px solid ${color.primary}`, background: color.background }}>
              <div style={{ display: 'flex', width: '100%', borderBottom: `4px solid ${color.primary}` }}>
                <div style={{ padding: '20px 28px', background: color.primary, color: color.background, fontWeight: 900, fontSize: '22px', letterSpacing: '0.05em', display: 'flex' }}>
                  {assets.badgeText || 'SWISS METRICS MATRIX'}
                </div>
                <div style={{ padding: '20px 28px', color: color.textPrimary, fontWeight: 700, fontSize: '20px', display: 'flex', marginLeft: 'auto' }}>
                  SYSTEM AUDIT // REV 100
                </div>
              </div>

              <div style={{ display: 'flex', padding: '48px 40px', flex: 1, borderBottom: `4px solid ${color.primary}`, flexDirection: 'column', justifyContent: 'center', gap: '24px' }}>
                <div style={{ fontSize: typo.headline.size, fontWeight: 900, lineHeight: '1.02', letterSpacing: '-0.03em', color: color.textPrimary, display: 'flex', flexWrap: 'wrap' }}>
                  {content.title}
                </div>
                <div style={{ fontSize: typo.body.size, color: color.textSecondary, display: 'flex', flexWrap: 'wrap' }}>
                  {content.subtitle}
                </div>
              </div>

              <div style={{ display: 'flex', width: '100%' }}>
                {content.points?.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '32px 24px', borderRight: idx === content.points.length - 1 ? 'none' : `4px solid ${color.primary}`, background: color.surface, gap: '12px' }}>
                    <div style={{ color: color.primary, fontSize: '32px', fontWeight: 900, display: 'flex' }}>0{idx + 1} //</div>
                    <div style={{ color: color.textPrimary, fontSize: '22px', fontWeight: 700, lineHeight: '1.3', display: 'flex' }}>{item.text}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 28px', background: color.surface, borderTop: `4px solid ${color.primary}` }}>
                <div style={{ fontWeight: 900, fontSize: '22px', color: color.textPrimary, display: 'flex' }}>BUILDOS SYSTEM AUTHORITY</div>
                <div style={{ fontWeight: 900, fontSize: '22px', color: color.primary, display: 'flex' }}>{content.ctaText || "EXECUTE PIPELINE ➔"}</div>
              </div>
            </div>

          ) : (
            /* FAMILY 08: CAROUSEL PLAYBOOK & DYNAMIC HYBRID (HIGH CONVERSION SOCIAL) */
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', justifyContent: 'space-between' }}>
              {/* Top Meta Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ background: color.primary, color: '#FFF', padding: '8px 18px', borderRadius: '50px', fontSize: '16px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', boxShadow: `0 8px 20px ${color.primary}44` }}>
                    {assets.badgeText || 'CAROUSEL PLAYBOOK'}
                  </div>
                  <div style={{ color: color.textSecondary, fontSize: '18px', fontWeight: 600, display: 'flex' }}>
                    Slide {assets.currentSlide || 1} of {assets.totalSlides || 5}
                  </div>
                </div>
                <div style={{ color: color.accent, fontSize: '18px', fontWeight: 700, display: 'flex' }}>
                  ★ 2026 EDITION
                </div>
              </div>

              {/* High Impact Hook Section */}
              <div style={{ display: 'flex', flexDirection: 'column', marginTop: '40px', marginBottom: '40px', gap: '24px' }}>
                <div style={{ fontSize: typo.headline.size, fontWeight: 800, lineHeight: '1.06', letterSpacing: typo.headline.tracking, color: color.textPrimary, display: 'flex', flexWrap: 'wrap' }}>
                  {content.title}
                </div>
                {content.subtitle && (
                  <div style={{ fontSize: typo.body.size + 2, fontWeight: 400, color: color.textSecondary, lineHeight: '1.5', display: 'flex', flexWrap: 'wrap' }}>
                    {content.subtitle}
                  </div>
                )}
              </div>

              {/* Structured Points Stack */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '100%', marginBottom: '40px' }}>
                {content.points?.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '26px 32px', background: color.surface, border: `1px solid ${color.border}`, borderRadius: '20px', width: '100%', boxShadow: '0 12px 24px rgba(0,0,0,0.3)' }}>
                    <div style={{ width: 52, height: 52, borderRadius: 26, background: `${color.primary}22`, border: `1px solid ${color.primary}`, color: color.primary, fontWeight: 800, fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      0{idx + 1}
                    </div>
                    <div style={{ color: color.textPrimary, fontSize: typo.body.size, fontWeight: 600, display: 'flex', flexWrap: 'wrap', flex: 1, lineHeight: '1.35' }}>
                      {item.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Carousel Navigation Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '24px', borderTop: `1px solid ${color.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '28px', fontWeight: 800, color: color.textPrimary, letterSpacing: '-0.04em', display: 'flex' }}>Build</span>
                  <span style={{ fontSize: '28px', fontWeight: 800, color: color.primary, letterSpacing: '-0.04em', display: 'flex' }}>OS</span>
                  <span style={{ fontSize: '16px', color: color.textSecondary, fontWeight: 600, marginLeft: '16px', display: 'flex' }}>Save this for later • Share with a peer</span>
                </div>

                {assets.showProgressDots && (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {Array.from({ length: assets.totalSlides || 5 }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: i === (assets.currentSlide || 1) - 1 ? 40 : 12,
                          height: 12,
                          borderRadius: '6px',
                          background: i === (assets.currentSlide || 1) - 1 ? color.primary : `${color.textSecondary}33`,
                          display: 'flex'
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* WATERMARK LABEL */}
          <div style={{ position: 'absolute', bottom: '12px', right: '16px', fontSize: '11px', color: `${color.textSecondary}44`, fontWeight: 700, letterSpacing: '0.1em', display: 'flex' }}>
            {assets.watermarkText || 'POWERED BY BUILDOS CREATIVE OS'}
          </div>
        </div>
      ),
      {
        width: dimensions?.width || 1080,
        height: dimensions?.height || 1080,
        fonts: [
          { name: 'Inter', data: regularFontData, weight: 400, style: 'normal' },
          { name: 'Inter', data: boldFontData, weight: 800, style: 'normal' },
        ]
      }
    );
  } catch (e: any) {
    console.error('Render Engine Error:', e);
    return new Response(`Failed to execute CreativeOS rendering: ${e.message}`, { status: 500 });
  }
}
