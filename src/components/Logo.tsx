import { site } from "@/lib/site";

type LogoProps = {
  size?: number;
  className?: string;
  tone?: "default" | "inverse";
  style?: React.CSSProperties;
};

export function Logo({ size = 28, className = "", tone = "default", style }: LogoProps) {
  return (
    <span
      className={`logo ${tone === "inverse" ? "logo--inverse" : ""} ${className}`}
      style={{ fontSize: `${size}px`, ...style }}
      role="img"
      aria-label={site.name}
    >
      <span className="logo__mark">destaque</span>
      <span className="logo__ext">.ai</span>
    </span>
  );
}
