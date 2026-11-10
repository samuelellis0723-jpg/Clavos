import React from 'react';
import { describeDocumentStatus } from '../features/formatters.js';

export default function StatusBadge({ status, customLabel, toneOverride }) {
  const info = describeDocumentStatus(status);
  const tone = toneOverride || info.tone;
  const label = customLabel || info.label;

  const toneClass =
    tone === 'success'
      ? 'badge-success'
      : tone === 'warning'
      ? 'badge-warning'
      : tone === 'danger'
      ? 'badge-danger'
      : tone === 'accent'
      ? 'badge-accent'
      : '';

  return <span className={`badge ${toneClass}`}>{label}</span>;
}
