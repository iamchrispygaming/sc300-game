/* Domain 1: Implement and manage user identities. Missions 02–06.
   Compact item keys (normalized by app.js): obj=objectives, sit=situation, q=prompt, opts=options
   (t=text, c=correct, f=feedback, m=misconception, i=[security, access, effort] impact, x=consequence),
   exp=explanation, simp=simplification, src=source keys. Verified 2026-11-18. */
(function (C) {
  const I = C.items, M = C.missions;

  /* ---------------- Mission 02: The Helpdesk Handoff ---------------- */
  M.M2 = { id:"M2", domain:"D1", code:"Mission 02", title:"The Helpdesk Handoff", minutes:12,
    story:"Halcyon's Toronto office is getting its own helpdesk. <b>Sam Okafor</b>, the new technician, needs to help Toronto staff with passwords. Nobody wants a repeat of the “just make me Global Admin” conversation.",
    goal:"Give Sam exactly the admin reach he needs, decide where administrative units fit, and read effective permissions correctly.",
    groups:[
      { n:1, title:"Scope the helpdesk", blurb:"Pick a role and a scope for a regional technician.", items:["m2-1","m2-1t"] },
      { n:2, title:"Fences and permissions", blurb:"Decide when administrative units help, then untangle stacked role assignments.", items:["m2-2","m2-3"] },
      { n:3, title:"When built-in is too big", blurb:"Use a custom role and dynamic administrative units.", items:["m2-4","m2-5"] } ],
    takeaways:[
      "Least privilege has two dials: the <b>role</b> (permissions) and the <b>scope</b> (tenant, administrative unit or a single resource).",
      "<b>Effective permissions</b> are the union of all <i>active</i> assignments, direct or through role-assignable groups. Eligible PIM assignments grant nothing until activated.",
      "AUs delegate administration of a subset. They don't hide objects, grant resource access, or nest. Adding a group to an AU doesn't add its members.",
      "<b>Custom roles</b> (Microsoft Entra ID P1) can be scoped to a single application when built-in roles are too broad." ],
    next:"M3" };

  I["m2-1"] = { kind:"Least Privilege Challenge", type:"single", title:"Scope the helpdesk", obj:["1.1.1","1.1.2","1.1.3"], main:true,
    story:"Sam: <b>“I just need to reset passwords for people here in Toronto. That's it.”</b>",
    sit:"<p>Sam must reset passwords for Toronto employees who hold no admin roles. He must not reset passwords elsewhere, or create and delete accounts. Toronto users are already members of an administrative unit named <b>AU-Toronto</b>.</p>",
    teach:"<p>An <b>administrative unit (AU)</b> is a container of users, groups or devices that limits where a role assignment applies. A role assigned at AU scope works only on that AU's members.</p><p><b>Password Administrator</b> resets passwords for users with no admin role (plus a few low-privilege roles). <b>Helpdesk Administrator</b> can reset passwords for a slightly larger set of roles. <b>User Administrator</b> can also create, edit and delete users and groups.</p><p>AU-scoped administrators need Microsoft Entra ID P1.</p>",
    q:"Which assignment meets the requirement with least privilege?",
    opts:[
      { id:"a", t:"<b>Password Administrator</b>, assigned at the scope of AU-Toronto", c:1, f:"Narrowest role for the task, limited to exactly the Toronto users.", i:[15,15,10], x:"Sam resets Toronto passwords without tickets, and can't touch anyone else." },
      { id:"b", t:"<b>Helpdesk Administrator</b>, assigned at tenant scope", f:"Right kind of role, wrong scope: Sam could reset non-admin passwords in every office.", m:"Tenant scope is fine for regional tasks", i:[-15,15,5], x:"Sam can reset passwords for 1,200 people instead of 140." },
      { id:"c", t:"<b>User Administrator</b>, assigned at the scope of AU-Toronto", f:"Correct scope, too many permissions: User Administrator also creates, updates and deletes users and groups.", m:"Choosing a broad role because the scope is narrow", i:[-10,15,5], x:"Sam can now delete Toronto accounts, which nobody asked for." },
      { id:"d", t:"<b>Global Administrator</b>, with a note asking Sam to only touch Toronto", f:"Policy by sticky note. Global Administrator also can't be scoped to an AU.", m:"Global Administrator for helpdesk tasks", i:[-40,15,5], x:"One phished helpdesk password could take over the tenant." } ],
    hints:["Ask two questions: what can he do, and where can he do it?","Find the role whose only job is passwords, then shrink its reach."],
    exp:"<p>Set both least-privilege dials as low as the requirement allows: the narrowest role (Password Administrator) at the smallest scope (AU-Toronto). Microsoft's least-privileged-roles guidance lists Password Administrator for resetting non-admin passwords.</p>",
    src:["au","privRoles","byTask"] };

  I["m2-1t"] = { kind:"Transfer check", type:"single", title:"The office manager's password", obj:["1.1.4","1.1.1"],
    sit:"<p>Sam holds <b>Password Administrator</b> at AU-Toronto scope. Toronto's office manager, also in AU-Toronto, holds the <b>Groups Administrator</b> role and is locked out.</p>",
    q:"What happens when Sam tries to reset her password?",
    opts:[
      { id:"a", t:"It fails. Password Administrator can't reset passwords for users holding roles such as Groups Administrator", c:1, f:"Reset rights depend on the target's roles as well as the scope." },
      { id:"b", t:"It works because she's inside AU-Toronto", f:"AU scope decides which users are in reach. It doesn't override protections for users with admin roles.", m:"AU scope overrides target-role protections" },
      { id:"c", t:"It works because Groups Administrator is less privileged than Password Administrator", f:"Password Administrator can only reset users with no admin role and a short list of roles (Directory Readers, Guest Inviter, Password Administrator).", m:"Any admin can reset any 'smaller' admin" },
      { id:"d", t:"It works, but she must approve the reset on her phone", f:"There's no approval step in an admin password reset." } ],
    hints:["Whose roles matter: Sam's, or hers?"],
    exp:"<p>Microsoft Entra protects users who hold admin roles: Password Administrator can reset passwords only for users with no admin role and for Directory Readers, Guest Inviter and Password Administrator holders. Resetting other admins needs a more privileged role; the privileged roles reference has the full table.</p>",
    src:["privRoles"] };

  I["m2-2"] = { kind:"Policy triage", type:"multi", pick:2, title:"Is this an AU job?", obj:["1.1.2"], main:true,
    story:"Nadia, Halcyon's security lead, forwards five requests with the subject line “AUs for everything?”",
    sit:"<p>Some of these requests are solved by administrative units and some aren't.</p>",
    teach:"<p>Think of an AU as a fence around some users, groups or devices: admin roles assigned inside the fence only work on what's inside it. The analogy breaks in one place: the fence doesn't stop regular users from <i>seeing</i> what's inside.</p>",
    q:"Which requests are good fits for administrative units?",
    opts:[
      { id:"a", t:"Let the Rotterdam depot's IT staff manage users and groups for Rotterdam only", c:1, f:"Delegating admin tasks over a subset of objects is exactly what AUs do.", i:[5,0,10] },
      { id:"b", t:"Let Halcyon's driver-training school staff reset passwords only for trainee accounts", c:1, f:"Another subset delegation: trainees in an AU, staff with a role scoped to it.", i:[5,0,10] },
      { id:"c", t:"Hide Finance employees from everyone else's directory searches", f:"AUs limit what administrators can manage, not what users can see.", m:"AUs control directory visibility", i:[0,0,-5] },
      { id:"d", t:"Give Marketing access to a SharePoint site", f:"That's resource access: a group or an access package, not admin delegation.", m:"AUs grant access to resources", i:[0,-5,0] },
      { id:"e", t:"Put an AU-Europe inside an AU-Global so permissions inherit", f:"Administrative units can't be nested.", m:"Administrative units can be nested", i:[0,0,-5] } ],
    hints:["AUs are about who administers what.","Look for requests that say “only” about a subset of people."],
    exp:"<p>Recommend AUs when an organization needs <b>delegated administration over a subset</b> of directory objects: regions, subsidiaries, schools, departments. They don't grant access to apps or sites, don't hide objects from users, and can't be nested.</p>",
    src:["au"] };

  I["m2-3"] = { kind:"Identity Detective", type:"single", title:"Sam's effective permissions", obj:["1.1.4","1.1.1"], main:true,
    story:"Six months later, Sam's account has collected a few role assignments. A Vancouver employee with no admin roles calls him for a password reset.",
    sit:"<p>Review Sam's role assignments, then decide what he can do right now.</p>",
    teach:"<p><b>Effective permissions</b> are the union of every <i>active</i> role assignment a user has: direct or through a role-assignable group, tenant-scoped or AU-scoped. An <b>eligible</b> assignment in Privileged Identity Management (PIM) grants nothing until it's activated.</p>",
    ev:[ { kind:"table", title:"Roles & admins › Sam Okafor › Assigned roles", columns:["Role","Scope","State","Assigned"], rows:[
      ["Password Administrator","AU-Toronto","Active","Direct"],
      ["Helpdesk Administrator","Directory","Active","Via group HD-Tier2 (role-assignable)"],
      ["User Administrator","Directory","Eligible (PIM)","Direct"] ] } ],
    q:"Can Sam reset the Vancouver employee's password right now?",
    opts:[
      { id:"a", t:"Yes, through Helpdesk Administrator, which is active at tenant scope through his group", c:1, f:"Active assignments add together, and the tenant-scoped Helpdesk Administrator assignment covers Vancouver.", i:[5,10,5], x:"You spot that Sam has more reach than intended and remove him from HD-Tier2." },
      { id:"b", t:"No. His AU-scoped assignment restricts all of his roles to Toronto", f:"An AU-scoped assignment limits only itself. It doesn't shrink his other roles.", m:"One scoped assignment restricts all others", i:[-10,0,0], x:"Sam keeps tenant-wide reset rights that nobody noticed." },
      { id:"c", t:"Only after he activates User Administrator in PIM", f:"Eligible roles do nothing until activated, but he doesn't need it: an active role already covers this.", m:"Overlooking active group-based role assignments", i:[-5,0,0] },
      { id:"d", t:"No. Roles assigned to a group apply only to the group's owners", f:"Members of a role-assignable group receive the group's role assignments.", m:"Group role assignments apply only to owners", i:[-10,0,0] } ],
    hints:["Check every row, including how each role is assigned.","Permissions add up; they don't cancel out."],
    exp:"<p>Sam's effective permissions include Helpdesk Administrator across the tenant, so he can reset passwords for non-admin users anywhere. If that's more than intended, remove him from HD-Tier2; don't count on the AU scope of a different assignment. When evaluating access, review a user's <b>Assigned roles</b>, including group-based and eligible assignments.</p>",
    src:["rolesAssign","au","pim"] };

  I["m2-4"] = { kind:"Least Privilege Challenge", type:"single", title:"A role that fits", obj:["1.1.1"], main:true,
    sit:"<p>The BrightBoard integration team must rotate the client secret on <b>one</b> app registration, BrightBoard-Sync, and needs no other permissions. Halcyon's policy requires admin access to come from role assignments (which appear in role reviews), so making them app owners isn't allowed.</p>",
    teach:"<p>When no built-in role is narrow enough, a <b>custom role</b> bundles just the permissions you choose. Custom roles need Microsoft Entra ID P1 and can be assigned at tenant scope, AU scope or, for app management permissions, the scope of a single application.</p>",
    q:"What meets the requirement with least privilege?",
    opts:[
      { id:"a", t:"A custom role containing only <code>microsoft.directory/applications/credentials/update</code>, assigned at the scope of BrightBoard-Sync", c:1, f:"One permission, one object.", i:[15,10,5] },
      { id:"b", t:"<b>Application Administrator</b> at tenant scope", f:"Manages every app registration and enterprise app in the tenant.", m:"Built-in app roles are always least privilege", i:[-20,10,5] },
      { id:"c", t:"<b>Cloud Application Administrator</b> at tenant scope", f:"Narrower than Application Administrator, but still covers every app in the tenant.", m:"Built-in app roles are always least privilege", i:[-15,10,5] },
      { id:"d", t:"Make the team owners of BrightBoard-Sync", f:"Owners could rotate the secret, but the policy rules out access that doesn't appear as a role assignment.", i:[0,10,5] } ],
    hints:["Built-in roles are broad by design.","Scope can be smaller than the tenant or an AU."],
    exp:"<p>Custom roles are built from permissions such as <code>microsoft.directory/applications/credentials/update</code>. Assigning one at a single application's scope keeps permissions and scope minimal, and the assignment shows up in role reviews.</p>",
    src:["customRoles"] };

  I["m2-5"] = { kind:"Transfer check", type:"single", title:"Automatic fences", obj:["1.1.3"],
    sit:"<p>Halcyon wants new Toronto hires to land in AU-Toronto automatically, based on their <b>City</b> attribute, without anyone adding them.</p>",
    q:"What's the right approach?",
    opts:[
      { id:"a", t:"Give AU-Toronto dynamic membership with a rule such as <code>user.city -eq \"Toronto\"</code>", c:1, f:"Administrative units support dynamic membership rules for users or devices." },
      { id:"b", t:"Create a dynamic group for Toronto and add that group to AU-Toronto", f:"Adding a group to an AU brings the group object into the AU's management scope, not the group's members.", m:"Adding a group to an AU adds its members" },
      { id:"c", t:"Nest AU-Toronto inside an AU-Canada that has a rule", f:"Administrative units can't be nested.", m:"Administrative units can be nested" },
      { id:"d", t:"Assign Toronto's helpdesk a tenant-scoped role so membership doesn't matter", f:"That throws away the scoping the AU exists for." } ],
    hints:["AUs and groups share one feature that keeps membership current."],
    exp:"<p>Dynamic membership for AUs uses the same rule syntax as dynamic groups and requires Microsoft Entra ID P1. The classic trap: adding a group to an AU lets AU admins manage the group itself, not its members.</p>",
    src:["au","dynamic"] };

  /* ---------------- Mission 03: Front Door ---------------- */
  M.M3 = { id:"M3", domain:"D1", code:"Mission 03", title:"Front Door", minutes:12,
    story:"Halcyon is getting a proper front door: a new domain, a branded sign-in page, and rules for which devices may join. Theo has volunteered to “just click around”. You'd rather he didn't.",
    goal:"Verify a domain, brand the sign-in experience, and set tenant user and device settings with intent.",
    groups:[
      { n:1, title:"Claim the domain", blurb:"Add and verify a custom domain in the right order.", items:["m3-1","m3-2"] },
      { n:2, title:"Brand the sign-in", blurb:"Explain when branding appears and who should manage it.", items:["m3-3","m3-4"] },
      { n:3, title:"Device and user settings", blurb:"Configure device join, choose device identities, and control app registration.", items:["m3-5","m3-6","m3-7"] } ],
    takeaways:[
      "Custom domains are proven with a DNS record (TXT or MX). Only verified domains can be used as sign-in suffixes, and a domain can't be removed while objects still reference it.",
      "Company branding shows once Entra knows the tenant: after the username is entered, or immediately on tenant-specific URLs. Organizational Branding Administrator is the least privileged role for it.",
      "Device settings control who can <b>join</b> (corporate) and <b>register</b> (personal) devices. Use the Conditional Access <b>Register or join devices</b> user action for MFA.",
      "Hybrid join keeps domain membership and adds an Entra device identity; it relies on Connect Sync to synchronize computer objects." ],
    next:"M4" };

  I["m3-1"] = { kind:"Sequencing", type:"order", title:"Claim the domain", obj:["1.1.5"], main:true,
    story:"Halcyon bought <b>halcyon.example</b> and wants everyone signing in as name@halcyon.example.",
    sit:"<p>Put the steps for adding and using the custom domain in order.</p>",
    teach:"<p>A custom domain is proven through DNS: Entra gives you a record, you publish it with your DNS host, and Entra checks it. Only <b>verified</b> domains can be used in sign-in names. Domain Name Administrator is the least privileged role for managing domains.</p>",
    q:"Put these steps in order, first to last.",
    steps:[
      { id:"s1", t:"Add halcyon.example under <b>Domain names</b> in the Microsoft Entra admin center", w:"Entra generates a unique verification record for this tenant." },
      { id:"s2", t:"Copy the TXT (or MX) record that Entra displays", w:"The record value proves this specific tenant asked for the domain." },
      { id:"s3", t:"Create that record at the DNS host for halcyon.example", w:"Only someone who controls the domain's DNS can do this." },
      { id:"s4", t:"Select <b>Verify</b> after DNS has propagated", w:"Entra looks the record up; until it succeeds, the domain stays unverified." },
      { id:"s5", t:"Change users' sign-in suffix to @halcyon.example (and optionally make it primary)", w:"Verified domains can now be used in user principal names. For synchronized users, change the UPN on-premises and let it sync." } ],
    start:["s3","s1","s5","s2","s4"],
    impact:{ correct:{acc:15, ops:10}, wrong:{acc:-5} },
    hints:["Entra has to tell you what to publish before you can publish it.","User names come last: they need a verified domain."],
    exp:"<p>Verification proves control of the domain's DNS. Until it's verified, the domain can't be used as a sign-in suffix. For users synchronized from on-premises AD, the UPN is managed on-premises and synchronized.</p>",
    src:["domains","byTask"] };

  I["m3-2"] = { kind:"Transfer check", type:"single", title:"The domain that won't leave", obj:["1.1.5"],
    sit:"<p>Halcyon tries to remove an old custom domain, <b>halcyon-legacy.example</b>, and the admin center refuses.</p>",
    q:"What's the most likely cause?",
    opts:[
      { id:"a", t:"Objects still reference the domain, such as user names, email addresses, groups or apps", c:1, f:"Entra won't remove a domain that's still in use; move those references to another domain first." },
      { id:"b", t:"Verified domains can never be removed", f:"They can, once nothing references them.", m:"Verified domains are permanent" },
      { id:"c", t:"A domain can be removed only 30 days after verification", f:"There's no such waiting period." },
      { id:"d", t:"Removing domains requires Microsoft Entra ID P2", f:"Domain management isn't a P2 feature." } ],
    hints:["What would break if the domain disappeared?"],
    exp:"<p>Before deleting a custom domain, change user principal names, email addresses (proxy addresses), groups and app identifiers that use it. The admin center lists the references that block deletion.</p>",
    src:["domains"] };

  I["m3-3"] = { kind:"Identity Detective", type:"single", title:"Where's our logo?", obj:["1.1.6"], main:true,
    story:"Halcyon's marketing team uploaded a background image, a banner logo and sign-in page text. Then the complaints started.",
    sit:"<p>Users who browse to a generic Microsoft 365 sign-in URL see Microsoft's default sign-in page first. Halcyon's branding only appears later.</p>",
    teach:"<p><b>Company branding</b> customizes Microsoft's sign-in pages: background image or color, favicon, banner logo, sign-in page text, username hint, footer links and more. The <b>default sign-in experience</b> applies tenant-wide, and you can add customizations for specific browser languages.</p>",
    q:"What explains what users see?",
    opts:[
      { id:"a", t:"Branding appears once Entra knows the tenant: after the user enters a username, or immediately on a tenant-specific URL", c:1, f:"A generic sign-in page can't know your organization until it sees your username.", i:[0,10,10], x:"You tell users it's expected, and update bookmarks to tenant-specific URLs." },
      { id:"b", t:"Branding takes 24 hours to replicate worldwide", f:"Branding isn't held back by a replication delay; this behavior is about tenant discovery.", m:"Branding has a long replication delay", i:[0,0,-5] },
      { id:"c", t:"Company branding applies only to the Microsoft 365 admin center", f:"It applies to Microsoft Entra sign-in pages for the tenant.", m:"Branding applies to admin portals only", i:[0,0,-5] },
      { id:"d", t:"The banner logo must be an SVG file", f:"The logo is uploaded as PNG or JPG, and the format doesn't control when branding appears.", i:[0,0,-5] } ],
    hints:["Think about what the sign-in page knows before you type anything."],
    exp:"<p>On generic URLs, the page starts with neutral branding and switches to yours after the username identifies your tenant. Tenant-specific URLs, or apps that pass a domain hint, show it immediately. The least privileged role for configuring company branding is <b>Organizational Branding Administrator</b>.</p>",
    src:["branding","byTask"] };

  I["m3-4"] = { kind:"Transfer check", type:"single", title:"Who changes the logo?", obj:["1.1.6","1.1.1"],
    sit:"<p>Marketing's web designer needs to update sign-in page branding from now on, and nothing else.</p>",
    q:"Which role should she get?",
    opts:[
      { id:"a", t:"Organizational Branding Administrator", c:1, f:"Built for exactly this task." },
      { id:"b", t:"Global Administrator", f:"Highest privilege for a cosmetic task.", m:"Branding requires Global Administrator" },
      { id:"c", t:"Application Administrator", f:"Manages app registrations and enterprise apps, not company branding." },
      { id:"d", t:"User Administrator", f:"Manages users and groups, not company branding." } ],
    hints:["Check the least privileged roles by task list for company branding."],
    exp:"<p>Microsoft lists Organizational Branding Administrator as the least privileged role for configuring company branding.</p>",
    src:["byTask","branding"] };

  I["m3-5"] = { kind:"Policy Workshop", type:"config", title:"Device front door", obj:["1.1.7","1.2.5"], main:true,
    story:"Theo joined his personal gaming PC to the tenant. It's now listed as a corporate device. Time for some rules.",
    sit:"<p>Requirements: (1) only members of <b>IT-Device-Joiners</b> may Microsoft Entra join Windows devices; (2) employees may still register personal phones (BYOD); (3) MFA for joining and registering will be enforced by a Conditional Access policy targeting the <b>Register or join devices</b> user action.</p>",
    teach:"<p>Device settings live under <b>Devices › Device settings</b>. <b>Microsoft Entra join</b> is for organization-owned devices that sign in with work accounts. <b>Microsoft Entra registration</b> is for personal devices that access work resources. A legacy toggle can require MFA for join and registration, but Microsoft recommends a Conditional Access user action instead.</p>",
    fields:[
      { id:"join", label:"Users may join devices to Microsoft Entra", options:[
        { id:"all", text:"All", feedback:"Anyone could join any Windows device, including gaming PCs.", misconception:"Leaving device join open to all users", impact:{sec:-15} },
        { id:"selected", text:"Selected: IT-Device-Joiners", correct:true, feedback:"Only the named group can join devices.", impact:{sec:15, ops:5} },
        { id:"none", text:"None", feedback:"Blocks IT from joining devices too.", impact:{acc:-15} } ]},
      { id:"register", label:"Users may register their devices with Microsoft Entra", options:[
        { id:"all", text:"All", correct:true, feedback:"Keeps BYOD registration available, as required.", impact:{acc:10} },
        { id:"none", text:"None", feedback:"Blocks personal device registration, which the requirements allow.", misconception:"Blocking registration to control join", impact:{acc:-15} } ]},
      { id:"mfa", label:"Require multifactor authentication to register or join devices", options:[
        { id:"yes", text:"Yes", feedback:"With a Conditional Access user action in place, set this legacy toggle to No so the policy governs.", misconception:"Using the legacy device MFA toggle alongside Conditional Access", impact:{ops:-5} },
        { id:"no", text:"No", correct:true, feedback:"Conditional Access's Register or join devices user action enforces MFA with more control.", impact:{ops:5, sec:5} } ]} ],
    hints:["One requirement restricts, one allows, and one moves the control elsewhere.","Microsoft recommends one place for device MFA, not two."],
    exp:"<p>Restrict join to a selected group, keep registration open for BYOD, and set the legacy MFA toggle to <b>No</b> because the Conditional Access user action <b>Register or join devices</b> enforces MFA.</p>",
    simp:"The real Device settings page has more options, such as maximum devices per user and local administrator settings.",
    src:["deviceSettings","deviceIdentity"] };

  I["m3-6"] = { kind:"Scenario", type:"single", title:"Which device identity?", obj:["1.2.5","1.4.1"], main:true,
    sit:"<p>Halcyon's 400 domain-joined Windows PCs must keep Group Policy and on-premises sign-in. Conditional Access will soon require a device that Microsoft Entra recognizes as corporate.</p>",
    teach:"<p>Three device identities: <b>Microsoft Entra registered</b> (personal devices), <b>Microsoft Entra joined</b> (corporate, cloud-first) and <b>Microsoft Entra hybrid joined</b> (joined to on-premises AD and registered with Entra).</p>",
    q:"Which device identity should these PCs have?",
    opts:[
      { id:"a", t:"Microsoft Entra hybrid joined", c:1, f:"They keep domain membership and GPO, and can satisfy “Require Microsoft Entra hybrid joined device”.", i:[10,15,10] },
      { id:"b", t:"Microsoft Entra registered", f:"Registration is designed for personal devices and doesn't mark a device as corporate.", m:"Registration makes a device corporate", i:[-10,0,0] },
      { id:"c", t:"Microsoft Entra joined, after removing them from the domain", f:"Great for cloud-first devices, but these must keep Group Policy and on-prem sign-in.", i:[0,-10,-15] },
      { id:"d", t:"No change: Conditional Access trusts domain-joined PCs automatically", f:"Conditional Access only knows devices that have a Microsoft Entra device identity.", m:"Domain join alone satisfies Conditional Access", i:[0,-20,0] } ],
    hints:["The PCs must stay in the domain."],
    exp:"<p>Hybrid join needs the computer objects in Microsoft Entra ID. Microsoft Entra Connect Sync synchronizes them; Cloud Sync doesn't currently synchronize device objects for hybrid join.</p>",
    src:["deviceIdentity","cloudSync"] };

  I["m3-7"] = { kind:"Transfer check", type:"single", title:"Who can still register apps?", obj:["1.1.7","1.1.1","3.3.2"],
    sit:"<p>Halcyon sets <b>Users can register applications</b> to <b>No</b> in User settings. Omar, a developer with no admin roles, still needs to create app registrations for his team's projects.</p>",
    q:"What lets Omar register apps with least privilege?",
    opts:[
      { id:"a", t:"Assign Omar the Application Developer role", c:1, f:"Application Developer can create app registrations even when the user setting is No." },
      { id:"b", t:"Assign Omar Application Administrator", f:"Manages all apps in the tenant: far more than creating registrations.", m:"Application Administrator is needed to register apps" },
      { id:"c", t:"Set the setting back to Yes for everyone", f:"That undoes the control for 1,200 people to help one." },
      { id:"d", t:"Assign Omar Global Administrator", f:"Maximum privilege for a minimal need." } ],
    hints:["There's a role named after Omar's job."],
    exp:"<p>The <b>Users can register applications</b> setting controls default user permissions. Application Developer grants the ability to create app registrations regardless of that setting, and the creator becomes the owner of what they create.</p>",
    src:["userDefault","rolesRef"] };

  /* ---------------- Mission 04: Directory at Scale ---------------- */
  M.M4 = { id:"M4", domain:"D1", code:"Mission 04", title:"Directory at Scale", minutes:12,
    story:"Peak season. Halcyon needs 300 seasonal workers by Friday, a confidential project needs tagging, and the CFO wants license numbers. Coffee is recommended.",
    goal:"Use custom security attributes correctly, automate bulk work, and report on licenses.",
    groups:[
      { n:1, title:"Sensitive tags", blurb:"Custom security attributes and their dedicated roles.", items:["m4-1","m4-2"] },
      { n:2, title:"Three hundred by Friday", blurb:"Bulk operations in the portal and in PowerShell.", items:["m4-3","m4-4"] },
      { n:3, title:"Count the seats", blurb:"Diagnose and report license consumption.", items:["m4-5","m4-6"] } ],
    takeaways:[
      "Custom security attributes live in <b>attribute sets</b> and have their own roles. Global Administrators don't get access to them by default.",
      "Use the admin center's <b>bulk operations</b> (CSV templates) for one-off jobs and <b>Microsoft Graph PowerShell</b> for repeatable automation. The AzureAD and MSOnline modules are deprecated.",
      "Group-based licensing puts users in an error state when a SKU runs out. <code>Get-MgSubscribedSku</code> shows purchased vs consumed units." ],
    next:"M5" };

  I["m4-1"] = { kind:"Identity Detective", type:"single", title:"Global Admin, access denied", obj:["1.2.3","1.1.4"], main:true,
    story:"Nadia, a Global Administrator, tries to tag a user with <b>Project = Kestrel</b>. The portal refuses.",
    sit:"<p>Halcyon wants to tag employees on the confidential Project Kestrel with a custom security attribute so an app filter can use it. Nadia opens a user's <b>Custom security attributes</b> page and can't add values.</p>",
    teach:"<p><b>Custom security attributes</b> are business-specific key-value pairs stored on users, enterprise apps and service principals. They're grouped into <b>attribute sets</b> and protected by their own roles, so sensitive tags stay away from general admins.</p>",
    q:"What's going on, and what's the fix?",
    opts:[
      { id:"a", t:"Custom security attributes use dedicated roles that Global Administrator doesn't get by default. Assign Attribute Assignment Administrator (and Attribute Definition Administrator to create definitions)", c:1, f:"Separation of duties is the point of these roles.", i:[10,10,5] },
      { id:"b", t:"Custom security attributes require Microsoft Entra ID P2", f:"Licensing isn't what's blocking her; this is a permissions boundary.", m:"Custom security attributes require P2", i:[0,0,-5] },
      { id:"c", t:"Values can only be set through Microsoft Entra Connect", f:"Attribute values can be assigned in the admin center, Graph or PowerShell.", i:[0,0,-5] },
      { id:"d", t:"The attribute set must first be added to an administrative unit", f:"Attribute sets aren't AU members.", m:"Attribute sets live in administrative units", i:[0,0,-5] } ],
    hints:["Even the most powerful role has one deliberate blind spot here."],
    exp:"<p>By design, Global Administrators can't read, define or assign custom security attributes unless they also hold the attribute roles. A typical split is Attribute Definition Administrator (defines sets and attributes), Attribute Assignment Administrator (assigns values), plus the reader roles.</p>",
    src:["csa"] };

  I["m4-2"] = { kind:"Transfer check", type:"multi", pick:2, title:"Attribute facts", obj:["1.2.3","2.2.2"],
    sit:"<p>Before rolling out more attributes, Nadia wants the team to know the rules.</p>",
    q:"Which statements about custom security attributes are true?",
    opts:[
      { id:"a", t:"Attributes are organized into attribute sets", c:1, f:"Sets group related attributes and can have their own role assignments." },
      { id:"b", t:"They can be used in Conditional Access filters for applications", c:1, f:"Filter for applications targets apps by their custom security attributes." },
      { id:"c", t:"Any user can read them through the directory", f:"Reading requires an attribute reader or admin role.", m:"Custom security attributes are readable by all users" },
      { id:"d", t:"Unused attribute definitions can be deleted at any time", f:"Definitions can be deactivated, not deleted.", m:"Attribute definitions can be deleted" } ],
    hints:["Two are about structure and use; two are about access and lifecycle."],
    exp:"<p>Custom security attributes are designed for sensitive data: they're grouped in sets, protected by dedicated roles, can drive Conditional Access app filters and Azure attribute-based access control, and are deactivated instead of deleted.</p>",
    src:["csa","caFilterApps"] };

  I["m4-3"] = { kind:"Scenario", type:"single", title:"Three hundred by Friday", obj:["1.2.4","1.2.1"], main:true,
    sit:"<p>HR sends a spreadsheet of 300 seasonal warehouse workers who need cloud-only accounts by Friday. It's a one-time job and you'd like to stay in the portal.</p>",
    teach:"<p>The admin center has bulk operations for users (create, invite, delete, download a list) and groups (add or remove members), each with a downloadable CSV template. For repeatable work, use <b>Microsoft Graph PowerShell</b>; the AzureAD and MSOnline modules are deprecated.</p>",
    q:"What's the quickest supported option?",
    opts:[
      { id:"a", t:"<b>Bulk create</b> in the Microsoft Entra admin center: download the CSV template, fill it in, upload it", c:1, f:"Designed for exactly this, and you can track it in Bulk operation results.", i:[0,20,20] },
      { id:"b", t:"<b>Bulk invite</b>", f:"Bulk invite creates guest (B2B) accounts for external people.", m:"Bulk invite creates employee accounts", i:[-10,-10,0] },
      { id:"c", t:"Install Microsoft Entra Cloud Sync", f:"Cloud Sync provisions from on-premises AD, and these workers aren't in AD.", i:[0,-10,-15] },
      { id:"d", t:"Create them one at a time with New user", f:"It works, eventually. Three hundred times.", i:[0,5,-25] } ],
    hints:["They're employees, not guests, and they exist only in a spreadsheet."],
    exp:"<p>Bulk create takes the template's required columns (such as name, user principal name, initial password and block sign-in) and processes them as a job you can monitor under <b>Bulk operation results</b>.</p>",
    src:["bulk","graphPS"] };

  I["m4-4"] = { kind:"Sequencing", type:"order", title:"Script it next season", obj:["1.2.4"], main:true,
    sit:"<p>Next season you'll automate the same job with Microsoft Graph PowerShell.</p>",
    q:"Put the script's steps in order.",
    mono:true,
    steps:[
      { id:"s1", t:"Install-Module Microsoft.Graph -Scope CurrentUser", w:"Install the module once per machine." },
      { id:"s2", t:"Connect-MgGraph -Scopes \"User.ReadWrite.All\"", w:"Sign in and request only the permission scope the job needs." },
      { id:"s3", t:"$rows = Import-Csv .\\seasonal.csv", w:"Read the input file." },
      { id:"s4", t:"foreach ($r in $rows) { New-MgUser @params }", w:"Create each user from its row (display name, UPN, password profile, and so on)." },
      { id:"s5", t:"Get-MgUser -UserId <upn>  # spot-check results", w:"Verify a sample before you tell HR it's done." } ],
    start:["s3","s4","s1","s5","s2"],
    impact:{ correct:{ops:15}, wrong:{ops:-5} },
    hints:["You can't connect with a module you haven't installed.","Read the data before you loop over it."],
    exp:"<p>Install, connect with least-privilege scopes, read input, create, verify. <code>Connect-MgGraph -Scopes</code> requests delegated permissions, so the signed-in admin also needs a role that allows creating users.</p>",
    src:["graphPS"] };

  I["m4-5"] = { kind:"Identity Detective", type:"single", title:"The license that ran out", obj:["1.2.6"], main:true,
    sit:"<p>A new Marketing hire isn't receiving Microsoft 365 E3 from the group that assigns it.</p>",
    ev:[ { kind:"table", title:"Groups › GRP-Marketing-Onboarding › Licenses", columns:["Product","Assigned to","Users in error","Error (paraphrased)"], rows:[["Microsoft 365 E3","Group","1","Not enough licenses available"]] },
         { kind:"kv", title:"Get-MgSubscribedSku (Microsoft 365 E3)", fields:[["PrepaidUnits.Enabled","1200"],["ConsumedUnits","1200"]] } ],
    teach:"<p>Each license product (SKU) has purchased units. <code>Get-MgSubscribedSku</code> shows prepaid and consumed units. Group-based licensing records per-user errors on the group's Licenses page, such as not enough licenses or conflicting service plans.</p>",
    q:"What's the fix?",
    opts:[
      { id:"a", t:"Free up or buy E3 licenses; once a unit is available, the user can be processed (reprocess if needed)", c:1, f:"Every unit is consumed. The error clears when capacity exists.", i:[0,20,5] },
      { id:"b", t:"Set the user's usage location", f:"That causes a different error, and group licensing falls back to the directory's location anyway.", m:"All license errors are usage-location errors", i:[0,0,-5] },
      { id:"c", t:"Remove the user from the group and assign the license directly", f:"Direct assignment draws from the same empty pool, and adds a manual exception.", i:[0,0,-10] },
      { id:"d", t:"Convert the group to a Microsoft 365 group", f:"Group type doesn't create licenses.", i:[0,0,-5] } ],
    hints:["Compare the two numbers."],
    exp:"<p>Users who can't get a license from a group are put into an error state, not skipped silently. Reclaim licenses from leavers (access reviews help) or buy more, then reprocess. For reporting, use the group's Licenses page, the Microsoft 365 admin center, or Microsoft Graph.</p>",
    src:["groupLicenseProblems","groupLicense"] };

  I["m4-6"] = { kind:"Transfer check", type:"single", title:"The CFO's quarterly report", obj:["1.2.6","1.2.4"],
    sit:"<p>The CFO wants a CSV of every user assigned Microsoft 365 E5, every quarter.</p>",
    q:"Which approach scales best?",
    opts:[
      { id:"a", t:"A Microsoft Graph PowerShell script that filters users by assigned license SKU and exports to CSV", c:1, f:"Repeatable, schedulable and accurate." },
      { id:"b", t:"Search the audit logs for license changes", f:"Audit logs show changes over a retention window, not the current state.", m:"Audit logs are an inventory" },
      { id:"c", t:"Filter the sign-in logs by app", f:"Sign-ins don't tell you who holds a license." },
      { id:"d", t:"Ask managers to confirm their teams' licenses", f:"Slow, inconsistent and not authoritative." } ],
    hints:["You want current state, repeatedly."],
    exp:"<p>License state lives on user objects (<code>assignedLicenses</code>), so query it directly with Microsoft Graph. Use logs for history, not inventory.</p>",
    src:["graphPS","license"] };

  /* ---------------- Mission 05: Partners & Guests ---------------- */
  M.M5 = { id:"M5", domain:"D1", code:"Mission 05", title:"Partners & Guests", minutes:14,
    story:"Halcyon signs a deal with <b>Harborline Logistics</b>, a fictional partner, and an audit firm arrives next week. Meanwhile Halcyon acquires <b>Northpeak Outfitters</b>. Your guest list just got interesting.",
    goal:"Set external collaboration rules, invite and maintain guests, trust partner tenants, federate with non-Entra partners, and sync users across tenants.",
    groups:[
      { n:1, title:"Guest rules", blurb:"Configure external collaboration settings and bulk invite.", items:["m5-1","m5-2"] },
      { n:2, title:"Living with guests", blurb:"Maintain guest accounts and trust partner MFA.", items:["m5-3","m5-4"] },
      { n:3, title:"Beyond invitations", blurb:"SAML/WS-Fed federation and cross-tenant synchronization.", items:["m5-5","m5-6"] } ],
    takeaways:[
      "External collaboration settings control what guests see, who can invite, and which domains invitations may go to.",
      "<b>Reset redemption status</b> moves a guest to a new sign-in identity while keeping their object, memberships and access.",
      "Cross-tenant access settings handle inbound/outbound B2B collaboration and direct connect, plus <b>trust settings</b> (MFA, compliant device, hybrid joined device).",
      "Cross-tenant synchronization is configured in the <b>source</b> tenant. The target allows inbound user sync for that source." ],
    next:"M6" };

  I["m5-1"] = { kind:"Policy Workshop", type:"config", title:"Guest rules", obj:["1.3.1"], main:true,
    story:"Harborline's project team is ready to collaborate. Halcyon's legal team has three conditions.",
    sit:"<p>Requirements: (1) guests can see only their own directory objects; (2) only users in specific admin roles, such as Guest Inviter, can invite guests; (3) invitations can go only to <b>harborline.example</b>.</p>",
    teach:"<p><b>External collaboration settings</b> (under External Identities) set guest user access to directory information, guest invite restrictions, and collaboration restrictions (allowed or denied domains).</p>",
    fields:[
      { id:"access", label:"Guest user access", options:[
        { id:"same", text:"Same access as members", feedback:"Guests could browse the directory like employees.", misconception:"Guests should match member permissions by default", impact:{sec:-20} },
        { id:"limited", text:"Limited access (default)", feedback:"Guests can still see some properties and memberships of other directory objects.", impact:{sec:-5} },
        { id:"restricted", text:"Restricted to their own objects", correct:true, feedback:"Most restrictive: guests see only their own profile and memberships.", impact:{sec:15} } ]},
      { id:"invite", label:"Guest invite restrictions", options:[
        { id:"anyone", text:"Anyone, including guests", feedback:"Guests could invite more guests.", impact:{sec:-15} },
        { id:"members", text:"Members and specific admin roles", feedback:"Every employee could invite.", impact:{sec:-5} },
        { id:"admins", text:"Only specific admin roles (including Guest Inviter)", correct:true, feedback:"Matches the requirement; Guest Inviter is the purpose-built role.", impact:{sec:10, ops:5} },
        { id:"none", text:"No one, including admins", feedback:"Blocks the partnership entirely.", impact:{acc:-25} } ]},
      { id:"domains", label:"Collaboration restrictions", options:[
        { id:"any", text:"Allow invitations to any domain", feedback:"No domain restriction at all.", impact:{sec:-10} },
        { id:"deny", text:"Deny invitations to specified domains", feedback:"A denylist allows every domain you haven't listed.", misconception:"A denylist restricts to known partners", impact:{sec:-5} },
        { id:"allow", text:"Allow invitations only to: harborline.example", correct:true, feedback:"An allowlist blocks every other domain.", impact:{sec:10} } ]} ],
    hints:["Each requirement maps to one setting, and each asks for the strictest option that still allows the partnership."],
    exp:"<p>The most restrictive guest access option limits guests to their own profile and memberships. Restricting invitations to specific admin roles, with Guest Inviter as the purpose-built role, keeps invitations deliberate. An allowlist of domains blocks invitations to anyone else.</p>",
    src:["extCollab"] };

  I["m5-2"] = { kind:"Transfer check", type:"single", title:"Sixty auditors", obj:["1.3.2"],
    sit:"<p>An audit firm sends a list of 60 auditors who need guest access by Monday. They'll sign in with their own work accounts.</p>",
    q:"What's the best way to add them?",
    opts:[
      { id:"a", t:"Bulk invite external users with the CSV template", c:1, f:"Creates guest accounts and sends invitations in one job." },
      { id:"b", t:"Bulk create users", f:"That creates member accounts with Halcyon passwords, not guests with their own identities.", m:"Bulk create is for external users" },
      { id:"c", t:"Set up cross-tenant synchronization with the audit firm", f:"Cross-tenant sync is for tenants within one organization, and it's configured from the source tenant.", m:"Cross-tenant sync works with any partner" },
      { id:"d", t:"Invite them one at a time", f:"It works, but slowly." } ],
    hints:["They're external and they bring their own identities."],
    exp:"<p>Bulk invite (Users › Bulk operations › Bulk invite) takes email addresses and optional redirect URLs and messages, creating guests who redeem with their own identities.</p>",
    src:["bulkInvite"] };

  I["m5-3"] = { kind:"Identity Detective", type:"single", title:"The guest who changed jobs", obj:["1.3.3"], main:true,
    sit:"<p>Kai, a Harborline guest, moved to Harborline's parent company and has a new work email. He needs the same group memberships and app access as before.</p>",
    ev:[ { kind:"kv", title:"Users › Kai Brennan", fields:[["User type","Guest"],["Invitation state","Accepted"],["Sign-in identity","kai.brennan@harborline.example"],["Group memberships","4"],["App assignments","2"]] } ],
    teach:"<p>A <b>guest</b> (B2B collaboration) user object lives in your tenant, but the person signs in with an identity from elsewhere. Key properties are the <b>User type</b> (Guest or Member, which sets default directory permissions), the sign-in identity, and the invitation state.</p>",
    q:"How do you move Kai's account to his new identity while keeping his access?",
    opts:[
      { id:"a", t:"<b>Reset redemption status</b> and send the invitation to his new email", c:1, f:"Same object ID, memberships and assignments; he redeems again with the new identity.", i:[5,20,15] },
      { id:"b", t:"Delete the guest and invite his new address", f:"A new object starts with no memberships or app assignments.", m:"Re-inviting preserves access", i:[0,-10,-15] },
      { id:"c", t:"Change his User type to Member", f:"User type changes default permissions, not who signs in.", m:"User type controls sign-in identity", i:[-10,0,0] },
      { id:"d", t:"Edit his Other emails field", f:"Contact details don't change the identity he signs in with.", i:[0,-5,0] } ],
    hints:["Keep the object; change how it's redeemed."],
    exp:"<p>Reset redemption status is the supported way to point an existing guest at a different sign-in identity without rebuilding access. User type is a separate setting: changing Guest to Member changes default directory permissions, not authentication.</p>",
    src:["resetRedemption","b2bProps"] };

  I["m5-4"] = { kind:"Scenario", type:"single", title:"Double MFA", obj:["1.3.4"], main:true,
    sit:"<p>Harborline guests complete MFA in Harborline's own Microsoft Entra tenant, and then Halcyon's Conditional Access prompts them again. Halcyon trusts Harborline's MFA.</p>",
    teach:"<p><b>Cross-tenant access settings</b> manage B2B collaboration and B2B direct connect with other Microsoft Entra tenants, inbound and outbound, with defaults plus per-organization overrides. <b>Trust settings</b> can accept another tenant's MFA, compliant device or hybrid joined device claims.</p>",
    q:"How do you stop the double prompt without lowering security?",
    opts:[
      { id:"a", t:"Add Harborline in cross-tenant access settings and enable inbound trust for multifactor authentication", c:1, f:"Your policies still require MFA, and Harborline's MFA satisfies them.", i:[5,15,10] },
      { id:"b", t:"Exclude guests from Halcyon's MFA policy", f:"That removes the requirement instead of accepting proof of it.", m:"Excluding guests is equivalent to trusting their MFA", i:[-25,15,5] },
      { id:"c", t:"Enable B2B direct connect outbound", f:"Direct connect is for Teams shared channels, and outbound covers your users going out.", i:[0,-5,-5] },
      { id:"d", t:"Synchronize Harborline users as members", f:"Harborline is a separate company, and changing user type doesn't address the prompt.", i:[-10,0,-10] } ],
    hints:["Look for a setting that accepts a claim instead of skipping a check."],
    exp:"<p>Inbound trust settings for a specific organization let Halcyon's Conditional Access accept MFA already performed in the guest's home tenant. Trust only organizations whose controls you're comfortable relying on.</p>",
    src:["xtAccess"] };

  I["m5-5"] = { kind:"Scenario", type:"single", title:"Partner without Entra", obj:["1.3.6"], main:true,
    sit:"<p>Pellucid Analytics, a fictional consultancy, doesn't use Microsoft Entra. Its staff sign in to a SAML 2.0 identity provider at <b>pellucid.example</b>. They should sign in to Halcyon with those corporate credentials.</p>",
    teach:"<p>B2B guests can authenticate with Microsoft Entra accounts, Microsoft accounts, Google, email one-time passcode, or any identity provider that supports <b>SAML 2.0 or WS-Fed</b> through IdP federation.</p>",
    q:"What should you configure?",
    opts:[
      { id:"a", t:"A SAML/WS-Fed identity provider federation for pellucid.example", c:1, f:"Halcyon trusts Pellucid's IdP for its domain.", i:[10,15,10] },
      { id:"b", t:"Email one-time passcode", f:"It works as a fallback, but guests would use emailed codes, not their corporate credentials.", m:"Email OTP is federation", i:[0,5,0] },
      { id:"c", t:"Cross-tenant synchronization", f:"Requires both sides to be Microsoft Entra tenants in one organization.", i:[0,-10,-10] },
      { id:"d", t:"Google federation", f:"Pellucid uses its own SAML IdP, not Google.", i:[0,-10,0] } ],
    hints:["Match the protocol the partner already speaks."],
    exp:"<p>SAML/WS-Fed IdP federation lets guests sign in with credentials their own company manages, so offboarding at Pellucid also ends access.</p>",
    src:["samlIdp","otp"] };

  I["m5-6"] = { kind:"Scenario", type:"single", title:"Two tenants, one company", obj:["1.3.5","1.3.4"], main:true,
    sit:"<p>Halcyon acquired Northpeak Outfitters, which keeps its own Microsoft Entra tenant for now. Northpeak employees must appear in Halcyon's tenant automatically, as members, and be removed when they leave Northpeak.</p>",
    teach:"<p><b>Cross-tenant synchronization</b> automates creating, updating and deleting B2B users across tenants in the same organization. It pushes one way, from a source tenant to a target tenant.</p>",
    q:"Where is it configured, and what must the other tenant allow?",
    opts:[
      { id:"a", t:"Configure the sync in Northpeak's (source) tenant; Halcyon's (target) tenant allows inbound user sync from Northpeak in cross-tenant access settings", c:1, f:"Source pushes, target accepts.", i:[5,20,20] },
      { id:"b", t:"Configure it in Halcyon's tenant to pull users from Northpeak", f:"Cross-tenant sync pushes from the source tenant.", m:"Cross-tenant sync is configured in the target tenant", i:[0,-10,-5] },
      { id:"c", t:"Use Microsoft Entra Connect between the two tenants", f:"Connect Sync synchronizes from on-premises AD, not between Entra tenants.", i:[0,-10,-10] },
      { id:"d", t:"Bulk invite Northpeak users every month", f:"No automatic updates or removals, and they'd be guests.", i:[-10,0,-20] } ],
    hints:["Which tenant knows when a Northpeak employee leaves?"],
    exp:"<p>The source tenant holds the configuration (scoping and attribute mappings). The target tenant turns on <b>Allow users sync into this tenant</b> for the source in its inbound cross-tenant access settings. Automatic redemption is usually enabled on both sides so synced users don't see consent prompts.</p>",
    src:["xtSync","xtAccess"] };

  /* ---------------- Mission 06: Hybrid Bridge ---------------- */
  M.M6 = { id:"M6", domain:"D1", code:"Mission 06", title:"Hybrid Bridge", minutes:14,
    story:"Halcyon still runs on-premises Active Directory, Northpeak brings another forest, and AD FS has been grumbling for years. Time to build a better bridge.",
    goal:"Choose sync engines and sign-in methods, retire AD FS safely, and keep the bridge healthy.",
    groups:[
      { n:1, title:"Choose the bridge", blurb:"Connect Sync vs Cloud Sync, and how passwords are checked.", items:["m6-1","m6-2"] },
      { n:2, title:"Belt and braces", blurb:"Password hash sync benefits and Seamless SSO hygiene.", items:["m6-3","m6-4"] },
      { n:3, title:"Leaving AD FS", blurb:"Migrate safely and monitor the result.", items:["m6-5","m6-6","m6-7"] } ],
    takeaways:[
      "<b>Cloud Sync</b>: lightweight agents, cloud configuration, multiple active agents, disconnected forests. <b>Connect Sync</b>: full engine, needed for device sync (hybrid join) and pass-through authentication.",
      "<b>PHS</b> syncs a hash of the hash, enabling leaked credential detection and a fallback. <b>PTA</b> validates against AD in real time with on-prem agents.",
      "Roll the Seamless SSO (AZUREADSSOACC) Kerberos key at least every 30 days.",
      "Leave AD FS with Staged Rollout first, convert the domain after a successful pilot, and monitor with Connect Health. Use a staging mode server for fast failover." ],
    next:"B1" };

  I["m6-1"] = { kind:"Scenario", type:"single", title:"Which sync engine?", obj:["1.4.2","1.4.1"], main:true,
    sit:"<p>Northpeak's on-premises AD forest is disconnected from Halcyon's: no trust and no network path between domain controllers. Halcyon wants Northpeak users synchronized to its tenant with password hash sync, minimal on-premises infrastructure, and high availability.</p>",
    teach:"<p><b>Microsoft Entra Connect Sync</b> is a full sync engine on a Windows server, configured on-premises, with deep customization. <b>Microsoft Entra Cloud Sync</b> uses lightweight provisioning agents with configuration stored in the cloud, supports multiple active agents, and handles disconnected forests.</p>",
    q:"Which option fits?",
    opts:[
      { id:"a", t:"Microsoft Entra Cloud Sync with provisioning agents in Northpeak's forest", c:1, f:"Disconnected forests, multiple active agents, PHS support and light footprint.", i:[5,20,20] },
      { id:"b", t:"A second Connect Sync server in active mode for the same tenant", f:"Connect Sync supports one active server per tenant; additional servers run in staging mode.", m:"Multiple active Connect Sync servers per tenant", i:[0,-10,-15] },
      { id:"c", t:"Cross-tenant synchronization", f:"That syncs between Entra tenants, not from on-premises AD.", i:[0,-10,-10] },
      { id:"d", t:"Pass-through Authentication agents only", f:"PTA validates passwords; it doesn't synchronize users.", m:"PTA synchronizes identities", i:[0,-15,-5] } ],
    hints:["Which engine was built for disconnected forests and multiple active agents?"],
    exp:"<p>Cloud Sync fits disconnected forests and multi-agent high availability, and supports password hash sync. Connect Sync is still required for some scenarios, such as device object sync for hybrid join and pass-through authentication.</p>",
    src:["cloudSync","connectSync"] };

  I["m6-2"] = { kind:"Scenario", type:"single", title:"Keep passwords at home", obj:["1.4.4","1.4.3"], main:true,
    sit:"<p>Compliance says password hashes must not be stored in the cloud, and on-premises policies such as logon hours and account lockout must apply to cloud sign-ins immediately. Halcyon doesn't want to run a federation farm.</p>",
    teach:"<p>Hybrid sign-in methods: <b>password hash sync (PHS)</b> means Entra validates using a synced hash of the password hash. <b>Pass-through authentication (PTA)</b> means on-premises agents validate passwords against AD in real time. <b>Federation</b> means another IdP, such as AD FS, handles sign-in.</p>",
    q:"Which sign-in method meets the requirements?",
    opts:[
      { id:"a", t:"Pass-through authentication, with multiple agents for high availability", c:1, f:"Validation happens against AD at sign-in; no hash is stored in the cloud.", i:[10,15,5] },
      { id:"b", t:"Password hash synchronization", f:"Stores a hash of the password hash in Entra, which compliance ruled out.", i:[-10,10,10] },
      { id:"c", t:"Federation with AD FS", f:"Meets the policy requirement but needs a federation farm, which Halcyon wants to avoid.", i:[0,10,-20] },
      { id:"d", t:"Seamless single sign-on on its own", f:"Seamless SSO isn't a sign-in method by itself; it pairs with PHS or PTA.", m:"Seamless SSO is an authentication method", i:[0,-10,0] } ],
    hints:["Which method asks AD in real time, without a farm?"],
    exp:"<p>PTA checks passwords against on-premises AD, so account states and policies apply right away and no hash is stored in the cloud. Sign-in depends on the agents and DCs, so run multiple agents. PTA is configured through Connect Sync.</p>",
    src:["pta","phs"] };

  I["m6-3"] = { kind:"Policy triage", type:"multi", pick:2, title:"Why keep PHS too?", obj:["1.4.3"], main:true,
    sit:"<p>Compliance later relaxes the hash rule. Nadia proposes enabling password hash sync alongside pass-through authentication.</p>",
    q:"Which benefits does that bring?",
    opts:[
      { id:"a", t:"Leaked credential detection in Microsoft Entra ID Protection", c:1, f:"Detection compares synced hashes with known leaked credentials.", i:[10,0,0] },
      { id:"b", t:"A backup sign-in method if on-premises agents or domain controllers become unavailable", c:1, f:"Admins can switch to PHS during an on-prem outage.", i:[5,10,0] },
      { id:"c", t:"Admins can view users' plaintext passwords", f:"PHS never syncs or exposes plaintext passwords.", m:"PHS syncs plaintext passwords", i:[0,0,0] },
      { id:"d", t:"It enables device writeback", f:"Unrelated to password hash sync.", i:[0,0,0] } ],
    hints:["One benefit is security, one is resilience."],
    exp:"<p>PHS synchronizes a hash of the password hash. That enables leaked credential detection and gives you a fallback if on-premises authentication fails. Switching sign-in methods during an outage is a deliberate admin action.</p>",
    src:["phs"] };

  I["m6-4"] = { kind:"Transfer check", type:"single", title:"Seamless SSO hygiene", obj:["1.4.5"],
    sit:"<p>An audit flags that the <b>AZUREADSSOACC</b> computer account in AD hasn't had its Kerberos decryption key changed in over a year.</p>",
    q:"What should you do?",
    opts:[
      { id:"a", t:"Roll over the Kerberos decryption key for AZUREADSSOACC, and make it a regular task (at least every 30 days)", c:1, f:"Microsoft recommends frequent rollover of this key." },
      { id:"b", t:"Delete AZUREADSSOACC because it's unused", f:"Seamless SSO uses it; deleting it breaks silent sign-in.", m:"AZUREADSSOACC is unused" },
      { id:"c", t:"Disable Seamless SSO and switch to federation", f:"A drastic and unrelated change." },
      { id:"d", t:"Nothing: the key rotates automatically", f:"Rollover is an admin task performed with PowerShell.", m:"The Seamless SSO key rotates automatically" } ],
    hints:["It's a computer account with a long-lived secret."],
    exp:"<p>Seamless SSO signs users in silently on domain-joined devices on the corporate network using Kerberos. The AZUREADSSOACC key should be rolled over at least every 30 days using the documented PowerShell procedure.</p>",
    src:["sso"] };

  I["m6-5"] = { kind:"Sequencing", type:"order", title:"Leaving AD FS", obj:["1.4.6","1.4.3"], main:true,
    sit:"<p>Halcyon will retire its AD FS farm and move sign-in for <b>halcyon.example</b> to cloud authentication with password hash sync.</p>",
    teach:"<p><b>Staged Rollout</b> lets selected groups use cloud authentication while the domain stays federated, so you can test without flipping everyone at once.</p>",
    q:"Put the migration steps in order.",
    steps:[
      { id:"s1", t:"Enable password hash sync in Connect Sync while AD FS still handles sign-in", w:"Hashes must be in Entra before anyone authenticates against them." },
      { id:"s2", t:"Turn on Staged Rollout for a pilot group", w:"The pilot tests cloud authentication; everyone else stays on AD FS." },
      { id:"s3", t:"Add more groups to Staged Rollout as the pilot succeeds", w:"Widen gradually and watch sign-in logs." },
      { id:"s4", t:"Convert halcyon.example from federated to managed", w:"This switches everyone, so it comes after a successful pilot." },
      { id:"s5", t:"Decommission AD FS once no relying-party trusts depend on it", w:"Apps still trusting AD FS must move to Microsoft Entra ID first." } ],
    start:["s4","s2","s5","s1","s3"],
    impact:{ correct:{sec:10, acc:10, ops:15}, wrong:{acc:-15} },
    hints:["You can't test cloud sign-in without hashes in the cloud.","The step that affects everyone comes after the pilot."],
    exp:"<p>Enable PHS first, pilot with Staged Rollout, widen, convert the domain, then decommission AD FS after its apps have moved (the AD FS application activity report helps inventory them).</p>",
    src:["stagedRollout","adfsMigrate"] };

  I["m6-6"] = { kind:"Scenario", type:"single", title:"Watching the bridge", obj:["1.4.7"], main:true,
    sit:"<p>Connect Sync errors went unnoticed for two weeks. Halcyon wants alerts and performance monitoring for its sync server and AD FS servers, visible in the Entra admin center.</p>",
    q:"What should you deploy?",
    opts:[
      { id:"a", t:"Microsoft Entra Connect Health agents on the sync and AD FS servers", c:1, f:"Alerts, performance data and sync error reports in the portal.", i:[10,5,15] },
      { id:"b", t:"Diagnostic settings for audit logs", f:"Useful, but doesn't monitor on-premises server health.", i:[0,0,-5] },
      { id:"c", t:"A staging mode server", f:"That's for failover, not monitoring.", m:"Staging mode provides monitoring", i:[0,0,-5] },
      { id:"d", t:"A weekly check of Synchronization Service Manager", f:"Manual and local, with no alerting.", i:[0,0,-10] } ],
    hints:["The product has “Health” in its name."],
    exp:"<p>Connect Health has agents for sync, AD FS and AD DS. It raises alerts (such as sync errors or stopped services), shows performance data, and surfaces sync error reports. It requires Microsoft Entra ID P1 or P2.</p>",
    src:["health"] };

  I["m6-7"] = { kind:"Transfer check", type:"single", title:"Warm standby", obj:["1.4.1"],
    sit:"<p>Halcyon wants a second Connect Sync server that can take over quickly if the primary fails.</p>",
    q:"What's the supported approach?",
    opts:[
      { id:"a", t:"Install the second server in staging mode", c:1, f:"It imports and synchronizes but doesn't export, ready to be switched to active." },
      { id:"b", t:"Run both servers in active mode", f:"Only one Connect Sync server may export to a tenant.", m:"Multiple active Connect Sync servers per tenant" },
      { id:"c", t:"Rely on nightly SQL backups only", f:"Restoring takes far longer than switching a staging server." },
      { id:"d", t:"Install a Connect Health agent", f:"Monitors, but doesn't fail over." } ],
    hints:["One server exports; the other rehearses."],
    exp:"<p>A staging mode server keeps a current copy of the configuration and data without exporting. During an outage, or before an upgrade, switch it to active mode.</p>",
    src:["connectSync"] };

  /* ---------------- Boss 1: Acquisition Day ---------------- */
  M.B1 = { id:"B1", domain:"D1", boss:true, code:"Boss · Domain 1", title:"Acquisition Day", minutes:15,
    story:"The Northpeak acquisition closes today. Their forest, their helpdesk, their sign-in page and 300 employees all need to land in Halcyon's world by Friday. Nadia has booked the war room.",
    goal:"Combine tenant, identity, external and hybrid skills under pressure.",
    groups:[
      { n:1, title:"Land the people", blurb:"Sync, sign-in and licensing for an acquired company.", items:["b1-1","b1-2"] },
      { n:2, title:"Delegate and connect", blurb:"Scoped administration and cross-tenant settings.", items:["b1-3","b1-4"] },
      { n:3, title:"Make it feel like home", blurb:"Localized branding and tenant hygiene.", items:["b1-5","b1-6"] } ],
    takeaways:[
      "Acquisitions mix every user-identity skill: sync engine choice, sign-in method, licensing data quality, scoped admin, cross-tenant settings and branding.",
      "Automatic redemption for cross-tenant sync must be enabled in both the source's outbound and the target's inbound settings." ],
    next:"M7" };

  I["b1-1"] = { kind:"Boss: Scenario", type:"single", title:"What Cloud Sync can do alone", obj:["1.4.2","1.4.3","1.4.4"], main:true,
    sit:"<p>Northpeak previously used Connect Sync with pass-through authentication. You're standing up Microsoft Entra Cloud Sync for Northpeak's disconnected forest.</p>",
    q:"Which sign-in method can you configure with Cloud Sync for these users?",
    opts:[
      { id:"a", t:"Password hash synchronization", c:1, f:"Cloud Sync supports PHS.", i:[5,15,10] },
      { id:"b", t:"Pass-through authentication, configured in Cloud Sync", f:"PTA isn't configured through Cloud Sync; Microsoft's comparison lists PTA support under Connect Sync only.", m:"Cloud Sync configures PTA", i:[0,-15,-5] },
      { id:"c", t:"Device writeback", f:"Not a sign-in method, and Cloud Sync doesn't do device writeback.", i:[0,-5,0] },
      { id:"d", t:"None. Cloud Sync is provisioning only, so every user needs federation", f:"Cloud Sync supports password hash sync.", i:[0,-15,-10] } ],
    hints:["Check the Connect Sync vs Cloud Sync comparison table."],
    exp:"<p>Microsoft's comparison shows password hash sync for both engines and pass-through authentication for Connect Sync only. Plan Northpeak's sign-in around PHS (with Seamless SSO if needed).</p>",
    src:["cloudSync"] };

  I["b1-2"] = { kind:"Boss: Scenario", type:"single", title:"300 blank usage locations", obj:["1.2.6","1.2.4","1.2.1"], main:true,
    sit:"<p>Northpeak's 300 users are based in Norway. They're synced into Halcyon with blank usage locations and added to the group that assigns Microsoft 365 E3. Halcyon's directory location is Canada.</p>",
    q:"What should you do?",
    opts:[
      { id:"a", t:"Set usageLocation to NO for these users in bulk (for example with Microsoft Graph PowerShell), and add it to the onboarding flow", c:1, f:"Correct data, at scale, and the fix is permanent.", i:[10,10,10] },
      { id:"b", t:"Nothing. Group licensing will fail until someone notices", f:"Group licensing won't fail: blank usage locations inherit the directory's (Canada).", m:"Group-based licensing fails without a usage location", i:[0,0,-10] },
      { id:"c", t:"Nothing. Canada is close enough", f:"Usage location decides service availability under local rules, so it should be correct.", i:[-10,5,0] },
      { id:"d", t:"Assign licenses directly to each user instead of through the group", f:"Adds 300 manual exceptions and doesn't fix the data.", i:[0,5,-20] } ],
    hints:["Remember what group licensing does with a blank usage location."],
    exp:"<p>Group-based licensing fills a blank usage location with the directory's location, so Northpeak users would be licensed as Canadian. Fix the attribute in bulk and set it during user creation from now on.</p>",
    src:["groupLicense","graphPS"] };

  I["b1-3"] = { kind:"Boss: Least Privilege", type:"single", title:"Northpeak's IT team", obj:["1.1.1","1.1.2","1.1.3"], main:true,
    sit:"<p>Northpeak's three-person IT team must create, update and delete Northpeak user accounts and groups, and nothing outside Northpeak. Synced Northpeak users have <b>companyName</b> set to “Northpeak”.</p>",
    q:"What do you set up?",
    opts:[
      { id:"a", t:"An AU with dynamic membership <code>user.companyName -eq \"Northpeak\"</code>, and User Administrator assigned to the team at that AU's scope", c:1, f:"The role matches the tasks, and the AU keeps itself current.", i:[15,10,15] },
      { id:"b", t:"User Administrator at tenant scope", f:"They could manage Halcyon accounts too.", i:[-20,10,5] },
      { id:"c", t:"Password Administrator at the AU's scope", f:"Right scope, but it can't create or delete accounts.", m:"Password Administrator manages accounts", i:[5,-10,0] },
      { id:"d", t:"Make the team owners of every Northpeak group", f:"Ownership covers group membership, not user account creation or deletion.", i:[0,-10,-10] } ],
    hints:["The tasks need more than passwords; the scope needs less than the tenant."],
    exp:"<p>User Administrator covers user and group lifecycle, and AU scope limits it to Northpeak. Dynamic AU membership uses the same rule language as dynamic groups.</p>",
    src:["au","byTask"] };

  I["b1-4"] = { kind:"Boss: Policy Workshop", type:"config", title:"No consent prompts", obj:["1.3.5","1.3.4"], main:true,
    sit:"<p>Halcyon will also sync a few Halcyon managers into Northpeak's tenant during the transition, with cross-tenant sync from Halcyon (source) to Northpeak (target). Those managers must not see invitation consent prompts.</p>",
    fields:[
      { id:"inbound", label:"Northpeak › inbound settings for Halcyon › Allow users sync into this tenant", options:[
        { id:"on", text:"On", correct:true, feedback:"The target must accept inbound sync from the source.", impact:{acc:10} },
        { id:"off", text:"Off", feedback:"The target would reject the sync.", impact:{acc:-20} } ]},
      { id:"redeemIn", label:"Northpeak › inbound settings for Halcyon › Automatically redeem invitations", options:[
        { id:"on", text:"On", correct:true, feedback:"The target side of automatic redemption.", impact:{acc:5, ops:5} },
        { id:"off", text:"Off", feedback:"Users would see the consent prompt.", impact:{acc:-5} } ]},
      { id:"redeemOut", label:"Halcyon › outbound settings for Northpeak › Automatically redeem invitations", options:[
        { id:"on", text:"On", correct:true, feedback:"Automatic redemption must be enabled on both sides.", impact:{acc:5, ops:5} },
        { id:"off", text:"Off", feedback:"One side isn't enough; prompts would still appear.", misconception:"Automatic redemption needs only the target side", impact:{acc:-5} } ]} ],
    hints:["One setting lets the sync in; the prompt suppression needs agreement from both tenants."],
    exp:"<p>The target tenant allows inbound user sync from the source. Suppressing consent prompts requires automatic redemption in the source's <b>outbound</b> settings and the target's <b>inbound</b> settings.</p>",
    src:["xtSync","xtAccess"] };

  I["b1-5"] = { kind:"Boss: Scenario", type:"single", title:"Hei, Northpeak", obj:["1.1.6"], main:true,
    sit:"<p>Northpeak users see Halcyon's English sign-in text. Halcyon wants Norwegian sign-in text for users whose browsers are set to Norwegian, while everyone else keeps the default.</p>",
    q:"What should you configure?",
    opts:[
      { id:"a", t:"A browser-language customization for Norwegian in company branding", c:1, f:"Branding supports per-language customizations on top of the default experience.", i:[0,15,5] },
      { id:"b", t:"A second tenant for Northpeak", f:"Massive overkill for sign-in text.", i:[0,0,-30] },
      { id:"c", t:"Replace the default sign-in text with Norwegian", f:"Everyone else would see Norwegian too.", i:[0,-10,0] },
      { id:"d", t:"A Conditional Access policy for Norwegian users", f:"Conditional Access doesn't change branding.", m:"Conditional Access controls branding", i:[0,0,-5] } ],
    hints:["Branding has a default and optional variations."],
    exp:"<p>Company branding has a default sign-in experience and optional customizations for specific browser languages.</p>",
    src:["branding"] };

  I["b1-6"] = { kind:"Boss: Scenario", type:"single", title:"Group sprawl", obj:["1.1.7","1.2.2"], main:true,
    sit:"<p>After the merger, users have created hundreds of security groups. Halcyon wants only admins (Groups Administrator and above) to create security groups from now on.</p>",
    q:"Where do you make this change?",
    opts:[
      { id:"a", t:"Groups › General settings: set “Users can create security groups in Azure portals, API or PowerShell” to No", c:1, f:"That tenant group setting controls this.", i:[10,0,10] },
      { id:"b", t:"Remove everyone's User role", f:"There's no removable “User role”; default user permissions come from settings like this one.", i:[0,0,-5] },
      { id:"c", t:"A Conditional Access policy blocking the Groups blade", f:"Conditional Access doesn't target individual portal blades like this.", i:[0,-10,-5] },
      { id:"d", t:"Make every group dynamic", f:"Unrelated to who can create groups.", i:[0,0,-10] } ],
    hints:["Tenant-wide group behavior has its own settings page."],
    exp:"<p>Group settings include whether users can create security groups and Microsoft 365 groups, self-service group management and more. Restricting creation doesn't affect admins with group roles.</p>",
    src:["groupSettings","userDefault"] };

})(window.ID_CONTENT);
