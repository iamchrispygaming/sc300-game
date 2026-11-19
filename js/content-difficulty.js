/* Difficulty tags for every question, by the thinking it requires (not by obscurity).
   1 Beginner: recognize a concept, guided choice, simple scenario.
   2 Intermediate: apply a concept, compare plausible solutions, troubleshoot.
   3 Advanced: multi-step or competing requirements, interpret logs/evidence, least-privilege design.
   Bank items (content-bank.js) carry their own tag. */
(function (C) {
  const B = 1, I = 2, A = 3;
  const tags = {
    // 1.1 tenant
    "c3":I, "m2-1":A, "m2-1t":I, "m2-2":I, "m2-3":A, "m2-4":A, "m2-5":I, "m3-1":I, "m3-2":B, "m3-3":I, "m3-4":B, "m3-5":A, "m3-7":I, "b1-3":A, "b1-5":B, "b1-6":B,
    // 1.2 identities
    "c1":I, "c1t":I, "c2a":I, "c2b":I, "c2t":B, "c3t":I, "m3-6":I, "m4-1":I, "m4-2":B, "m4-3":B, "m4-4":I, "m4-5":I, "m4-6":I, "b1-2":A,
    // 1.3 external
    "m5-1":A, "m5-2":B, "m5-3":I, "m5-4":I, "m5-5":I, "m5-6":I, "b1-4":A, "r-1.3.1":B, "r-1.3.2":B, "r-1.3.6":B,
    // 1.4 hybrid
    "m6-1":I, "m6-2":A, "m6-3":I, "m6-4":B, "m6-5":I, "m6-6":B, "m6-7":B, "b1-1":I, "f1-6":A, "r-1.4.5":I, "r-1.4.6":B, "r-1.4.7":B,
    // 2.1 authentication
    "m7-1":B, "m7-2":I, "m7-3":A, "m7-5":B, "m7-6":I, "m7-7":B, "m8-1":A, "m8-6":I, "m8-2":A, "m8-3":I, "m8-4":I, "m8-5":I, "b2-1":A, "b2-2":A, "b2-3":A, "r-2.1.5":B, "r-2.1.7":B,
    // 2.2 Conditional Access
    "m9-1":I, "m9-2":I, "m9-3":A, "m9-6":I, "m9-4":B, "m9-5":B, "m10-1":B, "m10-2":I, "m10-3":A, "m10-4":A, "m10-5":I, "m10-6":I, "m10-7":I, "b2-4":A, "b2-5":B, "b2-6":I, "f1-2":A,
    // 2.3 ID Protection
    "m7-4":B, "m11-1":A, "m11-2":I, "m11-5":B, "m11-3":I, "m11-6":I, "m11-4":A, "f1-4":A,
    // 2.4 Global Secure Access
    "m12-1":I, "m12-2":B, "m12-4":I, "m12-6":B, "m12-3":I, "m12-5":A, "f1-5":A,
    // 3.1 workload identities
    "m13-1":B, "m13-2":I, "m13-3":I, "m13-4":B, "m13-5":A, "m13-6":B, "b3-3":A,
    // 3.2 enterprise apps
    "m14-1":A, "m14-2":A, "m14-3":I, "m14-4":I, "m14-5":A, "m14-6":B, "m14-7":B, "b3-1":I, "b3-2":A, "b3-5":I, "f1-1":A, "r-3.2.2":I, "r-3.2.7":B,
    // 3.3 app registrations
    "m15-1":B, "m15-2":I, "m15-3":I, "m15-4":I, "m15-5":I, "m15-6":B, "b3-4":A, "r-3.3.1":B,
    // 3.4 Defender for Cloud Apps
    "m16-1":B, "m16-2":I, "m16-3":I, "m16-4":A, "m16-5":I, "m16-6":I, "m16-7":B, "b3-6":A, "r-3.4.2":I, "r-3.4.7":B,
    // 4.1 entitlement management
    "m17-1":I, "m17-2":A, "m17-3":A, "m17-6":I, "m17-5":I, "m17-4":B, "m17-7":B, "b4-4":A, "r-4.1.1":B, "r-4.1.2":I, "r-4.1.6":I,
    // 4.2 access reviews
    "m18-1":A, "m18-2":B, "m18-3":I, "m18-4":I, "m18-5":B, "m18-6":I, "b4-3":A, "r-4.2.3":B,
    // 4.3 privileged access
    "m19-1":A, "m19-2":B, "m19-3":I, "m19-4":I, "m19-5":I, "m19-6":B, "m19-7":I, "b4-1":I, "b4-2":A, "f1-3":A, "r-4.3.2":A, "r-4.3.3":I,
    // 4.4 monitoring
    "m20-1":B, "m20-2":B, "m20-3":I, "m20-4":I, "m20-7":I, "m20-5":B, "m20-6":I, "b4-5":A, "b4-6":B, "f1-7":A
  };
  Object.entries(tags).forEach(([id, d]) => { if (C.items[id] && !C.items[id].difficulty) C.items[id].difficulty = d; });
})(window.ID_CONTENT);
