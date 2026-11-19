/* Ops workspace missions (data only). The simulator in lab.js evaluates these with Conditional Access rules:
   every enabled policy whose assignments all match applies; exclusions override inclusions; any applicable Block wins;
   otherwise every applicable policy's grant must be satisfied ("require all" or "require one"); report-only policies
   are evaluated and logged but not enforced. Verified against Microsoft Learn 2026-11-18. */
window.ID_LAB = {
  missions: {
    mml: {
      id:"mml", title:"Monday Morning Lockout", topic:"2.2", code:"OPS-01",
      objectives:["2.2.1","2.2.2","2.2.3","2.2.4"],
      briefing:"Theo changed a Conditional Access policy on Friday. Now remote staff can't work, and someone is trying Jun's leaked password.",
      objective:"Fix the policies so every legitimate sign-in works and every attack is stopped.",
      /* Directory objects the policies can target */
      principals:[
        { id:"remote", kind:"group", label:"Remote staff" },
        { id:"office", kind:"group", label:"Office staff" },
        { id:"bg", kind:"user", label:"Emergency access account" }
      ],
      apps:[ { id:"outlook", label:"Outlook", icon:"mail" }, { id:"sharepoint", label:"SharePoint", icon:"doc" }, { id:"teams", label:"Teams", icon:"chat" } ],
      locations:{ offices:"Halcyon offices (trusted)" },
      actors:{
        ana:{ name:"Ana Ortiz", initials:"AO", role:"Marketing", groups:["remote"], kind:"person",
          location:{ label:"Home, Toronto", ip:"203.0.113.24", named:null }, device:{ label:"Halcyon laptop", platform:"Windows", icon:"laptop", state:"Compliant · Entra joined", compliant:true, hybrid:false },
          app:"outlook", client:"modern", clientLabel:"Outlook desktop", auth:"password", mfa:true, mfaLabel:"Authenticator registered", risk:"none", legit:true,
          ticket:"Can't open Outlook from home." },
        jun:{ name:"Jun Park", initials:"JP", role:"Analyst", groups:["office"], kind:"person",
          location:{ label:"Halcyon office, Toronto", ip:"198.51.100.10", named:"offices" }, device:{ label:"Halcyon laptop", platform:"Windows", icon:"laptop", state:"Compliant · Hybrid joined", compliant:true, hybrid:true },
          app:"sharepoint", client:"browser", clientLabel:"Browser", auth:"password", mfa:true, mfaLabel:"Authenticator registered", risk:"none", legit:true,
          ticket:null },
        priya:{ name:"Priya Raman", initials:"PR", role:"Marketing lead", groups:["remote"], kind:"person",
          location:{ label:"Hotel, Lisbon", ip:"192.0.2.77", named:null }, device:{ label:"Personal iPad", platform:"iOS", icon:"tablet", state:"Not managed", compliant:false, hybrid:false },
          app:"teams", client:"modern", clientLabel:"Teams app", auth:"password", mfa:true, mfaLabel:"Authenticator registered", risk:"none", legit:true,
          ticket:"Blocked from Teams at the conference." },
        attacker:{ name:"Jun Park?", initials:"??", role:"Uses Jun's leaked password", groups:["office"], kind:"attacker", account:"Jun Park",
          location:{ label:"Anonymous proxy", ip:"203.0.113.250", named:null }, device:{ label:"Unknown device", platform:"Linux", icon:"unknown", state:"Not managed", compliant:false, hybrid:false },
          app:"outlook", client:"browser", clientLabel:"Browser", auth:"password", mfa:false, mfaLabel:"Can't complete Jun's MFA", risk:"high", riskLabel:"High (anonymous IP, leaked credentials)", legit:false,
          ticket:null },
        imap:{ name:"Priya Raman?", initials:"??", role:"Password spray via IMAP", groups:["remote"], kind:"attacker", account:"Priya Raman",
          location:{ label:"Hosting provider", ip:"198.51.100.200", named:null }, device:{ label:"Mail script", platform:"Unknown", icon:"unknown", state:"Not managed", compliant:false, hybrid:false },
          app:"outlook", client:"legacy", clientLabel:"IMAP (legacy authentication)", auth:"password", mfa:false, mfaLabel:"Legacy protocols can't do MFA", risk:"medium", riskLabel:"Medium (password spray)", legit:false,
          ticket:null },
        bg:{ name:"Emergency access", initials:"EA", role:"breakglass@halcyonfreight.onmicrosoft.com", groups:[], kind:"admin", principal:"bg",
          location:{ label:"Nadia's home test", ip:"203.0.113.90", named:null }, device:{ label:"Admin workstation", platform:"Windows", icon:"laptop", state:"Not managed", compliant:false, hybrid:false },
          app:"sharepoint", client:"browser", clientLabel:"Browser", auth:"passkey", mfa:true, mfaLabel:"FIDO2 security key (passkey)", risk:"none", legit:true,
          ticket:"Monthly break-glass test failed." }
      },
      /* Prediction checks: new people, evaluated against the player's own final configuration */
      predictions:{
        lena:{ name:"Lena Fischer", initials:"LF", role:"Finance", groups:["remote"], kind:"person",
          location:{ label:"Café Wi-Fi, Toronto", ip:"203.0.113.140", named:null }, device:{ label:"Halcyon laptop", platform:"Windows", icon:"laptop", state:"Compliant · Entra joined", compliant:true, hybrid:false },
          app:"outlook", client:"modern", clientLabel:"Outlook desktop", auth:"password", mfa:true, mfaLabel:"Authenticator registered", risk:"none", legit:true },
        omar:{ name:"Omar Haddad", initials:"OH", role:"Developer", groups:["office"], kind:"person",
          location:{ label:"Halcyon office, Toronto", ip:"198.51.100.11", named:"offices" }, device:{ label:"Personal laptop", platform:"macOS", icon:"laptop", state:"Not managed", compliant:false, hybrid:false },
          app:"sharepoint", client:"browser", clientLabel:"Browser", auth:"password", mfa:true, mfaLabel:"Authenticator registered", risk:"none", legit:true },
        spray:{ name:"Ana Ortiz?", initials:"??", role:"Uses Ana's leaked password", groups:["remote"], kind:"attacker",
          location:{ label:"Residential proxy, Ottawa", ip:"192.0.2.201", named:null }, device:{ label:"Unknown device", platform:"Windows", icon:"unknown", state:"Not managed", compliant:false, hybrid:false },
          app:"teams", client:"browser", clientLabel:"Browser", auth:"password", mfa:false, mfaLabel:"Can't complete Ana's MFA", risk:"low", riskLabel:"Low", legit:false }
      },
      /* Initial policies. Fields: state on|report|off; include all|groups[]; exclude principal ids; apps all|[ids];
         network any|outside|inside; client any|legacy|modern; risk any|high|medhigh; grant block|grant; controls; op and|or */
      basePolicies:{
        CA01:{ id:"CA01", name:"Block legacy authentication", state:"on", include:"all", exclude:["bg"], apps:"all", network:"any", client:"legacy", risk:"any", grant:"block", controls:{mfa:false, compliant:false, hybrid:false}, op:"and" },
        CA02:{ id:"CA02", name:"Office network only", state:"on", include:"all", exclude:[], apps:"all", network:"outside", client:"any", risk:"any", grant:"block", controls:{mfa:false, compliant:false, hybrid:false}, op:"and", changedBy:"Theo, Friday 17:42" },
        CA03:{ id:"CA03", name:"Managed devices for Office 365", state:"on", include:"all", exclude:[], apps:["outlook","sharepoint","teams"], network:"any", client:"any", risk:"any", grant:"grant", controls:{mfa:false, compliant:true, hybrid:false}, op:"and", changedBy:"Theo, Friday 17:55" },
        NEW:{ id:"NEW", name:"New policy", state:"off", include:"all", exclude:[], apps:"all", network:"any", client:"any", risk:"any", grant:"grant", controls:{mfa:true, compliant:false, hybrid:false}, op:"and", isNew:true }
      },
      /* Adaptive variants: fewer variables and guided controls at Beginner; interacting requirements at Advanced */
      variants:{
        1:{ label:"Guided", actors:["ana","jun","attacker","bg"],
          policies:["CA01","CA02"], editable:{ CA01:[], CA02:["state","exclude","grant"] },
          requirements:["anaWorks","junWorks","attackerStopped","bgWorks","remoteStrong"], bonus:["bgExcluded"],
          predictions:["lena","spray"],
          hints:[
            "Ana and the attacker both sign in from outside the office. What can Ana do that the attacker can't?",
            { highlight:["ana","attacker","CA02.grant"] },
            "CA02 blocks every sign-in from outside the office. Change its grant from <b>Block</b> to <b>Require multifactor authentication</b>: Ana can complete MFA and the attacker can't. Then exclude the emergency access account from CA02, which is Microsoft's guidance for break-glass accounts." ] },
        2:{ label:"Standard", actors:["ana","jun","priya","attacker","imap","bg"],
          policies:["CA01","CA02","NEW"], editable:{ CA01:"all", CA02:"all", NEW:"all" },
          requirements:["anaWorks","junWorks","priyaWorks","attackerStopped","imapStopped","bgWorks","remoteStrong"], bonus:["bgExcluded"],
          predictions:["lena","omar","spray"],
          hints:[
            "Look at Priya's device before choosing a grant control. Not every legitimate sign-in comes from a managed device.",
            { highlight:["priya","attacker","CA02.grant"] },
            "CA02's Block stops everyone outside the office. Require <b>MFA</b> instead (or <b>MFA or a compliant device</b>, with “require one”). Priya's personal iPad isn't compliant, so “compliant device” alone would still lock her out. CA01 already stops the IMAP spray. Exclude the emergency access account from CA02." ] },
        3:{ label:"Advanced", actors:["ana","jun","priya","attacker","imap","bg"],
          policies:["CA01","CA02","CA03","NEW"], editable:{ CA01:"all", CA02:"all", CA03:"all", NEW:"all" },
          requirements:["anaWorks","junWorks","priyaWorks","attackerStopped","imapStopped","bgWorks","remoteStrong","riskBlocked"], bonus:["bgExcluded"],
          predictions:["lena","omar","spray"],
          hints:[
            "Two of Theo's changes interact. And one requirement wants high-risk sign-ins blocked outright, not just challenged.",
            { highlight:["priya","bg","attacker","CA03.controls","NEW.risk"] },
            "CA03 demands a compliant device for Office 365, which Priya's iPad and the admin workstation can't meet. Let CA03 accept <b>MFA or a compliant device</b> (require one), and change CA02 from Block to <b>Require MFA</b>. Turn on the new policy with <b>Sign-in risk: High</b> and <b>Block</b>. Exclude the emergency access account from every policy." ] }
      },
      requirementDefs:{
        anaWorks:{ kind:"allowed", actor:"ana", text:"Ana works from home" },
        junWorks:{ kind:"allowed", actor:"jun", text:"Jun works in the office" },
        priyaWorks:{ kind:"allowed", actor:"priya", text:"Priya works while traveling" },
        attackerStopped:{ kind:"stopped", actor:"attacker", text:"Jun's leaked password gets nowhere" },
        imapStopped:{ kind:"stopped", actor:"imap", text:"The IMAP password spray is stopped" },
        bgWorks:{ kind:"allowed", actor:"bg", text:"Emergency access still works" },
        remoteStrong:{ kind:"remoteStrong", text:"Off-site sign-ins use MFA or a compliant device" },
        riskBlocked:{ kind:"blockedByPolicy", actor:"attacker", text:"High-risk sign-ins are blocked outright" },
        bgExcluded:{ kind:"excludedEverywhere", principal:"bg", text:"Best practice: emergency account excluded from every policy" }
      },
      concepts:{
        start:"Press <b>Test</b> to replay this morning's sign-ins.",
        inspect:"Click a sign-in to see its evidence and which policies applied.",
        evaluate:"Every enabled policy whose assignments all match applies. A <b>Block</b> in any of them wins.",
        exclude:"Exclusions always beat inclusions.",
        grant:"If nothing blocks, every applying policy's grant controls must be met.",
        report:"Report-only policies are logged, never enforced.",
        retest:"Configuration changed. Press <b>Test</b> to see the effect."
      },
      learnMore:"<p><b>How Conditional Access decides</b></p><ul><li>All enabled policies are evaluated. A policy applies only when every assignment matches: users (minus exclusions), target resources, and each configured condition.</li><li>If any applying policy blocks, access is blocked.</li><li>Otherwise, every applying policy's grant controls must be satisfied. “Require all” means every selected control; “require one” means any one of them.</li><li>Report-only policies are evaluated and recorded in sign-in logs without enforcement.</li><li>Legacy authentication protocols can't perform MFA, so policies requiring MFA fail for them.</li></ul><p><b>Exam link:</b> SC-300 2.2.1 plan policies · 2.2.2 assignments · 2.2.3 controls · 2.2.4 test and troubleshoot (the sign-in log's Conditional Access tab and the What If tool show the same per-policy results you see here).</p>",
      simplifications:"Simplified simulation: a subset of Conditional Access settings; named locations, device compliance and MFA capability are given as facts; no session controls, security defaults, Microsoft-managed policies or continuous access evaluation. Conditional Access requires Microsoft Entra ID P1; risk conditions require P2. Halcyon and all people, addresses and devices are fictional.",
      sources:[ ["What is Conditional Access?","https://learn.microsoft.com/entra/identity/conditional-access/overview"],
        ["Grant controls","https://learn.microsoft.com/entra/identity/conditional-access/concept-conditional-access-grant"],
        ["Report-only mode","https://learn.microsoft.com/entra/identity/conditional-access/concept-conditional-access-report-only"],
        ["Block legacy authentication","https://learn.microsoft.com/entra/identity/conditional-access/policy-block-legacy-authentication"],
        ["Emergency access accounts","https://learn.microsoft.com/entra/identity/role-based-access-control/security-emergency-access"],
        ["Risk-based access policies","https://learn.microsoft.com/entra/id-protection/concept-identity-protection-policies"] ]
    }
  },
  /* Missions still to convert into the workspace (playable today as study missions in the library) */
  upcoming:[
    { title:"The Consent Lure", type:"App permission puzzle", topic:"3.2" },
    { title:"Admin for an Hour", type:"Privileged access request", topic:"4.3" },
    { title:"Who Still Needs This?", type:"Access review investigation", topic:"4.2" }
  ]
};

/* Register lab checks as hidden items so the shared adaptive engine and mastery rules can track them. */
(function (C) {
  const objs = ["2.2.2","2.2.3","2.2.4"];
  [1,2,3].forEach(l => { C.items["lab-mml-solve-"+l] = { lab:true, kind:"Ops mission", type:"lab", title:"Monday Morning Lockout ("+["","Guided","Standard","Advanced"][l]+")", obj:objs, difficulty:l, hints:["—"], exp:"—", sit:"—", src:["caOverview"] }; });
  ["lena","omar","spray"].forEach((p, i) => { C.items["lab-mml-predict-"+p] = { lab:true, kind:"Prediction", type:"lab", title:"Predict the gate: "+p, obj:["2.2.4","2.2.3"], difficulty:2, hints:["—"], exp:"—", sit:"—", src:["caOverview"] }; });
})(window.ID_CONTENT);
