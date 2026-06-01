const TL = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  minimumFractionDigits: 2,
});

const DECIMAL = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const DECIMAL4 = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

const PERCENT = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: 'always',
});

const VOLUME = new Intl.NumberFormat('tr-TR', {
  notation: 'compact',
  compactDisplay: 'short',
});

const INTEGER = new Intl.NumberFormat('tr-TR', {
  maximumFractionDigits: 0,
});

const USD = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

export function formatTL(value: number): string {
  return TL.format(value);
}

export function formatUSD(value: number): string {
  return USD.format(value);
}

export function formatDecimal(value: number): string {
  return DECIMAL.format(value);
}

export function formatDecimal4(value: number): string {
  return DECIMAL4.format(value);
}

export function formatPercent(value: number): string {
  return `%${PERCENT.format(value)}`;
}

export function formatVolume(value: number): string {
  return VOLUME.format(value);
}

export function formatInteger(value: number): string {
  return INTEGER.format(value);
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}
