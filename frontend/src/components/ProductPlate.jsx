import React from 'react';

/**
 * Editorial graphic plate for catalog products.
 * Does not fabricate photographs. Renders clean, architectural line art
 * matching the product's category/type with subtle technical grid texture.
 */

function FastenerGlyph() {
  return (
    <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="glyph" aria-hidden="true">
      {/* Nail 1 */}
      <line x1="28" y1="18" x2="52" y2="18" />
      <line x1="40" y1="18" x2="40" y2="60" />
      <polygon points="38,60 42,60 40,66" fill="currentColor" stroke="none" />
      {/* Screw 2 tilted */}
      <line x1="20" y1="28" x2="32" y2="28" transform="rotate(-30 26 28)" />
      <line x1="26" y1="28" x2="26" y2="58" transform="rotate(-30 26 28)" />
      {/* Screw threads */}
      <line x1="28" y1="40" x2="34" y2="40" transform="rotate(-30 26 28)" />
      <line x1="28" y1="46" x2="34" y2="46" transform="rotate(-30 26 28)" />
    </svg>
  );
}

function HammerGlyph() {
  return (
    <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="glyph" aria-hidden="true">
      {/* Hammer head */}
      <path d="M26 24h24l6 8v6h-34v-8l4-6z" />
      <path d="M56 26c6 0 10 4 12 10" />
      {/* Handle */}
      <path d="M36 38v32c0 2 2 4 4 4s4-2 4-4V38" />
      <line x1="36" y1="52" x2="44" y2="52" />
    </svg>
  );
}

function ElectricalGlyph() {
  return (
    <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="glyph" aria-hidden="true">
      <circle cx="40" cy="40" r="24" strokeDasharray="3 3" />
      <path d="M42 22 30 42h16l-8 20" />
      <circle cx="40" cy="40" r="3" fill="currentColor" />
    </svg>
  );
}

function PlumbingGlyph() {
  return (
    <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="glyph" aria-hidden="true">
      {/* Pipe T-joint */}
      <path d="M22 28h12v12h12v-12h12v24H46v16H34V52H22V28z" />
      {/* Valve wheel */}
      <circle cx="40" cy="18" r="6" />
      <line x1="40" y1="12" x2="40" y2="24" />
      <line x1="34" y1="18" x2="46" y2="18" />
    </svg>
  );
}

function ConstructionGlyph() {
  return (
    <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="glyph" aria-hidden="true">
      {/* Masonry trowel */}
      <path d="M24 50 48 26l8 8-24 24-8-8z" />
      <path d="M48 26l8-10 6 6-10 8" />
      {/* Handle */}
      <path d="M62 22l6-6" strokeWidth="3" />
    </svg>
  );
}

function PaintGlyph() {
  return (
    <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="glyph" aria-hidden="true">
      {/* Paint roller */}
      <rect x="24" y="22" width="32" height="14" rx="3" />
      <path d="M56 29h6v18H40v14" />
      <rect x="36" y="56" width="8" height="14" rx="2" />
    </svg>
  );
}

function SafetyGlyph() {
  return (
    <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="glyph" aria-hidden="true">
      {/* Shield */}
      <path d="M40 18s16 4 18 18c0 18-18 28-18 28S22 54 22 36c2-14 18-18 18-18z" />
      <path d="M40 28v26" />
    </svg>
  );
}

function DefaultToolGlyph() {
  return (
    <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="glyph" aria-hidden="true">
      {/* Combination wrench */}
      <circle cx="28" cy="28" r="10" />
      <path d="M28 22v4l3 2" />
      <line x1="35" y1="35" x2="56" y2="56" strokeWidth="4" />
      <path d="M52 60 60 52l4 4-8 8-4-4z" />
    </svg>
  );
}

export function pickGlyph(categoryName = '', productName = '') {
  const norm = `${categoryName} ${productName}`.toLowerCase();
  if (/clavo|tornill|fijaci|perno|remache|tuerca|anclaj/i.test(norm)) return FastenerGlyph;
  if (/martill|herramienta|manual|llave|pinza|destornill|alicat|sierra/i.test(norm)) return HammerGlyph;
  if (/electr|cable|ilumina|bombill|interruptor|volt|corrient/i.test(norm)) return ElectricalGlyph;
  if (/plomer|tub|valvul|grif|codo|pvc|drenaj|agua/i.test(norm)) return PlumbingGlyph;
  if (/construc|cemento|bloqu|ladrill|arena|pala|palustr/i.test(norm)) return ConstructionGlyph;
  if (/pintur|broch|rodill|adhesiv|sellador|silicon|esmalte/i.test(norm)) return PaintGlyph;
  if (/segurid|epp|guant|casco|gafa|arnes|chaleco/i.test(norm)) return SafetyGlyph;
  return DefaultToolGlyph;
}

export default function ProductPlate({ product, size = 'md', className = '' }) {
  if (!product) return null;

  const catName = product.category?.name || '';
  const Glyph = pickGlyph(catName, product.name);

  // Deterministic tone (1..4) based on product_id
  const toneIndex = ((Math.abs(Number(product.product_id) || 1) % 4) + 1);
  const toneClass = `plate-tone-${toneIndex}`;
  const sizeClass = size === 'lg' ? 'plate-lg' : '';

  return (
    <div className={`plate ${toneClass} ${sizeClass} ${className}`} aria-hidden="true">
      <Glyph />
      {product.sku ? (
        <span className="plate-sku">SKU: {product.sku}</span>
      ) : null}
      {product.is_stockable ? (
        <span className="plate-flag badge badge-success badge-dot">Inventariable</span>
      ) : null}
    </div>
  );
}
