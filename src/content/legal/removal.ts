/**
 * What the "Remove my information" page promises. Kept here, beside the Terms and Privacy text, so
 * counsel can change the promise in one place.
 *
 * TARGET_DAYS is the number the page and the Privacy Policy state. The API has the same figure in
 * backend/app/removal_requests.py (TARGET_DAYS) for the staff runbook; it does not enforce it.
 */

/** Counsel confirmed 45 days on 22 October 2026 - the statutory clock for a verified consumer
 * request - so the published promise and the platform's own due date (PRIVACY_REQUEST_DUE_DAYS)
 * now say the same number. */
export const TARGET_DAYS = 45;

export const REMOVAL_LAWYER_NOTE =
  "[LAWYER: confirm the response target, and whether a verified deletion (including one arriving " +
  "through California's DROP) runs on a different clock from an opt-out of sale and sharing.]";
