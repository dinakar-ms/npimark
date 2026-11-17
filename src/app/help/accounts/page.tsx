import type { Metadata } from "next";
import Link from "next/link";
import { HelpArticle, type HelpArticle as Article } from "@/components/HelpArticle";
import { socialCard } from "@/lib/site";

const ARTICLE: Article = {
  slug: "accounts",
  h1: "Accounts, seats and signing in.",
  lede:
    "An account belongs to one named person inside an organization. The organization holds the " +
    "plan, the keys and the allowances; the person holds their own sign-in, and can be signed out " +
    "of everything without anybody touching the rest.",
  sections: [
    {
      heading: "Seats and invitations",
      body: [
        <>
          Each login is for one named person — sharing a login or an API key between people is
          prohibited by the <Link href="/terms">terms</Link>, and adding a seat is the supported way
          to give somebody access. How many seats a plan includes is on the{" "}
          <Link href="/pricing">pricing page</Link>.
        </>,
        "Somebody with permission to manage people sends an invitation to a work address; personal " +
          "mailbox domains are not accepted for a customer organization, because an account that can " +
          "reveal contact data has to belong to somebody at a business we can identify. An " +
          "invitation expires, and re-inviting the same person cancels the invitation still " +
          "outstanding rather than leaving two live links to the same seat.",
      ],
    },
    {
      heading: "Verifying your email",
      body: [
        "A new customer account can search immediately. Before it can do anything that hands over " +
          "contact data — revealing a provider, or exporting rows that carry email addresses — the " +
          "address on the account has to be confirmed by following the link we send. The prompt " +
          "appears in the app when you first hit it, and the mail can be resent.",
        "For an API key, it is the person who created the key whose address has to be confirmed. A " +
          "key is not a way around a check that applies to its owner.",
      ],
    },
    {
      heading: "Two-step sign-in",
      body: [
        "Two-step sign-in uses an authenticator app: you scan a code once, and after that a " +
          "six-digit code from the app is asked for after your password. Setting it up also gives " +
          "you a set of single-use recovery codes for the day the phone is lost — keep them " +
          "somewhere other than the phone.",
        "One box takes either. Six digits is read as an authenticator code, and anything longer is " +
          "tried as a recovery code, so there is nothing to choose between when you are locked out. " +
          "A correct password buys a short window to type the code, and too many wrong codes send " +
          "you back to the password rather than leaving the door ajar.",
        "Regenerating your recovery codes replaces all of them at once. Codes you wrote down before " +
          "are dead from that moment, which is the behavior you want if you think somebody has seen " +
          "them.",
      ],
    },
    {
      heading: "Requiring two-step of the whole team",
      body: [
        "An owner or admin can require it of everybody, on the team page. The page shows how many " +
          "of your people have not set it up yet before you decide, because that is the number who " +
          "will be asked to before they can carry on.",
        "Nobody is locked out. Somebody who has not set it up can still sign in, change their " +
          "password and set the second factor up — and nothing else until they have. They do that " +
          "themselves in about a minute, without needing an admin.",
        "While it is required, nobody can switch it off for their own account. If somebody loses " +
          "their phone and their recovery codes, an admin resets two-step for that one person from " +
          "the team page, which puts them back to setting up a new one rather than out of the " +
          "product. An owner can also stop requiring it at any time; anybody who has set it up keeps it.",
        "API keys are not affected. A key is not an interactive sign-in, so requiring two-step of " +
          "your people never breaks an integration that is already running.",
      ],
    },
    {
      heading: "Signing other sessions out",
      body: [
        "Changing your password signs out every other session you have and keeps the one you are " +
          "using — so if somebody else is signed in as you, changing your password removes them " +
          "without locking you out. Regenerating your recovery codes does the same.",
        "Resetting a forgotten password through a link signs out every session, including any the " +
          "person who prompted the reset was holding. Someone who can manage people in your " +
          "organization can also sign a specific user out of everything, and that action is " +
          "recorded.",
        "Somebody who can manage people also has a Sign out everywhere button in their own account " +
          "settings, which ends every session on their account including the one they are using. " +
          "That is the thing to reach for when a laptop or a phone has gone missing and the " +
          "password itself is not what is at risk.",
        "Sessions also expire on their own: after a stretch of inactivity, and again at a fixed " +
          "age regardless of activity, so a forgotten browser does not stay signed in indefinitely.",
      ],
    },
    {
      heading: "Who can see and change billing",
      body: [
        "Everybody who can use the app can read the plan and what the organization has spent this " +
          "month. That is deliberate: a refusal that tells somebody how much of an allowance is " +
          "left is only useful if they are allowed to go and look at the figure.",
        "Changing the plan or the payment details is limited to an administrator of your " +
          "organization. Anybody else asking is told plainly that an admin has to do it rather than " +
          "being shown a button that fails.",
        <>
          Plans that include the contracted home address and cell phone product are not purchasable
          online at all — they are switched on by a person after an agreement that states the
          permissible use. See{" "}
          <Link href="/help/premium-contact-data">home address and cell phone</Link>.
        </>,
      ],
    },
    {
      heading: "What is on the record",
      body: [
        <>
          Every reveal, export, append and API call is recorded with the person or key that made it,
          the time and the connection it came from. It is how an organization answers for how a
          record traveled, and how we answer when somebody asks us. What we keep and why is in the{" "}
          <Link href="/privacy">privacy policy</Link>.
        </>,
      ],
    },
  ],
  faq: [
    {
      q: "How do I add someone to my account?",
      a: "Send them an invitation from the app, to a work email address. Personal mailbox domains are not accepted for a customer organization. Re-inviting somebody cancels their outstanding invitation rather than issuing a second live link.",
    },
    {
      q: "Can we make everybody use two-step sign-in?",
      a: "Yes. An owner or admin turns it on for the whole team on the team page, and the page says how many people have not set it up yet before you choose. You have to have set it up yourself first — you would otherwise be the first person it stopped. It can be lifted again at any time, and it does not affect API keys.",
    },
    {
      q: "What kind of two-step sign-in do you use?",
      a: "An authenticator app, plus single-use recovery codes issued when you set it up. There are no codes sent by text. One input box accepts either a six-digit app code or a recovery code.",
    },
    {
      q: "I have lost my phone. How do I get in?",
      a: "Use one of the recovery codes from when you set two-step up, in the same box the app code goes in. Then set two-step up again on the new phone and regenerate your codes, which invalidates every old one.",
    },
    {
      q: "How do I sign out everywhere?",
      a: "If you can manage people, use Sign out everywhere in your account settings: it ends every session including the one you are using. Otherwise change your password, which signs out every other session and keeps the one you are in. Resetting a forgotten password through a link signs out every session, and an administrator can sign a specific user out of everything.",
    },
    {
      q: "Who can see the plan and the usage?",
      a: "Everyone who can use the app. Changing the plan or the payment details is restricted to an administrator of your organization.",
    },
    {
      q: "Can I share one login to save a seat?",
      a: "No. Each login is for one named person under the terms, and the audit trail of reveals and exports is only meaningful if a login means a person. Add a seat instead.",
    },
  ],
};

export const metadata: Metadata = {
  title: "Accounts, seats and sign-in",
  description:
    "Seats and invitations, verifying your address, two-step sign-in with recovery codes, signing other sessions out, and who can change billing.",
  alternates: { canonical: "/help/accounts" },
  openGraph: socialCard(
    "/help/accounts",
    "Accounts, seats and sign-in",
    "Seats, two-step sign-in, signing other sessions out, and who can change billing.",
  ),
};

export default function HelpAccountsPage() {
  return <HelpArticle article={ARTICLE} name="Accounts, seats and sign-in" />;
}
