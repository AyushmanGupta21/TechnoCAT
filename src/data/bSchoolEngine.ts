export interface BSchool {
  id: string;
  name: string;
  shortName: string;
  location: string;
  tier: "DREAM" | "TARGET" | "SAFE";
  logoBg: string;
  badge: string;
  overallCutoff: {
    GENERAL: number;
    NC_OBC: number;
    SC: number;
    ST: number;
    EWS: number;
  };
  sectionalCutoffs?: {
    VARC: number;
    DILR: number;
    QA: number;
  };
  weights: {
    catPercentile: number;
    tenthMarks: number;
    twelfthMarks: number;
    graduationMarks: number;
    workExperience: number;
    genderDiversity: number;
    academicDiversity: number;
  };
  avgPackageLpa: number;
  feesLakhs: number;
  keyHighlight: string;
  criteriaSummary: string;
}

export interface CandidateProfile {
  projectedPercentile: number;
  tenthPercent: number;
  twelfthPercent: number;
  twelfthStream: "Science" | "Commerce" | "Arts";
  gradPercent: number;
  gradDiscipline: "Engineering" | "Non-Engineering";
  workExMonths: number;
  category: "GENERAL" | "NC_OBC" | "SC" | "ST" | "EWS";
  gender: "Male" | "Female" | "Other";
}

export const TOP_B_SCHOOLS: BSchool[] = [
  {
    id: "iim-a",
    name: "Indian Institute of Management Ahmedabad",
    shortName: "IIM Ahmedabad",
    location: "Ahmedabad, Gujarat",
    tier: "DREAM",
    logoBg: "#FEF3C7",
    badge: "Rank #1 NIRF",
    overallCutoff: { GENERAL: 99.6, NC_OBC: 94.0, SC: 88.0, ST: 80.0, EWS: 96.0 },
    sectionalCutoffs: { VARC: 85, DILR: 85, QA: 85 },
    weights: {
      catPercentile: 65,
      tenthMarks: 10,
      twelfthMarks: 10,
      graduationMarks: 10,
      workExperience: 5,
      genderDiversity: 0,
      academicDiversity: 0,
    },
    avgPackageLpa: 34.4,
    feesLakhs: 25.0,
    keyHighlight: "Pioneer in Case Pedagogy; Highest consulting and PE placements globally.",
    criteriaSummary: "Requires rigorous 85+ across all 3 sections. Very high weight on CAT score (65%) with balanced academic rating.",
  },
  {
    id: "iim-b",
    name: "Indian Institute of Management Bangalore",
    shortName: "IIM Bangalore",
    location: "Bengaluru, Karnataka",
    tier: "DREAM",
    logoBg: "#E0E7FF",
    badge: "Leader in Tech & Consulting",
    overallCutoff: { GENERAL: 99.4, NC_OBC: 93.0, SC: 86.0, ST: 78.0, EWS: 95.0 },
    sectionalCutoffs: { VARC: 80, DILR: 80, QA: 80 },
    weights: {
      catPercentile: 55,
      tenthMarks: 10,
      twelfthMarks: 10,
      graduationMarks: 10,
      workExperience: 10,
      genderDiversity: 2.5,
      academicDiversity: 2.5,
    },
    avgPackageLpa: 35.3,
    feesLakhs: 24.5,
    keyHighlight: "Strongest work-experience weighting; Bangalore startup ecosystem integration.",
    criteriaSummary: "Values consistent academics and prior corporate experience (sweet spot 24-36 months). Diversity bonus points offered.",
  },
  {
    id: "iim-c",
    name: "Indian Institute of Management Calcutta",
    shortName: "IIM Calcutta",
    location: "Kolkata, West Bengal",
    tier: "DREAM",
    logoBg: "#FEE2E2",
    badge: "Finance Capital of India",
    overallCutoff: { GENERAL: 99.5, NC_OBC: 92.5, SC: 85.0, ST: 75.0, EWS: 94.5 },
    sectionalCutoffs: { VARC: 80, DILR: 80, QA: 85 },
    weights: {
      catPercentile: 56,
      tenthMarks: 10,
      twelfthMarks: 15,
      graduationMarks: 0,
      workExperience: 8,
      genderDiversity: 7,
      academicDiversity: 4,
    },
    avgPackageLpa: 35.0,
    feesLakhs: 25.0,
    keyHighlight: "Global reputation for quantitative finance, algorithmic trading, and investment banking.",
    criteriaSummary: "Zero weight on Graduation marks (relieves low UG worries!). Up to 7 bonus points for female candidates.",
  },
  {
    id: "fms-delhi",
    name: "Faculty of Management Studies, Delhi",
    shortName: "FMS Delhi",
    location: "New Delhi",
    tier: "DREAM",
    logoBg: "#DCFCE7",
    badge: "ROI King (Fees < ₹2.5L)",
    overallCutoff: { GENERAL: 99.3, NC_OBC: 92.0, SC: 84.0, ST: 72.0, EWS: 94.0 },
    sectionalCutoffs: { VARC: 80, DILR: 75, QA: 75 },
    weights: {
      catPercentile: 75,
      tenthMarks: 5,
      twelfthMarks: 5,
      graduationMarks: 0,
      workExperience: 5,
      genderDiversity: 5,
      academicDiversity: 5,
    },
    avgPackageLpa: 34.1,
    feesLakhs: 2.5,
    keyHighlight: "Astonishing ROI with 34L average salary against merely ₹2.5 Lakh total tuition fee.",
    criteriaSummary: "Dominantly CAT driven (VARC carries 40% weightage, QA 30%, DILR 30%). Highest score conversion probability for high CAT scorers.",
  },
  {
    id: "iim-l",
    name: "Indian Institute of Management Lucknow",
    shortName: "IIM Lucknow",
    location: "Lucknow, Uttar Pradesh",
    tier: "TARGET",
    logoBg: "#E0F2FE",
    badge: "Marketing & Operations Hub",
    overallCutoff: { GENERAL: 98.5, NC_OBC: 90.0, SC: 80.0, ST: 70.0, EWS: 92.0 },
    sectionalCutoffs: { VARC: 85, DILR: 85, QA: 85 },
    weights: {
      catPercentile: 60,
      tenthMarks: 0,
      twelfthMarks: 10,
      graduationMarks: 10,
      workExperience: 10,
      genderDiversity: 5,
      academicDiversity: 5,
    },
    avgPackageLpa: 32.2,
    feesLakhs: 20.7,
    keyHighlight: "Rigorous academic curriculum with top FMCG and leadership roles.",
    criteriaSummary: "Class 10th marks are completely ignored. High preference for non-engineers and work experience.",
  },
  {
    id: "iim-k",
    name: "Indian Institute of Management Kozhikode",
    shortName: "IIM Kozhikode",
    location: "Kozhikode, Kerala",
    tier: "TARGET",
    logoBg: "#F3E8FF",
    badge: "Leader in Diversity & Gender Equity",
    overallCutoff: { GENERAL: 97.8, NC_OBC: 88.0, SC: 78.0, ST: 68.0, EWS: 90.0 },
    sectionalCutoffs: { VARC: 75, DILR: 75, QA: 75 },
    weights: {
      catPercentile: 45,
      tenthMarks: 15,
      twelfthMarks: 15,
      graduationMarks: 0,
      workExperience: 5,
      genderDiversity: 10,
      academicDiversity: 10,
    },
    avgPackageLpa: 31.0,
    feesLakhs: 20.5,
    keyHighlight: "Pioneer in gender diversity; high composite calls for balanced non-engineer profiles.",
    criteriaSummary: "Highest diversity weighting (up to 10% gender + 10% academic diversity). Accessible even at 96-97%ile for diverse profiles.",
  },
  {
    id: "iim-i",
    name: "Indian Institute of Management Indore",
    shortName: "IIM Indore",
    location: "Indore, Madhya Pradesh",
    tier: "TARGET",
    logoBg: "#FCE7F3",
    badge: "Academics-Heavy Shortlist",
    overallCutoff: { GENERAL: 98.0, NC_OBC: 89.0, SC: 79.0, ST: 68.0, EWS: 90.5 },
    sectionalCutoffs: { VARC: 80, DILR: 80, QA: 80 },
    weights: {
      catPercentile: 35,
      tenthMarks: 34,
      twelfthMarks: 40,
      graduationMarks: 0,
      workExperience: 0,
      genderDiversity: 6,
      academicDiversity: 0,
    },
    avgPackageLpa: 30.1,
    feesLakhs: 21.0,
    keyHighlight: "Golden opportunity for students with 90%+ in 10th and 12th board examinations.",
    criteriaSummary: "Academics dominate the call criteria (74% combined weight for 10th & 12th). Work experience carries 0 points.",
  },
  {
    id: "spjimr",
    name: "S.P. Jain Institute of Management and Research",
    shortName: "SPJIMR Mumbai",
    location: "Mumbai, Maharashtra",
    tier: "TARGET",
    logoBg: "#FEF9C3",
    badge: "Profile-Based Early Shortlists",
    overallCutoff: { GENERAL: 96.0, NC_OBC: 90.0, SC: 80.0, ST: 70.0, EWS: 92.0 },
    sectionalCutoffs: { VARC: 75, DILR: 75, QA: 75 },
    weights: {
      catPercentile: 35,
      tenthMarks: 15,
      twelfthMarks: 15,
      graduationMarks: 15,
      workExperience: 10,
      genderDiversity: 5,
      academicDiversity: 5,
    },
    avgPackageLpa: 33.0,
    feesLakhs: 22.5,
    keyHighlight: "Profile-based shortlists offered before CAT exam; specialized Autumn internships.",
    criteriaSummary: "Holistic evaluation of co-curricular achievements, leadership, and consistent academic record.",
  },
  {
    id: "xlri",
    name: "XLRI Xavier School of Management",
    shortName: "XLRI Jamshedpur",
    location: "Jamshedpur, Jharkhand",
    tier: "TARGET",
    logoBg: "#CCFBF1",
    badge: "Premier HR & Business Management",
    overallCutoff: { GENERAL: 97.0, NC_OBC: 92.0, SC: 82.0, ST: 70.0, EWS: 92.0 },
    weights: {
      catPercentile: 60,
      tenthMarks: 10,
      twelfthMarks: 10,
      graduationMarks: 10,
      workExperience: 10,
      genderDiversity: 0,
      academicDiversity: 0,
    },
    avgPackageLpa: 32.7,
    feesLakhs: 25.0,
    keyHighlight: "#1 HR Program in Asia; Equal stature to IIM A/B/C for general management.",
    criteriaSummary: "Requires strong overall percentile along with balanced decision making and problem-solving aptitude.",
  },
  {
    id: "mdi-gurgaon",
    name: "Management Development Institute",
    shortName: "MDI Gurgaon",
    location: "Gurugram, Delhi-NCR",
    tier: "SAFE",
    logoBg: "#CFFAFE",
    badge: "Top Corporate Hub",
    overallCutoff: { GENERAL: 94.5, NC_OBC: 88.0, SC: 78.0, ST: 68.0, EWS: 90.0 },
    sectionalCutoffs: { VARC: 70, DILR: 70, QA: 70 },
    weights: {
      catPercentile: 55,
      tenthMarks: 15,
      twelfthMarks: 15,
      graduationMarks: 0,
      workExperience: 10,
      genderDiversity: 5,
      academicDiversity: 0,
    },
    avgPackageLpa: 27.6,
    feesLakhs: 24.0,
    keyHighlight: "Prime corporate location in Gurgaon with stellar placement record across consulting and BFSI.",
    criteriaSummary: "High call probability between 94-96%ile with solid board marks and 12-24 months work experience.",
  },
  {
    id: "iim-shillong",
    name: "Indian Institute of Management Shillong",
    shortName: "IIM Shillong",
    location: "Shillong, Meghalaya",
    tier: "SAFE",
    logoBg: "#E0F2FE",
    badge: "Rapidly Rising New IIM",
    overallCutoff: { GENERAL: 93.5, NC_OBC: 84.0, SC: 75.0, ST: 65.0, EWS: 88.0 },
    sectionalCutoffs: { VARC: 75, DILR: 75, QA: 75 },
    weights: {
      catPercentile: 50,
      tenthMarks: 10,
      twelfthMarks: 10,
      graduationMarks: 15,
      workExperience: 10,
      genderDiversity: 5,
      academicDiversity: 0,
    },
    avgPackageLpa: 26.1,
    feesLakhs: 18.5,
    keyHighlight: "Consistent top-15 tier placement performance and beautiful modern eco-campus.",
    criteriaSummary: "Balanced shortlisting model providing very reliable interview calls for 93+ percentile holders.",
  },
  {
    id: "cap-iims",
    name: "Common Admission Process (CAP IIMs)",
    shortName: "CAP IIMs (Trichy, Udaipur, Ranchi, Raipur)",
    location: "Multiple Campuses",
    tier: "SAFE",
    logoBg: "#F0FDF4",
    badge: "10 IIMs in 1 Interview",
    overallCutoff: { GENERAL: 92.0, NC_OBC: 74.0, SC: 54.0, ST: 40.0, EWS: 74.0 },
    sectionalCutoffs: { VARC: 70, DILR: 70, QA: 70 },
    weights: {
      catPercentile: 50,
      tenthMarks: 10,
      twelfthMarks: 10,
      graduationMarks: 15,
      workExperience: 10,
      genderDiversity: 5,
      academicDiversity: 0,
    },
    avgPackageLpa: 20.3,
    feesLakhs: 17.5,
    keyHighlight: "Single unified interview unlocks 10 prestigious new-generation IIM campuses.",
    criteriaSummary: "Strong safe bet for all candidates achieving 92+ percentile in CAT with consistent academics.",
  },
  {
    id: "iit-bombay",
    name: "Shailesh J. Mehta School of Management, IIT Bombay",
    shortName: "SJMSOM, IIT Bombay",
    location: "Mumbai, Maharashtra",
    tier: "TARGET",
    logoBg: "#E0E7FF",
    badge: "Tech & Supply Chain Giant",
    overallCutoff: { GENERAL: 98.0, NC_OBC: 90.0, SC: 80.0, ST: 70.0, EWS: 92.0 },
    sectionalCutoffs: { VARC: 75, DILR: 75, QA: 75 },
    weights: {
      catPercentile: 70,
      tenthMarks: 5,
      twelfthMarks: 5,
      graduationMarks: 10,
      workExperience: 10,
      genderDiversity: 0,
      academicDiversity: 0,
    },
    avgPackageLpa: 28.8,
    feesLakhs: 14.0,
    keyHighlight: "Affordable fee structure coupled with elite operations, analytics, and strategy roles.",
    criteriaSummary: "CAT heavy shortlisting (70%). Ideal for engineering graduates with 98+ percentile.",
  }
];

export interface PredictionResult {
  school: BSchool;
  compositeScore: number;
  callProbability: number;
  chanceTier: "Dream" | "Target" | "Safe";
  statusColor: string;
  isCutoffCleared: boolean;
  scoreGapMarks: number;
  gapAdvice: string;
}

export function calculateCompositeScore(school: BSchool, profile: CandidateProfile): number {
  let score = 0;
  const w = school.weights;

  // 1. CAT Percentile component (normalized to max weight)
  const catWeightMax = w.catPercentile;
  const catRatio = Math.max(0, (profile.projectedPercentile - 60) / 40); // 60 to 100 range
  score += Math.min(catWeightMax, catRatio * catWeightMax);

  // 2. Class 10th Marks
  if (w.tenthMarks > 0) {
    let tRatio = 0.5;
    if (profile.tenthPercent >= 90) tRatio = 1.0;
    else if (profile.tenthPercent >= 80) tRatio = 0.8;
    else if (profile.tenthPercent >= 70) tRatio = 0.6;
    else tRatio = 0.4;
    score += tRatio * w.tenthMarks;
  }

  // 3. Class 12th Marks
  if (w.twelfthMarks > 0) {
    let twRatio = 0.5;
    if (profile.twelfthPercent >= 90) twRatio = 1.0;
    else if (profile.twelfthPercent >= 80) twRatio = 0.8;
    else if (profile.twelfthPercent >= 70) twRatio = 0.6;
    else twRatio = 0.4;
    score += twRatio * w.twelfthMarks;
  }

  // 4. Graduation Marks
  if (w.graduationMarks > 0) {
    let gRatio = 0.5;
    if (profile.gradPercent >= 85) gRatio = 1.0;
    else if (profile.gradPercent >= 75) gRatio = 0.8;
    else if (profile.gradPercent >= 65) gRatio = 0.6;
    else gRatio = 0.4;
    score += gRatio * w.graduationMarks;
  }

  // 5. Work Experience (optimal curve 18-36 months)
  if (w.workExperience > 0) {
    const months = profile.workExMonths;
    let wxRatio = 0;
    if (months >= 24 && months <= 36) wxRatio = 1.0;
    else if (months >= 12 && months < 24) wxRatio = 0.7;
    else if (months > 36 && months <= 48) wxRatio = 0.7;
    else if (months > 0 && months < 12) wxRatio = 0.3;
    else wxRatio = 0;
    score += wxRatio * w.workExperience;
  }

  // 6. Gender Diversity
  if (w.genderDiversity > 0 && (profile.gender === "Female" || profile.gender === "Other")) {
    score += w.genderDiversity;
  }

  // 7. Academic Diversity (Non-Engineering)
  if (w.academicDiversity > 0 && profile.gradDiscipline === "Non-Engineering") {
    score += w.academicDiversity;
  }

  // Category scaling adjustment
  let catBonus = 0;
  if (profile.category === "NC_OBC") catBonus = 6;
  else if (profile.category === "EWS") catBonus = 4;
  else if (profile.category === "SC") catBonus = 14;
  else if (profile.category === "ST") catBonus = 20;

  return Math.min(100, Math.round((score + catBonus) * 10) / 10);
}

export function evaluateBSchoolChances(profile: CandidateProfile): {
  results: PredictionResult[];
  profileRating: string;
  diversityScore: number;
} {
  const catCutoffKey = profile.category;

  const results: PredictionResult[] = TOP_B_SCHOOLS.map((school) => {
    const requiredCutoff = school.overallCutoff[catCutoffKey] || 90;
    const isCutoffCleared = profile.projectedPercentile >= requiredCutoff;
    const compositeScore = calculateCompositeScore(school, profile);

    // Baseline chance calculation based on percentile delta + composite strength
    const percentileDelta = profile.projectedPercentile - requiredCutoff;
    let prob = 50 + percentileDelta * 15 + (compositeScore - 60) * 0.8;
    prob = Math.max(12, Math.min(98, Math.round(prob)));

    let chanceTier: "Dream" | "Target" | "Safe";
    let statusColor: string;

    if (prob >= 85) {
      chanceTier = "Safe";
      statusColor = "#10B981"; // Emerald
    } else if (prob >= 60) {
      chanceTier = "Target";
      statusColor = "#2563EB"; // Royal Blue
    } else {
      chanceTier = "Dream";
      statusColor = "#8B5CF6"; // Purple
    }

    // Calculate score gap in terms of CAT scaled marks needed to reach high probability
    let scoreGapMarks = 0;
    let gapAdvice = "";

    if (prob < 80) {
      const neededDelta = Math.max(0.5, (80 - prob) / 12);
      // ~2.5 to 3 marks per percentile in the 90-99 band
      scoreGapMarks = Math.round(neededDelta * 2.8);
      gapAdvice = `Need ~+${scoreGapMarks} marks in mocks to shift into high-probability call zone.`;
    } else {
      gapAdvice = "Your current profile and projected score firmly qualify for an interview call.";
    }

    return {
      school,
      compositeScore,
      callProbability: prob,
      chanceTier,
      statusColor,
      isCutoffCleared,
      scoreGapMarks,
      gapAdvice,
    };
  });

  // Calculate overall profile rating
  let profilePoints = 0;
  if (profile.tenthPercent >= 90) profilePoints += 25;
  else if (profile.tenthPercent >= 80) profilePoints += 18;
  else profilePoints += 12;

  if (profile.twelfthPercent >= 90) profilePoints += 25;
  else if (profile.twelfthPercent >= 80) profilePoints += 18;
  else profilePoints += 12;

  if (profile.gradPercent >= 80) profilePoints += 25;
  else if (profile.gradPercent >= 70) profilePoints += 18;
  else profilePoints += 12;

  if (profile.workExMonths >= 18 && profile.workExMonths <= 36) profilePoints += 15;
  else if (profile.workExMonths > 0) profilePoints += 8;

  let profileRating = "Balanced Profile";
  if (profilePoints >= 85) profileRating = "Exceptional Academic Record (9/9/9)";
  else if (profilePoints >= 70) profileRating = "Strong Competitive Profile";
  else if (profilePoints >= 50) profileRating = "Solid Profile (Percentile-Driven)";
  else profileRating = "Moderate Profile (Requires High CAT Score)";

  let diversityScore = 0;
  if (profile.gender === "Female" || profile.gender === "Other") diversityScore += 5;
  if (profile.gradDiscipline === "Non-Engineering") diversityScore += 5;

  return { results, profileRating, diversityScore };
}
