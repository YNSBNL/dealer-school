import { memo } from "react";
import Link from "next/link";

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export const PageContainer = memo(function PageContainer({
  children,
  className = "",
  style,
  padded = true,
  density = "default",
}) {
  return (
    <main
      className={joinClasses(
        "cp-container",
        "cp-page-container",
        density === "comfortable" ? "cp-page-container-comfortable" : "",
        className
      )}
      style={{ paddingTop: padded ? 28 : 0, paddingBottom: padded ? 56 : 0, ...style }}
    >
      {children}
    </main>
  );
});

export const Button = memo(function Button({
  children,
  variant = "primary",
  href,
  className = "",
  style,
  block = false,
  ...props
}) {
  const buttonClass = joinClasses(
    variant === "secondary"
      ? "cp-button-secondary"
      : variant === "ghost"
        ? "cp-button-ghost"
        : "cp-button",
    className
  );
  const mergedStyle = block ? { width: "100%", ...style } : style;

  if (href) {
    return (
      <Link href={href} className={buttonClass} style={mergedStyle} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button className={buttonClass} style={mergedStyle} {...props}>
      {children}
    </button>
  );
});

export const Card = memo(function Card({
  children,
  className = "",
  style,
  padded = "lg",
  tone = "default",
  ...props
}) {
  const padClass = padded === "md" ? "cp-panel" : padded === "none" ? "" : "cp-panel-lg";
  return (
    <section
      className={joinClasses(
        "cp-card",
        tone === "elevated" ? "cp-card-elevated" : "",
        tone === "muted" ? "cp-card-muted" : "",
        padClass,
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </section>
  );
});

export const Input = memo(function Input({
  label,
  hint,
  textarea = false,
  className = "",
  inputClassName = "",
  style,
  ...props
}) {
  const Control = textarea ? "textarea" : "input";

  return (
    <div className={joinClasses("cp-field", className)} style={style}>
      {label ? <label className="cp-label">{label}</label> : null}
      <Control className={joinClasses(textarea ? "cp-textarea" : "cp-input", inputClassName)} {...props} />
      {hint ? <div className="cp-field-hint">{hint}</div> : null}
    </div>
  );
});

export const Select = memo(function Select({
  label,
  hint,
  options = [],
  className = "",
  selectClassName = "",
  style,
  ...props
}) {
  return (
    <div className={joinClasses("cp-field", className)} style={style}>
      {label ? <label className="cp-label">{label}</label> : null}
      <select className={joinClasses("cp-select", selectClassName)} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? <div className="cp-field-hint">{hint}</div> : null}
    </div>
  );
});

export const Badge = memo(function Badge({ children, tone = "default", className = "", style, ...props }) {
  const toneStyle = tone === "pill"
    ? { borderColor: "var(--line)", background: "var(--surface-2)", color: "var(--text)" }
    : {};

  return (
    <div className={joinClasses(tone === "pill" ? "cp-pill" : "cp-badge", className)} style={{ ...toneStyle, ...style }} {...props}>
      {children}
    </div>
  );
});

export const SectionHeader = memo(function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  align = "default",
  className = "",
  style,
}) {
  return (
    <div className={joinClasses("cp-section-head", className)} style={style}>
      <div style={{ textAlign: align === "center" ? "center" : undefined, maxWidth: description ? 720 : undefined }}>
        {eyebrow ? <div className="cp-section-eyebrow">{eyebrow}</div> : null}
        {title ? <h2 className="cp-section-title">{title}</h2> : null}
        {description ? <p className="cp-subtitle" style={{ marginTop: 10 }}>{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
});

export const StatCard = memo(function StatCard({
  value,
  label,
  accent = false,
  className = "",
  style,
  children,
}) {
  return (
    <div className={joinClasses("cp-kpi", className)} style={style}>
      <span className={joinClasses("cp-kpi-value", accent ? "cp-gold" : "")}>{value}</span>
      <span className="cp-kpi-label">{label}</span>
      {children ? <div style={{ marginTop: 10 }}>{children}</div> : null}
    </div>
  );
});

export const ProgressCard = memo(function ProgressCard({
  title,
  subtitle,
  progress = 0,
  status,
  value,
  meta,
  action,
  className = "",
  style,
  children,
}) {
  return (
    <Card className={joinClasses("cp-progress-card", className)} padded="md" style={style}>
      <div className="cp-progress-card-head">
        <div>
          {title ? <div className="cp-progress-card-title">{title}</div> : null}
          {subtitle ? <div className="cp-progress-card-subtitle">{subtitle}</div> : null}
        </div>
        {status ? <Badge tone="pill">{status}</Badge> : null}
      </div>

      <div className="cp-progress-card-value-row">
        {value ? <strong className="cp-progress-card-value">{value}</strong> : null}
        {meta ? <div className="cp-progress-card-meta">{meta}</div> : null}
      </div>

      <div className="cp-progress" style={{ marginTop: 14 }}>
        <span style={{ width: `${Math.min(100, progress)}%` }} />
      </div>

      {children ? <div className="cp-progress-card-body">{children}</div> : null}
      {action ? <div className="cp-progress-card-action">{action}</div> : null}
    </Card>
  );
});

export const EmptyState = memo(function EmptyState({
  title = "Aucune donnee",
  description,
  action,
  className = "",
  style,
}) {
  return (
    <div className={joinClasses("cp-empty", className)} style={style}>
      <div style={{ fontWeight: 700 }}>{title}</div>
      {description ? <div style={{ marginTop: 8 }}>{description}</div> : null}
      {action ? <div style={{ marginTop: 14 }}>{action}</div> : null}
    </div>
  );
});

export const LoadingState = memo(function LoadingState({
  title = "Chargement...",
  description,
  className = "",
  style,
}) {
  return (
    <div className={joinClasses("cp-empty cp-loading-state", className)} style={style}>
      <div className="cp-loading-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div style={{ fontWeight: 700 }}>{title}</div>
      {description ? <div style={{ marginTop: 8 }}>{description}</div> : null}
    </div>
  );
});

export const ErrorState = memo(function ErrorState({
  title = "Une erreur est survenue",
  description,
  className = "",
  style,
  tone = "error",
}) {
  return (
    <div className={joinClasses("cp-alert", tone === "info" ? "cp-alert-info" : "", className)} style={style}>
      <div style={{ fontWeight: 700 }}>{title}</div>
      {description ? <div style={{ marginTop: 8 }}>{description}</div> : null}
    </div>
  );
});
