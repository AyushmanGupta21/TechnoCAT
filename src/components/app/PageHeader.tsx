// Shared page header for signed-in pages: the same banner as the dashboard's "Today's plan".
// Usage:
//   <PageHeader
//     eyebrow="Course library"                 // optional small mono chip above the title
//     title="What do you want to"               // plain part of the title
//     accent="learn today?"                     // optional gradient part, underlined with a drawn stroke
//     subtitle="One line that says what this page is for."
//     actions={<Link className={pageHeaderStyles.primaryAction} href="/browse">Browse</Link>}
//     aside={<YourStatsOrSearch />}             // optional right-side block (stats, search); stacks on mobile
//     watermark="96"                            // optional outlined figure behind the content
//   />
// Buttons: use the exported classes pageHeaderStyles.primaryAction / .secondaryAction for a consistent look.

import type { ReactNode } from "react";
import { Reveal, GradientText, Doodle } from "@/components/landing/motion";
import styles from "./PageHeader.module.css";

export { styles as pageHeaderStyles };

type PageHeaderProps = {
  title: ReactNode;
  accent?: ReactNode;
  subtitle?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  watermark?: string;
  className?: string;
};

export default function PageHeader({ title, accent, subtitle, eyebrow, actions, aside, watermark, className }: PageHeaderProps) {
  return (
    <Reveal className={`${styles.header} ${aside ? styles.withAside : ""} ${className ?? ""}`} y={16}>
      {watermark && (
        <span className={styles.watermark} aria-hidden="true">
          {watermark}
        </span>
      )}
      <div className={styles.text}>
        {eyebrow && (
          <p className={styles.eyebrow}>
            <span className={styles.dot} aria-hidden="true" />
            {eyebrow}
          </p>
        )}
        <h1 className={styles.title}>
          {title}
          {accent && (
            <>
              {" "}
              <span className={styles.accent}>
                <GradientText>{accent}</GradientText>
                <Doodle kind="underline" className={styles.underline} color="var(--data-cyan)" strokeWidth={3} delay={0.45} />
              </span>
            </>
          )}
        </h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        {/* With an aside, actions sit under the subtitle; without one they go to the right (like the dashboard) */}
        {actions && aside && <div className={styles.actions}>{actions}</div>}
      </div>
      {aside && <div className={styles.aside}>{aside}</div>}
      {actions && !aside && <div className={`${styles.actions} ${styles.actionsRight}`}>{actions}</div>}
    </Reveal>
  );
}
