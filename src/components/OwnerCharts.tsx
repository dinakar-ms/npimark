/**
 * The two charts on the business dashboard, drawn by hand in SVG.
 *
 * No charting library. Two reasons, and the second is the real one: a dependency that renders
 * thirty bars is a dependency to patch forever, and a library chart cannot be told to take its
 * colours from the site's own custom properties - which is what makes these legible in both the
 * light and the dark theme without a second palette. Every stroke and fill below is a `var(--…)`
 * that `globals.css` already defines for both.
 *
 * Both charts are sized in a `viewBox` and styled `width: 100%; height: auto`, so they scale
 * with the panel rather than needing a breakpoint, and they stay readable at phone width.
 *
 * They are also pictures, so each carries `role="img"` and an `aria-label` that states the
 * series in words - the peak, the total and the window. A screen reader gets the shape of the
 * data rather than a list of thirty unlabelled rectangles, and the figure it reads is the same
 * number the tile beside it prints.
 */

const BAR_W = 720;
const BAR_H = 150;
/* The peak line's own band. It was 12, which put the label's baseline four units above the dashed
   rule and its descenders straight through it - "2 a day" was drawn on the line it labels. */
const BAR_TOP = 22;
const BAR_BASE = 118;

function shortDay(iso: string): string {
  // "2026-09-23" -> "23 Sep". Built from the string rather than from a Date so the label cannot
  // slide a day either way in whatever zone the server happens to be in - the API already said
  // these are UTC days.
  const [, month, day] = iso.split("-");
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${Number(day)} ${names[Number(month) - 1] ?? month}`;
}

const count = (n: number) => n.toLocaleString("en-US");

/**
 * Sign-ups per day: one bar per UTC day, zero-filled by the API so the gaps are real gaps.
 *
 * A day with no sign-ups gets no bar at all rather than a one-pixel stub. The baseline is what
 * says "nothing happened here"; a stub would read as "something small happened", which is a
 * different claim about the business.
 */
export function SignupBars({
  points,
  window,
}: {
  points: { day: string; signups: number }[];
  window: string;
}) {
  if (points.length === 0) {
    return <p className="fine">No series was returned, so nothing is drawn.</p>;
  }
  const peak = Math.max(...points.map((point) => point.signups));
  const total = points.reduce((sum, point) => sum + point.signups, 0);
  const slot = BAR_W / points.length;
  const width = Math.max(slot * 0.62, 2);
  const height = BAR_BASE - BAR_TOP;
  const busiest = points.reduce((best, point) => (point.signups > best.signups ? point : best));

  const summary =
    peak === 0
      ? `Sign-ups per day over ${window}: none on any day.`
      : `Sign-ups per day over ${window}: ${count(total)} in total, busiest day ` +
        `${shortDay(busiest.day)} with ${count(busiest.signups)}.`;

  return (
    <svg
      className="chart"
      viewBox={`0 0 ${BAR_W} ${BAR_H}`}
      role="img"
      aria-label={summary}
      focusable="false"
    >
      {peak > 0 && (
        <>
          <line
            className="gridline"
            x1="0"
            y1={BAR_TOP}
            x2={BAR_W}
            y2={BAR_TOP}
            strokeDasharray="3 5"
          />
          <text className="chart-label" x="0" y={BAR_TOP - 9}>
            {count(peak)} a day
          </text>
        </>
      )}
      {points.map((point, index) => {
        if (point.signups <= 0) return null;
        const barHeight = Math.max((point.signups / peak) * height, 2);
        return (
          <rect
            key={point.day}
            className="bar"
            x={index * slot + (slot - width) / 2}
            y={BAR_BASE - barHeight}
            width={width}
            height={barHeight}
            rx="2"
          />
        );
      })}
      <line className="axis" x1="0" y1={BAR_BASE} x2={BAR_W} y2={BAR_BASE} />
      <text className="chart-label" x="0" y={BAR_BASE + 20}>
        {shortDay(points[0].day)}
      </text>
      <text className="chart-label" x={BAR_W} y={BAR_BASE + 20} textAnchor="end">
        {shortDay(points[points.length - 1].day)}
      </text>
    </svg>
  );
}

const SPARK_W = 300;
const SPARK_H = 56;
const SPARK_PAD = 5;

/**
 * One metered counter over the same days, as a filled line.
 *
 * Each sparkline is scaled to its own peak, because export rows run four orders of magnitude
 * above reveals and one shared scale would flatten the smaller series into the axis. The peak is
 * printed beside the line by the caller, so nobody reads two of these as the same size.
 */
export function Sparkline({ values, label }: { values: number[]; label: string }) {
  if (values.length === 0) return null;
  const peak = Math.max(...values);
  const plot = SPARK_H - SPARK_PAD * 2;
  const step = values.length > 1 ? (SPARK_W - SPARK_PAD * 2) / (values.length - 1) : 0;
  const x = (index: number) => SPARK_PAD + index * step;
  const y = (value: number) =>
    peak === 0 ? SPARK_H - SPARK_PAD : SPARK_H - SPARK_PAD - (value / peak) * plot;

  const line = values.map((value, index) => `${x(index)},${y(value)}`).join(" ");
  const area = `${SPARK_PAD},${SPARK_H - SPARK_PAD} ${line} ${x(values.length - 1)},${
    SPARK_H - SPARK_PAD
  }`;

  return (
    <svg
      className="chart spark"
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
      role="img"
      aria-label={
        peak === 0
          ? `${label}: none on any day in the window.`
          : `${label}: peak ${count(peak)} in a day, ${count(
              values.reduce((sum, value) => sum + value, 0),
            )} over the window.`
      }
      focusable="false"
    >
      {peak > 0 && <polygon className="area" points={area} />}
      <polyline className="line" points={line} />
      <line
        className="axis"
        x1={SPARK_PAD}
        y1={SPARK_H - SPARK_PAD}
        x2={SPARK_W - SPARK_PAD}
        y2={SPARK_H - SPARK_PAD}
      />
    </svg>
  );
}
