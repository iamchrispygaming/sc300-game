/* Reinforcement transfer checks: a second, different question for objectives that otherwise had only one.
   Each is appended to an existing mission challenge. Verified 2026-11-18. */
(function (C) {
  const I = C.items, M = C.missions;
  const add = (mid, group, id, item) => { I[id] = item; M[mid].groups[group-1].items.push(id); };

  add("M5", 1, "r-1.3.1", { kind:"Transfer check", type:"single", title:"Block one competitor", obj:["1.3.1"],
    sit:"<p>A different business unit wants to collaborate with anyone, except a competitor at <b>rivalfreight.example</b>.</p>",
    q:"Which collaboration restriction fits?",
    opts:[
      { id:"a", t:"Deny invitations to the specified domain: rivalfreight.example", c:1, f:"A denylist blocks the listed domain and allows the rest." },
      { id:"b", t:"Allow invitations only to the specified domains", f:"An allowlist would block every partner you didn't list." },
      { id:"c", t:"Set guest user access to restricted", f:"Controls what guests see, not who can be invited." },
      { id:"d", t:"Block rivalfreight.example in Conditional Access named locations", f:"Named locations are network locations, not email domains." } ],
    hints:["One list blocks named domains; the other permits only named domains."],
    exp:"<p>Collaboration restrictions use either an allowlist or a denylist of domains, not both. They apply to new B2B invitations.</p>",
    src:["extCollab"] });

  add("M5", 1, "r-1.3.2", { kind:"Transfer check", type:"single", title:"One designer, today", obj:["1.3.2"],
    sit:"<p>A freelance designer needs access to one Teams channel's files today. She'll use her personal email address.</p>",
    q:"What's the simplest supported way to add her?",
    opts:[
      { id:"a", t:"Invite her as an external user (Users › New user › Invite external user)", c:1, f:"Creates a guest that she redeems with her own identity or a one-time passcode." },
      { id:"b", t:"Create a member account with her personal address as the user principal name", f:"UPNs must use a verified domain in your tenant." },
      { id:"c", t:"Add her domain in cross-tenant access settings", f:"Cross-tenant access settings apply to other Microsoft Entra tenants, and don't invite anyone." },
      { id:"d", t:"Configure cross-tenant synchronization", f:"For tenants within one organization." } ],
    hints:["Single person, external, now."],
    exp:"<p>Individual invitations can be sent from the admin center (or Teams and SharePoint, depending on settings). The guest redeems the invitation; with no Entra or Microsoft account, email one-time passcode can be used.</p>",
    src:["b2bProps","otp"] });

  add("M5", 3, "r-1.3.6", { kind:"Transfer check", type:"single", title:"No IdP at all", obj:["1.3.6"],
    sit:"<p>A small supplier has no Microsoft Entra tenant, no Microsoft accounts and no identity provider. Its staff only have email.</p>",
    q:"How can they sign in as guests?",
    opts:[
      { id:"a", t:"Email one-time passcode", c:1, f:"Guests receive a code by email each time they sign in." },
      { id:"b", t:"SAML/WS-Fed IdP federation", f:"Requires the supplier to run an IdP." },
      { id:"c", t:"Cross-tenant access trust settings", f:"Requires a Microsoft Entra tenant." },
      { id:"d", t:"They can't be guests", f:"Email one-time passcode covers exactly this case." } ],
    hints:["What does every guest have?"],
    exp:"<p>Email one-time passcode is an identity provider option for B2B collaboration. It's used when a guest can't authenticate through another method, such as Microsoft Entra ID, a Microsoft account, or a federated IdP.</p>",
    src:["otp"] });

  add("M6", 2, "r-1.4.5", { kind:"Transfer check", type:"single", title:"Who needs Seamless SSO?", obj:["1.4.5"],
    sit:"<p>Halcyon's Windows 11 PCs are Microsoft Entra hybrid joined. A few older kiosk PCs are domain-joined but not hybrid joined.</p>",
    q:"Which devices benefit most from Seamless SSO?",
    opts:[
      { id:"a", t:"The domain-joined kiosks that aren't hybrid joined; hybrid joined Windows PCs already get SSO through the Primary Refresh Token", c:1, f:"Seamless SSO helps devices without a device-based SSO token." },
      { id:"b", t:"Personal phones", f:"Seamless SSO uses Kerberos from domain-joined devices on the corporate network." },
      { id:"c", t:"Every device equally", f:"Modern joined devices use the PRT." },
      { id:"d", t:"Only Microsoft Entra joined devices", f:"Entra joined devices aren't domain-joined and use the PRT." } ],
    hints:["Which devices lack a better SSO mechanism?"],
    exp:"<p>Seamless SSO uses Kerberos on domain-joined devices with line of sight to a domain controller. Microsoft Entra joined and hybrid joined Windows devices sign users in with the Primary Refresh Token, so Seamless SSO mostly matters for down-level or non-hybrid devices.</p>",
    src:["sso","deviceIdentity"] });

  add("M6", 3, "r-1.4.6", { kind:"Transfer check", type:"single", title:"What still uses AD FS?", obj:["1.4.6","1.4.7"],
    sit:"<p>Before decommissioning AD FS, Halcyon needs a list of relying-party applications that still get sign-ins, with a migration readiness view.</p>",
    q:"Where do you get it?",
    opts:[
      { id:"a", t:"The AD FS application activity report in the Microsoft Entra admin center (fed by Connect Health for AD FS)", c:1, f:"Shows apps, usage and migration readiness." },
      { id:"b", t:"The sign-in logs of Microsoft Entra ID", f:"AD FS sign-ins to relying parties don't appear there." },
      { id:"c", t:"Cloud Discovery in Defender for Cloud Apps", f:"Discovers SaaS usage from traffic logs, not AD FS relying parties." },
      { id:"d", t:"Staged Rollout settings", f:"Controls cloud authentication pilots, not app inventory." } ],
    hints:["The report's name mentions AD FS applications."],
    exp:"<p>The AD FS application activity report lists relying-party trusts with usage and migration status details. It relies on the Connect Health agent for AD FS.</p>",
    src:["adfsMigrate","health"] });

  add("M6", 3, "r-1.4.7", { kind:"Transfer check", type:"single", title:"Domain controller health", obj:["1.4.7"],
    sit:"<p>Halcyon also wants alerts for AD DS replication problems and domain controller health in the Entra admin center.</p>",
    q:"Which agent do you install, and where?",
    opts:[
      { id:"a", t:"Connect Health for AD DS, on the domain controllers", c:1, f:"Monitors DC health, replication and performance." },
      { id:"b", t:"Connect Health for sync, on the domain controllers", f:"The sync agent goes on the Connect Sync server and monitors sync." },
      { id:"c", t:"A Cloud Sync provisioning agent", f:"Provisions users; doesn't monitor DCs." },
      { id:"d", t:"The password protection DC agent", f:"Enforces password policy; doesn't monitor health." } ],
    hints:["Each Connect Health agent is named after what it monitors."],
    exp:"<p>Connect Health has three agents: sync (on Connect Sync servers), AD FS (on federation and proxy servers) and AD DS (on domain controllers).</p>",
    src:["health"] });

  add("M8", 3, "r-2.1.5", { kind:"Transfer check", type:"single", title:"Why is a PIN safer?", obj:["2.1.5"],
    sit:"<p>A user asks: “My Windows Hello PIN is only six digits. How is that safer than my long password?”</p>",
    q:"What's the best answer?",
    opts:[
      { id:"a", t:"The PIN unlocks a key stored on that device (typically protected by the TPM), so a stolen PIN is useless without the device", c:1, f:"The secret never leaves the device, unlike a password." },
      { id:"b", t:"The PIN is sent to Entra encrypted", f:"The PIN isn't sent to Entra at all; it unlocks a local key." },
      { id:"c", t:"PINs expire every day", f:"They don't." },
      { id:"d", t:"PINs are only used offline", f:"They're used for normal sign-in." } ],
    hints:["Where does the PIN go when you type it?"],
    exp:"<p>Windows Hello for Business uses an asymmetric key pair bound to the device. The PIN or biometric unlocks the private key locally; the server only ever sees signed proofs.</p>",
    src:["whfb"] });

  add("M8", 2, "r-2.1.7", { kind:"Transfer check", type:"single", title:"Spray and lockout", obj:["2.1.7"],
    sit:"<p>A password spray is locking out cloud accounts. Halcyon wants to tune how many failed attempts trigger a lockout and how long it lasts.</p>",
    q:"Where is that configured?",
    opts:[
      { id:"a", t:"Authentication methods › Password protection › Smart lockout (threshold and duration)", c:1, f:"Smart lockout settings live with password protection." },
      { id:"b", t:"Conditional Access session controls", f:"Session controls don't set lockout thresholds." },
      { id:"c", t:"The custom banned password list", f:"Bans weak passwords; doesn't control lockout." },
      { id:"d", t:"Security defaults", f:"Not configurable for lockout." } ],
    hints:["Same blade as the banned password list."],
    exp:"<p>Smart lockout distinguishes familiar from unfamiliar sign-in locations and locks out attackers while letting genuine users keep working. With pass-through authentication, keep the Entra lockout threshold lower than the AD account lockout threshold so cloud lockout happens before AD locks the account.</p>",
    src:["pwProtect"] });

  add("M14", 1, "r-3.2.2", { kind:"Transfer check", type:"single", title:"Just BrightBoard", obj:["3.2.2"],
    sit:"<p>Omar must manage SSO and assignments for the BrightBoard enterprise app only, through a role assignment that appears in role reviews.</p>",
    q:"What's the least-privilege assignment?",
    opts:[
      { id:"a", t:"Cloud Application Administrator, assigned at the scope of the BrightBoard enterprise application", c:1, f:"App management roles can be scoped to a single application." },
      { id:"b", t:"Cloud Application Administrator at tenant scope", f:"Covers every app." },
      { id:"c", t:"Application Developer", f:"Can create registrations, can't manage enterprise app SSO and assignments." },
      { id:"d", t:"Global Reader", f:"Read-only." } ],
    hints:["Scope can be a single app."],
    exp:"<p>From an enterprise application's <b>Roles and administrators</b> page, you can assign app management roles scoped to just that application.</p>",
    src:["rolesAssign","rolesRef"] });

  add("M14", 3, "r-3.2.7", { kind:"Transfer check", type:"single", title:"Do collections grant access?", obj:["3.2.7"],
    sit:"<p>Theo adds Ledgerly to the Warehouse tools collection, assigned to the warehouse group. Warehouse staff aren't assigned to Ledgerly itself.</p>",
    q:"What do warehouse staff see?",
    opts:[
      { id:"a", t:"Not Ledgerly. Users see only apps they're assigned to, so collections organize but don't grant access", c:1, f:"Assign users to the app to make it appear." },
      { id:"b", t:"Ledgerly, and they can now sign in", f:"Collections don't create assignments." },
      { id:"c", t:"Ledgerly, but sign-in fails", f:"Unassigned apps don't show in their collections." },
      { id:"d", t:"An error in My Apps", f:"No error; the app just isn't shown." } ],
    hints:["Organizing isn't authorizing."],
    exp:"<p>Collections group apps into tabs in My Apps for the users or groups you choose. Access still depends on app assignment.</p>",
    src:["collections"] });

  add("M15", 1, "r-3.3.1", { kind:"Transfer check", type:"single", title:"Selling to many companies", obj:["3.3.1","3.3.2"],
    sit:"<p>Halcyon's software team will sell Dispatch to other companies, whose employees sign in with their own Microsoft Entra work accounts.</p>",
    q:"Which supported account type?",
    opts:[
      { id:"a", t:"Accounts in any organizational directory (multitenant)", c:1, f:"Users from other Entra tenants can sign in after consent in their tenant." },
      { id:"b", t:"Single tenant", f:"Only Halcyon's users could sign in." },
      { id:"c", t:"Personal Microsoft accounts only", f:"Customers use work accounts." },
      { id:"d", t:"Create one app registration per customer in Halcyon's tenant", f:"Unnecessary; multitenant apps exist for this." } ],
    hints:["Many organizations, work accounts."],
    exp:"<p>Multitenant apps get a service principal in each customer tenant upon consent. Plan for publisher verification, issuer validation and tenant-specific authorization.</p>",
    src:["appReg"] });

  add("M16", 2, "r-3.4.2", { kind:"Transfer check", type:"single", title:"Mass download in Box", obj:["3.4.2"],
    sit:"<p>Halcyon wants an alert if any user downloads more than 500 files from Box in an hour.</p>",
    q:"What makes that possible?",
    opts:[
      { id:"a", t:"An app connector for Box, plus an activity policy (or the built-in anomaly detection) in Defender for Cloud Apps", c:1, f:"API-level activity data drives the policy." },
      { id:"b", t:"Cloud Discovery reports", f:"Traffic summaries don't show per-file activity." },
      { id:"c", t:"A Conditional Access sign-in frequency policy", f:"Controls reauthentication, not downloads." },
      { id:"d", t:"A Box tile in My Apps", f:"Unrelated." } ],
    hints:["You need activity data from inside Box."],
    exp:"<p>Connected apps feed activity logs to Defender for Cloud Apps, where activity policies and anomaly detection policies can alert and take governance actions.</p>",
    src:["mdcaConnect"] });

  add("M16", 1, "r-3.4.7", { kind:"Transfer check", type:"single", title:"Disagreeing with the score", obj:["3.4.7"],
    sit:"<p>The Cloud app catalog rates a vendor's app highly, but Halcyon's legal team requires data residency in Canada, which the catalog doesn't weight heavily.</p>",
    q:"What can you do?",
    opts:[
      { id:"a", t:"Adjust the score metric weights for your organization (or override the app's score) so the catalog reflects your priorities", c:1, f:"Risk scoring can be customized." },
      { id:"b", t:"Nothing; scores are fixed", f:"You can tune weights and override scores." },
      { id:"c", t:"Delete the app from the catalog", f:"You can't delete catalog entries." },
      { id:"d", t:"Mark every app unsanctioned", f:"Blocks the business." } ],
    hints:["Scores reflect weights."],
    exp:"<p>The catalog's risk score combines general, security, compliance and legal factors. You can change weights to match your organization and override specific apps' scores.</p>",
    src:["mdcaCatalog"] });

  add("M17", 1, "r-4.1.1", { kind:"Transfer check", type:"single", title:"Package or group?", obj:["4.1.1"],
    sit:"<p>Three access needs: (1) every employee gets the intranet on day one; (2) project contractors need a bundle of resources for 60 days with approval; (3) Finance needs a shared mailbox.</p>",
    q:"Which is the best fit for an access package?",
    opts:[
      { id:"a", t:"(2) The contractor bundle", c:1, f:"Bundled resources, request, approval and expiry are what access packages are for." },
      { id:"b", t:"(1) The intranet for everyone", f:"A dynamic group or default assignment fits birthright access better." },
      { id:"c", t:"(3) The shared mailbox", f:"Exchange permissions aren't an access package resource." },
      { id:"d", t:"All three", f:"Not every access need is an entitlement to request." } ],
    hints:["Look for request, approval and expiry."],
    exp:"<p>Plan entitlements by separating birthright access (automatic, through dynamic groups) from requested access (access packages with approval and lifecycle).</p>",
    src:["emOverview"] });

  add("M17", 1, "r-4.1.2", { kind:"Transfer check", type:"single", title:"Can't add the site", obj:["4.1.2"],
    sit:"<p>Priya, owner of the Marketing catalog, tries to add the Brand Assets SharePoint site to her catalog and can't find it.</p>",
    q:"What's the most likely reason?",
    opts:[
      { id:"a", t:"To add a resource to a catalog, she must be an owner of that resource (or hold an admin role)", c:1, f:"Catalog owners can only add resources they own." },
      { id:"b", t:"SharePoint sites can't be in catalogs", f:"They can." },
      { id:"c", t:"Catalogs can contain only groups", f:"Groups, Teams, apps and SharePoint sites are supported." },
      { id:"d", t:"She needs Global Administrator", f:"Resource ownership or a specific admin role is enough." } ],
    hints:["Delegation doesn't let you claim someone else's resource."],
    exp:"<p>Catalog creators and owners add resources they own. Admins with roles such as Identity Governance Administrator can add resources on their behalf.</p>",
    src:["emCatalog"] });

  add("M17", 3, "r-4.1.6", { kind:"Transfer check", type:"single", title:"Guests from before", obj:["4.1.6","1.3.3"],
    sit:"<p>Halcyon has 200 guests invited directly years ago, outside entitlement management.</p>",
    q:"Will entitlement management's external user lifecycle settings remove them?",
    opts:[
      { id:"a", t:"No. They apply to external users who came in through entitlement management. Use access reviews for the others", c:1, f:"Different populations, different tools." },
      { id:"b", t:"Yes, all guests are covered", f:"Only entitlement-managed external users are." },
      { id:"c", t:"Yes, after 30 days", f:"Same misunderstanding." },
      { id:"d", t:"Only if they're in a connected organization", f:"Connected organizations don't retroactively cover direct invites." } ],
    hints:["Which tool created the account?"],
    exp:"<p>For guests invited outside entitlement management, schedule access reviews of guest access to groups and apps, and remove inactive guests.</p>",
    src:["emExternal","accessReviews"] });

  add("M18", 2, "r-4.2.3", { kind:"Transfer check", type:"single", title:"After the review", obj:["4.2.3"],
    sit:"<p>An auditor asks who denied which guest in last quarter's review, and why.</p>",
    q:"Where's that information?",
    opts:[
      { id:"a", t:"The review's results/history (downloadable), which records reviewers, decisions and justifications, plus the audit logs", c:1, f:"Access reviews keep decision records." },
      { id:"b", t:"The sign-in logs", f:"Not review decisions." },
      { id:"c", t:"It isn't recorded", f:"It is." },
      { id:"d", t:"The group's Members page", f:"Shows current members only." } ],
    hints:["Reviews keep their own history."],
    exp:"<p>Monitor access review activity through each instance's results and the review history reports, and through audit log entries for access review actions.</p>",
    src:["arManage"] });

  add("M19", 2, "r-4.3.2", { kind:"Transfer check", type:"single", title:"Smallest Azure scope", obj:["4.3.2"],
    sit:"<p>An engineer needs just-in-time Contributor only for the resource group <b>rg-prod-web</b>.</p>",
    q:"Where should the eligible assignment be?",
    opts:[
      { id:"a", t:"Eligible Contributor at the rg-prod-web resource group scope in PIM for Azure resources", c:1, f:"Smallest scope that meets the need." },
      { id:"b", t:"Eligible Contributor on the subscription", f:"Covers every resource group." },
      { id:"c", t:"Eligible Owner on the resource group", f:"Owner adds the ability to assign roles." },
      { id:"d", t:"Eligible Global Administrator", f:"A directory role; doesn't grant Azure RBAC by itself." } ],
    hints:["Scope as well as role."],
    exp:"<p>PIM for Azure resources applies at management group, subscription, resource group or resource scope. Choose the narrowest scope and role.</p>",
    src:["pimAzure"] });

  add("M19", 2, "r-4.3.3", { kind:"Transfer check", type:"single", title:"Owner on demand", obj:["4.3.3"],
    sit:"<p>Priya should be able to manage Campaign Reviewers' membership, but only when she actively needs to, for up to 4 hours at a time.</p>",
    q:"What do you configure?",
    opts:[
      { id:"a", t:"PIM for Groups: make Priya an eligible owner of Campaign Reviewers with a 4-hour maximum activation", c:1, f:"Just-in-time ownership." },
      { id:"b", t:"Make Priya a permanent owner", f:"Standing access." },
      { id:"c", t:"Assign Groups Administrator through PIM", f:"Tenant-wide group admin for one group." },
      { id:"d", t:"Make the group dynamic", f:"Removes manual membership altogether." } ],
    hints:["PIM for Groups covers owners too."],
    exp:"<p>PIM for Groups supports eligible membership and eligible ownership, with activation settings such as maximum duration, MFA and approval.</p>",
    src:["pimGroups"] });

})(window.ID_CONTENT);
