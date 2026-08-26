export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function clamp(v: number, min = 0, max = 1): number {
  return Math.min(Math.max(v, min), max)
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

const INR = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

export function inr(n: number): string {
  return '₹' + INR.format(Math.round(n))
}

export function compact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1) + 'k'
  return String(Math.round(n))
}

export function pct(n: number, digits = 0): string {
  return n.toFixed(digits) + '%'
}
