/** Zufallsfunktion, liefert Werte in [0, 1). */
export type Rng = () => number;

/** Kryptografisch bessere Zufallsquelle fuer die Produktion. */
export function createCryptoRng(): Rng {
  return () => {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return (buf[0] ?? 0) / 4294967296;
  };
}

/** Deterministischer RNG (mulberry32) fuer reproduzierbare Tests. */
export function createSeededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
