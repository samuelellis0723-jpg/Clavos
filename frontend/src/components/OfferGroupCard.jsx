import React from 'react';
import StatusBadge from './StatusBadge.jsx';
import { formatUtcDateTime, formatAgeSeconds, describeFreshness } from '../features/formatters.js';

/**
 * Renders a group of compatible supplier offers (identical comparison_group)
 * or the unconfirmed legacy basis bucket without mixing currencies, units, pack sizes, or taxes.
 */
export default function OfferGroupCard({ group, isUnconfirmedBucket = false, groupIndex = 1 }) {
  const offers = group?.offers || [];
  if (!offers.length) return null;

  const headerTitle = isUnconfirmedBucket
    ? 'Observaciones históricas sin base de presentación confirmada (unconfirmed_legacy_basis)'
    : `Grupo comparable #${groupIndex}: ${group.purchase_unit?.name || group.purchase_unit?.code || 'Unidad'} | Empaque ${group.pack_quantity} | Moneda ${group.currency_code} | ${
        group.price_includes_tax ? 'Impuesto incluido' : 'Sin impuesto incluido'
      }`;

  return (
    <section className="section-block" aria-labelledby={`offer-group-${groupIndex}`}>
      <div className="section-header">
        <div>
          <span className="folio-num">
            {isUnconfirmedBucket
              ? 'GRUPO NO COMPARABLE — BASE LEGACY'
              : `COMPARISON_GROUP: ${group.comparison_group}`}
          </span>
          <h3 id={`offer-group-${groupIndex}`} style={{ fontSize: '1.1rem', marginTop: '0.25rem' }}>
            {headerTitle}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--ink-secondary)', marginTop: '0.25rem' }}>
            {isUnconfirmedBucket
              ? 'Estas observaciones provienen de registros previos sin declaración confirmada de price_basis=per_purchase_unit. Se exhiben como referencia documental y no deben compararse ni ordenarse por precio.'
              : 'Todas las ofertas de esta tabla comparten unidad de compra, cantidad por presentación (pack_quantity), moneda y tratamiento fiscal. Aun dentro del mismo grupo, el servidor establece ranking="none" y ningún precio observado garantiza vigencia actual.'}
          </p>
        </div>
        <StatusBadge
          customLabel={isUnconfirmedBucket ? 'Sin ranking (Legacy)' : `${offers.length} oferta(s) en este grupo`}
          toneOverride={isUnconfirmedBucket ? 'warning' : 'accent'}
        />
      </div>

      <div className="table-scroll" style={{ border: 'none' }}>
        <table className="swiss-table">
          <thead>
            <tr>
              <th>Proveedor y Equivalente</th>
              <th>Presentación y Condiciones</th>
              <th>Precio Observado (Por unidad compra)</th>
              <th>Fecha, Antigüedad y Frescura</th>
              <th>Fuente y Garantía</th>
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
                : 'Unidad registrada';

              return (
                <tr key={offer.price_observation_id || `${offer.supplier_product_id}-${offer.observed_at}`}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{supplierName}</div>
                    {offer.supplier?.legal_name && offer.supplier?.trade_name ? (
                      <div style={{ fontSize: '0.78rem', color: 'var(--ink-secondary)' }}>
                        Razón social: {offer.supplier.legal_name}
                      </div>
                    ) : null}
                    <div className="mono" style={{ fontSize: '0.78rem', marginTop: '0.25rem' }}>
                      Equivalente #{offer.supplier_product_id}: <strong>{offer.supplier_product_name}</strong>
                    </div>
                    <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--ink-secondary)' }}>
                      SKU Proveedor: {offer.supplier_sku || '—'}
                    </div>
                  </td>

                  <td className="mono" style={{ fontSize: '0.8125rem' }}>
                    <div>
                      <strong>Unidad compra:</strong> {unitText}
                    </div>
                    <div>
                      <strong>pack_quantity:</strong> {offer.pack_quantity}
                    </div>
                    <div>
                      <strong>Mín. compra:</strong> {offer.minimum_order_quantity ?? 'No especificado'}
                    </div>
                    <div>
                      <strong>Plazo entrega:</strong>{' '}
                      {offer.lead_time_days !== null && offer.lead_time_days !== undefined
                        ? `${offer.lead_time_days} día(s)`
                        : 'No especificado'}
                    </div>
                    <div>
                      <strong>Cant. observada:</strong>{' '}
                      {offer.available_quantity !== null && offer.available_quantity !== undefined
                        ? `${offer.available_quantity} u.`
                        : 'No reportada'}
                    </div>
                  </td>

                  <td className="mono">
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink-primary)' }}>
                      {offer.currency_code} {offer.unit_price}
                    </div>
                    <div style={{ marginTop: '0.25rem' }}>
                      <span className={`badge ${offer.price_includes_tax ? 'badge-accent' : 'badge-warning'}`}>
                        {offer.price_includes_tax ? 'Impuesto incluido' : 'Más impuestos'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ink-secondary)', marginTop: '0.35rem' }}>
                      Base: {offer.price_basis}
                    </div>
                  </td>

                  <td>
                    <div className="mono" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                      {formatUtcDateTime(offer.observed_at)}
                    </div>
                    <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--ink-secondary)', marginBottom: '0.35rem' }}>
                      Edad: {formatAgeSeconds(offer.age_seconds)} ({offer.age_seconds} s)
                    </div>
                    <StatusBadge customLabel={freshnessInfo.label} toneOverride={freshnessInfo.tone} />
                    <div style={{ fontSize: '0.75rem', color: 'var(--ink-secondary)', marginTop: '0.25rem' }}>
                      {freshnessInfo.explanation}
                    </div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      {offer.source?.source_name || 'Fuente registrada'}
                    </div>
                    <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--ink-secondary)' }}>
                      Tipo: {offer.source?.source_type || '—'} | Obs #{offer.price_observation_id}
                    </div>
                    {offer.source_product_url ? (
                      <div style={{ marginTop: '0.35rem' }}>
                        <a
                          href={offer.source_product_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mono"
                          style={{ fontSize: '0.75rem', color: 'var(--accent-klein)' }}
                        >
                          Ver URL de procedencia declarada
                        </a>
                      </div>
                    ) : null}
                    <div style={{ marginTop: '0.45rem' }}>
                      <span className="badge badge-warning">
                        Vigencia garantizada: {String(Boolean(offer.is_current_price_guaranteed))}
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
