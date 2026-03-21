import MediaFrame from "@/components/MediaFrame";
import { Badge, Card } from "@/components/ui";

export default function AssetPanel({
  src,
  alt,
  eyebrow,
  title,
  description,
  badges = [],
  priority = false,
  ratio = "mockup",
  sizes = "(max-width: 780px) 100vw, 50vw",
  className = "",
  style,
}) {
  return (
    <Card padded="md" tone="elevated" className={`cp-asset-panel ${className}`.trim()} style={style}>
      {(eyebrow || title || description) ? (
        <div className="cp-asset-panel-copy">
          {eyebrow ? <div className="cp-section-eyebrow">{eyebrow}</div> : null}
          {title ? <div className="cp-asset-panel-title">{title}</div> : null}
          {description ? <div className="cp-muted">{description}</div> : null}
        </div>
      ) : null}

      <MediaFrame src={src} alt={alt} ratio={ratio} priority={priority} sizes={sizes} className="cp-asset-panel-media" />

      {badges.length ? (
        <div className="cp-asset-panel-badges">
          {badges.map((badge) => <Badge key={badge} tone="pill">{badge}</Badge>)}
        </div>
      ) : null}
    </Card>
  );
}
