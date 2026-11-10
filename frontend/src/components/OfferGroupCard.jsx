import React from 'react';
import StatusBadge from './StatusBadge.jsx';
import { formatUtcDateTime, formatAgeSeconds, describeFreshness } from '../features/formatters.js';

/**
 * Editorial card for compatible supplier offer groups.
 * Strictly isolates comparison_group (purchase unit, pack_quantity, currency, tax).
 * Unconfirmed legacy offers are placed in a separate distinct card.
 * Responsive: high-clarity table on desktop, stacked card layout on mobile.
 */
export default function OfferGroupCard({ group, isUnconfirmedBucket = false, groupIndex = 1 }) {
  const offers = group?.offers || [];
  if (!offers.length) return null;

  const headerTitle = isUnconfirmedBucket
    ? 'Observaciones históricas sin base confirmada (unconfirmed_legacy_basis)'
    : `Grupo comparable #${groupIndex}`;

  const unitName = group.purchase_unit?.name || group.purchase_unit?.code || 'Unidad';

  return (
    <section
      className={`group-card ${isUnconfirmedBucket ? 'is-legacy' : ''}`}
      aria-labelledby={`offer-group-${groupIndex}`}
    >
      <div className="group-head">
        <div className="group-head-top">
          <div>
            <span className="eyebrow">
              {isUnconfirmedBucket ? 'Base No Confirmada' : `Grupo #${groupIndex} — Parámetros Idénticos`}
            </span>
            <h2 id={`offer-group-${groupIndex}`} style={{ marginTop: '0.25rem' }}>
              {headerTitle}
            </h2>
            <p style={{ marginTop: '0.25rem' }}>
              {isUnconfirmedBucket
                ? 'Registros históricos previos sin declaración confirmada de presentación. Se exhiben como antecedente documental y no deben ordenarse por precio.'
                : 'Todas las ofertas de esta tabla comparten unidad, empaque, divisa y régimen de impuesto. El servidor no asigna ganador automático y ningún precio garantiza tarifa actual en mostrador.'}
            </p>
          </div>
          <StatusBadge
            customLabel={isUnconfirmedBucket ? 'Sin ranking (Legacy)' : `${offers.length} oferta(s) comparables`}
            toneOverride={isUnconfirmedBucket ? 'warning' : 'accent'}
          />
        </div>

        {!isUnconfirmedBucket ? (
          <div className="group-specs">
            <div className="group-spec">
              <span>Unidad de compra</span>
              <b>{unitName}</b>
            </div>
            <div className="group-spec">
              <span>Empaque (pack_quantity)</span>
              <b className="mono">{group.pack_quantity}</b>
            </div>
            <div className="group-spec">
              <span>Moneda</span>
              <b className="mono">{group.currency_code}</b>
            </div>
            <div className="group-spec">
              <span>Tratamiento fiscal</span>
              <b>{group.price_includes_tax ? 'Impuesto incluido' : 'Sin impuesto incluido'}</b>
            </div>
          </div>
        ) : null}

        <div className="group-key">
          <strong>Identificador técnico del grupo:</strong>{' '}
          <code>{isUnconfirmedBucket ? 'null' : group.comparison_group}</code>
        </div>
      </div>

      <div className="table-scroll" style={{ border: 'none', borderRadius: 0 }}>
        <table className="offer-table">
          <thead>
            <tr>
              <th scope="col">Proveedor y Artículo</th>
              <th scope="col">Condiciones y Entrega</th>
              <th scope="col">Precio Observado</th>
              <th scope="col">Fecha y Antigüedad</th>
              <th scope="col">Procedencia y Vigencia</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => {
              const freshnessInfo = describeFreshness(offer.freshness);
              const supplierName =
                offer.supplier?.trade_name ||
                offer.supplier?.legal_name ||
                `Proveedor #${offer.supplier?.supplier_id ?? '—'}`;
              const unitText = offer.purchase_unit
                ? `${offer.purchase_unit.name} (${offer.purchase_unit.code})`
                : 'Unidad base';

              return (
                <tr key={offer.price_observation_id || `${offer.supplier_product_id}-${offer.observed_at}`}>
                  <td data-label="Proveedor y Artículo">
                    <div className="offer-supplier">{supplierName}</div>
                    {offer.supplier?.legal_name && offer.supplier?.trade_name ? (
                      <div className="offer-sub">Razón: {offer.supplier.legal_name}</div>
                    ) : null}
                    <div style={{ marginTop: '0.4rem', fontWeight: 600, fontSize: '0.86rem' }}>
                      {offer.supplier_product_name}
                    </div>
                    <div className="mono" style={{ fontSize: '0.74rem', color: 'var(--steel)' }}>
                      SKU Proveedor: {offer.supplier_sku || '—'} · Equiv #{offer.supplier_product_id}
                    </div>
                  </td>

                  <td data-label="Condiciones y Entrega">
                    <div className="offer-lines">
                      <div>
                        <span>Presentación:</span>
                        <b>{unitText}</b>
                      </div>
                      <div>
                        <span>Unidades x empaque:</span>
                        <b>{offer.pack_quantity}</b>
                      </div>
                      <div>
                        <span>Mínimo de compra:</span>
                        <b>{offer.minimum_order_quantity ?? '1.000'}</b>
                      </div>
                      <div>
                        <span>Plazo de entrega:</span>
                        <b>
                          {offer.lead_time_days !== null && offer.lead_time_days !== undefined
                            ? `${offer.lead_time_days} día(s)`
                            : 'No reportado'}
                        </b>
                      </div>
                      <div>
                        <span>Existencia observada:</span>
                        <b>
                          {offer.available_quantity !== null && offer.available_quantity !== undefined
                            ? `${offer.available_quantity} u.`
                            : 'No declarada'}
                        </b>
                      </div>
                    </div>
                  </td>

                  <td data-label="Precio Observado">
                    <div className="price">
                      <small>{offer.currency_code}</small>
                      {offer.unit_price}
                    </div>
                    <div style={{ marginTop: '0.35rem' }}>
                      <span className={`badge ${offer.price_includes_tax ? 'badge-accent' : 'badge-warning'}`}>
                        {offer.price_includes_tax ? 'Impuesto incluido' : 'Más impuestos'}
                      </span>
                    </div>
                    <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--steel)', marginTop: '0.35rem' }}>
                      Base: {offer.price_basis}
                    </div>
                  </td>

                  <td data-label="Fecha y Antigüedad">
                    <div className="mono" style={{ fontWeight: 650, fontSize: '0.84rem' }}>
                      {formatUtcDateTime(offer.observed_at)}
                    </div>
                    <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--steel)', margin: '0.2rem 0 0.35rem' }}>
                      {formatAgeSeconds(offer.age_seconds)} ({offer.age_seconds ?? '—'} s)
                    </div>
                    <StatusBadge customLabel={freshnessInfo.label} toneOverride={freshnessInfo.tone} />
                    <div style={{ fontSize: '0.74rem', color: 'var(--steel)', marginTop: '0.3rem', maxWidth: '24ch' }}>
                      {freshnessInfo.explanation}
                    </div>
                  </td>

                  <td data-label="Procedencia y Vigencia">
                    <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>
                      {offer.source?.source_name || 'Fuente interna'}
                    </div>
                    <div className="mono" style={{ fontSize: '0.74rem', color: 'var(--steel)' }}>
                      Tipo: {offer.source?.source_type || '—'} · Obs #{offer.price_observation_id}
                    </div>

                    {offer.source_product_url ? (
                      <div style={{ marginTop: '0.35rem' }}>
                        <a
                          href={offer.source_product_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mono"
                          style={{ fontSize: '0.74rem', color: 'var(--signal-strong)', wordBreak: 'break-all' }}
                        >
                          Enlace de procedencia ↗
                        </a>
                      </div>
                    ) : null}

                    <div style={{ marginTop: '0.45rem' }}>
                      <span className="badge badge-warning" title="No existe garantía de precio actual">
                        Vigencia actual garantizada: {String(Boolean(offer.is_current_price_guaranteed))}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
