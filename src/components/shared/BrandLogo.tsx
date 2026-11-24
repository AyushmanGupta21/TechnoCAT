// Official TechnoCAT (Techno India Group) logo. Use this component everywhere the brand
// mark appears so the asset, alt text and aspect ratio stay consistent.
//
// Asset: public/brand/technocat-logo.png (trimmed from "TechnoCAT Corporate Logo.png",
// transparent background, intended for light backgrounds).

import styles from "./BrandLogo.module.css";

export const BRAND_LOGO_SRC = "/brand/technocat-logo.png";
const LOGO_WIDTH = 900;
const LOGO_HEIGHT = 569;

interface BrandLogoProps {
  /** Rendered height in px; width follows the logo's aspect ratio. */
  height?: number;
  className?: string;
}

export default function BrandLogo({ height = 64, className }: BrandLogoProps) {
  const width = Math.round((height * LOGO_WIDTH) / LOGO_HEIGHT);
  return (
    // Plain <img> keeps the logo crisp and avoids an image-optimizer round trip for a
    // small, already-optimized static asset; width/height prevent layout shift.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={BRAND_LOGO_SRC}
      alt="TechnoCAT by Techno India Group"
      width={width}
      height={height}
      className={className ? `${styles.logo} ${className}` : styles.logo}
      style={{ height, width }}
      decoding="async"
    />
  );
}
