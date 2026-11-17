export type Capability = {
  path: string; label: string; title: string; description: string; status: string;
  intro: string; primary: [string, string]; secondary: [string, string];
  cards: { title: string; text: string }[];
  heading: string; rows: [string, string][];
  steps: string[]; faqs: [string, string][];
};
export const CAPABILITIES: Record<string, Capability> = {
  idn: {
    path:'/idn-data', label:'IDN & health system intelligence',
    title:'See the organization behind the provider.',
    description:'Explore integrated delivery networks, health systems and member facilities with NPIMARK. Research organizational relationships and healthcare accounts.',
    status:'Explore health system records',
    intro:'Start with a health system, follow its member facilities, and build a clearer picture of the account. An integrated delivery network connects care settings under a coordinated organization; the relationships matter as much as the individual records.',
    primary:['Explore health systems','/systems'], secondary:['Discuss your coverage needs','mailto:sales@npimark.com?subject=IDN%20data%20coverage'],
    cards:[
      {title:'Understand the account',text:'Review the system profile, its locations and available ownership information before planning outreach.'},
      {title:'Follow the connections',text:'Move from a system to member facilities and inspect the relationships recorded on each profile.'},
      {title:'Find the relevant roles',text:'Explore leadership roles and business contacts in your workspace, subject to coverage and account access.'},
    ],
    heading:'Relationships with context',
    rows:[
      ['Health system membership','A recorded connection between a facility and a system. Missing membership is not proof of independence.'],
      ['Ownership','Review the ownership description and its scope. A system-level ownership category does not automatically apply to every member.'],
      ['Clinician affiliations','Use recorded links as research evidence. An affiliation alone does not establish employment or purchasing authority.'],
      ['EHR / EMR','Where available, review the technology and its evidence. An inferred system is not a confirmed installation.'],
    ],
    steps:['Find a health system by name or geography.','Review member facilities and the context of each relationship.','Use your workspace to research relevant people and plan the next conversation.'],
    faqs:[
      ['Is every health system an IDN?','The terms overlap, but organizational structures vary. Review the actual member facilities and relationships rather than assuming every system has the same structure.'],
      ['Can I see CEOs, CFOs and procurement contacts?','The workspace supports research into nonclinical roles, including executives, finance and procurement. Coverage varies; a title does not confirm purchasing authority or contact availability.'],
      ['Are counts guaranteed to match my target market?','No. Check the current directory and ask for a coverage review using your geography, organization types and required fields.'],
    ],
  },
  pbm: {
    path:'/pbm-data', label:'PBMs & payer relationships',
    title:'Know which relationship you’re looking at.',
    description:'Plan formulary coverage versus PBM relationship data. Review what NPIMARK holds before selecting a payer or pharmacy-benefit dataset.',
    status:'Plan formulary coverage held — no PBM relationship data',
    intro:'Pharmacy benefit managers help administer prescription drug benefits. That is a different relationship from a provider participating in a health plan, and different again from what a plan actually covers. We hold the last of those three. Keep them separate when building your research brief.',
    primary:['Request a coverage review','mailto:sales@npimark.com?subject=PBM%20coverage%20review'], secondary:['Explore available data','/data'],
    cards:[
      {title:'Define the relationship',text:'Specify whether you need a PBM organization, plan administrator, pharmacy network or provider participation record.'},
      {title:'Start with what is held',text:'Plan formulary coverage, plus health plan, issuer and provider-network research. Availability must be confirmed for your account and deployment.'},
      {title:'Avoid unsupported conclusions',text:'Provider participation does not reveal a PBM contract, negotiated rebate, formulary or share of a practice’s revenue.'},
    ],
    heading:'What the data can—and cannot—answer',
    rows:[
      ['Plan and issuer records','A starting point for health-plan research where records are available. These are not PBM ownership records.'],
      ['Provider-network participation','An observed plan/provider connection. It does not establish current acceptance for a particular patient or service.'],
      ['Plan formulary coverage','Which drugs a plan covers, the tier each sits on, and whether one carries prior authorization, step therapy or a quantity limit — attributable to a plan in a county. Delivered as a dataset on request; it is not searchable in the app.'],
      ['PBM relationships and rebates','Not held. A PBM relationship graph, PBM ownership and negotiated rebate terms are separate questions that need their own evidence, and none of them follow from a formulary.'],
      ['Coverage requests','Tell us the entities, relationships, geography and dates you need. We will confirm availability before proposing a dataset.'],
    ],
    steps:['Describe the business question and required relationship.','Request a sample and review dates, definitions and missing fields.','Agree on coverage before purchasing or integrating a dataset.'],
    faqs:[
      ['Can I download a complete PBM database here?','No — there is no PBM relationship dataset. Plan formulary coverage is a different thing and we do hold it, as a dataset we prepare for you rather than a download on this page.'],
      ['Does a plan record identify its PBM?','Not by itself. A PBM relationship needs its own evidence and should not be inferred from a plan or provider-network match.'],
      ['What should I send for a coverage review?','Send the organization types, required fields, geography and intended use. Do not send patient records or sensitive patient information.'],
    ],
  },
  mcp: {
    path:'/mcp', label:'NPIMARK for AI assistants',
    title:'Bring provider research into your assistant.',
    description:'Explore NPIMARK MCP access for AI-assisted provider research, with scoped API access and account usage limits. Request setup and availability details.',
    status:'MCP integration — contact us for setup and availability',
    intro:'Model Context Protocol connects AI applications to external tools and data. The NPIMARK integration is designed to let your assistant query provider information through your account instead of relying on an answer from memory.',
    primary:['Discuss MCP access','mailto:support@npimark.com?subject=MCP%20setup'], secondary:['Read the API reference','/docs/api'],
    cards:[
      {title:'Ask a focused question',text:'Find providers by specialty and location, inspect a known NPI, or explore health systems using supported tools.'},
      {title:'Use scoped access',text:'The local integration uses an account API key. Your permissions and usage limits continue to apply.'},
      {title:'Review the evidence',text:'Check the returned records, filters and dates. An assistant’s summary is not independent verification of the underlying data.'},
    ],
    heading:'A deliberate connection to your account',
    rows:[
      ['Setup','Confirm the supported client, package version and API origin with support. No hosted MCP endpoint is advertised on this page.'],
      ['Provider research','The integration source includes read-only research tools. Confirm the deployed tool list before relying on a workflow.'],
      ['Contact details','Provider read access does not grant contact reveal access. Do not assume an assistant can bypass reveal permissions or metering.'],
      ['External delivery','CRM writes, email campaigns and exports require their own supported workflow and explicit authorization. Asking a question is not permission to send data.'],
    ],
    steps:['Confirm availability and a supported client with our team.','Create a limited-scope key in your account and configure it privately.','Start with a small read-only query and inspect the result and usage.'],
    faqs:[
      ['Is MCP the same as the REST API?','No. MCP provides tools an AI client can call; the integration uses the underlying API and its access rules.'],
      ['Should I paste my API key into a prompt?','No. Keep credentials in the approved local configuration or secret storage. Never put them in shared prompts, screenshots or support messages.'],
      ['Can I install it from this page?','Contact support for the current supported release and setup instructions. A public hosted endpoint and package distribution have not been confirmed here.'],
    ],
  },
  mobile: {
    path:'/mobile-app', label:'NPIMARK on mobile',
    title:'Keep your next conversation in view.',
    description:'Learn about NPIMARK mobile access and the planned iPhone and Android app. Use the web workspace today and request mobile pilot information.',
    status:'Native app in development — no public app-store release announced',
    intro:'Research does not always happen at a desk. Use the web workspace from your phone, and talk to us about the mobile pilot for provider research and account workflows.',
    primary:['Open the web workspace','/app'], secondary:['Ask about the mobile pilot','mailto:sales@npimark.com?subject=Mobile%20app%20pilot'],
    cards:[
      {title:'Start on the web',text:'Sign in through your mobile browser to access the existing workspace. Feature availability follows your account and permissions.'},
      {title:'Shape the mobile workflow',text:'Tell us which tasks matter in the field: looking up a provider, reviewing an organization or returning to a saved audience.'},
      {title:'Keep account controls',text:'The planned native experience must preserve permission checks, contact reveal rules and usage accounting across devices.'},
    ],
    heading:'Availability without the guesswork',
    rows:[
      ['Mobile browser','The web workspace is the current entry point. Use your existing account; device-specific usability should be checked during your pilot.'],
      ['iPhone and Android','A shared native app is in development. There are no confirmed public store links or release dates on this page.'],
      ['Saved work and reveals','Cross-device workflows are part of the implementation scope and require end-to-end testing before release.'],
      ['CRM and email destinations','HubSpot, Salesforce, Smartlead and Instantly are priority destinations. Direct mobile delivery is not advertised as live.'],
    ],
    steps:['Open the web workspace on your phone.','Share the tasks and devices your team uses.','Request pilot details before planning a native-app rollout.'],
    faqs:[
      ['Where are the App Store and Google Play links?','A public native release has not been announced. We will publish verified store links when available.'],
      ['Does mobile include extra free contact reveals?','No separate mobile allowance is promised. Access and usage follow the applicable account terms.'],
      ['Will the app send my selected contacts automatically?','No automatic delivery is promised. Any future supported destination must use an authorized connection and a deliberate user action.'],
    ],
  },
};
