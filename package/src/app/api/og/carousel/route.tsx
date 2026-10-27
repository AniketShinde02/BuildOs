import React from 'react';
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

interface CarouselSlide {
  slideIndex: number;
  title: string;
  body: string;
  badge?: string;
  highlight?: string;
}

interface CarouselSpec {
  slides?: CarouselSlide[];
  palette?: {
    primary: string;
    background: string;
    textPrimary: string;
    textSecondary: string;
    accent?: string;
  };
  typography?: {
    headline?: { font?: string; size?: number };
    body?: { font?: string; size?: number };
  };
  brandName?: string;
}

// Dynamic text-fit heuristic to prevent Satori overflow clipping
function getDynamicFontSize(text: string | undefined, type: 'headline' | 'body' | 'hook'): number {
  if (!text) return type === 'headline' ? 46 : 36;
  const len = text.length;
  
  if (type === 'hook') {
    if (len < 30) return 80;
    if (len < 60) return 64;
    if (len < 90) return 52;
    return 46;
  }
  
  if (type === 'headline') {
    if (len < 40) return 56;
    if (len < 70) return 48;
    if (len < 100) return 40;
    return 36;
  }
  
  // Body text calculation
  if (len < 100) return 36;
  if (len < 200) return 32;
  if (len < 300) return 28;
  if (len < 400) return 24;
  return 20;
}

// Multi-slide dynamic Carousel rendering engine (Remotion/Satori compatible array renderer)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetSlide = parseInt(searchParams.get('slide') || '1', 10);
    const totalSlides = parseInt(searchParams.get('total') || '1', 10);
    
    // Parse overarching spec for palettes
    const specRaw = searchParams.get('spec');
    let spec: CarouselSpec = {};
    if (specRaw) {
      try {
        spec = JSON.parse(decodeURIComponent(specRaw));
      } catch {
        // use default empty spec if malformed
      }
    }

    // Support legacy spec OR the new canonical slideData format
    const slideDataRaw = searchParams.get('slideData');
    let canonicalSlide: any = null;
    
    if (slideDataRaw) {
      try {
        canonicalSlide = JSON.parse(decodeURIComponent(slideDataRaw));
      } catch (e) {
        console.warn("[Carousel Renderer] Could not parse canonical slideData", e);
      }
    }

    const activeSlide = {
      slideIndex: targetSlide,
      title: canonicalSlide?.headline || searchParams.get('title') || 'System Module Specification',
      body: canonicalSlide?.body || searchParams.get('content') || 'Operational execution parameters verified for production deployment.',
      badge: canonicalSlide?.role ? canonicalSlide.role.toUpperCase() : (searchParams.get('badge') || 'ARCHITECTURE'),
      highlight: canonicalSlide?.subheadline || searchParams.get('highlight') || undefined
    };

    const isFirst = activeSlide.slideIndex === 1;
    
    // Dynamic text-fit calculation
    const titleSize = getDynamicFontSize(activeSlide.title, isFirst ? 'hook' : 'headline');
    const bodySize = getDynamicFontSize(activeSlide.body, 'body');
    
    // Dynamic brand palette resolution (Zero hardcoded orange or vendor branding)
    const primary = spec.palette?.primary || searchParams.get('primaryColor') || '#3B82F6';
    const background = spec.palette?.background || searchParams.get('backgroundColor') || '#0A0E17';
    const textPrimary = spec.palette?.textPrimary || '#F8FAFC';
    const textSecondary = spec.palette?.textSecondary || '#94A3B8';
    const brandLabel = spec.brandName || searchParams.get('brand') || 'ENGINEERING JOURNAL';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: background,
            fontFamily: '"Inter", sans-serif',
            color: textPrimary,
            padding: '70px',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Dynamic Glow Element based on resolved Brand Palette */}
          <div
            style={{
              position: 'absolute',
              top: isFirst ? '-15%' : '-30%',
              right: isFirst ? '-10%' : '-20%',
              width: '850px',
              height: '850px',
              background: `radial-gradient(circle, ${primary}25 0%, rgba(0,0,0,0) 70%)`,
              borderRadius: '50%',
              display: 'flex',
            }}
          />

          {/* Slide Header & Progress Counter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.06)', padding: '8px 18px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.12)' }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: primary, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {activeSlide.badge || (isFirst ? 'OVERVIEW' : `MODULE 0${activeSlide.slideIndex}`)}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: 22, fontWeight: 800, color: textSecondary }}>
              <span>{String(activeSlide.slideIndex).padStart(2, '0')}</span>
              <span style={{ margin: '0 8px', color: 'rgba(255,255,255,0.2)' }}>/</span>
              <span>{String(totalSlides).padStart(2, '0')}</span>
            </div>
          </div>

          {/* Main Slide Content Area */}
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', marginBottom: 'auto', maxWidth: '920px' }}>
            {isFirst ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: titleSize, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', color: textPrimary, marginBottom: '32px' }}>
                  {activeSlide.title}
                </span>
                {activeSlide.body && (
                  <span style={{ fontSize: bodySize, fontWeight: 400, lineHeight: 1.5, color: textSecondary }}>
                    {activeSlide.body}
                  </span>
                )}
                {activeSlide.highlight && (
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '48px' }}>
                    <div style={{ width: '4px', height: '36px', backgroundColor: primary, marginRight: '16px' }} />
                    <span style={{ fontSize: 24, fontWeight: 700, color: primary, letterSpacing: '-0.01em' }}>
                      {activeSlide.highlight}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: titleSize, fontWeight: 800, lineHeight: 1.2, color: primary, marginBottom: '28px', letterSpacing: '-0.02em' }}>
                  {activeSlide.title}
                </span>
                <span style={{ fontSize: bodySize, fontWeight: 400, lineHeight: 1.5, color: textPrimary }}>
                  {activeSlide.body}
                </span>
              </div>
            )}
          </div>

          {/* Footer Navigation Spine & Brand Identity */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '28px' }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: textSecondary, letterSpacing: '0.04em' }}>
              {brandLabel}
            </span>
            <div style={{ display: 'flex', gap: '10px' }}>
              {Array.from({ length: Math.min(Math.max(totalSlides, 1), 12) }).map((_, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    width: idx + 1 === activeSlide.slideIndex ? 48 : 16, 
                    height: 6, 
                    borderRadius: 3, 
                    backgroundColor: idx + 1 === activeSlide.slideIndex ? primary : 'rgba(255,255,255,0.18)',
                    display: 'flex',
                  }} 
                />
              ))}
            </div>
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1080,
      }
    );
  } catch (e: any) {
    console.error("Carousel Rendering Error:", e);
    return new Response(`Failed to execute carousel renderer: ${e.message}`, { status: 500 });
  }
}
