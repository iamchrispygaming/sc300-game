/* Domain 3: Plan and implement workload identities. Missions 13–16 + Boss 3. Verified 2026-11-18. */
(function (C) {
  const I = C.items, M = C.missions;

  /* ---------------- Mission 13: Robots Need IDs ---------------- */
  M.M13 = { id:"M13", domain:"D3", code:"Mission 13", title:"Robots Need IDs", minutes:13,
    story:"Omar's team ships code faster than you can review it, and every new service wants a secret. Your mission: give the robots identities that don't end up in a code repository.",
    goal:"Pick the right identity for each workload, create and assign managed identities, and use them to reach other Azure resources.",
    groups:[
      { n:1, title:"Pick the identity", blurb:"Managed identities, service principals, gMSAs and federation.", items:["m13-1","m13-2","m13-3"] },
      { n:2, title:"Wire it up", blurb:"Assign identities and grant data access.", items:["m13-4","m13-5"] },
      { n:3, title:"Lifecycles", blurb:"What happens when resources go away.", items:["m13-6"] } ],
    takeaways:[
      "Use a <b>managed identity</b> for code running on Azure: no secrets to store or rotate. <b>System-assigned</b> lives and dies with one resource; <b>user-assigned</b> is standalone and can be shared.",
      "Outside Azure, use a <b>service principal</b>, preferably with workload identity federation (for example GitHub Actions) or a certificate.",
      "On-premises Windows services: <b>group managed service accounts (gMSA)</b> rotate passwords automatically. Avoid user accounts for workloads.",
      "A managed identity still needs an RBAC role on the target. Data-plane access (such as Storage Blob Data Reader) is separate from control-plane roles (such as Reader)." ],
    next:"M14" };

  I["m13-1"] = { kind:"Scenario", type:"single", title:"The function and the vault", obj:["3.1.1","3.1.4"], main:true,
    sit:"<p>An Azure Functions app, used only by itself, needs to read secrets from an Azure Key Vault. No credentials may be stored in code or configuration.</p>",
    teach:"<p><b>Workload identities</b> are identities for software: applications, services, scripts. A <b>managed identity</b> is an identity in Microsoft Entra ID that Azure manages for an Azure resource, so code can get tokens without storing credentials.</p>",
    q:"What's the best identity choice?",
    opts:[
      { id:"a", t:"Enable a system-assigned managed identity on the function app and grant it a Key Vault data role (for example Key Vault Secrets User)", c:1, f:"No secrets, and its lifecycle matches the app.", i:[20,10,15] },
      { id:"b", t:"An app registration with a client secret stored in app settings", f:"A stored secret is exactly what the requirement forbids.", m:"App settings are a safe place for secrets", i:[-15,10,-5] },
      { id:"c", t:"A user account for the function with its password in Key Vault", f:"Chicken-and-egg, and user accounts shouldn't run workloads.", m:"User accounts are fine for workloads", i:[-20,5,-10] },
      { id:"d", t:"Make Key Vault publicly readable", f:"No.", i:[-40,10,0] } ],
    hints:["The code runs on Azure and serves one resource."],
    exp:"<p>The function requests a token for Key Vault from its managed identity endpoint (SDKs such as DefaultAzureCredential handle this) and presents it to Key Vault. Key Vault authorizes it through Azure RBAC (or an access policy in the legacy model).</p>",
    src:["mi"] };

  I["m13-2"] = { kind:"Scenario", type:"single", title:"Same identity, many resources", obj:["3.1.1","3.1.2"], main:true,
    sit:"<p>A virtual machine scale set and two App Service apps all run the same pipeline and need identical access to a storage account. The identity must survive when individual resources are rebuilt.</p>",
    q:"Which identity type fits?",
    opts:[
      { id:"a", t:"One user-assigned managed identity, assigned to all three resources", c:1, f:"Standalone lifecycle, shared across resources, one set of role assignments.", i:[10,10,20] },
      { id:"b", t:"A system-assigned managed identity on each resource", f:"Three identities, three sets of role assignments, and each vanishes when its resource is rebuilt.", m:"System-assigned identities can be shared", i:[5,10,-10] },
      { id:"c", t:"A service principal with a shared secret", f:"Reintroduces secrets.", i:[-15,10,-5] },
      { id:"d", t:"A gMSA", f:"gMSAs are for Windows services against Active Directory, not Azure resources.", i:[0,-10,0] } ],
    hints:["Survives rebuilds and is shared."],
    exp:"<p>User-assigned managed identities are Azure resources in their own right: create them once, assign them to many resources, and their role assignments persist as resources come and go.</p>",
    src:["mi","miManage"] };

  I["m13-3"] = { kind:"Scenario", type:"single", title:"Workloads outside Azure", obj:["3.1.1"], main:true,
    sit:"<p>Two workloads need identities: (1) a GitHub Actions workflow that deploys to Azure; (2) a Windows service on an on-premises server that accesses SQL Server with Windows authentication.</p>",
    q:"Which pairing is best?",
    opts:[
      { id:"a", t:"(1) Workload identity federation (a federated credential trusting GitHub's OIDC tokens); (2) a group managed service account (gMSA)", c:1, f:"No stored secrets in either case.", i:[20,10,15] },
      { id:"b", t:"(1) A client secret in GitHub secrets; (2) a domain user account with a non-expiring password", f:"Two long-lived secrets to leak and rotate.", m:"Non-expiring passwords are acceptable for service accounts", i:[-20,10,-10] },
      { id:"c", t:"(1) A system-assigned managed identity; (2) a managed identity", f:"Managed identities are for Azure-hosted resources, and GitHub runners and on-prem servers aren't.", m:"Managed identities work anywhere", i:[0,-15,-5] },
      { id:"d", t:"(1) A personal access token of a developer; (2) the local SYSTEM account", f:"Ties deployment to one person's account.", i:[-15,5,0] } ],
    hints:["One is cloud CI/CD; one is on-prem Windows."],
    exp:"<p>Workload identity federation lets an app registration or user-assigned managed identity trust tokens from external IdPs such as GitHub, so there's no secret to store. gMSAs give Windows services AD identities whose passwords AD rotates automatically.</p>",
    src:["wif","gmsa"] };

  I["m13-4"] = { kind:"Scenario", type:"single", title:"Turn it on", obj:["3.1.3","3.1.2"], main:true,
    sit:"<p>You need to enable a system-assigned managed identity on the existing VM <b>vm-reports</b> in resource group <b>rg-analytics</b>, from the Azure CLI.</p>",
    q:"Which command does it?",
    opts:[
      { id:"a", t:"<code>az vm identity assign -g rg-analytics -n vm-reports</code>", c:1, f:"Without --identities, this enables the system-assigned identity.", i:[5,10,10] },
      { id:"b", t:"<code>az ad sp create-for-rbac -n vm-reports</code>", f:"Creates a service principal with a secret, not a managed identity.", m:"Managed identities are created with create-for-rbac", i:[-10,0,-5] },
      { id:"c", t:"<code>az identity create -g rg-analytics -n vm-reports</code>", f:"Creates a user-assigned identity resource; it isn't assigned to the VM yet.", i:[0,0,-5] },
      { id:"d", t:"<code>az vm update --set identity=true</code>", f:"Not the supported way to enable a managed identity.", i:[0,0,-5] } ],
    hints:["The command group is about the VM's identity."],
    exp:"<p><code>az vm identity assign</code> enables the system-assigned identity; add <code>--identities &lt;resource ID&gt;</code> to attach user-assigned identities. In the portal, use the resource's <b>Identity</b> blade.</p>",
    src:["miVm","miManage"] };

  I["m13-5"] = { kind:"Identity Detective", type:"single", title:"403 from storage", obj:["3.1.4"], main:true,
    sit:"<p>vm-reports' managed identity gets <b>403 AuthorizationPermissionMismatch</b> when reading blobs. It has the <b>Reader</b> role on the storage account.</p>",
    ev:[ { kind:"table", title:"Storage account › Access control (IAM) › Role assignments (simulated)", columns:["Principal","Role","Scope"], rows:[["vm-reports (managed identity)","Reader","stanalytics01"]] } ],
    q:"What's the fix?",
    opts:[
      { id:"a", t:"Assign a data-plane role such as <b>Storage Blob Data Reader</b> at the account or container scope", c:1, f:"Reader covers management (control plane) only; blob data needs a data role.", i:[0,20,5] },
      { id:"b", t:"Assign Owner on the subscription", f:"Massive overprivilege, and Owner alone still isn't a blob data role.", m:"Owner includes data-plane access", i:[-30,0,0] },
      { id:"c", t:"Generate an account key and give it to the VM", f:"Reintroduces a shared secret.", i:[-15,15,-5] },
      { id:"d", t:"Switch to a user-assigned identity", f:"The identity type isn't the problem; the role is.", i:[0,0,-10] } ],
    hints:["Azure separates managing a resource from reading its data."],
    exp:"<p>Using a managed identity to reach another Azure resource takes three things: the identity, an RBAC role on the target, and code that requests a token for that resource's audience. Data-plane roles such as Storage Blob Data Reader grant access to the data itself.</p>",
    src:["miAccess","mi"] };

  I["m13-6"] = { kind:"Transfer check", type:"single", title:"When the VM goes", obj:["3.1.2","3.1.1"],
    sit:"<p>vm-reports used a system-assigned identity. A second VM used a user-assigned identity, <b>id-pipeline</b>. Both VMs are deleted.</p>",
    q:"What happens to the identities?",
    opts:[
      { id:"a", t:"The system-assigned identity is deleted with its VM; id-pipeline remains with its role assignments", c:1, f:"That's the lifecycle difference." },
      { id:"b", t:"Both are deleted", f:"User-assigned identities are independent resources.", m:"User-assigned identities are deleted with resources" },
      { id:"c", t:"Both remain until an admin deletes them", f:"System-assigned identities are tied to their resource.", m:"System-assigned identities outlive their resource" },
      { id:"d", t:"Both are converted to service principals with secrets", f:"Nothing like that happens." } ],
    hints:["One identity is a resource of its own."],
    exp:"<p>System-assigned: created with and deleted with one resource. User-assigned: created and deleted independently; clean up unused ones and their role assignments yourself.</p>",
    src:["mi"] };

  /* ---------------- Mission 14: App Onboarding ---------------- */
  M.M14 = { id:"M14", domain:"D3", code:"Mission 14", title:"App Onboarding", minutes:15,
    story:"BrightBoard is just the start. Finance wants an expense SaaS, the Rotterdam depot runs a legacy IIS app, and users keep consenting to apps called “Free PDF Pro”.",
    goal:"Configure enterprise apps, delegate app management, publish on-prem apps, integrate SaaS, manage consent, collections and app roles.",
    groups:[
      { n:1, title:"Front of house", blurb:"Enterprise app properties and admin roles.", items:["m14-1","m14-2"] },
      { n:2, title:"Integrations", blurb:"Application Proxy and SaaS SSO troubleshooting.", items:["m14-3","m14-4"] },
      { n:3, title:"Who decides", blurb:"Consent, collections and app roles.", items:["m14-5","m14-6","m14-7"] } ],
    takeaways:[
      "Enterprise app properties: <b>Assignment required</b>, <b>Visible to users</b> and <b>Enabled for users to sign in</b> are separate switches.",
      "<b>Cloud Application Administrator</b> manages enterprise apps and registrations except Application Proxy; <b>Application Administrator</b> includes Application Proxy.",
      "<b>Application Proxy</b> publishes on-prem web apps through outbound-only connectors, with pre-authentication and SSO such as Kerberos constrained delegation.",
      "Limit user consent (for example to verified publishers and low-impact permissions) and enable the <b>admin consent workflow</b>. Use collections to organize My Apps, and app roles for in-app authorization." ],
    next:"M15" };

  I["m14-1"] = { kind:"Policy Workshop", type:"config", title:"Pilot mode", obj:["3.2.1","3.2.5"], main:true,
    sit:"<p>The new expense app, <b>Ledgerly</b> (fictional), is in testing. Requirements: only users assigned to the app can sign in; the tile must not appear in My Apps yet; assigned testers must still be able to sign in.</p>",
    teach:"<p>Each enterprise app has <b>Properties</b>: <b>Enabled for users to sign in?</b>, <b>Assignment required?</b> (if Yes, only assigned users and groups get tokens) and <b>Visible to users?</b> (whether the tile shows in My Apps).</p>",
    fields:[
      { id:"enabled", label:"Enabled for users to sign in?", options:[
        { id:"yes", text:"Yes", correct:true, feedback:"Testers need to sign in.", impact:{acc:10} },
        { id:"no", text:"No", feedback:"Nobody could sign in, testers included.", impact:{acc:-20} } ]},
      { id:"assign", label:"Assignment required?", options:[
        { id:"yes", text:"Yes", correct:true, feedback:"Only assigned users and groups can get tokens.", impact:{sec:15} },
        { id:"no", text:"No", feedback:"Any user in the tenant could sign in.", misconception:"Hiding an app restricts who can sign in", impact:{sec:-15} } ]},
      { id:"visible", label:"Visible to users?", options:[
        { id:"yes", text:"Yes", feedback:"The tile would appear for assigned users before launch.", impact:{ops:-5} },
        { id:"no", text:"No", correct:true, feedback:"Hidden from My Apps; direct sign-in still works for assigned users.", impact:{ops:5} } ]} ],
    hints:["Visibility isn't security."],
    exp:"<p>“Visible to users” only hides the tile. Restricting access requires <b>Assignment required = Yes</b> plus user or group assignments. Group assignment to apps requires Microsoft Entra ID P1.</p>",
    src:["appProps"] };

  I["m14-2"] = { kind:"Least Privilege Challenge", type:"single", title:"The SaaS team", obj:["3.2.2"], main:true,
    sit:"<p>A small team will configure single sign-on and user assignment for Halcyon's SaaS apps. They don't manage Application Proxy and shouldn't manage directory users.</p>",
    q:"Which role fits with least privilege?",
    opts:[
      { id:"a", t:"Cloud Application Administrator", c:1, f:"Manages enterprise apps and app registrations, excluding Application Proxy.", i:[15,10,5] },
      { id:"b", t:"Application Administrator", f:"Also manages Application Proxy, which they don't need.", m:"Application Administrator is the minimal app role", i:[-5,10,5] },
      { id:"c", t:"Global Administrator", f:"Far beyond the need.", i:[-30,10,5] },
      { id:"d", t:"Application Developer", f:"Can create registrations, but can't manage enterprise app SSO and assignments.", m:"Application Developer manages enterprise apps", i:[0,-15,0] } ],
    hints:["Two app admin roles differ by one feature."],
    exp:"<p>For a single app, consider making someone an <b>owner</b> of that enterprise app, or assigning an app admin role scoped to that app, instead of a tenant-wide role.</p>",
    src:["rolesRef","byTask"] };

  I["m14-3"] = { kind:"Scenario", type:"single", title:"The Rotterdam IIS app", obj:["3.2.3"], main:true,
    sit:"<p>Rotterdam's inventory app runs on on-premises IIS with Integrated Windows Authentication. Remote supervisors need it from the internet, with Entra sign-in, Conditional Access and no inbound firewall openings.</p>",
    teach:"<p><b>Microsoft Entra Application Proxy</b> publishes on-premises web apps through lightweight <b>connectors</b> that make outbound connections only. Pre-authentication with Microsoft Entra ID lets Conditional Access apply. <b>Kerberos constrained delegation (KCD)</b> provides SSO to IWA apps.</p>",
    q:"What do you deploy?",
    opts:[
      { id:"a", t:"Application Proxy: install a connector near the app, publish it with Microsoft Entra ID pre-authentication, and configure KCD for single sign-on", c:1, f:"Outbound-only, Conditional Access-protected, with SSO.", i:[15,20,10] },
      { id:"b", t:"Open port 443 to the IIS server and add an SSL certificate", f:"Exposes the server directly, with no Entra pre-authentication.", i:[-30,15,0] },
      { id:"c", t:"Register the app as a SaaS gallery app", f:"It isn't a SaaS app; it lives on-prem.", i:[0,-15,-5] },
      { id:"d", t:"Use passthrough pre-authentication", f:"Lets unauthenticated traffic reach the app; Conditional Access wouldn't apply.", m:"Passthrough applies Conditional Access", i:[-15,10,0] } ],
    hints:["Which option avoids inbound ports and still gets Conditional Access?"],
    exp:"<p>Connectors in a connector group close to the app keep latency low. Application Proxy also integrates with Conditional Access and, for Private Access scenarios, the same connector software is used.</p>",
    src:["appProxy","appProxyKcd"] };

  I["m14-4"] = { kind:"Identity Detective", type:"single", title:"AADSTS50011", obj:["3.2.4"], main:true,
    sit:"<p>Users trying to sign in to Ledgerly with SAML SSO see an error page.</p>",
    ev:[ { kind:"kv", title:"Sign-in error (simulated)", fields:[["Error code","AADSTS50011"],["Message (paraphrased)","The reply URL in the request doesn't match the reply URLs configured for the application."],["Request reply URL","https://halcyon.ledgerly.example/saml/acs"],["Configured reply URL","https://ledgerly.example/saml/acs"]] } ],
    q:"What's the fix?",
    opts:[
      { id:"a", t:"In the app's <b>Basic SAML Configuration</b>, set the Reply URL (Assertion Consumer Service URL) to the value the app sends", c:1, f:"The values must match exactly.", i:[0,20,5] },
      { id:"b", t:"Regenerate the SAML signing certificate", f:"A certificate problem shows different errors.", m:"Every SAML error is a certificate error", i:[0,0,-10] },
      { id:"c", t:"Turn off Assignment required", f:"Unrelated to the reply URL, and reduces security.", i:[-15,0,0] },
      { id:"d", t:"Switch the app to password-based SSO", f:"Downgrades the integration instead of fixing a typo.", i:[-5,5,-10] } ],
    hints:["Compare the two URLs in the error."],
    exp:"<p>For SAML gallery and custom apps, Basic SAML Configuration includes the Identifier (Entity ID) and Reply URL (ACS URL). They must match what the app sends. Many SaaS apps also support automatic user provisioning with SCIM.</p>",
    src:["samlSso"] };

  I["m14-5"] = { kind:"Policy Workshop", type:"config", title:"Free PDF Pro", obj:["3.2.6"], main:true,
    story:"Fifty users consented to “Free PDF Pro”, which asked to read all their mail. You'd like that to stop.",
    sit:"<p>Requirements: users may still consent to low-risk apps from verified publishers; anything else goes to reviewers instead of dead-ending.</p>",
    teach:"<p><b>User consent settings</b> decide whether users can grant apps access to their data. The <b>admin consent workflow</b> lets users request approval for apps they can't consent to, and designated reviewers approve or deny.</p>",
    fields:[
      { id:"consent", label:"Enterprise applications › Consent and permissions › User consent", options:[
        { id:"none", text:"Do not allow user consent", feedback:"Safest, but blocks low-risk apps the requirement allows.", impact:{sec:5, acc:-10} },
        { id:"verified", text:"Allow user consent for apps from verified publishers, for selected permissions", correct:true, feedback:"Matches the requirement.", impact:{sec:10, acc:5} },
        { id:"all", text:"Allow user consent for all apps", feedback:"That's how Free PDF Pro got in.", misconception:"Unrestricted user consent is low risk", impact:{sec:-20} } ]},
      { id:"workflow", label:"Admin consent requests › Users can request admin consent", options:[
        { id:"yes", text:"Yes, with designated reviewers", correct:true, feedback:"Requests reach people who can approve them.", impact:{acc:10, ops:5} },
        { id:"no", text:"No", feedback:"Users hit a dead end and look for workarounds.", impact:{acc:-10} } ]} ],
    hints:["Allow a little, route the rest."],
    exp:"<p>Limit user consent to verified publishers and low-impact permissions you classify, and turn on the admin consent workflow. For already-granted risky consents, review the app's permissions and revoke them, and consider disabling sign-in for the app.</p>",
    src:["userConsent","adminConsentWorkflow"] };

  I["m14-6"] = { kind:"Transfer check", type:"single", title:"Warehouse tools tab", obj:["3.2.7"],
    sit:"<p>Warehouse staff want their five apps grouped on a <b>Warehouse tools</b> tab in My Apps.</p>",
    q:"What do you create?",
    opts:[
      { id:"a", t:"A My Apps collection containing the five apps, assigned to the warehouse group", c:1, f:"Collections group apps into tabs for the users or groups you assign." },
      { id:"b", t:"An administrative unit for the apps", f:"AUs scope administration; they don't organize My Apps." },
      { id:"c", t:"A new enterprise app that links to the others", f:"Clunky and unnecessary." },
      { id:"d", t:"A dynamic group named Warehouse tools", f:"Groups don't create My Apps tabs." } ],
    hints:["The feature's name sounds like a set of things."],
    exp:"<p>Admins create collections (under Enterprise applications › App launchers) and assign them to users or groups. Users see only apps they're assigned to, so collections organize access but don't grant it.</p>",
    src:["collections"] };

  I["m14-7"] = { kind:"Transfer check", type:"single", title:"Approvers in Ledgerly", obj:["3.2.5","3.3.5"],
    sit:"<p>Ledgerly defines app roles <b>Submitter</b> and <b>Approver</b>. Finance managers must be Approvers.</p>",
    q:"How do you grant that?",
    opts:[
      { id:"a", t:"In the enterprise app's Users and groups, assign the Finance-Managers group to the Approver app role", c:1, f:"The app receives Approver in the roles claim for those users." },
      { id:"b", t:"Assign Finance managers the Application Administrator role", f:"A directory role, not an app role." },
      { id:"c", t:"Add Approver as a custom security attribute", f:"Attributes aren't app roles." },
      { id:"d", t:"Create an Approver administrative unit", f:"AUs scope admin roles, not app permissions." } ],
    hints:["App roles are assigned where users are assigned to the app."],
    exp:"<p>App roles are defined on the app registration and assigned to users, groups or applications on the enterprise app. Assigned roles appear in the token's <code>roles</code> claim for the app to enforce.</p>",
    src:["appRoles"] };

  /* ---------------- Mission 15: Registration Desk ---------------- */
  M.M15 = { id:"M15", domain:"D3", code:"Mission 15", title:"Registration Desk", minutes:13,
    story:"Omar's team is building <b>Dispatch</b>, an internal single-page app with a nightly back-end job. They have questions, and the first one is “what's a redirect URI?”",
    goal:"Plan and create app registrations, configure authentication, API permissions and app roles.",
    groups:[
      { n:1, title:"Plan and register", blurb:"Account types and platforms.", items:["m15-1","m15-2"] },
      { n:2, title:"Permissions", blurb:"Delegated vs application, and credentials.", items:["m15-3","m15-4"] },
      { n:3, title:"Roles in the app", blurb:"Define and consume app roles.", items:["m15-5","m15-6"] } ],
    takeaways:[
      "Plan the <b>supported account types</b> (single tenant vs multitenant) and platform (Web, Single-page application, Mobile and desktop) before you register.",
      "<b>Delegated</b> permissions act on behalf of a signed-in user; <b>application</b> permissions act as the app itself and need admin consent.",
      "Prefer certificates or federated credentials over client secrets.",
      "App roles define allowed member types (users/groups, applications, or both) and arrive in the <code>roles</code> claim." ],
    next:"M16" };

  I["m15-1"] = { kind:"Scenario", type:"single", title:"Who signs in?", obj:["3.3.1","3.3.2"], main:true,
    sit:"<p>Dispatch will be used only by Halcyon employees signing in with Halcyon work accounts.</p>",
    teach:"<p>An <b>app registration</b> defines an app's identity configuration: supported account types, redirect URIs, credentials, API permissions, exposed APIs and app roles. Registering in a tenant also creates a <b>service principal</b> (the enterprise app) in that tenant.</p>",
    q:"Which supported account type should you choose?",
    opts:[
      { id:"a", t:"Accounts in this organizational directory only (single tenant)", c:1, f:"Only Halcyon's tenant can sign in.", i:[15,10,5] },
      { id:"b", t:"Accounts in any organizational directory (multitenant)", f:"Other organizations' users could sign in; you'd need extra validation.", i:[-15,10,0] },
      { id:"c", t:"Any organizational directory and personal Microsoft accounts", f:"Even broader.", i:[-20,10,0] },
      { id:"d", t:"Personal Microsoft accounts only", f:"Employees use work accounts.", i:[0,-20,0] } ],
    hints:["Match the audience exactly."],
    exp:"<p>Choose the narrowest audience. You can change supported account types later, but multitenant apps need more care (issuer validation, publisher verification, consent in other tenants).</p>",
    src:["appReg"] };

  I["m15-2"] = { kind:"Scenario", type:"single", title:"The SPA's redirect", obj:["3.3.3"], main:true,
    sit:"<p>Dispatch's front end is a single-page app (browser JavaScript) using MSAL.js. Sign-in fails with a message about the redirect URI's platform.</p>",
    q:"How should the redirect URI be configured?",
    opts:[
      { id:"a", t:"Under Authentication, add the URI under the <b>Single-page application</b> platform", c:1, f:"Enables the authorization code flow with PKCE for browsers.", i:[10,15,5] },
      { id:"b", t:"Add it under the Web platform and create a client secret for the browser", f:"A browser can't keep a secret.", m:"SPAs should use client secrets", i:[-20,10,0] },
      { id:"c", t:"Enable the implicit grant and use access tokens from the URL", f:"Legacy and discouraged; use auth code with PKCE.", m:"Implicit grant is recommended for SPAs", i:[-10,10,0] },
      { id:"d", t:"Use the Mobile and desktop platform", f:"Wrong platform for browser apps.", i:[0,-10,0] } ],
    hints:["Pick the platform named after the app type."],
    exp:"<p>Platform configuration determines allowed flows. Single-page application redirect URIs support authorization code flow with PKCE and CORS for token requests, with no client secret.</p>",
    src:["appAuth"] };

  I["m15-3"] = { kind:"Policy triage", type:"multi", pick:2, title:"The nightly job", obj:["3.3.4"], main:true,
    sit:"<p>Dispatch's nightly job runs with no signed-in user and must read every driver's calendar through Microsoft Graph.</p>",
    teach:"<p><b>Delegated permissions</b> (scopes) let an app act on behalf of a signed-in user, limited by what that user can do. <b>Application permissions</b> (app roles of the API) let the app act as itself, across the tenant, and always need admin consent.</p>",
    q:"Which configuration is required?",
    opts:[
      { id:"a", t:"Application permission <code>Calendars.Read</code> on Microsoft Graph", c:1, f:"No user is present, so the app needs application permissions.", i:[0,10,5] },
      { id:"b", t:"Grant admin consent for the permission", c:1, f:"Application permissions require admin consent.", i:[5,10,0] },
      { id:"c", t:"Delegated permission <code>Calendars.Read</code>", f:"Delegated permissions need a signed-in user.", m:"Delegated permissions work without a user", i:[0,-10,0] },
      { id:"d", t:"Let each driver consent the first time", f:"There's no user session, and user consent doesn't apply to application permissions.", i:[0,-10,0] } ],
    hints:["Is anyone signed in at 2 a.m.?"],
    exp:"<p>Application permissions are powerful (here, every mailbox's calendar). Exchange Online supports scoping application access to specific mailboxes, so consider that before granting tenant-wide access.</p>",
    src:["permissions"] };

  I["m15-4"] = { kind:"Transfer check", type:"single", title:"Secrets in production", obj:["3.3.3"],
    sit:"<p>The nightly job runs on an on-premises Linux server (not Azure) and currently authenticates with a client secret that expires in 24 months.</p>",
    q:"What's the better production credential?",
    opts:[
      { id:"a", t:"A certificate credential (private key protected on the server), or workload identity federation if the platform supports it", c:1, f:"Harder to leak than a shared string, and rotatable." },
      { id:"b", t:"A longer-lived client secret", f:"Longer exposure if leaked." },
      { id:"c", t:"A system-assigned managed identity", f:"Managed identities need an Azure-hosted resource.", m:"Managed identities work on-prem" },
      { id:"d", t:"An admin's username and password", f:"Never." } ],
    hints:["Not Azure, so not a managed identity."],
    exp:"<p>Microsoft recommends certificates over client secrets for confidential clients, and federated credentials where an external IdP can vouch for the workload. Track expiry and rotate before it bites.</p>",
    src:["appAuth","wif"] };

  I["m15-5"] = { kind:"Scenario", type:"single", title:"An app role for people and robots", obj:["3.3.5"], main:true,
    sit:"<p>Dispatch needs an app role, <b>Routes.Manage</b>, assigned to the Dispatchers group and also to a separate background service that calls Dispatch's API.</p>",
    q:"What should <b>Allowed member types</b> be?",
    opts:[
      { id:"a", t:"Both (Users/Groups + Applications)", c:1, f:"The role can be assigned to people and to apps.", i:[5,15,5] },
      { id:"b", t:"Users/Groups", f:"The background service couldn't be assigned the role.", i:[0,-10,0] },
      { id:"c", t:"Applications", f:"The Dispatchers group couldn't be assigned the role.", i:[0,-10,0] },
      { id:"d", t:"Create it as a delegated scope instead", f:"Scopes are for delegated access by users; the service has no user.", i:[0,-10,0] } ],
    hints:["Count who needs it."],
    exp:"<p>App roles with allowed member type Applications appear to other apps as application permissions on your API. Roles for users and groups are assigned on the enterprise app. Both can come from one definition.</p>",
    src:["appRoles"] };

  I["m15-6"] = { kind:"Transfer check", type:"single", title:"Reading the token", obj:["3.3.5","3.3.4"],
    sit:"<p>Omar's API must check whether the caller holds Routes.Manage.</p>",
    q:"Which token claim carries assigned app roles?",
    opts:[
      { id:"a", t:"<code>roles</code>", c:1, f:"Assigned app roles appear in the roles claim." },
      { id:"b", t:"<code>scp</code>", f:"scp lists delegated scopes, not app roles.", m:"App roles arrive in scp" },
      { id:"c", t:"<code>groups</code>", f:"Lists group IDs if configured, not app roles." },
      { id:"d", t:"<code>aud</code>", f:"The audience, meaning which API the token is for." } ],
    hints:["The claim's name is almost the feature's name."],
    exp:"<p>Validate the token (issuer, audience, signature), then authorize with <code>roles</code> for app roles or <code>scp</code> for delegated scopes.</p>",
    src:["appRoles","permissions"] };

  /* ---------------- Mission 16: Shadow IT ---------------- */
  M.M16 = { id:"M16", domain:"D3", code:"Mission 16", title:"Shadow IT", minutes:14,
    story:"Firewall logs show 280 cloud apps in use at Halcyon. IT approved 40. Microsoft Defender for Cloud Apps is about to become your favorite tool.",
    goal:"Discover cloud apps, use the catalog, connect apps, control sessions and access, and police OAuth apps.",
    groups:[
      { n:1, title:"See everything", blurb:"Cloud Discovery and the app catalog.", items:["m16-1","m16-2"] },
      { n:2, title:"Connect and control", blurb:"App connectors, CA App Control and policies.", items:["m16-3","m16-4","m16-5"] },
      { n:3, title:"Rogue apps", blurb:"OAuth app policies and app-enforced restrictions.", items:["m16-6","m16-7"] } ],
    takeaways:[
      "<b>Cloud Discovery</b> analyzes traffic logs (upload or log collector) or Microsoft Defender for Endpoint signals; the <b>Cloud app catalog</b> scores apps on risk.",
      "Mark apps sanctioned or unsanctioned; unsanctioned apps can be blocked through integrations such as Defender for Endpoint.",
      "<b>App connectors</b> give API-level visibility and governance. <b>Conditional Access App Control</b> proxies sessions for real-time access and session policies.",
      "OAuth app policies and app governance detect and revoke risky consented apps." ],
    next:"B3" };

  I["m16-1"] = { kind:"Scenario", type:"single", title:"What are people using?", obj:["3.4.1"], main:true,
    sit:"<p>Halcyon wants a report of every cloud app employees use, based on its firewall traffic logs.</p>",
    teach:"<p><b>Microsoft Defender for Cloud Apps</b> is a cloud access security broker (CASB). <b>Cloud Discovery</b> analyzes traffic to find cloud apps (shadow IT) using log uploads, automatic log collectors, or integration with Microsoft Defender for Endpoint.</p>",
    q:"How do you start?",
    opts:[
      { id:"a", t:"Configure Cloud Discovery: upload firewall logs (snapshot) or set up a log collector for continuous reports", c:1, f:"Turns traffic logs into an app inventory with usage and risk.", i:[10,0,15] },
      { id:"b", t:"Search the Entra sign-in logs", f:"Only shows apps that use Entra for sign-in; shadow IT usually doesn't.", m:"Sign-in logs reveal shadow IT", i:[0,0,-5] },
      { id:"c", t:"Ask every manager for a list", f:"Incomplete and slow.", i:[0,0,-15] },
      { id:"d", t:"Block all unknown traffic", f:"Breaks the business before you know what's in use.", i:[5,-25,0] } ],
    hints:["The data is in network logs."],
    exp:"<p>Snapshot reports suit one-off analysis; continuous reports need a log collector or Defender for Endpoint integration. Results show discovered apps, users, traffic and each app's catalog risk score.</p>",
    src:["mdcaDiscovery"] };

  I["m16-2"] = { kind:"Scenario", type:"single", title:"The risky file-sharing app", obj:["3.4.7","3.4.1"], main:true,
    sit:"<p>Discovery shows heavy use of “ShareDrop”, a fictional file-sharing app with a low catalog risk score (lacks encryption at rest and data-retention controls). Halcyon wants it off-limits on managed devices.</p>",
    q:"What do you do in Defender for Cloud Apps?",
    opts:[
      { id:"a", t:"Review it in the Cloud app catalog and mark it <b>Unsanctioned</b>; with Defender for Endpoint integration, access is blocked on onboarded devices", c:1, f:"Turns a catalog decision into enforcement.", i:[15,-5,10] },
      { id:"b", t:"Mark it Sanctioned so you can monitor it", f:"Sanctioned means approved.", m:"Sanctioning is for monitoring risky apps", i:[-15,5,0] },
      { id:"c", t:"Create an app registration for ShareDrop", f:"Unrelated to blocking a third-party app.", i:[0,0,-10] },
      { id:"d", t:"Add it to a My Apps collection", f:"Promotes it instead of blocking it.", i:[-10,5,0] } ],
    hints:["The catalog has a verdict you can apply."],
    exp:"<p>The Cloud app catalog rates thousands of apps on general, security, compliance and legal factors. You can override scores, tag apps sanctioned, unsanctioned or monitored, and export block scripts for network appliances.</p>",
    src:["mdcaCatalog"] };

  I["m16-3"] = { kind:"Scenario", type:"single", title:"Inside Box", obj:["3.4.2"], main:true,
    sit:"<p>Halcyon uses Box, a sanctioned app. It wants visibility into files and admin activity inside Box, plus governance actions such as removing public sharing.</p>",
    q:"What gives API-level visibility and control?",
    opts:[
      { id:"a", t:"Connect Box with an app connector (connected app) in Defender for Cloud Apps", c:1, f:"App connectors use the provider's APIs for activities, files and governance.", i:[10,0,10] },
      { id:"b", t:"Cloud Discovery only", f:"Discovery shows usage from traffic, not what's inside the app.", i:[0,0,-5] },
      { id:"c", t:"A Conditional Access policy for Box", f:"Controls sign-in, not file sharing state inside Box.", i:[0,0,-5] },
      { id:"d", t:"Mark Box as Unsanctioned", f:"It's approved.", i:[0,-20,0] } ],
    hints:["APIs, not traffic."],
    exp:"<p>Connected apps feed activity logs and file data into Defender for Cloud Apps, enabling activity policies, file policies and governance actions.</p>",
    src:["mdcaConnect"] };

  I["m16-4"] = { kind:"Scenario", type:"single", title:"No downloads, in real time", obj:["3.4.4","3.4.5"], main:true,
    sit:"<p>A SaaS CRM uses Entra SSO. Users on unmanaged devices may use it, but must be blocked in real time from downloading files labeled Confidential.</p>",
    q:"What do you configure?",
    opts:[
      { id:"a", t:"A Conditional Access policy with the session control <b>Use Conditional Access App Control</b>, and a Defender for Cloud Apps <b>session policy</b> that blocks those downloads on unmanaged devices", c:1, f:"Sessions route through the reverse proxy, which inspects downloads.", i:[20,5,5] },
      { id:"b", t:"An access policy", f:"Access policies allow or block access to the app; they don't inspect actions within a session.", m:"Access policies control downloads", i:[5,-10,0] },
      { id:"c", t:"Block the CRM on unmanaged devices", f:"Stricter than required.", i:[10,-20,0] },
      { id:"d", t:"An app connector only", f:"API connections act after the fact, not in real time.", i:[0,0,-5] } ],
    hints:["Real-time action inside a session."],
    exp:"<p>Conditional Access App Control acts as a reverse proxy for supported apps. Session policies monitor or control actions (download, upload, copy/paste, print); access policies allow or block access to the app itself.</p>",
    src:["mdcaProxy","mdcaSession"] };

  I["m16-5"] = { kind:"Transfer check", type:"single", title:"Block the whole app", obj:["3.4.5","3.4.4"],
    sit:"<p>For the same CRM, Halcyon now wants to block access entirely from unmanaged mobile devices, while allowing everyone else.</p>",
    q:"Which Defender for Cloud Apps policy type fits?",
    opts:[
      { id:"a", t:"An access policy (through Conditional Access App Control)", c:1, f:"Access policies evaluate device and user context and allow or block access." },
      { id:"b", t:"A session policy", f:"Controls actions within a session, not whether the session starts." },
      { id:"c", t:"A file policy", f:"Scans files through app connectors." },
      { id:"d", t:"An anomaly detection policy", f:"Detects unusual behavior; doesn't enforce device-based access." } ],
    hints:["Whether you're in, not what you do once inside."],
    exp:"<p>Access policies and session policies both rely on Conditional Access App Control. Choose access policies for “can they get in?” and session policies for “what can they do?”.</p>",
    src:["mdcaSession","mdcaProxy"] };

  I["m16-6"] = { kind:"Scenario", type:"single", title:"The mail-reading app", obj:["3.4.6"], main:true,
    sit:"<p>An OAuth app from an unverified publisher has <code>Mail.ReadWrite</code> and is consented by 50 users. Halcyon wants to be alerted to apps like this and remove access.</p>",
    q:"What should you use?",
    opts:[
      { id:"a", t:"OAuth app policies and app governance in Defender for Cloud Apps to detect high-privilege, rarely-used or unverified apps, then revoke (ban) the app", c:1, f:"Detect, investigate, and revoke consent at scale.", i:[20,0,10] },
      { id:"b", t:"A session policy", f:"Session policies govern proxied user sessions, not OAuth grants.", i:[0,0,-5] },
      { id:"c", t:"Delete the users who consented", f:"The users aren't the problem.", i:[0,-30,-10] },
      { id:"d", t:"Nothing: users consented, so it's allowed", f:"Consent can be phished (illicit consent grant).", m:"User consent makes an app safe", i:[-20,0,0] } ],
    hints:["OAuth apps have their own policy type."],
    exp:"<p>Defender for Cloud Apps lists OAuth apps with permission levels, community use and publisher status. Policies alert on risky combinations, and admins can ban apps to revoke consent. Pair this with tighter user consent settings in Entra.</p>",
    src:["mdcaOAuth","userConsent"] };

  I["m16-7"] = { kind:"Transfer check", type:"single", title:"Let the app enforce it", obj:["3.4.3"],
    sit:"<p>For Exchange Online and SharePoint Online, Halcyon wants a simple limited, web-only experience on unmanaged devices, without proxying sessions.</p>",
    q:"Which control fits?",
    opts:[
      { id:"a", t:"Conditional Access session control: Use app enforced restrictions", c:1, f:"The apps themselves enforce limited access based on device state." },
      { id:"b", t:"Conditional Access App Control with a session policy", f:"Works, but proxies sessions, which the requirement wants to avoid." },
      { id:"c", t:"Mark the apps Unsanctioned", f:"They're core business apps." },
      { id:"d", t:"An OAuth app policy", f:"Unrelated." } ],
    hints:["The app does the work."],
    exp:"<p>Application-enforced restrictions are a Conditional Access session control supported by SharePoint Online and Exchange Online, which apply their own limited-access experience on unmanaged devices.</p>",
    src:["appEnforced","caSession"] };

  /* ---------------- Boss 3: Integration Sprint ---------------- */
  M.B3 = { id:"B3", domain:"D3", boss:true, code:"Boss · Domain 3", title:"Integration Sprint", minutes:15,
    story:"BrightBoard goes company-wide on Monday: SAML SSO, automatic provisioning, a sync job in Azure, an on-prem plug-in in Rotterdam, and leadership wants no surprises. It's Thursday.",
    goal:"Combine workload identity, enterprise app, app registration and Defender for Cloud Apps skills.",
    groups:[
      { n:1, title:"Wire the SaaS", blurb:"SSO, provisioning and assignment.", items:["b3-1","b3-2"] },
      { n:2, title:"Wire the robots", blurb:"Identities and permissions for the integration.", items:["b3-3","b3-4"] },
      { n:3, title:"Guard the edges", blurb:"Consent, connectors and sessions.", items:["b3-5","b3-6"] } ],
    takeaways:[
      "Real integrations combine SSO, provisioning, app roles, workload identities, consent policy and session control.",
      "Keep each piece least-privilege: assignment required, scoped permissions, no stored secrets." ],
    next:"M17" };

  I["b3-1"] = { kind:"Boss: Scenario", type:"single", title:"Accounts appear by themselves", obj:["3.2.4","3.2.5"], main:true,
    sit:"<p>BrightBoard supports SAML SSO and SCIM 2.0. Users assigned to BrightBoard in Entra must get BrightBoard accounts automatically and lose them when unassigned.</p>",
    q:"What completes the integration?",
    opts:[
      { id:"a", t:"Configure SAML SSO and automatic user provisioning (SCIM) on the BrightBoard enterprise app, scoped to assigned users and groups", c:1, f:"SSO handles sign-in; provisioning handles account lifecycle.", i:[10,20,20] },
      { id:"b", t:"SSO only; BrightBoard creates accounts at first sign-in", f:"Just-in-time creation doesn't remove accounts when access ends.", m:"SSO also deprovisions accounts", i:[-10,15,0] },
      { id:"c", t:"Bulk create BrightBoard users monthly", f:"Manual and laggy.", i:[0,5,-20] },
      { id:"d", t:"Cross-tenant synchronization", f:"For Entra tenants, not SaaS apps.", i:[0,-10,-10] } ],
    hints:["Sign-in and account lifecycle are two separate jobs."],
    exp:"<p>The Entra provisioning service creates, updates and disables accounts in SCIM-enabled apps based on assignment and attribute mappings. Check the provisioning logs for failures.</p>",
    src:["samlSso","provisioningLogs"] };

  I["b3-2"] = { kind:"Boss: Policy Workshop", type:"config", title:"BrightBoard roles", obj:["3.2.5","3.3.5","3.2.1"], main:true,
    sit:"<p>BrightBoard's app registration defines app roles <b>Editor</b> and <b>Viewer</b>. Requirements: Marketing gets Editor, everyone else gets nothing unless assigned, and the tile appears for assigned users.</p>",
    fields:[
      { id:"assign", label:"Assignment required?", options:[
        { id:"yes", text:"Yes", correct:true, feedback:"Unassigned users can't get tokens.", impact:{sec:15} },
        { id:"no", text:"No", feedback:"Everyone could sign in.", impact:{sec:-15} } ]},
      { id:"marketing", label:"Users and groups › GRP-Marketing-Onboarding", options:[
        { id:"editor", text:"Assigned to app role: Editor", correct:true, feedback:"Marketing gets Editor in the roles claim.", impact:{acc:15} },
        { id:"default", text:"Assigned with Default Access", feedback:"No Editor role in the token.", impact:{acc:-10} } ]},
      { id:"visible", label:"Visible to users?", options:[
        { id:"yes", text:"Yes", correct:true, feedback:"Assigned users see the tile.", impact:{acc:5} },
        { id:"no", text:"No", feedback:"Hides the tile from the people who should see it.", impact:{acc:-5} } ]} ],
    hints:["Restrict, assign the right role, then show it."],
    exp:"<p>Assignment required plus role-specific group assignment gives the app both the gate and the authorization data it needs.</p>",
    src:["appProps","appRoles"] };

  I["b3-3"] = { kind:"Boss: Scenario", type:"single", title:"The sync job", obj:["3.1.1","3.1.4","3.1.3"], main:true,
    sit:"<p>A BrightBoard sync job runs on an Azure VM and must write to a storage container. No secrets allowed.</p>",
    q:"What's the setup?",
    opts:[
      { id:"a", t:"Enable a managed identity on the VM and assign Storage Blob Data Contributor on the container", c:1, f:"Identity plus a data-plane role, scoped tightly.", i:[15,15,10] },
      { id:"b", t:"Store a storage account key in a file on the VM", f:"A shared secret with full account access.", i:[-25,15,0] },
      { id:"c", t:"Managed identity with Contributor on the subscription", f:"Control-plane role, far too wide, and still no blob data access.", m:"Contributor grants data access", i:[-30,0,0] },
      { id:"d", t:"A service principal with a client secret in an environment variable", f:"Reintroduces a secret.", i:[-15,15,0] } ],
    hints:["Write access to blob data, smallest scope."],
    exp:"<p>Managed identity + data-plane RBAC at container scope is the least-privilege, secret-free pattern for Azure-hosted workloads.</p>",
    src:["mi","miAccess"] };

  I["b3-4"] = { kind:"Boss: Scenario", type:"single", title:"Reading user profiles", obj:["3.3.4","3.2.6"], main:true,
    sit:"<p>BrightBoard's add-in needs to read the signed-in user's basic profile through Microsoft Graph. Halcyon's user consent setting allows verified publishers for low-impact permissions, and BrightBoard is verified.</p>",
    q:"Which permission should the add-in request?",
    opts:[
      { id:"a", t:"Delegated <code>User.Read</code>", c:1, f:"Signed-in user's profile, low impact, user-consentable under Halcyon's settings.", i:[10,15,10] },
      { id:"b", t:"Application <code>User.Read.All</code>", f:"Every user's profile, without a user, needing admin consent.", i:[-20,10,-5] },
      { id:"c", t:"Delegated <code>Directory.ReadWrite.All</code>", f:"Wildly excessive.", i:[-30,10,-5] },
      { id:"d", t:"No permission; Graph is public", f:"Graph requires authorization.", i:[0,-15,0] } ],
    hints:["Signed-in user, read only, own profile."],
    exp:"<p>Request the least-privileged permission that does the job. Delegated User.Read is the classic minimal permission for signing in and reading the user's profile.</p>",
    src:["permissions","userConsent"] };

  I["b3-5"] = { kind:"Boss: Scenario", type:"single", title:"The Rotterdam plug-in", obj:["3.2.3"], main:true,
    sit:"<p>BrightBoard's on-prem plug-in runs on a server in Rotterdam and must be published through Application Proxy. Your only existing connectors are in Toronto.</p>",
    q:"What's the best connector setup?",
    opts:[
      { id:"a", t:"Install connectors in Rotterdam, put them in a Rotterdam connector group, and assign the app to that group", c:1, f:"Connectors close to the app keep latency down and isolate traffic.", i:[5,15,10] },
      { id:"b", t:"Use the Toronto connectors over the WAN", f:"Possible if routable, but slow and fragile.", i:[0,5,-10] },
      { id:"c", t:"Install a connector on each supervisor's laptop", f:"Connectors run on servers near apps.", i:[-10,-10,-10] },
      { id:"d", t:"Open an inbound port in Rotterdam instead", f:"Defeats Application Proxy's outbound-only design.", i:[-25,10,0] } ],
    hints:["Connector groups map connectors to apps."],
    exp:"<p>Connector groups let you assign specific connectors to specific apps, which is useful for multiple sites and network segments. Deploy at least two connectors per group for availability.</p>",
    src:["appProxy"] };

  I["b3-6"] = { kind:"Boss: Scenario", type:"single", title:"Launch-day guardrail", obj:["3.4.4","3.4.5","2.2.5"], main:true,
    sit:"<p>Leadership wants BrightBoard usable from personal devices on launch day, with real-time blocking of exports of files labeled Confidential.</p>",
    q:"Which combination delivers it?",
    opts:[
      { id:"a", t:"Conditional Access with <b>Use Conditional Access App Control</b> for BrightBoard, plus a Defender for Cloud Apps session policy blocking Confidential downloads on unmanaged devices", c:1, f:"Real-time, in-session control.", i:[20,10,5] },
      { id:"b", t:"Require a compliant device for BrightBoard", f:"Personal devices would be blocked entirely.", i:[10,-20,0] },
      { id:"c", t:"App enforced restrictions", f:"Supported by SharePoint Online and Exchange Online, not a third-party SaaS like BrightBoard.", m:"App enforced restrictions work for any app", i:[0,0,-5] },
      { id:"d", t:"Weekly file policy scans", f:"After the fact, not real time.", i:[0,0,-5] } ],
    hints:["Personal devices allowed, specific actions blocked, now."],
    exp:"<p>Session policies through Conditional Access App Control are the tool for real-time, action-level control in SaaS apps on unmanaged devices.</p>",
    src:["mdcaSession","mdcaProxy"] };

})(window.ID_CONTENT);
