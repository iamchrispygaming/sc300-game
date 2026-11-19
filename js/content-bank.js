/* Training bank: distinct scenarios used by adaptive practice, support chains, stretch challenges and review.
   Four warm-up items are woven into Mission 01 to start setting topic levels.
   difficulty: 1 Beginner, 2 Intermediate, 3 Advanced. Verified 2026-11-18. */
(function (C) {
  const I = C.items;
  const bank = (id, d, item) => { item.difficulty = d; item.bank = true; I[id] = item; };

  /* ---------- Worked examples, one per study-guide topic (shown before a support challenge) ---------- */
  C.workedExamples = {
    "1.1":"<p><b>Scenario:</b> a regional helpdesk must reset passwords only for its region.</p><ol><li><b>Name the task:</b> resetting non-admin passwords, so Password Administrator.</li><li><b>Name the scope:</b> one region, so an administrative unit containing those users.</li><li><b>Combine:</b> assign the role at the AU's scope.</li></ol><p>Least privilege means turning both dials down: <i>what</i> they can do and <i>where</i>.</p>",
    "1.2":"<p><b>Scenario:</b> new Sales hires should get a license and an app automatically.</p><ol><li>Pick a <b>security group</b> (made for access).</li><li>Make it <b>Dynamic User</b> so membership follows attributes.</li><li>Write the rule on a reliable attribute: <code>user.department -eq \"Sales\"</code>.</li><li>Assign the license and app to the group, and check users have a usage location.</li></ol>",
    "1.3":"<p><b>Scenario:</b> a partner's users must collaborate, and the partner uses Microsoft Entra.</p><ol><li><b>Who can be invited, and from where?</b> External collaboration settings.</li><li><b>How do their tenant's sign-ins and claims get trusted?</b> Cross-tenant access settings (inbound, per organization).</li><li><b>Non-Entra partners?</b> SAML/WS-Fed IdP federation or email one-time passcode.</li></ol>",
    "1.4":"<p><b>Scenario:</b> choose how hybrid users sign in.</p><ol><li>Can password hashes be in the cloud? Yes → <b>PHS</b>, the simplest and most resilient.</li><li>Must on-prem policies apply live, with no hashes in the cloud? → <b>PTA</b> with multiple agents.</li><li>Need features only an external IdP offers? → federation, as a last resort.</li></ol><p>Sync engine: Cloud Sync for lightweight and multi-forest setups; Connect Sync for device sync and PTA.</p>",
    "2.1":"<p><b>Scenario:</b> pick a method for admins.</p><ol><li>Could a fake website capture or relay the proof? Passwords, SMS, codes and push: yes.</li><li>Methods bound to the real site or device (passkeys/FIDO2, Windows Hello for Business, certificate-based authentication): no, so they're phishing-resistant.</li><li>New user with nothing registered? A Temporary Access Pass bootstraps registration.</li></ol>",
    "2.2":"<p><b>Scenario:</b> predict a Conditional Access result.</p><ol><li>List every policy whose <b>assignments</b> match (user, app, conditions), ignoring the rest.</li><li>If any matching policy says <b>Block</b>, the answer is blocked.</li><li>Otherwise the user must satisfy <b>all</b> grant requirements from all matching policies.</li></ol>",
    "2.3":"<p><b>Scenario:</b> respond to a risk detection.</p><ol><li>Is it about the <b>account</b> (for example leaked credentials)? That's user risk, fixed by a secure password change.</li><li>Is it about one <b>sign-in</b> (for example an anonymous IP)? That's sign-in risk, fixed by MFA.</li><li>Configure both in Conditional Access, in separate policies, and make sure users are MFA-registered first.</li></ol>",
    "2.4":"<p><b>Scenario:</b> route a type of traffic.</p><ol><li>Microsoft 365 services → <b>Microsoft traffic</b> profile.</li><li>Internal apps and file servers → <b>Private Access</b> (connectors plus Quick Access or per-app apps).</li><li>Everything else on the internet → <b>Internet Access</b> (filtering through security profiles linked in Conditional Access).</li></ol><p>The client on the device acquires the traffic, and profiles are evaluated in that order.</p>",
    "3.1":"<p><b>Scenario:</b> code needs to reach an Azure resource.</p><ol><li>Does it run on Azure? Use a <b>managed identity</b> (system-assigned for one resource, user-assigned for shared or long-lived).</li><li>Outside Azure? A service principal with <b>workload identity federation</b> or a certificate.</li><li>Grant the narrowest <b>data-plane</b> RBAC role on the target.</li></ol>",
    "3.2":"<p><b>Scenario:</b> restrict and integrate a SaaS app.</p><ol><li><b>Assignment required = Yes</b>, then assign the right groups (or app roles).</li><li>Configure SSO (SAML or OIDC) and, if supported, SCIM provisioning.</li><li>Limit user consent, and route the rest through the admin consent workflow.</li></ol>",
    "3.3":"<p><b>Scenario:</b> an app needs Microsoft Graph data.</p><ol><li>Is a user signed in? Yes → <b>delegated</b> permission. No → <b>application</b> permission.</li><li>Application permissions (and some delegated ones) need <b>admin consent</b>.</li><li>Request the narrowest permission, and prefer certificates or federated credentials over secrets.</li></ol>",
    "3.4":"<p><b>Scenario:</b> control a cloud app.</p><ol><li>Don't know what's used? <b>Cloud Discovery</b> plus the catalog.</li><li>Need visibility inside an approved app? An <b>app connector</b>.</li><li>Need real-time control of actions? <b>Conditional Access App Control</b> plus a session policy (or an access policy to block entry).</li></ol>",
    "4.1":"<p><b>Scenario:</b> people need a bundle of access for a while.</p><ol><li>Put the resources in a <b>catalog</b> owned by the business team.</li><li>Create an <b>access package</b> with those resource roles.</li><li>Add a <b>policy</b>: who can request, who approves, and when it expires.</li></ol>",
    "4.2":"<p><b>Scenario:</b> prove access is still needed.</p><ol><li>Choose <b>what</b> to review (group, app, package or role) and <b>who</b> reviews (owners, managers, self).</li><li>Set recurrence, recommendations and the default if reviewers don't respond.</li><li>Turn on <b>auto apply</b> so denials actually remove access.</li></ol>",
    "4.3":"<p><b>Scenario:</b> someone needs a powerful role occasionally.</p><ol><li>Make the assignment <b>eligible</b> in PIM, not active.</li><li>In role settings, require MFA or an authentication context, a justification and, for top roles, approval.</li><li>Keep activation short, and review assignments regularly.</li></ol>",
    "4.4":"<p><b>Scenario:</b> answer “who did what?”.</p><ol><li>A sign-in question → <b>sign-in logs</b>. A change → <b>audit logs</b>. Provisioning → <b>provisioning logs</b>.</li><li>Need it beyond 30 days, or queried with KQL? Route logs with <b>diagnostic settings</b> to Log Analytics (query), storage (archive) or Event Hubs (stream).</li></ol>"
  };

  /* ---------- Warm-ups woven into Mission 01 (low pressure, help set starting levels) ---------- */
  bank("w21", 1, { kind:"Warm-up", type:"single", title:"What makes it multifactor?", obj:["2.1.1"], warmup:true,
    story:"Theo, between tickets: <b>“Quick one. Why does everyone say a password plus a security question isn't MFA?”</b>",
    sit:"<p>No pressure: warm-ups like this help tune your training to you.</p>",
    q:"What makes an authentication multifactor?",
    opts:[
      { id:"a", t:"It combines factors from different categories: something you know, have or are", c:1, f:"A password (know) plus a phone or key (have) is two factors." },
      { id:"b", t:"It uses two passwords", f:"Both are “something you know”: one factor twice." },
      { id:"c", t:"It uses a password and a security question", f:"Still only “something you know”." },
      { id:"d", t:"It uses a very long password", f:"Longer, but still one factor." } ],
    hints:["Think categories, not counts."],
    exp:"<p>MFA requires two or more <b>different</b> factor types. That's why a stolen password alone isn't enough to sign in.</p>",
    src:["authMethods"] });

  bank("w31", 1, { kind:"Warm-up", type:"single", title:"A script without secrets", obj:["3.1.1"], warmup:true,
    story:"Theo again: <b>“My script on an Azure VM needs to read a storage account. Where do I put the password?”</b>",
    sit:"<p>A warm-up from a later part of the curriculum: answer from instinct.</p>",
    q:"What's the simplest secret-free option?",
    opts:[
      { id:"a", t:"Turn on a managed identity for the VM and give it a storage data role", c:1, f:"Azure handles the credential; the script just asks for a token." },
      { id:"b", t:"Paste a storage account key into the script", f:"A shared secret in a file is exactly what to avoid." },
      { id:"c", t:"Use Theo's own account and password", f:"Ties the script to a person and their password." },
      { id:"d", t:"Make the storage account public", f:"Removes protection for everyone." } ],
    hints:["Azure can manage an identity for the resource."],
    exp:"<p>Managed identities give Azure resources an identity in Microsoft Entra ID without stored secrets. You'll go deeper in Mission 13.</p>",
    src:["mi"] });

  bank("w22", 2, { kind:"Warm-up", type:"single", title:"A first Access Gate", obj:["2.2.3","2.2.2"], warmup:true,
    sit:"<p>One Conditional Access policy is on: <b>All users → BrightBoard → Grant: require multifactor authentication</b>. Maya, who registered Microsoft Authenticator this morning, opens BrightBoard from the office.</p>",
    q:"What happens?",
    opts:[
      { id:"a", t:"She's prompted for MFA, approves it, and gets in", c:1, f:"The policy applies to her and BrightBoard, and she can satisfy it." },
      { id:"b", t:"She's blocked because she's new", f:"Nothing in the policy blocks new users." },
      { id:"c", t:"She gets in without MFA because she's in the office", f:"The policy has no location condition, so the office doesn't matter." },
      { id:"d", t:"Nothing: policies only apply to admins", f:"This one targets all users." } ],
    hints:["Read the policy left to right: who, what, then the control."],
    exp:"<p>Conditional Access works like if-then: <i>if</i> the assignments match, <i>then</i> apply the controls. Mission 09 builds on this.</p>",
    src:["caOverview"] });

  bank("w43", 1, { kind:"Warm-up", type:"single", title:"Admin, but only sometimes", obj:["4.3.1"], warmup:true,
    story:"Theo: <b>“Can I have Global Admin just in case?”</b> You smile politely.",
    sit:"<p>Halcyon uses Privileged Identity Management (PIM).</p>",
    q:"Which PIM assignment type gives a role only after the person activates it, for a limited time?",
    opts:[
      { id:"a", t:"Eligible", c:1, f:"Eligible roles must be activated, usually with MFA and a justification." },
      { id:"b", t:"Active", f:"Active assignments are always on." },
      { id:"c", t:"Permanent", f:"Permanent describes duration, not just-in-time access." },
      { id:"d", t:"Guest", f:"Guest is a user type, not a PIM assignment type." } ],
    hints:["Just-in-time means not always on."],
    exp:"<p>PIM eligible assignments reduce standing privilege. Mission 19 covers settings, approvals and audits.</p>",
    src:["pim"] });

  /* ---------- 1.1 Tenant ---------- */
  bank("k11b", 1, { kind:"Scenario", type:"single", title:"Who manages Conditional Access?", obj:["1.1.1"],
    sit:"<p>Nadia's deputy will create and edit Conditional Access policies, and nothing else.</p>",
    q:"Which role is the least privileged for that?",
    opts:[
      { id:"a", t:"Conditional Access Administrator", c:1, f:"Microsoft lists it as the least privileged role for creating and editing Conditional Access policies." },
      { id:"b", t:"Global Administrator", f:"Far more than needed." },
      { id:"c", t:"Security Reader", f:"Read-only." },
      { id:"d", t:"Authentication Policy Administrator", f:"Manages the authentication methods policy, not Conditional Access." } ],
    hints:["The role name matches the feature."],
    exp:"<p>For most features there's a role named after the job. Check “least privileged roles by task” before reaching for Global Administrator.</p>",
    src:["riskConfigure","byTask"] });

  bank("k11i", 2, { kind:"Scenario", type:"single", title:"Keep users out of the admin center", obj:["1.1.7"],
    sit:"<p>Halcyon wants non-admin users to stop browsing directory data in the Microsoft Entra admin center.</p>",
    q:"Which user setting addresses this, and what's its limit?",
    opts:[
      { id:"a", t:"Set <b>Restrict access to Microsoft Entra admin center</b> to Yes. It doesn't block Microsoft Graph or PowerShell access", c:1, f:"A portal convenience control, not a security boundary." },
      { id:"b", t:"Set Users can register applications to No", f:"Controls app registration, not portal access." },
      { id:"c", t:"Change guest user access restrictions", f:"Those apply to guests, not employees." },
      { id:"d", t:"Remove the Directory Readers role from all users", f:"Regular users don't hold it; their read access comes from default user permissions." } ],
    hints:["One setting is literally named after the admin center."],
    exp:"<p>Restricting portal access hides the admin center from non-admins but doesn't stop API access. To block tools more completely, use Conditional Access or restrict default user permissions where supported.</p>",
    src:["userDefault"] });

  bank("k11a", 3, { kind:"Least Privilege Challenge", type:"single", title:"Hands off the executives", obj:["1.1.3","1.1.4","1.1.2"],
    sit:"<p>Requirements: executives' accounts must not be modifiable by tenant-wide User Administrators or Helpdesk Administrators. Only the four-person Executive Support team may manage them, including password resets.</p>",
    q:"Which design meets the requirement?",
    opts:[
      { id:"a", t:"Put the executives in a <b>restricted management</b> administrative unit and assign Executive Support User Administrator at that AU's scope", c:1, f:"Objects in a restricted management AU can be changed only by admins assigned at that AU's scope." },
      { id:"b", t:"Put them in a regular AU and assign Executive Support at its scope", f:"Tenant-wide admins could still change them." },
      { id:"c", t:"Assign the executives Global Administrator so lower admins can't touch them", f:"Massive privilege as a side effect." },
      { id:"d", t:"Put them in a role-assignable group", f:"That protects group membership, not the user accounts." } ],
    hints:["A regular AU adds admins; you need one that also excludes others."],
    exp:"<p>Restricted management AUs protect sensitive objects from tenant-level administrators. Plan carefully: only AU-scoped admins can then manage those objects.</p>",
    simp:"Highly privileged roles can still change who administers the AU itself.",
    src:["au"] });

  /* ---------- 1.2 Identities ---------- */
  bank("k12b", 1, { kind:"Scenario", type:"single", title:"Roles for a group", obj:["1.2.2","1.1.1"],
    sit:"<p>Halcyon wants to assign Helpdesk Administrator to a group instead of to people one by one.</p>",
    q:"Which group can receive Microsoft Entra role assignments?",
    opts:[
      { id:"a", t:"A new group created with “Microsoft Entra roles can be assigned to the group” turned on, with Assigned membership", c:1, f:"That property can only be set at creation, and membership can't be dynamic." },
      { id:"b", t:"Any dynamic security group", f:"Role-assignable groups can't be dynamic." },
      { id:"c", t:"An existing group, by editing its settings later", f:"The role-assignable property can only be set when the group is created." },
      { id:"d", t:"A distribution list", f:"Not supported for role assignment." } ],
    hints:["The property has to be chosen at birth."],
    exp:"<p>Role-assignable groups are protected: only certain privileged roles and owners can manage them, so a group admin can't quietly add themselves to a role.</p>",
    src:["rolesAssign"] });

  bank("k12i", 2, { kind:"Identity Detective", type:"single", title:"Too many devices", obj:["1.2.5"],
    sit:"<p>Jun can't register his new phone. The error says he has reached the device limit. He's replaced several phones over the years.</p>",
    q:"What's the best fix?",
    opts:[
      { id:"a", t:"Remove his stale devices (or raise <b>Maximum number of devices per user</b> in device settings if the limit is too low)", c:1, f:"Old registrations count toward the limit." },
      { id:"b", t:"Make him a Cloud Device Administrator", f:"Gives him admin rights over devices instead of fixing the limit." },
      { id:"c", t:"Disable device registration", f:"Then nobody can register." },
      { id:"d", t:"Reset his password", f:"Unrelated to device limits." } ],
    hints:["Count what's already registered."],
    exp:"<p>Device settings include a per-user maximum. Clean up stale devices regularly; that also improves Conditional Access decisions and reporting.</p>",
    src:["deviceSettings"] });

  bank("k12a", 3, { kind:"Identity Detective", type:"single", title:"Two licenses, one conflict", obj:["1.2.6","1.2.2"],
    sit:"<p>Lena is in two licensing groups. One assigns Microsoft 365 E3, the other assigns a product whose service plan can't coexist with a plan in E3.</p>",
    ev:[ { kind:"table", title:"Users › Lena › Licenses (simulated)", columns:["Product","Assignment path","State","Error (paraphrased)"], rows:[
      ["Microsoft 365 E3","GRP-Finance","Active","—"],["Product X","GRP-Analytics","Error","Conflicting service plans"] ] } ],
    q:"What's the right way to resolve it?",
    opts:[
      { id:"a", t:"Decide which product Lena needs, then remove her from the other group or disable the conflicting service plan in one group's license options", c:1, f:"Group licensing can't assign mutually exclusive plans to one user." },
      { id:"b", t:"Reprocess the user repeatedly until it works", f:"Nothing changes until the conflict is removed." },
      { id:"c", t:"Assign both products directly", f:"Direct assignment hits the same conflict." },
      { id:"d", t:"Set her usage location", f:"That's a different error." } ],
    hints:["The error names the problem precisely."],
    exp:"<p>Group-based licensing reports per-user errors such as conflicting service plans, not enough licenses or missing dependencies. Fix the design, not the symptom.</p>",
    src:["groupLicenseProblems"] });

  bank("k12a2", 3, { kind:"Policy Workshop", type:"single", title:"Three conditions, one rule", obj:["1.2.2"],
    sit:"<p>A dynamic group must include Marketing employees located in Canada (usage location CA), but never contractors (<code>employeeType</code> = Contractor).</p>",
    q:"Which rule meets all three conditions?",
    opts:[
      { id:"a", t:"<code>(user.department -eq \"Marketing\") -and (user.usageLocation -eq \"CA\") -and (user.employeeType -ne \"Contractor\")</code>", c:1, f:"All three must be true." },
      { id:"b", t:"<code>(user.department -eq \"Marketing\") -or (user.usageLocation -eq \"CA\")</code>", f:"Anyone in Canada, or any marketer anywhere, gets in, including contractors." },
      { id:"c", t:"<code>(user.department -eq \"Marketing\") -and (user.usageLocation -eq \"CA\")</code>", f:"Misses the contractor exclusion." },
      { id:"d", t:"<code>(user.department -eq \"Marketing\") -and (user.employeeType -eq \"Contractor\")</code>", f:"Selects exactly the people to exclude." } ],
    hints:["Every requirement must hold at once."],
    exp:"<p>Combine expressions with <code>-and</code>/<code>-or</code> and parentheses, and use <code>-ne</code> to exclude values. Validate rules against sample users before saving.</p>",
    src:["dynamic"] });

  /* ---------- 1.3 External ---------- */
  bank("k13b", 1, { kind:"Scenario", type:"single", title:"Guest or member?", obj:["1.3.3"],
    sit:"<p>Theo asks why some external people show <b>User type: Member</b>.</p>",
    q:"What does User type control?",
    opts:[
      { id:"a", t:"Default directory permissions. External users can be members (for example through cross-tenant sync), and employees can be guests", c:1, f:"User type and whether someone is external are separate ideas." },
      { id:"b", t:"Whether the user can sign in", f:"That's the account enabled setting." },
      { id:"c", t:"Which country the user lives in", f:"Unrelated." },
      { id:"d", t:"Whether MFA is required", f:"Conditional Access decides that." } ],
    hints:["Permissions, not geography."],
    exp:"<p>A B2B user object has a user type (Guest or Member) and an identity source. Guests get more limited default permissions.</p>",
    src:["b2bProps"] });

  bank("k13i", 2, { kind:"Scenario", type:"single", title:"Shared channels", obj:["1.3.4"],
    sit:"<p>Halcyon employees need to join Teams shared channels hosted by Harborline, without becoming guests in Harborline's tenant.</p>",
    q:"What must be configured?",
    opts:[
      { id:"a", t:"B2B direct connect: Halcyon allows it outbound for Harborline, and Harborline allows it inbound for Halcyon", c:1, f:"Direct connect needs mutual configuration in cross-tenant access settings." },
      { id:"b", t:"Invite Halcyon users as guests in Harborline", f:"That's B2B collaboration, not direct connect." },
      { id:"c", t:"Cross-tenant synchronization", f:"For tenants in the same organization." },
      { id:"d", t:"External collaboration settings only", f:"Those govern B2B collaboration invitations, not direct connect." } ],
    hints:["Shared channels use a different B2B feature than guest accounts."],
    exp:"<p>B2B direct connect is off by default and requires both organizations to allow it. Users stay in their home tenant.</p>",
    src:["xtAccess"] });

  bank("k13a", 3, { kind:"Policy Workshop", type:"single", title:"Only Harborline gets in", obj:["1.3.4","1.3.1"],
    sit:"<p>Requirements: external users from other Microsoft Entra tenants must be blocked from Halcyon's resources by default, even if someone invited them. Harborline users must still collaborate as guests.</p>",
    q:"Which configuration fits?",
    opts:[
      { id:"a", t:"Cross-tenant access default inbound settings: block B2B collaboration. Add Harborline as an organization with inbound B2B collaboration allowed", c:1, f:"Default deny, explicit allow for one tenant." },
      { id:"b", t:"An allowlist in external collaboration settings only", f:"Controls new invitations; it doesn't block inbound access from guests already invited from other tenants." },
      { id:"c", t:"Block all guests in a Conditional Access policy", f:"Would block Harborline too." },
      { id:"d", t:"Disable email one-time passcode", f:"Unrelated to Entra-tenant guests." } ],
    hints:["Default plus per-organization override."],
    exp:"<p>Cross-tenant access settings control inbound and outbound B2B collaboration and direct connect, with defaults and organizational overrides (optionally per user group and app). External collaboration settings control who can be invited.</p>",
    src:["xtAccess","extCollab"] });

  /* ---------- 1.4 Hybrid ---------- */
  bank("k14b", 1, { kind:"Scenario", type:"single", title:"Sync now, please", obj:["1.4.1"],
    sit:"<p>You changed a user's department in AD and don't want to wait for the next scheduled Connect Sync cycle.</p>",
    q:"What starts a delta sync immediately on the Connect Sync server?",
    opts:[
      { id:"a", t:"<code>Start-ADSyncSyncCycle -PolicyType Delta</code>", c:1, f:"Runs a delta cycle now." },
      { id:"b", t:"<code>Connect-MgGraph</code>", f:"Connects to Microsoft Graph; doesn't sync." },
      { id:"c", t:"Restart the domain controller", f:"Doesn't trigger sync." },
      { id:"d", t:"Reset the user's password", f:"Unrelated." } ],
    hints:["The cmdlet name says what it starts."],
    exp:"<p>Delta sync processes changes; <code>-PolicyType Initial</code> runs a full sync, which is needed after some configuration changes.</p>",
    src:["connectSync"] });

  bank("k14i", 2, { kind:"Scenario", type:"single", title:"Test one user first", obj:["1.4.2"],
    sit:"<p>You changed a Cloud Sync attribute mapping and want to verify it for one user before it reaches everyone.</p>",
    q:"What should you use?",
    opts:[
      { id:"a", t:"Provision on demand for that user in the Cloud Sync configuration", c:1, f:"Cloud Sync can provision a single user immediately and show each step." },
      { id:"b", t:"Run Start-ADSyncSyncCycle", f:"A Connect Sync cmdlet." },
      { id:"c", t:"Wait for the next cycle and check everyone", f:"Tests in production at full scale." },
      { id:"d", t:"Create the user manually in Entra", f:"Doesn't test the sync configuration." } ],
    hints:["Cloud Sync has an “on demand” feature."],
    exp:"<p>On-demand provisioning is one of Cloud Sync's advantages: it shows the attribute flow and any errors for a single object.</p>",
    src:["cloudSync"] });

  bank("k14a", 3, { kind:"Identity Detective", type:"single", title:"Sync stopped itself", obj:["1.4.1"],
    sit:"<p>To stop syncing contractors, you removed the Contractors OU (820 users) from Connect Sync's OU filtering. The next export didn't run.</p>",
    ev:[ { kind:"kv", title:"Synchronization Service (simulated)", fields:[["Run profile","Export"],["Status","stopped-deletion-threshold-exceeded"],["Pending deletes","820"],["Threshold","500"]] } ],
    q:"What's the right next step?",
    opts:[
      { id:"a", t:"Confirm the 820 deletes are intended, temporarily disable the export deletion threshold, run sync, then re-enable the threshold", c:1, f:"The safety catch did its job; release it deliberately and restore it." },
      { id:"b", t:"Uninstall Connect Sync", f:"Overreaction to a safety feature." },
      { id:"c", t:"Permanently disable the deletion threshold", f:"Removes protection against accidental mass deletes." },
      { id:"d", t:"Delete the contractors manually in Entra while sync is stopped", f:"Synced objects should be managed through sync." } ],
    hints:["This is a protection, not a fault."],
    exp:"<p>Connect Sync's accidental delete prevention stops exports that delete more than 500 objects by default. Verify intent, disable it briefly, sync, and turn it back on.</p>",
    src:["connectSync"] });

  /* ---------- 2.1 Authentication (w21 is the beginner bank item) ---------- */
  bank("k21i", 2, { kind:"Scenario", type:"single", title:"Stolen laptop", obj:["2.1.6"],
    sit:"<p>Ana's Microsoft Entra joined laptop was stolen from her car. She still has her phone and is otherwise fine.</p>",
    q:"What's the best immediate response?",
    opts:[
      { id:"a", t:"Disable the device in Microsoft Entra ID (and wipe it through Intune), and revoke Ana's sessions", c:1, f:"Stops the device and any tokens on it." },
      { id:"b", t:"Delete Ana's account", f:"Punishes the victim and destroys data." },
      { id:"c", t:"Reset her MFA methods only", f:"Tokens on the laptop may still be valid." },
      { id:"d", t:"Wait for her to report suspicious activity", f:"Too late." } ],
    hints:["Deal with the device and the sessions."],
    exp:"<p>Disabling the device prevents device-based sign-ins and Conditional Access device claims. Revoking sessions invalidates refresh tokens issued to the laptop.</p>",
    src:["revoke"] });

  bank("k21a", 3, { kind:"Identity Detective", type:"single", title:"Lockouts during a spray", obj:["2.1.7","1.4.4"],
    sit:"<p>Halcyon uses pass-through authentication. During a password spray, legitimate users' on-premises AD accounts are getting locked out.</p>",
    ev:[ { kind:"kv", title:"Lockout settings (simulated)", fields:[["AD account lockout threshold","5 attempts"],["Entra smart lockout threshold","10 attempts"],["Entra smart lockout duration","60 seconds"]] } ],
    q:"Which change best protects AD accounts?",
    opts:[
      { id:"a", t:"Set the Entra smart lockout threshold below the AD threshold (for example 3), with a duration longer than AD's reset window", c:1, f:"Entra locks attackers out before failed attempts reach AD." },
      { id:"b", t:"Raise the AD lockout threshold to 50", f:"Weakens on-prem protection." },
      { id:"c", t:"Disable smart lockout", f:"Removes cloud-side protection entirely." },
      { id:"d", t:"Switch to Seamless SSO", f:"Not a sign-in method and doesn't affect lockout." } ],
    hints:["Which threshold is hit first right now?"],
    exp:"<p>With PTA, configure smart lockout so Microsoft Entra ID locks out before AD does: a threshold lower than AD's and a duration longer than AD's lockout counter reset.</p>",
    src:["pwProtect","pta"] });

  /* ---------- 2.2 Conditional Access (w22 is the intermediate bank item) ---------- */
  bank("k22b", 1, { kind:"Scenario", type:"single", title:"What report-only does", obj:["2.2.1","2.2.4"],
    sit:"<p>Theo created a policy and set it to <b>Report-only</b>.</p>",
    q:"What happens when users sign in?",
    opts:[
      { id:"a", t:"The policy is evaluated and its result is logged, but nothing is enforced", c:1, f:"Ideal for measuring impact safely." },
      { id:"b", t:"It's enforced only for admins", f:"Report-only enforces for nobody." },
      { id:"c", t:"It's ignored entirely", f:"It's evaluated and logged." },
      { id:"d", t:"Users see a warning but can continue", f:"Users see nothing." } ],
    hints:["The name says it."],
    exp:"<p>Report-only results appear in sign-in logs and workbooks. Use them before switching a policy to On.</p>",
    src:["caReportOnly"] });

  bank("k22a", 3, { kind:"Access Gate", type:"single", title:"The guest and the finance app", obj:["2.2.2","2.2.3","2.2.4"],
    sit:"<p>Kai, a Harborline guest who completed MFA in his home tenant (trusted by Halcyon), opens the Ledgerly finance app from a Harborline-managed laptop that isn't enrolled in Halcyon's Intune.</p>",
    ev:[ { kind:"table", title:"Policies (simulated)", columns:["Policy","Users","Resources","Control"], rows:[
      ["CA01 MFA","All users (excl. emergency)","All resources","Grant: MFA"],
      ["CA20 Finance devices","All users (excl. emergency)","Ledgerly","Grant: require compliant device"],
      ["CA21 Guests off finance","Guest or external users","Ledgerly","Block"] ] } ],
    q:"What's the outcome, and which policy decides it?",
    opts:[
      { id:"a", t:"Blocked by CA21: a matching Block wins, regardless of MFA or device", c:1, f:"Block in any applicable policy ends evaluation." },
      { id:"b", t:"Allowed: trusted MFA satisfies CA01", f:"CA01 is satisfied, but CA21 blocks." },
      { id:"c", t:"Blocked by CA20 only", f:"CA20 would also fail, but CA21's Block alone decides the outcome." },
      { id:"d", t:"Allowed, because guests are excluded from Conditional Access", f:"Guests are included in “All users”." } ],
    hints:["Find the Block first."],
    exp:"<p>When troubleshooting, list every policy that applies. A Block decides the outcome even if other policies' requirements could be met. The sign-in log shows each policy's result.</p>",
    src:["caOverview","signinLogs"] });

  /* ---------- 2.3 ID Protection ---------- */
  bank("k23b", 1, { kind:"Scenario", type:"single", title:"Which kind of risk?", obj:["2.3.1","2.3.2"],
    sit:"<p>Microsoft finds Leo's Halcyon username and password in a public breach dump.</p>",
    q:"Which risk does this raise?",
    opts:[
      { id:"a", t:"User risk: the account itself is likely compromised", c:1, f:"Leaked credentials is a user risk detection." },
      { id:"b", t:"Sign-in risk for one sign-in", f:"No specific sign-in is involved." },
      { id:"c", t:"Device risk", f:"Not an ID Protection risk type for users." },
      { id:"d", t:"No risk until he signs in", f:"The credential is already exposed." } ],
    hints:["Is it about one sign-in, or the account?"],
    exp:"<p>User risk reflects the likelihood an identity is compromised; sign-in risk reflects the likelihood a sign-in isn't from the owner.</p>",
    src:["riskPolicies"] });

  bank("k23i", 2, { kind:"Identity Detective", type:"single", title:"Travel, not attack", obj:["2.3.4"],
    sit:"<p>Priya's sign-in from Lisbon is flagged as risky (unfamiliar sign-in properties). She confirms she's at a conference there, and her sign-in used her passkey.</p>",
    q:"What's the right action on that risky sign-in?",
    opts:[
      { id:"a", t:"Confirm sign-in safe", c:1, f:"Tells ID Protection this was legitimate, which helps future detections." },
      { id:"b", t:"Confirm sign-in compromised", f:"It wasn't." },
      { id:"c", t:"Reset her password", f:"Nothing was compromised." },
      { id:"d", t:"Block her until she's home", f:"Disrupts legitimate work." } ],
    hints:["Give feedback that matches the facts."],
    exp:"<p>Admin feedback (safe or compromised) on risky sign-ins and users improves detection quality. Use it whenever an investigation reaches a conclusion.</p>",
    src:["riskRemediate"] });

  bank("k23a", 3, { kind:"Identity Detective", type:"single", title:"Blocked by the safety net", obj:["2.3.2","2.3.3"],
    sit:"<p>After you enabled a sign-in risk policy requiring MFA, some warehouse users are blocked when their sign-ins are rated medium risk.</p>",
    ev:[ { kind:"table", title:"Sign-in logs (simulated)", columns:["User","Sign-in risk","MFA registered","Result"], rows:[
      ["Ana Ortiz","Medium","Yes","Success after MFA"],["Bo Lund","Medium","No","Failure: MFA required but not registered"],["Cy Park","Medium","No","Failure: MFA required but not registered"] ] } ],
    q:"What's the best fix?",
    opts:[
      { id:"a", t:"Get these users registered for MFA (registration campaign, Temporary Access Pass for bootstrapping), keeping the policy", c:1, f:"Users must already be registered to self-remediate sign-in risk." },
      { id:"b", t:"Exclude everyone not registered", f:"Leaves the riskiest accounts unprotected." },
      { id:"c", t:"Change the grant to password change", f:"That's the user-risk remediation, and it also needs MFA." },
      { id:"d", t:"Disable the policy", f:"Removes protection for everyone." } ],
    hints:["Compare the successful row with the failures."],
    exp:"<p>Sign-in risk policies that require MFA only help users who can perform MFA. Drive registration before or alongside enforcement.</p>",
    src:["riskPolicies","regCampaign"] });

  /* ---------- 2.4 Global Secure Access ---------- */
  bank("k24b", 1, { kind:"Scenario", type:"single", title:"Where does Exchange traffic go?", obj:["2.4.4"],
    sit:"<p>Theo asks which Global Secure Access profile handles traffic to Exchange Online and SharePoint Online.</p>",
    q:"Which one?",
    opts:[
      { id:"a", t:"The Microsoft traffic profile", c:1, f:"It covers Microsoft services such as Entra ID, Exchange Online and SharePoint Online." },
      { id:"b", t:"The Private Access profile", f:"For private, internal resources." },
      { id:"c", t:"The Internet Access profile", f:"For general internet and SaaS traffic." },
      { id:"d", t:"None: Microsoft services bypass Global Secure Access", f:"They have their own profile." } ],
    hints:["It's named after the vendor."],
    exp:"<p>The three profiles are Microsoft traffic, Private Access and Internet Access, evaluated in that order.</p>",
    src:["gsaProfiles"] });

  bank("k24i", 2, { kind:"Scenario", type:"single", title:"One app, stricter rules", obj:["2.4.2"],
    sit:"<p>Most internal resources are in Quick Access. The internal payroll web app needs its own Conditional Access policy requiring a compliant device.</p>",
    q:"How do you set that up?",
    opts:[
      { id:"a", t:"Create a per-app Private Access app (an enterprise app) for payroll, and target it with its own Conditional Access policy", c:1, f:"Per-app access gives that app separate assignment and policy." },
      { id:"b", t:"Add payroll's IP to Quick Access twice", f:"Duplicates don't create separate policy." },
      { id:"c", t:"Use a web content filtering policy", f:"That's Internet Access." },
      { id:"d", t:"Move payroll to the Microsoft traffic profile", f:"That profile is for Microsoft services." } ],
    hints:["Give the app its own identity in Entra."],
    exp:"<p>Private Access apps are enterprise applications, so you can assign users and apply Conditional Access per app, while Quick Access covers the broad set.</p>",
    src:["gsaPrivate"] });

  bank("k24a", 3, { kind:"Identity Detective", type:"single", title:"The filter that didn't filter", obj:["2.4.3","2.4.1"],
    sit:"<p>A web content filtering policy blocks Gambling. Jun still reached a gambling site from his corporate laptop. The Global Secure Access client is installed and connected on his device.</p>",
    ev:[ { kind:"kv", title:"Configuration review (simulated)", fields:[["Security profile","SP-Baseline (includes Block Gambling)"],["Linked Conditional Access policy","CA-GSA-Baseline"],["CA-GSA-Baseline users","Group: GSA-Pilot"],["Jun's groups","Marketing, BrightBoard-Users"]] } ],
    q:"What's the cause and fix?",
    opts:[
      { id:"a", t:"Jun isn't in the group targeted by the Conditional Access policy that links the security profile. Add him (or widen the policy's assignment)", c:1, f:"The profile reaches users only through the linked policy." },
      { id:"b", t:"The client must be reinstalled", f:"The evidence says it's connected." },
      { id:"c", t:"Gambling can't be filtered", f:"It's a standard category." },
      { id:"d", t:"Move the block into Quick Access", f:"Quick Access is for private resources." } ],
    hints:["Follow the chain: policy → profile → Conditional Access → user."],
    exp:"<p>Internet Access filtering applies to users through security profiles linked in Conditional Access session settings. If the user isn't targeted, the profile doesn't apply.</p>",
    src:["gsaInternet"] });

  /* ---------- 3.1 Workload identities (w31 is the beginner bank item) ---------- */
  bank("k31i", 2, { kind:"Scenario", type:"single", title:"Reuse the pipeline identity", obj:["3.1.3","3.1.2"],
    sit:"<p>A new App Service app must use the existing user-assigned managed identity <b>id-pipeline</b>, which already has the right role assignments.</p>",
    q:"What do you do?",
    opts:[
      { id:"a", t:"In the app's Identity settings, add id-pipeline under User assigned", c:1, f:"The app can now request tokens as id-pipeline." },
      { id:"b", t:"Enable a system-assigned identity and copy id-pipeline's roles", f:"Works, but duplicates assignments and ignores the existing identity." },
      { id:"c", t:"Create a client secret for id-pipeline", f:"Managed identities don't use secrets." },
      { id:"d", t:"Add the app to id-pipeline's group", f:"Managed identities aren't assigned through groups like that." } ],
    hints:["User-assigned identities are attached to resources."],
    exp:"<p>One user-assigned identity can be attached to many resources; each then authenticates as that identity.</p>",
    src:["miManage"] });

  bank("k31i2", 2, { kind:"Identity Detective", type:"single", title:"Which identity did it pick?", obj:["3.1.4"],
    sit:"<p>A VM has two user-assigned managed identities attached. The code uses DefaultAzureCredential with no options and gets an authorization error, because it's using the identity that lacks the storage role.</p>",
    q:"What's the fix?",
    opts:[
      { id:"a", t:"Specify the intended identity's client ID in the credential options", c:1, f:"With multiple identities, tell the SDK which one to use." },
      { id:"b", t:"Give both identities Owner on the subscription", f:"Massive overprivilege to avoid one line of configuration." },
      { id:"c", t:"Remove managed identities and use a secret", f:"A step backwards." },
      { id:"d", t:"Restart the VM", f:"Doesn't change which identity is selected." } ],
    hints:["Ambiguity is the problem."],
    exp:"<p>When more than one user-assigned identity is attached, specify the client ID (or resource ID) so the token comes from the identity that holds the role.</p>",
    src:["mi","miAccess"] });

  bank("k31a", 3, { kind:"Least Privilege Challenge", type:"single", title:"Containers, a vault and a database", obj:["3.1.1","3.1.4","3.1.2"],
    sit:"<p>A containerized app on Azure reads secrets from one Key Vault and reads data from an Azure SQL database using Microsoft Entra authentication. Containers and staging slots are rebuilt often, and the identity must stay the same.</p>",
    q:"Which design is least privilege and secret-free?",
    opts:[
      { id:"a", t:"A user-assigned managed identity, Key Vault Secrets User on that vault only, and a contained database user for the identity with read-only database roles", c:1, f:"Stable identity, narrow data-plane access in both services." },
      { id:"b", t:"A system-assigned identity with Key Vault Administrator", f:"Changes on rebuild, and the role can manage the vault." },
      { id:"c", t:"A service principal with a client secret in an environment variable", f:"Reintroduces a secret." },
      { id:"d", t:"A user-assigned identity with Contributor on the resource group", f:"Control-plane power, and no data access to secrets or tables." } ],
    hints:["Stable, narrow, and data-plane in each service."],
    exp:"<p>Each target service authorizes the identity in its own way: Azure RBAC data roles for Key Vault, database users and roles for Azure SQL. Grant only what the app reads.</p>",
    src:["mi","miAccess"] });

  /* ---------- 3.2 Enterprise apps ---------- */
  bank("k32b", 1, { kind:"Scenario", type:"single", title:"What's the gallery?", obj:["3.2.4"],
    sit:"<p>Theo finds “Ledgerly” in the Microsoft Entra application gallery.</p>",
    q:"What does that mean?",
    opts:[
      { id:"a", t:"It's a preintegrated app template with known SSO (and often provisioning) settings", c:1, f:"Gallery apps speed up integration." },
      { id:"b", t:"Microsoft has security-certified it for all uses", f:"Gallery listing isn't a blanket certification." },
      { id:"c", t:"It's already enabled for all users", f:"You still add and assign it." },
      { id:"d", t:"It's free", f:"Licensing is between you and the vendor." } ],
    hints:["Think “template”."],
    exp:"<p>For apps not in the gallery, add a non-gallery (custom) app and configure SAML or OIDC manually.</p>",
    src:["samlSso"] });

  bank("k32i", 2, { kind:"Identity Detective", type:"single", title:"Need admin approval", obj:["3.2.6"],
    sit:"<p>Users opening a new reporting app see “Need admin approval”. The admin consent workflow is enabled.</p>",
    q:"What's happening, and what's the path forward?",
    opts:[
      { id:"a", t:"The app requests permissions users aren't allowed to consent to; users submit a request, and reviewers grant admin consent after checking the permissions", c:1, f:"Working as designed." },
      { id:"b", t:"The app is broken and must be deleted", f:"It's a consent requirement." },
      { id:"c", t:"Users need Application Administrator", f:"Never give users admin roles to get around consent." },
      { id:"d", t:"Turn on user consent for all apps", f:"Removes the safeguard for every app." } ],
    hints:["The message names who must act."],
    exp:"<p>Reviewers see the requested permissions and can grant tenant-wide admin consent, deny, or block the request.</p>",
    src:["adminConsentWorkflow","userConsent"] });

  bank("k32a", 3, { kind:"Scenario", type:"single", title:"Freeze the suspicious app", obj:["3.2.1","3.2.6"],
    sit:"<p>An enterprise app integrated last month is behaving suspiciously. Requirements: stop all sign-ins to it immediately, but keep its configuration, assignments and consent records for the investigation.</p>",
    q:"What's the best first action?",
    opts:[
      { id:"a", t:"Set <b>Enabled for users to sign in?</b> to No on the enterprise app", c:1, f:"Stops token issuance while preserving everything for investigation." },
      { id:"b", t:"Delete the enterprise app", f:"Destroys the evidence." },
      { id:"c", t:"Remove all user assignments", f:"Loses records, and if assignment isn't required, users could still sign in." },
      { id:"d", t:"Hide it from My Apps", f:"Hiding doesn't stop sign-in." } ],
    hints:["Disable, don't destroy."],
    exp:"<p>Disabling sign-in on the service principal blocks users and the app from getting tokens. Then review audit logs, consents and permissions before deciding on cleanup.</p>",
    src:["appProps"] });

  /* ---------- 3.3 App registrations ---------- */
  bank("k33b", 1, { kind:"Scenario", type:"single", title:"Two objects", obj:["3.3.2"],
    sit:"<p>Omar registers Dispatch in Halcyon's tenant.</p>",
    q:"Which objects exist afterwards?",
    opts:[
      { id:"a", t:"An application object (the app registration) and a service principal (enterprise app) in Halcyon's tenant", c:1, f:"The application is the blueprint; the service principal is its local instance." },
      { id:"b", t:"Only a service principal", f:"There's also the application object." },
      { id:"c", t:"A user account for the app", f:"Apps aren't users." },
      { id:"d", t:"A managed identity", f:"That's a different kind of identity." } ],
    hints:["Blueprint and instance."],
    exp:"<p>For multitenant apps, each customer tenant gets its own service principal, while the application object stays in the home tenant.</p>",
    src:["appReg"] });

  bank("k33i", 2, { kind:"Identity Detective", type:"single", title:"Not granted", obj:["3.3.4"],
    sit:"<p>Dispatch requests delegated <code>Directory.Read.All</code>. Users get a consent error, and API permissions show “Not granted for Halcyon”.</p>",
    q:"What's the fix?",
    opts:[
      { id:"a", t:"An admin reviews the permission and grants admin consent (or the app requests something narrower)", c:1, f:"This delegated permission requires admin consent." },
      { id:"b", t:"Each user consents themselves", f:"Users can't consent to admin-restricted permissions." },
      { id:"c", t:"Switch to application permission", f:"Broader still, and also needs admin consent." },
      { id:"d", t:"Add a client secret", f:"Unrelated to consent." } ],
    hints:["Some delegated permissions are admin-only."],
    exp:"<p>Permissions are marked as requiring admin consent when they're high impact. Ask whether a narrower permission (such as User.Read or User.ReadBasic.All) would do.</p>",
    src:["permissions"] });

  bank("k33a", 3, { kind:"Identity Detective", type:"single", title:"No roles in the token", obj:["3.3.5","3.3.4"],
    sit:"<p>A background service calls Dispatch's API with a client-credentials token. The API rejects it because there's no <code>roles</code> claim.</p>",
    ev:[ { kind:"kv", title:"Dispatch app role (simulated)", fields:[["Display name","Routes.Manage"],["Allowed member types","Users/Groups"],["Assigned to background service","—"]] } ],
    q:"What fixes it?",
    opts:[
      { id:"a", t:"Allow Applications as a member type for Routes.Manage, add it as an application permission on the service's registration, and grant admin consent", c:1, f:"Then client-credentials tokens carry the role." },
      { id:"b", t:"Add Routes.Manage as a delegated scope", f:"The service has no user, so it can't use delegated scopes." },
      { id:"c", t:"Assign the service to the Dispatchers group", f:"Group membership doesn't grant the service an application permission; the role must allow Applications and be granted to the app." },
      { id:"d", t:"Give the service Application Administrator", f:"A directory role, not authorization inside Dispatch." } ],
    hints:["Read the allowed member types."],
    exp:"<p>App roles that allow Applications appear to other apps as application permissions on your API. After admin consent, the role appears in the app-only token's roles claim.</p>",
    src:["appRoles","permissions"] });

  bank("k33a2", 3, { kind:"Identity Detective", type:"single", title:"Wrong audience", obj:["3.3.3","3.3.4"],
    sit:"<p>Dispatch's single-page app gets a token and calls Dispatch's own API, which returns 401.</p>",
    ev:[ { kind:"kv", title:"Decoded access token (simulated)", fields:[["aud","00000003-0000-0000-c000-000000000000 (Microsoft Graph)"],["scp","User.Read"],["API expects aud","api://dispatch-api"]] } ],
    q:"What's the fix?",
    opts:[
      { id:"a", t:"Expose a scope on the API registration (for example api://dispatch-api/Routes.Read) and have the SPA request that scope", c:1, f:"The token must be issued for the API's audience." },
      { id:"b", t:"Add a client secret to the SPA", f:"SPAs can't keep secrets, and the audience is the issue." },
      { id:"c", t:"Have the API accept Graph tokens", f:"APIs must not accept tokens issued for other audiences." },
      { id:"d", t:"Grant Directory.Read.All", f:"A Graph permission doesn't change the audience." } ],
    hints:["Who was the token issued for?"],
    exp:"<p>Each access token is for one resource (aud). To call your own API, define an exposed scope and request it; validate aud, issuer and signature in the API.</p>",
    src:["permissions","appAuth"] });

  /* ---------- 3.4 Defender for Cloud Apps ---------- */
  bank("k34b", 1, { kind:"Scenario", type:"single", title:"What is a CASB?", obj:["3.4.1"],
    sit:"<p>Theo hears that Microsoft Defender for Cloud Apps is a CASB.</p>",
    q:"What does a cloud access security broker do?",
    opts:[
      { id:"a", t:"Gives visibility into and control over cloud app usage, data and sessions", c:1, f:"Discovery, app connectors and session control are all CASB functions." },
      { id:"b", t:"Synchronizes users from AD", f:"That's Connect Sync or Cloud Sync." },
      { id:"c", t:"Issues certificates", f:"That's a PKI." },
      { id:"d", t:"Hosts Azure VMs", f:"Unrelated." } ],
    hints:["Visibility and control."],
    exp:"<p>Defender for Cloud Apps discovers shadow IT, connects to sanctioned apps through APIs, and controls sessions through Conditional Access App Control.</p>",
    src:["mdcaDiscovery"] });

  bank("k34i", 2, { kind:"Scenario", type:"single", title:"First step to session control", obj:["3.4.4"],
    sit:"<p>You want real-time session control for a SAML app that uses Microsoft Entra SSO.</p>",
    q:"What do you configure first?",
    opts:[
      { id:"a", t:"A Conditional Access policy for the app with the session control <b>Use Conditional Access App Control</b>", c:1, f:"That routes sessions to Defender for Cloud Apps." },
      { id:"b", t:"An app connector", f:"API-level, not real-time sessions." },
      { id:"c", t:"A Cloud Discovery log upload", f:"Discovery doesn't control sessions." },
      { id:"d", t:"Mark the app unsanctioned", f:"Blocks rather than controls." } ],
    hints:["Sessions start at sign-in."],
    exp:"<p>After the Conditional Access policy routes sessions, create access or session policies in Defender for Cloud Apps.</p>",
    src:["mdcaProxy"] });

  bank("k34a", 3, { kind:"Scenario", type:"single", title:"Two populations, two risks", obj:["3.4.5","3.4.4","3.4.6"],
    sit:"<p>Requirements: (1) contractors on unmanaged devices may view the CRM but can't download; (2) employees on managed devices are unrestricted; (3) any OAuth app requesting high-privilege mail permissions is flagged for review.</p>",
    q:"Which combination meets all three?",
    opts:[
      { id:"a", t:"CA App Control for contractors' CRM sessions plus a session policy blocking downloads on unmanaged devices; an OAuth app policy for high-privilege mail permissions", c:1, f:"Each requirement gets the narrowest matching control." },
      { id:"b", t:"Block the CRM for everyone on unmanaged devices", f:"Contractors need view access." },
      { id:"c", t:"A session policy for all users and no OAuth policy", f:"Over-applies, and misses requirement 3." },
      { id:"d", t:"Mark the CRM unsanctioned", f:"Blocks the business app." } ],
    hints:["Scope each control to the population it's for."],
    exp:"<p>Target CA App Control policies to the users and devices that need control, and use OAuth app policies (and app governance) for consented-app risk.</p>",
    src:["mdcaSession","mdcaOAuth"] });

  /* ---------- 4.1 Entitlement management ---------- */
  bank("k41b", 1, { kind:"Scenario", type:"single", title:"Where to ask", obj:["4.1.4"],
    sit:"<p>A new analyst wants to request the Finance-Reports access package.</p>",
    q:"Where does she request it?",
    opts:[
      { id:"a", t:"The My Access portal", c:1, f:"Users browse and request access packages there." },
      { id:"b", t:"The Microsoft Entra admin center", f:"For admins." },
      { id:"c", t:"By email to IT", f:"Bypasses the workflow." },
      { id:"d", t:"My Apps collections", f:"Collections organize assigned apps." } ],
    hints:["Same portal reviewers use."],
    exp:"<p>Users can see access packages they're eligible to request (or follow a direct link), then track request status.</p>",
    src:["emOverview"] });

  bank("k41i", 2, { kind:"Scenario", type:"single", title:"Why do you need it?", obj:["4.1.4","4.1.3"],
    sit:"<p>Approvers complain they can't tell why people request the Finance-Reports package.</p>",
    q:"What should you change in the policy?",
    opts:[
      { id:"a", t:"Require requestor justification (and add requestor questions, such as the project code)", c:1, f:"Approvers see the answers with each request." },
      { id:"b", t:"Remove approval", f:"Removes the control instead of informing it." },
      { id:"c", t:"Shorten the expiration", f:"Doesn't explain requests." },
      { id:"d", t:"Add more approvers", f:"More people without more information." } ],
    hints:["Ask the requester."],
    exp:"<p>Policies can require justification, ask custom questions and collect attributes, which helps approvers decide and leaves an audit trail.</p>",
    src:["emRequests"] });

  bank("k41a", 3, { kind:"Policy Workshop", type:"single", title:"Same bundle, two audiences", obj:["4.1.3","4.1.1","4.1.7"],
    sit:"<p>Employees and Harborline contractors both need the Project Atlas resources. Employees: manager approval, 180-day expiry. Contractors: sponsor approval, 90-day expiry, accept terms of use.</p>",
    q:"What's the cleanest design?",
    opts:[
      { id:"a", t:"One access package with two policies: one for employees (manager approval, 180 days) and one for the Harborline connected organization (sponsor approval, 90 days), with terms of use enforced for guests", c:1, f:"Same resources, different rules per population." },
      { id:"b", t:"Two catalogs with duplicate resources", f:"Duplicates management without benefit." },
      { id:"c", t:"One policy with the strictest settings for everyone", f:"Employees get contractor rules." },
      { id:"d", t:"Dynamic groups for both", f:"No approval or expiry." } ],
    hints:["Packages can hold more than one policy."],
    exp:"<p>An access package's policies define who can request and how. Multiple policies let different populations share one bundle with different approval and lifecycle rules.</p>",
    src:["emPackage","emConnected"] });

  /* ---------- 4.2 Access reviews ---------- */
  bank("k42b", 1, { kind:"Scenario", type:"single", title:"What auto apply does", obj:["4.2.2"],
    sit:"<p>An access review of a group has <b>Auto apply results</b> enabled. Priya denies one member.</p>",
    q:"What happens when the review ends?",
    opts:[
      { id:"a", t:"The denied member is removed from the group automatically", c:1, f:"That's what auto apply does." },
      { id:"b", t:"Nothing until an admin acts", f:"That's the behavior without auto apply." },
      { id:"c", t:"The member's account is deleted", f:"Only the reviewed access is removed." },
      { id:"d", t:"The group is deleted", f:"No." } ],
    hints:["Results, applied."],
    exp:"<p>Without auto apply, admins apply results manually. With it, denials are removed when the review instance completes.</p>",
    src:["arCreate"] });

  bank("k42i", 2, { kind:"Scenario", type:"single", title:"Nobody owns it", obj:["4.2.2","4.2.1"],
    sit:"<p>A review uses <b>Group owners</b> as reviewers, but some groups in scope have no owners.</p>",
    q:"What makes sure those groups are still reviewed?",
    opts:[
      { id:"a", t:"Configure fallback reviewers", c:1, f:"They review when the selected reviewers don't exist." },
      { id:"b", t:"Skip those groups", f:"Unowned groups are often the riskiest." },
      { id:"c", t:"Make the members review each other", f:"Not an option for this gap." },
      { id:"d", t:"Use Global Administrators as owners for every group", f:"Overprivilege and noise." } ],
    hints:["Plan for missing reviewers."],
    exp:"<p>Fallback reviewers apply when owners or managers can't be determined. Also consider assigning owners to orphaned groups.</p>",
    src:["arCreate"] });

  bank("k42a", 3, { kind:"Policy Workshop", type:"single", title:"Two sets of eyes", obj:["4.2.1","4.2.2","4.2.4"],
    sit:"<p>Requirements: managers first confirm whether each person still needs access to the Treasury app; then the security team reviews only the access managers approved; anything nobody reviews is removed.</p>",
    q:"Which review design fits?",
    opts:[
      { id:"a", t:"A multi-stage access review: stage 1 managers, stage 2 security team for approved decisions only, default “Remove access” if not reviewed, auto apply on", c:1, f:"Each stage sees what it needs." },
      { id:"b", t:"Two separate reviews at the same time", f:"The security team would review everything, not just approvals." },
      { id:"c", t:"One stage with both managers and security as reviewers", f:"Either reviewer's decision could stand alone." },
      { id:"d", t:"Self-review", f:"Not what's asked." } ],
    hints:["Stages, in order."],
    exp:"<p>Multi-stage reviews pass decisions between stages, so later stages can focus on approved access (or on denied access, as configured).</p>",
    src:["arCreate"] });

  /* ---------- 4.3 Privileged access (w43 is the beginner bank item) ---------- */
  bank("k43i", 2, { kind:"Scenario", type:"single", title:"Test the glass", obj:["4.3.6"],
    sit:"<p>Halcyon's emergency access accounts haven't been used in a year.</p>",
    q:"What's the right practice?",
    opts:[
      { id:"a", t:"Test them on a schedule (sign in, confirm the credential and alerts work), and document the procedure", c:1, f:"An untested break-glass account may fail when it matters." },
      { id:"b", t:"Never touch them", f:"You'd discover problems during an outage." },
      { id:"c", t:"Use them for daily admin work so they stay active", f:"Defeats their purpose and increases exposure." },
      { id:"d", t:"Disable them until needed", f:"You can't enable them during a lockout." } ],
    hints:["Fire drills exist for a reason."],
    exp:"<p>Microsoft recommends validating emergency accounts regularly and monitoring every sign-in to them.</p>",
    src:["emergency"] });

  bank("k43a", 3, { kind:"Identity Detective", type:"single", title:"Standing access, somehow", obj:["4.3.1","4.3.5"],
    sit:"<p>Halcyon's policy says Exchange Administrator must be eligible-only. An audit finds Ahmed held it active for 30 days.</p>",
    ev:[ { kind:"table", title:"Audit history (simulated)", columns:["Date","Activity","Initiator","Details"], rows:[
      ["Oct 2","Add member to role","Theo","Exchange Administrator · Active · Permanent"],["Oct 2","—","—","No activation request recorded"] ] } ],
    q:"What explains it, and what prevents a repeat?",
    opts:[
      { id:"a", t:"Theo made a permanent active assignment. Convert it to eligible, and in the role's PIM settings disallow permanent active assignments", c:1, f:"Role settings can require active assignments to expire, so standing access can't be made by accident." },
      { id:"b", t:"PIM is malfunctioning", f:"The audit shows a direct assignment, not an activation." },
      { id:"c", t:"Ahmed activated for 30 days", f:"No activation request was recorded." },
      { id:"d", t:"Delete Ahmed's account", f:"Fix the assignment, not the person." } ],
    hints:["Look for an activation that isn't there."],
    exp:"<p>PIM assignment settings control whether eligible and active assignments can be permanent and their maximum durations. Review audit history and alert on role changes made outside your process.</p>",
    src:["pimSettings","pimAudit"] });

  /* ---------- 4.4 Monitoring ---------- */
  bank("k44b", 1, { kind:"Scenario", type:"single", title:"Robots sign in too", obj:["4.4.1"],
    sit:"<p>You want to see when the HR-Export service principal authenticated last night.</p>",
    q:"Which log shows it?",
    opts:[
      { id:"a", t:"Service principal sign-ins (in the sign-in logs)", c:1, f:"App-only sign-ins appear there." },
      { id:"b", t:"Interactive user sign-ins", f:"For users at a sign-in prompt." },
      { id:"c", t:"Audit logs", f:"Changes, not sign-ins." },
      { id:"d", t:"Provisioning logs", f:"Provisioning activity only." } ],
    hints:["Sign-in logs have several tabs."],
    exp:"<p>Sign-in logs include interactive, non-interactive, service principal and managed identity sign-ins.</p>",
    src:["signinLogs"] });

  bank("k44i", 2, { kind:"Scenario", type:"single", title:"Blocked by policy, by KQL", obj:["4.4.3"],
    sit:"<p>Sign-in logs flow to Log Analytics. You want the sign-ins that Conditional Access blocked in the last 7 days.</p>",
    q:"Which query does that?",
    opts:[
      { id:"a", t:"<code>SigninLogs | where TimeGenerated > ago(7d) | where ConditionalAccessStatus == \"failure\"</code>", c:1, f:"ConditionalAccessStatus records the overall policy result." },
      { id:"b", t:"<code>AuditLogs | where OperationName == \"Update conditional access policy\"</code>", f:"Policy changes, not blocked sign-ins." },
      { id:"c", t:"<code>SigninLogs | where ConditionalAccessStatus == \"success\"</code>", f:"Successes, with no time filter." },
      { id:"d", t:"<code>SigninLogs | take 100</code>", f:"A sample, not an answer." } ],
    hints:["Find the column that summarizes Conditional Access."],
    exp:"<p>ConditionalAccessStatus is success, failure or notApplied. For per-policy detail, expand the ConditionalAccessPolicies column.</p>",
    src:["logAnalytics"] });

  bank("k44a", 3, { kind:"Identity Detective", type:"single", title:"The empty workbook", obj:["4.4.4","4.4.2"],
    sit:"<p>The Conditional Access insights and reporting workbook shows no data, though users sign in all day.</p>",
    ev:[ { kind:"kv", title:"Diagnostic settings (simulated)", fields:[["Setting","Send-to-SIEM"],["Categories","AuditLogs"],["Destination","Event hub: eh-siem"],["Log Analytics workspace","—"]] } ],
    q:"What's the cause?",
    opts:[
      { id:"a", t:"No diagnostic setting sends SignInLogs to a Log Analytics workspace; add one and select that workspace in the workbook", c:1, f:"The workbook queries sign-in data in Log Analytics." },
      { id:"b", t:"The workbook needs Workload ID Premium", f:"Unrelated license." },
      { id:"c", t:"Conditional Access is disabled", f:"Users are signing in under policies." },
      { id:"d", t:"Event Hubs is the wrong region", f:"The workbook doesn't read Event Hubs." } ],
    hints:["Workbooks read from a workspace."],
    exp:"<p>Microsoft Entra workbooks depend on logs routed to Log Analytics. Check the categories and destination, then wait for data to arrive.</p>",
    src:["workbooks","diagSettings","caInsights"] });

  /* Weave warm-ups into Mission 01 (old in-progress runs keep their original step list). */
  const m1 = C.missions.M1;
  m1.groups[0].items.push("w21");
  m1.groups[1].items.push("w31", "w22");
  m1.groups[2].items.push("w43");
})(window.ID_CONTENT);
