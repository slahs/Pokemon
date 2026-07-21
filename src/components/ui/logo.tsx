/** Eigenständiges Logo: abstrakter Kartenstapel mit Bilanzkurve. */
export function AppLogo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      role="img"
    >
      <rect x="7" y="5" width="16" height="22" rx="2.5" fill="#262040" stroke="#8fb6ff" />
      <rect x="10" y="3" width="16" height="22" rx="2.5" fill="#131020" stroke="#c9a3ff" />
      <path
        d="M13 18 L17 13 L20 15.5 L23 9"
        stroke="#7fe8c3"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
