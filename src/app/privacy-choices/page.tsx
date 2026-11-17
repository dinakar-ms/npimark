import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { AnalyticsPreferences } from "@/components/AnalyticsPreferences";
import { GpcNotice } from "@/components/GpcNotice";
import { TARGET_DAYS } from "@/content/legal/removal";
import { privacyEmail } from "@/content/legal/version";
import { ga4MeasurementId } from "@/lib/analytics";
import { NO_TRACKING_NOTE } from "@/lib/gpc";

export const metadata: Metadata = {
  title: "Your Privacy Choices",
  description:
    "Opt out of the sale and sharing of your personal information, ask us to delete it, or have specific fields removed. NPI Mark honors Global Privacy Control.",
  alternates: { canonical: "/privacy-choices" },
};

/**
 * The page the footer's "Your Privacy Choices" link opens.
 *
 * Both headings are here on purpose: "Do Not Sell or Share My Personal Information" and "Your
 * Privacy Choices" are the labels the California regulations recognise, and a reader looking for
 * either should land on the same explanation. Everything that acts is the one form at
 * /remove-my-information; this page only says what the choices are and what happens next.
 *
 * Rendered per request for the same reason as /privacy and /terms - PRIVACY_EMAIL is read from the
 * environment at run time - and it reads nothing about the visitor. The Global Privacy Control
 * note is the same client component the footer uses, so what is prerendered here says the same
 * thing to everybody.
 */
export default async function PrivacyChoicesPage() {
  await connection();
  const privacy = privacyEmail();

  return (
    <main>
      <section className="wrap remove-layout">
        <div>
          <div className="eyebrow rule">Privacy</div>
          <h1>Your Privacy Choices</h1>
          <p className="lede">
            Lorann LLC, which operates NPI Mark, holds a database of US healthcare providers. If
            your information is in it you can opt out of its sale and sharing, ask us to delete it,
            or ask us to remove particular fields - whether or not you are a customer. These rights
            are the same whichever state registry we appear on.
          </p>

          <GpcNotice />

          <h2 id="do-not-sell">Do Not Sell or Share My Personal Information</h2>
          <p>
            Making a record available to our customers can count as a sale or a share under
            California and other state privacy laws. You can tell us not to. An opt-out is a
            suppression: your details stop being returned in search, contact reveals, exports, list
            append and the API, and stay suppressed when our data is next refreshed. Nothing is
            deleted, because the suppression is what keeps the opt-out working.
          </p>
          <p>
            <Link className="btn primary" href="/remove-my-information">
              Opt out, delete or remove fields
            </Link>
          </p>

          <h2 id="gpc">Global Privacy Control</h2>
          <p>
            We honor the Global Privacy Control signal. If your browser or a browser extension
            sends <code>Sec-GPC</code>, we treat it as an opt-out of the sale and sharing of your
            personal information for that browser - you do not need to fill in anything. When the
            signal reaches us, the footer of every page says so, and if your browser is sending it
            now the note above this appears too.
          </p>
          <p className="fine">{NO_TRACKING_NOTE}</p>

          <h2 id="analytics">Analytics</h2>
          <p>
            On our public pages we may ask whether we can measure which pages are read, using Google
            Analytics. Nothing is loaded or sent until you allow it; provider pages, searches and your
            account are never measured; and a browser sending Global Privacy Control is treated as
            having said no. Your choice is kept in this browser only.
          </p>
          <AnalyticsPreferences configured={ga4MeasurementId() !== null} />

          {/* NARROWED ON PURPOSE - 2026-09-22. What the platform does today when a deletion
              request is approved: it writes the suppressions straight away and records the request
              as needing erasure (`needs_erasure`, backend/app/removal_requests.py). The privacy
              queue that performs the erasure is being built separately and is not in the product
              yet - nothing reads that flag - so the values are still held, kept out of everything a
              customer can see. This wording therefore describes suppression as immediate and
              erasure as following, because a deletion claim is the first sentence a regulator reads
              and it has to be true on the day it is read.

              RESTORE WHEN THE ERASURE QUEUE LANDS: put the present tense back - that we erase the
              name, address, email address, phone and cell phone from our own copies and keep only a
              one-way hash of those identifiers so the same details are never loaded again. Three
              other places said the same thing and were narrowed in the same commit: the "In short"
              panel below, the request form at /remove-my-information (the deletion option and step
              four of "what happens next"), and section 12 of src/content/legal/privacy.ts. */}
          <h2 id="delete">Delete my information</h2>
          <p>
            You can ask us to delete your information. Once we have verified the request we suppress
            the record immediately: from that moment we stop using your details and stop supplying
            them to anybody. They are out of search, contact reveals, exports, list append and the
            API, and the suppression holds when our data is next refreshed.
          </p>
          <p>
            Erasing the values from our own copies is a second step, and it follows rather than
            happening in the same moment. Until it runs we still hold them, suppressed and supplied
            to nobody, and your request is recorded as awaiting erasure so that the step cannot be
            lost. When it runs, all that is kept is a one-way hash of those identifiers, used for
            nothing except making sure the same details are never loaded again.
          </p>
          <p>
            If you are a California resident you may also send a deletion request through the
            state&apos;s Delete Request and Opt-out Platform (DROP), and we process what arrives
            there in the same way.
          </p>

          <h2 id="fields">Remove specific fields</h2>
          <p>
            If you would rather keep a listing but take particular details out of it, ask for those
            instead: your work email address, your phone number, or - for providers - your home
            address and cell phone.
          </p>

          <h2 id="agents">How we verify a request, and authorized agents</h2>
          <p>
            We email a confirmation link to the address you give and review the request once you
            follow it, so nobody can opt out or delete on someone else&apos;s behalf without
            permission. If we cannot confirm by email we will verify you another way before acting.
            Our target is to complete a request within {TARGET_DAYS} days, and we write to tell you
            the outcome. An authorized agent may make a request for you with your written
            permission.
          </p>
          <p>
            We never charge for using these choices and never treat you differently for having used
            them. Read the detail in our <Link href="/privacy#state-rights">Privacy Policy</Link>
            {privacy ? (
              <>
                , or write to <a href={`mailto:${privacy}`}>{privacy}</a>
              </>
            ) : null}
            .
          </p>
        </div>

        <aside className="panel">
          <h2 style={{ fontSize: "1.15rem" }}>In short</h2>
          <ul className="fine" style={{ paddingLeft: 18, display: "grid", gap: 10, marginTop: 12 }}>
            <li>
              <strong>Opt out of sale and sharing.</strong> A suppression across everything our
              customers can see. Nothing is deleted.
            </li>
            {/* Narrowed with the section above, and restored with it. */}
            <li>
              <strong>Delete my information.</strong> The suppression immediately - we stop using
              your details and stop supplying them - with erasure from our own copies to follow.
            </li>
            <li>
              <strong>Remove specific fields.</strong> Email, phone, or home address and cell.
            </li>
            <li>
              <strong>Global Privacy Control</strong> is honored as an opt-out on its own.
            </li>
          </ul>
          <p className="fine" style={{ marginTop: 16 }}>
            <Link href="/remove-my-information">Go to the request form</Link>
          </p>
        </aside>
      </section>
    </main>
  );
}
