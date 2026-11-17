import Link from "next/link";
import type { FirstRun as FirstRunState, LimitFigures } from "@/lib/session";

/**
 * The six things worth doing in the first two minutes, and which of them are done.
 *
 * Every tick comes from the API's reading of the tables that record the work
 * (`/api/account/first-run`), not from anything this page or this browser remembers. So a
 * colleague's export ticks the export line for everybody, an export done through the API ticks it
 * the same as one done here, and there is no way to have a green list and an empty account.
 *
 * The panel is not shown at all once everything is done, or once somebody has dismissed it - a
 * checklist that will not go away is furniture. Dismissal is a cookie rather than a row, because
 * "I do not want this panel" is a fact about a browser and does not belong in the tenant's data;
 * the consequence, which is the honest one, is that it comes back on another device, where the
 * person has not dismissed it yet.
 *
 * The reveal line carries the real figure from the plan when there is one, because "what does
 * opening a contact cost me" is the question a new customer cannot answer, and a made-up number
 * would be worse than none.
 */

type Item = {
  key: keyof Omit<FirstRunState, "complete">;
  title: string;
  note: string;
  href: string;
  /** What the link says when the thing has not been done yet. */
  action: string;
};

const ITEMS: Item[] = [
  {
    key: "searched",
    title: "Run a search",
    note: "Filter by state, specialty and type until the count looks like the market you sell to.",
    href: "/app/search",
    action: "Search providers",
  },
  {
    key: "revealed",
    title: "Open one contact",
    note: "A reveal hands over the work email and practice phone we hold for one provider.",
    href: "/app/search",
    action: "Open a provider",
  },
  {
    key: "saved",
    title: "Save the search, or set an alert",
    note: "An alert is a saved search told what changed inside it - who is new, who moved, who stopped.",
    href: "/app/search",
    action: "Save as alert",
  },
  {
    key: "exported",
    title: "Export a list",
    note: "Take the rows away as a file. The row count is checked before the job starts, so nothing is written that your plan would refuse.",
    href: "/app/exports",
    action: "Queue an export",
  },
  {
    key: "invited",
    title: "Invite a colleague",
    note: "The allowance belongs to the organization, so a colleague works from the same figures rather than a copy of your file.",
    href: "/app/team",
    action: "Invite somebody",
  },
  {
    key: "keyed",
    title: "Issue an API key",
    note: "The same data over REST, for the system you already run. A key can never do more than the person who made it.",
    href: "/app/keys",
    action: "Issue a key",
  },
];

/** One clause about what a reveal costs, when the plan's figure can actually be read. */
function revealCost(reveals: LimitFigures | undefined): string {
  if (!reveals) return "";
  if (reveals.limit === null) return " Your plan does not limit them.";
  if (reveals.limit === 0) return " Your plan does not include reveals.";
  return (
    ` Opening the same provider again in the same month is free, and you have` +
    ` ${reveals.remaining.toLocaleString("en-US")} of ${reveals.limit.toLocaleString("en-US")}` +
    ` left this month.`
  );
}

export function FirstRun({
  state,
  reveals,
}: {
  state: FirstRunState;
  reveals?: LimitFigures;
}) {
  const done = ITEMS.filter((item) => state[item.key]).length;

  return (
    <section className="panel first-run" id="getting-started">
      <h2>Getting started</h2>
      <p className="fine">
        {done} of {ITEMS.length} done. Each line ticks itself off when the work happens, whoever
        on your team does it.
      </p>
      {/* The progress the sentence above already states, drawn. It is the same `.meter` the
          allowances use, which is the point of it being here rather than a bar of its own: this
          panel and the balance panel two blocks down are measuring different things, and a
          customer should not have to work out whether they are the same kind of thing. Never a
          stop or a warning - a checklist part-way through is not a problem - and `aria-hidden`,
          because the count beside it is the fact. */}
      <div className="meter" aria-hidden="true">
        <i style={{ width: `${Math.round((done / ITEMS.length) * 100)}%` }} />
      </div>
      <ol className="checklist">
        {ITEMS.map((item) => {
          const finished = state[item.key];
          return (
            <li key={item.key} className={finished ? "done" : ""}>
              <span className={`tag ${finished ? "ok" : ""}`}>{finished ? "done" : "to do"}</span>
              <span className="checklist-body">
                <b>{item.title}</b>
                <span className="fine" style={{ display: "block" }}>
                  {item.note}
                  {item.key === "revealed" ? revealCost(reveals) : ""}
                </span>
                {!finished && (
                  <Link className="btn sm" href={item.href} style={{ marginTop: 8 }}>
                    {item.action}
                  </Link>
                )}
              </span>
            </li>
          );
        })}
      </ol>
      <form method="post" action="/api/app/first-run" style={{ marginTop: 16 }}>
        <input type="hidden" name="action" value="dismiss" />
        <button type="submit" className="btn sm">
          Hide this
        </button>
      </form>
    </section>
  );
}
