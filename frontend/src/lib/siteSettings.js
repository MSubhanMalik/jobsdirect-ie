export const PHONE_TYPE_OPTIONS = [
  { value: "landline", label: "Landline" },
  { value: "mobile", label: "Mobile" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "other", label: "Other" },
];

export const BUSINESS_TYPE_OPTIONS = [
  { value: "limited_company", label: "Limited Company" },
  { value: "sole_trader", label: "Sole Trader" },
  { value: "partnership", label: "Partnership" },
  { value: "public_body", label: "Public Body" },
  { value: "charity", label: "Charity" },
  { value: "other", label: "Other" },
];

export const COMPANY_SIZE_OPTIONS = [
  { value: "micro_0_10", label: "Micro 0 - 10" },
  { value: "small_11_50", label: "Small 11 - 50" },
  { value: "medium_51_250", label: "Medium 51 - 250" },
  { value: "large_251_1000", label: "Large 251 - 1000" },
  { value: "enterprise_1000_plus", label: "Enterprise 1000+" },
];

export const JOB_TYPE_OPTIONS = [
  { value: "full_time", label: "Full time" },
  { value: "part_time", label: "Part time" },
  { value: "contract", label: "Contract" },
  { value: "temporary", label: "Temporary" },
  { value: "internship", label: "Internship" },
  { value: "remote", label: "Remote" },
];

export const CONTRACT_TYPE_OPTIONS = [
  { value: "permanent_full_time", label: "Permanent full-time" },
  { value: "permanent_part_time", label: "Permanent part-time" },
  { value: "fixed_term", label: "Fixed term" },
  { value: "temporary", label: "Temporary" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
];

export const CATEGORY_OPTIONS = [
  { value: "technology", label: "Technology" },
  { value: "healthcare", label: "Healthcare" },
  { value: "finance", label: "Finance" },
  { value: "education", label: "Education" },
  { value: "engineering", label: "Engineering" },
  { value: "sales", label: "Sales" },
  { value: "marketing", label: "Marketing" },
  { value: "hospitality", label: "Hospitality" },
  { value: "retail", label: "Retail" },
  { value: "construction", label: "Construction" },
  { value: "transport", label: "Transport" },
  { value: "admin", label: "Admin" },
  { value: "legal", label: "Legal" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "other", label: "Other" },
];

export const CAREER_LEVEL_OPTIONS = [
  { value: "not_required", label: "Not required" },
  { value: "entry_level", label: "Entry level" },
  { value: "junior", label: "Junior" },
  { value: "mid_level", label: "Mid level" },
  { value: "senior", label: "Senior" },
  { value: "manager", label: "Manager" },
  { value: "director", label: "Director" },
  { value: "executive", label: "Executive" },
];

export const SALARY_MODE_OPTIONS = [
  { value: "not_specified", label: "Not specified" },
  { value: "fixed", label: "Fixed salary" },
  { value: "range", label: "Salary range" },
];

export const SALARY_PERIOD_OPTIONS = [
  { value: "annual", label: "Annual" },
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
  { value: "hourly", label: "Hourly" },
];

export const APPLICATION_METHOD_OPTIONS = [
  { value: "platform", label: "Platform" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "postal", label: "Postal" },
  { value: "external", label: "External URL" },
];

export const REMOTE_WORK_MODE_OPTIONS = [
  { value: "on_site", label: "On-site" },
  { value: "hybrid", label: "Hybrid" },
  { value: "remote", label: "Remote" },
  { value: "blended", label: "Blended" },
];

const field = (key, config) => ({
  key,
  span: 1,
  manageInEmployerForm: true,
  supportsRequired: config.type !== "boolean",
  ...config,
});

export const COMPANY_FIELD_GROUPS = [
  {
    id: "contact_person",
    title: "Contact Person",
    description: "Primary account owner details.",
    fields: [
      field("first_name", { label: "First Name", type: "text", defaultValue: "", employerDefaultVisible: true, employerDefaultRequired: true }),
      field("last_name", { label: "Last Name", type: "text", defaultValue: "", employerDefaultVisible: true, employerDefaultRequired: true }),
      field("date_of_birth", { label: "Date of Birth", type: "date", defaultValue: "", employerDefaultVisible: true, employerDefaultRequired: true }),
    ],
  },
  {
    id: "business_identity",
    title: "Business Identity",
    description: "Core company details used across your platform.",
    fields: [
      field("company_name", { label: "Company Name", type: "text", defaultValue: "", employerDefaultVisible: true, employerDefaultRequired: true }),
      field("trading_name", { label: "Trading Name", type: "text", defaultValue: "", employerDefaultVisible: false }),
      field("company_logo_url", { label: "Company Logo URL", type: "url", defaultValue: "", employerDefaultVisible: false, span: 2 }),
      field("business_type", { label: "Business Type", type: "select", options: BUSINESS_TYPE_OPTIONS, defaultValue: "limited_company", employerDefaultVisible: false }),
      field("registered_in_ireland", { label: "Registered In Ireland", type: "boolean", defaultValue: true, employerDefaultVisible: false }),
      field("cro_number", { label: "Business Registration Number", type: "text", defaultValue: "", employerDefaultVisible: true, employerDefaultRequired: true }),
      field("employer_number", { label: "Employer Number", type: "text", defaultValue: "", employerDefaultVisible: true, employerDefaultRequired: true }),
      field("company_size", { label: "Company Size", type: "select", options: COMPANY_SIZE_OPTIONS, defaultValue: "micro_0_10", employerDefaultVisible: false }),
      field("business_activity_description", { label: "Business Activity Description", type: "textarea", defaultValue: "", employerDefaultVisible: false, span: 2 }),
    ],
  },
  {
    id: "economic_activity",
    title: "Economic Activity",
    description: "Use these free-text fields now and refine them into coded classifications later.",
    fields: [
      field("economic_activity_1", { label: "Economic Activity 1", type: "text", defaultValue: "", employerDefaultVisible: false }),
      field("economic_activity_2", { label: "Economic Activity 2", type: "text", defaultValue: "", employerDefaultVisible: false }),
      field("economic_activity_3", { label: "Economic Activity 3", type: "text", defaultValue: "", employerDefaultVisible: false }),
    ],
  },
  {
    id: "address",
    title: "Address",
    description: "Registered or main business address.",
    fields: [
      field("address_building", { label: "Building / House", type: "text", defaultValue: "", employerDefaultVisible: false }),
      field("address_street", { label: "Street", type: "text", defaultValue: "", employerDefaultVisible: false }),
      field("address_town", { label: "Town / City", type: "text", defaultValue: "", employerDefaultVisible: false }),
      field("address_county", { label: "County", type: "text", defaultValue: "", employerDefaultVisible: false }),
      field("address_country", { label: "Country", type: "text", defaultValue: "Ireland", employerDefaultVisible: false }),
      field("address_eircode", { label: "Eircode", type: "text", defaultValue: "", employerDefaultVisible: false }),
    ],
  },
  {
    id: "communications",
    title: "Contact Channels",
    description: "Public-facing and internal contact options.",
    fields: [
      field("phone", { label: "Main Phone", type: "text", defaultValue: "", employerDefaultVisible: true, employerDefaultRequired: true }),
      field("website", { label: "Website", type: "url", defaultValue: "", employerDefaultVisible: true, employerDefaultRequired: true }),
      field("primary_phone_type", { label: "Primary Phone Type", type: "select", options: PHONE_TYPE_OPTIONS, defaultValue: "landline", employerDefaultVisible: false }),
      field("primary_phone", { label: "Primary Phone", type: "text", defaultValue: "", employerDefaultVisible: false }),
      field("secondary_phone_type", { label: "Secondary Phone Type", type: "select", options: PHONE_TYPE_OPTIONS, defaultValue: "mobile", employerDefaultVisible: false }),
      field("secondary_phone", { label: "Secondary Phone", type: "text", defaultValue: "", employerDefaultVisible: false }),
      field("fax", { label: "Fax", type: "text", defaultValue: "", employerDefaultVisible: false }),
    ],
  },
  {
    id: "preferences",
    title: "Business Flags",
    description: "Optional flags and preferences managed by the employer.",
    fields: [
      field("is_recruitment_agency", { label: "Recruitment Agency", type: "boolean", defaultValue: false, employerDefaultVisible: false }),
      field("newsletter_opt_in", { label: "Newsletter Opt-In", type: "boolean", defaultValue: false, employerDefaultVisible: false }),
    ],
  },
  {
    id: "admin",
    title: "Admin Controls",
    description: "Super admin only controls.",
    fields: [
      field("verification_status", { label: "Verification Status", type: "select", options: [
        { value: "draft", label: "Draft" },
        { value: "pending", label: "Pending" },
        { value: "submitted", label: "Submitted" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
      ], defaultValue: "draft", adminOnly: true, manageInEmployerForm: false }),
      field("admin_review_note", { label: "Admin Review Note", type: "textarea", defaultValue: "", span: 2, adminOnly: true, manageInEmployerForm: false }),
    ],
  },
];

export const JOB_FIELD_GROUPS = [
  {
    id: "basic_details",
    title: "Basic Details",
    description: "Core vacancy information shown across the platform.",
    fields: [
      field("title", { label: "Job Title", type: "text", defaultValue: "", employerDefaultVisible: true, employerDefaultRequired: true, span: 2 }),
      field("short_description", { label: "Short Description", type: "text", defaultValue: "", employerDefaultVisible: true, span: 2 }),
      field("description", { label: "Full Description", type: "textarea", defaultValue: "", employerDefaultVisible: true, employerDefaultRequired: true, span: 2 }),
      field("branch_name", { label: "Branch / Hiring Team", type: "text", defaultValue: "", employerDefaultVisible: false, span: 2 }),
    ],
  },
  {
    id: "classification",
    title: "Classification",
    description: "How the role should be categorized.",
    fields: [
      field("job_type", { label: "Job Type", type: "select", options: JOB_TYPE_OPTIONS, defaultValue: "full_time", employerDefaultVisible: true }),
      field("contract_type", { label: "Contract Type", type: "select", options: CONTRACT_TYPE_OPTIONS, defaultValue: "permanent_full_time", employerDefaultVisible: false }),
      field("category", { label: "Category", type: "select", options: CATEGORY_OPTIONS, defaultValue: "technology", employerDefaultVisible: true }),
      field("career_level", { label: "Career Level", type: "select", options: CAREER_LEVEL_OPTIONS, defaultValue: "not_required", employerDefaultVisible: false }),
      field("sector", { label: "Sector", type: "text", defaultValue: "", employerDefaultVisible: false, span: 2 }),
    ],
  },
  {
    id: "location_schedule",
    title: "Location And Schedule",
    description: "Where and how the role is worked.",
    fields: [
      field("location", { label: "Primary Location", type: "text", defaultValue: "", employerDefaultVisible: true, employerDefaultRequired: true }),
      field("country", { label: "Country", type: "text", defaultValue: "Ireland", employerDefaultVisible: false }),
      field("job_start_date", { label: "Start Date", type: "date", defaultValue: "", employerDefaultVisible: false }),
      field("hours_per_week", { label: "Hours Per Week", type: "number", defaultValue: "", employerDefaultVisible: false }),
      field("positions_count", { label: "Number Of Positions", type: "number", defaultValue: "", employerDefaultVisible: false }),
      field("remote_work_mode", { label: "Remote / Blended Mode", type: "select", options: REMOTE_WORK_MODE_OPTIONS, defaultValue: "on_site", employerDefaultVisible: false, span: 2 }),
    ],
  },
  {
    id: "compensation",
    title: "Compensation",
    description: "Salary and advertising details.",
    fields: [
      field("salary_mode", { label: "Salary Mode", type: "select", options: SALARY_MODE_OPTIONS, defaultValue: "fixed", employerDefaultVisible: false }),
      field("salary_min", { label: "Salary Min (EUR)", type: "number", defaultValue: "", employerDefaultVisible: true }),
      field("salary_max", { label: "Salary Max (EUR)", type: "number", defaultValue: "", employerDefaultVisible: true }),
      field("salary_period", { label: "Salary Period", type: "select", options: SALARY_PERIOD_OPTIONS, defaultValue: "annual", employerDefaultVisible: true }),
      field("advertise_from", { label: "Advertise From", type: "date", defaultValue: "", employerDefaultVisible: false }),
      field("advertise_to", { label: "Advertise To", type: "date", defaultValue: "", employerDefaultVisible: false }),
      field("keep_company_confidential", { label: "Keep Company Confidential", type: "boolean", defaultValue: false, employerDefaultVisible: false, span: 2 }),
    ],
  },
  {
    id: "applications",
    title: "Applications",
    description: "How candidates apply and what they must provide.",
    fields: [
      field("application_method", { label: "Application Method", type: "select", options: APPLICATION_METHOD_OPTIONS, defaultValue: "platform", employerDefaultVisible: false }),
      field("application_email", { label: "Application Email", type: "email", defaultValue: "", employerDefaultVisible: false }),
      field("application_phone", { label: "Application Phone", type: "text", defaultValue: "", employerDefaultVisible: false }),
      field("application_url", { label: "Application URL", type: "url", defaultValue: "", employerDefaultVisible: false }),
      field("application_postal_address", { label: "Postal Address", type: "textarea", defaultValue: "", employerDefaultVisible: false, span: 2 }),
      field("application_questions_text", { label: "Application Questions", type: "textarea", defaultValue: "", employerDefaultVisible: false, span: 2 }),
      field("cv_required", { label: "CV Required", type: "boolean", defaultValue: false, employerDefaultVisible: false }),
      field("employment_permit_process_enabled", { label: "Employment Permit Process", type: "boolean", defaultValue: false, employerDefaultVisible: false }),
      field("job_matching_enabled", { label: "Job Matching Enabled", type: "boolean", defaultValue: false, employerDefaultVisible: false }),
    ],
  },
  {
    id: "extras",
    title: "Extras",
    description: "Additional display and promotion controls.",
    fields: [
      field("benefits", { label: "Benefits", type: "textarea", defaultValue: "", employerDefaultVisible: true, span: 2 }),
      field("is_featured", { label: "Featured Listing", type: "boolean", defaultValue: false, employerDefaultVisible: true }),
      field("is_highlighted", { label: "Highlighted Listing", type: "boolean", defaultValue: false, employerDefaultVisible: true }),
    ],
  },
  {
    id: "admin",
    title: "Admin Controls",
    description: "Super admin only controls.",
    fields: [
      field("status", { label: "Status", type: "select", options: [
        { value: "approved", label: "Live" },
        { value: "pending_review", label: "Pending" },
        { value: "rejected", label: "Rejected" },
        { value: "draft", label: "Draft" },
        { value: "archived", label: "Archived" },
      ], defaultValue: "pending_review", adminOnly: true, manageInEmployerForm: false }),
      field("source", { label: "Source", type: "text", defaultValue: "manual", adminOnly: true, manageInEmployerForm: false }),
      field("jobsireland_ref", { label: "JobsIreland Reference", type: "text", defaultValue: "", adminOnly: true, manageInEmployerForm: false }),
    ],
  },
];

const flattenFields = (groups) => groups.flatMap((group) => group.fields);

export const COMPANY_FIELDS = flattenFields(COMPANY_FIELD_GROUPS);
export const JOB_FIELDS = flattenFields(JOB_FIELD_GROUPS);

const buildFormDefaults = (fields) =>
  fields.reduce((acc, currentField) => {
    acc[currentField.key] = currentField.defaultValue;
    return acc;
  }, {});

export const EMPLOYER_FORM_DEFAULTS = buildFormDefaults(COMPANY_FIELDS.filter((currentField) => !currentField.adminOnly));
export const EMPLOYER_EDITOR_DEFAULTS = buildFormDefaults(COMPANY_FIELDS);
export const JOB_FORM_DEFAULTS = buildFormDefaults(JOB_FIELDS.filter((currentField) => !currentField.adminOnly));
export const JOB_EDITOR_DEFAULTS = buildFormDefaults(JOB_FIELDS);

export const EMPLOYER_COMPANY_FORM_CONTROL_DEFAULTS = COMPANY_FIELDS
  .filter((currentField) => currentField.manageInEmployerForm && !currentField.adminOnly)
  .reduce((acc, currentField) => {
    acc[currentField.key] = {
      visible: currentField.employerDefaultVisible !== false,
      required: currentField.supportsRequired !== false && Boolean(currentField.employerDefaultRequired),
    };
    return acc;
  }, {});

export const EMPLOYER_JOB_FORM_CONTROL_DEFAULTS = JOB_FIELDS
  .filter((currentField) => currentField.manageInEmployerForm && !currentField.adminOnly)
  .reduce((acc, currentField) => {
    acc[currentField.key] = {
      visible: currentField.employerDefaultVisible !== false,
      required: currentField.supportsRequired !== false && Boolean(currentField.employerDefaultRequired),
    };
    return acc;
  }, {});

export const DEFAULT_SITE_SETTINGS = {
  auth_required: false,
  brand_name: "JobsDirect.ie",
  brand_accent: "Direct",
  hero_eyebrow: "Ireland's leading job platform",
  hero_title: "Find Your Dream Job or Hire Top Talent",
  hero_highlight: "in Ireland",
  hero_subtitle: "Connect with employers and job seekers across Ireland. Your next opportunity is just a search away.",
  primary_cta: "Search Jobs",
  employer_cta: "Post a Job",
  contact_email: "info@jobsdirect.ie",
  contact_phone: "+353 1 234 5678",
  office_location: "Dublin, Ireland",
  footer_blurb: "Ireland's premier job platform connecting talented professionals with leading employers across the country.",
  featured_jobs_enabled: true,
  employer_approval_required: true,
  job_approval_required: true,
  employer_company_form_config: EMPLOYER_COMPANY_FORM_CONTROL_DEFAULTS,
  employer_job_form_config: EMPLOYER_JOB_FORM_CONTROL_DEFAULTS,
};

const buildFieldMap = (fields) =>
  fields.reduce((acc, currentField) => {
    acc[currentField.key] = currentField;
    return acc;
  }, {});

export const COMPANY_FIELD_MAP = buildFieldMap(COMPANY_FIELDS);
export const JOB_FIELD_MAP = buildFieldMap(JOB_FIELDS);

export function mergeFieldControlConfig(defaults, incomingConfig = {}) {
  return Object.entries(defaults).reduce((acc, [key, value]) => {
    const next = incomingConfig?.[key];
    acc[key] = {
      visible: next?.visible === undefined ? value.visible : Boolean(next.visible),
      required: next?.required === undefined ? value.required : Boolean(next.required),
    };
    return acc;
  }, {});
}

export function mergeSiteSettingsWithDefaults(settings = {}) {
  return {
    ...DEFAULT_SITE_SETTINGS,
    ...settings,
    employer_company_form_config: mergeFieldControlConfig(
      EMPLOYER_COMPANY_FORM_CONTROL_DEFAULTS,
      settings?.employer_company_form_config,
    ),
    employer_job_form_config: mergeFieldControlConfig(
      EMPLOYER_JOB_FORM_CONTROL_DEFAULTS,
      settings?.employer_job_form_config,
    ),
  };
}

export function buildEntityFormValues(defaultValues, fields, record = {}) {
  return fields.reduce((acc, currentField) => {
    const sourceValue = record?.[currentField.key];
    if (sourceValue === undefined || sourceValue === null) {
      acc[currentField.key] = defaultValues[currentField.key];
      return acc;
    }

    if (currentField.type === "boolean") {
      acc[currentField.key] = Boolean(sourceValue);
      return acc;
    }

    acc[currentField.key] = sourceValue;
    return acc;
  }, { ...defaultValues });
}

export function hasFieldValue(field, value) {
  if (field?.type === "boolean") {
    return typeof value === "boolean";
  }

  if (field?.type === "number") {
    return value !== "" && value !== null && value !== undefined && Number.isFinite(Number(value));
  }

  return String(value ?? "").trim().length > 0;
}
