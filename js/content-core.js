/* Identity Defender content: core (curriculum, sources, Mission 01). Content is data only; game logic lives in app.js. */
window.ID_CONTENT = {
 "meta": {
  "version": "2.0.0",
  "verified": "2026-11-18",
  "studyGuide": "SC-300 skills measured as of October 28, 2026",
  "studyGuideUrl": "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-300",
  "assumptions": "Halcyon Freight, BrightBoard, every person and every log entry are fictional. Halcyon is licensed for Microsoft 365 E3 (which includes Microsoft Entra ID P1) with enough seats for everyone. Screens are simplified simulations of the Microsoft Entra admin center, not exact replicas."
 },
 "curriculum": [
  {
   "id": "D1",
   "name": "Implement and manage user identities",
   "weight": "20–25%",
   "groups": [
    {
     "name": "Configure and manage a Microsoft Entra tenant",
     "items": [
      [
       "1.1.1",
       "Configure and manage built-in and custom Microsoft Entra roles"
      ],
      [
       "1.1.2",
       "Recommend when to use administrative units"
      ],
      [
       "1.1.3",
       "Configure and manage administrative units"
      ],
      [
       "1.1.4",
       "Evaluate effective permissions for Microsoft Entra roles"
      ],
      [
       "1.1.5",
       "Configure and manage domains in Microsoft Entra ID and Microsoft 365"
      ],
      [
       "1.1.6",
       "Configure Company branding settings"
      ],
      [
       "1.1.7",
       "Configure tenant properties, user settings, group settings, and device settings"
      ]
     ]
    },
    {
     "name": "Create, configure, and manage Microsoft Entra identities",
     "items": [
      [
       "1.2.1",
       "Create, configure, and manage users"
      ],
      [
       "1.2.2",
       "Create, configure, and manage groups"
      ],
      [
       "1.2.3",
       "Manage custom security attributes"
      ],
      [
       "1.2.4",
       "Automate bulk operations by using the Microsoft Entra admin center and PowerShell"
      ],
      [
       "1.2.5",
       "Manage device join and device registration in Microsoft Entra ID"
      ],
      [
       "1.2.6",
       "Assign, modify, and report on licenses"
      ]
     ]
    },
    {
     "name": "Implement and manage identities for external users and tenants",
     "items": [
      [
       "1.3.1",
       "Manage External collaboration settings in Microsoft Entra ID"
      ],
      [
       "1.3.2",
       "Invite external users, individually or in bulk"
      ],
      [
       "1.3.3",
       "Manage external user accounts in Microsoft Entra ID"
      ],
      [
       "1.3.4",
       "Implement Cross-tenant access settings"
      ],
      [
       "1.3.5",
       "Implement and manage cross-tenant synchronization"
      ],
      [
       "1.3.6",
       "Configure external identity providers, including protocols such as SAML and WS-Fed"
      ]
     ]
    },
    {
     "name": "Implement and manage hybrid identity",
     "items": [
      [
       "1.4.1",
       "Implement and manage Microsoft Entra Connect Sync"
      ],
      [
       "1.4.2",
       "Implement and manage Microsoft Entra Cloud Sync"
      ],
      [
       "1.4.3",
       "Implement and manage password hash synchronization"
      ],
      [
       "1.4.4",
       "Implement and manage pass-through authentication"
      ],
      [
       "1.4.5",
       "Implement and manage seamless single sign-on (SSO)"
      ],
      [
       "1.4.6",
       "Migrate from AD FS to other authentication and authorization mechanisms"
      ],
      [
       "1.4.7",
       "Implement and manage Microsoft Entra Connect Health"
      ]
     ]
    }
   ]
  },
  {
   "id": "D2",
   "name": "Implement authentication and access management",
   "weight": "25–30%",
   "groups": [
    {
     "name": "Plan, implement, and manage Microsoft Entra user authentication",
     "items": [
      [
       "2.1.1",
       "Plan for authentication"
      ],
      [
       "2.1.2",
       "Implement and manage authentication methods, including certificate-based authentication, Temporary Access Pass, Microsoft Authenticator, and passkeys (FIDO2)"
      ],
      [
       "2.1.3",
       "Implement and manage tenant-wide multifactor authentication (MFA) settings"
      ],
      [
       "2.1.4",
       "Configure and deploy self-service password reset (SSPR)"
      ],
      [
       "2.1.5",
       "Implement and manage Windows Hello for Business"
      ],
      [
       "2.1.6",
       "Disable accounts and revoke user sessions"
      ],
      [
       "2.1.7",
       "Implement and manage Microsoft Entra password protection"
      ],
      [
       "2.1.8",
       "Enable Microsoft Entra Kerberos authentication for hybrid identities"
      ]
     ]
    },
    {
     "name": "Plan, implement, and manage Microsoft Entra Conditional Access",
     "items": [
      [
       "2.2.1",
       "Plan Conditional Access policies"
      ],
      [
       "2.2.2",
       "Implement Conditional Access policy assignments"
      ],
      [
       "2.2.3",
       "Implement Conditional Access policy controls"
      ],
      [
       "2.2.4",
       "Test and troubleshoot Conditional Access policies"
      ],
      [
       "2.2.5",
       "Implement session management"
      ],
      [
       "2.2.6",
       "Implement device-enforced restrictions"
      ],
      [
       "2.2.7",
       "Implement continuous access evaluation"
      ],
      [
       "2.2.8",
       "Configure authentication context"
      ],
      [
       "2.2.9",
       "Implement protected actions"
      ],
      [
       "2.2.10",
       "Create a Conditional Access policy from a template"
      ]
     ]
    },
    {
     "name": "Manage risk by using Microsoft Entra ID Protection",
     "items": [
      [
       "2.3.1",
       "Implement and manage user risk by using Microsoft Entra ID Protection or Conditional Access policies"
      ],
      [
       "2.3.2",
       "Implement and manage sign-in risk by using Microsoft Entra ID Protection or Conditional Access policies"
      ],
      [
       "2.3.3",
       "Implement and manage multifactor authentication registration by using authentication methods and registration campaigns"
      ],
      [
       "2.3.4",
       "Monitor, investigate and remediate risky users and risky sign-ins"
      ],
      [
       "2.3.5",
       "Monitor, investigate, and remediate risky workload identities"
      ]
     ]
    },
    {
     "name": "Implement Global Secure Access",
     "items": [
      [
       "2.4.1",
       "Deploy Global Secure Access clients"
      ],
      [
       "2.4.2",
       "Deploy and manage Microsoft Entra Private Access"
      ],
      [
       "2.4.3",
       "Deploy and manage Microsoft Entra Internet Access"
      ],
      [
       "2.4.4",
       "Deploy and manage the Microsoft traffic profile for Microsoft 365"
      ]
     ]
    }
   ]
  },
  {
   "id": "D3",
   "name": "Plan and implement workload identities",
   "weight": "20–25%",
   "groups": [
    {
     "name": "Plan and implement identities for applications and Azure workloads",
     "items": [
      [
       "3.1.1",
       "Select appropriate identities for applications and Azure workloads, including managed identities, service principals, user accounts, and managed service accounts"
      ],
      [
       "3.1.2",
       "Create managed identities"
      ],
      [
       "3.1.3",
       "Assign a managed identity to an Azure resource"
      ],
      [
       "3.1.4",
       "Use a managed identity assigned to an Azure resource to access other Azure resources"
      ]
     ]
    },
    {
     "name": "Plan, implement, and monitor the integration of enterprise applications",
     "items": [
      [
       "3.2.1",
       "Plan and implement settings for enterprise applications, including application-level and tenant-level settings"
      ],
      [
       "3.2.2",
       "Assign appropriate Microsoft Entra roles to users to manage enterprise applications"
      ],
      [
       "3.2.3",
       "Design and implement integration for on-premises apps by using Microsoft Entra Application Proxy"
      ],
      [
       "3.2.4",
       "Design and implement integration for software as a service (SaaS) apps"
      ],
      [
       "3.2.5",
       "Assign, classify, and manage users, groups, and app roles for enterprise applications"
      ],
      [
       "3.2.6",
       "Configure and manage user and admin consent"
      ],
      [
       "3.2.7",
       "Create and manage application collections"
      ]
     ]
    },
    {
     "name": "Plan and implement app registrations",
     "items": [
      [
       "3.3.1",
       "Plan for app registrations"
      ],
      [
       "3.3.2",
       "Create app registrations"
      ],
      [
       "3.3.3",
       "Configure app authentication"
      ],
      [
       "3.3.4",
       "Configure API permissions"
      ],
      [
       "3.3.5",
       "Create app roles"
      ]
     ]
    },
    {
     "name": "Manage and monitor app access by using Microsoft Defender for Cloud Apps",
     "items": [
      [
       "3.4.1",
       "Configure and analyze cloud discovery results by using Defender for Cloud Apps"
      ],
      [
       "3.4.2",
       "Configure connected apps"
      ],
      [
       "3.4.3",
       "Implement application-enforced restrictions"
      ],
      [
       "3.4.4",
       "Configure Conditional Access app control"
      ],
      [
       "3.4.5",
       "Create access and session policies in Defender for Cloud Apps"
      ],
      [
       "3.4.6",
       "Implement and manage policies for OAuth apps"
      ],
      [
       "3.4.7",
       "Manage the Cloud app catalog"
      ]
     ]
    }
   ]
  },
  {
   "id": "D4",
   "name": "Plan and automate identity governance",
   "weight": "20–25%",
   "groups": [
    {
     "name": "Plan and implement entitlement management in Microsoft Entra",
     "items": [
      [
       "4.1.1",
       "Plan entitlements"
      ],
      [
       "4.1.2",
       "Create and configure catalogs"
      ],
      [
       "4.1.3",
       "Create and configure access packages"
      ],
      [
       "4.1.4",
       "Manage access requests"
      ],
      [
       "4.1.5",
       "Implement and manage terms of use (ToU)"
      ],
      [
       "4.1.6",
       "Manage the lifecycle of external users"
      ],
      [
       "4.1.7",
       "Configure and manage connected organizations"
      ]
     ]
    },
    {
     "name": "Plan, implement, and manage access reviews in Microsoft Entra",
     "items": [
      [
       "4.2.1",
       "Plan for access reviews"
      ],
      [
       "4.2.2",
       "Create and configure access reviews"
      ],
      [
       "4.2.3",
       "Monitor access review activity"
      ],
      [
       "4.2.4",
       "Manually respond to access review activity"
      ]
     ]
    },
    {
     "name": "Plan and implement privileged access",
     "items": [
      [
       "4.3.1",
       "Plan and manage Microsoft Entra roles in Microsoft Entra Privileged Identity Management (PIM), including settings and assignments"
      ],
      [
       "4.3.2",
       "Plan and manage Azure resources in PIM, including settings and assignments"
      ],
      [
       "4.3.3",
       "Plan and configure PIM for Groups"
      ],
      [
       "4.3.4",
       "Manage the PIM request and approval process"
      ],
      [
       "4.3.5",
       "Analyze PIM audit history and reports"
      ],
      [
       "4.3.6",
       "Create and manage emergency access accounts"
      ]
     ]
    },
    {
     "name": "Monitor identity activity by using logs, workbooks, and reports",
     "items": [
      [
       "4.4.1",
       "Review and analyze sign-in, audit, and provisioning logs by using the Microsoft Entra admin center"
      ],
      [
       "4.4.2",
       "Configure diagnostic settings, including configuring destinations such as Log Analytics workspaces, storage accounts, and Azure Event Hubs"
      ],
      [
       "4.4.3",
       "Monitor Microsoft Entra ID by using KQL queries in Log Analytics"
      ],
      [
       "4.4.4",
       "Analyze Microsoft Entra ID by using workbooks and reporting"
      ],
      [
       "4.4.5",
       "Monitor and improve the security posture by using Identity Secure Score"
      ]
     ]
    }
   ]
  }
 ],
 "sources": {
  "license": {
   "title": "Assign or remove licenses (Microsoft Entra)",
   "url": "https://learn.microsoft.com/entra/fundamentals/license-users-groups"
  },
  "groupLicense": {
   "title": "Assign licenses to users by group membership",
   "url": "https://learn.microsoft.com/entra/identity/users/licensing-groups-assign"
  },
  "groupLicenseAdv": {
   "title": "Group-based licensing: scenarios, limitations, and known issues",
   "url": "https://learn.microsoft.com/entra/identity/users/licensing-group-advanced"
  },
  "dynamic": {
   "title": "Manage rules for dynamic membership groups",
   "url": "https://learn.microsoft.com/entra/identity/users/groups-dynamic-membership"
  },
  "dynamicCreate": {
   "title": "Create or update a dynamic membership group",
   "url": "https://learn.microsoft.com/entra/identity/users/groups-create-rule"
  },
  "manageGroups": {
   "title": "Manage Microsoft Entra groups and group membership",
   "url": "https://learn.microsoft.com/entra/fundamentals/how-to-manage-groups"
  },
  "selfService": {
   "title": "Set up self-service group management",
   "url": "https://learn.microsoft.com/entra/identity/users/groups-self-service-management"
  },
  "roles": {
   "title": "Microsoft Entra built-in roles (permissions reference)",
   "url": "https://learn.microsoft.com/entra/identity/role-based-access-control/permissions-reference"
  },
  "byTask": {
   "title": "Least privileged roles by task",
   "url": "https://learn.microsoft.com/entra/identity/role-based-access-control/delegate-by-task"
  }
 },
 "missions": {
  "M1": {
   "id": "M1",
   "domain": "D1",
   "code": "Mission 01",
   "title": "Badge Day",
   "minutes": 10,
   "story": "Monday, 08:40. You're the new identity administrator at <b>Halcyon Freight</b>, a fictional logistics company with about 1,200 staff. Marketing hired <b>Maya Chen</b>, who starts at 10:00. Her manager, <b>Priya Raman</b>, would like Maya to have email, Teams and <b>BrightBoard</b> (the team's campaign tool) before her coffee goes cold. Theo, the junior admin, has already started. That's the problem.",
   "goal": "Get Maya working today, make the next Marketing hire automatic, and hand Priya exactly the control she needs.",
   "meterLabels": {
    "acc": "Maya's access readiness"
   },
   "meterBase": {
    "sec": 60,
    "acc": 20,
    "ops": 30
   },
   "groups": [
    {
     "n": 1,
     "title": "The license that won't stick",
     "blurb": "Diagnose a failed license assignment on a brand-new account.",
     "items": [
      "c1",
      "c1t"
     ]
    },
    {
     "n": 2,
     "title": "Build the onboarding autopilot",
     "blurb": "Design a group that grants and removes access by itself, then debug it.",
     "items": [
      "c2a",
      "c2b",
      "c2t"
     ]
    },
    {
     "n": 3,
     "title": "Priya wants the keys",
     "blurb": "Delegate group management with least privilege.",
     "items": [
      "c3",
      "c3t"
     ]
    }
   ],
   "takeaways": [
    "<b>Usage location</b> must be set before a license can be assigned directly to a user. Group-based licensing fills a blank value from the directory's location instead, which may be the wrong country.",
    "A <b>security group</b> with <b>Dynamic User</b> membership and a rule on a reliable attribute (here, <code>user.department</code>) grants licenses and app access to joiners and removes them from leavers. Attribute quality becomes a security control.",
    "Delegate one group with <b>group ownership</b>, not an admin role. Dynamic groups can't take manual members, so hand-picked groups must use <b>Assigned</b> membership."
   ],
   "next": "M2"
  }
 },
 "items": {
  "c1": {
   "kind": "Identity Detective",
   "type": "single",
   "title": "The license that won't stick",
   "objectives": [
    "1.2.1",
    "1.2.6"
   ],
   "main": true,
   "story": "Theo pings you: <b>“License assign failed?? I clicked the button twice.”</b> He created Maya's account by hand this morning instead of waiting for the HR feed.",
   "situation": "<p>Maya's account exists, but assigning her a Microsoft 365 E3 license directly to her account failed. Review her profile and the audit entry, then choose the fix.</p>",
   "teach": "<p>A <b>user</b> in Microsoft Entra ID is an object with properties, and properties do different jobs:</p><ul><li><b>Informational:</b> Office location, for example, shows on contact cards.</li><li><b>Automation inputs:</b> Department, for example, can be read by rules that place users into groups.</li><li><b>Gatekeepers:</b> some properties must be set before a feature will work at all.</li></ul><p>Licenses unlock services such as Exchange Online and Teams, and not every service is offered in every country because of local laws and regulations.</p>",
   "evidence": [
    {
     "kind": "kv",
     "title": "Users › Maya Chen › Properties",
     "fields": [
      [
       "Display name",
       "Maya Chen"
      ],
      [
       "User principal name",
       "maya.chen@halcyonfreight.example"
      ],
      [
       "Account enabled",
       "Yes"
      ],
      [
       "Job title",
       "Marketing Coordinator"
      ],
      [
       "Department",
       ""
      ],
      [
       "Office location",
       "Toronto"
      ],
      [
       "Usage location",
       ""
      ],
      [
       "Licenses",
       "None"
      ]
     ]
    },
    {
     "kind": "table",
     "title": "Audit log (latest entry)",
     "columns": [
      "Time",
      "Activity",
      "Target",
      "Status",
      "Reason (paraphrased)"
     ],
     "rows": [
      [
       "08:31",
       "Change user license",
       "Maya Chen",
       "<span class='no'>Failure</span>",
       "License can't be assigned: the user's usage location is not set."
      ]
     ]
    }
   ],
   "prompt": "Which change will let Theo's direct license assignment succeed?",
   "options": [
    {
     "id": "a",
     "text": "Set Maya's <b>Usage location</b> to Canada, then retry the assignment",
     "correct": true,
     "feedback": "Usage location tells Microsoft which country's service availability applies. A license can't be assigned directly to a user until it's set.",
     "impact": {
      "acc": 25
     },
     "consequence": "Maya can now be licensed. Her mailbox and Teams start provisioning."
    },
    {
     "id": "b",
     "text": "Change <b>Office location</b> to “Toronto HQ” so it's more specific",
     "feedback": "Office location is informational. It appears on contact cards and plays no part in licensing.",
     "misconception": "Office location controls license eligibility",
     "impact": {},
     "consequence": "Nothing changes. The assignment still fails and Maya waits."
    },
    {
     "id": "c",
     "text": "Set <b>Department</b> to “Marketing”",
     "feedback": "Good instinct, because that blank Department will matter later in this mission. But Department isn't required for license assignment, so this error stays.",
     "misconception": "Department is required for licensing",
     "impact": {},
     "consequence": "The assignment still fails, though you've fixed something useful for later."
    },
    {
     "id": "d",
     "text": "Give Theo the <b>License Administrator</b> role and retry",
     "feedback": "The failure reason names a missing user property, not a missing permission. License Administrator is a real role, but adding privilege here fixes nothing and leaves Theo with rights he didn't need.",
     "misconception": "Treating a data error as a permissions error",
     "impact": {
      "sec": -10
     },
     "consequence": "Theo gains a role he doesn't need, and the assignment still fails."
    }
   ],
   "hints": [
    "Read the audit entry's Reason column, not just Status.",
    "Licensing depends on where a person will use a service, which isn't the same thing as where their desk is."
   ],
   "explanation": "<p><b>Usage location</b> is a two-letter country or region code on the user (CA for Canada). Before a license can be assigned directly to a user, an administrator must set it, because service availability varies by location. Set it during account creation so it never blocks someone's first day.</p><p>You can set it in the user's <b>Properties</b> in the Microsoft Entra admin center, or with Microsoft Graph PowerShell, for example <code>Update-MgUser -UserId maya.chen@halcyonfreight.example -UsageLocation \"CA\"</code>. Microsoft Learn currently directs license <i>assignment</i> to the Microsoft 365 admin center.</p>",
   "simplification": "The audit entry is simulated and paraphrased. Real error wording and portal layout differ.",
   "sources": [
    "license",
    "groupLicense"
   ]
  },
  "c1t": {
   "kind": "Transfer check",
   "type": "single",
   "title": "Rotterdam, six weeks later",
   "objectives": [
    "1.2.6"
   ],
   "situation": "<p>Halcyon opens a depot in Rotterdam. A new supervisor, Joris, is added to a group that assigns Microsoft 365 E3 through <b>group-based licensing</b>. His Usage location is blank. Halcyon's directory (tenant) location is Canada.</p>",
   "prompt": "What happens to Joris's group-assigned license?",
   "options": [
    {
     "id": "a",
     "text": "It's assigned. Joris inherits the directory's location (Canada) because his usage location is blank",
     "correct": true,
     "feedback": "For group license assignment, users without a usage location inherit the directory's location. The license applies, but with the wrong country for Joris, so set his usage location to NL."
    },
    {
     "id": "b",
     "text": "The assignment fails until someone sets his usage location",
     "feedback": "That's the rule for direct assignment, which you met in Challenge 1. Group-based assignment falls back to the directory's location instead of failing.",
     "misconception": "Group-based licensing fails without a usage location"
    },
    {
     "id": "c",
     "text": "Entra reads his Office location (“Rotterdam”) and sets the Netherlands",
     "feedback": "Entra doesn't derive usage location from Office location. They're independent properties.",
     "misconception": "Usage location is derived from Office location"
    },
    {
     "id": "d",
     "text": "Entra uses the country of his first sign-in",
     "feedback": "Sign-in location doesn't set usage location. Usage location is an administrator-managed property.",
     "misconception": "Usage location comes from sign-in geography"
    }
   ],
   "hints": [
    "Direct assignment and group assignment behave differently here.",
    "Think “fallback”, not “failure”."
   ],
   "explanation": "<p>When licenses come from a group, a blank usage location is filled from the directory's location. Group license assignment never overwrites a usage location that's already set. For organizations with people in several countries, Microsoft recommends setting usage location as part of user creation (for example in your provisioning flow) so the result is always correct.</p>",
   "sources": [
    "groupLicense",
    "groupLicenseAdv"
   ]
  },
  "c2a": {
   "kind": "Policy Workshop",
   "type": "config",
   "title": "Build the onboarding autopilot",
   "objectives": [
    "1.2.2",
    "1.2.6"
   ],
   "main": true,
   "story": "Priya: <b>“Maya's sorted, thanks. But the last hire waited three days for BrightBoard. We hire eight people a quarter. Can it just… happen?”</b>",
   "situation": "<p>Design one group so that every Marketing employee, current and future, <b>automatically</b> receives the Microsoft 365 E3 license and access to the BrightBoard enterprise app, and <b>loses both</b> on leaving Marketing. Halcyon's HR feed reliably fills in each person's <b>Department</b>. Job titles vary a lot.</p>",
   "teach": "<p><b>Group types:</b> <b>Security</b> groups control access to resources and licenses. <b>Microsoft 365</b> groups are for collaboration and come with a shared mailbox, calendar and SharePoint site.</p><p><b>Membership types:</b> <b>Assigned</b> means people add and remove members by hand. <b>Dynamic User</b> means a rule over user attributes adds and removes users automatically. <b>Dynamic Device</b> means a rule over device attributes (security groups only).</p><p><b>Group-based licensing:</b> assign a license to a group once and every member receives it. Leaving the group removes it.</p><p>Dynamic membership requires Microsoft Entra ID P1 for each member, and Halcyon's Microsoft 365 E3 includes P1.</p>",
   "groupName": "GRP-Marketing-Onboarding",
   "fields": [
    {
     "id": "type",
     "label": "Group type",
     "options": [
      {
       "id": "security",
       "text": "Security",
       "correct": true,
       "feedback": "Security groups are the standard building block for licensing and app assignment.",
       "impact": {
        "sec": 5,
        "ops": 5
       }
      },
      {
       "id": "m365",
       "text": "Microsoft 365",
       "feedback": "Microsoft 365 groups are built for collaboration and provision a mailbox, calendar and SharePoint site that nobody asked for. For licensing and app access, a security group is the purpose-built choice.",
       "misconception": "Microsoft 365 groups are the default choice for access control",
       "impact": {
        "ops": -5
       },
       "consequence": "An unused mailbox and SharePoint site now exist for Marketing's license group."
      }
     ]
    },
    {
     "id": "membership",
     "label": "Membership type",
     "options": [
      {
       "id": "assigned",
       "text": "Assigned",
       "feedback": "Someone would still have to add each hire and remember to remove leavers. That's exactly the three-day delay Priya described.",
       "misconception": "Assigned groups automate onboarding",
       "impact": {
        "ops": -20,
        "sec": -5
       },
       "consequence": "Every joiner and leaver still needs a ticket, and forgotten removals leave access behind."
      },
      {
       "id": "dynuser",
       "text": "Dynamic User",
       "correct": true,
       "feedback": "A rule evaluated against user attributes adds joiners and removes leavers with no ticket.",
       "impact": {
        "ops": 25,
        "acc": 15
       }
      },
      {
       "id": "dyndevice",
       "text": "Dynamic Device",
       "feedback": "Device groups hold devices, but licenses and this app assignment target people. Dynamic Device suits device policies, such as Intune configuration.",
       "misconception": "Licenses can be assigned through device groups",
       "impact": {
        "acc": -10
       },
       "consequence": "No person ever lands in the group, so no one gets the license or BrightBoard."
      }
     ]
    },
    {
     "id": "rule",
     "label": "Membership rule",
     "mono": true,
     "showIf": {
      "field": "membership",
      "in": [
       "dynuser",
       "dyndevice"
      ]
     },
     "options": [
      {
       "id": "dept",
       "text": "user.department -eq \"Marketing\"",
       "correct": true,
       "feedback": "Builds on the attribute HR keeps accurate, with a simple, efficient equality check.",
       "impact": {
        "sec": 5
       }
      },
      {
       "id": "title",
       "text": "user.jobTitle -contains \"Marketing\"",
       "feedback": "Titles vary: Ana, a Brand Strategist in Marketing, is missed, while Leo, a “Sales & Marketing Liaison” in Sales, gets in. Microsoft also advises keeping -contains and -match to a minimum for processing performance.",
       "misconception": "Job title is a reliable attribute for access rules",
       "impact": {
        "sec": -10,
        "acc": -10
       },
       "consequence": "Some marketers wait for access while a salesperson gets Marketing's tools."
      },
      {
       "id": "office",
       "text": "user.officeLocation -eq \"Toronto\"",
       "feedback": "Location isn't department. This grants every Toronto employee Marketing's tools and misses marketers based elsewhere.",
       "misconception": "Location attributes are a stand-in for team membership",
       "impact": {
        "sec": -20
       },
       "consequence": "Every Toronto employee gets Marketing's license and app access."
      },
      {
       "id": "device",
       "text": "device.deviceOSType -eq \"Windows\"",
       "feedback": "That's a device property. It belongs in a Dynamic Device rule, and it says nothing about who works in Marketing.",
       "misconception": "Mixing device properties into user membership rules",
       "impact": {
        "acc": -10
       },
       "consequence": "The rule doesn't describe Marketing employees at all."
      }
     ]
    }
   ],
   "hints": [
    "“Automatically” and “loses both on leaving Marketing” point to one membership type.",
    "Build the rule on the attribute that HR keeps accurate."
   ],
   "explanation": "<p>A <b>security group</b> with <b>Dynamic User</b> membership and the rule <code>user.department -eq \"Marketing\"</code> turns HR data into access. Assign the E3 license and the BrightBoard enterprise app to the group once. Joiners receive both, and anyone whose Department changes away from Marketing loses both.</p><p><b>Security note:</b> whoever can edit Department now effectively controls access. Microsoft advises restricting write access to attributes used by security-sensitive dynamic groups.</p><p>Rule processing isn't instant, so a change can take a while to show up in membership.</p>",
   "simplification": "The workshop shows three settings. The real New group page also asks for a name, description, owners and other options.",
   "sources": [
    "dynamic",
    "dynamicCreate",
    "groupLicenseAdv"
   ]
  },
  "c2b": {
   "kind": "Identity Detective",
   "type": "single",
   "title": "Who's missing from the list?",
   "objectives": [
    "1.2.2",
    "1.2.1"
   ],
   "main": true,
   "story": "Before saving, you run <b>Validate rules</b> against a few accounts to check who'd be included.",
   "situation": "<p>The rule is <code>user.department -eq \"Marketing\"</code>. Maya should be in this group. The validation says she isn't.</p>",
   "evidence": [
    {
     "kind": "table",
     "title": "Validate rules: GRP-Marketing-Onboarding",
     "columns": [
      "User",
      "Department",
      "Job title",
      "Result"
     ],
     "rows": [
      [
       "Ana Ortiz",
       "Marketing",
       "Brand Strategist",
       "<span class='ok'>✓ Member</span>"
      ],
      [
       "Jun Park",
       "Marketing",
       "Marketing Analyst",
       "<span class='ok'>✓ Member</span>"
      ],
      [
       "Maya Chen",
       "<span class='no'>(empty)</span>",
       "Marketing Coordinator",
       "<span class='no'>✗ Not a member</span>"
      ],
      [
       "Leo Brandt",
       "Sales",
       "Sales &amp; Marketing Liaison",
       "<span class='no'>✗ Not a member</span>"
      ]
     ]
    }
   ],
   "prompt": "What's the best fix?",
   "options": [
    {
     "id": "a",
     "text": "Set Maya's <b>Department</b> attribute to “Marketing”",
     "correct": true,
     "feedback": "The rule is right; the data is wrong. Fix the attribute and her group membership, license and BrightBoard access follow automatically. Where an HR system provisions accounts, correct it at the source so the next sync doesn't undo your fix.",
     "impact": {
      "acc": 30,
      "sec": 5
     },
     "consequence": "Maya joins the group, the group license applies, and BrightBoard appears in her My Apps portal."
    },
    {
     "id": "b",
     "text": "Add Maya to the group manually as a member",
     "feedback": "Dynamic groups don't accept manual members. The rule is the only way in, which is exactly what keeps exceptions from piling up.",
     "misconception": "You can add members to a dynamic group by hand",
     "impact": {},
     "consequence": "The portal won't let you add her, so Maya's still locked out."
    },
    {
     "id": "c",
     "text": "Change the rule to <code>user.department -ne \"Sales\"</code>",
     "feedback": "This matches everyone who isn't in Sales, including Finance, Warehouse and every account with a blank Department. A large overgrant to fix one missing value.",
     "misconception": "Broadening a rule to fix one user's data",
     "impact": {
      "sec": -30,
      "acc": 30
     },
     "consequence": "Maya gets access, along with hundreds of people outside Marketing."
    },
    {
     "id": "d",
     "text": "Assign the license and BrightBoard to Maya directly, outside the group",
     "feedback": "It works today, but it creates a one-off that nobody will remove if Maya changes teams. The access gap is a data problem, so fix the data.",
     "misconception": "Direct assignment as a fix for automation gaps",
     "impact": {
      "acc": 30,
      "ops": -15
     },
     "consequence": "Maya works today, and you now carry a manual exception forever."
    }
   ],
   "hints": [
    "Three of the four results look correct. What's different about Maya's row?",
    "Is the rule wrong, or is the data wrong?"
   ],
   "explanation": "<p>Dynamic groups are only as good as the attributes they read. Maya's blank Department, left over from Theo's hand-made account in Challenge 1, keeps her out. Set it and Entra re-evaluates her membership. Once the group license applies, remove Theo's direct assignment so her licensing is managed in one place.</p>",
   "simplification": "The validation table is simulated. In the admin center, Validate rules lets you test the rule against users you pick.",
   "sources": [
    "dynamic",
    "dynamicCreate"
   ]
  },
  "c2t": {
   "kind": "Transfer check",
   "type": "single",
   "title": "The laptop fleet",
   "objectives": [
    "1.2.2"
   ],
   "situation": "<p>Halcyon's device team wants a group containing every Windows laptop registered in Entra, kept up to date automatically, to target an Intune configuration policy.</p>",
   "prompt": "Which group design fits?",
   "options": [
    {
     "id": "a",
     "text": "Security group, Dynamic Device, rule <code>device.deviceOSType -eq \"Windows\"</code>",
     "correct": true,
     "feedback": "Device policies target devices, and Dynamic Device membership keeps the group current as laptops are added or retired."
    },
    {
     "id": "b",
     "text": "Microsoft 365 group, Dynamic Device",
     "feedback": "Microsoft 365 groups can contain only users, so device membership isn't available for them.",
     "misconception": "Microsoft 365 groups can hold devices"
    },
    {
     "id": "c",
     "text": "Security group, Dynamic User, rule <code>user.department -eq \"IT\"</code>",
     "feedback": "This collects people, not laptops. A user rule can't put devices into a group.",
     "misconception": "User rules can collect devices"
    },
    {
     "id": "d",
     "text": "Security group, Assigned",
     "feedback": "It would work, but someone must add every new laptop by hand and remove retired ones. The requirement asked for automatic.",
     "misconception": "Assigned membership meets an automatic requirement"
    }
   ],
   "hints": [
    "What kind of object is the policy aimed at?",
    "Only one group type can contain devices."
   ],
   "explanation": "<p>Security groups can contain users or devices, while Microsoft 365 groups contain only users. A device membership rule can reference only device attributes, so it can't, for example, select devices by their owner's department.</p>",
   "sources": [
    "dynamic"
   ]
  },
  "c3": {
   "kind": "Least Privilege Challenge",
   "type": "multi",
   "pick": 2,
   "title": "Priya wants the keys",
   "objectives": [
    "1.1.1",
    "1.2.2"
   ],
   "main": true,
   "story": "Priya again: <b>“BrightBoard's new approval feature is in pilot for six weeks, and I'll be adding and removing reviewers constantly. Can you just make me an admin so I stop sending you tickets?”</b>",
   "situation": "<p>Priya hand-picks pilot reviewers, and no attribute identifies them. She needs to manage the membership of <b>one</b> group, <b>Campaign Reviewers</b>, which is assigned to BrightBoard's pilot. Nothing else.</p>",
   "teach": "<p><b>Microsoft Entra roles</b> grant administrative permissions across the tenant, or across an administrative unit (a later mission covers those).</p><p><b>Group owners</b> manage one specific group, including its members, without holding any admin role.</p><p><b>Least privilege</b> means the smallest scope and fewest permissions that still meet the requirement.</p>",
   "prompt": "Which actions together meet the requirement with least privilege?",
   "options": [
    {
     "id": "a",
     "text": "Create Campaign Reviewers as a security group with <b>Assigned</b> membership",
     "correct": true,
     "feedback": "Hand-picked membership needs Assigned. A dynamic rule wouldn't let anyone add people manually.",
     "impact": {
      "ops": 5,
      "acc": 5
     }
    },
    {
     "id": "b",
     "text": "Make Priya an <b>owner</b> of Campaign Reviewers",
     "correct": true,
     "feedback": "Owners can manage that group's membership, and only that group's. No admin role required.",
     "impact": {
      "sec": 15,
      "ops": 15,
      "acc": 5
     },
     "consequence": "Priya manages her pilot without tickets, and her reach ends at one group."
    },
    {
     "id": "c",
     "text": "Assign Priya the <b>Groups Administrator</b> role",
     "feedback": "Groups Administrator can create and manage every group and group setting in the tenant. That's tenant-wide power for a one-group need.",
     "misconception": "Admin roles for single-resource tasks",
     "impact": {
      "sec": -25,
      "ops": 10
     },
     "consequence": "Priya can now edit every group in Halcyon, including ones that grant access to finance apps."
    },
    {
     "id": "d",
     "text": "Assign Priya the <b>User Administrator</b> role",
     "feedback": "Broader still: it manages users and groups across the tenant, including resetting passwords for non-admin users.",
     "misconception": "User Administrator is a scoped role",
     "impact": {
      "sec": -30,
      "ops": 10
     },
     "consequence": "A compromised Priya account could reset passwords across the company."
    },
    {
     "id": "e",
     "text": "Make the group dynamic with <code>user.jobTitle -eq \"Campaign Reviewer\"</code>",
     "feedback": "No attribute identifies pilot reviewers, and dynamic membership blocks the manual adds Priya needs.",
     "misconception": "Dynamic membership fits hand-picked groups",
     "impact": {
      "acc": -10
     },
     "consequence": "Nobody matches the rule, and Priya can't add anyone."
    },
    {
     "id": "f",
     "text": "Make Priya a <b>Global Administrator</b>, just for six weeks",
     "feedback": "That's the highest privilege in the tenant for a task an owner can do. Time-limited access to powerful roles is a real pattern (Privileged Identity Management, coming in the Governance missions), but it's still the wrong tool here.",
     "misconception": "Temporary access makes excessive privilege acceptable",
     "impact": {
      "sec": -45,
      "ops": 10
     },
     "consequence": "For six weeks, one phished password could take over the whole tenant."
    }
   ],
   "hints": [
    "Does Priya need power over every group at Halcyon, or over one?",
    "Every group has members and ______."
   ],
   "explanation": "<p>Ownership is delegation scoped to a single object. Priya manages Campaign Reviewers and nothing else, so if her account is compromised the damage stops at one pilot group.</p><p>Two good habits: add a second owner (for example an IT account) so the group isn't orphaned if Priya leaves, and plan to review or delete the group when the pilot ends. Access reviews automate that and arrive in the Governance missions. Tenant group settings also affect where owners can manage membership, such as the My Groups portal.</p>",
   "simplification": "Role descriptions are summarized. The permissions reference lists each role's exact actions.",
   "sources": [
    "selfService",
    "manageGroups",
    "roles",
    "byTask"
   ]
  },
  "c3t": {
   "kind": "Transfer check",
   "type": "single",
   "title": "The rule change",
   "objectives": [
    "1.2.2"
   ],
   "situation": "<p>Halcyon decides the reviewer list should simply be everyone whose Job title is “Campaign Manager”. An admin converts Campaign Reviewers to <b>Dynamic User</b> membership with that rule. Priya, still an owner, tries to add a contractor she trusts.</p>",
   "prompt": "What happens?",
   "options": [
    {
     "id": "a",
     "text": "She can't add him. With dynamic membership the rule decides who's in, so nobody can add members by hand",
     "correct": true,
     "feedback": "Owners manage an Assigned group's members, but a dynamic group's members come only from its rule."
    },
    {
     "id": "b",
     "text": "It works, because owners can always add members",
     "feedback": "Ownership doesn't override the membership type. Dynamic means rule-only.",
     "misconception": "Group owners can override dynamic membership"
    },
    {
     "id": "c",
     "text": "It works only if she also holds Groups Administrator",
     "feedback": "Admins can't add members to a dynamic group by hand either. They can only change the rule, or the attributes it reads.",
     "misconception": "Admin roles can bypass dynamic membership rules"
    },
    {
     "id": "d",
     "text": "He's added, then removed at the next rule evaluation",
     "feedback": "Manual adds aren't accepted at all, so there's nothing to remove later.",
     "misconception": "Dynamic groups accept temporary manual members"
    }
   ],
   "hints": [
    "Ownership and membership type are separate settings. Which one decides who's in?"
   ],
   "explanation": "<p>To include the contractor, either keep the group Assigned, or make the rule (or his attributes) match him. Be careful about editing attributes just to steer access, because that's the same lever an attacker would want.</p>",
   "sources": [
    "dynamic",
    "selfService"
   ]
  }
 }
};
