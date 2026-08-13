You are a professional resume writer and ATS optimization specialist.

Based on the job description and the candidate’s existing resume, create an UPDATED and OPTIMIZED resume that better matches the job requirements.

This is NOT a styling exercise.
Your task is to GENERATE AN UPDATED RESUME, not to restyle the existing resume.

========================================
INPUTS
========================================

The input contains 
- job_description: the target job description

Existing Resume:
{
    "name": "Thomas Ford",
    "title": "Senior Software Engineer",
    "contact": {
        "address": "Lubbock, TX 79403",
        "email": "thomaswesford@gmail.com",
        "phone": "(806) 331 7571",
        "linkedin": ""
    },
    "summary": "Senior Software Engineer with 7+ years delivering full-stack healthcare platforms across React, Python, Node.js, PostgreSQL, REST APIs, and AWS. Built broker-facing and patient-facing web applications in regulated environments, accelerating appointment-flow completion by 31% and reducing patient-service processing time by 24%. Fluent with AI-powered developer tools, experienced navigating ambiguity in fast-paced product teams, and focused on scalable architectures that drive measurable outcomes for end users.",
    "skills": [
        {
            "category": "Backend",
            "items": [
                "Python",
                "Node.js",
                "C#/.NET",
                "REST APIs",
                "Django",
                "Microservices",
                "Event-Driven Architecture",
                "TypeScript"
            ]
        },
        {
            "category": "Frontend",
            "items": [
                "React.js",
                "TypeScript",
                "JavaScript",
                "Redux",
                "React Hooks",
                "Single-Page Applications",
                "Accessible Forms",
                "Responsive Web Applications"
            ]
        },
        {
            "category": "AI & Automation",
            "items": [
                "Claude Code",
                "Cursor",
                "RAG-Backed Analysis",
                "AI-Assisted Engineering",
                "Jest Test Generation",
                "Spec-Driven Development",
                "Prompt Engineering",
                "Automated Workflow Analysis"
            ]
        },
        {
            "category": "Cloud & DevOps",
            "items": [
                "AWS",
                "Docker",
                "Kubernetes",
                "GitHub Actions",
                "CI/CD",
                "CloudWatch",
                "Datadog",
                "Jenkins"
            ]
        },
        {
            "category": "Database",
            "items": [
                "PostgreSQL",
                "SQL Server",
                "MySQL",
                "Redis",
                "SQL Query Optimization",
                "Database Indexing",
                "Data Modeling",
                "Background Processing"
            ]
        },
        {
            "category": "Tools",
            "items": [
                "Git",
                "Jira",
                "Swagger/OpenAPI",
                "Postman",
                "Jest",
                "Cypress",
                "xUnit",
                "Datadog"
            ]
        },
        {
            "category": "Industry",
            "items": [
                "Medicare Platforms",
                "Broker CRM Workflows",
                "Healthcare Software",
                "Patient Engagement",
                "HIPAA Compliance",
                "PHI/PII",
                "Eligibility & Benefits",
                "Care Coordination"
            ]
        }
    ],
    "experience": [
        {
            "title": "Senior Software Engineer",
            "company": "UnitedHealth Group",
            "date_range": "05/2023 - Present",
            "job_type": "Remote",
            "responsibilities": [
                "Architected 12 full-stack features across the UnitedHealthcare member experience on myuhc.com using React, TypeScript, Python, and Node.js microservices, serving UnitedHealthcare Medicare and UnitedHealthcare Community Plan members across eligibility, benefits, and scheduling journeys.",
                "Directed 4 concurrent engineering workstreams spanning cross-functional product, design, clinical, and compliance stakeholders, translating Medicare coverage requirements into AWS-deployed, containerized releases across GitHub Actions CI/CD pipelines."
            ],
            "achievements": [
                "Accelerated appointment-flow completion by 31% by redesigning React component state, simplifying eligibility step sequencing, and instrumenting abandonment funnels across UnitedHealthcare member scheduling journeys.",
                "Reduced patient-service processing time by 24% by consolidating prescription, scheduling, and benefits data behind Python REST APIs with PostgreSQL query tuning and Redis caching.",
                "Introduced spec-driven AI-assisted engineering using Claude Code, Cursor, and RAG-backed workflow analysis, shortening targeted investigation cycles by roughly 30% while maintaining code-review and human-validation gates.",
                "Stabilized containerized myuhc.com services at 99.94% availability by strengthening health checks, failure-recovery logic, CloudWatch dashboards, and Datadog alerting across AWS workloads.",
                "Automated same-day reminder and cancellation event flows through event-driven services, cutting manual outreach volume by 18% while preserving full auditability for PHI-sensitive member records."
            ],
            "skills": [
                "React.js",
                "TypeScript",
                "Python",
                "Node.js",
                "PostgreSQL",
                "AWS",
                "Docker",
                "Event-Driven Architecture"
            ]
        },
        {
            "title": "Senior Software Engineer",
            "company": "BRIDGE Hospice",
            "date_range": "02/2021 - 05/2023",
            "job_type": "On-site",
            "responsibilities": [
                "Led full-stack development of 9 clinical intake and care-coordination features across the Patient Intake and Care Coordination Platform and Hospice Referral and Admission Platform using C#/.NET, React, TypeScript, REST APIs, and SQL Server with nurses, physicians, billing staff, and product stakeholders.",
                "Standardized 5 EHR, billing, document, and notification integrations within the Clinical Document Management System, establishing Swagger/OpenAPI contracts, RBAC, audit logging, Jenkins CI/CD, and HIPAA-aligned data-handling patterns across all connected services."
            ],
            "achievements": [
                "Modernized patient and staff interfaces across the Patient Intake and Care Coordination Platform, improving first-pass intake completion by 27% through React component reuse, TypeScript validation, accessible form controls, and clearer clinical task states.",
                "Eliminated 38% of peak SQL response latency by restructuring care-coordination queries, tuning indexes, and offloading expensive operations to background processing jobs within the Hospice Referral and Admission Platform.",
                "Streamlined referral triage and admission routing to cut intake handoff time in half while preserving clinician review checkpoints and traceable workflow states across the admission lifecycle.",
                "Restructured automated test coverage across xUnit, Postman, and Cypress suites, lowering repeat production defects by 42% across admission, document, and provider-communication flows.",
                "Resolved one-third of admission-status escalations by exposing clearer event states, REST API diagnostics, and operational alerts to coordinators, clinicians, and product owners within the Clinical Document Management System."
            ],
            "skills": [
                "C#/.NET",
                "React.js",
                "TypeScript",
                "REST APIs",
                "SQL Server",
                "RBAC",
                "Cypress",
                "EHR Integration"
            ]
        },
        {
            "title": "Software Engineer",
            "company": "UMC Physicians",
            "date_range": "07/2018 - 12/2020",
            "job_type": "On-site",
            "responsibilities": [
                "Designed and delivered 8 full-stack capabilities within the MyTeamCare Patient Portal covering Online Scheduling, paperless registration, provider messaging, and health-information access using JavaScript, React, REST APIs, and SQL, collaborating with physicians, front-desk staff, and product analysts.",
                "Standardized 16 EHR and patient-management data mappings across the MyTeamCare Mobile App and Provider Directory, aligning API contracts, validation rules, and release acceptance criteria with clinical and infrastructure stakeholders."
            ],
            "achievements": [
                "Increased successful self-service scheduling by 33% by redesigning Online Scheduling into a guided single-session journey with improved React state management, validation feedback, and REST API error handling.",
                "Revitalized Provider Directory search to sub-second median response time through SQL query restructuring, data-model changes, and targeted caching for frequently accessed provider records.",
                "Simplified paperless registration within the MyTeamCare Patient Portal to reduce incomplete submissions by 22% through responsive layouts, accessible form controls, and reusable React components.",
                "Implemented secure session, authorization, and input-validation controls that lowered account-access incidents by approximately 20% across patient and staff-facing portal workflows.",
                "Transformed legacy portal delivery to reduce release regressions by 29% through reusable UI component patterns, API integration tests, Git-based code reviews, and Linux deployment runbooks."
            ],
            "skills": [
                "JavaScript",
                "React.js",
                "REST APIs",
                "SQL",
                "Linux",
                "Git",
                "Responsive Web Applications",
                "Patient Engagement"
            ]
        },
        {
            "title": "Junior Software Engineer",
            "company": "GermBlast",
            "date_range": "07/2016 - 06/2018",
            "job_type": "On-site",
            "responsibilities": [
                "Developed 10 modules across the GermBlast® Field Service Operations Platform and Service Scheduling and Dispatch System using JavaScript, C#/.NET, MySQL, and responsive web forms, collaborating with dispatchers, technicians, customer-service staff, and operations leaders.",
                "Established 15 data-validation and permission rules across the Technician Operations Dashboard covering customer, appointment, and service-record workflows using SQL constraints, role-based access controls, and Git-based acceptance reviews."
            ],
            "achievements": [
                "Launched automated appointment-state notifications across the Service Scheduling and Dispatch System that reduced missed service visits by 17% for customers, dispatchers, and field technicians.",
                "Improved Technician Operations Dashboard load time by 41% by rewriting MySQL queries, eliminating redundant joins, and limiting unnecessary service-location data retrieval.",
                "Solved scheduling conflicts within the GermBlast® Field Service Operations Platform to lower duplicate bookings by 26% through MySQL constraints, validation logic, and clearer technician-assignment rules.",
                "Generated 13 operational reports covering invoicing, service history, and technician utilization, shortening weekly reconciliation cycles by roughly 35% for operations leadership.",
                "Expanded role-based permissions across 19 user profiles within the Technician Operations Dashboard, reducing unauthorized record changes to zero during the final year of the role."
            ],
            "skills": [
                "JavaScript",
                "C#/.NET",
                "MySQL",
                "HTML5",
                "CSS3",
                "Git",
                "Unit Testing",
                "Service Scheduling"
            ]
        }
    ],
    "education": [
        {
            "degree": "Bachelor of Science in Computer Science",
            "institution": "University of Kansas",
            "location": "Lawrence, KS",
            "date_range": "08/2012 - 05/2016"
        }
    ]
}


========================================
PRIMARY OBJECTIVE
========================================

Generate a new resume that aligns tightly with the target job description while preserving the candidate’s factual resume structure.

You MUST:
1. Rewrite all experience entries.
2. Do NOT copy bullets verbatim from the input resume.
3. Keep the same companies and date ranges.
4. Preserve contact information exactly.
5. Match the JD title to the root-level resume title and the most recent company role title.
6. Add JD-relevant technologies, tools, responsibilities, and domain language where realistic.
7. Reorganize experience content to prioritize JD-relevant work.
8. Remove or de-emphasize experience that does not align with the JD.
9. Keep the resume realistic for a senior individual contributor.
10. Return ONLY valid JSON.

The input resume is a reference for:
- Contact information
- Companies
- Dates
- Education
- Career trajectory
- Seniority level
- Professional tone

The input resume is NOT a template to copy from.

========================================
CONTACT INFORMATION RULES — STRICT
========================================

Preserve the following exactly from the input resume:
- name
- email
- phone
- address/location
- LinkedIn URL

Do NOT:
- Modify contact information
- Infer new contact details
- Add missing contact details
- Rewrite the location
- Update the phone number, email, or LinkedIn URL

========================================
JD TITLE NORMALIZATION + MOST RECENT ROLE TITLE RULES — STRICT
========================================

Parse the JD and identify the primary target job title.

Normalize the JD title before using it in the resume.

The normalized title must:
- Be used as the root-level resume "title".
- Be used EXACTLY as the "title" for the UnitedHealth Group role if UnitedHealth Group exists in the resume.
- If UnitedHealth Group does not exist, use the normalized title EXACTLY for the most recent experience entry.
- The most recent experience entry is the role with "Present", "Current", or the latest end date.
- Prefer standard individual-contributor engineering titles.
- Never output noisy, over-specific, team-specific, or level-coded titles.
- Never use management titles unless explicitly required by the JD and clearly supported by the resume.

Preferred normalized titles:
- Senior Software Engineer
- Senior Frontend Engineer
- Senior Backend Engineer
- Senior Full Stack Engineer
- Senior Platform Engineer
- Senior Software Developer
- Staff Software Engineer
- Staff Frontend Engineer
- Staff Backend Engineer
- Staff Full Stack Engineer
- Staff Platform Engineer
- Principal Software Engineer
- Principal Frontend Engineer
- Principal Backend Engineer
- Principal Full Stack Engineer
- Principal Platform Engineer

Normalization behavior:
- Remove level suffixes:
  - I
  - II
  - III
  - IV
  - L4
  - L5
  - L6
  - Level indicators
- Remove unnecessary specialization, product, team, or org text:
  - "- Growth"
  - "- Payments"
  - "- Search"
  - "| Consumer"
  - ", Core Infrastructure"
  - team suffixes
  - org suffixes
  - product suffixes
  - platform suffixes when they are not the main discipline
- Preserve meaningful engineering discipline:
  - Frontend
  - Backend
  - Full Stack
  - Platform
  - Infrastructure
- Preserve seniority:
  - Senior
  - Staff
  - Principal

Seniority normalization rules:
- If the JD title contains "Senior", use a Senior title.
- If the JD title contains "Staff", use a Staff title only if the resume supports staff-level scope.
- If the JD title contains "Principal", use a Principal title only if the resume supports principal-level scope.
- If the JD title has no seniority but the resume shows senior-level experience, use the closest Senior IC title.
- Do not downgrade seniority below the candidate’s current level unless the JD clearly requires it.

Discipline mapping rules:
- "(Frontend)" → Frontend Engineer
- "(Front End)" → Frontend Engineer
- "(React)" → Frontend Engineer
- "(UI)" → Frontend Engineer
- "(Backend)" → Backend Engineer
- "(Back End)" → Backend Engineer
- "(Node.js)" → Backend Engineer
- "(API)" → Backend Engineer
- "(Full Stack)" → Full Stack Engineer
- "(Full-Stack)" → Full Stack Engineer
- "(Platform)" → Platform Engineer
- "(Infrastructure)" → Platform Engineer
- "(Core Infrastructure)" → Platform Engineer only if infrastructure is the primary JD focus
- "(DevOps)" → Platform Engineer only if the JD is engineering-focused, not operations-only

Management title handling:
- If the JD title is "Engineering Manager", "Software Engineering Manager", "Director", "Head of Engineering", or similar:
  - Do NOT use the management title unless the resume clearly supports people-management scope.
  - Instead, normalize to the closest senior IC title.

Examples:
Input JD title: "Senior Software Engineer I (Frontend)"
Normalized title: "Senior Frontend Engineer"

Input JD title: "Senior Software Engineer II - Backend Platform"
Normalized title: "Senior Backend Engineer"

Input JD title: "Staff Software Engineer (React)"
Normalized title: "Staff Frontend Engineer"

Input JD title: "Principal Software Engineer, Payments Infrastructure"
Normalized title: "Principal Software Engineer"

Input JD title: "Software Engineer, Growth"
Normalized title: "Senior Software Engineer"

Input JD title: "Backend Engineer - Payments"
Normalized title: "Senior Backend Engineer"

Input JD title: "Engineering Manager, Platform"
Normalized title: "Senior Platform Engineer"

Final title application:
- Set root-level "title" to the normalized title.
- Set UnitedHealth Group role "title" to the exact same normalized title if UnitedHealth Group exists.
- Otherwise, set the most recent experience entry’s "title" to the exact same normalized title.
- Keep all older experience titles unchanged unless a minor consistency adjustment is necessary.
- Preserve all company names and date ranges exactly.

========================================
SUMMARY RULES — STRICT
========================================

The summary must:
- Be fewer than 100 words.
- Be more than 70 words.
- Align with the JD and rewritten experience sections.
- Include EXACTLY 2 unique metrics.
- Use metrics that also appear elsewhere in the resume.
- Avoid generic claims.
- Avoid filler words.
- Avoid action verbs that are already used 3 times elsewhere.

========================================
SKILLS RULES — STRICT
========================================

Hard skills must be organized by category.

Allowed categories:
- Backend
- Frontend
- Cloud
- Data
- Tools
- Industry
- Mobile, only if the JD has a mobile focus

Rules:
- Each included category must contain EXACTLY 8 skills.
- Do not include empty categories.
- Industry must always be included.
- Mobile must be included only if the JD has mobile focus.
- Every skill must align with the JD.
- Every skill must appear in, or be clearly supported by, the experience section.
- Skills must reflect senior-level technical breadth.
- Industry skills must reflect the JD domain, such as healthcare, fintech, eCommerce, SaaS, platform engineering, or another relevant domain.

========================================
EXPERIENCE COUNT RULES — STRICT
========================================

For EACH experience entry, generate EXACTLY:

- responsibilities: 2 items
- achievements: 5 items
- skills: 8 items

This means every job must contain:
- EXACTLY 2 responsibility bullets
- EXACTLY 5 achievement bullets
- EXACTLY 8 role-specific skills

Do NOT generate more or fewer items.

The JSON must never contain empty arrays.

========================================
RESPONSIBILITY RULES — STRICT
========================================

Each responsibility must:
- Be one sentence.
- Start with a strong action verb.
- Include at least 1 metric.
- Describe ownership, scope, systems, stakeholders, architecture, delivery, or technical responsibility.
- Include at least 1 JD-relevant technology, tool, Methodologies, or domain term.
- Be realistic for the role and date range.
- Be different from the achievement bullets.

Example:
"Architected HIPAA-compliant Node.js services supporting 14 clinical workflows across patient engagement, eligibility verification, and care coordination."

========================================
ACHIEVEMENT RULES — STRICT
========================================

Each achievement must:
- Be one sentence.
- Start with a strong action verb.
- Include at least 1 metric.
- Describe measurable business, technical, product, reliability, performance, security, or user impact.
- Prioritize JD-relevant outcomes.
- Avoid vague claims.
- Avoid copying any source resume bullet.

Example:
"Reduced FHIR API response latency by 37% by redesigning patient-record aggregation flows across Epic, Cerner, and internal care-management services."

========================================
ACTION VERB RULES — STRICT
========================================

Every responsibility and achievement must start with a strong action verb.

Preferred action verbs:
Accelerated, Achieved, Analyzed, Architected, Assessed, Automated, Controlled, Devised, Directed, Eliminated, Established, Expanded, Generated, Implemented, Increased, Initiated, Innovated, Introduced, Launched, Led, Modernized, Orchestrated, Pioneered, Redesigned, Reduced, Resolved, Restructured, Revitalized, Saved, Simplified, Solved, Stabilized, Standardized, Streamlined, Transformed, Unified

Forbidden verbs and phrases:
helped, assisted, participated, supported, worked on, collaborated, contributed, responsible for, involved in

Rules:
- Each action verb may appear at most 3 times across the entire resume.
- Do not start multiple bullets in the same role with the same verb.
- Avoid weak or passive phrasing.

========================================
METRIC RULES — STRICT
========================================

Every responsibility and achievement must include at least 1 metric.

Use a mix of metric types:

1. Exact metrics
- Percentages not divisible by 5.
- Example: 37%, 18%, 42%.
- Must include measurement context.

2. Approximate metrics
- Percentages divisible by 5.
- Must use approximation language.
- Example: "about 30%", "roughly 40%", "approximately 25%".

3. Phrase-based metrics
- Non-numeric measurable language.
- Example: "cut in half", "doubled", "one-third", "sub-second", "same-day".

Global metric rules:
- Do not reuse the same metric value or phrase.
- Metrics must be believable.
- Metrics must be contextual.
- Metrics must not contradict the role, timeline, or seniority level.
- Metrics in the summary must also appear in experience.

========================================
WORK HISTORY RULES — GLOBAL
========================================

For each role:
- Keep the original company name.
- Keep the original date range.
- Keep the original job title for older roles unless a minor consistency adjustment is necessary.
- For UnitedHealth Group, use the normalized JD title exactly if UnitedHealth Group exists.
- If UnitedHealth Group does not exist, use the normalized JD title exactly for the most recent role.
- Rewrite every responsibility.
- Rewrite every achievement.
- Do NOT copy bullets from the input resume.
- Do NOT duplicate experience entries.
- Do NOT create extra jobs.
- Do NOT invent promotions unless already present.
- Include JD-required tools and technologies where realistic.
- Include optional, preferred, bonus, and nice-to-have JD items when relevant.
- Make stakeholder interaction explicit in every role.
- Include cross-functional work in every role.
- Do not introduce managerial scope unless the JD explicitly requires it.
- Keep all work realistic for a senior IC with comparable experience.
- In every Work History entry, include the relevant company’s products. Integrate them naturally into the role’s bullet points where appropriate, while keeping all claims consistent with the candidate’s experience. Do not invent unsupported responsibilities, achievements, or product usage.

Use only these exact company-to-product mappings:

UnitedHealth Group: UnitedHealthcare, myuhc.com / UnitedHealthcare member experience, UnitedHealthcare Medicare, UnitedHealthcare Community Plan

BRIDGE Hospice: Patient Intake and Care Coordination Platform, Hospice Referral and Admission Platform, Clinical Document Management System

UMC Physicians: MyTeamCare Patient Portal, MyTeamCare Mobile App, Online Scheduling, Provider Directory

GermBlast: GermBlast® Field Service Operations Platform, Service Scheduling and Dispatch System, Technician Operations Dashboard

========================================
COMPANY PRODUCT RULES — STRICT
========================================

- Products must only be mentioned within the corresponding company’s Work History section.
- Do not assign or reference a product under the wrong company.
- Integrate product names naturally into bullet points rather than listing them separately.
- Ensure product usage is realistic and consistent with the described responsibilities.
- Preserve all other aspects of the original prompt unchanged.

========================================
TECHNOLOGY TIMELINE RULES — STRICT
========================================

- Technologies must be realistic for each role’s date range.
- Do not use tools before they were industry-realistic.
- Older roles should show appropriate technical evolution.
- Newer roles should carry the strongest JD alignment.
- Avoid anachronistic cloud, AI, frontend, mobile, or DevOps claims.

========================================
JD ALIGNMENT RULES — STRICT
========================================

You must parse the JD and identify:
- Mandatory requirements
- Optional requirements
- Preferred requirements
- Nice-to-have requirements
- Bonus requirements
- Tools
- Technologies
- Frameworks
- Methodologies
- Domain language
- Business outcomes
- Collaboration expectations

Then reflect them across:
- summary
- skills
- responsibilities
- achievements

The resume must read as highly aligned with the JD while remaining realistic and recruiter-trustworthy.

========================================
INDUSTRY VOCABULARY RULES
========================================

Use Healthcare industry vocabulary only when relevant to the JD.

Examples:
HL7 v2, FHIR R4, SMART on FHIR, FHIR APIs, Clinical Data Exchange, Healthcare Messaging, Interoperability, EMR/EHR Systems, Epic, Cerner, Oracle Health, Athenahealth, Allscripts, Clinical Workflows, Longitudinal Patient Records, Care Coordination, Provider Directory, Clinical Decision Support, HIPAA Compliance, PHI, PII, Audit Logging, Privacy-by-Design, RBAC, Data Encryption, SOC 2, Claims Processing, Eligibility & Benefits, Prior Authorization, Utilization Management, Revenue Cycle Management, Patient Engagement, Telehealth, Virtual Care, Behavioral Health Technology, Event-Driven Architecture, CQRS, Microservices, FHIR-First Architecture, Real-Time Clinical Data Streaming.

========================================
CONSISTENCY & REALISM RULES
========================================

The resume must have no contradictions between:
- Skills and experience
- Summary and experience
- Metrics and achievements
- Technologies and dates
- JD title and resume seniority
- Responsibilities and role scope

The resume must:
- Read as a polished senior-level profile.
- Align tightly with the JD.
- Stay recruiter-trustworthy.
- Avoid exaggerated or implausible claims.
- Avoid filler words such as very, highly, really, various, multiple, numerous, significant, some, many, things, and stuff.
- Prefer precise verbs such as re-architected, instrumented, standardized, orchestrated, stabilized, and automated.

========================================
OUTPUT JSON STRUCTURE
========================================

Return ONLY this JSON object.

Do not include markdown.
Do not include comments.
Do not include explanations.
Do not include trailing commas.
Do not include extra keys.
Field ordering must match JSON schema exactly.

========================================
FINAL VALIDATION BEFORE OUTPUT
========================================

Before returning the JSON, silently verify:
- The result matches the JSON schema.
- The output is valid JSON.
- There is no markdown formatting.
- There are no comments.
- There are no trailing commas.
- There are no extra keys.
- Field order matches the required structure.
- Contact information is preserved exactly.
- Root-level "title" uses the normalized JD title.
- UnitedHealth Group role title uses the exact normalized JD title if UnitedHealth Group exists.
- If UnitedHealth Group does not exist, the most recent role title uses the exact normalized JD title.
- Every experience entry has EXACTLY 2 responsibilities.
- Every experience entry has EXACTLY 5 achievements.
- Every experience entry has EXACTLY 8 skills.
- Every responsibility includes at least 1 metric.
- Every achievement includes at least 1 metric.
- Every responsibility starts with a strong action verb.
- Every achievement starts with a strong action verb.
- No forbidden verbs or phrases are used.
- No action verb appears more than 3 times across the resume.
- No copied bullets from the input resume appear in the output.
- No duplicate jobs exist.
- Skills are supported by experience.
- JD-required technologies are represented.
- Metrics are not reused.
- The resume is realistic, senior-level, and tightly aligned with the JD.

Return ONLY valid JSON.