/** Theme-aware colors for inline styles; values live in index.css (--adm-*). */
const t = (name: string) => `hsl(var(--adm-${name}))`;

export const adm = {
  bg: t("bg"),
  surface: t("surface"),
  surface2: t("surface-2"),
  border: t("border"),
  text: t("text"),
  text2: t("text-2"),
  muted: t("muted"),
  gold: t("gold"),
  success: t("success"),
  info: t("info"),
  warn: t("warn"),
  danger: t("danger"),
  successSoft: t("success-soft"),
  dangerSoft: t("danger-soft"),
  warnSoft: t("warn-soft"),
  infoSoft: t("info-soft"),
  goldSoft: t("gold-soft"),
  goldTint: "hsl(var(--adm-gold) / 0.15)",
  successTint: "hsl(var(--adm-success) / 0.15)",
  overlay: "rgba(0,0,0,0.55)",
} as const;
