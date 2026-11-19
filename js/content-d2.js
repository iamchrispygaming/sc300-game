/* Domain 2: Implement authentication and access management. Missions 07–12 + Boss 2. Verified 2026-11-18. */
(function (C) {
  const I = C.items, M = C.missions;

  /* ---------------- Mission 07: Prove It's You ---------------- */
  M.M7 = { id:"M7", domain:"D2", code:"Mission 07", title:"Prove It's You", minutes:14,
    story:"Halcyon's security review found 40% of staff still use SMS codes, admins approve push prompts at 2 a.m., and new hires can't register anything until they have something to register with. Classic.",
    goal:"Plan authentication, configure methods, bootstrap new users, nudge people to stronger methods, and set tenant-wide MFA options.",
    groups:[
      { n:1, title:"Strong, stronger, phishing-resistant", blurb:"Plan methods and bootstrap new users.", items:["m7-1","m7-2"] },
      { n:2, title:"The methods policy", blurb:"Configure the Authentication methods policy and run a registration campaign.", items:["m7-3","m7-4"] },
      { n:3, title:"Tenant-wide settings", blurb:"Security defaults, suspicious activity reports and certificates.", items:["m7-5","m7-6","m7-7"] } ],
    takeaways:[
      "Phishing-resistant methods: <b>passkeys (FIDO2)</b>, Windows Hello for Business and certificate-based authentication. Push notifications, SMS and one-time codes are MFA but not phishing-resistant.",
      "<b>Temporary Access Pass</b> is a time-limited passcode for onboarding and recovery, typically used to register passwordless methods.",
      "Authentication methods are managed in the converged <b>Authentication methods policy</b>; management in the legacy MFA and SSPR policies ended on September 30, 2025.",
      "<b>Registration campaigns</b> nudge users to set up Authenticator or passkeys after MFA, with a configurable snooze. <b>Security defaults</b> give tenants without Conditional Access a baseline." ],
    next:"M8" };

  I["m7-1"] = { kind:"Scenario", type:"single", title:"Phishing-resistant, please", obj:["2.1.1","2.1.2"], main:true,
    story:"Nadia: <b>“Our admins approved a fake push prompt last month. I want sign-ins a phishing site can't relay.”</b>",
    sit:"<p>Halcyon wants admins to use an authentication method that resists real-time phishing (an attacker-in-the-middle relaying the sign-in).</p>",
    teach:"<p><b>Plan for authentication</b> by matching methods to risk. <b>Phishing-resistant</b> methods bind the sign-in to the real site or device, so a fake site can't relay them. Examples: passkeys (FIDO2, including passkeys in Microsoft Authenticator), Windows Hello for Business, and certificate-based authentication.</p>",
    q:"Which method meets the requirement?",
    opts:[
      { id:"a", t:"Passkeys (FIDO2), such as security keys or passkeys in Microsoft Authenticator", c:1, f:"Origin-bound cryptographic credentials can't be replayed by a phishing site.", i:[25,5,0], x:"Fake prompts and relay pages no longer work against admin accounts." },
      { id:"b", t:"Microsoft Authenticator push notifications with number matching", f:"Stronger than plain push and resists fatigue, but a real-time relay can still trick a user.", m:"Number matching makes push phishing-resistant", i:[5,5,0] },
      { id:"c", t:"SMS one-time codes", f:"Codes can be phished and SIM-swapped.", m:"Any MFA is phishing-resistant", i:[-10,5,0] },
      { id:"d", t:"Authenticator app time-based codes (TOTP)", f:"A user can type a code into a fake site.", i:[-5,5,0] } ],
    hints:["Ask whether the user could hand the proof to a fake website."],
    exp:"<p>Microsoft recommends phishing-resistant MFA for privileged roles. In Conditional Access, require it with the built-in <b>Phishing-resistant MFA</b> authentication strength once admins have registered suitable methods.</p>",
    src:["authMethods","passkeys","phishResistant"] };

  I["m7-2"] = { kind:"Scenario", type:"single", title:"Day one, nothing registered", obj:["2.1.2"], main:true,
    sit:"<p>Maya's replacement starts remotely tomorrow. She has a laptop and a security key, but no registered methods yet. She must register her passkey on day one without a helpdesk call.</p>",
    q:"What do you give her?",
    opts:[
      { id:"a", t:"A <b>Temporary Access Pass</b> (time-limited, one-time use) delivered through a trusted channel", c:1, f:"TAP is built to bootstrap passwordless registration.", i:[10,20,10] },
      { id:"b", t:"A temporary password and an exclusion from MFA policies", f:"Exclusions are easy to forget and weaken security.", m:"MFA exclusions are a safe onboarding tool", i:[-20,15,0] },
      { id:"c", t:"Register the key yourself and courier it", f:"Admins can't register a passkey on her behalf in normal flows, and it delays her start.", i:[0,-10,-10] },
      { id:"d", t:"Turn on security defaults", f:"Security defaults require MFA registration, but she still has nothing to register with.", i:[0,-5,0] } ],
    hints:["She needs a strong but temporary credential."],
    exp:"<p>A Temporary Access Pass is a time-limited passcode that can be single-use or multi-use. It satisfies strong authentication requirements, so users can register methods such as passkeys and Windows Hello for Business. Enable it in the Authentication methods policy for the groups that need it.</p>",
    src:["tap"] };

  I["m7-3"] = { kind:"Policy Workshop", type:"config", title:"The methods policy", obj:["2.1.2","2.3.3"], main:true,
    sit:"<p>Requirements: (1) only the <b>New-Hires</b> group can receive Temporary Access Passes, and each pass works once; (2) every user stays eligible for the Microsoft Authenticator registration campaign you're about to launch.</p>",
    teach:"<p>The <b>Authentication methods policy</b> enables each method for all users or for selected groups, with method-specific settings. Methods are no longer managed in the legacy MFA and SSPR policies; that ended on September 30, 2025.</p>",
    fields:[
      { id:"tapTarget", label:"Temporary Access Pass › Target", options:[
        { id:"all", text:"All users", feedback:"Anyone could be issued a pass, which widens a powerful bootstrap credential.", impact:{sec:-10} },
        { id:"newhires", text:"Group: New-Hires", correct:true, feedback:"Limits TAP to the people who need it.", impact:{sec:10} } ]},
      { id:"tapOnce", label:"Temporary Access Pass › One-time use", options:[
        { id:"yes", text:"Yes", correct:true, feedback:"Each pass works once.", impact:{sec:5} },
        { id:"no", text:"No", feedback:"Multi-use passes stay valid for their full lifetime.", impact:{sec:-5} } ]},
      { id:"authMode", label:"Microsoft Authenticator › Authentication mode", options:[
        { id:"any", text:"Any", correct:true, feedback:"Users with Any or Push are eligible for the Authenticator nudge.", impact:{acc:10} },
        { id:"passwordless", text:"Passwordless", feedback:"Users set to Passwordless aren't eligible for the Authenticator registration campaign.", misconception:"Authenticator passwordless mode works with the Authenticator nudge", impact:{acc:-10} } ]} ],
    hints:["One requirement narrows TAP; the other depends on a documented campaign prerequisite."],
    exp:"<p>Target TAP to a group and make it one-time where possible. For the Authenticator registration campaign, users must be enabled for Authenticator with authentication mode <b>Any</b> or <b>Push</b>; Passwordless mode isn't eligible for that nudge.</p>",
    src:["authMethodsManage","tap","regCampaign"] };

  I["m7-4"] = { kind:"Scenario", type:"single", title:"Nudge, don't nag", obj:["2.3.3"], main:true,
    sit:"<p>About 500 users still use SMS for MFA. Halcyon wants them prompted to set up Microsoft Authenticator during sign-in, with the option to postpone for up to three days.</p>",
    q:"What should you use?",
    opts:[
      { id:"a", t:"A <b>registration campaign</b> in Authentication methods, targeting Authenticator with a 3-day snooze", c:1, f:"Prompts users after MFA and re-prompts after the snooze period.", i:[15,5,15] },
      { id:"b", t:"Disable SMS for everyone today", f:"Users without another method would be stranded.", i:[5,-25,-10] },
      { id:"c", t:"Email users a how-to guide", f:"Helpful, but there's no enforcement or tracking.", i:[0,0,-5] },
      { id:"d", t:"Require a compliant device in Conditional Access", f:"Unrelated to MFA method registration.", i:[0,-10,0] } ],
    hints:["The feature has a snooze setting."],
    exp:"<p>A registration campaign nudges targeted users to set up a stronger method (Microsoft Authenticator or a passkey) after they complete MFA. You set the snooze duration and include or exclude groups. Every edition of Microsoft Entra ID includes it; no extra license is needed.</p>",
    src:["regCampaign"] };

  I["m7-5"] = { kind:"Scenario", type:"single", title:"The tiny subsidiary", obj:["2.1.3"], main:true,
    sit:"<p>Halcyon's 30-person subsidiary has its own tenant on Microsoft Entra ID Free. It has no Conditional Access and needs baseline MFA protection now.</p>",
    q:"What do you enable?",
    opts:[
      { id:"a", t:"Security defaults", c:1, f:"Free baseline protection, including MFA registration and enforcement.", i:[20,0,15] },
      { id:"b", t:"A Conditional Access policy requiring MFA", f:"Conditional Access requires Microsoft Entra ID P1.", m:"Conditional Access is included in Entra ID Free", i:[0,0,-10] },
      { id:"c", t:"Per-user MFA for every account", f:"Legacy approach; Microsoft recommends security defaults or Conditional Access instead.", m:"Per-user MFA is the recommended baseline", i:[5,0,-15] },
      { id:"d", t:"Nothing until they buy P2", f:"Leaves them unprotected.", i:[-20,0,0] } ],
    hints:["What's free and one switch?"],
    exp:"<p>Security defaults turn on preconfigured protections such as requiring MFA registration and blocking legacy authentication. When an organization moves to Conditional Access, it disables security defaults and recreates those protections as policies.</p>",
    src:["secDefaults","mfaSettings"] };

  I["m7-6"] = { kind:"Transfer check", type:"single", title:"The 3 a.m. prompt", obj:["2.1.3","2.3.4"],
    sit:"<p>Users occasionally get MFA prompts they didn't start. Halcyon wants them to report these, and wants reports to feed risk detection in ID Protection.</p>",
    q:"Which tenant-wide MFA setting supports this?",
    opts:[
      { id:"a", t:"Report suspicious activity, in Authentication methods settings", c:1, f:"Users can report unexpected prompts; with Microsoft Entra ID P2, reports raise user risk." },
      { id:"b", t:"Trusted IPs", f:"Trusted IPs skip MFA from listed networks: the opposite of what's needed." },
      { id:"c", t:"Remember multifactor authentication on trusted devices", f:"Reduces prompts; doesn't capture reports." },
      { id:"d", t:"One-time bypass", f:"Lets a user skip MFA once, which isn't what you want here." } ],
    hints:["The setting's name says what the user does."],
    exp:"<p><b>Report suspicious activity</b> replaces the legacy fraud alert. A reported prompt can set the user to high risk, so risk-based Conditional Access policies (or admins) can respond.</p>",
    src:["mfaSettings","riskPolicies"] };

  I["m7-7"] = { kind:"Transfer check", type:"single", title:"Smart cards, no AD FS", obj:["2.1.2"],
    sit:"<p>Halcyon's finance staff already carry smart cards issued by Halcyon's PKI. Halcyon wants them to use those cards to sign in to Microsoft Entra ID directly, without AD FS.</p>",
    q:"What should you configure?",
    opts:[
      { id:"a", t:"Microsoft Entra certificate-based authentication: upload the issuing CA certificates and enable the method for finance", c:1, f:"CBA validates the certificates natively in Entra." },
      { id:"b", t:"A SAML IdP federation for halcyon.example", f:"That's for external partners' identity providers." },
      { id:"c", t:"Windows Hello for Business key trust", f:"A different method; it doesn't use the existing smart cards." },
      { id:"d", t:"A Temporary Access Pass for each user", f:"TAP bootstraps registration; it doesn't use smart cards." } ],
    hints:["The method's name describes what's on the card."],
    exp:"<p>Microsoft Entra CBA validates X.509 certificates against the certificate authorities you configure, including revocation checks. Authentication binding rules decide whether a certificate counts as single-factor or multifactor.</p>",
    src:["cba"] };

  /* ---------------- Mission 08: Locked Out ---------------- */
  M.M8 = { id:"M8", domain:"D2", code:"Mission 08", title:"Locked Out", minutes:14,
    story:"Monday's helpdesk queue: 60 password resets, one suspected compromised account, users choosing <i>Halcyon2026!</i> as a password, and a request to get rid of passwords entirely. Pick your battles. All of them.",
    goal:"Deploy SSPR, respond to account compromise, enforce password protection everywhere, and plan Windows Hello for Business with Microsoft Entra Kerberos.",
    groups:[
      { n:1, title:"Let users fix it", blurb:"Configure self-service password reset for hybrid users.", items:["m8-1","m8-6"] },
      { n:2, title:"Shut the door", blurb:"Disable, revoke and block bad passwords.", items:["m8-2","m8-3"] },
      { n:3, title:"Beyond passwords", blurb:"Windows Hello for Business and Microsoft Entra Kerberos.", items:["m8-4","m8-5"] } ],
    takeaways:[
      "SSPR is scoped to none, selected or all users. Hybrid users need <b>password writeback</b>. Administrators always get a stricter, Microsoft-managed two-gate policy.",
      "Disabling an account stops new sign-ins; <b>revoking sessions</b> invalidates refresh tokens. Continuous access evaluation (CAE)-capable apps respond in near real time.",
      "Password protection: the global banned list always applies; the custom list adds your terms. On-premises enforcement needs the <b>proxy service and DC agents</b>, switched from Audit to Enforced.",
      "<b>Cloud Kerberos trust</b> for Windows Hello for Business, and FIDO2 sign-in to on-premises resources, rely on a <b>Microsoft Entra Kerberos</b> server object in AD." ],
    next:"M9" };

  I["m8-1"] = { kind:"Policy Workshop", type:"config", title:"Self-service password reset", obj:["2.1.4"], main:true,
    sit:"<p>Requirements: (1) start with a pilot group, <b>SSPR-Pilot</b>; (2) users must verify with two methods; (3) most users are synchronized from on-premises AD, so resets must update their AD password.</p>",
    teach:"<p><b>Self-service password reset (SSPR)</b> lets users reset or unlock their own passwords after verifying with registered methods. Its scope can be None, Selected (a group) or All. For synchronized users, <b>password writeback</b> (through Connect Sync or Cloud Sync) writes the new password back to AD.</p>",
    fields:[
      { id:"scope", label:"Self-service password reset enabled", options:[
        { id:"none", text:"None", feedback:"Nobody can use SSPR.", impact:{acc:-15} },
        { id:"selected", text:"Selected: SSPR-Pilot", correct:true, feedback:"Pilot first, widen later.", impact:{acc:10, ops:5} },
        { id:"all", text:"All", feedback:"Skips the pilot the requirement asked for.", impact:{ops:-5} } ]},
      { id:"methods", label:"Number of methods required to reset", options:[
        { id:"1", text:"1", feedback:"Requirement says two.", impact:{sec:-10} },
        { id:"2", text:"2", correct:true, feedback:"Two independent methods are harder to abuse.", impact:{sec:10} } ]},
      { id:"writeback", label:"On-premises integration › Write back passwords to your on-premises directory", options:[
        { id:"on", text:"Enabled", correct:true, feedback:"Synced users' new passwords reach AD.", impact:{acc:15, ops:15} },
        { id:"off", text:"Disabled", feedback:"Synced users couldn't use SSPR to change their AD password.", misconception:"SSPR works for synced users without writeback", impact:{acc:-15} } ]} ],
    hints:["Each requirement maps to one setting."],
    exp:"<p>Scope SSPR to the pilot group, require two methods, and enable password writeback so synchronized users' passwords change in AD. Writeback is configured through Microsoft Entra Connect Sync or Cloud Sync.</p>",
    simp:"The real SSPR blade also covers registration, notifications and customization.",
    src:["sspr","ssprWriteback"] };

  I["m8-6"] = { kind:"Transfer check", type:"single", title:"The admin who can't reset", obj:["2.1.4"],
    sit:"<p>Tomas, a Helpdesk Administrator, registered only security questions and now can't use SSPR. Regular users in the same pilot can.</p>",
    q:"Why?",
    opts:[
      { id:"a", t:"Admin roles get a Microsoft-managed two-gate SSPR policy that doesn't allow security questions", c:1, f:"Admins always need two strong methods, regardless of your user policy." },
      { id:"b", t:"SSPR doesn't work for admins at all", f:"It does, under a stricter policy.", m:"Admins can't use SSPR" },
      { id:"c", t:"He needs Microsoft Entra ID P2", f:"Licensing isn't the difference." },
      { id:"d", t:"Security questions expire after 30 days", f:"They don't expire like that." } ],
    hints:["Admins don't follow your SSPR policy."],
    exp:"<p>Microsoft enforces a stronger, two-gate reset policy for administrator roles. It requires two methods such as email, phone or Authenticator, and doesn't allow security questions. You can't change it with the user SSPR settings.</p>",
    src:["sspr"] };

  I["m8-2"] = { kind:"Identity Detective", type:"single", title:"Still reading email", obj:["2.1.6","2.2.7"], main:true,
    story:"09:00: an employee leaves on bad terms and Theo disables her account. 09:20: her phone is still syncing mail.",
    sit:"<p>The account is disabled (<b>Block sign-in: Yes</b>). Her mail app on her phone keeps working.</p>",
    teach:"<p>Disabling an account stops <i>new</i> sign-ins. Apps that already hold tokens can keep working until a token needs refreshing. <b>Revoking sessions</b> invalidates refresh tokens and browser session cookies. Services that support <b>continuous access evaluation (CAE)</b> react to critical events like these in near real time.</p>",
    q:"What should you do next?",
    opts:[
      { id:"a", t:"Revoke her sessions (for example <code>Revoke-MgUserSignInSession</code>), and confirm in the sign-in logs that access stops", c:1, f:"Invalidates refresh tokens so the app must sign in again, which now fails.", i:[20,0,5], x:"Her mail stops syncing within minutes." },
      { id:"b", t:"Wait: disabled accounts are cut off once tokens expire", f:"Long-lived refresh tokens and sessions can keep access alive much longer.", m:"Disabling an account ends existing sessions", i:[-20,0,0] },
      { id:"c", t:"Delete her account immediately", f:"Destroys evidence and access to her data; revoke first, then follow offboarding.", i:[0,0,-15] },
      { id:"d", t:"Reset her MFA methods only", f:"She isn't signing in again; she's using existing tokens.", i:[0,0,-5] } ],
    hints:["The problem isn't new sign-ins."],
    exp:"<p>The usual sequence: disable the account (on-premises first for synced users), reset the password, revoke sessions, and disable or wipe devices as policy requires. CAE-capable services such as Exchange Online, SharePoint Online and Teams honor revocation in near real time (latency of up to about 15 minutes can occur).</p>",
    src:["revoke","cae"] };

  I["m8-3"] = { kind:"Policy triage", type:"multi", pick:2, title:"Halcyon2026!", obj:["2.1.7"], main:true,
    sit:"<p>Halcyon added “Halcyon” and “Freight” to the <b>custom banned password list</b>. Cloud-only users are blocked from using them, but synced users still set <i>Halcyon2026!</i> when they change passwords on-premises.</p>",
    q:"Which actions enforce the banned list for on-premises password changes?",
    opts:[
      { id:"a", t:"Deploy the Microsoft Entra Password Protection proxy service and the DC agent on domain controllers", c:1, f:"DC agents enforce the policy when passwords change in AD.", i:[10,0,5] },
      { id:"b", t:"Switch on-premises password protection mode from Audit to Enforced", c:1, f:"Audit only logs violations; Enforced rejects them.", i:[10,0,5] },
      { id:"c", t:"Add the words to the global banned password list", f:"Microsoft maintains the global list; you can't edit it.", m:"Admins can edit the global banned list", i:[0,0,-5] },
      { id:"d", t:"Lower the smart lockout threshold", f:"Smart lockout slows guessing attacks; it doesn't evaluate new passwords.", m:"Smart lockout enforces password rules", i:[0,-5,0] } ],
    hints:["Something must run where on-prem passwords change, and it must be set to act."],
    exp:"<p>Microsoft Entra Password Protection evaluates passwords against the global banned list (Microsoft-maintained, always on) plus your custom list (up to 1,000 terms). On-premises enforcement needs the proxy service and DC agent software, with the mode set to <b>Enforced</b> after testing in Audit.</p>",
    src:["pwProtect","pwProtectOnPrem"] };

  I["m8-4"] = { kind:"Scenario", type:"single", title:"Passwordless Windows, hybrid world", obj:["2.1.5","2.1.8"], main:true,
    sit:"<p>Halcyon wants Windows Hello for Business on its hybrid joined PCs. Users must get single sign-on to on-premises file shares, and Halcyon doesn't want to deploy PKI certificates to users.</p>",
    teach:"<p><b>Windows Hello for Business</b> replaces passwords with a PIN or biometric tied to a key on the device. Hybrid deployments can use <b>cloud Kerberos trust</b>, <b>key trust</b> or <b>certificate trust</b>.</p>",
    q:"Which deployment model fits best?",
    opts:[
      { id:"a", t:"Cloud Kerberos trust", c:1, f:"Uses Microsoft Entra Kerberos to issue tickets for on-prem SSO, with no user certificates.", i:[15,15,15] },
      { id:"b", t:"Certificate trust", f:"Requires a PKI and certificate enrollment for users, which Halcyon wants to avoid.", i:[5,10,-15] },
      { id:"c", t:"Key trust", f:"Works without user certificates but needs domain controller certificates and more prerequisites than cloud Kerberos trust.", i:[10,10,-5] },
      { id:"d", t:"Disable Windows Hello and keep passwords", f:"Doesn't meet the passwordless goal.", i:[-10,0,0] } ],
    hints:["One model's name mentions Kerberos and the cloud."],
    exp:"<p>Microsoft recommends cloud Kerberos trust for most hybrid Windows Hello for Business deployments. It relies on a Microsoft Entra Kerberos server object in AD and avoids user certificate infrastructure.</p>",
    src:["whfb","entraKerberos"] };

  I["m8-5"] = { kind:"Scenario", type:"single", title:"Security keys, on-prem shares", obj:["2.1.8"], main:true,
    sit:"<p>Halcyon's warehouse supervisors sign in to hybrid joined Windows PCs with FIDO2 security keys. They now get prompted for passwords when opening on-premises file shares.</p>",
    q:"What enables on-premises SSO for these sign-ins?",
    opts:[
      { id:"a", t:"Create a Microsoft Entra Kerberos server object in each AD domain (for example with Set-AzureADKerberosServer)", c:1, f:"Entra can then issue partial Kerberos tickets that AD exchanges for full tickets.", i:[10,20,10] },
      { id:"b", t:"Enable Seamless SSO", f:"Seamless SSO covers browser sign-in to Entra from domain-joined devices, not this.", m:"Seamless SSO provides on-prem resource SSO for passwordless sign-in", i:[0,-5,-5] },
      { id:"c", t:"Install pass-through authentication agents", f:"PTA validates passwords, and these users aren't using passwords.", i:[0,-5,-5] },
      { id:"d", t:"Deploy smart card certificates to every supervisor", f:"Different method, more infrastructure.", i:[0,5,-15] } ],
    hints:["The feature's name combines Entra and an on-premises protocol."],
    exp:"<p>Microsoft Entra Kerberos creates an AzureADKerberos computer object in AD that works like a read-only domain controller for Entra. That allows FIDO2 sign-in and cloud Kerberos trust to reach on-premises resources without passwords.</p>",
    src:["entraKerberos"] };

  /* ---------------- Mission 09: Access Gate ---------------- */
  M.M9 = { id:"M9", domain:"D2", code:"Mission 09", title:"Access Gate", minutes:14,
    story:"Halcyon is graduating from security defaults to Conditional Access. Nadia hands you a whiteboard of policies and a warning: “If we lock out the CEO, it's your name on the incident.”",
    goal:"Predict access outcomes, plan and build policies, test them safely and deploy from templates.",
    groups:[
      { n:1, title:"Predict the gate", blurb:"Read policies and decide what happens.", items:["m9-1","m9-2"] },
      { n:2, title:"Build a policy", blurb:"Protect admins without locking anyone out.", items:["m9-3","m9-6"] },
      { n:3, title:"Test and template", blurb:"Troubleshoot results and deploy quickly.", items:["m9-4","m9-5"] } ],
    takeaways:[
      "Every policy that applies must be satisfied. A <b>Block</b> in any applicable policy wins.",
      "Plan policies around assignments (users, target resources, network, conditions) and controls (grant, session). Exclude emergency access accounts and start in <b>report-only</b>.",
      "Troubleshoot with the sign-in log's Conditional Access and Report-only tabs, and the What If tool.",
      "Templates deploy Microsoft-recommended policies quickly." ],
    next:"M10" };

  I["m9-1"] = { kind:"Access Gate", type:"single", title:"The IMAP client", obj:["2.2.2","2.2.3"], main:true,
    teach:"<p>A <b>Conditional Access</b> policy says: when these <b>assignments</b> match (users, target resources, network, conditions such as client apps or risk), apply these <b>controls</b> (block, or grant with requirements like MFA, plus optional session controls). All policies that apply are evaluated, and all their requirements must be met.</p>",
    sit:"<p>Two policies are on. Ana signs in to Exchange Online from an old IMAP mail client that uses basic (legacy) authentication.</p>",
    ev:[ { kind:"table", title:"Conditional Access policies (simulated)", columns:["Policy","Users","Resources","Conditions","Control"], rows:[
      ["CA01 Require MFA","All users (excl. emergency accounts)","All resources","—","Grant: require MFA"],
      ["CA02 Block legacy auth","All users (excl. emergency accounts)","All resources","Client apps: Exchange ActiveSync, Other clients","Block"] ] } ],
    q:"What happens to Ana's sign-in?",
    opts:[
      { id:"a", t:"Blocked by CA02", c:1, f:"IMAP with basic auth counts as an Other client, and Block wins.", i:[15,0,5] },
      { id:"b", t:"Allowed after MFA from CA01", f:"Legacy protocols can't perform MFA, and CA02 blocks them anyway.", m:"Legacy clients can satisfy MFA", i:[-10,0,0] },
      { id:"c", t:"Allowed, because legacy clients bypass Conditional Access", f:"Conditional Access evaluates legacy clients through the client apps condition.", m:"Legacy authentication bypasses Conditional Access", i:[-15,0,0] },
      { id:"d", t:"Allowed, because CA01 grants access and grant beats block", f:"Block always wins when it applies.", m:"Grant controls override block", i:[-15,0,0] } ],
    hints:["Which client apps value covers IMAP?","When two policies disagree, which kind wins?"],
    exp:"<p>Legacy authentication can't do MFA, so attackers love it. Blocking it with the client apps condition (Exchange ActiveSync and Other clients) is a baseline policy. In Conditional Access, an applicable Block always wins.</p>",
    src:["caOverview","caGrant"] };

  I["m9-2"] = { kind:"Access Gate", type:"single", title:"Unmanaged laptop, SharePoint", obj:["2.2.3","2.2.6"], main:true,
    sit:"<p>Jun signs in to SharePoint Online from his personal laptop (not enrolled in Intune, not hybrid joined) and completes MFA.</p>",
    ev:[ { kind:"table", title:"Conditional Access policies (simulated)", columns:["Policy","Users","Resources","Control"], rows:[
      ["CA01 Require MFA","All users","All resources","Grant: require MFA"],
      ["CA05 Managed devices for SharePoint","All users","Office 365 SharePoint Online","Grant: require device marked compliant"] ] } ],
    q:"What happens?",
    opts:[
      { id:"a", t:"Blocked: CA05's compliant-device requirement isn't met", c:1, f:"Both policies apply and both must be satisfied.", i:[15,-5,0] },
      { id:"b", t:"Allowed: CA01 is satisfied, and one satisfied policy is enough", f:"Every applicable policy must be satisfied.", m:"Satisfying one policy is enough", i:[-15,5,0] },
      { id:"c", t:"Allowed: MFA counts as a compliant device", f:"Compliance is a device state reported by Intune.", m:"MFA implies device compliance", i:[-15,5,0] },
      { id:"d", t:"Allowed, but only in read-only mode", f:"That would need a session control such as app enforced restrictions, which isn't configured.", i:[0,0,0] } ],
    hints:["Conditional Access doesn't pick the easiest policy."],
    exp:"<p>Device-based grant controls, such as <b>require device to be marked as compliant</b> or <b>require Microsoft Entra hybrid joined device</b>, enforce restrictions based on device state. Combine them with MFA when users must meet both.</p>",
    src:["caGrant","caOverview"] };

  I["m9-3"] = { kind:"Policy Workshop", type:"config", title:"Protect the admins", obj:["2.2.1","2.2.2","2.2.3","4.3.6"], main:true,
    story:"Nadia: <b>“Admins get phishing-resistant MFA everywhere. Don't lock us out, and don't flip it on blind.”</b>",
    sit:"<p>Build the policy: target privileged directory roles, protect every resource, require phishing-resistant MFA, avoid locking out the tenant, and observe impact before enforcing.</p>",
    teach:"<p>Plan Conditional Access by writing the requirement as a sentence (“when <i>who</i> accesses <i>what</i> under <i>which conditions</i>, require <i>this</i>”), then map each part to a setting. <b>Authentication strengths</b> let you require specific method combinations. <b>Report-only</b> evaluates and logs a policy without enforcing it.</p>",
    fields:[
      { id:"users", label:"Users › Include", options:[
        { id:"roles", text:"Select directory roles: Global Administrator, Privileged Role Administrator, Security Administrator, …", correct:true, feedback:"Targets privileged roles wherever they're assigned.", impact:{sec:10} },
        { id:"all", text:"All users", feedback:"Would require phishing-resistant MFA for 1,200 people who haven't registered it.", impact:{acc:-25} } ]},
      { id:"exclude", label:"Users › Exclude", options:[
        { id:"breakglass", text:"Emergency access accounts", correct:true, feedback:"Prevents a tenant-wide lockout if something goes wrong.", impact:{acc:10} },
        { id:"none", text:"Nobody", feedback:"A misconfiguration could lock every admin out, including emergency accounts.", misconception:"Emergency accounts need no exclusion", impact:{acc:-15, sec:-5} } ]},
      { id:"grant", label:"Grant", options:[
        { id:"strength", text:"Require authentication strength: Phishing-resistant MFA", correct:true, feedback:"Accepts only phishing-resistant methods.", impact:{sec:15} },
        { id:"mfa", text:"Require multifactor authentication", feedback:"Any MFA method would satisfy it, including phishable ones.", impact:{sec:-5} },
        { id:"block", text:"Block access", feedback:"Admins couldn't work at all.", impact:{acc:-30} } ]},
      { id:"state", label:"Enable policy", options:[
        { id:"report", text:"Report-only", correct:true, feedback:"Shows who would be affected before you enforce.", impact:{acc:5, ops:5} },
        { id:"on", text:"On", feedback:"Admins without registered methods would be locked out immediately.", misconception:"New policies can go straight to On", impact:{acc:-15} } ]} ],
    hints:["Every field has a lockout risk; pick the option that manages it.","Phishing-resistant is an authentication strength, not the plain MFA checkbox."],
    exp:"<p>Target directory roles, exclude emergency access accounts, require the <b>Phishing-resistant MFA</b> authentication strength, and start in report-only. Make sure admins have registered suitable methods before switching to On. Emergency accounts should still be protected with phishing-resistant methods and monitored, because mandatory MFA applies to them too.</p>",
    src:["phishResistant","caPlan","caReportOnly","emergency"] };

  I["m9-6"] = { kind:"Transfer check", type:"single", title:"Countries we don't operate in", obj:["2.2.2","2.2.1"],
    sit:"<p>Halcyon operates only in Canada, the Netherlands and Norway. It wants to block sign-ins from all other countries, without risking emergency access.</p>",
    q:"Which policy design fits?",
    opts:[
      { id:"a", t:"A countries named location (CA, NL, NO); policy: all users except emergency accounts, all resources, include any location, exclude that named location, block", c:1, f:"Blocks everywhere except the listed countries." },
      { id:"b", t:"Include the named location and block", f:"That blocks the three countries you do operate in.", m:"Include and exclude are interchangeable for locations" },
      { id:"c", t:"Add the three countries as MFA trusted IPs", f:"Trusted IPs are IP ranges for skipping MFA, not country blocking." },
      { id:"d", t:"Block all users with no exclusions", f:"Emergency accounts would be blocked too." } ],
    hints:["Block everything that isn't on the allowed list."],
    exp:"<p>Named locations can be IP ranges or countries. To allow only certain countries, include all locations, exclude the allowed named location, and block. As always, exclude emergency access accounts.</p>",
    src:["caLocations","emergency"] };

  I["m9-4"] = { kind:"Identity Detective", type:"single", title:"Why was I blocked?", obj:["2.2.4"], main:true,
    sit:"<p>Lena from Finance says she was blocked signing in to the expenses app at 14:02. Halcyon has 23 Conditional Access policies.</p>",
    q:"Where's the fastest place to see exactly which policies applied and why?",
    opts:[
      { id:"a", t:"Her sign-in log entry, on the <b>Conditional Access</b> tab (and the Report-only tab)", c:1, f:"Shows each policy's result for that sign-in: success, failure or not applied.", i:[5,10,15] },
      { id:"b", t:"The audit logs", f:"Audit logs show configuration changes, not sign-in evaluation.", m:"Audit logs record sign-in policy results", i:[0,0,-5] },
      { id:"c", t:"Disable policies one at a time until she can sign in", f:"Testing in production by removing protection.", i:[-25,5,-10] },
      { id:"d", t:"Her Assigned roles page", f:"Roles don't explain a Conditional Access result.", i:[0,0,-5] } ],
    hints:["Start with the event itself."],
    exp:"<p>Each sign-in log entry lists the policies that applied and their results, including report-only policies. To test a hypothetical sign-in before it happens, use the <b>What If</b> tool.</p>",
    src:["whatIf","signinLogs"] };

  I["m9-5"] = { kind:"Scenario", type:"single", title:"Fast and recommended", obj:["2.2.10"], main:true,
    sit:"<p>Halcyon wants Microsoft's recommended baseline policies, such as blocking legacy authentication and requiring MFA for admins, deployed today with minimal manual configuration.</p>",
    q:"What's the fastest approach?",
    opts:[
      { id:"a", t:"Create policies from Conditional Access templates, starting in report-only", c:1, f:"Templates prefill Microsoft-recommended settings.", i:[10,5,20] },
      { id:"b", t:"Build each policy from scratch", f:"Works, but slower and more error-prone.", i:[5,0,-10] },
      { id:"c", t:"Re-enable security defaults alongside Conditional Access", f:"Security defaults and Conditional Access policies aren't used together.", m:"Security defaults combine with Conditional Access", i:[0,0,-5] },
      { id:"d", t:"Import policies from another company's tenant", f:"Unknown assumptions and object IDs that don't exist in your tenant.", i:[-10,0,-5] } ],
    hints:["Look for “New policy from template”."],
    exp:"<p>Conditional Access templates are grouped into areas such as secure foundation, Zero Trust, remote work, protecting administrators and emerging threats. Review the assignments (especially exclusions) and start in report-only.</p>",
    src:["caTemplates"] };

  /* ---------------- Mission 10: Session Control ---------------- */
  M.M10 = { id:"M10", domain:"D2", code:"Mission 10", title:"Session Control", minutes:14,
    story:"Access isn't only granted at the gate. Kiosks keep sessions open, the board's documents need extra proof, and someone keeps editing Conditional Access policies at midnight.",
    goal:"Control sessions, enforce device restrictions, use authentication context and protected actions, and understand CAE.",
    groups:[
      { n:1, title:"Sessions that end", blurb:"Sign-in frequency, persistent browser and device filters.", items:["m10-1","m10-2"] },
      { n:2, title:"Step-up when it matters", blurb:"Authentication context and protected actions.", items:["m10-3","m10-4","m10-5"] },
      { n:3, title:"Real-time revocation", blurb:"Continuous access evaluation and app-enforced restrictions.", items:["m10-6","m10-7"] } ],
    takeaways:[
      "Session controls include sign-in frequency, persistent browser session, app enforced restrictions, Conditional Access App Control and CAE customization.",
      "<b>Filter for devices</b> targets devices by properties such as extension attributes.",
      "<b>Authentication context</b> tags sensitive resources or actions so a policy can require step-up only there. <b>Protected actions</b> attach an authentication context to specific Entra permissions.",
      "CAE critical events (account disabled, password reset, sessions revoked, high user risk) apply in near real time; IP location changes are enforced by CAE-capable services." ],
    next:"M11" };

  I["m10-1"] = { kind:"Scenario", type:"single", title:"Shared kiosks", obj:["2.2.5"], main:true,
    sit:"<p>Warehouse staff share kiosk PCs. Sessions must require sign-in again every 4 hours, and the browser must never offer “Stay signed in?”.</p>",
    teach:"<p><b>Session controls</b> shape what happens after access is granted. <b>Sign-in frequency</b> sets how often users must reauthenticate. <b>Persistent browser session</b> controls whether browser sessions survive closing the browser.</p>",
    q:"Which session controls meet the requirement?",
    opts:[
      { id:"a", t:"Sign-in frequency: 4 hours; Persistent browser session: Never persistent", c:1, f:"Both requirements, one policy.", i:[15,0,5] },
      { id:"b", t:"Require MFA every sign-in", f:"A grant control, which doesn't limit session length.", m:"Grant controls limit session lifetime", i:[0,-5,0] },
      { id:"c", t:"Use app enforced restrictions", f:"Limits what SharePoint/Exchange allow on unmanaged devices; doesn't time out sessions.", i:[0,-5,0] },
      { id:"d", t:"Revoke all sessions every 4 hours with a script", f:"Fragile, and disruptive for everyone.", i:[0,-10,-20] } ],
    hints:["Two session settings, one for time and one for the browser."],
    exp:"<p>Target the kiosk devices (for example with a device filter) or the warehouse users, then set sign-in frequency and persistent browser session in the same policy.</p>",
    src:["caSession"] };

  I["m10-2"] = { kind:"Scenario", type:"single", title:"Only the kiosks", obj:["2.2.6","2.2.2"], main:true,
    sit:"<p>The kiosk policy should apply only to kiosk devices. Intune sets <b>extensionAttribute1 = \"Kiosk\"</b> on them.</p>",
    q:"How do you target only those devices?",
    opts:[
      { id:"a", t:"Use the <b>Filter for devices</b> condition with a rule such as <code>device.extensionAttribute1 -eq \"Kiosk\"</code>", c:1, f:"Device filters target devices by their properties.", i:[10,5,10] },
      { id:"b", t:"Target a named location for the warehouse", f:"Location isn't device type; office PCs in the warehouse would match too.", i:[-5,-5,0] },
      { id:"c", t:"Target the Windows device platform", f:"Every Windows PC would match.", i:[0,-15,0] },
      { id:"d", t:"Put kiosk accounts in a group and target it", f:"Staff use personal accounts on shared PCs, so a user group misses the device dimension.", i:[0,-5,0] } ],
    hints:["The distinguishing fact is a device property."],
    exp:"<p>Filter for devices uses rule syntax over device properties (such as model, trust type, extension attributes) to include or exclude devices in a policy.</p>",
    src:["caFilterDevices"] };

  I["m10-3"] = { kind:"Scenario", type:"single", title:"The board pack", obj:["2.2.8"], main:true,
    sit:"<p>A SharePoint site holds board documents. Opening that site, and only that site, must require phishing-resistant MFA on a compliant device. The rest of SharePoint keeps normal rules.</p>",
    teach:"<p>An <b>authentication context</b> is a tag (c1–c99) you define in Conditional Access and reference from resources or actions, such as a SharePoint site via a sensitivity label, Defender for Cloud Apps, PIM role activation or custom apps. Policies that target the tag apply only when it's requested.</p>",
    q:"How do you meet the requirement?",
    opts:[
      { id:"a", t:"Create an authentication context, target it with a Conditional Access policy (phishing-resistant strength + compliant device), and apply it to the site through a sensitivity label", c:1, f:"Step-up happens only where the tag is requested.", i:[20,5,5] },
      { id:"b", t:"Apply the requirements to all of SharePoint Online", f:"Over-applies to every site.", i:[10,-20,0] },
      { id:"c", t:"Create a separate tenant for the board", f:"Huge overhead for one site.", i:[5,-10,-30] },
      { id:"d", t:"Use a named location for the boardroom", f:"The requirement is about authentication and device, not location.", i:[0,-5,0] } ],
    hints:["You need a way to tag one resource for a policy."],
    exp:"<p>Authentication context lets Conditional Access protect sensitive data or actions inside an app without applying the same requirement to the whole app.</p>",
    src:["caTargets","caGrant"] };

  I["m10-4"] = { kind:"Scenario", type:"single", title:"Midnight policy edits", obj:["2.2.9"], main:true,
    sit:"<p>Anyone who updates or deletes Conditional Access policies must have just completed phishing-resistant MFA from a compliant device, no matter which role gives them the permission.</p>",
    q:"What should you configure?",
    opts:[
      { id:"a", t:"A <b>protected action</b>: assign an authentication context, enforced by a Conditional Access policy, to the Conditional Access policy permissions", c:1, f:"Enforced on the action, independent of role.", i:[20,0,5] },
      { id:"b", t:"Move all Conditional Access admins into PIM", f:"Good practice, but activation doesn't guarantee step-up at the moment of the action.", i:[10,0,0] },
      { id:"c", t:"Create a policy targeting the Microsoft Admin Portals app", f:"Applies to portal sign-in, not to the specific permission, and not to API use.", m:"Admin portal policies equal protected actions", i:[5,0,0] },
      { id:"d", t:"Remove the Conditional Access Administrator role from everyone", f:"Then nobody can manage policies.", i:[0,-20,-10] } ],
    hints:["The requirement attaches to an action, not to a role or an app."],
    exp:"<p>Protected actions are Entra permissions assigned Conditional Access policies through an authentication context. They apply to areas such as Conditional Access policy management and cross-tenant access settings, and are enforced when a user performs the action.</p>",
    src:["protectedActions"] };

  I["m10-5"] = { kind:"Sequencing", type:"order", title:"Wire up a protected action", obj:["2.2.9","2.2.8"], main:true,
    sit:"<p>Set up the protected action from the previous challenge.</p>",
    q:"Put the steps in order.",
    steps:[
      { id:"s1", t:"Create an authentication context (for example c5 “Protected admin actions”)", w:"Protected actions reference a context, so it must exist first." },
      { id:"s2", t:"Create a Conditional Access policy that targets the c5 context and requires the controls", w:"The context needs a policy to enforce something." },
      { id:"s3", t:"In Roles & admins › Protected actions, assign c5 to the Conditional Access policy permissions", w:"This links the permissions to the context." },
      { id:"s4", t:"Test by updating a policy, and confirm the step-up prompt", w:"Verify before relying on it." } ],
    start:["s3","s4","s1","s2"],
    impact:{ correct:{sec:10, ops:5}, wrong:{sec:-5} },
    hints:["Build from the inside out: tag, then rule, then link."],
    exp:"<p>Context first, policy second, protected action third, test last. If you try to add a protected action and no context is listed, the tenant has no authentication context values enabled yet.</p>",
    src:["protectedActions"] };

  I["m10-6"] = { kind:"Scenario", type:"single", title:"Leaving the office", obj:["2.2.7"], main:true,
    sit:"<p>Exchange Online is protected by a policy that allows access only from Halcyon's office IP ranges. Ana opens Outlook in the office, then carries her laptop to a café.</p>",
    teach:"<p><b>Continuous access evaluation (CAE)</b> lets CAE-capable services, such as Exchange Online, SharePoint Online and Teams, subscribe to critical events and re-check IP location policies during a session, instead of waiting for tokens to expire.</p>",
    q:"With CAE, what happens when she reconnects from the café?",
    opts:[
      { id:"a", t:"Exchange Online re-evaluates the location policy in near real time and blocks access from the new IP", c:1, f:"CAE extends location enforcement into the session.", i:[15,0,0] },
      { id:"b", t:"Access continues until her one-hour access token expires", f:"That's the behavior without CAE.", m:"Location is checked only at token issuance", i:[-10,0,0] },
      { id:"c", t:"Access continues for 28 hours", f:"Long-lived CAE tokens don't skip location checks; that's the point of CAE.", i:[-10,0,0] },
      { id:"d", t:"She must re-register MFA", f:"Location change doesn't touch MFA registration.", i:[0,-5,0] } ],
    hints:["CAE has two halves: critical events and…"],
    exp:"<p>CAE has two parts: critical event evaluation (account disabled or deleted, password change or reset, sessions revoked, MFA enabled, high user risk) and Conditional Access policy evaluation for IP location. <b>Strict location enforcement</b> tightens the IP check further for stable networks.</p>",
    src:["cae"] };

  I["m10-7"] = { kind:"Transfer check", type:"single", title:"Read, don't download", obj:["2.2.5","3.4.3"],
    sit:"<p>Employees may use SharePoint Online in a browser on personal devices, but must not download, print or sync files there.</p>",
    q:"Which control meets the requirement with the least effort?",
    opts:[
      { id:"a", t:"A Conditional Access session control: <b>Use app enforced restrictions</b>, with SharePoint's limited access for unmanaged devices", c:1, f:"SharePoint enforces browser-only, limited access." },
      { id:"b", t:"Block SharePoint on unmanaged devices", f:"Stricter than required; the business wants browser access." },
      { id:"c", t:"Require a compliant device", f:"Personal devices aren't compliant, so access would be blocked." },
      { id:"d", t:"Sign-in frequency of 1 hour", f:"Doesn't restrict downloads." } ],
    hints:["Let the app enforce it."],
    exp:"<p>App enforced restrictions pass device information to SharePoint Online and Exchange Online, which then apply their own limited experience (for example web-only, no download). For finer real-time control, Conditional Access App Control with Defender for Cloud Apps session policies is the next step up.</p>",
    src:["caSession","appEnforced"] };

  /* ---------------- Mission 11: Risk Radar ---------------- */
  M.M11 = { id:"M11", domain:"D2", code:"Mission 11", title:"Risk Radar", minutes:13,
    story:"ID Protection lights up: a leaked password, a sign-in from a country nobody has visited, and a service principal acting strangely. And the old risk policies? Retired on October 1, 2026. Halcyon's are still sitting there.",
    goal:"Build risk-based Conditional Access policies, investigate risky users and sign-ins, and handle risky workload identities.",
    groups:[
      { n:1, title:"Risk policies, the new way", blurb:"User and sign-in risk in Conditional Access.", items:["m11-1","m11-2","m11-5"] },
      { n:2, title:"Investigate and remediate", blurb:"Risky users and risky sign-ins.", items:["m11-3","m11-6"] },
      { n:3, title:"Risky robots", blurb:"Workload identity risk.", items:["m11-4"] } ],
    takeaways:[
      "Configure risk policies in Conditional Access: the legacy ID Protection risk policies were retired on October 1, 2026. Risk-based policies require Microsoft Entra ID P2.",
      "User risk is remediated by a secure password change; sign-in risk by MFA. Users must already be registered for MFA. Keep user risk and sign-in risk in separate policies.",
      "Dismiss risk only for confirmed false positives; confirm compromise when you know it happened.",
      "Risky workload identities: full details and risk-based Conditional Access for service principals require Workload ID Premium. Rotate exposed credentials first." ],
    next:"M12" };

  I["m11-1"] = { kind:"Policy Workshop", type:"config", title:"High user risk", obj:["2.3.1"], main:true,
    sit:"<p>Build a policy so that users at <b>high user risk</b> (likely compromised) can fix it themselves with a secure password change.</p>",
    teach:"<p><b>User risk</b> estimates how likely it is that an identity is compromised (for example, leaked credentials). <b>Sign-in risk</b> estimates how likely it is that a specific sign-in isn't from the owner. ID Protection sends both to Conditional Access, where risk-based policies act on them. Both need Microsoft Entra ID P2.</p>",
    fields:[
      { id:"where", label:"Where to configure", options:[
        { id:"ca", text:"Conditional Access policy", correct:true, feedback:"The supported home for risk policies.", impact:{ops:10} },
        { id:"legacy", text:"ID Protection › User risk policy (legacy)", feedback:"The legacy risk policies were retired on October 1, 2026.", misconception:"Legacy ID Protection risk policies are still supported", impact:{sec:-20} } ]},
      { id:"cond", label:"Condition", options:[
        { id:"userHigh", text:"User risk: High", correct:true, feedback:"Targets likely-compromised identities.", impact:{sec:10} },
        { id:"signinHigh", text:"Sign-in risk: High", feedback:"That's the other risk type, for a separate policy.", impact:{sec:-5} } ]},
      { id:"grant", label:"Grant", options:[
        { id:"pwchange", text:"Require multifactor authentication and Require password change", correct:true, feedback:"A secure password change remediates user risk and closes the risky user event.", impact:{acc:10, sec:5} },
        { id:"block", text:"Block access", feedback:"Users can't self-remediate, and every case becomes a ticket.", impact:{acc:-15, ops:-15} } ]} ],
    hints:["Ask where risk policies live now.","User risk is fixed by changing what was leaked."],
    exp:"<p>Create the policy in Conditional Access (exclude emergency accounts), with condition <b>User risk: High</b>, grant requiring MFA and password change, and sign-in frequency <b>Every time</b>. Microsoft recommends separate policies for user risk and sign-in risk.</p>",
    src:["riskPolicies","riskConfigure"] };

  I["m11-2"] = { kind:"Scenario", type:"single", title:"Medium-risk sign-ins", obj:["2.3.2"], main:true,
    sit:"<p>Halcyon wants sign-ins with <b>medium or high sign-in risk</b> to require MFA.</p>",
    q:"What must be true for users before this policy helps them self-remediate?",
    opts:[
      { id:"a", t:"They must already be registered for Microsoft Entra MFA", c:1, f:"A risky sign-in is a bad moment to register MFA for the first time.", i:[10,10,5] },
      { id:"b", t:"They must have a compliant device", f:"Not required for a sign-in risk policy that requires MFA.", i:[0,-5,0] },
      { id:"c", t:"They must be excluded from all other policies", f:"Unrelated, and dangerous.", i:[-15,0,0] },
      { id:"d", t:"They need Workload ID Premium", f:"That's for service principals.", i:[0,0,-5] } ],
    hints:["If MFA is the fix, what does the user need?"],
    exp:"<p>Sign-in risk policies that require MFA only work for users who have registered MFA. Drive registration first (registration campaigns, Temporary Access Pass for onboarding).</p>",
    src:["riskPolicies"] };

  I["m11-5"] = { kind:"Transfer check", type:"single", title:"The old policy", obj:["2.3.1","2.3.2"],
    sit:"<p>It's November 2026. Halcyon's only user risk protection is the user risk policy that was enabled years ago under ID Protection › Protect.</p>",
    q:"What's the situation?",
    opts:[
      { id:"a", t:"The legacy risk policies were retired on October 1, 2026; recreate the protection as risk-based Conditional Access policies", c:1, f:"Don't count on the legacy policy." },
      { id:"b", t:"It keeps working indefinitely", f:"Microsoft retired the legacy risk policies on October 1, 2026.", m:"Legacy ID Protection risk policies are still supported" },
      { id:"c", t:"Microsoft converted it to Conditional Access automatically", f:"Microsoft didn't auto-convert legacy risk policies.", m:"Legacy risk policies were migrated automatically" },
      { id:"d", t:"It works, but only for guests", f:"There's no such split." } ],
    hints:["Check the date."],
    exp:"<p>Migrate by creating equivalent user risk and sign-in risk policies in Conditional Access in report-only mode, confirm results, enforce, then disable the legacy policies.</p>",
    src:["riskConfigure","riskPolicies"] };

  I["m11-3"] = { kind:"Identity Detective", type:"single", title:"Leaked credentials", obj:["2.3.4"], main:true,
    sit:"<p>Leo shows as a risky user at <b>High</b> risk. The detection is <b>Leaked credentials</b>. Leo admits he reused his Halcyon password on a gaming site that was breached.</p>",
    ev:[ { kind:"table", title:"ID Protection › Risky users", columns:["User","Risk level","Risk state","Detection"], rows:[["Leo Brandt","High","At risk","Leaked credentials (offline)"]] } ],
    q:"What's the right remediation?",
    opts:[
      { id:"a", t:"Have Leo perform a secure password change (or reset it as an admin), which remediates the user risk", c:1, f:"The leaked secret stops working, and the risk closes.", i:[20,5,5] },
      { id:"b", t:"Dismiss user risk", f:"Dismiss is for false positives, and this one is real.", m:"Dismissing risk remediates it", i:[-20,5,5] },
      { id:"c", t:"Confirm sign-in safe", f:"There's no specific sign-in to vouch for; the credential itself leaked.", i:[-10,5,0] },
      { id:"d", t:"Block Leo permanently", f:"Overkill. The fix is a new password.", i:[5,-20,-10] } ],
    hints:["What exactly leaked?"],
    exp:"<p>For leaked credentials, change the password. Admins can also <b>confirm user compromised</b> (sets risk to high and informs detection) or <b>dismiss user risk</b> when investigation shows a false positive. Each action trains ID Protection.</p>",
    src:["riskRemediate"] };

  I["m11-6"] = { kind:"Transfer check", type:"single", title:"One policy or two?", obj:["2.3.1","2.3.2"],
    sit:"<p>Theo built a single Conditional Access policy whose conditions include both <b>Sign-in risk: High</b> and <b>User risk: High</b>.</p>",
    q:"What's Microsoft's guidance?",
    opts:[
      { id:"a", t:"Don't combine them; create separate policies for each risk condition", c:1, f:"Combined conditions must all match, which narrows the policy unexpectedly." },
      { id:"b", t:"Combining them is recommended for efficiency", f:"Microsoft warns against it." },
      { id:"c", t:"It's fine as long as the grant is Block", f:"The warning applies regardless of control." },
      { id:"d", t:"Risk conditions can't be used in Conditional Access", f:"They can, with P2." } ],
    hints:["Conditions in one policy are combined with AND."],
    exp:"<p>Configured conditions in a single policy must all be satisfied for it to apply, so a combined policy fires only when both risks are high at once. Use one policy per risk type, each with its own remediation.</p>",
    src:["riskConfigure"] };

  I["m11-4"] = { kind:"Scenario", type:"single", title:"The chatty service principal", obj:["2.3.5"], main:true,
    sit:"<p>ID Protection flags the service principal <b>HR-Export</b>: “Leaked credentials”. Its client secret was committed to a public code repository.</p>",
    q:"What should you do first?",
    opts:[
      { id:"a", t:"Remove the exposed secret, issue a new credential (prefer a certificate or federated credential), and review the app's sign-ins and permissions", c:1, f:"Kill the leaked secret, then investigate what it did.", i:[20,0,0] },
      { id:"b", t:"Dismiss the risk because service principals can't be phished", f:"Leaked secrets work for anyone who finds them.", m:"Workload identities can't be compromised", i:[-25,0,0] },
      { id:"c", t:"Require MFA for the service principal", f:"Service principals can't perform MFA.", m:"Service principals can do MFA", i:[0,0,-5] },
      { id:"d", t:"Add the service principal to a group targeted by a user-risk policy", f:"User risk policies don't apply to service principals, and group-based targeting doesn't enforce Conditional Access on them.", i:[0,0,-5] } ],
    hints:["The credential is public. Make it useless."],
    exp:"<p>ID Protection detects risk for workload identities (for example leaked credentials, suspicious API traffic). Full risk details and risk-based Conditional Access for service principals require Workload ID Premium. Those policies must target the service principal directly, not through a group.</p>",
    src:["workloadRisk","caWorkload"] };

  /* ---------------- Mission 12: Secure Edge ---------------- */
  M.M12 = { id:"M12", domain:"D2", code:"Mission 12", title:"Secure Edge", minutes:13,
    story:"Halcyon's VPN concentrator is older than some of the warehouse staff. Global Secure Access, Microsoft's Security Service Edge, is on the table.",
    goal:"Deploy clients, replace VPN with Private Access, filter the web with Internet Access, and secure Microsoft traffic.",
    groups:[
      { n:1, title:"Goodbye VPN", blurb:"Private Access and the client.", items:["m12-1","m12-2"] },
      { n:2, title:"The open internet", blurb:"Web content filtering and profile order.", items:["m12-4","m12-6"] },
      { n:3, title:"Microsoft traffic", blurb:"Tenant restrictions and source IP restoration.", items:["m12-3","m12-5"] } ],
    takeaways:[
      "Global Secure Access has three traffic forwarding profiles, evaluated in order: <b>Microsoft traffic</b>, <b>Private Access</b>, <b>Internet Access</b>.",
      "Private Access uses connectors near private apps and <b>Quick Access</b> or per-app Private Access apps; traffic is acquired by the Global Secure Access client.",
      "Internet Access applies web content filtering through security profiles linked to Conditional Access.",
      "The Microsoft traffic profile supports universal tenant restrictions. Enable source IP restoration (Global Secure Access signaling in Conditional Access) so policies see users' real IPs." ],
    next:"B2" };

  I["m12-1"] = { kind:"Scenario", type:"single", title:"Replace the VPN", obj:["2.4.2"], main:true,
    sit:"<p>Remote staff need the on-premises file server and an internal web app (by FQDN and IP range) without a VPN, with Conditional Access applied.</p>",
    teach:"<p><b>Global Secure Access</b> is the area of the Entra admin center for <b>Microsoft Entra Private Access</b> (private apps) and <b>Microsoft Entra Internet Access</b> (internet and SaaS, plus a Microsoft traffic profile). Private Access uses <b>connectors</b> installed near the private resources, and app segments defined in <b>Quick Access</b> or per-app Private Access apps.</p>",
    q:"What should you configure?",
    opts:[
      { id:"a", t:"Microsoft Entra Private Access: install connectors on-premises, define the FQDNs and IP ranges in Quick Access (or per-app apps), and enable the Private Access profile", c:1, f:"Zero Trust network access to private resources.", i:[15,15,10] },
      { id:"b", t:"Microsoft Entra Internet Access web filtering", f:"That's for internet traffic, not private resources.", i:[0,-15,0] },
      { id:"c", t:"Open firewall ports to the internet", f:"Exposes internal services.", i:[-30,10,0] },
      { id:"d", t:"Enable the Microsoft traffic profile only", f:"Covers Microsoft services like Exchange and SharePoint, not private apps.", m:"The Microsoft traffic profile covers private apps", i:[0,-15,0] } ],
    hints:["The resources are private."],
    exp:"<p>Microsoft recommends configuring Quick Access before enabling the Private Access traffic forwarding profile. You can add per-app Private Access apps (enterprise apps) for finer control and Conditional Access per app.</p>",
    src:["gsaPrivate","gsaProfiles"] };

  I["m12-2"] = { kind:"Scenario", type:"single", title:"Getting traffic in", obj:["2.4.1"], main:true,
    sit:"<p>Private Access is configured, but remote Windows laptops still can't reach the file server through it.</p>",
    q:"What's missing on the laptops?",
    opts:[
      { id:"a", t:"The Global Secure Access client, deployed to the devices (for example with Intune)", c:1, f:"Private Access traffic is acquired by the client on the device.", i:[5,20,10] },
      { id:"b", t:"A private network connector on each laptop", f:"Connectors run on servers near the private resources, not on user devices.", m:"Connectors install on client devices", i:[0,-10,-10] },
      { id:"c", t:"Microsoft Entra Connect Sync", f:"Identity sync has nothing to do with traffic acquisition.", i:[0,-10,-5] },
      { id:"d", t:"Nothing: Global Secure Access is agentless for private apps", f:"Private Access traffic can currently be acquired only with the client.", m:"Private Access is agentless", i:[0,-15,0] } ],
    hints:["Something must capture the traffic on the device."],
    exp:"<p>The Global Secure Access client (Windows, macOS, iOS, Android) acquires traffic and tunnels it to the service. Download it from Global Secure Access › Connect › Client download, and deploy at scale with Intune.</p>",
    src:["gsaClient","gsaPrivate"] };

  I["m12-4"] = { kind:"Scenario", type:"single", title:"No gambling sites", obj:["2.4.3"], main:true,
    sit:"<p>Halcyon wants to block the gambling web category for all employees using Global Secure Access, wherever they work.</p>",
    q:"How is this configured?",
    opts:[
      { id:"a", t:"Create a web content filtering policy blocking Gambling, add it to a security profile, and link the profile with a Conditional Access policy for users", c:1, f:"Internet Access policies are applied through security profiles and Conditional Access.", i:[15,0,10] },
      { id:"b", t:"Add gambling sites to Quick Access", f:"Quick Access defines private resources to reach, not sites to block.", m:"Quick Access blocks websites", i:[0,0,-10] },
      { id:"c", t:"Create a named location for gambling sites", f:"Named locations describe where users sign in from.", i:[0,0,-10] },
      { id:"d", t:"Use the Microsoft traffic profile", f:"That profile covers Microsoft services, not general internet sites.", i:[0,0,-10] } ],
    hints:["Policy → profile → Conditional Access."],
    exp:"<p>Microsoft Entra Internet Access filters web traffic with policies (such as web content filtering by category or FQDN) grouped into security profiles, which are linked to users through Conditional Access session settings.</p>",
    src:["gsaInternet","gsaProfiles"] };

  I["m12-6"] = { kind:"Transfer check", type:"single", title:"Which profile wins?", obj:["2.4.4","2.4.3"],
    sit:"<p>A device's traffic to SharePoint Online matches rules in both the Microsoft traffic profile and the Internet Access profile.</p>",
    q:"Which profile handles it?",
    opts:[
      { id:"a", t:"The Microsoft traffic profile, because it's evaluated first", c:1, f:"Order: Microsoft traffic, then Private Access, then Internet Access." },
      { id:"b", t:"The Internet Access profile, because it's the most specific", f:"Evaluation follows profile order, not specificity." },
      { id:"c", t:"Both, so the traffic is inspected twice", f:"Traffic is handled by the first matching profile." },
      { id:"d", t:"Neither: overlapping traffic isn't forwarded", f:"Only traffic matching no profile isn't forwarded." } ],
    hints:["There's a fixed evaluation order."],
    exp:"<p>Global Secure Access evaluates traffic against the Microsoft traffic, Private Access and Internet Access profiles in that order. Traffic matching none isn't forwarded to the service.</p>",
    src:["gsaProfiles"] };

  I["m12-3"] = { kind:"Scenario", type:"single", title:"Other people's tenants", obj:["2.4.4"], main:true,
    sit:"<p>Halcyon worries employees could sign in to other organizations' Microsoft 365 tenants from corporate devices and copy data out.</p>",
    q:"Which Global Secure Access capability addresses this?",
    opts:[
      { id:"a", t:"Enable the Microsoft traffic profile and universal tenant restrictions", c:1, f:"Tenant restrictions v2 enforced through Global Secure Access blocks sign-ins to unapproved tenants.", i:[20,0,5] },
      { id:"b", t:"Block all external collaboration in cross-tenant access settings", f:"Inbound/outbound B2B settings don't stop a user signing in to another tenant with an account from that tenant.", m:"B2B settings block foreign-tenant sign-ins", i:[5,-15,0] },
      { id:"c", t:"A web content filtering policy for microsoft.com", f:"Would break Microsoft 365 for everyone.", i:[0,-30,0] },
      { id:"d", t:"Disable guest invitations", f:"About inviting people in, not signing in elsewhere.", i:[0,-5,0] } ],
    hints:["The data leaves through Microsoft's own services."],
    exp:"<p>Getting started with the Microsoft traffic profile means enabling the profile, installing the client, enabling universal tenant restrictions, and enabling Global Secure Access signaling in Conditional Access.</p>",
    src:["gsaStart","gsaProfiles"] };

  I["m12-5"] = { kind:"Transfer check", type:"single", title:"Whose IP is it?", obj:["2.4.4","2.4.1"],
    sit:"<p>After rolling out Global Secure Access, Conditional Access policies based on Halcyon's office IP ranges start behaving oddly, and sign-in logs show Microsoft edge IPs.</p>",
    q:"What fixes this?",
    opts:[
      { id:"a", t:"Enable Global Secure Access signaling in Conditional Access (source IP restoration)", c:1, f:"Restores the user's original public IP for Entra and Conditional Access." },
      { id:"b", t:"Add Microsoft's edge IP ranges to the trusted named location", f:"Then every GSA user, anywhere, looks like the office.", m:"Trusting provider IPs is a safe workaround" },
      { id:"c", t:"Uninstall the client on office PCs", f:"Gives up the protection to work around a reporting issue." },
      { id:"d", t:"Switch policies to report-only", f:"Hides the problem." } ],
    hints:["The service hides the original IP unless you tell it not to."],
    exp:"<p>Traffic tunneled through Global Secure Access reaches services from the edge's IP. Source IP restoration lets Microsoft Entra see the device's real egress IP for logs and location-based policies. Global Secure Access also offers a <b>compliant network</b> condition as an alternative to IP-based locations.</p>",
    src:["gsaUniversal","gsaLimits"] };

  /* ---------------- Boss 2: The Phish ---------------- */
  M.B2 = { id:"B2", domain:"D2", boss:true, code:"Boss · Domain 2", title:"The Phish", minutes:15,
    story:"02:14. Leo approved a push prompt after nine he denied. 02:20: a new authenticator appears on his account. 02:31: someone in another country is reading his mail. Your phone rings.",
    goal:"Contain an account compromise, close the gaps and prove the fixes work.",
    groups:[
      { n:1, title:"Contain", blurb:"Stop the attacker now.", items:["b2-1","b2-2"] },
      { n:2, title:"Close the gaps", blurb:"Harden registration and sign-in.", items:["b2-3","b2-4"] },
      { n:3, title:"Prove it", blurb:"Verify enforcement and impact.", items:["b2-5","b2-6"] } ],
    takeaways:[
      "Containment: revoke sessions and remediate credentials first, then remove attacker-registered methods.",
      "Protect security info registration with Conditional Access, and move people to phishing-resistant methods.",
      "Verify with sign-in logs, report-only results and CAE behavior, not assumptions." ],
    next:"M13" };

  I["b2-1"] = { kind:"Boss: Incident", type:"multi", pick:2, title:"Contain Leo's account", obj:["2.1.6","2.3.4"], main:true,
    sit:"<p>ID Protection shows a high-risk sign-in for Leo from an unfamiliar country. Mail access from that IP is ongoing.</p>",
    ev:[ { kind:"table", title:"Sign-in logs › Leo Brandt (simulated)", columns:["Time","Location","App","MFA","Result","Risk"], rows:[
      ["02:05–02:13","Unknown (VPS provider)","Office 365 Exchange Online","Push denied ×9","Failure","Medium"],
      ["02:14","Unknown (VPS provider)","Office 365 Exchange Online","Push approved","Success","High"] ] } ],
    q:"Which actions contain the compromise immediately?",
    opts:[
      { id:"a", t:"Revoke Leo's sessions", c:1, f:"Kills the attacker's refresh tokens; CAE-capable services react quickly.", i:[15,0,0] },
      { id:"b", t:"Reset Leo's password (and require MFA re-verification)", c:1, f:"The attacker's known password stops working.", i:[15,0,0] },
      { id:"c", t:"Dismiss the risk so Leo can keep working", f:"This is a confirmed attack, not a false positive.", m:"Dismissing risk is part of containment", i:[-25,5,0] },
      { id:"d", t:"Delete Leo's account", f:"Destroys evidence and blocks legitimate recovery.", i:[0,-20,-10] } ],
    hints:["Remove what the attacker holds: a session and a password."],
    exp:"<p>Revoke sessions and reset the password together: one ends current access, the other stops new sign-ins. Then investigate the attacker's actions in the sign-in and audit logs.</p>",
    src:["revoke","riskRemediate"] };

  I["b2-2"] = { kind:"Boss: Incident", type:"single", title:"The extra authenticator", obj:["2.1.2","4.4.1"], main:true,
    sit:"<p>The audit log shows “User registered security info” for Leo at 02:20: a new Microsoft Authenticator on a device Leo doesn't own.</p>",
    q:"What do you do with it?",
    opts:[
      { id:"a", t:"Delete that method from Leo's Authentication methods (as an Authentication Administrator) and have Leo re-register his own", c:1, f:"Otherwise the attacker keeps a working second factor.", i:[20,0,0] },
      { id:"b", t:"Leave it: resetting the password is enough", f:"The attacker would still hold a second factor.", m:"Password reset removes attacker MFA methods", i:[-20,0,0] },
      { id:"c", t:"Disable Microsoft Authenticator for the whole tenant", f:"Breaks MFA for everyone.", i:[0,-30,0] },
      { id:"d", t:"Ask Leo to delete the app from his phone", f:"The attacker's device isn't Leo's phone.", i:[-10,0,0] } ],
    hints:["Check what the attacker added, not only what they used."],
    exp:"<p>Attackers often register their own methods for persistence. Review and remove unknown methods; Authentication Administrator can manage methods for non-admin users.</p>",
    src:["authMethodsManage","auditLogs"] };

  I["b2-3"] = { kind:"Boss: Scenario", type:"single", title:"No more prompt bombing", obj:["2.1.1","2.3.3","2.2.3"], main:true,
    sit:"<p>Leaders want to make MFA-fatigue approvals impossible for privileged users and less likely for everyone else.</p>",
    q:"Which plan fits best?",
    opts:[
      { id:"a", t:"Require the phishing-resistant authentication strength for privileged roles, and run a passkey registration campaign for everyone else", c:1, f:"Admins can't approve what doesn't exist; others move to stronger methods.", i:[20,5,5] },
      { id:"b", t:"Train users to deny unexpected prompts", f:"Helpful, but training alone didn't stop this attack.", i:[5,0,0] },
      { id:"c", t:"Switch everyone to SMS", f:"Weaker, and phishable.", i:[-20,0,0] },
      { id:"d", t:"Turn off MFA for admins so they aren't targeted", f:"No.", i:[-40,0,0] } ],
    hints:["Remove the approvable prompt for the most valuable accounts."],
    exp:"<p>Authentication strengths enforce which methods count. Registration campaigns can target passkeys (including synced passkeys) or Microsoft Authenticator, nudging users after MFA.</p>",
    src:["phishResistant","regCampaign"] };

  I["b2-4"] = { kind:"Boss: Policy Workshop", type:"config", title:"Guard the registration page", obj:["2.2.2","2.2.10","2.3.3"], main:true,
    sit:"<p>Requirement: registering or changing security info from outside Halcyon's trusted locations must require MFA (new hires can use a Temporary Access Pass).</p>",
    fields:[
      { id:"target", label:"Target resources", options:[
        { id:"regsec", text:"User actions › Register security information", correct:true, feedback:"Targets the registration experience itself.", impact:{sec:10} },
        { id:"all", text:"All resources", feedback:"Doesn't specifically protect registration.", impact:{sec:-5} } ]},
      { id:"network", label:"Network", options:[
        { id:"anyExTrusted", text:"Include any network or location; exclude all trusted locations", correct:true, feedback:"Applies off-site only.", impact:{acc:5} },
        { id:"trusted", text:"Include all trusted locations", feedback:"Applies only in the office, the opposite of the requirement.", impact:{sec:-10} } ]},
      { id:"grant", label:"Grant", options:[
        { id:"mfa", text:"Require multifactor authentication", correct:true, feedback:"Existing MFA or a Temporary Access Pass satisfies it.", impact:{sec:10} },
        { id:"block", text:"Block access", feedback:"Remote new hires couldn't register at all.", impact:{acc:-20} } ]} ],
    hints:["This is a Microsoft template for securing security info registration."],
    exp:"<p>The “Securing security info registration” template targets the Register security information user action, applies outside trusted locations, and requires MFA. Exclude emergency accounts and review guests and other exclusions before enabling.</p>",
    src:["caTemplates","caTargets"] };

  I["b2-5"] = { kind:"Boss: Scenario", type:"single", title:"Did revocation work?", obj:["2.2.7"], main:true,
    sit:"<p>You revoked Leo's sessions at 02:40. At 02:46, the attacker's Exchange Online session is already rejected.</p>",
    q:"What made it that fast?",
    opts:[
      { id:"a", t:"Continuous access evaluation: Exchange Online received the revocation as a critical event", c:1, f:"CAE-capable services enforce critical events in near real time.", i:[5,0,0] },
      { id:"b", t:"Access tokens always expire after 5 minutes", f:"Default access tokens last much longer.", m:"Access tokens are very short-lived by default", i:[0,0,0] },
      { id:"c", t:"Security defaults", f:"Not involved in session revocation.", i:[0,0,0] },
      { id:"d", t:"Luck", f:"Engineering, actually.", i:[0,0,0] } ],
    hints:["Which feature turns events into immediate enforcement?"],
    exp:"<p>With CAE, services such as Exchange Online, SharePoint Online and Teams subscribe to critical events (including revoked sessions and password resets) and reject tokens in near real time. Propagation can take up to about 15 minutes.</p>",
    src:["cae"] };

  I["b2-6"] = { kind:"Boss: Scenario", type:"single", title:"Measure before you enforce", obj:["2.2.4","4.4.4"], main:true,
    sit:"<p>Your new phishing-resistant admin policy has been in report-only for a week. Leadership wants to know how many admin sign-ins would have failed.</p>",
    q:"Where do you get that answer at scale?",
    opts:[
      { id:"a", t:"The Conditional Access insights and reporting workbook (with sign-in logs sent to Log Analytics), filtered to the policy", c:1, f:"Aggregates report-only results across sign-ins.", i:[5,5,15] },
      { id:"b", t:"Open each admin sign-in one by one", f:"Possible for a handful; not at scale.", i:[0,0,-15] },
      { id:"c", t:"Audit logs", f:"Show the policy's creation, not its evaluation results.", i:[0,0,-5] },
      { id:"d", t:"Switch it to On and count complaints", f:"That's the outage you were trying to avoid.", i:[-10,-20,0] } ],
    hints:["You need aggregation, which means a workbook."],
    exp:"<p>The Conditional Access insights and reporting workbook shows the impact of policies, including report-only, across sign-ins. It requires sign-in logs to be streamed to a Log Analytics workspace.</p>",
    src:["caInsights","caReportOnly"] };

})(window.ID_CONTENT);
