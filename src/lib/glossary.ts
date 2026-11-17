/**
 * The specialty and credential glossary: what every entry says, and how the pages find each other.
 *
 * Why this is prose in a file rather than something generated
 * -----------------------------------------------------------
 * The pages this drives exist because "what is a CRNA" and "the difference between a DO and an MD"
 * are questions a buyer asks one step before they ask us for a list. A page that answers with a
 * count answers nothing, so every entry carries real explanation - what the profession is, how its
 * people train, where they work, what the letters after their name mean - written from general
 * knowledge and kept to what can be stated plainly and correctly. Where a profession's scope or
 * title genuinely differs state by state (counselling is the clear case) the entry says so and
 * stops, rather than inventing a national rule that would be wrong somewhere.
 *
 * Nothing in here is a number about our own data. Counts come from the platform at request time
 * (`lib/api.ts`), and a count that cannot be read is a sentence that is not printed - never a zero.
 * Nothing in here names a source either: entries say "the public record" and "what providers file
 * about themselves", the same rule /data follows.
 *
 * `list` is the platform's own list slug, and it is what ties an entry to rows. For a specialty
 * entry it is load-bearing: the page 404s when the platform says that list is not published, so a
 * glossary page always has a list with real records behind it. For a credential entry it is a
 * candidate - the letters are worth a page whether or not one list happens to match them - so a
 * slug the platform does not know simply means that page carries no counts.
 *
 * This file imports nothing on purpose: `glossary.test.mjs` loads it directly under `node --test`,
 * which strips the types but cannot resolve the `@/` alias.
 */

export type GlossaryFamilyKey =
  | "generalist"
  | "medical"
  | "surgical"
  | "hospital"
  | "nursing"
  | "dental"
  | "behavioural"
  | "rehab"
  | "eye"
  | "other"
  | "credentials";

export type GlossaryFamily = {
  key: GlossaryFamilyKey;
  /** The heading this family gets on the hub. */
  name: string;
  /** One line under that heading. */
  blurb: string;
};

/** Profession families, in the order the hub prints them. */
export const GLOSSARY_FAMILIES: readonly GlossaryFamily[] = [
  {
    key: "generalist",
    name: "Generalist physicians",
    blurb: "The three specialties that take a whole patient rather than one organ or one procedure.",
  },
  {
    key: "medical",
    name: "Medical specialties",
    blurb:
      "Physicians who diagnose and prescribe rather than operate - most of them internists who took a further fellowship.",
  },
  {
    key: "surgical",
    name: "Surgical specialties",
    blurb: "Physicians who operate, and the separate classifications each surgical field is filed under.",
  },
  {
    key: "hospital",
    name: "Hospital-based and diagnostic specialties",
    blurb: "The specialties whose work happens where the facility is, not where the patient lives.",
  },
  {
    key: "nursing",
    name: "Advanced practice and nursing",
    blurb: "Nurse practitioners, physician assistants and registered nurses - the prescribers a physician list misses.",
  },
  {
    key: "dental",
    name: "Dentistry",
    blurb: "A separate profession with its own degrees, licenses and specialties.",
  },
  {
    key: "behavioural",
    name: "Behavioural health",
    blurb: "Who may diagnose, who may prescribe, and which license sits behind each title.",
  },
  {
    key: "rehab",
    name: "Therapy and rehabilitation",
    blurb: "Three therapy professions and the physician specialty that directs them.",
  },
  { key: "eye", name: "Eye care", blurb: "Two professions, and where the line between them falls." },
  {
    key: "other",
    name: "Other clinical professions",
    blurb: "Independently licensed professions outside medicine, nursing and dentistry.",
  },
  {
    key: "credentials",
    name: "Credential letters",
    blurb: "The letters after a name: what each degree or certification is, and what it does not tell you.",
  },
];

export type GlossaryEntry = {
  /** Path segment: the page is at `/glossary/${term}`. */
  term: string;
  kind: "specialty" | "credential";
  family: GlossaryFamilyKey;
  /** How the entry reads in a list of terms. */
  label: string;
  /** Page title, without the site suffix the layout template adds. */
  title: string;
  /** Meta description, 70-160 characters. */
  description: string;
  /** One line for the hub and llms.txt: what the entry covers. */
  blurb: string;
  /** The lede under the h1: the one-sentence answer. */
  lede: string;
  /** The explanation, two to four paragraphs. */
  body: readonly string[];
  /** Training and credentialling, in outline. */
  route?: string;
  /** Where people in this profession typically practise. */
  settings?: string;
  /** The letters that appear on these records, and what each one is. */
  letters?: readonly { letters: string; means: string }[];
  /** Other terms in this glossary, by `term`. */
  related?: readonly string[];
  /** The platform's list slug. Load-bearing for a specialty, a candidate for a credential. */
  list?: string;
  /** The classification as the reference list spells it, for the metro pages. */
  classification?: string;
  /** The audience landing page this population belongs to, by slug. */
  audience?: string;
  /** Said on the page when an entry is deliberately shorter than the rest, and why. */
  caveat?: string;
  /** Pages elsewhere on the site this profession touches. */
  also?: readonly { href: string; label: string }[];
};

const GENERALISTS: readonly GlossaryEntry[] = [
  {
    term: "family-medicine-physicians",
    kind: "specialty",
    family: "generalist",
    label: "Family medicine physician",
    title: "What is a family medicine physician?",
    description:
      "What family medicine covers, how a family physician trains, where they practice, and how many are on the public record.",
    blurb: "The generalist specialty that covers every age, and how it differs from internal medicine.",
    lede:
      "A family physician is trained to care for patients of every age, which is what separates the specialty from internal medicine and pediatrics.",
    body: [
      "Family medicine is the specialty of continuing general care across a whole population rather than one organ system or one age group. A family physician's panel can run from newborns to the very old, and the same doctor may handle preventive visits, long-term conditions, minor procedures and the coordination of specialist care for the same household over many years.",
      "It is one of the three generalist specialties in American medicine, alongside internal medicine and pediatrics. The distinction matters when you are building a list: internists train in adult medicine, pediatricians in children, and family physicians in both. A primary care list that leaves family medicine out is missing most of rural and small-town practice.",
      "Family physicians are the largest group of physicians in many states and the backbone of independent practice, which also makes them the group whose practice address and employer change most often. On the public record they are a classification of their own, so they are one of the easier physician populations to count exactly.",
    ],
    route:
      "Four years of medical school, a three-year family medicine residency, then board certification maintained on a cycle rather than earned once. MDs and DOs train in the same residency programs.",
    settings:
      "Independent and group practices, health-system primary care networks, community health centers and rural clinics, urgent care, and hospital-employed clinics. In smaller communities many also hold hospital privileges.",
    related: ["internal-medicine-physicians", "pediatricians", "nurse-practitioners", "physician-assistants"],
    list: "family-medicine-physicians",
    classification: "Family Medicine",
    audience: "physicians",
  },
  {
    term: "internal-medicine-physicians",
    kind: "specialty",
    family: "generalist",
    label: "Internal medicine physician",
    title: "What is an internal medicine physician?",
    description:
      "What an internist is, why most physician sub-specialties are built on internal medicine, and how that changes the count you get.",
    blurb: "Adult general medicine, and the classification most sub-specialties are filed beneath.",
    lede:
      "An internist is a physician trained in adult medicine, and internal medicine is also the base specialty most medical sub-specialties are built on.",
    body: [
      "Internal medicine is adult general medicine. An internist trains in the diagnosis and long-term management of conditions across the adult body rather than in one organ, and in the care of admitted patients as well as clinic work.",
      "It is also the parent of most physician sub-specialties. Cardiology, endocrinology, gastroenterology, nephrology, pulmonology, rheumatology, infectious disease, hematology and oncology are all fellowships taken after an internal medicine residency. On the public record a cardiologist is filed under internal medicine with cardiovascular disease as the specialization beneath it, which is why a list filtered to the classification finds the sub-specialists too, and a list filtered to one sub-specialty code does not.",
      "Two very different practice patterns sit inside the same specialty: the office-based general internist with a continuing panel of adults, and the hospitalist who works only with admitted patients. The record does not always separate them, so employer and practice address usually tell you more than the taxonomy does.",
    ],
    route:
      "Medical school, a three-year internal medicine residency and board certification; a sub-specialist adds a fellowship of one to three years or more on top of that.",
    settings:
      "Primary care clinics, multi-specialty groups, hospital medicine services, academic medical centers, and the outpatient arms of health systems.",
    related: ["family-medicine-physicians", "cardiologists", "endocrinologists", "pediatricians"],
    list: "internal-medicine-physicians",
    classification: "Internal Medicine",
    audience: "physicians",
  },
  {
    term: "pediatricians",
    kind: "specialty",
    family: "generalist",
    label: "Pediatrician",
    title: "What is a pediatrician?",
    description:
      "What pediatrics covers, how pediatricians train and where they practice, and which other professions also see children.",
    blurb: "The generalist specialty defined by age rather than by organ system.",
    lede:
      "A pediatrician is a physician trained in the medicine of infants, children and adolescents, usually up to the late teens or early twenties.",
    body: [
      "Pediatrics is a generalist specialty defined by age rather than by organ system. Growth and development, immunisation schedules, childhood illness and the long-term conditions of childhood all sit inside it, and most pediatricians practice general outpatient pediatrics.",
      "The specialty has sub-specialties of its own, taken as fellowships after residency - neonatology, pediatric cardiology, pediatric emergency medicine and a dozen more - and a set of dedicated institutions, from children's hospitals to school-based clinics.",
      "For list building, pediatrics overlaps with family medicine, which covers children too, and with pediatric nurse practitioners and pediatric dentists, which are filed separately. If the audience is everyone who cares for children, one classification will not cover it.",
    ],
    route:
      "Medical school, a three-year pediatrics residency and board certification; sub-specialists add a fellowship of about three years.",
    settings:
      "Independent and group pediatric practices, children's hospitals and their outpatient networks, community health centers, school and public health clinics.",
    related: ["family-medicine-physicians", "pediatric-dentists", "nurse-practitioners"],
    list: "pediatricians",
    classification: "Pediatrics",
    audience: "physicians",
  },
];

const MEDICAL: readonly GlossaryEntry[] = [
  {
    term: "cardiologists",
    kind: "specialty",
    family: "medical",
    label: "Cardiologist",
    title: "What is a cardiologist?",
    description:
      "What a cardiologist trains in, how cardiology sub-specialties nest beneath internal medicine, and how many are on the public record.",
    blurb: "An internist with a heart and vascular fellowship, and the sub-specialties beneath it.",
    lede: "A cardiologist is an internal medicine physician who has taken a fellowship in the heart and blood vessels.",
    body: [
      "Cardiology is a sub-specialty of internal medicine. After an internal medicine residency, a cardiologist completes a general cardiovascular disease fellowship covering diagnosis, imaging such as echocardiography, and the medical management of heart and vascular conditions.",
      "Below general cardiology sit further sub-specialties, each a separate fellowship and a separate code on the public record: interventional cardiology for catheter-based procedures, electrophysiology for rhythm and implanted devices, advanced heart failure and transplant, and non-invasive imaging. Cardiac surgery is not one of them - it is a surgical specialty with its own long residency.",
      "Because cardiology is filed beneath internal medicine, the count depends on where you filter. Asking for the internal medicine classification returns cardiologists along with every other internal medicine sub-specialty; asking for cardiovascular disease returns the ones who file that as their primary specialty and misses those who file something narrower.",
      "Cardiology also consolidated into health systems earlier and harder than most specialties. The employer on one of these records is often more useful than the practice address, because a cardiologist may hold clinics at several sites owned by the group that actually employs them.",
    ],
    route:
      "Medical school, three years of internal medicine residency, a cardiovascular disease fellowship of about three years, then board certification; each further sub-specialty adds a year or more.",
    settings:
      "Hospital-employed cardiology divisions, large single-specialty cardiology groups, catheterisation labs and heart centers, academic medical centers.",
    related: ["interventional-cardiologists", "internal-medicine-physicians", "surgeons"],
    list: "cardiologists",
    classification: "Internal Medicine",
    audience: "physicians",
    also: [{ href: "/hospitals", label: "Certified hospitals, with beds and ownership" }],
  },
  {
    term: "interventional-cardiologists",
    kind: "specialty",
    family: "medical",
    label: "Interventional cardiologist",
    title: "What is an interventional cardiologist?",
    description:
      "The catheter-based cardiology sub-specialty: how it trains, why it is tied to hospitals, and how the three populations nest.",
    blurb: "Cardiology's catheter-based sub-specialty, and why it follows the cath labs.",
    lede: "An interventional cardiologist is a cardiologist with a further fellowship in catheter-based procedures.",
    body: [
      "Interventional cardiology is a sub-specialty taken after general cardiology. The work is catheter-based: diagnostic angiography and procedures performed through a blood vessel rather than through an open chest, including stenting and, at centers that offer them, structural heart procedures.",
      "Everyone here is also a cardiologist and, before that, an internist, so the three populations nest. Someone counted in this list would also be counted in a list of cardiologists that filters on the classification rather than on a single sub-specialty code.",
      "It is a procedural specialty tethered to a building. The equipment lives in a catheterisation lab, so the practicing population tracks the hospitals and heart centers that have one rather than the general distribution of physicians.",
    ],
    route:
      "An internal medicine residency, a general cardiovascular disease fellowship, then a further year of interventional training, with board certification at each step.",
    settings: "Hospital catheterisation labs, heart and vascular institutes, large cardiology groups aligned to a hospital.",
    related: ["cardiologists", "internal-medicine-physicians"],
    list: "interventional-cardiologists",
    classification: "Internal Medicine",
    audience: "physicians",
  },
  {
    term: "endocrinologists",
    kind: "specialty",
    family: "medical",
    label: "Endocrinologist",
    title: "What is an endocrinologist?",
    description:
      "The hormone and metabolism sub-specialty, how endocrinologists train, and why a diabetes audience is much wider than this list.",
    blurb: "Hormones, glands and metabolism - and why diabetes care reaches far beyond the specialty.",
    lede:
      "An endocrinologist is an internal medicine physician who sub-specialises in hormones and the glands that produce them, including diabetes care.",
    body: [
      "Endocrinology, diabetes and metabolism is an internal medicine fellowship. The field covers the endocrine glands - thyroid, pituitary, adrenal, parathyroid, gonads - and metabolic conditions, of which diabetes is by far the largest in volume.",
      "It is a small specialty relative to the demand on it, which is why so much diabetes care is delivered in primary care and by nurse practitioners and physician assistants working alongside endocrinologists. A list aimed at diabetes care that contains only endocrinologists will be a fraction of the real prescribing population.",
      "Pediatric endocrinology is a separate fellowship taken after a pediatrics residency, and it is filed under its own code on the public record.",
    ],
    route: "Medical school, an internal medicine residency, a two-year endocrinology fellowship, then board certification.",
    settings:
      "Hospital and health-system specialty clinics, multi-specialty groups, academic centers, and a diminishing number of independent single-specialty practices.",
    related: ["internal-medicine-physicians", "nurse-practitioners", "registered-dietitians"],
    list: "endocrinologists",
    classification: "Internal Medicine",
    audience: "physicians",
  },
  {
    term: "gastroenterologists",
    kind: "specialty",
    family: "medical",
    label: "Gastroenterologist",
    title: "What is a gastroenterologist?",
    description:
      "The digestive and liver sub-specialty: what it covers, the endoscopy centers behind it, and how it differs from surgery.",
    blurb: "A medical specialty with a procedure suite attached, and its own ambulatory centers.",
    lede:
      "A gastroenterologist is an internal medicine physician who sub-specialises in the digestive tract and the liver, and who performs endoscopic procedures.",
    body: [
      "Gastroenterology covers the oesophagus, stomach, intestines, pancreas, gallbladder and liver. It is a procedural specialty as much as a medical one: endoscopy and colonoscopy are the day-to-day work alongside clinic consultation.",
      "Hepatology - liver disease - is a further sub-specialty within it, and transplant hepatology is a distinct certificate. Surgery on the same organs belongs to general and colorectal surgeons rather than to gastroenterologists.",
      "Because the procedures can be done outside a hospital, gastroenterology has more endoscopy and ambulatory surgery center ownership than most medical specialties. Practices are often larger and more consolidated than the specialty's headcount suggests, and the practice is usually the account rather than the individual.",
    ],
    route: "An internal medicine residency, a gastroenterology fellowship of about three years, then board certification.",
    settings:
      "Single-specialty groups with their own endoscopy centers, hospital divisions, ambulatory surgery centers, academic centers.",
    related: ["internal-medicine-physicians", "surgeons"],
    list: "gastroenterologists",
    classification: "Internal Medicine",
    audience: "physicians",
  },
  {
    term: "hematologist-oncologists",
    kind: "specialty",
    family: "medical",
    label: "Hematologist-oncologist",
    title: "What is a hematologist-oncologist?",
    description:
      "Why blood disorders and cancer are trained together in the United States, and which three codes an oncology audience needs.",
    blurb: "One combined fellowship, three possible codes on the record.",
    lede:
      "A hematologist-oncologist is an internal medicine physician trained in both blood disorders and cancer, usually through a single combined fellowship.",
    body: [
      "Hematology and oncology are separately certifiable, but most American training programs combine them, so the same physician covers blood disorders and solid-tumor cancer care. The record reflects the combination unevenly: some file a combined specialty, some file hematology alone, some medical oncology alone.",
      "The work is medical rather than surgical or radiation-based. Cancer care is delivered by a team in which the surgical oncologist and the radiation oncologist are different specialists with different training, so a list that says only oncologists will mix all three.",
      "Practice has consolidated into hospital cancer centers and large independent oncology groups, in part because of how infused drugs are bought and billed. The employer on one of these records is usually more informative than the address.",
    ],
    route:
      "An internal medicine residency, then a combined hematology and oncology fellowship of about three years, with board certification in one or both fields.",
    settings: "Hospital cancer centers, large independent oncology practices and their infusion suites, academic cancer centers.",
    related: ["medical-oncologists", "internal-medicine-physicians", "pathologists"],
    list: "hematologist-oncologists",
    classification: "Internal Medicine",
    audience: "physicians",
  },
  {
    term: "medical-oncologists",
    kind: "specialty",
    family: "medical",
    label: "Medical oncologist",
    title: "What is a medical oncologist?",
    description:
      "The drug-therapy arm of cancer care, how it differs from surgical and radiation oncology, and where the population sits.",
    blurb: "The systemic therapy arm of cancer care - one of three distinct oncology professions.",
    lede: "A medical oncologist is an internal medicine physician who sub-specialises in the drug treatment of cancer.",
    body: [
      "Medical oncology is the medical arm of cancer care: systemic drug therapy and the long-term management of patients on it. It is one of three distinct oncology professions - surgical oncology sits within surgery, radiation oncology is its own residency - and the three are not interchangeable in a list.",
      "In the United States most medical oncologists train alongside hematology, so the same person may appear under hematology-oncology, medical oncology or hematology depending on which code they filed as primary. A list of everyone who prescribes systemic cancer therapy needs all three.",
      "Oncology is among the most consolidated specialties in the country. Hospital-owned cancer centers and a small number of very large independent groups account for much of the population, and buying decisions sit at that level rather than with the individual.",
    ],
    route:
      "An internal medicine residency, then a fellowship in medical oncology - commonly combined with hematology - and board certification.",
    settings: "Cancer centers, infusion clinics, academic oncology divisions, large independent groups.",
    related: ["hematologist-oncologists", "internal-medicine-physicians", "radiologists"],
    list: "medical-oncologists",
    classification: "Internal Medicine",
    audience: "physicians",
  },
  {
    term: "nephrologists",
    kind: "specialty",
    family: "medical",
    label: "Nephrologist",
    title: "What is a nephrologist?",
    description:
      "The kidney sub-specialty, its dialysis work, and the difference between a nephrologist and a urologist.",
    blurb: "Kidney medicine and dialysis - and not to be confused with urology.",
    lede:
      "A nephrologist is an internal medicine physician who sub-specialises in the kidneys, including the care of patients on dialysis.",
    body: [
      "Nephrology covers kidney function and its failure, blood pressure, and the fluid and electrolyte problems that follow from both. What distinguishes it commercially is dialysis: nephrologists supervise care at dialysis facilities as well as running clinics and consulting on admitted patients.",
      "That makes the specialty unusually easy to locate through institutions. Dialysis centers are certified, published and countable, and a nephrologist's working life is usually spread across a hospital, a clinic and one or more dialysis units.",
      "The line with urology is the one to keep straight: nephrologists manage kidney function medically, urologists are surgeons of the urinary tract. Transplant nephrology is a further sub-specialty, and the transplant operation itself belongs to surgeons.",
    ],
    route: "An internal medicine residency, a two-year nephrology fellowship, then board certification.",
    settings:
      "Hospital nephrology services, dialysis facilities, independent and hospital-employed nephrology groups, transplant centers.",
    related: ["internal-medicine-physicians", "urologists", "registered-dietitians"],
    list: "nephrologists",
    classification: "Internal Medicine",
    audience: "physicians",
    also: [{ href: "/dialysis-centers", label: "Certified dialysis centers by state and town" }],
  },
  {
    term: "pulmonologists",
    kind: "specialty",
    family: "medical",
    label: "Pulmonologist",
    title: "What is a pulmonologist?",
    description:
      "Why pulmonary medicine and critical care are usually one fellowship, and which codes a respiratory audience needs.",
    blurb: "Lung medicine, usually combined with critical care - so usually a hospital specialty.",
    lede:
      "A pulmonologist is an internal medicine physician who sub-specialises in the lungs and breathing, very often together with critical care.",
    body: [
      "Pulmonary medicine covers the airways and lungs, sleep-disordered breathing in many practices, and procedures such as bronchoscopy. In the United States the fellowship is most often combined with critical care medicine, so the same physician runs an outpatient clinic and staffs an intensive care unit.",
      "That combination is why pulmonology is a hospital-centred specialty despite having a busy clinic side. A record may show pulmonary disease, critical care medicine, or the combined code, and for most purposes the three should be treated as one population.",
      "Sleep medicine is a separate certificate that pulmonologists, neurologists, psychiatrists and otolaryngologists can all hold, so it is not a reliable proxy for any single specialty.",
    ],
    route:
      "An internal medicine residency, then a fellowship in pulmonary disease - usually combined with critical care - of about three years, and board certification.",
    settings: "Hospital intensive care units, pulmonary clinics, sleep laboratories, academic centers.",
    related: ["internal-medicine-physicians", "anesthesiologists", "infectious-disease-physicians"],
    list: "pulmonologists",
    classification: "Internal Medicine",
    audience: "physicians",
  },
  {
    term: "rheumatologists",
    kind: "specialty",
    family: "medical",
    label: "Rheumatologist",
    title: "What is a rheumatologist?",
    description:
      "The inflammatory and autoimmune sub-specialty, how it trains, and how it differs from orthopedics and rehabilitation.",
    blurb: "Autoimmune and inflammatory joint conditions, managed medically rather than surgically.",
    lede:
      "A rheumatologist is an internal medicine physician who sub-specialises in inflammatory and autoimmune conditions of the joints, muscles and connective tissue.",
    body: [
      "Rheumatology is a medical, non-surgical specialty. The conditions it covers are long-term and systemic, so the work is clinic-based and continuing, and heavy on laboratory monitoring and on biologic and immune-modifying drugs.",
      "It is a small specialty with a wide catchment. Many patients are managed in primary care between visits, and a good deal of musculoskeletal care goes instead to orthopedics, physical medicine and rehabilitation, or physical therapy. Orthopedic surgeons operate; rheumatologists do not.",
      "Pediatric rheumatology is a separate fellowship taken after a pediatrics residency and is filed under its own code. For a specialty this small, the practical consequence is geographic: many markets have no rheumatologist at all, and a state-level count is often the whole story rather than a starting point.",
    ],
    route: "An internal medicine residency, a two-year rheumatology fellowship, then board certification.",
    settings:
      "Hospital and health-system specialty clinics, infusion suites, academic divisions, and some independent single-specialty practice.",
    related: ["internal-medicine-physicians", "orthopedic-surgeons", "physical-medicine-and-rehabilitation"],
    list: "rheumatologists",
    classification: "Internal Medicine",
    audience: "physicians",
  },
  {
    term: "infectious-disease-physicians",
    kind: "specialty",
    family: "medical",
    label: "Infectious disease physician",
    title: "What is an infectious disease physician?",
    description:
      "A consultative internal medicine sub-specialty that also carries a hospital's stewardship and infection control work.",
    blurb: "A small consultative specialty with outsized say over antimicrobials and diagnostics.",
    lede:
      "An infectious disease physician is an internist who sub-specialises in infections, and who often carries a hospital's stewardship and infection control work.",
    body: [
      "Infectious disease is an internal medicine fellowship. Much of the work is consultative - advising on diagnosis and antimicrobial treatment for patients admitted under another service - alongside clinics for long-term infections and, at some centers, travel and transplant medicine.",
      "Two institutional roles usually sit with this specialty: antimicrobial stewardship and infection prevention. That makes infectious disease physicians decision-makers on formulary, diagnostics and testing policy out of all proportion to their numbers.",
      "It is one of the smallest adult medical sub-specialties, and it concentrates in hospitals and academic centers rather than in independent practice.",
    ],
    route: "An internal medicine residency, a fellowship in infectious disease of two years or more, then board certification.",
    settings: "Hospital consult services, academic medical centers, HIV and travel clinics, public health roles.",
    related: ["internal-medicine-physicians", "pulmonologists", "pathologists"],
    list: "infectious-disease-physicians",
    classification: "Internal Medicine",
    audience: "physicians",
  },
  {
    term: "neurologists",
    kind: "specialty",
    family: "medical",
    label: "Neurologist",
    title: "What is a neurologist?",
    description:
      "What neurologists do, why they share a classification with psychiatry, and how that changes a count of either.",
    blurb: "Brain, spine and nerve medicine - filed on the record beside psychiatry.",
    lede:
      "A neurologist is a physician trained in conditions of the brain, spinal cord, nerves and muscles, and does not operate.",
    body: [
      "Neurology is a residency of its own rather than an internal medicine fellowship. On the public record it shares a classification with psychiatry: the two are filed together beneath psychiatry and neurology, even though they are separate trainings and separate professions.",
      "Neurologists diagnose and manage. The operating is done by neurological surgeons, a different specialty with a much longer residency. Vascular and interventional neurology, epilepsy, neuromuscular medicine, movement disorders and sleep medicine are fellowships taken after residency.",
      "Because the classification is shared, a count of psychiatry and neurology is not a count of neurologists. The sub-specialty codes are what separate them, and both populations are large enough that mixing them changes an addressable market by a factor rather than a margin.",
    ],
    route:
      "Medical school, then a year of general clinical training and three years of neurology residency - four in total - then board certification.",
    settings: "Hospital stroke and neurology services, neurology groups, infusion and neurodiagnostic clinics, academic centers.",
    related: ["psychiatrists", "neurosurgeons", "physical-medicine-and-rehabilitation"],
    list: "neurologists",
    classification: "Psychiatry & Neurology",
    audience: "physicians",
  },
  {
    term: "psychiatrists",
    kind: "specialty",
    family: "medical",
    label: "Psychiatrist",
    title: "What is a psychiatrist?",
    description:
      "The medically qualified profession in mental health: how psychiatrists train, what they may prescribe, and who they work beside.",
    blurb: "The prescribing profession in mental health, and how it is filed on the record.",
    lede: "A psychiatrist is a medically qualified physician who specialises in mental health and can prescribe.",
    body: [
      "Psychiatry is a physician residency, and that is the practical distinction from the rest of behavioral health. Psychologists, counselors and clinical social workers assess and provide therapy; psychiatrists are the group whose training is medical and whose prescribing follows from a medical license. Psychiatric-mental health nurse practitioners also prescribe, under nursing law.",
      "On the public record psychiatry shares a classification with neurology, so a count of the classification covers both. Child and adolescent psychiatry, addiction psychiatry, geriatric psychiatry and forensic psychiatry have codes of their own.",
      "Psychiatry has more independent and self-pay practice than most physician specialties, and a large telehealth population, so a practice address here is a weaker signal of where the work happens than it would be in surgery.",
    ],
    route:
      "Medical school, a four-year psychiatry residency and board certification; sub-specialists add a fellowship of one or two years.",
    settings:
      "Community mental health centers, hospital psychiatric units, independent practice, integrated primary care, telehealth groups, correctional and veterans' facilities.",
    related: ["psychologists", "social-workers", "counselors", "neurologists"],
    list: "psychiatrists",
    classification: "Psychiatry & Neurology",
    audience: "mental-health-providers",
  },
  {
    term: "dermatologists",
    kind: "specialty",
    family: "medical",
    label: "Dermatologist",
    title: "What is a dermatologist?",
    description:
      "A specialty that is medical, surgical and cosmetic at once - how it trains, who else does the work, and where it has consolidated.",
    blurb: "Skin medicine, skin surgery and cosmetic work in one small specialty.",
    lede: "A dermatologist is a physician who specialises in the skin, hair and nails, and who both operates and prescribes.",
    body: [
      "Dermatology is its own residency. The specialty spans medical dermatology, surgical work including excisions and Mohs surgery, dermatopathology, and cosmetic procedures - an unusually wide commercial range for one specialty.",
      "It is small, competitive and high in procedure volume, most of it done in the office rather than a hospital. Private-equity-backed groups have consolidated a substantial share of independent practice, so ownership and employer on a dermatology record often say more than the location.",
      "Advanced practice providers deliver a large share of dermatology visits in the United States, so a dermatology audience built only from physician records will miss much of the clinical population.",
    ],
    route:
      "Medical school, a year of general clinical training and three years of dermatology residency, then board certification; Mohs surgery and dermatopathology are further fellowships.",
    settings:
      "Office-based single-specialty practice, consolidated dermatology groups, hospital and academic departments, cosmetic clinics.",
    related: ["plastic-surgeons", "physician-assistants", "nurse-practitioners"],
    list: "dermatologists",
    classification: "Dermatology",
    audience: "physicians",
  },
  {
    term: "allergists",
    kind: "specialty",
    family: "medical",
    label: "Allergist and immunologist",
    title: "What is an allergist or immunologist?",
    description:
      "The sub-specialty entered from either internal medicine or pediatrics, what it covers, and how thinly it is spread.",
    blurb: "One of the few fellowships entered from two different residencies.",
    lede:
      "An allergist-immunologist is a physician, trained first in internal medicine or pediatrics, who sub-specialises in allergy and disorders of the immune system.",
    body: [
      "Allergy and immunology is one of the few fellowships open from two different residencies: internists and pediatricians both enter it, and many practices see adults and children in the same clinic. It has a classification of its own on the public record, which makes it easier to count exactly than most sub-specialties.",
      "The work is clinic-based and test-heavy - skin and blood testing, immunotherapy schedules, and the long-term management of asthma and allergic conditions shared with primary care.",
      "It is a small and unevenly distributed specialty. Many smaller markets have very few, and coverage is often provided across several satellite sites by a single practice, so practice-level data matters more here than headcount.",
    ],
    route: "An internal medicine or pediatrics residency, a two-year allergy and immunology fellowship, then board certification.",
    settings: "Office-based allergy practices with satellite sites, hospital and academic divisions, some pediatric groups.",
    related: ["pulmonologists", "pediatricians", "internal-medicine-physicians"],
    list: "allergists",
    classification: "Allergy & Immunology",
    audience: "physicians",
  },
];

const SURGICAL: readonly GlossaryEntry[] = [
  {
    term: "surgeons",
    kind: "specialty",
    family: "surgical",
    label: "General surgeon",
    title: "What is a general surgeon?",
    description:
      "What general surgery covers, which surgical fields are separate classifications, and why the facility is usually the account.",
    blurb: "The broad abdominal and trauma specialty, and the classification other surgery is filed against.",
    lede:
      "General surgery is the broad surgical specialty of the abdomen and its contents, plus trauma, and the classification much other surgical training starts from.",
    body: [
      "A general surgeon's core work is the abdomen - gallbladder, appendix, hernia, bowel - along with much of a hospital's emergency surgical load, breast and endocrine surgery in many practices, and trauma care at centers that take it.",
      "On the public record surgery is a classification with a long list of specializations beneath it: trauma, surgical critical care, colorectal, vascular, surgical oncology, pediatric surgery and more. Several surgical fields are separate classifications rather than specializations - orthopedic surgery, neurological surgery, plastic surgery, otolaryngology, urology, obstetrics and gynecology - so all surgeons is never one code.",
      "Surgeons are the population most firmly tied to institutions. An operating room, an anesthesia team and a sterile supply chain are fixed assets, so the hospital or surgery center where a surgeon operates is usually the real account, and the surgeon is the person who specifies inside it.",
    ],
    route:
      "Medical school, a five-year general surgery residency, then board certification; most sub-specialties add a fellowship of one to two years.",
    settings:
      "Hospitals, ambulatory surgery centers, single-specialty and multi-specialty surgical groups, academic departments, trauma centers.",
    related: ["orthopedic-surgeons", "neurosurgeons", "plastic-surgeons", "anesthesiologists"],
    list: "surgeons",
    classification: "Surgery",
    audience: "physicians",
    also: [{ href: "/hospitals", label: "Certified hospitals, with beds and ownership" }],
  },
  {
    term: "orthopedic-surgeons",
    kind: "specialty",
    family: "surgical",
    label: "Orthopedic surgeon",
    title: "What is an orthopedic surgeon?",
    description:
      "The bone and joint surgical specialty: its fellowships, the professions it overlaps, and why so much has moved to surgery centers.",
    blurb: "Bones, joints and spine - and the device-heavy specialty that owns its own surgery centers.",
    lede: "An orthopedic surgeon operates on bones, joints, ligaments, tendons and the spine.",
    body: [
      "Orthopedic surgery is its own residency and its own classification. The sub-specialties beneath it - sports medicine, adult reconstruction and joint replacement, hand, foot and ankle, spine, trauma, pediatric orthopedics, musculoskeletal oncology - are fellowships, and most orthopedic surgeons practice within one of them.",
      "Two boundaries are worth knowing. Neurological surgeons also operate on the spine, and podiatrists are the other profession that operates on the foot. Non-surgical musculoskeletal care belongs to physical medicine and rehabilitation, sports medicine physicians, physical therapists and chiropractors.",
      "It is a high-revenue, device-heavy specialty, which is why so much of it has moved into ambulatory surgery centers that the surgeons themselves often part-own. Implant and instrument decisions sit with this group more than with hospital purchasing in many markets.",
    ],
    route:
      "Medical school, a five-year orthopedic surgery residency, then board certification; nearly all add a one-year fellowship.",
    settings:
      "Hospitals and orthopedic specialty hospitals, physician-owned ambulatory surgery centers, large single-specialty groups, academic departments.",
    related: ["surgeons", "podiatrists", "physical-medicine-and-rehabilitation", "chiropractors"],
    list: "orthopedic-surgeons",
    classification: "Orthopaedic Surgery",
    audience: "physicians",
  },
  {
    term: "neurosurgeons",
    kind: "specialty",
    family: "surgical",
    label: "Neurosurgeon",
    title: "What is a neurosurgeon?",
    description:
      "The longest surgical training in American medicine, why most of the volume is spine, and why the population maps onto hospitals.",
    blurb: "Brain and spine surgery - small, hospital-bound, and mostly spine in practice.",
    lede: "A neurosurgeon operates on the brain, the spinal cord and the nerves; most of the volume in practice is spine.",
    body: [
      "Neurological surgery is one of the longest trainings in American medicine and one of the smallest specialties. Cranial work - tumors, haemorrhage, trauma - is what the specialty is known for, but spinal surgery is the larger share of most practices, which puts neurosurgeons and orthopedic spine surgeons in the same market.",
      "It is almost entirely hospital-based. The case mix needs an intensive care unit, imaging and an emergency department behind it, and very few markets support a neurosurgery practice independent of a hospital, so this population maps closely onto the hospitals with a neuroscience service.",
      "Endovascular and functional neurosurgery are fellowship sub-specialties, and interventional neurology overlaps with the first of them.",
    ],
    route: "Medical school, a neurological surgery residency of about seven years, then board certification; fellowships add more.",
    settings: "Acute care hospitals with neuroscience services, academic medical centers, hospital-employed or hospital-aligned groups.",
    related: ["orthopedic-surgeons", "neurologists", "surgeons"],
    list: "neurosurgeons",
    classification: "Neurological Surgery",
    audience: "physicians",
  },
  {
    term: "plastic-surgeons",
    kind: "specialty",
    family: "surgical",
    label: "Plastic surgeon",
    title: "What is a plastic surgeon?",
    description:
      "One specialty, two businesses: hospital reconstruction and elective cosmetic surgery, and why a list should not mix them.",
    blurb: "Reconstruction and cosmetic surgery - the same training, two different markets.",
    lede: "A plastic surgeon is trained in reconstruction and in cosmetic surgery, and the two halves behave like different businesses.",
    body: [
      "Plastic and reconstructive surgery covers reconstruction after cancer, trauma or burns, hand surgery, craniofacial work, and elective cosmetic procedures. The training is one specialty; a given practice usually leans one way or the other.",
      "The reconstructive half is hospital work, referred and insured. The cosmetic half is elective, marketed directly to the public, often paid out of pocket, and frequently done in an office-based surgical suite the surgeon owns. A list that treats the two as one audience will misread both.",
      "Cosmetic procedures are also performed by physicians from other specialties and by advanced practice providers, so plastic surgeons are not the whole aesthetics market - they are the part of it with plastic surgery training.",
    ],
    route:
      "Either an integrated plastic surgery residency of about six years, or general surgery followed by a plastic surgery fellowship, then board certification.",
    settings:
      "Hospital reconstructive services and cancer centers, academic departments, private cosmetic practices and office-based surgical suites.",
    related: ["surgeons", "dermatologists", "otolaryngologists"],
    list: "plastic-surgeons",
    classification: "Plastic Surgery",
    audience: "physicians",
  },
  {
    term: "otolaryngologists",
    kind: "specialty",
    family: "surgical",
    label: "Otolaryngologist (ENT)",
    title: "What is an otolaryngologist (ENT)?",
    description:
      "Ear, nose, throat, head and neck surgery: the sub-specialties, the professions it overlaps, and what an ENT practice contains.",
    blurb: "Medical and surgical care of the ear, nose, throat, head and neck.",
    lede: "An otolaryngologist, usually called an ENT, is a surgeon of the ear, nose, throat, head and neck.",
    body: [
      "Otolaryngology - head and neck surgery is both a medical and a surgical specialty. Clinic work on sinuses, hearing, voice and swallowing sits alongside operating room work that runs from tonsils and ear tubes to head and neck cancer resection.",
      "Sub-specialties include otology and neurotology, head and neck oncology, rhinology, laryngology, facial plastic and reconstructive surgery, and pediatric otolaryngology. Facial plastic work overlaps plastic surgery, hearing overlaps audiology, and voice and swallowing overlap speech-language pathology - each of those a separate profession with its own license.",
      "Much of the specialty's procedure volume has moved into the office and into ambulatory surgery centers, and audiology and allergy services are often run inside an ENT practice. That makes these practices larger buyers of equipment than their physician headcount suggests.",
    ],
    route:
      "Medical school, a five-year otolaryngology residency, then board certification; sub-specialty fellowships add one to two years.",
    settings:
      "Single-specialty ENT groups with audiology in-house, hospitals and ambulatory surgery centers, academic departments, children's hospitals.",
    related: ["plastic-surgeons", "allergists", "speech-language-pathologists"],
    list: "otolaryngologists",
    classification: "Otolaryngology",
    audience: "physicians",
  },
  {
    term: "urologists",
    kind: "specialty",
    family: "surgical",
    label: "Urologist",
    title: "What is a urologist?",
    description:
      "The surgical specialty of the urinary tract, how it differs from nephrology, and why its groups are unusually large.",
    blurb: "Surgery of the urinary tract - and the specialty most often confused with nephrology.",
    lede: "A urologist is a surgeon of the urinary tract in both sexes and of the male reproductive system.",
    body: [
      "Urology is a surgical specialty with a large office-based component: catheter and scope procedures, stone management, cancer surgery of the prostate, bladder and kidney, and continence and fertility work. Robotic surgery is used heavily in the field.",
      "The kidney is shared ground with nephrology, and this is the distinction that catches list builders out. Nephrologists manage kidney function medically and supervise dialysis; urologists operate on the urinary tract. Separate specialties, separate training, separate codes.",
      "Urology is an ageing and undersupplied specialty concentrated in metropolitan areas, and much of it has consolidated into large single-specialty groups that run their own imaging, pathology and radiation services.",
    ],
    route: "Medical school, a urology residency of about five years, then board certification; oncology and other fellowships follow.",
    settings:
      "Large single-specialty groups, hospitals and ambulatory surgery centers, academic departments, cancer centers.",
    related: ["nephrologists", "surgeons", "medical-oncologists"],
    list: "urologists",
    classification: "Urology",
    audience: "physicians",
  },
  {
    term: "ob-gyns",
    kind: "specialty",
    family: "surgical",
    label: "Obstetrician-gynecologist",
    title: "What is an OB-GYN?",
    description:
      "One specialty with two halves: obstetrics and gynecology, the fellowships beneath it, and who practices alongside it.",
    blurb: "Pregnancy and childbirth, plus the medical and surgical care of the reproductive system.",
    lede:
      "An obstetrician-gynecologist is a physician trained both in pregnancy and childbirth and in the surgical and medical care of the female reproductive system.",
    body: [
      "Obstetrics and gynecology is one specialty with two halves. Obstetrics is pregnancy, labour and delivery; gynecology is office and surgical care of the reproductive organs. Most train in both, and practice patterns run from full scope to gynecology only.",
      "The sub-specialties are fellowships: maternal-fetal medicine, gynecologic oncology, reproductive endocrinology and infertility, and female pelvic medicine and reconstructive surgery. Certified nurse midwives practice alongside obstetricians in many delivery settings and are a separate profession with their own license and their own codes.",
      "Obstetrics is tied to hospitals with a labour and delivery unit, and the number of those units is falling in rural America, so this population is concentrating geographically faster than most specialties. A state-level count of OB-GYNs and a count of the units they can deliver in tell two different stories.",
    ],
    route:
      "Medical school, a four-year obstetrics and gynecology residency, then board certification; fellowships add about three years.",
    settings:
      "Hospital-employed and independent OB-GYN groups, labour and delivery units, ambulatory surgery centers, fertility clinics, community and women's health centers.",
    related: ["nurse-practitioners", "surgeons", "pediatricians"],
    list: "ob-gyns",
    classification: "Obstetrics & Gynecology",
    audience: "physicians",
  },
];

const HOSPITAL_BASED: readonly GlossaryEntry[] = [
  {
    term: "anesthesiologists",
    kind: "specialty",
    family: "hospital",
    label: "Anesthesiologist",
    title: "What is an anesthesiologist?",
    description:
      "What anesthesiologists do beyond the operating room, how the anesthesia care team works, and who the employer usually is.",
    blurb: "Anesthesia, pain medicine and critical care - and the care team that delivers them.",
    lede:
      "An anesthesiologist is a physician who manages anesthesia and a patient's physiology during surgery, and who also works in pain medicine and critical care.",
    body: [
      "Anesthesiology is a hospital and procedure-based specialty: the work exists wherever operations and procedures happen. Sub-specialties include critical care, pain medicine, cardiac, obstetric and pediatric anesthesia.",
      "Anesthesia is delivered by a care team in most of the United States. Certified registered nurse anesthetists and anesthesiologist assistants provide a large share of it, under models that differ by state and by facility, so an anesthesia audience containing only physicians is a minority of the people at the head of the table.",
      "The specialty is contracted and consolidated to an unusual degree. Large staffing groups hold hospital anesthesia contracts, which means the employer on one of these records is frequently a national group rather than the hospital where the work is done.",
    ],
    route:
      "Medical school, a four-year anesthesiology residency, then board certification; pain medicine and critical care are further fellowships.",
    settings:
      "Hospital operating rooms and intensive care units, ambulatory surgery centers, office-based surgical suites, pain clinics.",
    related: ["crna", "surgeons", "pulmonologists"],
    list: "anesthesiologists",
    classification: "Anesthesiology",
    audience: "physicians",
  },
  {
    term: "radiologists",
    kind: "specialty",
    family: "hospital",
    label: "Radiologist",
    title: "What is a radiologist?",
    description:
      "Diagnostic and interventional radiology, why a radiologist's address is a weak signal, and what the specialty specifies.",
    blurb: "The reading specialty - and the one where practice address tells you least.",
    lede:
      "A radiologist is a physician who interprets medical images, and in interventional practice performs image-guided procedures.",
    body: [
      "Diagnostic radiology is a reading specialty covering plain film, computed tomography, magnetic resonance, ultrasound and nuclear medicine. Interventional radiology is the procedural half, now trained through a pathway of its own, and radiation oncology is a separate specialty that uses radiation to treat rather than to diagnose.",
      "Radiology's working location and its filed address often differ. Reading can be done remotely, teleradiology groups cover many hospitals from few places, and a radiologist may be credentialled at facilities in several states. Practice address is a weaker signal here than in any other specialty.",
      "The specialty buys and specifies heavily - imaging equipment, contrast, reading software and machine-learning tools - and those decisions sit with the radiology group and the hospital imaging service rather than with the referring physicians.",
    ],
    route:
      "Medical school, a year of general clinical training and four years of diagnostic radiology residency, then board certification; sub-specialty fellowships usually add a year.",
    settings: "Hospital imaging departments, independent imaging centers, teleradiology groups, academic departments.",
    related: ["pathologists", "medical-oncologists", "surgeons"],
    list: "radiologists",
    classification: "Radiology",
    audience: "physicians",
  },
  {
    term: "pathologists",
    kind: "specialty",
    family: "hospital",
    label: "Pathologist",
    title: "What is a pathologist?",
    description:
      "The two halves of pathology, why laboratory directors are an outsized buying audience, and the sub-specialty codes.",
    blurb: "Diagnosis from tissue and from the laboratory - a small population with large budgets.",
    lede:
      "A pathologist is a physician who diagnoses disease from tissue, cells and laboratory results rather than by seeing patients.",
    body: [
      "Pathology has two halves. Anatomic pathology examines tissue and cells - surgical specimens, biopsies, cytology and autopsy. Clinical pathology runs the laboratory: chemistry, hematology, microbiology, transfusion and molecular testing. Most American pathologists are certified in both.",
      "The specialty's decisions are institutional. A pathologist directing a laboratory chooses analysers, reagents, informatics and send-out reference testing, which makes this small population an outsized buying audience for diagnostics.",
      "Dermatopathology, hematopathology, molecular genetic pathology, cytopathology and forensic pathology are sub-specialty fellowships with codes of their own.",
    ],
    route:
      "Medical school, a pathology residency of three to four years depending on the pathway, then board certification; fellowships add one to two years.",
    settings: "Hospital laboratories, independent and reference laboratories, academic departments, medical examiner offices.",
    related: ["radiologists", "hematologist-oncologists", "infectious-disease-physicians"],
    list: "pathologists",
    classification: "Pathology",
    audience: "physicians",
  },
  {
    term: "emergency-medicine-physicians",
    kind: "specialty",
    family: "hospital",
    label: "Emergency medicine physician",
    title: "What is an emergency physician?",
    description:
      "A specialty defined by the setting rather than the organ: what emergency training covers and who really employs it.",
    blurb: "The specialty of whoever comes through the door, and the staffing groups behind it.",
    lede: "An emergency physician is trained to stabilise and sort undifferentiated patients on arrival, whatever they present with.",
    body: [
      "Emergency medicine is defined by the setting rather than by an organ system or an age group: everyone who comes through the door, in any condition, in any order. The training covers resuscitation, procedures, and the decision about what happens next - admit, transfer or discharge.",
      "Sub-specialties include pediatric emergency medicine, emergency medical services and prehospital care, medical toxicology, ultrasound and sports medicine. Urgent care is a different business, staffed by emergency physicians, family physicians, nurse practitioners and physician assistants together.",
      "Like anesthesia, emergency medicine is heavily contracted. National and regional staffing groups hold the emergency department contract at a large share of American hospitals, so the employer on one of these records is often the group rather than the hospital where the shifts are worked.",
    ],
    route: "Medical school, an emergency medicine residency of three or four years, then board certification.",
    settings: "Hospital emergency departments, freestanding emergency centers, urgent care, prehospital and air medical services.",
    related: ["surgeons", "anesthesiologists", "physician-assistants"],
    list: "emergency-medicine-physicians",
    classification: "Emergency Medicine",
    audience: "physicians",
    also: [{ href: "/hospitals", label: "Certified hospitals, with emergency services flagged" }],
  },
];

const NURSING: readonly GlossaryEntry[] = [
  {
    term: "nurse-practitioners",
    kind: "specialty",
    family: "nursing",
    label: "Nurse practitioner",
    title: "What is a nurse practitioner (NP)?",
    description:
      "What a nurse practitioner is licensed to do, why scope depends on the state, and how the population focuses are filed.",
    blurb: "An advanced practice nurse who diagnoses and prescribes - within the scope the state allows.",
    lede:
      "A nurse practitioner is an advanced practice registered nurse with graduate training who assesses, diagnoses and prescribes within the scope their state allows.",
    body: [
      "Nurse practitioners are registered nurses who have completed a master's or doctoral program in an advanced practice role and passed a national certification examination. They are licensed and regulated as nurses, by a board of nursing, not as physicians.",
      "Scope of practice is the thing that varies, and it varies by state rather than by individual. Some states grant full practice authority, letting a nurse practitioner evaluate, diagnose and prescribe independently; others require a collaborative or supervisory arrangement with a physician for some or all of that. Any national list has to be read with that map beside it.",
      "NPs certify into a population focus - family, adult-gerontology, pediatric, psychiatric-mental health, women's health, neonatal - and those appear as separate codes on the public record, with family nurse practitioners the largest by a wide margin.",
      "Commercially they are prescribers and decision-makers in their own right, and the fastest-growing prescribing population in the country, which is why a physician-only list understates a therapeutic market rather than merely sampling it.",
    ],
    route:
      "A nursing degree and RN license, clinical experience, then a master's or doctoral advanced practice program and a national certification examination.",
    settings:
      "Primary care and specialty clinics, retail and urgent care, hospitals, community health centers, long-term care, telehealth, and independent practice where the state allows it.",
    letters: [
      { letters: "NP", means: "Nurse practitioner - the role." },
      { letters: "APRN", means: "Advanced practice registered nurse - the license category the role sits in." },
      { letters: "FNP, PNP, AGNP, PMHNP", means: "The population focus certified in: family, pediatric, adult-gerontology, psychiatric-mental health." },
      { letters: "MSN, DNP", means: "The graduate degree behind it: a master's or a doctorate of nursing practice." },
    ],
    related: ["family-nurse-practitioners", "physician-assistants", "registered-nurses", "crna"],
    list: "nurse-practitioners",
    classification: "Nurse Practitioner",
    audience: "nurses",
  },
  {
    term: "family-nurse-practitioners",
    kind: "specialty",
    family: "nursing",
    label: "Family nurse practitioner",
    title: "What is a family nurse practitioner?",
    description:
      "The largest nurse practitioner population focus, what the certification covers, and how it nests inside the classification.",
    blurb: "The all-ages NP certification, and the largest NP population in the country.",
    lede:
      "A family nurse practitioner is a nurse practitioner whose certification covers patients of all ages, and it is the largest NP population in the country.",
    body: [
      "The family population focus is the nurse practitioner equivalent of family medicine: all ages, continuing care, wide scope. It is the most commonly held NP certification and the one most likely to be found in primary care, urgent care and retail clinics.",
      "It is a specialization beneath the nurse practitioner classification on the public record. A list filtered to the classification includes family nurse practitioners along with every other population focus; a list filtered to this single code excludes the rest.",
      "Because the certification is deliberately broad, the employer and the practice setting tell you more about what one of these clinicians actually does day to day than the code does.",
    ],
    route:
      "An RN license and nursing experience, a master's or doctoral family nurse practitioner program, then a national family certification examination.",
    settings: "Primary care, urgent and retail clinics, community health centers, rural practice, specialty clinics.",
    related: ["nurse-practitioners", "family-medicine-physicians", "physician-assistants"],
    list: "family-nurse-practitioners",
    classification: "Nurse Practitioner",
    audience: "nurses",
  },
  {
    term: "registered-nurses",
    kind: "specialty",
    family: "nursing",
    label: "Registered nurse",
    title: "What is a registered nurse (RN)?",
    description:
      "Why registered nursing is a license rather than a specialty, and why the nurses on a public register are not a census.",
    blurb: "The largest healthcare profession, and what an identifier on the record does and does not mean.",
    lede:
      "A registered nurse holds a state nursing license earned through an approved program and the national licensing examination, and it is the largest healthcare profession in the country.",
    body: [
      "Registered nursing is a license, not a specialty. The same license covers the hospital bedside, the operating room, the clinic, the school, the dialysis unit and an insurer's care management department, and nursing specialties are voluntary certifications on top of it rather than separate licenses.",
      "Not every registered nurse holds a National Provider Identifier. An identifier is needed by clinicians who bill or are named in transactions, so the registered nurses on a public register are the ones who have needed one. That is a real and useful population, but it is not a census of the profession, and a page that treated it as one would be overstating what the public record can tell you.",
      "The advanced practice roles - nurse practitioner, certified registered nurse anesthetist, certified nurse midwife, clinical nurse specialist - are built on the RN license and are separately licensed, certified and filed.",
    ],
    route:
      "An associate or bachelor's degree in nursing from an approved program, then the national licensure examination and a state license; specialty certifications follow experience.",
    settings:
      "Hospitals of every kind, nursing homes and post-acute care, home health, clinics and physician offices, dialysis centers, schools, insurers and case management.",
    letters: [
      { letters: "RN", means: "Registered nurse - the license." },
      { letters: "BSN, MSN", means: "The degree: a bachelor's or master's of science in nursing." },
      { letters: "APRN", means: "Advanced practice registered nurse - a further license built on the RN." },
    ],
    related: ["nurse-practitioners", "crna", "physician-assistants"],
    list: "registered-nurses",
    classification: "Registered Nurse",
    audience: "nurses",
    also: [
      { href: "/nursing-homes", label: "Certified nursing homes by state and town" },
      { href: "/home-health-agencies", label: "Certified home health agencies" },
    ],
  },
  {
    term: "physician-assistants",
    kind: "specialty",
    family: "nursing",
    label: "Physician assistant",
    title: "What is a physician assistant (PA-C)?",
    description:
      "How PAs train, what the certification means, how they differ from nurse practitioners, and why they are the buyer in procedural specialties.",
    blurb: "A generalist-trained licensed clinician who specialises by employment, and prescribes.",
    lede:
      "A physician assistant is a licensed clinician trained in general medicine at master's level who examines, diagnoses, treats and prescribes in collaboration with physicians.",
    body: [
      "The profession was built as a generalist one. PAs train in a medical model across specialties and then specialize by employment rather than through a separate certification, which is why the same PA can move from emergency medicine to orthopedics without retraining.",
      "Certification is national and maintained - the C in PA-C stands for certified - and the license is issued by a state board. The relationship with physicians is defined in state law and has been loosening in several states, but it remains the structural difference from nurse practitioners, who are regulated as nurses instead.",
      "The profession's national association has adopted physician associate as its preferred title. State licenses and the public record still say physician assistant, so that is what a list is filtered on.",
      "PAs are prescribers, and in surgical and procedural specialties they are often the clinician a supplier's representative actually deals with. A physician-only list leaves them out entirely.",
    ],
    route:
      "A bachelor's degree with prerequisite coursework and clinical hours, a master's-level PA program of about two to three years, then the national certifying examination and a state license.",
    settings:
      "Hospital services of every kind, surgical and specialty practices, primary and urgent care, emergency departments, occupational and correctional health.",
    letters: [
      { letters: "PA-C", means: "Physician assistant, currently certified by national examination." },
      { letters: "PA", means: "The licensed role, without asserting current certification." },
    ],
    related: ["nurse-practitioners", "emergency-medicine-physicians", "family-medicine-physicians"],
    list: "physician-assistants",
    classification: "Physician Assistant",
    audience: "advanced-practice-providers",
  },
];

const DENTAL: readonly GlossaryEntry[] = [
  {
    term: "dentists",
    kind: "specialty",
    family: "dental",
    label: "Dentist",
    title: "What is a dentist?",
    description:
      "A separate profession with its own degrees and licenses: what a dentist may do, the recognized specialties, and who owns the practice.",
    blurb: "An independently licensed profession, two interchangeable degrees, nine recognized specialties.",
    lede: "A dentist is an independently licensed doctor of the mouth, teeth and jaws, holding either a DDS or a DMD.",
    body: [
      "Dentistry is a separate profession with its own schools, licenses and boards, not a medical specialty. A dentist examines, diagnoses, prescribes and operates within the mouth and the structures around it, and most also employ and supervise dental hygienists and assistants.",
      "Two degree abbreviations exist for the same qualification. Which one a dentist holds depends on the school they attended, and state boards treat the DDS and the DMD as equivalent, so neither tells you anything about scope or seniority.",
      "Most dentists are general dentists. The recognized specialties - orthodontics, pediatric dentistry, oral and maxillofacial surgery, endodontics, periodontics, prosthodontics, oral pathology, oral radiology, dental anesthesiology and dental public health - each require a further residency and are filed under their own codes.",
      "Dentistry is also a small-business population. A large share of dentists own the practice they work in, which makes them buyers as well as clinicians, though group and private-equity-backed dental organizations have taken a growing share of that market.",
    ],
    route:
      "A bachelor's degree, four years of dental school for the DDS or DMD, then regional or state licensing examinations; specialists add a residency of two to six years.",
    settings:
      "Solo and group private practice, dental support organizations, community health and school-based clinics, hospital dental services, the armed forces and public health.",
    letters: [
      { letters: "DDS", means: "Doctor of Dental Surgery." },
      { letters: "DMD", means: "Doctor of Dental Medicine - the same qualification from a different school." },
    ],
    related: ["general-dentists", "orthodontists", "pediatric-dentists"],
    list: "dentists",
    classification: "Dentist",
    audience: "dentists",
  },
  {
    term: "general-dentists",
    kind: "specialty",
    family: "dental",
    label: "General dentist",
    title: "What is a general dentist?",
    description:
      "The large majority of the dental profession: what general practice covers, and why this is also the list of practice owners.",
    blurb: "Dentistry outside the recognized specialties - and where practice ownership sits.",
    lede: "A general dentist is a licensed dentist who has not taken a specialty residency, and they are the large majority of the profession.",
    body: [
      "General dentistry is all of dental practice that is not a recognized specialty: examinations, restorative work, crowns and bridges, extractions, root canal treatment in many practices, and increasingly implant and cosmetic work. Scope is set by the license and by the dentist's own continuing training rather than by a specialty certificate.",
      "On the public record general practice is a specialization beneath the dentist classification. It is the right code when you want practice owners and the clinicians who refer cases out, and the wrong one when you want orthodontists or oral surgeons.",
      "Because this is where ownership sits, a general dentist list doubles as a list of buyers - for equipment, materials, laboratory work and practice software.",
    ],
    route: "The same four-year DDS or DMD and state license as any dentist, with continuing education in place of a specialty residency.",
    settings: "Private solo and group practice, dental support organizations, community clinics, public health.",
    related: ["dentists", "orthodontists", "pediatric-dentists"],
    list: "general-dentists",
    classification: "Dentist",
    audience: "dentists",
  },
  {
    term: "orthodontists",
    kind: "specialty",
    family: "dental",
    label: "Orthodontist",
    title: "What is an orthodontist?",
    description:
      "The dental specialty of tooth and jaw alignment: the residency behind it, and why general dentists are in the same market.",
    blurb: "A recognized dental specialty, usually single-specialty and multi-site.",
    lede: "An orthodontist is a dentist who has completed a specialty residency in tooth and jaw alignment.",
    body: [
      "Orthodontics and dentofacial orthopedics is a recognized dental specialty. After dental school an orthodontist completes a further residency of two to three years in the movement of teeth and the management of jaw relationships, using fixed appliances and clear aligner systems.",
      "General dentists also provide aligner treatment, so the market for orthodontic products is wider than the orthodontist population. The specialty is the part of it with residency training and, usually, the highest case volume per practice.",
      "Orthodontic practices are typically single-specialty, referral-fed and often run across several sites, which makes the practice rather than the individual the natural account.",
    ],
    route:
      "A DDS or DMD, an accredited orthodontic residency of two to three years, a dental license, and in most cases specialty board certification.",
    settings: "Single-specialty orthodontic practices, often with satellite offices, group dental organizations, academic programs.",
    related: ["dentists", "general-dentists", "pediatric-dentists"],
    list: "orthodontists",
    classification: "Dentist",
    audience: "dentists",
  },
  {
    term: "pediatric-dentists",
    kind: "specialty",
    family: "dental",
    label: "Pediatric dentist",
    title: "What is a pediatric dentist?",
    description:
      "The dental specialty for children and patients with special needs, and why it is not everyone who treats children.",
    blurb: "A recognized specialty for children, concentrated in metropolitan group practice.",
    lede: "A pediatric dentist is a dentist with a specialty residency in the dental care of children, including children with special needs.",
    body: [
      "Pediatric dentistry is a recognized dental specialty covering infancy through adolescence. The residency adds child development, behavior guidance, sedation, and care for patients with medical complexity or disability.",
      "General dentists see children too, and in much of the country they are the only option, so a pediatric dental list is not a list of everyone who treats children. It is the specialty-trained part of that population.",
      "The specialty is concentrated in metropolitan markets and in group practices, and it carries a large share of publicly insured pediatric dental volume - which is worth knowing before a campaign is priced. Practices are frequently multi-site and run under a group name rather than the dentist's own, so the employer on a record is often the better handle.",
    ],
    route:
      "A DDS or DMD, a two-year accredited pediatric dentistry residency, a dental license, and commonly specialty board certification.",
    settings:
      "Single-specialty children's dental practices, group dental organizations, hospital dental departments, community and school-based programs.",
    related: ["dentists", "general-dentists", "pediatricians"],
    list: "pediatric-dentists",
    classification: "Dentist",
    audience: "dentists",
  },
];

const BEHAVIOURAL: readonly GlossaryEntry[] = [
  {
    term: "psychologists",
    kind: "specialty",
    family: "behavioural",
    label: "Psychologist",
    title: "What is a psychologist?",
    description:
      "A doctoral profession: what psychologists assess and treat, where prescribing authority sits, and the areas of practice.",
    blurb: "The doctoral behavioral health profession, and the one that does formal assessment.",
    lede:
      "A psychologist is a doctoral-level clinician licensed to assess, diagnose and treat mental health conditions with therapy and psychological testing.",
    body: [
      "Clinical and counseling psychology are doctoral professions: a PhD, PsyD or EdD, a supervised internship, supervised postdoctoral experience in most states, and a national licensing examination. That doctorate is why the title is protected, and why psychologists rather than therapists in general carry out formal psychological and neuropsychological assessment.",
      "Psychologists do not prescribe in most of the country. A small number of states have granted prescriptive authority to psychologists with additional training; elsewhere medication belongs to psychiatrists, primary care physicians and psychiatric-mental health nurse practitioners. This is the sharpest line in behavioral health and the one most often got wrong in targeting.",
      "School psychology, neuropsychology, forensic and health psychology are distinct areas of practice with codes of their own, and not all of them are clinical.",
    ],
    route:
      "A doctoral degree in psychology, a supervised internship, supervised postdoctoral experience in most states, then the national licensing examination.",
    settings:
      "Independent and group practice, community mental health, hospitals and rehabilitation units, schools, universities, correctional and veterans' facilities, telehealth.",
    related: ["psychiatrists", "counselors", "social-workers"],
    list: "psychologists",
    classification: "Psychologist",
    audience: "mental-health-providers",
  },
  {
    term: "counselors",
    kind: "specialty",
    family: "behavioural",
    label: "Licensed counselor",
    title: "What is a licensed counselor?",
    description:
      "A master's-level licensed profession whose title and scope differ state by state, and the distinct licenses filed beneath it.",
    blurb: "One classification, a dozen state titles - and why this entry stops where it does.",
    lede: "A counselor is a master's-level licensed mental health clinician, and the exact title and letters depend on the state.",
    body: [
      "Counseling is a master's-level licensed profession: a graduate degree, supervised post-graduate clinical hours, and a national examination. What varies, more than in any other clinical profession, is the name. Licensed professional counselor, licensed mental health counselor, licensed clinical professional counselor and several other titles describe broadly the same license in different states.",
      "Beneath the counselor classification sit distinct licenses with distinct training: addiction and substance use counseling, marriage and family therapy, rehabilitation counseling, pastoral counseling and school counseling among them. They are not interchangeable, and not all of them are independently licensed everywhere.",
      "So this entry is shorter than the rest on purpose. Because titles, scope and supervision requirements differ state by state, any confident sentence about what a counselor may do nationally would be wrong somewhere, and the state license is the only reliable answer. What the public record gives you is the classification and the specialization each person filed, which is a sound basis for a list and a poor basis for an assumption.",
    ],
    route:
      "A master's degree in counseling or a related field, supervised post-graduate clinical hours, a national examination, and a state license whose title varies.",
    settings:
      "Independent and group practice, community mental health agencies, addiction treatment programs, schools and colleges, employee assistance programs, telehealth.",
    caveat:
      "Counseling titles, scope and supervision rules differ state by state, and we would rather say less here than publish a national rule that is wrong in a dozen states. The classification and specialization each person filed is what a list is built on.",
    related: ["social-workers", "psychologists", "psychiatrists"],
    list: "counselors",
    classification: "Counselor",
    audience: "mental-health-providers",
  },
  {
    term: "social-workers",
    kind: "specialty",
    family: "behavioural",
    label: "Clinical social worker",
    title: "What is a clinical social worker?",
    description:
      "What the classification contains, what the clinical license requires, and why this is the behavioral health population most underestimated.",
    blurb: "Therapy and the practical circumstances around it - and a very large licensed population.",
    lede:
      "A clinical social worker is a master's-level licensed clinician who provides therapy and also works on the practical circumstances around a patient.",
    body: [
      "Social work covers a wider range than therapy. The classification includes clinical social workers licensed to diagnose and treat mental health conditions, and also the hospital and community social workers whose work is discharge planning, benefits, housing, safeguarding and coordination.",
      "The clinical license - LCSW in most states, LICSW or LCSW-C in others - requires a master's in social work plus supervised post-master's clinical hours and a clinical examination. It is the license that allows independent practice and, in most states, billing for therapy.",
      "Clinical social workers are among the largest groups of licensed psychotherapy providers in the United States, which makes them the behavioral health population most often underestimated in a list built around psychiatrists and psychologists.",
    ],
    route:
      "A master of social work degree, supervised post-master's clinical hours, a clinical licensing examination, then a state license.",
    settings:
      "Hospitals and health systems, community mental health, independent and group therapy practice, hospices and home health, child welfare and schools, veterans' facilities.",
    letters: [
      { letters: "LCSW", means: "Licensed clinical social worker - independent clinical practice." },
      { letters: "LICSW, LCSW-C", means: "The same clinical license under another state's name." },
      { letters: "LMSW, MSW", means: "The degree and the pre-clinical license, before supervised hours are complete." },
    ],
    related: ["counselors", "psychologists", "psychiatrists"],
    list: "social-workers",
    classification: "Social Worker",
    audience: "mental-health-providers",
    also: [{ href: "/hospices", label: "Certified hospices, where social work is part of the team" }],
  },
];

const REHAB: readonly GlossaryEntry[] = [
  {
    term: "physical-therapists",
    kind: "specialty",
    family: "rehab",
    label: "Physical therapist",
    title: "What is a physical therapist (PT)?",
    description:
      "A doctoral, independently licensed profession: what physical therapy treats, and how it differs from OT and physiatry.",
    blurb: "Movement and function, doctoral entry, and mostly clinic chains rather than individuals.",
    lede:
      "A physical therapist is a licensed clinician, now trained to doctoral level, who treats movement and function with exercise and manual therapy.",
    body: [
      "Physical therapy is an independent licensed profession. Entry to practice is the Doctor of Physical Therapy, followed by the national licensing examination and a state license, and in most states patients can reach a physical therapist directly without a referral.",
      "The work is rehabilitation and function: recovery after surgery or injury, long-term musculoskeletal and neurological conditions, balance, and return to work or sport. Board specialization in orthopedics, neurology, sports, geriatrics or pediatrics is voluntary and sits on top of the license.",
      "Two professions are commonly confused with it. Occupational therapists work on the tasks of daily life rather than on movement itself, and physiatrists are physicians in physical medicine and rehabilitation who direct rehabilitation care and prescribe.",
      "Practice is concentrated in outpatient clinics, many of them owned by national chains or by physician groups, so the clinic rather than the individual therapist is usually the buying unit.",
    ],
    route:
      "A bachelor's degree, a three-year Doctor of Physical Therapy program, the national licensing examination and a state license; residencies and board specialization are optional.",
    settings:
      "Outpatient clinics and chains, hospitals and inpatient rehabilitation facilities, skilled nursing and home health, schools, sports and occupational health.",
    letters: [
      { letters: "PT", means: "Physical therapist - the license." },
      { letters: "DPT", means: "Doctor of Physical Therapy - the entry-level degree." },
      { letters: "PTA", means: "Physical therapist assistant - a separate credential, working under a PT's direction." },
    ],
    related: ["occupational-therapists", "physical-medicine-and-rehabilitation", "chiropractors"],
    list: "physical-therapists",
    classification: "Physical Therapist",
    audience: "physical-occupational-therapists",
    also: [{ href: "/home-health-agencies", label: "Certified home health agencies" }],
  },
  {
    term: "occupational-therapists",
    kind: "specialty",
    family: "rehab",
    label: "Occupational therapist",
    title: "What is an occupational therapist?",
    description:
      "What occupational therapy actually means, how OTs are licensed, and the real difference from physical therapy.",
    blurb: "The everyday-tasks profession, and why occupation does not mean employment.",
    lede: "An occupational therapist is a licensed clinician who helps people carry out the everyday tasks a condition has made difficult.",
    body: [
      "Occupational therapy is about occupations in the broad sense: dressing, eating, writing, working, driving, playing. An OT assesses what a person needs to do, works out what is getting in the way, and adapts the task, the tools or the environment as well as treating the underlying impairment.",
      "Entry to practice is a master's or doctoral degree, supervised fieldwork, a national certification examination and a state license. Occupational therapy assistants practice under an OT's direction and are licensed or certified separately.",
      "The difference from physical therapy is the target rather than the setting. Physical therapy works on movement, strength and pain; occupational therapy works on the activity. Hand therapy, pediatric developmental work, and home and driving assessment are areas where occupational therapists lead.",
    ],
    route:
      "A master's or doctoral occupational therapy program, supervised fieldwork, the national certification examination and a state license.",
    settings:
      "Hospitals and inpatient rehabilitation, skilled nursing, schools and early intervention, outpatient and hand therapy clinics, home health, mental health services.",
    letters: [
      { letters: "OTR/L", means: "Occupational therapist, registered and licensed." },
      { letters: "MOT, OTD", means: "The entry-level degree: a master's or a clinical doctorate." },
      { letters: "COTA", means: "Certified occupational therapy assistant - a separate credential." },
    ],
    related: ["physical-therapists", "speech-language-pathologists", "physical-medicine-and-rehabilitation"],
    list: "occupational-therapists",
    classification: "Occupational Therapist",
    audience: "physical-occupational-therapists",
  },
  {
    term: "speech-language-pathologists",
    kind: "specialty",
    family: "rehab",
    label: "Speech-language pathologist",
    title: "What is a speech-language pathologist?",
    description:
      "Speech, language, voice and swallowing: how SLPs qualify, and why schools rather than clinics dominate the profession.",
    blurb: "More than speech - and a profession whose largest employer is the school system.",
    lede: "A speech-language pathologist assesses and treats speech, language, voice, fluency and swallowing.",
    body: [
      "Speech-language pathology covers much more than speech. Language and communication development in children, voice and fluency, cognitive-communication after brain injury, and swallowing all sit within scope, and swallowing is a large part of the hospital and nursing home workload.",
      "Entry to practice is a master's degree, a supervised clinical fellowship, a national examination and a state license, with the professional certification usually written CCC-SLP. Speech-language pathology assistants work under supervision where a state recognizes them.",
      "The largest single employer of the profession is the school system, which makes this population's addresses and employers look unlike most clinical lists: public districts and early intervention programs rather than practices and hospitals.",
    ],
    route:
      "A master's degree in speech-language pathology, a supervised clinical fellowship, the national examination, state licensure and commonly the professional certification.",
    settings:
      "Public schools and early intervention, hospitals and inpatient rehabilitation, skilled nursing, outpatient clinics, home health, private practice.",
    letters: [
      { letters: "SLP", means: "Speech-language pathologist." },
      { letters: "CCC-SLP", means: "The professional certification, held by most of the profession." },
    ],
    related: ["occupational-therapists", "otolaryngologists", "physical-therapists"],
    list: "speech-language-pathologists",
    classification: "Speech-Language Pathologist",
    audience: "physical-occupational-therapists",
  },
  {
    term: "physical-medicine-and-rehabilitation",
    kind: "specialty",
    family: "rehab",
    label: "Physiatrist (PM&R)",
    title: "What is a physiatrist (PM&R)?",
    description:
      "A physiatrist is a physician in physical medicine and rehabilitation: what the specialty covers, how it trains and where it works.",
    blurb: "The physician specialty of function and non-surgical musculoskeletal care.",
    lede:
      "A physiatrist is a physician in physical medicine and rehabilitation: a medical specialist in function, disability and non-surgical musculoskeletal care.",
    body: [
      "Physical medicine and rehabilitation is a physician residency, and a physiatrist is a doctor - which is the first thing anyone searching the word is usually trying to establish. The specialty's subject is function: what a person can do after a stroke, a spinal cord or brain injury, an amputation or a long-term musculoskeletal condition, and how to improve it.",
      "Physiatrists direct rehabilitation teams of physical, occupational and speech therapists, prescribe, perform diagnostic electromyography and image-guided injections, and manage spasticity, prosthetics and bracing. They are the non-surgical counterpart to orthopedic and spine surgery, and interventional pain medicine is a large sub-specialty within the field.",
      "Sub-specialties include pain medicine, spinal cord injury medicine, brain injury medicine, neuromuscular medicine, sports medicine and pediatric rehabilitation.",
      "The word physiatrist is searched far more often than the specialty's formal name. They are the same thing: on the public record the classification reads physical medicine and rehabilitation, and that is what a list is filtered on.",
    ],
    route:
      "Medical school, a four-year physical medicine and rehabilitation residency, then board certification; sub-specialty fellowships add a year.",
    settings:
      "Inpatient rehabilitation facilities and hospital rehabilitation units, outpatient musculoskeletal and spine clinics, interventional pain practices, skilled nursing, academic departments.",
    related: ["physical-therapists", "orthopedic-surgeons", "neurologists", "occupational-therapists"],
    list: "physical-medicine-and-rehabilitation",
    classification: "Physical Medicine & Rehabilitation",
    audience: "physicians",
  },
];

const EYE: readonly GlossaryEntry[] = [
  {
    term: "optometrists",
    kind: "specialty",
    family: "eye",
    label: "Optometrist",
    title: "What is an optometrist (OD)?",
    description:
      "The doctor of optometry: what an OD examines and prescribes, where the surgical line falls, and why retail matters here.",
    blurb: "An independently licensed eye doctor, with scope set state by state.",
    lede:
      "An optometrist is an independently licensed doctor of optometry who examines eyes, prescribes glasses and contact lenses, and manages many eye conditions medically.",
    body: [
      "Optometry is a four-year doctoral profession with its own schools, licensing examinations and state boards. The core work is the comprehensive eye examination, refraction and the prescription of glasses and contact lenses, together with the diagnosis and medical management of eye disease.",
      "The line between optometry and ophthalmology is surgery, and exactly where it falls is set by each state. Optometrists prescribe medication for the eye everywhere; some states also permit defined laser or minor surgical procedures and the rest do not. Ophthalmologists are physicians and surgeons.",
      "Optometry is also retail. A large share of optometrists practice in or beside an optical dispensary, and corporate or chain affiliation is common, so the practice on a record often matters as much as the clinician on it.",
    ],
    route:
      "A bachelor's degree, four years of optometry school for the Doctor of Optometry, then national board examinations and a state license; residencies are optional.",
    settings:
      "Independent optometric practice, optical chains and retail locations, ophthalmology practices, community health centers, veterans' facilities.",
    letters: [{ letters: "OD", means: "Doctor of Optometry." }],
    related: ["ophthalmologists"],
    list: "optometrists",
    classification: "Optometrist",
    audience: "optometrists-ophthalmologists",
  },
  {
    term: "ophthalmologists",
    kind: "specialty",
    family: "eye",
    label: "Ophthalmologist",
    title: "What is an ophthalmologist?",
    description:
      "The physician and surgeon of the eye: the fellowships, the difference from optometry, and why eye lists should hold both.",
    blurb: "The surgical eye profession, and how it works alongside optometry.",
    lede: "An ophthalmologist is a physician and surgeon of the eye, and the difference from an optometrist is medical school and the operating room.",
    body: [
      "Ophthalmology is a physician specialty: medical school, residency, board certification. Ophthalmologists examine and prescribe as optometrists do, and they also perform eye surgery - cataract, retina, cornea, glaucoma and oculoplastic procedures - which optometrists, with limited state-by-state exceptions, do not.",
      "Sub-specialties are fellowships: retina, cornea and refractive surgery, glaucoma, pediatric ophthalmology and strabismus, oculoplastics, and neuro-ophthalmology. Cataract surgery is one of the highest-volume operations in American medicine and sits mostly with general ophthalmologists.",
      "The two professions work side by side more than they compete. Many practices employ optometrists for examinations and refer surgical cases internally, so a list aimed at eye care should usually contain both - and the two are filed under separate classifications, which means two filters rather than one.",
    ],
    route:
      "Medical school, a year of general clinical training and three years of ophthalmology residency, then board certification; fellowships add one to two years.",
    settings:
      "Single-specialty eye practices and their ambulatory surgery centers, hospital departments, academic eye institutes, consolidated eye care groups.",
    related: ["optometrists", "plastic-surgeons"],
    list: "ophthalmologists",
    classification: "Ophthalmology",
    audience: "optometrists-ophthalmologists",
  },
];

const OTHER_CLINICAL: readonly GlossaryEntry[] = [
  {
    term: "chiropractors",
    kind: "specialty",
    family: "other",
    label: "Chiropractor",
    title: "What is a chiropractor (DC)?",
    description:
      "An independently licensed profession outside medicine: what a DC's training and scope are, and how fragmented the market is.",
    blurb: "Manual musculoskeletal practice, portal of entry in every state, almost entirely small business.",
    lede:
      "A chiropractor is an independently licensed Doctor of Chiropractic whose practice centers on manual treatment of the spine and musculoskeletal system.",
    body: [
      "Chiropractic is a separate licensed profession with its own four-year doctoral programs, national board examinations and state boards. Practice is built around manual adjustment and manipulation, usually with exercise, soft tissue work and physical modalities alongside it.",
      "Chiropractors are portal-of-entry providers in every state, meaning a patient can go directly without a referral. Scope varies - imaging, physical modalities, nutritional advice and certain diagnostic privileges differ by state - and chiropractors do not prescribe drugs or perform surgery anywhere.",
      "Almost all of the profession is in small independent practice, often owner-operated single sites. That makes chiropractors a large and very fragmented business audience in which each record is usually both the clinician and the buyer.",
    ],
    route:
      "Undergraduate prerequisites, a four-year Doctor of Chiropractic program, national board examinations and a state license.",
    settings:
      "Solo and small group chiropractic offices, integrated musculoskeletal and sports clinics, occupational and personal injury practice, some hospital and veterans' settings.",
    letters: [{ letters: "DC", means: "Doctor of Chiropractic." }],
    related: ["physical-therapists", "physical-medicine-and-rehabilitation", "orthopedic-surgeons"],
    list: "chiropractors",
    classification: "Chiropractor",
    audience: "chiropractors",
  },
  {
    term: "podiatrists",
    kind: "specialty",
    family: "other",
    label: "Podiatrist",
    title: "What is a podiatrist (DPM)?",
    description:
      "The Doctor of Podiatric Medicine: training, surgical scope, and the specialty that covers the same ground from medicine.",
    blurb: "A separate doctoral profession licensed to operate on the foot and ankle.",
    lede:
      "A podiatrist is a Doctor of Podiatric Medicine, licensed to diagnose, prescribe for and operate on the foot, ankle and related structures.",
    body: [
      "Podiatry is its own doctoral profession with its own colleges, and a podiatrist's degree is a DPM rather than an MD or DO. Training is four years of podiatric medical school followed by a hospital-based residency, typically three years, and the profession is licensed and boarded separately from medicine.",
      "Scope is defined by anatomy rather than by procedure: podiatrists prescribe, order imaging and operate within the foot and ankle, with the upper limit of that territory set by each state. Orthopedic foot and ankle surgeons cover the same ground from the other direction, which makes those two professions the pair to consider together for anything below the knee.",
      "Diabetic foot and wound care and conditions of the nails and skin of the foot make up much of the volume, and a large share of podiatrists are in independent or small group practice with hospital and surgery center privileges.",
    ],
    route:
      "A bachelor's degree, four years of podiatric medical school for the DPM, a hospital-based residency of about three years, then a state license.",
    settings:
      "Independent and group podiatry practices, orthopedic and multi-specialty groups, hospitals and surgery centers, wound care centers, nursing homes, veterans' facilities.",
    letters: [{ letters: "DPM", means: "Doctor of Podiatric Medicine." }],
    related: ["orthopedic-surgeons", "physical-therapists", "endocrinologists"],
    list: "podiatrists",
    classification: "Podiatrist",
    audience: "podiatrists",
  },
  {
    term: "pharmacists",
    kind: "specialty",
    family: "other",
    label: "Pharmacist",
    title: "What is a pharmacist (PharmD)?",
    description:
      "The doctor of pharmacy: what the license allows, how clinical pharmacy differs from dispensing, and people versus pharmacies.",
    blurb: "A doctoral profession with widening authority - and never the same thing as a pharmacy.",
    lede:
      "A pharmacist is a licensed doctor of pharmacy responsible for dispensing, checking and advising on medication, and increasingly for services of their own.",
    body: [
      "Pharmacy is a doctoral profession: the PharmD, a national licensing examination and a state law examination, then a state license. The work runs from community dispensing to hospital clinical pharmacy, where pharmacists dose and monitor therapy as part of the care team.",
      "Authority has widened. Pharmacists immunise in every state, and many can initiate or adjust defined therapies under collaborative practice agreements or state protocols. Board certification in areas such as ambulatory care, oncology and infectious disease marks the clinical end of the profession.",
      "People and organizations must be kept apart in any pharmacy list. A pharmacist is an individual with a license; a pharmacy is an organization with its own identifier, its own address and usually a chain behind it. They are separate populations, filed separately, and confusing them is the commonest error in this market.",
    ],
    route:
      "Pre-pharmacy coursework, a four-year Doctor of Pharmacy program, national and state law licensing examinations, and a residency for most clinical hospital roles.",
    settings:
      "Community and chain pharmacies, hospital and health-system pharmacy, specialty and infusion pharmacy, long-term care and nuclear pharmacy, managed care and industry.",
    letters: [
      { letters: "PharmD", means: "Doctor of Pharmacy - the degree required for licensure today." },
      { letters: "RPh", means: "Registered pharmacist - the license, held by some with an older bachelor's degree." },
      { letters: "BCPS", means: "One of several board certifications marking an advanced clinical specialty." },
    ],
    related: ["nurse-practitioners", "physician-assistants", "registered-nurses"],
    list: "pharmacists",
    classification: "Pharmacist",
    audience: "pharmacists",
  },
  {
    term: "registered-dietitians",
    kind: "specialty",
    family: "other",
    label: "Registered dietitian",
    title: "What is a registered dietitian?",
    description:
      "The credentialled nutrition profession: what RD and RDN require, why nutritionist is not the same, and where dietitians work.",
    blurb: "The credentialled nutrition profession - and why nutritionist is not a reliable filter.",
    lede: "A registered dietitian is the credentialled nutrition professional in clinical care; nutritionist is not the same thing everywhere.",
    body: [
      "The registered dietitian credential - RD, or RDN for registered dietitian nutritionist - requires an accredited academic program, a supervised practice requirement of around a thousand hours, and a national examination. Most states license or certify the profession on top of that.",
      "Nutritionist is a different matter. In some states the title is regulated and in others anyone may use it, so it is not a reliable filter for a clinical audience. The registered credential is.",
      "Dietitians are the profession responsible for medical nutrition therapy - the nutrition side of diabetes, renal, oncology, pediatric and critical care - and they sit on the care teams of hospitals, dialysis units and long-term care facilities as well as in outpatient practice.",
    ],
    route:
      "An accredited dietetics program, a supervised practice requirement, the national registration examination, and state licensure or certification where it exists.",
    settings:
      "Hospitals and health systems, dialysis centers, long-term care, outpatient and private practice, public health and nutrition programs, food service and industry.",
    letters: [
      { letters: "RD", means: "Registered dietitian." },
      { letters: "RDN", means: "Registered dietitian nutritionist - the same credential, newer wording." },
      { letters: "LD, LDN", means: "The state license, where a state issues one." },
    ],
    related: ["endocrinologists", "nephrologists"],
    list: "registered-dietitians",
    classification: "Dietitian, Registered",
    audience: "healthcare-professionals",
    also: [{ href: "/dialysis-centers", label: "Certified dialysis centers, where dietitians are on the team" }],
  },
];

/**
 * The letters, as their own pages.
 *
 * "What does CRNA stand for" is a different search from "what is a nurse anesthetist", and the
 * abbreviation is the half people type. These entries are short by design - they answer the
 * abbreviation and hand over to the profession's own entry - and their `list` is a candidate
 * rather than a promise, so a credential page that matches no published list simply carries no
 * counts instead of disappearing.
 */
const CREDENTIALS: readonly GlossaryEntry[] = [
  {
    term: "md",
    kind: "credential",
    family: "credentials",
    label: "MD",
    title: "What does MD stand for?",
    description:
      "MD is Doctor of Medicine: what the degree is, how it differs from a DO, and why the letters never tell you the specialty.",
    blurb: "Doctor of Medicine - a degree, not a license, and not a specialty.",
    lede: "MD stands for Doctor of Medicine, the degree held by most physicians in the United States.",
    body: [
      "An MD is awarded by a medical school after four years of study, and on its own it is a degree rather than a license. A physician practices on a state license granted after the national examination sequence and at least a year of postgraduate training, and specialises through a residency of three to seven years.",
      "MD and DO are the two physician degrees in the United States. Both carry a full, unrestricted license to practice medicine and surgery in every state, both train in the same residency programs, and both are counted as physicians. The difference is the school and the osteopathic training that comes with a DO.",
      "On a provider record the letters are filed by the provider themselves, as free text, so MD may appear alone or beside a fellowship or a second degree. What a physician actually practices comes from the specialty codes on the record and never from the letters.",
    ],
    related: ["do", "np", "pa-c"],
    audience: "physicians",
  },
  {
    term: "do",
    kind: "credential",
    family: "credentials",
    label: "DO",
    title: "What does DO stand for?",
    description:
      "DO is Doctor of Osteopathic Medicine: a fully licensed physician, trained in the same residencies as an MD. What differs, and what does not.",
    blurb: "Doctor of Osteopathic Medicine - a full physician license, and a growing share of the profession.",
    lede: "DO stands for Doctor of Osteopathic Medicine: a fully licensed physician, trained at an osteopathic medical school.",
    body: [
      "A DO completes four years at an osteopathic medical school, passes a national examination sequence, and trains in residency as an MD does. The two accreditation systems for residency merged into one, so a DO and an MD in the same program receive the same training.",
      "Both degrees carry a full and unrestricted license to practice medicine and surgery in all fifty states, and both prescribe. The additional element in osteopathic training is osteopathic manipulative medicine, a hands-on approach to the musculoskeletal system, which some DOs use in practice and many do not.",
      "Osteopathic graduates are a growing share of American physicians and are well represented in primary care and rural practice. For any list of physicians the two degrees belong in one population: filtering to MD alone quietly removes a large and growing part of the profession.",
    ],
    related: ["md", "np", "pa-c"],
    audience: "physicians",
  },
  {
    term: "np",
    kind: "credential",
    family: "credentials",
    label: "NP",
    title: "What does NP stand for?",
    description:
      "NP is nurse practitioner: the degree and certification behind the letters, and why what an NP may do depends on the state.",
    blurb: "Nurse practitioner - same credential everywhere, different scope in every state.",
    lede: "NP stands for nurse practitioner: an advanced practice registered nurse who diagnoses and prescribes.",
    body: [
      "The letters sit on a graduate degree - a master's or a doctorate - plus a registered nurse license and a national certification in a population focus such as family, adult-gerontology, pediatric or psychiatric-mental health. Fuller forms appear on records too: APRN for advanced practice registered nurse, or a certification such as FNP-BC.",
      "What an NP may do without a physician depends on the state, which grants full, reduced or restricted practice authority. The credential is the same everywhere; the scope is not, and that is the single most important thing to know before working a national NP list.",
    ],
    related: ["nurse-practitioners", "pa-c", "crna"],
    list: "nurse-practitioners",
    audience: "nurses",
  },
  {
    term: "pa-c",
    kind: "credential",
    family: "credentials",
    label: "PA-C",
    title: "What does PA-C stand for?",
    description:
      "PA-C is physician assistant, certified: what the C adds, how PAs specialize, and the title the profession now prefers.",
    blurb: "Physician assistant, certified - and the part of the abbreviation that carries information.",
    lede: "PA-C stands for physician assistant - certified: a licensed clinician who examines, diagnoses, treats and prescribes.",
    body: [
      "The C is the part that carries information. A PA earns the degree, is licensed by a state and is certified nationally by examination, and that certification is maintained on a cycle - so a PA whose certification has lapsed is still a PA but not a PA-C.",
      "PAs train as generalists and specialize by employment, which is why the same credential turns up in surgery, emergency medicine, dermatology and primary care. The profession's national association prefers physician associate; licenses and the public record still say physician assistant.",
    ],
    related: ["physician-assistants", "np", "crna"],
    list: "physician-assistants",
    audience: "advanced-practice-providers",
  },
  {
    term: "crna",
    kind: "credential",
    family: "credentials",
    label: "CRNA",
    title: "What does CRNA stand for?",
    description:
      "CRNA is certified registered nurse anesthetist: the training behind it, and how anesthesia care teams are actually staffed.",
    blurb: "Certified registered nurse anesthetist - much of the anesthesia workforce.",
    lede: "CRNA stands for certified registered nurse anesthetist: an advanced practice nurse who administers anesthesia.",
    body: [
      "A CRNA is a registered nurse with critical care experience who has completed a nurse anesthesia program - entry to the profession has moved to the doctoral level - and passed the national certification examination. They administer anesthesia for surgery, obstetrics and procedures.",
      "Anesthesia in the United States is delivered by a care team, and the CRNA is often the clinician present throughout the case. Whether a CRNA practices independently or under an anesthesiologist's direction depends on state law and on the facility.",
      "CRNAs are among the highest-paid nursing roles and are concentrated in operating rooms and procedure suites, so an anesthesia audience built only from physician records is missing much of the profession.",
    ],
    related: ["anesthesiologists", "np", "registered-nurses"],
    list: "nurse-anesthetist-certified-registered",
    audience: "nurses",
  },
  {
    term: "dds",
    kind: "credential",
    family: "credentials",
    label: "DDS",
    title: "What does DDS stand for?",
    description:
      "DDS is Doctor of Dental Surgery: what the degree covers, and why it is equivalent to a DMD in every state.",
    blurb: "Doctor of Dental Surgery - one of two names for the same qualification.",
    lede: "DDS stands for Doctor of Dental Surgery, one of the two degrees a licensed American dentist may hold.",
    body: [
      "A DDS is awarded after four years of dental school and is followed by regional or state examinations and a state license. The degree covers the whole of general dental practice; the recognized specialties each require a further residency.",
      "The other degree is the DMD, Doctor of Dental Medicine. Which one a dentist holds depends only on the school they attended: the requirements and the licensing route are the same and state boards treat the two as equivalent. Neither tells you whether a dentist is a specialist - the specialty codes on the record do that.",
    ],
    related: ["dmd", "dentists"],
    list: "dentists",
    audience: "dentists",
  },
  {
    term: "dmd",
    kind: "credential",
    family: "credentials",
    label: "DMD",
    title: "What does DMD stand for?",
    description:
      "DMD is Doctor of Dental Medicine: the same license and route as a DDS, and what the letters actually tell you.",
    blurb: "Doctor of Dental Medicine - a fact about the school, not about the dentist.",
    lede: "DMD stands for Doctor of Dental Medicine, the other of the two degrees held by licensed American dentists.",
    body: [
      "A DMD is awarded after four years of dental school, followed by licensing examinations and a state license - the same route as the DDS. Some dental schools award one and some the other, and a school may have changed which it awards without changing its program.",
      "So the letters are a fact about a dentist's school rather than about their scope, specialty or seniority. In any dental list DDS and DMD should be treated as one population, and the specialty codes are what separate a general dentist from an orthodontist or an oral surgeon.",
    ],
    related: ["dds", "dentists"],
    list: "dentists",
    audience: "dentists",
  },
  {
    term: "dpm",
    kind: "credential",
    family: "credentials",
    label: "DPM",
    title: "What does DPM stand for?",
    description:
      "DPM is Doctor of Podiatric Medicine: a separate doctoral degree, licensed under its own board, with surgical scope.",
    blurb: "Doctor of Podiatric Medicine - not an MD or DO, and licensed separately.",
    lede: "DPM stands for Doctor of Podiatric Medicine: the degree held by podiatrists, who are licensed to operate on the foot and ankle.",
    body: [
      "The DPM is a four-year doctoral degree from a college of podiatric medicine, followed by a hospital-based residency of about three years and a state license. It is not an MD or a DO, and podiatry is licensed under its own board in every state.",
      "A DPM diagnoses, prescribes, orders imaging and performs surgery within the foot, ankle and related structures - an anatomical limit each state defines. Orthopedic foot and ankle surgeons work the same territory from a medical degree.",
    ],
    related: ["podiatrists", "orthopedic-surgeons"],
    list: "podiatrists",
    audience: "podiatrists",
  },
  {
    term: "pharmd",
    kind: "credential",
    family: "credentials",
    label: "PharmD",
    title: "What does PharmD stand for?",
    description:
      "PharmD is Doctor of Pharmacy: the degree licensure now requires, the older letters still in use, and pharmacist versus pharmacy.",
    blurb: "Doctor of Pharmacy - plus the two other sets of letters that appear beside it.",
    lede: "PharmD stands for Doctor of Pharmacy, the degree required to be licensed as a pharmacist in the United States.",
    body: [
      "The PharmD replaced the older bachelor's route into pharmacy practice, which is why some long-standing pharmacists hold a bachelor's degree in pharmacy instead and are no less licensed. Licensure needs the degree plus a national examination and an examination in the law of the state.",
      "Two other sets of letters appear beside it. RPh means registered pharmacist - the license rather than the degree - and BCPS or another board certification marks an advanced clinical specialty. And a pharmacist is a person: a pharmacy is an organization with an identifier of its own.",
    ],
    related: ["pharmacists"],
    list: "pharmacists",
    audience: "pharmacists",
  },
  {
    term: "lcsw",
    kind: "credential",
    family: "credentials",
    label: "LCSW",
    title: "What does LCSW stand for?",
    description:
      "LCSW is licensed clinical social worker: the supervised hours behind it, the state variants, and what it permits.",
    blurb: "Licensed clinical social worker - the license that allows independent therapy practice.",
    lede:
      "LCSW stands for licensed clinical social worker: a master's-level clinician licensed to diagnose and treat mental health conditions independently.",
    body: [
      "The route is a master of social work degree, then supervised post-master's clinical hours - usually two years' worth - then a clinical examination and a state license. Someone holding an LMSW or an MSW is a social worker but not yet independently licensed for clinical practice.",
      "The letters differ by state: LICSW, LCSW-C and others describe the same clinical license. It is the credential that lets a social worker practice therapy independently and bill for it, and holders are among the largest groups of licensed psychotherapy providers in the country.",
    ],
    related: ["social-workers", "counselors", "psychologists"],
    list: "social-workers",
    audience: "mental-health-providers",
  },
  {
    term: "pt",
    kind: "credential",
    family: "credentials",
    label: "PT",
    title: "What does PT stand for?",
    description:
      "PT is physical therapist: the license, the DPT degree behind it, and the two credentials it is confused with.",
    blurb: "Physical therapist - the license, with the doctorate usually beside it.",
    lede: "PT stands for physical therapist: a licensed clinician who treats movement, strength and function.",
    body: [
      "The letters are the license. The degree behind it is now the DPT, a three-year doctorate, so many records carry both - PT, DPT. Practitioners who qualified earlier may hold a master's or bachelor's degree in physical therapy and are equally licensed.",
      "A PTA is a physical therapist assistant: a separate credential, differently licensed, working under a PT's direction. And a PT is not an occupational therapist - movement and function on one side, the tasks of daily life on the other.",
    ],
    related: ["physical-therapists", "ot", "dc"],
    list: "physical-therapists",
    audience: "physical-occupational-therapists",
  },
  {
    term: "ot",
    kind: "credential",
    family: "credentials",
    label: "OT",
    title: "What does OT stand for?",
    description:
      "OT is occupational therapist: what OTR/L and the entry degrees mean, and what occupation means in this profession.",
    blurb: "Occupational therapist - and why occupation does not mean employment.",
    lede: "OT stands for occupational therapist: a licensed clinician who helps people carry out the everyday tasks a condition has made hard.",
    body: [
      "Records usually carry the fuller form OTR/L - occupational therapist, registered and licensed - or the degree, MOT or OTD. Entry to practice is a master's or doctoral program, supervised fieldwork, a national certification examination and a state license.",
      "A COTA is a certified occupational therapy assistant, a separate credential working under supervision. Occupation here means any purposeful activity, from dressing to driving, and not employment.",
    ],
    related: ["occupational-therapists", "pt"],
    list: "occupational-therapists",
    audience: "physical-occupational-therapists",
  },
  {
    term: "dc",
    kind: "credential",
    family: "credentials",
    label: "DC",
    title: "What does DC stand for?",
    description:
      "DC is Doctor of Chiropractic: the four-year program, the license, and what chiropractors do not do anywhere.",
    blurb: "Doctor of Chiropractic - portal of entry, and no prescribing anywhere.",
    lede: "DC stands for Doctor of Chiropractic, the degree and the title of a licensed chiropractor.",
    body: [
      "The DC is a four-year doctoral program followed by national board examinations and a state license. Chiropractors are portal-of-entry providers - no referral needed - and they do not prescribe drugs or perform surgery.",
      "Scope beyond manual treatment differs by state: imaging privileges, physical modalities and nutritional counseling are not uniform. Nearly all chiropractors are in small independent practice, so the record is usually the business as well as the clinician.",
    ],
    related: ["chiropractors", "pt"],
    list: "chiropractors",
    audience: "chiropractors",
  },
  {
    term: "od",
    kind: "credential",
    family: "credentials",
    label: "OD",
    title: "What does OD stand for?",
    description:
      "OD is Doctor of Optometry: what an optometrist is licensed to do, and where the surgical line sits between OD and ophthalmology.",
    blurb: "Doctor of Optometry - and the state-by-state line with eye surgery.",
    lede: "OD stands for Doctor of Optometry: an independently licensed eye care provider who examines, refracts and prescribes.",
    body: [
      "Four years of optometry school after a bachelor's degree, then national board examinations and a state license. An OD prescribes glasses, contact lenses and medication for the eye, and manages eye disease medically.",
      "An MD or DO in ophthalmology is the surgical profession of the eye. Some states allow optometrists defined laser or minor procedures and others do not, so where the line falls is a state question rather than a credential one.",
    ],
    related: ["optometrists", "ophthalmologists"],
    list: "optometrists",
    audience: "optometrists-ophthalmologists",
  },
];

/** Every entry, in the order the hub prints them. */
export const GLOSSARY: readonly GlossaryEntry[] = [
  ...GENERALISTS,
  ...MEDICAL,
  ...SURGICAL,
  ...HOSPITAL_BASED,
  ...NURSING,
  ...DENTAL,
  ...BEHAVIOURAL,
  ...REHAB,
  ...EYE,
  ...OTHER_CLINICAL,
  ...CREDENTIALS,
];

/**
 * The entries whose population is a whole classification, and the plural their metro links read in.
 *
 * The specialty-by-metro pages (`/specialty/<classification>/<state>/<city>`) are published per
 * classification, so only an entry that *is* its classification may link to them. A cardiologist is
 * filed beneath internal medicine, so "cardiologists in Houston" is not a page that exists and this
 * table deliberately has no row for it - the alternative is a glossary full of links to a broader
 * page than the one the reader asked about.
 *
 * The plural is here because a label is singular ("Physiatrist (PM&R)") and adding an s to it is
 * how you get "Otolaryngologist (ENT)s" onto a public page.
 */
export const METRO_LABELS: Readonly<Record<string, string>> = {
  "internal-medicine-physicians": "Internal medicine physicians",
  "family-medicine-physicians": "Family medicine physicians",
  pediatricians: "Pediatricians",
  "ob-gyns": "Obstetricians and gynecologists",
  surgeons: "General surgeons",
  "orthopedic-surgeons": "Orthopedic surgeons",
  dermatologists: "Dermatologists",
  radiologists: "Radiologists",
  anesthesiologists: "Anesthesiologists",
  "emergency-medicine-physicians": "Emergency medicine physicians",
  "nurse-practitioners": "Nurse practitioners",
  "registered-nurses": "Registered nurses",
  "physician-assistants": "Physician assistants",
  dentists: "Dentists",
  pharmacists: "Pharmacists",
  "physical-therapists": "Physical therapists",
  psychologists: "Psychologists",
  optometrists: "Optometrists",
  chiropractors: "Chiropractors",
  podiatrists: "Podiatrists",
  "social-workers": "Social workers",
  "speech-language-pathologists": "Speech-language pathologists",
  "occupational-therapists": "Occupational therapists",
};

/** The hub, or one entry's page. */
export function glossaryPath(term?: string): string {
  return term ? `/glossary/${term}` : "/glossary";
}

/** One entry, or null - so a route can 404 rather than improvise a page. */
export function glossaryEntry(term: string): GlossaryEntry | null {
  return GLOSSARY.find((entry) => entry.term === term) ?? null;
}

/**
 * Whether `/glossary/${entry.term}` resolves, given the taxonomy slugs the platform publishes.
 *
 * Which list is authoritative, and why this is one function
 * --------------------------------------------------------
 * `app/glossary/[term]/page.tsx` is the authority on whether a page exists: it reads the entry's
 * own list and 404s a specialty whose list is below the publication floor. Nothing else can be,
 * because nothing else is the page.
 *
 * But the hub and the sitemap both have to *predict* that answer without making one API call per
 * term, and they predict it from the same place - the taxonomy slugs in `listCatalogue()`, which
 * the platform publishes above exactly that floor. So this is the one function both call, and the
 * catalogue is the authoritative list of what may be linked. The hub used to link every entry and
 * the sitemap used to filter them, which is how a hub came to advertise pages that 404: two rules
 * for one question.
 *
 * `published` is null when the catalogue could not be read. Then nothing is filtered, because the
 * route's gate does not fire either - an unreachable platform leaves every page rendering its
 * explanation without figures, which is the right outcome for a reference page and would be the
 * wrong moment to drop half the glossary out of the hub and the sitemap.
 *
 * Credential entries are never filtered: MD is worth a page whether or not one list happens to
 * correspond to it, and the route exempts them for the same reason.
 */
export function glossaryTermIsListed(
  entry: GlossaryEntry,
  published: ReadonlySet<string> | null,
): boolean {
  if (entry.kind !== "specialty") return true;
  if (!published) return true;
  return Boolean(entry.list && published.has(entry.list));
}

/**
 * The entries of `entries` that may be linked, for a page whose glossary links are an aside.
 *
 * The rule is the hub's and the sitemap's - `glossaryTermIsListed` against the published taxonomy
 * slugs - with one difference that only makes sense away from the hub: an unreadable catalogue
 * links nothing at all.
 *
 * The hub keeps every link in that case because the hub *is* the list of terms, and a reference
 * index that empties itself the moment a count cannot be read is worse than one carrying a link
 * that might 404. A "closely related" panel, and an audience page's reading list, are neither the
 * subject of their page nor how anybody arrives at it, so the trade runs the other way: a few links
 * nobody will miss cost less than a link to a 404. And `published` is null for the case that
 * matters most here - a catalogue that answered with nothing published, where every specialty page
 * 404s and linking them all would be the bug at its worst.
 */
export function glossaryLinkable(
  entries: readonly GlossaryEntry[],
  published: ReadonlySet<string> | null,
): GlossaryEntry[] {
  if (!published) return [];
  return entries.filter((entry) => glossaryTermIsListed(entry, published));
}

/** The entries of one family, in file order. */
export function glossaryFamilyEntries(key: GlossaryFamilyKey): GlossaryEntry[] {
  return GLOSSARY.filter((entry) => entry.family === key);
}

/**
 * The glossary entry that explains one list, or null. A profession's own entry wins over a
 * credential that happens to point at the same list, so a list page links to "What is a dentist?"
 * rather than to "What does DDS stand for?".
 */
export function glossaryForList(slug: string): GlossaryEntry | null {
  return (
    GLOSSARY.find((entry) => entry.kind === "specialty" && entry.list === slug) ??
    GLOSSARY.find((entry) => entry.list === slug) ??
    null
  );
}

/** The entries belonging to one audience landing page, professions before credentials. */
export function glossaryForAudience(slug: string): GlossaryEntry[] {
  const mine = GLOSSARY.filter((entry) => entry.audience === slug);
  return [
    ...mine.filter((entry) => entry.kind === "specialty"),
    ...mine.filter((entry) => entry.kind === "credential"),
  ];
}

/** `related` resolved to entries, dropping anything that no longer exists. */
export function relatedEntries(entry: GlossaryEntry): GlossaryEntry[] {
  return (entry.related ?? []).flatMap((term) => {
    const found = glossaryEntry(term);
    return found ? [found] : [];
  });
}
