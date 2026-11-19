/* Domain 4: Plan and automate identity governance. Missions 17–20 + Boss 4 + Final Boss. Verified 2026-11-18. */
(function (C) {
  const I = C.items, M = C.missions;

  /* ---------------- Mission 17: Access Packages ---------------- */
  M.M17 = { id:"M17", domain:"D4", code:"Mission 17", title:"Access Packages", minutes:15,
    story:"Harborline's contractors need Teams, a SharePoint site and BrightBoard for 90 days at a time. Priya approves. You'd love for none of it to involve you.",
    goal:"Plan entitlements, build catalogs and access packages, manage requests, terms of use, connected organizations and external user lifecycle.",
    groups:[
      { n:1, title:"Plan the bundle", blurb:"Catalogs and the shape of an access package.", items:["m17-1","m17-2"] },
      { n:2, title:"The policy", blurb:"Who can request, who approves, and how long it lasts.", items:["m17-3","m17-6"] },
      { n:3, title:"Endings and fine print", blurb:"Terms of use, connected organizations and external lifecycle.", items:["m17-5","m17-4","m17-7"] } ],
    takeaways:[
      "<b>Entitlement management</b> bundles groups/Teams, apps and SharePoint sites into <b>access packages</b> inside <b>catalogs</b>, with policies for who can request, approval and expiration. It requires Microsoft Entra ID Governance (or P2).",
      "Delegate catalogs to business owners (catalog owners, access package managers) so IT isn't the bottleneck.",
      "<b>Connected organizations</b> (an Entra tenant or a domain) let external users request access. External user lifecycle settings can block and then remove guests whose last assignment ends.",
      "<b>Terms of use</b> are enforced through Conditional Access grant controls." ],
    next:"M18" };

  I["m17-1"] = { kind:"Scenario", type:"single", title:"Harborline's starter kit", obj:["4.1.1","4.1.3","4.1.7"], main:true,
    sit:"<p>Harborline contractors need the Harborline-Project team, the Projects SharePoint site and BrightBoard Viewer, for 90 days, with Priya's approval. They should request it themselves.</p>",
    teach:"<p><b>Plan entitlements</b> by asking: what resources belong together, who may ask, who approves, and when does access end? <b>Entitlement management</b> answers those with <b>access packages</b> (bundles of resource roles) and <b>policies</b> (request, approval and lifecycle rules).</p>",
    q:"Which design fits?",
    opts:[
      { id:"a", t:"An access package with all three resources, and a policy for Harborline as a connected organization: Priya approves, 90-day expiration", c:1, f:"Self-service, approved, time-boxed and bundled.", i:[15,20,20] },
      { id:"b", t:"Invite each contractor and add them to each resource manually", f:"No approval trail, and nobody removes access after 90 days.", i:[-15,10,-20] },
      { id:"c", t:"A dynamic group with companyName \"Harborline\"", f:"Guests' attributes aren't reliable, and there's no approval or expiry.", m:"Dynamic groups replace approval workflows", i:[-10,10,0] },
      { id:"d", t:"Cross-tenant synchronization with Harborline", f:"Harborline is a separate company, not part of Halcyon's multitenant organization.", i:[-5,0,-10] } ],
    hints:["Bundle, request, approve, expire."],
    exp:"<p>Access packages make access requestable through the <b>My Access</b> portal, apply approvals and expirations consistently, and can include access reviews. For external users, the policy can target specific connected organizations.</p>",
    src:["emOverview","emPackage"] };

  I["m17-2"] = { kind:"Least Privilege Challenge", type:"single", title:"Marketing runs its own shop", obj:["4.1.2"], main:true,
    sit:"<p>Marketing wants to manage access packages for its own resources (its Teams, sites and BrightBoard) without asking IT each time, and without touching other departments' packages.</p>",
    q:"What do you set up?",
    opts:[
      { id:"a", t:"A <b>Marketing</b> catalog containing Marketing's resources, with Priya as catalog owner", c:1, f:"Catalogs are the delegation boundary for entitlement management.", i:[10,10,20] },
      { id:"b", t:"Make Priya an Identity Governance Administrator", f:"Tenant-wide governance rights for a department-sized need.", i:[-15,10,10] },
      { id:"c", t:"Put everything in the General catalog and make Priya its owner", f:"She'd control everyone's packages.", i:[-15,10,5] },
      { id:"d", t:"Make Priya an owner of each Marketing group", f:"Lets her manage group membership, but not access packages.", i:[0,0,-5] } ],
    hints:["Look for the container entitlement management delegates."],
    exp:"<p>Catalog owners manage a catalog's resources and packages; access package managers can manage packages within it. Adding a resource to a catalog requires being an owner of that resource (or an admin).</p>",
    src:["emCatalog"] };

  I["m17-3"] = { kind:"Policy Workshop", type:"config", title:"The request policy", obj:["4.1.3","4.1.4","4.1.7"], main:true,
    sit:"<p>Build the access package policy for Harborline contractors.</p>",
    fields:[
      { id:"who", label:"Users who can request access", options:[
        { id:"internal", text:"For users in your directory", feedback:"Harborline contractors aren't in the directory yet.", impact:{acc:-20} },
        { id:"connected", text:"For users not in your directory › Specific connected organizations: Harborline", correct:true, feedback:"Lets Harborline users request; their guest account is created on approval.", impact:{acc:15, sec:5} },
        { id:"anyone", text:"For users not in your directory › All users (any external user)", feedback:"Anyone with any email could request.", impact:{sec:-20} } ]},
      { id:"approval", label:"Require approval", options:[
        { id:"priya", text:"Yes: single stage, approver Priya Raman, with alternate approver after 3 days", correct:true, feedback:"Accountable approval with a fallback.", impact:{sec:10, acc:5} },
        { id:"none", text:"No approval", feedback:"Any Harborline user would get in automatically.", impact:{sec:-15} } ]},
      { id:"expire", label:"Lifecycle › Access package assignments expire", options:[
        { id:"90", text:"Number of days: 90", correct:true, feedback:"Matches the requirement.", impact:{sec:10, ops:10} },
        { id:"never", text:"Never", feedback:"Contractors keep access forever.", misconception:"Access packages expire by default", impact:{sec:-20} } ]} ],
    hints:["Each requirement maps to one policy section."],
    exp:"<p>Policies define requestor scope, approval stages (with optional alternate approvers and escalation), requestor information, and lifecycle (expiration, access reviews). An access package can have several policies for different populations.</p>",
    src:["emPackage","emRequests"] };

  I["m17-6"] = { kind:"Identity Detective", type:"single", title:"Stuck in pending", obj:["4.1.4"], main:true,
    sit:"<p>A Harborline contractor's request has been <b>Pending approval</b> for five days. Priya is on leave, and the policy has a single approver and no alternate.</p>",
    q:"What's the best fix, now and for the future?",
    opts:[
      { id:"a", t:"Have an admin or access package manager handle the pending request, then add alternate approvers (or a backup approver) to the policy", c:1, f:"Unblocks today and prevents a repeat.", i:[0,15,10] },
      { id:"b", t:"Remove approval from the policy", f:"Fixes the queue by removing the control.", i:[-15,10,5] },
      { id:"c", t:"Ask the contractor to request again", f:"The new request would wait for the same absent approver.", i:[0,0,-10] },
      { id:"d", t:"Add the contractor to the resources directly", f:"Bypasses the package, with no expiry or record.", i:[-10,10,-5] } ],
    hints:["Single points of failure apply to people too."],
    exp:"<p>Monitor requests in the access package's Requests view. Policies support multiple approvers, multi-stage approval and alternate approvers when the first doesn't respond within a set number of days.</p>",
    src:["emRequests"] };

  I["m17-5"] = { kind:"Scenario", type:"single", title:"Sign the NDA first", obj:["4.1.5"], main:true,
    sit:"<p>Contractors must accept Halcyon's NDA (a PDF) before using BrightBoard, and accept it again every 180 days.</p>",
    q:"What do you configure?",
    opts:[
      { id:"a", t:"A Terms of use with the NDA PDF and a 180-day re-acceptance, required by a Conditional Access policy for guests accessing BrightBoard", c:1, f:"Conditional Access enforces acceptance before access.", i:[10,10,10] },
      { id:"b", t:"Email the NDA and track replies", f:"No enforcement, no audit trail in Entra.", i:[-5,5,-15] },
      { id:"c", t:"Company branding sign-in text with the NDA", f:"Shows text, but doesn't record acceptance.", i:[0,0,-5] },
      { id:"d", t:"A custom security attribute NDA=true", f:"Nothing enforces it.", i:[0,0,-10] } ],
    hints:["It's a grant control."],
    exp:"<p>Terms of use support PDFs per language, requiring users to expand the document, per-device consent, expiration schedules and re-acceptance. They're enforced with the Conditional Access grant control <b>Terms of use</b>, and acceptance is reported in Entra.</p>",
    src:["tou"] };

  I["m17-4"] = { kind:"Scenario", type:"single", title:"When the contract ends", obj:["4.1.6"], main:true,
    sit:"<p>When a Harborline guest's last access package assignment expires, Halcyon wants the account blocked from signing in right away and deleted 30 days later.</p>",
    q:"Where is this configured?",
    opts:[
      { id:"a", t:"Entitlement management settings › Manage the lifecycle of external users: block sign-in, then remove after 30 days", c:1, f:"Applies to external users brought in by entitlement management.", i:[15,0,15] },
      { id:"b", t:"A monthly script deleting all guests", f:"Removes guests who still need access.", i:[5,-20,-10] },
      { id:"c", t:"External collaboration settings", f:"Controls invitations, not entitlement-driven lifecycle.", i:[0,0,-5] },
      { id:"d", t:"An access review with no reviewers", f:"Reviews need reviewers, and this is about expiry, not attestation.", i:[0,0,-5] } ],
    hints:["The setting lives with entitlement management."],
    exp:"<p>For external users who were added through an access package request, entitlement management can block sign-in when they lose their last assignment and remove them after a set number of days. Guests invited outside entitlement management aren't covered; use access reviews for those.</p>",
    src:["emExternal"] };

  I["m17-7"] = { kind:"Transfer check", type:"single", title:"What's a connected organization?", obj:["4.1.7"],
    sit:"<p>A new partner, Pellucid Analytics, doesn't use Microsoft Entra. You want Pellucid's people to be able to request an access package.</p>",
    q:"Can Pellucid be a connected organization?",
    opts:[
      { id:"a", t:"Yes. A connected organization can be a Microsoft Entra tenant or a domain, and users authenticate with whatever method is configured for them", c:1, f:"Domains work too, for example with SAML/WS-Fed federation or email one-time passcode." },
      { id:"b", t:"No, it must be a Microsoft Entra tenant", f:"Domain-based connected organizations exist.", m:"Connected organizations must be Entra tenants" },
      { id:"c", t:"Only after cross-tenant sync is configured", f:"Unrelated." },
      { id:"d", t:"Only if Pellucid buys Microsoft Entra ID Governance", f:"Licensing is Halcyon's concern, not the partner's." } ],
    hints:["Think about domains."],
    exp:"<p>Connected organizations identify an external directory or domain and its sponsors. Policies can then allow users from specific connected organizations to request access.</p>",
    src:["emConnected"] };

  /* ---------------- Mission 18: Review Season ---------------- */
  M.M18 = { id:"M18", domain:"D4", code:"Mission 18", title:"Review Season", minutes:13,
    story:"The auditors want proof that someone checks who still has access. Halcyon's last review was… “ongoing” since 2023.",
    goal:"Plan, create and monitor access reviews, and respond to them manually.",
    groups:[
      { n:1, title:"Plan and build", blurb:"Scope, reviewers and automation.", items:["m18-1","m18-2"] },
      { n:2, title:"Keep it moving", blurb:"Monitor progress and use recommendations.", items:["m18-3","m18-4"] },
      { n:3, title:"Reviewers' view", blurb:"Respond manually and review privileged roles.", items:["m18-5","m18-6"] } ],
    takeaways:[
      "Access reviews cover group memberships, app assignments, access packages and privileged roles (through PIM), with reviewers such as owners, managers, self or named users.",
      "Settings decide auto-apply, what happens if reviewers don't respond, and whether recommendations (such as inactivity) are shown.",
      "Monitor progress, send reminders, and stop or extend reviews; reviewers respond in My Access.",
      "Access reviews require Microsoft Entra ID Governance (or P2)." ],
    next:"M19" };

  I["m18-1"] = { kind:"Policy Workshop", type:"config", title:"Guest review", obj:["4.2.1","4.2.2"], main:true,
    sit:"<p>Requirements: every quarter, owners of Microsoft 365 groups confirm whether their <b>guests</b> still need access. Denied guests are removed automatically, and guests nobody reviews are also removed.</p>",
    teach:"<p><b>Plan access reviews</b> around what you review (groups, apps, access packages, roles), who reviews, how often, and what happens to the results. Automation (auto-apply, default decision when reviewers don't respond) is what makes reviews actually remove access.</p>",
    fields:[
      { id:"scope", label:"Review scope", options:[
        { id:"guests", text:"All Microsoft 365 groups with guest users › Guest users only", correct:true, feedback:"Exactly the population in scope.", impact:{ops:10} },
        { id:"all", text:"All users in all groups", feedback:"Reviewers drown in employees they didn't need to review.", impact:{ops:-15} } ]},
      { id:"reviewers", label:"Reviewers", options:[
        { id:"owners", text:"Group owner(s)", correct:true, feedback:"Owners know who their guests are.", impact:{sec:5} },
        { id:"self", text:"Users review their own access", feedback:"Guests rarely remove themselves.", impact:{sec:-10} } ]},
      { id:"apply", label:"Upon completion › Auto apply results to resource", options:[
        { id:"yes", text:"Enabled", correct:true, feedback:"Denied guests are removed without manual follow-up.", impact:{ops:10} },
        { id:"no", text:"Disabled", feedback:"Someone would have to apply results by hand.", impact:{ops:-10} } ]},
      { id:"noresp", label:"If reviewers don't respond", options:[
        { id:"remove", text:"Remove access", correct:true, feedback:"Matches the deny-by-default requirement.", impact:{sec:10} },
        { id:"nochange", text:"No change", feedback:"Unreviewed guests keep access.", misconception:"Unreviewed access should be kept by default", impact:{sec:-10} } ]} ],
    hints:["Every requirement maps to one setting.","Read “guests nobody reviews are also removed” carefully."],
    exp:"<p>Use the guest-focused scope with owners as reviewers, recur quarterly, auto-apply results, and set the no-response default to Remove access. Configure fallback reviewers for groups without owners.</p>",
    src:["accessReviews","arCreate"] };

  I["m18-2"] = { kind:"Transfer check", type:"single", title:"Who knows best?", obj:["4.2.2"],
    sit:"<p>Halcyon wants a review of Ledgerly app assignments. The app owner doesn't know most users, but their managers do.</p>",
    q:"Which reviewer option fits?",
    opts:[
      { id:"a", t:"Managers of users, with a fallback reviewer for users without a manager", c:1, f:"Managers know whether their reports still need the app." },
      { id:"b", t:"The app owner only", f:"They don't know most users." },
      { id:"c", t:"Users review themselves", f:"Self-review rarely removes access." },
      { id:"d", t:"Global Administrators", f:"They know even less, and it's a big job." } ],
    hints:["Pick the reviewer with the most context."],
    exp:"<p>Manager-based reviews rely on the manager attribute, so keep it accurate and set fallback reviewers.</p>",
    src:["arCreate"] };

  I["m18-3"] = { kind:"Identity Detective", type:"single", title:"Two days left", obj:["4.2.3"], main:true,
    sit:"<p>A quarterly guest review ends in two days.</p>",
    ev:[ { kind:"table", title:"Access reviews › Q4 Guests › Results (simulated)", columns:["Status","Count"], rows:[["Approved","212"],["Denied","48"],["Not reviewed","173"]] } ],
    q:"What's the most useful action now?",
    opts:[
      { id:"a", t:"Send reminders to reviewers who haven't finished, and consider extending the review if needed", c:1, f:"Nudges the stragglers; results stay accurate.", i:[0,10,10] },
      { id:"b", t:"Stop the review now", f:"173 decisions would fall to the default.", i:[-5,-10,0] },
      { id:"c", t:"Approve all not-reviewed items yourself", f:"Rubber-stamping defeats the review.", m:"Admins should bulk-approve unreviewed items", i:[-15,5,5] },
      { id:"d", t:"Delete the review and start over", f:"Loses all completed decisions.", i:[0,0,-20] } ],
    hints:["You can nudge the reviewers."],
    exp:"<p>The review's Results and Overview pages show progress per reviewer. You can send reminders, stop a review early, reset decisions and, for some reviews, extend the duration.</p>",
    src:["arManage"] };

  I["m18-4"] = { kind:"Scenario", type:"single", title:"Hints for reviewers", obj:["4.2.4","4.2.2"], main:true,
    sit:"<p>Reviewers don't know which guests are still active. You want the review to suggest denying guests who haven't signed in recently.</p>",
    q:"Which setting helps?",
    opts:[
      { id:"a", t:"Enable <b>reviewer decision helpers</b> (recommendations based on inactivity, such as no sign-in in the last 30 days)", c:1, f:"Reviewers see Approve/Deny recommendations based on activity.", i:[5,5,15] },
      { id:"b", t:"Require justification for every decision", f:"Useful for audit, but doesn't tell reviewers who's inactive.", i:[0,0,-5] },
      { id:"c", t:"Lower the review frequency", f:"Fewer reviews, same uncertainty.", i:[-5,0,0] },
      { id:"d", t:"Add more reviewers", f:"More people guessing.", i:[0,0,-5] } ],
    hints:["Let the review use sign-in data."],
    exp:"<p>Recommendations use sign-in activity (inactive users, typically 30 days) and, for some reviews, user-to-group affiliation. If reviewers don't respond, you can also set the default to “Take recommendations”.</p>",
    src:["arCreate"] };

  I["m18-5"] = { kind:"Transfer check", type:"single", title:"Your turn to review", obj:["4.2.4"],
    sit:"<p>Priya receives an email: she's a reviewer for the Marketing guests review.</p>",
    q:"Where does she record her decisions?",
    opts:[
      { id:"a", t:"In the My Access portal (or the review link in the email): Approve or Deny each guest, with a reason", c:1, f:"Reviewers act there; admins see results in the admin center." },
      { id:"b", t:"In the Microsoft Entra admin center, under Users", f:"Reviewers don't need admin access." },
      { id:"c", t:"By replying to the email", f:"Replies don't record decisions." },
      { id:"d", t:"In Microsoft Defender for Cloud Apps", f:"Unrelated." } ],
    hints:["The same portal users use to request access."],
    exp:"<p>Reviewers can approve, deny or say “don't know”, and can accept recommendations in bulk. Admins can also respond manually or reset decisions while a review is active.</p>",
    src:["arPerform"] };

  I["m18-6"] = { kind:"Scenario", type:"single", title:"Reviewing the admins", obj:["4.2.2","4.3.1"], main:true,
    sit:"<p>Auditors want a quarterly attestation of who holds Global Administrator and Privileged Role Administrator, including eligible assignments.</p>",
    q:"How do you run it?",
    opts:[
      { id:"a", t:"Create an access review for Microsoft Entra roles in Privileged Identity Management, covering eligible and active assignments", c:1, f:"PIM access reviews are built for privileged role attestation.", i:[15,0,15] },
      { id:"b", t:"Export role members to a spreadsheet each quarter", f:"Manual, with no reviewer accountability.", i:[0,0,-15] },
      { id:"c", t:"A guest access review", f:"Wrong scope.", i:[0,0,-5] },
      { id:"d", t:"Defender for Cloud Apps activity policy", f:"Monitors activity; doesn't attest assignments.", i:[0,0,-5] } ],
    hints:["Privileged roles live in PIM."],
    exp:"<p>PIM supports access reviews of Microsoft Entra roles and Azure resource roles, with reviewers such as managers, self or named users, and auto-removal of denied assignments.</p>",
    src:["pimReviews","pim"] };

  /* ---------------- Mission 19: Just in Time ---------------- */
  M.M19 = { id:"M19", domain:"D4", code:"Mission 19", title:"Just in Time", minutes:15,
    story:"Halcyon has 14 permanent Global Administrators. Nadia's face says that's 12 too many, and 14 too many permanent ones.",
    goal:"Use PIM for Entra roles, Azure resources and groups; handle approvals; analyze history; and manage emergency access accounts.",
    groups:[
      { n:1, title:"Eligible, not permanent", blurb:"PIM role settings and assignment types.", items:["m19-1","m19-2"] },
      { n:2, title:"Beyond directory roles", blurb:"PIM for Azure resources and PIM for Groups.", items:["m19-3","m19-4"] },
      { n:3, title:"Approvals, audits and the glass", blurb:"Activation flow, history and emergency accounts.", items:["m19-5","m19-6","m19-7"] } ],
    takeaways:[
      "<b>Eligible</b> assignments must be activated (with MFA or authentication context, justification and optional approval) for a limited time; <b>active</b> assignments are always on.",
      "PIM covers Microsoft Entra roles, Azure resource roles (management group to resource) and <b>PIM for Groups</b> (just-in-time membership or ownership).",
      "Use PIM audit history and reports to answer “who had what, when”.",
      "Keep at least two cloud-only <b>emergency access accounts</b> with permanent Global Administrator, phishing-resistant credentials, Conditional Access exclusions and sign-in alerts." ],
    next:"M20" };

  I["m19-1"] = { kind:"Policy Workshop", type:"config", title:"Global Administrator settings", obj:["4.3.1"], main:true,
    sit:"<p>Requirements for the Global Administrator role in PIM: activation lasts at most 2 hours, requires phishing-resistant authentication, a justification, and approval from the security team.</p>",
    teach:"<p><b>Privileged Identity Management (PIM)</b> provides just-in-time privileged access. <b>Role settings</b> define activation rules (maximum duration, MFA or authentication context, justification, ticket info, approval) and assignment rules (whether eligible or active assignments may be permanent).</p>",
    fields:[
      { id:"duration", label:"Activation maximum duration (hours)", options:[
        { id:"2", text:"2", correct:true, feedback:"Short windows reduce exposure.", impact:{sec:10} },
        { id:"24", text:"24", feedback:"Longer than required.", impact:{sec:-10} } ]},
      { id:"auth", label:"On activation, require", options:[
        { id:"ctx", text:"Microsoft Entra Conditional Access authentication context (mapped to a phishing-resistant policy)", correct:true, feedback:"Lets activation require a specific authentication strength.", impact:{sec:15} },
        { id:"none", text:"None", feedback:"Activation with no step-up.", impact:{sec:-20} } ]},
      { id:"approval", label:"Require approval to activate", options:[
        { id:"yes", text:"Yes: approvers = Security-Team group", correct:true, feedback:"Second pair of eyes for the most powerful role.", impact:{sec:10} },
        { id:"no", text:"No", feedback:"Requirement asks for approval.", impact:{sec:-10} } ]} ],
    hints:["Phishing-resistant on activation means linking to a Conditional Access policy."],
    exp:"<p>PIM activation can require Azure MFA or a Conditional Access authentication context. The context is how you require a specific authentication strength, such as phishing-resistant MFA, at activation time.</p>",
    src:["pimSettings","caTargets"] };

  I["m19-2"] = { kind:"Scenario", type:"single", title:"Eligible vs active", obj:["4.3.1"], main:true,
    sit:"<p>Ahmed needs to be able to become Exchange Administrator a few times a month when incidents happen. Nobody wants him to hold it all the time.</p>",
    q:"Which assignment fits?",
    opts:[
      { id:"a", t:"An <b>eligible</b> assignment in PIM; he activates for a limited time when needed", c:1, f:"Privilege exists only when used.", i:[15,10,5] },
      { id:"b", t:"A permanent <b>active</b> assignment", f:"Standing privilege, all the time.", m:"Active assignments are just-in-time", i:[-15,10,5] },
      { id:"c", t:"Global Administrator, eligible", f:"Wrong role, far too broad.", i:[-20,10,0] },
      { id:"d", t:"Ask a Global Administrator to do it each time", f:"Bottleneck, and the GA does more than needed.", i:[0,-10,-10] } ],
    hints:["Just-in-time means not standing."],
    exp:"<p>Eligible assignments can also be time-bound (for example, eligible for six months), which forces periodic renewal. Combine with access reviews for attestation.</p>",
    src:["pim"] };

  I["m19-3"] = { kind:"Scenario", type:"single", title:"Subscription Owner, sometimes", obj:["4.3.2"], main:true,
    sit:"<p>Cloud engineers occasionally need <b>Owner</b> on the production subscription for maintenance windows.</p>",
    q:"What should you configure?",
    opts:[
      { id:"a", t:"PIM for Azure resources: an eligible Owner assignment at the subscription scope, with approval and a short activation window", c:1, f:"Just-in-time Azure RBAC.", i:[15,10,10] },
      { id:"b", t:"A Microsoft Entra role assignment of Global Administrator", f:"Entra roles don't grant Azure resource access by default.", m:"Global Administrator grants subscription Owner", i:[-20,0,0] },
      { id:"c", t:"Permanent Owner on the management group", f:"Standing and broader.", i:[-20,10,5] },
      { id:"d", t:"An access package with Owner", f:"Access packages can't assign Azure resource roles like subscription Owner.", i:[0,-10,-5] } ],
    hints:["PIM manages more than directory roles."],
    exp:"<p>PIM for Azure resources manages Azure RBAC roles at management group, subscription, resource group and resource scopes, with the same eligible/active model, settings and approvals.</p>",
    src:["pimAzure"] };

  I["m19-4"] = { kind:"Scenario", type:"single", title:"Just-in-time group membership", obj:["4.3.3"], main:true,
    sit:"<p>The security group <b>Prod-DB-Admins</b> grants database admin access in Azure and in an internal app. Members should join only for the duration of a task.</p>",
    q:"What do you use?",
    opts:[
      { id:"a", t:"PIM for Groups: make engineers eligible members of Prod-DB-Admins", c:1, f:"Membership is activated just in time, so all access granted through the group follows.", i:[15,10,10] },
      { id:"b", t:"A dynamic group rule", f:"Rule-based membership can't be time-limited per task.", i:[0,0,-10] },
      { id:"c", t:"Make engineers group owners", f:"Owners manage membership, which is more power.", i:[-10,0,0] },
      { id:"d", t:"Access reviews weekly", f:"Reviews remove access after the fact; they aren't just-in-time.", i:[0,0,-10] } ],
    hints:["PIM can manage groups too."],
    exp:"<p>PIM for Groups supports eligible and time-bound membership and ownership of security groups and Microsoft 365 groups, with activation settings like those for roles.</p>",
    src:["pimGroups"] };

  I["m19-5"] = { kind:"Sequencing", type:"order", title:"An approved activation", obj:["4.3.4"], main:true,
    sit:"<p>Ahmed activates his eligible Exchange Administrator role, which requires MFA, a justification and approval.</p>",
    q:"Put the activation flow in order.",
    steps:[
      { id:"s1", t:"Ahmed opens PIM › My roles and selects Activate on Exchange Administrator", w:"Activation starts from the eligible assignment." },
      { id:"s2", t:"He completes the required MFA", w:"PIM enforces the role's activation authentication requirement." },
      { id:"s3", t:"He enters a justification and duration, and submits", w:"The request is created with his reason." },
      { id:"s4", t:"Approvers are notified and one approves in PIM › Approve requests", w:"Approval is required before activation." },
      { id:"s5", t:"The role becomes active for the approved duration, then expires automatically", w:"No standing privilege afterwards." } ],
    start:["s4","s1","s5","s3","s2"],
    impact:{ correct:{sec:10, ops:10}, wrong:{acc:-5} },
    hints:["Approvers can't approve a request that doesn't exist yet."],
    exp:"<p>Approvers can approve or deny with a justification. Requests can be canceled before approval. All of it lands in PIM's audit history.</p>",
    src:["pimApprove"] };

  I["m19-6"] = { kind:"Transfer check", type:"single", title:"Who was Global Admin?", obj:["4.3.5"],
    sit:"<p>An auditor asks who activated Global Administrator last month, when, and with what justification.</p>",
    q:"Where's the answer?",
    opts:[
      { id:"a", t:"PIM audit history for Microsoft Entra roles (resource audit), filtered to Global Administrator", c:1, f:"Records activations, assignments and approvals with justifications." },
      { id:"b", t:"The sign-in logs", f:"Show sign-ins, not role activations." },
      { id:"c", t:"Identity Secure Score", f:"A posture score, not history." },
      { id:"d", t:"The Global Administrator's mailbox", f:"No." } ],
    hints:["PIM keeps its own history."],
    exp:"<p>PIM's audit history shows role assignments, activations and approval activity, and is also available in the Entra audit logs (with longer retention if you route logs to Log Analytics).</p>",
    src:["pimAudit"] };

  I["m19-7"] = { kind:"Policy triage", type:"multi", pick:2, title:"Break glass", obj:["4.3.6"], main:true,
    sit:"<p>Halcyon is rebuilding its emergency access (break-glass) accounts.</p>",
    q:"Which practices match Microsoft's current guidance?",
    opts:[
      { id:"a", t:"At least two cloud-only accounts on the *.onmicrosoft.com domain with permanent Global Administrator", c:1, f:"Avoids dependency on federation, sync or a custom domain.", i:[10,10,0] },
      { id:"b", t:"Phishing-resistant credentials (such as FIDO2 security keys), plus alerts on every sign-in", c:1, f:"Mandatory MFA applies to them, and their use should never go unnoticed.", i:[15,0,0] },
      { id:"c", t:"Synchronize them from on-premises AD so they're always in sync", f:"An on-prem outage would take them down too.", m:"Emergency accounts should be synced", i:[-15,-10,0] },
      { id:"d", t:"Exempt them from MFA entirely", f:"They're no longer exempt from mandatory MFA for admin portals.", m:"Emergency accounts are exempt from MFA", i:[-20,0,0] } ],
    hints:["Independent of on-prem, and protected but excluded from policies that could lock them out."],
    exp:"<p>Emergency accounts must work when everything else fails: cloud-only, not tied to one person, excluded from Conditional Access policies that could block them, protected with phishing-resistant methods with different dependencies than normal admin sign-in, monitored, and tested regularly.</p>",
    src:["emergency","phishResistant"] };

  /* ---------------- Mission 20: Audit Trail ---------------- */
  M.M20 = { id:"M20", domain:"D4", code:"Mission 20", title:"Audit Trail", minutes:14,
    story:"Someone changed a Conditional Access policy last Tuesday, a SaaS app stopped provisioning, and the CISO wants a year of sign-in history. Logs to the rescue.",
    goal:"Use the right logs, route them to the right destinations, query with KQL, use workbooks and improve Identity Secure Score.",
    groups:[
      { n:1, title:"Which log?", blurb:"Sign-in, audit and provisioning logs.", items:["m20-1","m20-2"] },
      { n:2, title:"Keep and query", blurb:"Diagnostic settings and KQL.", items:["m20-3","m20-4","m20-7"] },
      { n:3, title:"See the big picture", blurb:"Workbooks and Identity Secure Score.", items:["m20-5","m20-6"] } ],
    takeaways:[
      "<b>Sign-in logs</b>: who signed in, how, and policy results. <b>Audit logs</b>: who changed what. <b>Provisioning logs</b>: what the provisioning service did.",
      "Built-in retention is short (7 days on Free, 30 days with P1/P2). Use <b>diagnostic settings</b> to send logs to Log Analytics (KQL, workbooks, alerts), a storage account (archive) or Event Hubs (SIEM streaming).",
      "In <code>SigninLogs</code>, <code>ResultType</code> is a string; \"0\" means success.",
      "<b>Identity Secure Score</b> lists improvement actions; update statuses such as resolved through a third party or risk accepted." ],
    next:"B4" };

  I["m20-1"] = { kind:"Identity Detective", type:"single", title:"Who changed the policy?", obj:["4.4.1"], main:true,
    sit:"<p>CA05 was switched from On to Report-only last Tuesday. Nobody admits to it.</p>",
    teach:"<p>Microsoft Entra activity logs: <b>sign-in logs</b> (interactive, non-interactive, service principal and managed identity sign-ins), <b>audit logs</b> (changes to directory objects and settings), and <b>provisioning logs</b> (activity by the provisioning service).</p>",
    q:"Where do you look?",
    opts:[
      { id:"a", t:"Audit logs, filtered to the Conditional Access service and the activity “Update conditional access policy”", c:1, f:"Audit logs record who changed what, when.", i:[5,0,15] },
      { id:"b", t:"Sign-in logs", f:"Show sign-in events, not configuration changes.", m:"Sign-in logs record configuration changes", i:[0,0,-5] },
      { id:"c", t:"Provisioning logs", f:"Those cover the provisioning service.", i:[0,0,-5] },
      { id:"d", t:"Identity Secure Score history", f:"Posture over time, not who changed a policy.", i:[0,0,-5] } ],
    hints:["A change, not a sign-in."],
    exp:"<p>Audit log entries show the initiator (user or app), target, modified properties and time.</p>",
    src:["auditLogs","signinLogs"] };

  I["m20-2"] = { kind:"Transfer check", type:"single", title:"Provisioning went quiet", obj:["4.4.1"],
    sit:"<p>New hires stopped appearing in BrightBoard yesterday. Its SCIM provisioning is configured in Entra.</p>",
    q:"Which log shows what happened to each user?",
    opts:[
      { id:"a", t:"Provisioning logs", c:1, f:"Shows each create, update and disable attempt and its result." },
      { id:"b", t:"Audit logs only", f:"Show configuration changes, not per-user provisioning results." },
      { id:"c", t:"Sign-in logs", f:"Unrelated to provisioning." },
      { id:"d", t:"Connect Health", f:"For on-prem sync infrastructure, not SaaS provisioning." } ],
    hints:["The log is named after the service."],
    exp:"<p>Provisioning logs include the action, status, error details and steps for each object, which is ideal for troubleshooting attribute mapping or SCIM errors.</p>",
    src:["provisioningLogs"] };

  I["m20-3"] = { kind:"Policy Workshop", type:"config", title:"Route the logs", obj:["4.4.2"], main:true,
    sit:"<p>Three requirements for sign-in and audit logs: (1) query them with KQL and workbooks; (2) archive them cheaply for two years; (3) stream them to a third-party SIEM in near real time.</p>",
    teach:"<p><b>Diagnostic settings</b> send Microsoft Entra logs to <b>Log Analytics workspaces</b> (query, workbooks, alerts), <b>storage accounts</b> (low-cost archive) and <b>Event Hubs</b> (streaming to SIEMs and other tools). One diagnostic setting can send to several destinations.</p>",
    fields:[
      { id:"r1", label:"Requirement 1: KQL and workbooks", options:[
        { id:"la", text:"Log Analytics workspace", correct:true, feedback:"Where KQL and workbooks run.", impact:{ops:10} },
        { id:"st", text:"Storage account", feedback:"Archive, not interactive query.", impact:{ops:-10} },
        { id:"eh", text:"Event Hubs", feedback:"A stream, not a query engine.", impact:{ops:-10} } ]},
      { id:"r2", label:"Requirement 2: cheap two-year archive", options:[
        { id:"la", text:"Log Analytics workspace", feedback:"Works, but costs more for long retention.", impact:{ops:-5} },
        { id:"st", text:"Storage account", correct:true, feedback:"Low-cost long-term retention.", impact:{ops:10} },
        { id:"eh", text:"Event Hubs", feedback:"Doesn't retain data long-term.", impact:{ops:-10} } ]},
      { id:"r3", label:"Requirement 3: stream to a third-party SIEM", options:[
        { id:"la", text:"Log Analytics workspace", feedback:"Not a streaming integration for third-party SIEMs.", impact:{ops:-5} },
        { id:"st", text:"Storage account", feedback:"Batch files, not near-real-time streaming.", impact:{ops:-5} },
        { id:"eh", text:"Event Hubs", correct:true, feedback:"Designed for streaming to external tools.", impact:{ops:10} } ]} ],
    hints:["Query, archive, stream: one destination each."],
    exp:"<p>Configure diagnostic settings under Monitoring & health › Diagnostic settings, selecting log categories (such as AuditLogs, SignInLogs, NonInteractiveUserSignInLogs, ServicePrincipalSignInLogs, ProvisioningLogs) and destinations.</p>",
    src:["diagSettings"] };

  I["m20-4"] = { kind:"Scenario", type:"single", title:"Failed sign-ins by user", obj:["4.4.3"], main:true,
    sit:"<p>Sign-in logs flow to Log Analytics. You want the number of <b>failed</b> sign-ins per user in the last 24 hours.</p>",
    q:"Which KQL query is correct?",
    opts:[
      { id:"a", t:"<code>SigninLogs | where TimeGenerated > ago(1d) | where ResultType != \"0\" | summarize Failures = count() by UserPrincipalName</code>", c:1, f:"ResultType is a string, and \"0\" is success.", i:[0,0,15] },
      { id:"b", t:"<code>AuditLogs | where TimeGenerated > ago(1d) | summarize count() by UserPrincipalName</code>", f:"Wrong table: AuditLogs holds changes, not sign-ins.", m:"AuditLogs contains sign-in events", i:[0,0,-5] },
      { id:"c", t:"<code>SigninLogs | where ResultType == \"0\" | summarize count() by UserPrincipalName</code>", f:"Counts successes, with no time filter.", i:[0,0,-5] },
      { id:"d", t:"<code>SigninLogs | where TimeGenerated > ago(1d) | project UserPrincipalName, ResultType</code>", f:"Lists rows, doesn't count failures per user.", i:[0,0,-5] } ],
    hints:["Right table, time filter, failure condition, aggregation."],
    exp:"<p>Common Entra tables include <code>SigninLogs</code>, <code>AADNonInteractiveUserSignInLogs</code>, <code>AADServicePrincipalSignInLogs</code> and <code>AuditLogs</code>. Use them for hunting, workbooks and alert rules.</p>",
    src:["logAnalytics"] };

  I["m20-7"] = { kind:"Transfer check", type:"single", title:"A year of history", obj:["4.4.1","4.4.2"],
    sit:"<p>The CISO wants sign-in logs from 11 months ago. Halcyon has Microsoft Entra ID P2 and no diagnostic settings.</p>",
    q:"What's true?",
    opts:[
      { id:"a", t:"Those logs are gone: built-in retention is 30 days with P1/P2. Set up diagnostic settings now to keep future logs", c:1, f:"Retention beyond 30 days needs routing to your own destination." },
      { id:"b", t:"P2 keeps sign-in logs for two years", f:"P1/P2 retention for sign-in and audit logs is 30 days.", m:"Premium licenses retain logs for years" },
      { id:"c", t:"Open a support case to restore them", f:"Microsoft doesn't restore expired activity logs." },
      { id:"d", t:"Export them from Identity Secure Score", f:"Secure Score doesn't hold sign-in logs." } ],
    hints:["Built-in retention is shorter than a year."],
    exp:"<p>Microsoft Entra retains activity reports for 7 days (Free) or 30 days (P1/P2). For longer, route logs with diagnostic settings to Log Analytics or storage.</p>",
    src:["retention","diagSettings"] };

  I["m20-5"] = { kind:"Scenario", type:"single", title:"The policy dashboard", obj:["4.4.4"], main:true,
    sit:"<p>Nadia wants a dashboard of how Conditional Access policies affect sign-ins over time (successes, failures, report-only results) without writing queries.</p>",
    q:"What do you use?",
    opts:[
      { id:"a", t:"The <b>Conditional Access insights and reporting</b> workbook, with sign-in logs sent to Log Analytics", c:1, f:"Prebuilt visuals of policy impact.", i:[0,5,15] },
      { id:"b", t:"The Users list in the admin center", f:"No policy analytics there.", i:[0,0,-5] },
      { id:"c", t:"Excel exports of sign-in logs", f:"Manual and stale.", i:[0,0,-10] },
      { id:"d", t:"Connect Health", f:"Covers on-prem sync and AD FS, not Conditional Access impact.", i:[0,0,-5] } ],
    hints:["Workbooks need a workspace behind them."],
    exp:"<p>Microsoft Entra workbooks (Conditional Access insights, sign-ins, authentication methods, and more) run on Log Analytics data, so configure diagnostic settings first.</p>",
    src:["workbooks","caInsights"] };

  I["m20-6"] = { kind:"Scenario", type:"single", title:"Secure Score says no", obj:["4.4.5"], main:true,
    sit:"<p>Identity Secure Score recommends an action that Halcyon already covers with a third-party tool. The recommendation keeps showing as To address.</p>",
    q:"What should you do?",
    opts:[
      { id:"a", t:"Update the improvement action's status to <b>Resolved through third party</b> (with notes)", c:1, f:"Records the decision and adjusts the score accordingly.", i:[0,0,10] },
      { id:"b", t:"Ignore it", f:"The score and reports stay misleading.", i:[0,0,-5] },
      { id:"c", t:"Disable the third-party tool and implement the Microsoft feature", f:"May be the right long-term call, but it's a separate decision.", i:[0,0,-10] },
      { id:"d", t:"Mark it Risk accepted", f:"Risk accepted means you chose not to address it, which isn't the case.", m:"Risk accepted and third-party resolution mean the same thing", i:[0,0,-5] } ],
    hints:["The status should reflect reality."],
    exp:"<p>Identity Secure Score measures alignment with Microsoft's identity recommendations. Use statuses (To address, Planned, Risk accepted, Resolved through third party, Resolved through alternate mitigation) to track decisions, and prioritize actions by score impact and effort.</p>",
    src:["secureScore"] };

  /* ---------------- Boss 4: The Audit ---------------- */
  M.B4 = { id:"B4", domain:"D4", boss:true, code:"Boss · Domain 4", title:"The Audit", minutes:15,
    story:"The external auditors arrive Monday with a list of questions. They're polite, thorough and allergic to “we think so”.",
    goal:"Answer governance questions with evidence, and fix the gaps you find.",
    groups:[
      { n:1, title:"Prove privileged access", blurb:"History, monitoring and emergency accounts.", items:["b4-1","b4-2"] },
      { n:2, title:"Prove access is reviewed", blurb:"Reviews and lifecycle for guests.", items:["b4-3","b4-4"] },
      { n:3, title:"Prove you can see", blurb:"Retention, queries and posture.", items:["b4-5","b4-6"] } ],
    takeaways:[
      "Auditors want evidence: PIM history, review results, retained logs and alerts.",
      "Pair preventive controls (PIM, access packages) with detective ones (alerts, reviews, logs)." ],
    next:"F1" };

  I["b4-1"] = { kind:"Boss: Audit", type:"single", title:"Role assignments with history", obj:["4.3.5","4.3.1"], main:true,
    sit:"<p>Auditor: “Show every Global Administrator assignment and activation in the last 30 days, including who approved activations.”</p>",
    q:"Where do you get it?",
    opts:[
      { id:"a", t:"PIM audit history and assignment reports for Microsoft Entra roles", c:1, f:"Assignments, activations and approvals with justifications.", i:[5,0,15] },
      { id:"b", t:"The Users list filtered by role", f:"Current state only, no history.", i:[0,0,-5] },
      { id:"c", t:"Sign-in logs", f:"No role activation records.", i:[0,0,-5] },
      { id:"d", t:"Ask the admins", f:"Not evidence.", i:[0,0,-10] } ],
    hints:["The tool that granted it also recorded it."],
    exp:"<p>PIM records role assignment changes and activation requests, approvals and denials. For longer windows, query the same events from audit logs retained in Log Analytics.</p>",
    src:["pimAudit"] };

  I["b4-2"] = { kind:"Boss: Audit", type:"single", title:"Alert on the glass", obj:["4.3.6","4.4.3","4.4.2"], main:true,
    sit:"<p>Auditor: “How would you know if an emergency access account signed in?” Halcyon routes sign-in logs to Log Analytics.</p>",
    q:"What's the best control?",
    opts:[
      { id:"a", t:"A Log Analytics (Azure Monitor) alert rule on SigninLogs that fires on any sign-in by the emergency accounts' object IDs or UPNs", c:1, f:"Every use triggers a notification.", i:[15,0,10] },
      { id:"b", t:"Check the accounts' sign-in logs weekly", f:"A week is a long time after a compromise.", i:[0,0,-10] },
      { id:"c", t:"Disable the accounts", f:"Then they're useless in an emergency.", i:[0,-25,0] },
      { id:"d", t:"Exclude them from logging", f:"Exactly backwards.", i:[-30,0,0] } ],
    hints:["Logs plus alert rules."],
    exp:"<p>Microsoft's guidance is to monitor emergency account sign-ins and alert on them. With logs in Log Analytics, a scheduled query alert can notify the security team in minutes.</p>",
    src:["emergency","logAnalytics"] };

  I["b4-3"] = { kind:"Boss: Audit", type:"single", title:"Guests who never left", obj:["4.2.1","4.2.2","1.3.3"], main:true,
    sit:"<p>Auditor: “Some guests haven't signed in for a year. Who decides whether they keep access?” There's no recurring review today.</p>",
    q:"What's the sustainable fix?",
    opts:[
      { id:"a", t:"A recurring access review of guest users (owners or sponsors as reviewers), with inactivity recommendations and auto-apply", c:1, f:"Regular, accountable and self-enforcing.", i:[15,0,15] },
      { id:"b", t:"Delete all guests older than a year", f:"Removes some who still collaborate.", i:[5,-20,0] },
      { id:"c", t:"Block guests from signing in", f:"Breaks every partnership.", i:[0,-30,0] },
      { id:"d", t:"Add a note to the onboarding guide", f:"Doesn't change anything.", i:[0,0,-5] } ],
    hints:["Recurring, with a decision-maker and automation."],
    exp:"<p>Access reviews can target guest users in groups and apps (and all guests through Microsoft 365 group scopes), recommend denial for inactive users, and auto-apply results.</p>",
    src:["accessReviews","arCreate"] };

  I["b4-4"] = { kind:"Boss: Audit", type:"single", title:"Auditors as guests", obj:["4.1.3","4.1.5","4.1.7"], main:true,
    sit:"<p>The auditors themselves need read access to an evidence SharePoint site for 30 days, must accept Halcyon's confidentiality terms, and their firm uses Microsoft Entra.</p>",
    q:"Which setup fits?",
    opts:[
      { id:"a", t:"An access package (evidence site, 30-day expiry) for the audit firm as a connected organization, with Terms of use enforced by Conditional Access", c:1, f:"Self-service, time-boxed, with recorded acceptance.", i:[15,15,15] },
      { id:"b", t:"Share the site link with “Anyone”", f:"Anonymous access to audit evidence.", i:[-40,15,0] },
      { id:"c", t:"Create member accounts for auditors", f:"Halcyon would manage their credentials, and nothing expires.", i:[-15,10,-10] },
      { id:"d", t:"Email the files", f:"No control after sending.", i:[-20,10,0] } ],
    hints:["Combine the entitlement and the terms."],
    exp:"<p>Entitlement management handles who and how long; Terms of use (through Conditional Access) handle the acceptance record. Both report their status for the auditors themselves.</p>",
    src:["emPackage","tou","emConnected"] };

  I["b4-5"] = { kind:"Boss: Audit", type:"single", title:"Role additions in KQL", obj:["4.4.3"], main:true,
    sit:"<p>Auditor: “List every time someone was added to a directory role in the last 90 days.” Audit logs are in Log Analytics.</p>",
    q:"Which query is the right starting point?",
    opts:[
      { id:"a", t:"<code>AuditLogs | where TimeGenerated > ago(90d) | where OperationName == \"Add member to role\"</code>", c:1, f:"Correct table and activity.", i:[0,0,15] },
      { id:"b", t:"<code>SigninLogs | where OperationName == \"Add member to role\"</code>", f:"Role changes are audit events, not sign-ins.", i:[0,0,-5] },
      { id:"c", t:"<code>AuditLogs | where ResultType != \"0\"</code>", f:"Filters on a sign-in concept, not role additions.", i:[0,0,-5] },
      { id:"d", t:"<code>AuditLogs | take 10</code>", f:"A sample, not an answer.", i:[0,0,-5] } ],
    hints:["Changes live in AuditLogs."],
    exp:"<p>Audit events include an OperationName (activity), initiator and targets. PIM-based activations also appear as audit events with their own activity names.</p>",
    src:["logAnalytics","auditLogs"] };

  I["b4-6"] = { kind:"Boss: Audit", type:"single", title:"Prove you improve", obj:["4.4.5","4.4.4"], main:true,
    sit:"<p>Auditor: “How do you track and prioritize identity security improvements over time?”</p>",
    q:"What's your evidence?",
    opts:[
      { id:"a", t:"Identity Secure Score: history over time, improvement actions with statuses and notes, prioritized by impact", c:1, f:"A maintained, Microsoft-measured backlog.", i:[0,0,15] },
      { id:"b", t:"A list of policies in a slide deck", f:"Static, and not measured.", i:[0,0,-5] },
      { id:"c", t:"The number of Conditional Access policies", f:"More policies isn't better security.", m:"More policies means better posture", i:[0,0,-5] },
      { id:"d", t:"Ticket counts", f:"Doesn't measure posture.", i:[0,0,-5] } ],
    hints:["There's a score made for identity."],
    exp:"<p>Identity Secure Score compares your configuration with Microsoft's recommendations and tracks changes over time. Pair it with workbooks for operational trends.</p>",
    src:["secureScore","workbooks"] };

  /* ---------------- Final Boss: Red Week ---------------- */
  M.F1 = { id:"F1", domain:"ALL", boss:true, final:true, code:"Final Boss", title:"Red Week", minutes:20,
    story:"A red team has one week to break Halcyon. They phish, they consent, they pivot to the cloud and they wait for you to blink. Every domain is in play.",
    goal:"Combine all four domains under pressure.",
    groups:[
      { n:1, title:"Day 1: the lure", blurb:"Consent phishing and risky sign-ins.", items:["f1-1","f1-2"] },
      { n:2, title:"Day 3: the pivot", blurb:"Privilege, workloads and the network edge.", items:["f1-3","f1-4","f1-5"] },
      { n:3, title:"Day 5: the report", blurb:"Hybrid resilience and the timeline.", items:["f1-6","f1-7"] } ],
    takeaways:[
      "Identity defense is layered: authentication strength, Conditional Access, app consent, privileged access, workload identity hygiene, network controls and monitoring.",
      "Every layer you configured in this campaign shows up in a realistic attack." ],
    next:null };

  I["f1-1"] = { kind:"Final: Incident", type:"single", title:"The consent lure", obj:["3.2.6","3.4.6"], main:true,
    sit:"<p>The red team emailed a link to “Halcyon Docs Viewer”, an app requesting <code>Mail.Read</code> and <code>offline_access</code>. Twelve users consented. Halcyon's user consent setting was “Allow for all apps”.</p>",
    q:"What's the best response?",
    opts:[
      { id:"a", t:"Revoke the app's permissions and disable it (or ban it in Defender for Cloud Apps), then restrict user consent to verified publishers with the admin consent workflow", c:1, f:"Contain, then close the door.", i:[20,0,10] },
      { id:"b", t:"Reset the 12 users' passwords", f:"OAuth grants don't depend on passwords; the app keeps its tokens.", m:"Password resets revoke OAuth consent", i:[0,0,-10] },
      { id:"c", t:"Delete the 12 users", f:"Punishes victims, and the app may still hold data.", i:[0,-25,-10] },
      { id:"d", t:"Block email from the red team's domain", f:"They'll use another domain.", i:[5,0,0] } ],
    hints:["Consent grants survive password changes."],
    exp:"<p>Illicit consent grants give attackers token-based access that doesn't need the user's password. Remove the grants, disable the service principal, investigate audit logs for “Consent to application”, and tighten consent settings.</p>",
    src:["userConsent","mdcaOAuth","adminConsentWorkflow"] };

  I["f1-2"] = { kind:"Final: Access Gate", type:"single", title:"Predict the gate", obj:["2.2.3","2.3.2","2.2.2"], main:true,
    sit:"<p>A red-teamer signs in as Jun from an anonymizing proxy with Jun's stolen password. ID Protection rates the sign-in risk <b>High</b>.</p>",
    ev:[ { kind:"table", title:"Policies (simulated)", columns:["Policy","Users","Condition","Control"], rows:[
      ["CA01 Require MFA","All users (excl. emergency)","—","Grant: MFA"],
      ["CA10 Sign-in risk","All users (excl. emergency)","Sign-in risk: High, Medium","Grant: MFA; Session: sign-in frequency every time"],
      ["CA12 Block high-risk countries","All users (excl. emergency)","Location: blocked countries named location","Block"] ] } ],
    q:"The proxy's IP isn't in a blocked country. What happens?",
    opts:[
      { id:"a", t:"The attacker is prompted for MFA, which they can't complete without Jun's method, so the sign-in fails", c:1, f:"CA01 and CA10 both demand MFA; CA12 doesn't apply.", i:[15,0,0] },
      { id:"b", t:"Blocked by CA12", f:"CA12 only applies to the blocked countries list.", i:[0,0,0] },
      { id:"c", t:"Allowed, because the password was correct", f:"Conditional Access applies after first-factor success.", m:"Correct passwords bypass Conditional Access", i:[-20,0,0] },
      { id:"d", t:"Allowed after a password change", f:"Password change remediates user risk, not sign-in risk.", m:"Sign-in risk is remediated by password change", i:[-10,0,0] } ],
    hints:["Which policies actually match this sign-in?"],
    exp:"<p>Sign-in risk policies require MFA to remediate. Because Jun is MFA-registered with a method the attacker doesn't have, the attempt fails. Jun's password is still compromised, so reset it.</p>",
    src:["riskPolicies","caOverview"] };

  I["f1-3"] = { kind:"Final: Least Privilege", type:"single", title:"Activation with teeth", obj:["4.3.1","2.2.8","4.3.4"], main:true,
    sit:"<p>The red team phished an admin's password and push approval. The admin's Privileged Role Administrator is eligible in PIM with activation requiring only MFA.</p>",
    q:"Which change best stops activation with phishable methods?",
    opts:[
      { id:"a", t:"Require a Conditional Access authentication context on activation, mapped to a policy requiring phishing-resistant MFA, and require approval", c:1, f:"Phished push approvals can't satisfy phishing-resistant strength.", i:[20,0,0] },
      { id:"b", t:"Lengthen the activation window", f:"Makes exposure longer.", i:[-10,0,0] },
      { id:"c", t:"Make the role permanently active", f:"Removes the gate entirely.", i:[-30,0,0] },
      { id:"d", t:"Require a ticket number", f:"Attackers can type numbers.", i:[0,0,0] } ],
    hints:["Step-up at activation."],
    exp:"<p>Authentication context lets PIM activation demand a specific authentication strength. Approval adds human verification for the most sensitive roles.</p>",
    src:["pimSettings","caTargets"] };

  I["f1-4"] = { kind:"Final: Workloads", type:"single", title:"The pivot to the cloud", obj:["2.3.5","3.3.3","3.1.1"], main:true,
    sit:"<p>A secret for app registration <b>Ops-Automation</b> was found on a compromised build server. The app has Azure Contributor on production. The red team uses it from a hosting provider's IP.</p>",
    q:"Which response is strongest?",
    opts:[
      { id:"a", t:"Remove the secret, move the workload to a managed identity or federated credential, and (with Workload ID Premium) apply Conditional Access for workload identities to block sign-ins outside known IPs", c:1, f:"Removes the secret, kills the stolen one, and limits future misuse.", i:[25,0,5] },
      { id:"b", t:"Rotate the secret and paste the new one on the same server", f:"The server is compromised.", i:[-10,0,0] },
      { id:"c", t:"Require MFA for the app", f:"Service principals can't do MFA.", m:"Service principals can do MFA", i:[0,0,-5] },
      { id:"d", t:"Delete all app registrations", f:"Breaks everything.", i:[0,-40,0] } ],
    hints:["Remove the secret entirely, then constrain where the identity works."],
    exp:"<p>Conditional Access for workload identities can block service principals from outside known public IP ranges or based on risk. It needs Workload ID Premium and direct targeting of the service principal.</p>",
    src:["caWorkload","wif","mi"] };

  I["f1-5"] = { kind:"Final: Network", type:"single", title:"Lateral to the file server", obj:["2.4.2","2.2.3"], main:true,
    sit:"<p>The red team tries to reach Halcyon's on-prem file server through Private Access from an unmanaged device with stolen tokens.</p>",
    q:"What stops them at the network edge?",
    opts:[
      { id:"a", t:"A Conditional Access policy on the Private Access app (or Quick Access) requiring a compliant device and MFA", c:1, f:"Private Access is Conditional Access-aware per app.", i:[20,-5,0] },
      { id:"b", t:"A web content filtering policy", f:"That's Internet Access, not private resources.", i:[0,0,-5] },
      { id:"c", t:"Hope the VPN is off", f:"Not a control.", i:[-20,0,0] },
      { id:"d", t:"Disable the Microsoft traffic profile", f:"Unrelated to private apps.", i:[0,-10,0] } ],
    hints:["Private Access apps are enterprise apps."],
    exp:"<p>Because Private Access apps (including Quick Access) are enterprise applications, Conditional Access can require device compliance, MFA and risk conditions before a tunnel to the resource is allowed.</p>",
    src:["gsaPrivate","caGrant"] };

  I["f1-6"] = { kind:"Final: Hybrid", type:"single", title:"The on-prem outage", obj:["1.4.3","1.4.4"], main:true,
    sit:"<p>The red team knocks out Halcyon's domain controllers in Toronto. Halcyon uses PTA, and PHS is also enabled as a backup.</p>",
    q:"How do users keep signing in to Microsoft 365?",
    opts:[
      { id:"a", t:"An admin switches the sign-in method from pass-through authentication to password hash sync in Connect Sync", c:1, f:"PHS is the documented fallback when PTA can't reach AD.", i:[0,25,0] },
      { id:"b", t:"PTA automatically fails over to PHS", f:"Switching is a deliberate admin action.", m:"PTA fails over to PHS automatically", i:[0,0,-5] },
      { id:"c", t:"Install more PTA agents", f:"Agents still need reachable domain controllers.", i:[0,0,-10] },
      { id:"d", t:"Users wait", f:"That's what the backup is for.", i:[0,-20,0] } ],
    hints:["The backup exists, but someone has to use it."],
    exp:"<p>Enabling PHS alongside PTA or federation keeps a ready backup. During an on-prem outage, switching sign-in to PHS restores cloud authentication.</p>",
    src:["phs","pta"] };

  I["f1-7"] = { kind:"Final: Report", type:"order", title:"The incident timeline", obj:["4.4.1","2.1.6","4.4.3"], main:true,
    sit:"<p>Write the response section of the red-team report: the order you acted in for Jun's confirmed-compromised account.</p>",
    q:"Order the response actions.",
    steps:[
      { id:"s1", t:"Contain Jun's account: revoke sessions and reset credentials", w:"For a confirmed compromise, stop access first." },
      { id:"s2", t:"Scope: search sign-in logs and ID Protection detections for other affected accounts", w:"Find out whether Jun was the only victim." },
      { id:"s3", t:"Remove persistence: attacker-registered methods, consent grants, app credentials", w:"Attackers leave back doors that survive a password reset." },
      { id:"s4", t:"Harden: stronger authentication strengths, consent restrictions, PIM settings", w:"Fix the gaps they used." },
      { id:"s5", t:"Monitor: alert rules and a follow-up review of logs", w:"Verify the fixes and catch a return visit." } ],
    start:["s4","s2","s5","s1","s3"],
    impact:{ correct:{sec:15, ops:10}, wrong:{sec:-5} },
    hints:["Stop the bleeding, look around, clean up, strengthen, watch."],
    exp:"<p>A practical sequence for a confirmed compromise: contain, scope, eradicate persistence, harden, monitor. Real incidents overlap these phases, but containment of a known-bad account shouldn't wait.</p>",
    simp:"Incident response frameworks vary; this ordering reflects common practice for one confirmed account.",
    src:["revoke","auditLogs","logAnalytics"] };

})(window.ID_CONTENT);
