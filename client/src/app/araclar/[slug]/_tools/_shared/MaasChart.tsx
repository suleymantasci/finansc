'use client';

import type { MaasResult, MaasLineItem } from './maas-engine';
import { fmtTL } from './maas-engine';

// ── Brütten Nete Maaş Dağılımı (Donut + Bar) ──────────────────────
//
// Dependency-free saf SVG. Donut: net maaş vs her kesintinin payı.
// Bar: brüt / net / işveren maliyeti karşılaştırma.

export function MaasChart({ result, showEmployer }: { result: MaasResult; showEmployer: boolean }) {
  // Kesintileri ayıkla
  const deductions: { label: string; amount: number }[] = result.lines
    .filter((l) => l.kind === 'deduction' && l.amount > 0)
    .map((l) => ({ label: l.label, amount: l.amount }));

  const totalDeduction = deductions.reduce((s, d) => s + d.amount, 0);
  const total = result.net + totalDeduction;
  const size = 200;
  const radius = 80;
  const strokeWidth = 32;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Renk paleti (her kesinti için)
  const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#06b6d4', '#3b82f6', '#8b5cf6'];

  // Segmentler
  let offset = 0;
  const segments = deductions.map((d, i) => {
    const percent = total > 0 ? d.amount / total : 0;
    const dashLength = circumference * percent;
    const segment = {
      ...d,
      percent,
      color: colors[i % colors.length],
      dashArray: `${dashLength} ${circumference - dashLength}`,
      dashOffset: -offset,
    };
    offset += dashLength;
    return segment;
  });

  // Net dilimi (kalan yay)
  const netPercent = total > 0 ? result.net / total : 0;
  const netDashArray = `${circumference * netPercent} ${circumference}`;
  const netDashOffset = -offset;

  return (
    <div className="w-full space-y-6">
      {/* Donut Chart — Kesinti Dağılımı */}
      <div className="atlas-card p-4">
        <h3 className="text-sm font-semibold mb-3">Net Maaş Dağılımı</h3>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
            <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
            {segments.map((s, i) => (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={strokeWidth}
                strokeDasharray={s.dashArray}
                strokeDashoffset={s.dashOffset}
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            ))}
            {netPercent > 0 && (
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke="#10b981"
                strokeWidth={strokeWidth}
                strokeDasharray={netDashArray}
                strokeDashoffset={netDashOffset}
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            )}
            <text x={cx} y={cy - 5} textAnchor="middle" className="fill-foreground text-xs font-medium">
              Net
            </text>
            <text x={cx} y={cy + 15} textAnchor="middle" className="fill-foreground text-base font-bold tabular-nums">
              {fmtTL(result.net, 0)}
            </text>
          </svg>
          <div className="flex-1 space-y-1.5 w-full">
            <LegendRow color="#10b981" label="Net Maaş" amount={result.net} percent={netPercent} />
            {segments.map((s, i) => (
              <LegendRow key={i} color={s.color} label={s.label} amount={s.amount} percent={s.percent} />
            ))}
          </div>
        </div>
      </div>

      {/* Bar Chart — Brüt / Net / İşveren Karşılaştırma */}
      <div className="atlas-card p-4">
        <h3 className="text-sm font-semibold mb-3">Brüt / Net / İşveren Karşılaştırması</h3>
        <div className="space-y-2.5">
          <BarRow label="Brüt Maaş" amount={result.gross} max={showEmployer ? result.totalEmployerCost : result.gross} color="#3b82f6" />
          <BarRow label="Net Maaş" amount={result.net} max={showEmployer ? result.totalEmployerCost : result.gross} color="#10b981" />
          {showEmployer && (
            <BarRow
              label="İşveren Maliyeti"
              amount={result.totalEmployerCost}
              max={result.totalEmployerCost}
              color="#f97316"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function LegendRow({ color, label, amount, percent }: { color: string; label: string; amount: number; percent: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: color }} />
      <span className="flex-1 truncate text-muted-foreground">{label}</span>
      <span className="num font-semibold">{fmtTL(amount, 0)}</span>
      <span className="text-muted-foreground tabular-nums w-12 text-right">%{((percent * 100)).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
    </div>
  );
}

function BarRow({ label, amount, max, color }: { label: string; amount: number; max: number; color: string }) {
  const percent = max > 0 ? (amount / max) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-medium">{label}</span>
        <span className="num font-semibold">{fmtTL(amount, 0)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
