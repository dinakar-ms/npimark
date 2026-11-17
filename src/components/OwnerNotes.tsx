import type { ReactNode } from "react";
import {
  type Channel,
  type CompanyFact,
  answered,
  anyUnanswered,
  settled,
} from "@/content/company";

/**
 * Public presentation of company facts. Unknown details remain tracked in company.ts
 * and draft.ts; visitors never receive internal configuration instructions.
 *
 * Historical review model: how an unanswered company fact appears on the page.
 *
 * The company pages are drafts for the owner to correct, and the things only the owner knows - the
 * legal entity, the founding year, the size of the team, which mailbox is being watched - are
 * declared once in `content/company.ts`. This is the other half of that: wherever a sentence needs
 * one of those facts, the page renders `<Fact of={COMPANY.legalEntity} />`, which prints the answer
 * if there is one and the question, highlighted, if there is not.
 *
 * It is deliberately the same device as the [LAWYER: ...] notes on the legal pages, down to the
 * bracket, because the owner has already read one set of them and will recognise the second. The
 * difference is that there is no switch: a note disappears when the fact behind it is filled in,
 * and the draft banner on a page disappears with the last note on it. Nothing can be approved with
 * a question still on it, because approving it is filling it in.
 */

export function Fact({ of }: { of: CompanyFact }) {
  const value = answered(of);
  if (value !== null) return <>{value}</>;
  // Settled as "publish nothing": the owner decided, and the sentence goes rather than carrying a
  // question nobody is going to answer twice.
  if (settled(of)) return null;
  return <span className="fine">Details not yet published.</span>;
}

/**
 * A whole paragraph that is one fact, which is how the sentences only the owner can write appear.
 *
 * It renders nothing at all once the fact is settled as `PUBLISH_NOTHING`, so a page does not keep
 * an empty paragraph where a founding date was never going to be published.
 */
export function FactParagraph({ of }: { of: CompanyFact }) {
  if (answered(of) === null) return null;
  return (
    <p>
      <Fact of={of} />
    </p>
  );
}

/**
 * The note for a mailbox that has not been set in the environment yet.
 *
 * Unlike the facts above, the answer does not live in the source - `SALES_EMAIL`, `SUPPORT_EMAIL`,
 * `PRIVACY_EMAIL` and `SECURITY_EMAIL` are read at request time, so that an address goes live by
 * restarting the site rather than by shipping a commit. The page still has to say out loud that it
 * is missing, or the owner discovers it from a customer.
 */
export function ChannelNote({ of }: { of: Channel }) {
  if (of.address !== null) return null;
  return (
    <span className="fine">An email address for this team is not currently listed. The button above opens the available resource.</span>
  );
}

/** The banner at the top of a page that still carries at least one question. */
export function DraftNotice({
  facts = [],
  channels = [],
  children,
}: {
  facts?: readonly CompanyFact[];
  channels?: readonly Channel[];
  children?: ReactNode;
}) {
  const open =
    anyUnanswered(facts) || channels.some((c) => c.address === null);
  if (!open) return null;
  return (
    <div className="notice warn" role="note" style={{ marginBottom: 24 }}>
      <strong>Company information</strong>{" "}
      {children ?? "Some company details are still being confirmed. Only published information is shown below."}
    </div>
  );
}
