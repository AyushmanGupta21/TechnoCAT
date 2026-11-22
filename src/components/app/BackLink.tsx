"use client";

// "Back to …" link shown at the top of pages that live under a hub (e.g. Intelligence Hub tools).

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "./BackLink.module.css";

export default function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className={styles.back}>
      <span className={styles.icon} aria-hidden="true">
        <ArrowLeft size={16} strokeWidth={2} />
      </span>
      {label}
    </Link>
  );
}
