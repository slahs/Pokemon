export function AppLogo({ size = 32 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block shrink-0 rounded-[11px]"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg, oklch(0.8 0.14 200), oklch(0.7 0.19 340))",
        boxShadow: "0 0 22px oklch(0.7 0.18 320 / 0.55)",
      }}
    />
  );
}
