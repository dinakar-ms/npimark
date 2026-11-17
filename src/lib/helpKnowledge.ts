/** Public, reviewed help only. Never add internal runbooks or customer records here.
 * The Help Center and assistant render these same answers. Review against the linked article
 * whenever a product rule changes. Reviewed against repository e4aa2aed, not live billing.
 */
export type HelpAnswer = {
  id: string; question: string; answer: string; article: string; keywords: string; reviewed: string;
};
export const HELP_ANSWERS: readonly HelpAnswer[] = [
  {id: "search", question: "How do I start a provider search?", article: "search-and-filters",
    answer: "Open provider search, choose a specialty and practice location, and review the matching records. Filters combine: adding another filter narrows the results. Check the results and total before starting an export.", keywords: "find physician doctor dentist nurse location city state specialty filters", reviewed: "2026-10-25"},
  {id: "taxonomy", question: "Why does a specialty match a different primary specialty?", article: "search-and-filters",
    answer: "A classification is a broad category; a specialization is a narrower kind of practice. A provider can have more than one taxonomy. Review the matched specialty as well as the primary specialty before excluding a record.", keywords: "taxonomy classification specialization cardiology internal medicine", reviewed: "2026-10-25"},
  {id: "reveal", question: "How do contact reveals work?", article: "reveals",
    answer: "Open a provider and choose the reveal action to request available contact details. Reveals require permission and available allowance. Review the displayed credit cost before confirming. A refused reveal is not counted. Saving a record alone does not prove its contacts are unlocked.", keywords: "unlock email credits contact reveal save saved", reviewed: "2026-10-25"},
  {id: "limits", question: "Where can I see my plan and remaining allowance?", article: "plans-and-limits",
    answer: "Open Billing in your workspace to check your plan, usage, and remaining allowance. A request that exceeds a limit is refused. Use the current billing screen for your account's exact limits; help articles cannot confirm your balance or payment status.", keywords: "billing quota allowance usage balance credits subscription pricing upgrade trial", reviewed: "2026-10-25"},
  {id: "export", question: "How do I export a list or match my own file?", article: "exports-and-append",
    answer: "First review your search filters and matching records. Check the export options and row allowance before submitting a job. Append matches an uploaded file to provider data; it is a separate workflow from downloading search results. Consult the export and append guide for file contents and counting rules.", keywords: "download csv excel xlsx file list append matching export", reviewed: "2026-10-25"},
  {id: "keys", question: "How do API keys and permissions work?", article: "api-keys",
    answer: "Use a scoped API key for the operations your integration needs. Reading provider records and revealing contacts are separate permissions. Keep keys on your server, never in public pages or chat. Check the API's usage and rate-limit responses, and revoke a key if it is exposed.", keywords: "api key token scope developer integration mcp", reviewed: "2026-10-25"},
  {id: "team", question: "How do I give a teammate access?", article: "accounts",
    answer: "Ask someone with permission to manage your organization's users to send an invitation to the teammate's work email. Each person should have their own account. Do not share passwords or API keys. Available seats depend on the organization's plan.", keywords: "invite user seats team organization colleague access", reviewed: "2026-10-25"},
  {id: "security", question: "How do I protect my sign-in?", article: "accounts",
    answer: "Set up two-step verification in your account's security settings and keep recovery codes somewhere safe. You can sign other sessions out if you suspect someone else has access. Never send a password, verification code, or recovery code to support or the assistant.", keywords: "mfa 2fa password login sign in security sessions recovery", reviewed: "2026-10-25"},
  {id: "trust", question: "What do email trust tiers mean?", article: "email-trust",
    answer: "Trust tiers describe the evidence available for an email address. They are not a promise of delivery, employment, consent, or response. Read the trust-tier guide before choosing a filter, and review uncertain matches before using them.", keywords: "email verification verified valid trusted probable doubtful rejected bounce deliverability", reviewed: "2026-10-25"},
  {id: "removal", question: "How do I request removal of my information?", article: "suppression",
    answer: "Use the Remove my information page to request suppression or removal. You do not need to buy a plan. Do not paste your personal contact details into the AI assistant; use the dedicated request form so the privacy team can handle the request.", keywords: "privacy delete opt out suppression removal personal", reviewed: "2026-10-25"},
  {id: "personal", question: "Are cell phones and home addresses included?", article: "premium-contact-data",
    answer: "Home address and cell-phone access are governed by the contracted product and permissible-use terms. They are not public directory fields. Contact sales to confirm your agreement's coverage; the assistant cannot unlock these fields or promise that a plan includes them.", keywords: "cell mobile personal home address premium contract phone", reviewed: "2026-10-25"},
];

export function searchHelp(query: string): readonly HelpAnswer[] {
  const terms = [...new Set(query.toLowerCase().match(/[a-z0-9]+/g) ?? [])]
    .filter(word => !["how", "do", "i", "the", "a", "an", "to", "my", "can", "what", "is", "are"].includes(word));
  if (!query.trim()) return HELP_ANSWERS;
  if (!terms.length) return [];
  return HELP_ANSWERS.map(item => ({item, score: terms.reduce((score, term) => {
    const title = `${item.question} ${item.keywords}`.toLowerCase();
    return score + (title.includes(term) ? 3 : item.answer.toLowerCase().includes(term) ? 1 : 0);
  }, 0)})).filter(hit => hit.score > 0).sort((a, b) => b.score - a.score).map(hit => hit.item);
}
