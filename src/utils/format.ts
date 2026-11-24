const SUFFIXES = ["", "K", "M", "B", "T"];

function trimDecimals(value: number): string {
  return value.toFixed(2).replace(/\.?0+$/, "");
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value);

  const sign = value < 0 ? "-" : "";
  let scaled = Math.abs(value);
  let suffixIndex = 0;

  while (scaled >= 1000 && suffixIndex < SUFFIXES.length - 1) {
    scaled /= 1000;
    suffixIndex += 1;
  }

  scaled = Number(scaled.toFixed(2));
  if (scaled >= 1000 && suffixIndex < SUFFIXES.length - 1) {
    scaled /= 1000;
    suffixIndex += 1;
  }

  return `${sign}${trimDecimals(scaled)}${SUFFIXES[suffixIndex]}`;
}
