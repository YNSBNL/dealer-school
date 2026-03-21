import Image from "next/image";

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export default function MediaFrame({
  src,
  alt,
  ratio = "mockup",
  priority = false,
  sizes = "(max-width: 780px) 100vw, 50vw",
  className = "",
  imageClassName = "",
  style,
}) {
  return (
    <div className={joinClasses("cp-media-frame", `cp-media-frame-${ratio}`, className)} style={style}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={joinClasses("cp-media-frame-image", imageClassName)}
      />
    </div>
  );
}
