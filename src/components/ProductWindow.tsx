/**
 * The frame every product surface is drawn in: a title bar, the path the surface lives at, a state
 * chip, the surface itself, and a foot that says what was counted and where to go next.
 *
 * It exists so that a panel showing live data reads as software sitting on the page rather than as
 * an illustration of software. Nothing about it is a picture: what goes inside is text and tables,
 * selectable, searchable and readable by a screen reader.
 *
 * One rule it enforces by having no way to break it: a window never contains a form control. These
 * are surfaces showing what the product does, and a select nobody can submit is a trap for anybody
 * arriving by keyboard.
 *
 * Built for the product-led candidate home page, and lifted out of it when that direction was
 * chosen.
 */

export function ProductWindow({
  title,
  path,
  chip,
  tilt,
  children,
  foot,
}: {
  title: string;
  /** The route this surface really lives at, shown in the bar as a path. */
  path?: string;
  /** A state label, right-aligned in the bar. "live" on anything read at render time. */
  chip?: string;
  /** A degree of rotation, applied only at desktop widths and only without reduced motion. */
  tilt?: "left" | "right";
  children: React.ReactNode;
  foot?: React.ReactNode;
}) {
  const tiltClass = tilt === "left" ? " tilt-l" : tilt === "right" ? " tilt-r" : "";
  return (
    <div className={`win${tiltClass}`}>
      <div className="win-bar">
        <span className="win-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="win-title">{title}</span>
        {path && <code className="win-path">{path}</code>}
        {chip && <span className="chip live">{chip}</span>}
      </div>
      <div className="win-body">{children}</div>
      {foot && <div className="win-foot">{foot}</div>}
    </div>
  );
}

/**
 * What a panel shows where a figure or a row would be, when the platform could not be read.
 *
 * The site's oldest rule, in one component: a count that cannot be read is omitted, never shown as
 * zero. A zero nobody can stand behind is printed at exactly the moment it is most likely to be
 * wrong.
 */
export function Unreachable({ what }: { what: string }) {
  return (
    <p className="win-unreach">
      {what} could not be read from the API on this request, so nothing is shown here rather than a
      number nobody can stand behind.
    </p>
  );
}
