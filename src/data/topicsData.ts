export interface Lesson {
  id: string;
  code?: string;
  title: string;
  subtopic?: string;
  moduleTitle?: string;
  duration: string;
  coverage?: string;
  videoTitle?: string;
  videoUrl?: string;
  youtubeId: string;
  completed: boolean;
  active?: boolean;
}

export interface TopicModule {
  title: string;
  lessons: Lesson[];
}

export interface Milestone {
  points: number;
  label: string;
  reached: boolean;
}

export interface Topic {
  id: string;
  codePrefix: string;
  title: string;
  shortTitle: string;
  category: string;
  description: string;
  fullAbout: string;
  suitsFor: string[];
  bannerGradient: string;
  bannerImage?: string;
  instructor: {
    name: string;
    role: string;
    avatar: string;
  };
  progressPercent: number;
  milestones: Milestone[];
  motivationalMessage: string;
  totalLessons: number;
  completedLessonsCount: number;
  modules?: TopicModule[];
  lessons: Lesson[];
}

export const TOPICS_DATA: Topic[] = [
  {
    "id": "qa-quantitative-ability",
    "codePrefix": "QA",
    "title": "Topic A: Quantitative Ability (QA)",
    "shortTitle": "Quantitative Ability (QA)",
    "category": "Quantitative Aptitude",
    "description": "Comprehensive CAT Quantitative Ability syllabus covering foundational speed maths, arithmetic, algebra, geometry, number systems, and modern mathematics with curated expert video lessons.",
    "fullAbout": "Comprehensive CAT Quantitative Ability syllabus covering foundational speed maths, arithmetic, algebra, geometry, number systems, and modern mathematics with curated expert video lessons.",
    "suitsFor": [
      "CAT aspirants aiming for 99+ percentile in QA.",
      "Non-engineers seeking to build solid mathematical fundamentals.",
      "Engineers looking for speed optimization and shortcut heuristics.",
      "Anyone targeting IIM Ahmedabad, Bangalore, Calcutta, and top MBA colleges."
    ],
    "bannerGradient": "linear-gradient(135deg, #ED1C24 0%, #B91C1C 100%)",
    "bannerImage": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&auto=format&fit=crop&q=85",
    "instructor": {
      "name": "Ayushman & Rodha CAT Faculty",
      "role": "Lead Quant Mentors • TechnoCAT",
      "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80"
    },
    "progressPercent": 6,
    "milestones": [
      {
        "points": 25,
        "label": "25 Points",
        "reached": false
      },
      {
        "points": 50,
        "label": "50 Points",
        "reached": false
      },
      {
        "points": 75,
        "label": "75 Points",
        "reached": false
      },
      {
        "points": 100,
        "label": "100 Points",
        "reached": false
      }
    ],
    "motivationalMessage": "Great momentum! 🚀 You are making rapid progress through Quantitative Ability (QA). Consistency in watching lectures and solving PYQs will ensure 99+ percentile!",
    "totalLessons": 51,
    "completedLessonsCount": 3,
    "modules": [
      {
        "title": "QA-0: Mathematical Foundation",
        "lessons": [
          {
            "id": "qa-0-1",
            "code": "QA-0.1",
            "title": "Speed Mathematics",
            "moduleTitle": "QA-0: Mathematical Foundation",
            "duration": "48 min",
            "coverage": "Fast multiplication/division, fractions, percentages, approximation, calculation shortcuts",
            "videoTitle": "Rodha – Speed Maths 1",
            "videoUrl": "https://www.youtube.com/watch?v=VT9-jeEmlJ8&amp;utm_source=chatgpt.com",
            "youtubeId": "VT9-jeEmlJ8",
            "completed": true,
            "active": false
          },
          {
            "id": "qa-0-2",
            "code": "QA-0.2",
            "title": "Fractions–Decimals–Percentages",
            "moduleTitle": "QA-0: Mathematical Foundation",
            "duration": "1 hour 12 min",
            "coverage": "Fraction↔decimal↔percentage conversion, common fractions",
            "videoTitle": "Rodha – Percentages 1",
            "videoUrl": "https://www.youtube.com/live/x-k8iSNr85g?utm_source=chatgpt.com",
            "youtubeId": "x-k8iSNr85g",
            "completed": true,
            "active": false
          },
          {
            "id": "qa-0-3",
            "code": "QA-0.3",
            "title": "Approximation &amp; Estimation",
            "moduleTitle": "QA-0: Mathematical Foundation",
            "duration": "55 min",
            "coverage": "Rounding, approximate ratios, percentage estimation, DI calculations",
            "videoTitle": "Rodha – Speed Maths 1",
            "videoUrl": "https://www.youtube.com/watch?v=VT9-jeEmlJ8&amp;utm_source=chatgpt.com",
            "youtubeId": "VT9-jeEmlJ8",
            "completed": true,
            "active": false
          }
        ]
      },
      {
        "title": "QA-1: Percentages and Commercial Mathematics",
        "lessons": [
          {
            "id": "qa-1-1",
            "code": "QA-1.1",
            "title": "Percentages",
            "moduleTitle": "QA-1: Percentages and Commercial Mathematics",
            "duration": "1 hour 25 min",
            "coverage": "Percentage value, increase/decrease, reverse percentage",
            "videoTitle": "Rodha – Percentages 1",
            "videoUrl": "https://www.youtube.com/live/x-k8iSNr85g?utm_source=chatgpt.com",
            "youtubeId": "x-k8iSNr85g",
            "completed": false,
            "active": true
          },
          {
            "id": "qa-1-2",
            "code": "QA-1.2",
            "title": "Successive Percentage Change",
            "moduleTitle": "QA-1: Percentages and Commercial Mathematics",
            "duration": "40 min",
            "coverage": "Successive increase/decrease, net percentage change",
            "videoTitle": "Rodha – Percentages",
            "videoUrl": "https://www.youtube.com/watch?v=x-k8iSNr85g&amp;utm_source=chatgpt.com",
            "youtubeId": "x-k8iSNr85g",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-1-3",
            "code": "QA-1.3",
            "title": "Profit &amp; Loss",
            "moduleTitle": "QA-1: Percentages and Commercial Mathematics",
            "duration": "1 hour 05 min",
            "coverage": "CP, SP, profit/loss percentage",
            "videoTitle": "CAT Profit, Loss &amp; Discount",
            "videoUrl": "https://www.youtube.com/watch?v=gvEmPmrz3pA&amp;utm_source=chatgpt.com",
            "youtubeId": "gvEmPmrz3pA",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-1-4",
            "code": "QA-1.4",
            "title": "Discount &amp; Marked Price",
            "moduleTitle": "QA-1: Percentages and Commercial Mathematics",
            "duration": "50 min",
            "coverage": "MP, discount, successive discount, equivalent discount",
            "videoTitle": "CAT Profit, Loss &amp; Discount",
            "videoUrl": "https://www.youtube.com/watch?v=gvEmPmrz3pA&amp;utm_source=chatgpt.com",
            "youtubeId": "gvEmPmrz3pA",
            "completed": false,
            "active": false
          }
        ]
      },
      {
        "title": "QA-2: Ratio, Proportion, Average and Mixtures",
        "lessons": [
          {
            "id": "qa-2-1",
            "code": "QA-2.1",
            "title": "Ratio",
            "moduleTitle": "QA-2: Ratio, Proportion, Average and Mixtures",
            "duration": "35 min",
            "coverage": "Ratio formation, comparison, sharing",
            "videoTitle": "Ratio &amp; Proportion for CAT",
            "videoUrl": "https://www.youtube.com/watch?v=v0XzBPGiMzI&amp;utm_source=chatgpt.com",
            "youtubeId": "v0XzBPGiMzI",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-2-2",
            "code": "QA-2.2",
            "title": "Proportion &amp; Variation",
            "moduleTitle": "QA-2: Ratio, Proportion, Average and Mixtures",
            "duration": "48 min",
            "coverage": "Direct, inverse and combined variation",
            "videoTitle": "Ratio &amp; Proportion for CAT",
            "videoUrl": "https://www.youtube.com/watch?v=v0XzBPGiMzI&amp;utm_source=chatgpt.com",
            "youtubeId": "v0XzBPGiMzI",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-2-3",
            "code": "QA-2.3",
            "title": "Averages",
            "moduleTitle": "QA-2: Ratio, Proportion, Average and Mixtures",
            "duration": "1 hour 12 min",
            "coverage": "Simple, weighted, combined and replacement averages",
            "videoTitle": "Rodha – Averages 1",
            "videoUrl": "https://www.youtube.com/watch?v=TBhanaOLNvc&amp;utm_source=chatgpt.com",
            "youtubeId": "TBhanaOLNvc",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-2-4",
            "code": "QA-2.4",
            "title": "Mixtures",
            "moduleTitle": "QA-2: Ratio, Proportion, Average and Mixtures",
            "duration": "55 min",
            "coverage": "Concentration, replacement and dilution",
            "videoTitle": "Rodha – Alligation &amp; Mixture 1",
            "videoUrl": "https://www.youtube.com/watch?v=3LmRyBpIhgQ",
            "youtubeId": "3LmRyBpIhgQ",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-2-5",
            "code": "QA-2.5",
            "title": "Alligation",
            "moduleTitle": "QA-2: Ratio, Proportion, Average and Mixtures",
            "duration": "1 hour 25 min",
            "coverage": "Alligation rule and mixture ratio",
            "videoTitle": "Rodha – Alligation &amp; Mixture 1",
            "videoUrl": "https://www.youtube.com/watch?v=3LmRyBpIhgQ",
            "youtubeId": "3LmRyBpIhgQ",
            "completed": false,
            "active": false
          }
        ]
      },
      {
        "title": "QA-3: Interest and Work",
        "lessons": [
          {
            "id": "qa-3-1",
            "code": "QA-3.1",
            "title": "Simple Interest",
            "moduleTitle": "QA-3: Interest and Work",
            "duration": "40 min",
            "coverage": "Principal, rate, time, amount",
            "videoTitle": "Rodha – SI &amp; CI Basics",
            "videoUrl": "https://www.youtube.com/watch?v=hvikOiSu_D4&amp;utm_source=chatgpt.com",
            "youtubeId": "hvikOiSu_D4",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-3-2",
            "code": "QA-3.2",
            "title": "Compound Interest",
            "moduleTitle": "QA-3: Interest and Work",
            "duration": "1 hour 05 min",
            "coverage": "Compound growth, depreciation, effective rate",
            "videoTitle": "Rodha – SI &amp; CI Basics",
            "videoUrl": "https://www.youtube.com/watch?v=hvikOiSu_D4&amp;utm_source=chatgpt.com",
            "youtubeId": "hvikOiSu_D4",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-3-3",
            "code": "QA-3.3",
            "title": "Time &amp; Work",
            "moduleTitle": "QA-3: Interest and Work",
            "duration": "50 min",
            "coverage": "Work rate, efficiency, combined work",
            "videoTitle": "Rodha – Time and Work 1",
            "videoUrl": "https://www.youtube.com/watch?v=oApzHGJNx38&amp;utm_source=chatgpt.com",
            "youtubeId": "oApzHGJNx38",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-3-4",
            "code": "QA-3.4",
            "title": "Pipes &amp; Cisterns",
            "moduleTitle": "QA-3: Interest and Work",
            "duration": "35 min",
            "coverage": "Filling/emptying, leaks, net work rate",
            "videoTitle": "Time &amp; Work Concept Lecture",
            "videoUrl": "https://www.youtube.com/watch?v=oApzHGJNx38&amp;utm_source=chatgpt.com",
            "youtubeId": "oApzHGJNx38",
            "completed": false,
            "active": false
          }
        ]
      },
      {
        "title": "QA-4: Time, Speed and Distance",
        "lessons": [
          {
            "id": "qa-4-1",
            "code": "QA-4.1",
            "title": "TSD Fundamentals",
            "moduleTitle": "QA-4: Time, Speed and Distance",
            "duration": "48 min",
            "coverage": "Distance = Speed × Time; proportionality",
            "videoTitle": "Rodha – TSD 1",
            "videoUrl": "https://www.youtube.com/watch?v=CKiP208avbc&amp;utm_source=chatgpt.com",
            "youtubeId": "CKiP208avbc",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-4-2",
            "code": "QA-4.2",
            "title": "Average Speed",
            "moduleTitle": "QA-4: Time, Speed and Distance",
            "duration": "1 hour 12 min",
            "coverage": "Equal distances, equal times, harmonic mean approach",
            "videoTitle": "Rodha – TSD Fundamentals",
            "videoUrl": "https://www.youtube.com/watch?v=CKiP208avbc&amp;utm_source=chatgpt.com",
            "youtubeId": "CKiP208avbc",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-4-3",
            "code": "QA-4.3",
            "title": "Relative Speed",
            "moduleTitle": "QA-4: Time, Speed and Distance",
            "duration": "55 min",
            "coverage": "Same/opposite direction, meeting problems",
            "videoTitle": "Rodha – Relative Speed",
            "videoUrl": "https://www.youtube.com/watch?v=EPLrK2RWVME&amp;utm_source=chatgpt.com",
            "youtubeId": "EPLrK2RWVME",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-4-4",
            "code": "QA-4.4",
            "title": "Trains",
            "moduleTitle": "QA-4: Time, Speed and Distance",
            "duration": "1 hour 25 min",
            "coverage": "Train–pole, platform and train–train problems",
            "videoTitle": "Problems on Trains for CAT",
            "videoUrl": "https://www.youtube.com/watch?v=v-383fMptOI&amp;utm_source=chatgpt.com",
            "youtubeId": "v-383fMptOI",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-4-5",
            "code": "QA-4.5",
            "title": "Boats &amp; Streams",
            "moduleTitle": "QA-4: Time, Speed and Distance",
            "duration": "40 min",
            "coverage": "Upstream/downstream/still-water speed",
            "videoTitle": "Rodha – Boats &amp; Streams",
            "videoUrl": "https://www.youtube.com/watch?v=vx3DfHuuY6Y&amp;utm_source=chatgpt.com",
            "youtubeId": "vx3DfHuuY6Y",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-4-6",
            "code": "QA-4.6",
            "title": "Circular Tracks",
            "moduleTitle": "QA-4: Time, Speed and Distance",
            "duration": "1 hour 05 min",
            "coverage": "Meeting, laps, same/opposite direction",
            "videoTitle": "Rodha – Circular Tracks 1",
            "videoUrl": "https://www.youtube.com/watch?v=rdleefuXHQk&amp;utm_source=chatgpt.com",
            "youtubeId": "rdleefuXHQk",
            "completed": false,
            "active": false
          }
        ]
      },
      {
        "title": "QA-5: Number System",
        "lessons": [
          {
            "id": "qa-5-1",
            "code": "QA-5.1",
            "title": "Types of Numbers",
            "moduleTitle": "QA-5: Number System",
            "duration": "50 min",
            "coverage": "Natural, whole, integer, rational, irrational",
            "videoTitle": "Number System for CAT",
            "videoUrl": "https://www.youtube.com/watch?v=lHB5xb9McOg&amp;utm_source=chatgpt.com",
            "youtubeId": "lHB5xb9McOg",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-5-2",
            "code": "QA-5.2",
            "title": "Factors &amp; Multiples",
            "moduleTitle": "QA-5: Number System",
            "duration": "35 min",
            "coverage": "Prime factorisation, factors, multiples",
            "videoTitle": "Rodha – Number System",
            "videoUrl": "https://www.youtube.com/watch?v=_g89_8Bb57g&amp;utm_source=chatgpt.com",
            "youtubeId": "_g89_8Bb57g",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-5-3",
            "code": "QA-5.3",
            "title": "HCF &amp; LCM",
            "moduleTitle": "QA-5: Number System",
            "duration": "48 min",
            "coverage": "HCF, LCM, application problems",
            "videoTitle": "CAT HCF &amp; LCM",
            "videoUrl": "https://www.youtube.com/watch?v=JyN6EROdhrw&amp;utm_source=chatgpt.com",
            "youtubeId": "JyN6EROdhrw",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-5-4",
            "code": "QA-5.4",
            "title": "Divisibility Rules",
            "moduleTitle": "QA-5: Number System",
            "duration": "1 hour 12 min",
            "coverage": "Divisibility by 2,3,4,5,8,9,11 etc.",
            "videoTitle": "Rodha – Divisibility Rules 1",
            "videoUrl": "https://www.youtube.com/watch?v=p0JbJd5DpWY&amp;utm_source=chatgpt.com",
            "youtubeId": "p0JbJd5DpWY",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-5-5",
            "code": "QA-5.5",
            "title": "Advanced Divisibility",
            "moduleTitle": "QA-5: Number System",
            "duration": "55 min",
            "coverage": "Divisibility by 7, 11, 13, 27, 37",
            "videoTitle": "Rodha – Divisibility Rules 3",
            "videoUrl": "https://www.youtube.com/watch?v=NqgFXVIrRmY&amp;utm_source=chatgpt.com",
            "youtubeId": "NqgFXVIrRmY",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-5-6",
            "code": "QA-5.6",
            "title": "Remainders",
            "moduleTitle": "QA-5: Number System",
            "duration": "1 hour 25 min",
            "coverage": "Modular arithmetic, remainder patterns",
            "videoTitle": "Rodha – Divisibility &amp; Remainders",
            "videoUrl": "https://www.youtube.com/watch?v=NqgFXVIrRmY&amp;utm_source=chatgpt.com",
            "youtubeId": "NqgFXVIrRmY",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-5-7",
            "code": "QA-5.7",
            "title": "Unit Digit &amp; Cyclicity",
            "moduleTitle": "QA-5: Number System",
            "duration": "40 min",
            "coverage": "Last digit, power cycles",
            "videoTitle": "Rodha – Number System/Cyclicity",
            "videoUrl": "https://www.youtube.com/watch?v=_g89_8Bb57g&amp;utm_source=chatgpt.com",
            "youtubeId": "_g89_8Bb57g",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-5-8",
            "code": "QA-5.8",
            "title": "Factorials &amp; Trailing Zeros",
            "moduleTitle": "QA-5: Number System",
            "duration": "1 hour 05 min",
            "coverage": "Factorial powers, number of zeros",
            "videoTitle": "Rodha – Factorials",
            "videoUrl": "https://www.youtube.com/watch?v=_g89_8Bb57g&amp;utm_source=chatgpt.com",
            "youtubeId": "_g89_8Bb57g",
            "completed": false,
            "active": false
          }
        ]
      },
      {
        "title": "QA-6: Algebra",
        "lessons": [
          {
            "id": "qa-6-1",
            "code": "QA-6.1",
            "title": "Linear Equations",
            "moduleTitle": "QA-6: Algebra",
            "duration": "50 min",
            "coverage": "One/two variables, simultaneous equations",
            "videoTitle": "CAT Linear Equations",
            "videoUrl": "https://www.youtube.com/watch?v=W6MKuAnB0h4&amp;utm_source=chatgpt.com",
            "youtubeId": "W6MKuAnB0h4",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-6-2",
            "code": "QA-6.2",
            "title": "Quadratic Equations",
            "moduleTitle": "QA-6: Algebra",
            "duration": "35 min",
            "coverage": "Roots, discriminant, sum/product of roots",
            "videoTitle": "Rodha – Quadratic Equations",
            "videoUrl": "https://www.youtube.com/watch?v=rk64bqehuto&amp;utm_source=chatgpt.com",
            "youtubeId": "rk64bqehuto",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-6-3",
            "code": "QA-6.3",
            "title": "Inequalities",
            "moduleTitle": "QA-6: Algebra",
            "duration": "48 min",
            "coverage": "Linear/quadratic inequalities, sign analysis",
            "videoTitle": "CAT Inequalities",
            "videoUrl": "https://www.youtube.com/watch?v=zIrr1lkvyBY&amp;utm_source=chatgpt.com",
            "youtubeId": "zIrr1lkvyBY",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-6-4",
            "code": "QA-6.4",
            "title": "Surds &amp; Indices",
            "moduleTitle": "QA-6: Algebra",
            "duration": "1 hour 12 min",
            "coverage": "Exponent laws, radicals, rationalisation",
            "videoTitle": "CAT Surds &amp; Indices",
            "videoUrl": "https://www.youtube.com/watch?v=zgxx5FpvCus&amp;utm_source=chatgpt.com",
            "youtubeId": "zgxx5FpvCus",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-6-5",
            "code": "QA-6.5",
            "title": "Logarithms",
            "moduleTitle": "QA-6: Algebra",
            "duration": "55 min",
            "coverage": "Laws of logarithm, equations, comparison",
            "videoTitle": "CAT Logarithms",
            "videoUrl": "https://www.youtube.com/watch?v=rrKGA55b_7c&amp;utm_source=chatgpt.com",
            "youtubeId": "rrKGA55b_7c",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-6-6",
            "code": "QA-6.6",
            "title": "Functions",
            "moduleTitle": "QA-6: Algebra",
            "duration": "1 hour 25 min",
            "coverage": "Domain, range, function notation and mappings",
            "videoTitle": "Rodha – Functions 1",
            "videoUrl": "https://www.youtube.com/results?search_query=Functions+-+1+Rodha+CAT&amp;utm_source=chatgpt.com",
            "youtubeId": "VT9-jeEmlJ8",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-6-7",
            "code": "QA-6.7",
            "title": "AP",
            "moduleTitle": "QA-6: Algebra",
            "duration": "40 min",
            "coverage": "nth term, sum, arithmetic mean",
            "videoTitle": "CAT Sequences &amp; Series",
            "videoUrl": "https://www.youtube.com/watch?v=efy0XXnmIpE&amp;utm_source=chatgpt.com",
            "youtubeId": "efy0XXnmIpE",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-6-8",
            "code": "QA-6.8",
            "title": "GP",
            "moduleTitle": "QA-6: Algebra",
            "duration": "1 hour 05 min",
            "coverage": "Common ratio, nth term, sum, infinite GP",
            "videoTitle": "CAT Sequences &amp; Series",
            "videoUrl": "https://www.youtube.com/watch?v=efy0XXnmIpE&amp;utm_source=chatgpt.com",
            "youtubeId": "efy0XXnmIpE",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-6-9",
            "code": "QA-6.9",
            "title": "Set Theory",
            "moduleTitle": "QA-6: Algebra",
            "duration": "50 min",
            "coverage": "Union, intersection, complement",
            "videoTitle": "CAT Set Theory &amp; Functions",
            "videoUrl": "https://www.youtube.com/watch?v=hupkYQh2ADE&amp;utm_source=chatgpt.com",
            "youtubeId": "hupkYQh2ADE",
            "completed": false,
            "active": false
          }
        ]
      },
      {
        "title": "QA-7: Geometry &amp; Mensuration",
        "lessons": [
          {
            "id": "qa-7-1",
            "code": "QA-7.1",
            "title": "Lines &amp; Angles",
            "moduleTitle": "QA-7: Geometry &amp; Mensuration",
            "duration": "35 min",
            "coverage": "Parallel lines, transversals, angle properties",
            "videoTitle": "Rodha – Geometry/Triangles",
            "videoUrl": "https://www.youtube.com/watch?v=rUI1bbCvk7E&amp;utm_source=chatgpt.com",
            "youtubeId": "rUI1bbCvk7E",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-7-2",
            "code": "QA-7.2",
            "title": "Triangles",
            "moduleTitle": "QA-7: Geometry &amp; Mensuration",
            "duration": "48 min",
            "coverage": "Similarity, congruence, area, median, altitude",
            "videoTitle": "Rodha – Triangles 1",
            "videoUrl": "https://www.youtube.com/watch?v=rUI1bbCvk7E&amp;utm_source=chatgpt.com",
            "youtubeId": "rUI1bbCvk7E",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-7-3",
            "code": "QA-7.3",
            "title": "Advanced Triangles",
            "moduleTitle": "QA-7: Geometry &amp; Mensuration",
            "duration": "1 hour 12 min",
            "coverage": "Angle bisectors, special triangles, centres",
            "videoTitle": "Rodha – Triangles 2",
            "videoUrl": "https://www.youtube.com/watch?v=25P2O9r3AfM&amp;utm_source=chatgpt.com",
            "youtubeId": "25P2O9r3AfM",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-7-4",
            "code": "QA-7.4",
            "title": "Quadrilaterals",
            "moduleTitle": "QA-7: Geometry &amp; Mensuration",
            "duration": "55 min",
            "coverage": "Square, rectangle, parallelogram, rhombus, trapezium",
            "videoTitle": "Rodha – Quadrilaterals 1",
            "videoUrl": "https://www.youtube.com/watch?v=TZadcVDti64&amp;utm_source=chatgpt.com",
            "youtubeId": "TZadcVDti64",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-7-5",
            "code": "QA-7.5",
            "title": "Circles",
            "moduleTitle": "QA-7: Geometry &amp; Mensuration",
            "duration": "1 hour 25 min",
            "coverage": "Chord, tangent, secant, cyclic quadrilateral",
            "videoTitle": "Rodha – Circles 1",
            "videoUrl": "https://www.youtube.com/watch?v=EAz4sd6svzo&amp;utm_source=chatgpt.com",
            "youtubeId": "EAz4sd6svzo",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-7-6",
            "code": "QA-7.6",
            "title": "Coordinate Geometry",
            "moduleTitle": "QA-7: Geometry &amp; Mensuration",
            "duration": "40 min",
            "coverage": "Distance, slope, section formula, straight line",
            "videoTitle": "Coordinate Geometry – Ronak Shah",
            "videoUrl": "https://www.youtube.com/watch?v=sUnNDlttOZ0",
            "youtubeId": "sUnNDlttOZ0",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-7-7",
            "code": "QA-7.7",
            "title": "2-D Mensuration",
            "moduleTitle": "QA-7: Geometry &amp; Mensuration",
            "duration": "1 hour 05 min",
            "coverage": "Areas and perimeters",
            "videoTitle": "CAT Mensuration",
            "videoUrl": "https://www.youtube.com/watch?v=64Z4dT1qFmA&amp;utm_source=chatgpt.com",
            "youtubeId": "64Z4dT1qFmA",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-7-8",
            "code": "QA-7.8",
            "title": "3-D Mensuration",
            "moduleTitle": "QA-7: Geometry &amp; Mensuration",
            "duration": "50 min",
            "coverage": "Cube, cuboid, cylinder, cone, sphere",
            "videoTitle": "Rodha – Mensuration 1",
            "videoUrl": "https://www.youtube.com/watch?v=HhtLt2JZKu4&amp;utm_source=chatgpt.com",
            "youtubeId": "HhtLt2JZKu4",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-7-9",
            "code": "QA-7.9",
            "title": "Trigonometry",
            "moduleTitle": "QA-7: Geometry &amp; Mensuration",
            "duration": "35 min",
            "coverage": "Ratios, standard values, heights and distances",
            "videoTitle": "CAT Trigonometry",
            "videoUrl": "https://www.youtube.com/watch?v=unXrQgL_JLo&amp;utm_source=chatgpt.com",
            "youtubeId": "unXrQgL_JLo",
            "completed": false,
            "active": false
          }
        ]
      },
      {
        "title": "QA-8: Modern Mathematics",
        "lessons": [
          {
            "id": "qa-8-1",
            "code": "QA-8.1",
            "title": "Permutation",
            "moduleTitle": "QA-8: Modern Mathematics",
            "duration": "48 min",
            "coverage": "Linear/circular arrangements, repeated objects",
            "videoTitle": "CAT Permutation &amp; Combination",
            "videoUrl": "https://www.youtube.com/watch?v=yvEYrZeBG_M&amp;utm_source=chatgpt.com",
            "youtubeId": "yvEYrZeBG_M",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-8-2",
            "code": "QA-8.2",
            "title": "Combination",
            "moduleTitle": "QA-8: Modern Mathematics",
            "duration": "1 hour 12 min",
            "coverage": "Selection, grouping, committees",
            "videoTitle": "CAT Permutation &amp; Combination",
            "videoUrl": "https://www.youtube.com/watch?v=yvEYrZeBG_M&amp;utm_source=chatgpt.com",
            "youtubeId": "yvEYrZeBG_M",
            "completed": false,
            "active": false
          },
          {
            "id": "qa-8-3",
            "code": "QA-8.3",
            "title": "Probability",
            "moduleTitle": "QA-8: Modern Mathematics",
            "duration": "55 min",
            "coverage": "Events, complementary probability, conditional reasoning",
            "videoTitle": "Rodha – Probability 1",
            "videoUrl": "https://www.youtube.com/watch?v=b6hmLsjbA7E",
            "youtubeId": "b6hmLsjbA7E",
            "completed": false,
            "active": false
          }
        ]
      }
    ],
    "lessons": [
      {
        "id": "qa-0-1",
        "code": "QA-0.1",
        "title": "Speed Mathematics",
        "moduleTitle": "QA-0: Mathematical Foundation",
        "duration": "48 min",
        "coverage": "Fast multiplication/division, fractions, percentages, approximation, calculation shortcuts",
        "videoTitle": "Rodha – Speed Maths 1",
        "videoUrl": "https://www.youtube.com/watch?v=VT9-jeEmlJ8&amp;utm_source=chatgpt.com",
        "youtubeId": "VT9-jeEmlJ8",
        "completed": true,
        "active": false
      },
      {
        "id": "qa-0-2",
        "code": "QA-0.2",
        "title": "Fractions–Decimals–Percentages",
        "moduleTitle": "QA-0: Mathematical Foundation",
        "duration": "1 hour 12 min",
        "coverage": "Fraction↔decimal↔percentage conversion, common fractions",
        "videoTitle": "Rodha – Percentages 1",
        "videoUrl": "https://www.youtube.com/live/x-k8iSNr85g?utm_source=chatgpt.com",
        "youtubeId": "x-k8iSNr85g",
        "completed": true,
        "active": false
      },
      {
        "id": "qa-0-3",
        "code": "QA-0.3",
        "title": "Approximation &amp; Estimation",
        "moduleTitle": "QA-0: Mathematical Foundation",
        "duration": "55 min",
        "coverage": "Rounding, approximate ratios, percentage estimation, DI calculations",
        "videoTitle": "Rodha – Speed Maths 1",
        "videoUrl": "https://www.youtube.com/watch?v=VT9-jeEmlJ8&amp;utm_source=chatgpt.com",
        "youtubeId": "VT9-jeEmlJ8",
        "completed": true,
        "active": false
      },
      {
        "id": "qa-1-1",
        "code": "QA-1.1",
        "title": "Percentages",
        "moduleTitle": "QA-1: Percentages and Commercial Mathematics",
        "duration": "1 hour 25 min",
        "coverage": "Percentage value, increase/decrease, reverse percentage",
        "videoTitle": "Rodha – Percentages 1",
        "videoUrl": "https://www.youtube.com/live/x-k8iSNr85g?utm_source=chatgpt.com",
        "youtubeId": "x-k8iSNr85g",
        "completed": false,
        "active": true
      },
      {
        "id": "qa-1-2",
        "code": "QA-1.2",
        "title": "Successive Percentage Change",
        "moduleTitle": "QA-1: Percentages and Commercial Mathematics",
        "duration": "40 min",
        "coverage": "Successive increase/decrease, net percentage change",
        "videoTitle": "Rodha – Percentages",
        "videoUrl": "https://www.youtube.com/watch?v=x-k8iSNr85g&amp;utm_source=chatgpt.com",
        "youtubeId": "x-k8iSNr85g",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-1-3",
        "code": "QA-1.3",
        "title": "Profit &amp; Loss",
        "moduleTitle": "QA-1: Percentages and Commercial Mathematics",
        "duration": "1 hour 05 min",
        "coverage": "CP, SP, profit/loss percentage",
        "videoTitle": "CAT Profit, Loss &amp; Discount",
        "videoUrl": "https://www.youtube.com/watch?v=gvEmPmrz3pA&amp;utm_source=chatgpt.com",
        "youtubeId": "gvEmPmrz3pA",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-1-4",
        "code": "QA-1.4",
        "title": "Discount &amp; Marked Price",
        "moduleTitle": "QA-1: Percentages and Commercial Mathematics",
        "duration": "50 min",
        "coverage": "MP, discount, successive discount, equivalent discount",
        "videoTitle": "CAT Profit, Loss &amp; Discount",
        "videoUrl": "https://www.youtube.com/watch?v=gvEmPmrz3pA&amp;utm_source=chatgpt.com",
        "youtubeId": "gvEmPmrz3pA",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-2-1",
        "code": "QA-2.1",
        "title": "Ratio",
        "moduleTitle": "QA-2: Ratio, Proportion, Average and Mixtures",
        "duration": "35 min",
        "coverage": "Ratio formation, comparison, sharing",
        "videoTitle": "Ratio &amp; Proportion for CAT",
        "videoUrl": "https://www.youtube.com/watch?v=v0XzBPGiMzI&amp;utm_source=chatgpt.com",
        "youtubeId": "v0XzBPGiMzI",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-2-2",
        "code": "QA-2.2",
        "title": "Proportion &amp; Variation",
        "moduleTitle": "QA-2: Ratio, Proportion, Average and Mixtures",
        "duration": "48 min",
        "coverage": "Direct, inverse and combined variation",
        "videoTitle": "Ratio &amp; Proportion for CAT",
        "videoUrl": "https://www.youtube.com/watch?v=v0XzBPGiMzI&amp;utm_source=chatgpt.com",
        "youtubeId": "v0XzBPGiMzI",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-2-3",
        "code": "QA-2.3",
        "title": "Averages",
        "moduleTitle": "QA-2: Ratio, Proportion, Average and Mixtures",
        "duration": "1 hour 12 min",
        "coverage": "Simple, weighted, combined and replacement averages",
        "videoTitle": "Rodha – Averages 1",
        "videoUrl": "https://www.youtube.com/watch?v=TBhanaOLNvc&amp;utm_source=chatgpt.com",
        "youtubeId": "TBhanaOLNvc",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-2-4",
        "code": "QA-2.4",
        "title": "Mixtures",
        "moduleTitle": "QA-2: Ratio, Proportion, Average and Mixtures",
        "duration": "55 min",
        "coverage": "Concentration, replacement and dilution",
        "videoTitle": "Rodha – Alligation &amp; Mixture 1",
        "videoUrl": "https://www.youtube.com/watch?v=3LmRyBpIhgQ",
        "youtubeId": "3LmRyBpIhgQ",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-2-5",
        "code": "QA-2.5",
        "title": "Alligation",
        "moduleTitle": "QA-2: Ratio, Proportion, Average and Mixtures",
        "duration": "1 hour 25 min",
        "coverage": "Alligation rule and mixture ratio",
        "videoTitle": "Rodha – Alligation &amp; Mixture 1",
        "videoUrl": "https://www.youtube.com/watch?v=3LmRyBpIhgQ",
        "youtubeId": "3LmRyBpIhgQ",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-3-1",
        "code": "QA-3.1",
        "title": "Simple Interest",
        "moduleTitle": "QA-3: Interest and Work",
        "duration": "40 min",
        "coverage": "Principal, rate, time, amount",
        "videoTitle": "Rodha – SI &amp; CI Basics",
        "videoUrl": "https://www.youtube.com/watch?v=hvikOiSu_D4&amp;utm_source=chatgpt.com",
        "youtubeId": "hvikOiSu_D4",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-3-2",
        "code": "QA-3.2",
        "title": "Compound Interest",
        "moduleTitle": "QA-3: Interest and Work",
        "duration": "1 hour 05 min",
        "coverage": "Compound growth, depreciation, effective rate",
        "videoTitle": "Rodha – SI &amp; CI Basics",
        "videoUrl": "https://www.youtube.com/watch?v=hvikOiSu_D4&amp;utm_source=chatgpt.com",
        "youtubeId": "hvikOiSu_D4",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-3-3",
        "code": "QA-3.3",
        "title": "Time &amp; Work",
        "moduleTitle": "QA-3: Interest and Work",
        "duration": "50 min",
        "coverage": "Work rate, efficiency, combined work",
        "videoTitle": "Rodha – Time and Work 1",
        "videoUrl": "https://www.youtube.com/watch?v=oApzHGJNx38&amp;utm_source=chatgpt.com",
        "youtubeId": "oApzHGJNx38",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-3-4",
        "code": "QA-3.4",
        "title": "Pipes &amp; Cisterns",
        "moduleTitle": "QA-3: Interest and Work",
        "duration": "35 min",
        "coverage": "Filling/emptying, leaks, net work rate",
        "videoTitle": "Time &amp; Work Concept Lecture",
        "videoUrl": "https://www.youtube.com/watch?v=oApzHGJNx38&amp;utm_source=chatgpt.com",
        "youtubeId": "oApzHGJNx38",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-4-1",
        "code": "QA-4.1",
        "title": "TSD Fundamentals",
        "moduleTitle": "QA-4: Time, Speed and Distance",
        "duration": "48 min",
        "coverage": "Distance = Speed × Time; proportionality",
        "videoTitle": "Rodha – TSD 1",
        "videoUrl": "https://www.youtube.com/watch?v=CKiP208avbc&amp;utm_source=chatgpt.com",
        "youtubeId": "CKiP208avbc",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-4-2",
        "code": "QA-4.2",
        "title": "Average Speed",
        "moduleTitle": "QA-4: Time, Speed and Distance",
        "duration": "1 hour 12 min",
        "coverage": "Equal distances, equal times, harmonic mean approach",
        "videoTitle": "Rodha – TSD Fundamentals",
        "videoUrl": "https://www.youtube.com/watch?v=CKiP208avbc&amp;utm_source=chatgpt.com",
        "youtubeId": "CKiP208avbc",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-4-3",
        "code": "QA-4.3",
        "title": "Relative Speed",
        "moduleTitle": "QA-4: Time, Speed and Distance",
        "duration": "55 min",
        "coverage": "Same/opposite direction, meeting problems",
        "videoTitle": "Rodha – Relative Speed",
        "videoUrl": "https://www.youtube.com/watch?v=EPLrK2RWVME&amp;utm_source=chatgpt.com",
        "youtubeId": "EPLrK2RWVME",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-4-4",
        "code": "QA-4.4",
        "title": "Trains",
        "moduleTitle": "QA-4: Time, Speed and Distance",
        "duration": "1 hour 25 min",
        "coverage": "Train–pole, platform and train–train problems",
        "videoTitle": "Problems on Trains for CAT",
        "videoUrl": "https://www.youtube.com/watch?v=v-383fMptOI&amp;utm_source=chatgpt.com",
        "youtubeId": "v-383fMptOI",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-4-5",
        "code": "QA-4.5",
        "title": "Boats &amp; Streams",
        "moduleTitle": "QA-4: Time, Speed and Distance",
        "duration": "40 min",
        "coverage": "Upstream/downstream/still-water speed",
        "videoTitle": "Rodha – Boats &amp; Streams",
        "videoUrl": "https://www.youtube.com/watch?v=vx3DfHuuY6Y&amp;utm_source=chatgpt.com",
        "youtubeId": "vx3DfHuuY6Y",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-4-6",
        "code": "QA-4.6",
        "title": "Circular Tracks",
        "moduleTitle": "QA-4: Time, Speed and Distance",
        "duration": "1 hour 05 min",
        "coverage": "Meeting, laps, same/opposite direction",
        "videoTitle": "Rodha – Circular Tracks 1",
        "videoUrl": "https://www.youtube.com/watch?v=rdleefuXHQk&amp;utm_source=chatgpt.com",
        "youtubeId": "rdleefuXHQk",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-5-1",
        "code": "QA-5.1",
        "title": "Types of Numbers",
        "moduleTitle": "QA-5: Number System",
        "duration": "50 min",
        "coverage": "Natural, whole, integer, rational, irrational",
        "videoTitle": "Number System for CAT",
        "videoUrl": "https://www.youtube.com/watch?v=lHB5xb9McOg&amp;utm_source=chatgpt.com",
        "youtubeId": "lHB5xb9McOg",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-5-2",
        "code": "QA-5.2",
        "title": "Factors &amp; Multiples",
        "moduleTitle": "QA-5: Number System",
        "duration": "35 min",
        "coverage": "Prime factorisation, factors, multiples",
        "videoTitle": "Rodha – Number System",
        "videoUrl": "https://www.youtube.com/watch?v=_g89_8Bb57g&amp;utm_source=chatgpt.com",
        "youtubeId": "_g89_8Bb57g",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-5-3",
        "code": "QA-5.3",
        "title": "HCF &amp; LCM",
        "moduleTitle": "QA-5: Number System",
        "duration": "48 min",
        "coverage": "HCF, LCM, application problems",
        "videoTitle": "CAT HCF &amp; LCM",
        "videoUrl": "https://www.youtube.com/watch?v=JyN6EROdhrw&amp;utm_source=chatgpt.com",
        "youtubeId": "JyN6EROdhrw",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-5-4",
        "code": "QA-5.4",
        "title": "Divisibility Rules",
        "moduleTitle": "QA-5: Number System",
        "duration": "1 hour 12 min",
        "coverage": "Divisibility by 2,3,4,5,8,9,11 etc.",
        "videoTitle": "Rodha – Divisibility Rules 1",
        "videoUrl": "https://www.youtube.com/watch?v=p0JbJd5DpWY&amp;utm_source=chatgpt.com",
        "youtubeId": "p0JbJd5DpWY",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-5-5",
        "code": "QA-5.5",
        "title": "Advanced Divisibility",
        "moduleTitle": "QA-5: Number System",
        "duration": "55 min",
        "coverage": "Divisibility by 7, 11, 13, 27, 37",
        "videoTitle": "Rodha – Divisibility Rules 3",
        "videoUrl": "https://www.youtube.com/watch?v=NqgFXVIrRmY&amp;utm_source=chatgpt.com",
        "youtubeId": "NqgFXVIrRmY",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-5-6",
        "code": "QA-5.6",
        "title": "Remainders",
        "moduleTitle": "QA-5: Number System",
        "duration": "1 hour 25 min",
        "coverage": "Modular arithmetic, remainder patterns",
        "videoTitle": "Rodha – Divisibility &amp; Remainders",
        "videoUrl": "https://www.youtube.com/watch?v=NqgFXVIrRmY&amp;utm_source=chatgpt.com",
        "youtubeId": "NqgFXVIrRmY",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-5-7",
        "code": "QA-5.7",
        "title": "Unit Digit &amp; Cyclicity",
        "moduleTitle": "QA-5: Number System",
        "duration": "40 min",
        "coverage": "Last digit, power cycles",
        "videoTitle": "Rodha – Number System/Cyclicity",
        "videoUrl": "https://www.youtube.com/watch?v=_g89_8Bb57g&amp;utm_source=chatgpt.com",
        "youtubeId": "_g89_8Bb57g",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-5-8",
        "code": "QA-5.8",
        "title": "Factorials &amp; Trailing Zeros",
        "moduleTitle": "QA-5: Number System",
        "duration": "1 hour 05 min",
        "coverage": "Factorial powers, number of zeros",
        "videoTitle": "Rodha – Factorials",
        "videoUrl": "https://www.youtube.com/watch?v=_g89_8Bb57g&amp;utm_source=chatgpt.com",
        "youtubeId": "_g89_8Bb57g",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-6-1",
        "code": "QA-6.1",
        "title": "Linear Equations",
        "moduleTitle": "QA-6: Algebra",
        "duration": "50 min",
        "coverage": "One/two variables, simultaneous equations",
        "videoTitle": "CAT Linear Equations",
        "videoUrl": "https://www.youtube.com/watch?v=W6MKuAnB0h4&amp;utm_source=chatgpt.com",
        "youtubeId": "W6MKuAnB0h4",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-6-2",
        "code": "QA-6.2",
        "title": "Quadratic Equations",
        "moduleTitle": "QA-6: Algebra",
        "duration": "35 min",
        "coverage": "Roots, discriminant, sum/product of roots",
        "videoTitle": "Rodha – Quadratic Equations",
        "videoUrl": "https://www.youtube.com/watch?v=rk64bqehuto&amp;utm_source=chatgpt.com",
        "youtubeId": "rk64bqehuto",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-6-3",
        "code": "QA-6.3",
        "title": "Inequalities",
        "moduleTitle": "QA-6: Algebra",
        "duration": "48 min",
        "coverage": "Linear/quadratic inequalities, sign analysis",
        "videoTitle": "CAT Inequalities",
        "videoUrl": "https://www.youtube.com/watch?v=zIrr1lkvyBY&amp;utm_source=chatgpt.com",
        "youtubeId": "zIrr1lkvyBY",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-6-4",
        "code": "QA-6.4",
        "title": "Surds &amp; Indices",
        "moduleTitle": "QA-6: Algebra",
        "duration": "1 hour 12 min",
        "coverage": "Exponent laws, radicals, rationalisation",
        "videoTitle": "CAT Surds &amp; Indices",
        "videoUrl": "https://www.youtube.com/watch?v=zgxx5FpvCus&amp;utm_source=chatgpt.com",
        "youtubeId": "zgxx5FpvCus",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-6-5",
        "code": "QA-6.5",
        "title": "Logarithms",
        "moduleTitle": "QA-6: Algebra",
        "duration": "55 min",
        "coverage": "Laws of logarithm, equations, comparison",
        "videoTitle": "CAT Logarithms",
        "videoUrl": "https://www.youtube.com/watch?v=rrKGA55b_7c&amp;utm_source=chatgpt.com",
        "youtubeId": "rrKGA55b_7c",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-6-6",
        "code": "QA-6.6",
        "title": "Functions",
        "moduleTitle": "QA-6: Algebra",
        "duration": "1 hour 25 min",
        "coverage": "Domain, range, function notation and mappings",
        "videoTitle": "Rodha – Functions 1",
        "videoUrl": "https://www.youtube.com/results?search_query=Functions+-+1+Rodha+CAT&amp;utm_source=chatgpt.com",
        "youtubeId": "VT9-jeEmlJ8",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-6-7",
        "code": "QA-6.7",
        "title": "AP",
        "moduleTitle": "QA-6: Algebra",
        "duration": "40 min",
        "coverage": "nth term, sum, arithmetic mean",
        "videoTitle": "CAT Sequences &amp; Series",
        "videoUrl": "https://www.youtube.com/watch?v=efy0XXnmIpE&amp;utm_source=chatgpt.com",
        "youtubeId": "efy0XXnmIpE",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-6-8",
        "code": "QA-6.8",
        "title": "GP",
        "moduleTitle": "QA-6: Algebra",
        "duration": "1 hour 05 min",
        "coverage": "Common ratio, nth term, sum, infinite GP",
        "videoTitle": "CAT Sequences &amp; Series",
        "videoUrl": "https://www.youtube.com/watch?v=efy0XXnmIpE&amp;utm_source=chatgpt.com",
        "youtubeId": "efy0XXnmIpE",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-6-9",
        "code": "QA-6.9",
        "title": "Set Theory",
        "moduleTitle": "QA-6: Algebra",
        "duration": "50 min",
        "coverage": "Union, intersection, complement",
        "videoTitle": "CAT Set Theory &amp; Functions",
        "videoUrl": "https://www.youtube.com/watch?v=hupkYQh2ADE&amp;utm_source=chatgpt.com",
        "youtubeId": "hupkYQh2ADE",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-7-1",
        "code": "QA-7.1",
        "title": "Lines &amp; Angles",
        "moduleTitle": "QA-7: Geometry &amp; Mensuration",
        "duration": "35 min",
        "coverage": "Parallel lines, transversals, angle properties",
        "videoTitle": "Rodha – Geometry/Triangles",
        "videoUrl": "https://www.youtube.com/watch?v=rUI1bbCvk7E&amp;utm_source=chatgpt.com",
        "youtubeId": "rUI1bbCvk7E",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-7-2",
        "code": "QA-7.2",
        "title": "Triangles",
        "moduleTitle": "QA-7: Geometry &amp; Mensuration",
        "duration": "48 min",
        "coverage": "Similarity, congruence, area, median, altitude",
        "videoTitle": "Rodha – Triangles 1",
        "videoUrl": "https://www.youtube.com/watch?v=rUI1bbCvk7E&amp;utm_source=chatgpt.com",
        "youtubeId": "rUI1bbCvk7E",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-7-3",
        "code": "QA-7.3",
        "title": "Advanced Triangles",
        "moduleTitle": "QA-7: Geometry &amp; Mensuration",
        "duration": "1 hour 12 min",
        "coverage": "Angle bisectors, special triangles, centres",
        "videoTitle": "Rodha – Triangles 2",
        "videoUrl": "https://www.youtube.com/watch?v=25P2O9r3AfM&amp;utm_source=chatgpt.com",
        "youtubeId": "25P2O9r3AfM",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-7-4",
        "code": "QA-7.4",
        "title": "Quadrilaterals",
        "moduleTitle": "QA-7: Geometry &amp; Mensuration",
        "duration": "55 min",
        "coverage": "Square, rectangle, parallelogram, rhombus, trapezium",
        "videoTitle": "Rodha – Quadrilaterals 1",
        "videoUrl": "https://www.youtube.com/watch?v=TZadcVDti64&amp;utm_source=chatgpt.com",
        "youtubeId": "TZadcVDti64",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-7-5",
        "code": "QA-7.5",
        "title": "Circles",
        "moduleTitle": "QA-7: Geometry &amp; Mensuration",
        "duration": "1 hour 25 min",
        "coverage": "Chord, tangent, secant, cyclic quadrilateral",
        "videoTitle": "Rodha – Circles 1",
        "videoUrl": "https://www.youtube.com/watch?v=EAz4sd6svzo&amp;utm_source=chatgpt.com",
        "youtubeId": "EAz4sd6svzo",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-7-6",
        "code": "QA-7.6",
        "title": "Coordinate Geometry",
        "moduleTitle": "QA-7: Geometry &amp; Mensuration",
        "duration": "40 min",
        "coverage": "Distance, slope, section formula, straight line",
        "videoTitle": "Coordinate Geometry – Ronak Shah",
        "videoUrl": "https://www.youtube.com/watch?v=sUnNDlttOZ0",
        "youtubeId": "sUnNDlttOZ0",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-7-7",
        "code": "QA-7.7",
        "title": "2-D Mensuration",
        "moduleTitle": "QA-7: Geometry &amp; Mensuration",
        "duration": "1 hour 05 min",
        "coverage": "Areas and perimeters",
        "videoTitle": "CAT Mensuration",
        "videoUrl": "https://www.youtube.com/watch?v=64Z4dT1qFmA&amp;utm_source=chatgpt.com",
        "youtubeId": "64Z4dT1qFmA",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-7-8",
        "code": "QA-7.8",
        "title": "3-D Mensuration",
        "moduleTitle": "QA-7: Geometry &amp; Mensuration",
        "duration": "50 min",
        "coverage": "Cube, cuboid, cylinder, cone, sphere",
        "videoTitle": "Rodha – Mensuration 1",
        "videoUrl": "https://www.youtube.com/watch?v=HhtLt2JZKu4&amp;utm_source=chatgpt.com",
        "youtubeId": "HhtLt2JZKu4",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-7-9",
        "code": "QA-7.9",
        "title": "Trigonometry",
        "moduleTitle": "QA-7: Geometry &amp; Mensuration",
        "duration": "35 min",
        "coverage": "Ratios, standard values, heights and distances",
        "videoTitle": "CAT Trigonometry",
        "videoUrl": "https://www.youtube.com/watch?v=unXrQgL_JLo&amp;utm_source=chatgpt.com",
        "youtubeId": "unXrQgL_JLo",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-8-1",
        "code": "QA-8.1",
        "title": "Permutation",
        "moduleTitle": "QA-8: Modern Mathematics",
        "duration": "48 min",
        "coverage": "Linear/circular arrangements, repeated objects",
        "videoTitle": "CAT Permutation &amp; Combination",
        "videoUrl": "https://www.youtube.com/watch?v=yvEYrZeBG_M&amp;utm_source=chatgpt.com",
        "youtubeId": "yvEYrZeBG_M",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-8-2",
        "code": "QA-8.2",
        "title": "Combination",
        "moduleTitle": "QA-8: Modern Mathematics",
        "duration": "1 hour 12 min",
        "coverage": "Selection, grouping, committees",
        "videoTitle": "CAT Permutation &amp; Combination",
        "videoUrl": "https://www.youtube.com/watch?v=yvEYrZeBG_M&amp;utm_source=chatgpt.com",
        "youtubeId": "yvEYrZeBG_M",
        "completed": false,
        "active": false
      },
      {
        "id": "qa-8-3",
        "code": "QA-8.3",
        "title": "Probability",
        "moduleTitle": "QA-8: Modern Mathematics",
        "duration": "55 min",
        "coverage": "Events, complementary probability, conditional reasoning",
        "videoTitle": "Rodha – Probability 1",
        "videoUrl": "https://www.youtube.com/watch?v=b6hmLsjbA7E",
        "youtubeId": "b6hmLsjbA7E",
        "completed": false,
        "active": false
      }
    ]
  },
  {
    "id": "dilr-data-interpretation",
    "codePrefix": "DILR",
    "title": "Topic B: Data Interpretation & Logical Reasoning (DILR)",
    "shortTitle": "Data Interpretation & Logical Reasoning (DILR)",
    "category": "Data Interpretation",
    "description": "Complete DILR mastery curriculum covering tables, bar/pie charts, binary logic, arrangements, matrices, games & tournaments, and networks for CAT.",
    "fullAbout": "Complete DILR mastery curriculum covering tables, bar/pie charts, binary logic, arrangements, matrices, games & tournaments, and networks for CAT.",
    "suitsFor": [
      "Aspirants targeting 100% accuracy in CAT DILR set selection.",
      "Students finding unstructured puzzle sets difficult to model mathematically.",
      "Anyone aiming for 99+ percentile in CAT, XAT, and IIFT."
    ],
    "bannerGradient": "linear-gradient(135deg, #059669 0%, #10B981 100%)",
    "bannerImage": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=85",
    "instructor": {
      "name": "Rodha & TechnoCAT DILR Faculty",
      "role": "DILR Strategy Specialists • TechnoCAT",
      "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80"
    },
    "progressPercent": 10,
    "milestones": [
      {
        "points": 25,
        "label": "25 Points",
        "reached": false
      },
      {
        "points": 50,
        "label": "50 Points",
        "reached": false
      },
      {
        "points": 75,
        "label": "75 Points",
        "reached": false
      },
      {
        "points": 100,
        "label": "100 Points",
        "reached": false
      }
    ],
    "motivationalMessage": "Great momentum! 🚀 You are making rapid progress through Data Interpretation & Logical Reasoning (DILR). Consistency in watching lectures and solving PYQs will ensure 99+ percentile!",
    "totalLessons": 20,
    "completedLessonsCount": 2,
    "modules": [
      {
        "title": "DILR-1: Data Interpretation",
        "lessons": [
          {
            "id": "dilr-1-1",
            "code": "DILR-1.1",
            "title": "Tables",
            "moduleTitle": "DILR-1: Data Interpretation",
            "duration": "1 hour 12 min",
            "coverage": "Tabular information, missing values, comparison",
            "videoTitle": "CAT Tables DI",
            "videoUrl": "https://www.youtube.com/watch?v=72Eycf7cPeo&amp;utm_source=chatgpt.com",
            "youtubeId": "72Eycf7cPeo",
            "completed": true,
            "active": false
          },
          {
            "id": "dilr-1-2",
            "code": "DILR-1.2",
            "title": "Bar Graphs",
            "moduleTitle": "DILR-1: Data Interpretation",
            "duration": "55 min",
            "coverage": "Simple, grouped and stacked bar charts",
            "videoTitle": "CAT Bar Graphs",
            "videoUrl": "https://www.youtube.com/watch?v=zQbrZAFy76E&amp;utm_source=chatgpt.com",
            "youtubeId": "zQbrZAFy76E",
            "completed": true,
            "active": false
          },
          {
            "id": "dilr-1-3",
            "code": "DILR-1.3",
            "title": "Line Graphs",
            "moduleTitle": "DILR-1: Data Interpretation",
            "duration": "1 hour 25 min",
            "coverage": "Trends, comparison, multi-line graphs",
            "videoTitle": "CAT Line Graphs",
            "videoUrl": "https://www.youtube.com/watch?v=KGJzU8jQqsE&amp;utm_source=chatgpt.com",
            "youtubeId": "KGJzU8jQqsE",
            "completed": false,
            "active": true
          },
          {
            "id": "dilr-1-4",
            "code": "DILR-1.4",
            "title": "Pie Charts",
            "moduleTitle": "DILR-1: Data Interpretation",
            "duration": "40 min",
            "coverage": "Angle/share/percentage interpretation",
            "videoTitle": "CAT Pie Charts",
            "videoUrl": "https://www.youtube.com/watch?v=XuLIwYIXSIQ&amp;utm_source=chatgpt.com",
            "youtubeId": "XuLIwYIXSIQ",
            "completed": false,
            "active": false
          },
          {
            "id": "dilr-1-5",
            "code": "DILR-1.5",
            "title": "Caselets",
            "moduleTitle": "DILR-1: Data Interpretation",
            "duration": "1 hour 05 min",
            "coverage": "Data embedded in paragraph form",
            "videoTitle": "CAT DI Caselets",
            "videoUrl": "https://www.youtube.com/watch?v=VpyHoyfMDi0&amp;utm_source=chatgpt.com",
            "youtubeId": "VpyHoyfMDi0",
            "completed": false,
            "active": false
          },
          {
            "id": "dilr-1-6",
            "code": "DILR-1.6",
            "title": "Quant-based DI",
            "moduleTitle": "DILR-1: Data Interpretation",
            "duration": "50 min",
            "coverage": "Ratio, percentage, average and equation-based data",
            "videoTitle": "Rodha – Quant Based Puzzle Set 1",
            "videoUrl": "https://www.youtube.com/watch?v=sQofq1SfL1M&amp;utm_source=chatgpt.com",
            "youtubeId": "sQofq1SfL1M",
            "completed": false,
            "active": false
          }
        ]
      },
      {
        "title": "DILR-2: Arrangements &amp; Allocation",
        "lessons": [
          {
            "id": "dilr-2-1",
            "code": "DILR-2.1",
            "title": "Linear Arrangement",
            "moduleTitle": "DILR-2: Arrangements &amp; Allocation",
            "duration": "35 min",
            "coverage": "Positioning, ordering, left/right relations",
            "videoTitle": "CAT Seating Arrangement",
            "videoUrl": "https://www.youtube.com/watch?v=4tI-h-GKWVk&amp;utm_source=chatgpt.com",
            "youtubeId": "4tI-h-GKWVk",
            "completed": false,
            "active": false
          },
          {
            "id": "dilr-2-2",
            "code": "DILR-2.2",
            "title": "Circular Arrangement",
            "moduleTitle": "DILR-2: Arrangements &amp; Allocation",
            "duration": "48 min",
            "coverage": "Facing centre/outward, relative positions",
            "videoTitle": "CAT Linear &amp; Circular Arrangement",
            "videoUrl": "https://www.youtube.com/watch?v=4tI-h-GKWVk&amp;utm_source=chatgpt.com",
            "youtubeId": "4tI-h-GKWVk",
            "completed": false,
            "active": false
          },
          {
            "id": "dilr-2-3",
            "code": "DILR-2.3",
            "title": "Matrix/Two-dimensional Arrangement",
            "moduleTitle": "DILR-2: Arrangements &amp; Allocation",
            "duration": "1 hour 12 min",
            "coverage": "Person × attribute mapping",
            "videoTitle": "CAT Logical Matching Puzzles",
            "videoUrl": "https://www.youtube.com/watch?v=XpLBL2uILuw",
            "youtubeId": "XpLBL2uILuw",
            "completed": false,
            "active": false
          },
          {
            "id": "dilr-2-4",
            "code": "DILR-2.4",
            "title": "Scheduling",
            "moduleTitle": "DILR-2: Arrangements &amp; Allocation",
            "duration": "55 min",
            "coverage": "Days, slots, activities, conditional scheduling",
            "videoTitle": "Logical Matching Puzzles",
            "videoUrl": "https://www.youtube.com/watch?v=XpLBL2uILuw&amp;utm_source=chatgpt.com",
            "youtubeId": "XpLBL2uILuw",
            "completed": false,
            "active": false
          },
          {
            "id": "dilr-2-5",
            "code": "DILR-2.5",
            "title": "Selection &amp; Distribution",
            "moduleTitle": "DILR-2: Arrangements &amp; Allocation",
            "duration": "1 hour 25 min",
            "coverage": "Teams, groups, assignment and distribution",
            "videoTitle": "CAT Selection/Distribution Logic",
            "videoUrl": "https://www.youtube.com/watch?v=XpLBL2uILuw&amp;utm_source=chatgpt.com",
            "youtubeId": "XpLBL2uILuw",
            "completed": false,
            "active": false
          }
        ]
      },
      {
        "title": "DILR-3: Logical Set Types",
        "lessons": [
          {
            "id": "dilr-3-1",
            "code": "DILR-3.1",
            "title": "Binary Logic",
            "moduleTitle": "DILR-3: Logical Set Types",
            "duration": "40 min",
            "coverage": "CAT Binary Logic",
            "videoTitle": "DILR-3.2",
            "videoUrl": "",
            "youtubeId": "VT9-jeEmlJ8",
            "completed": false,
            "active": false
          },
          {
            "id": "dilr-3-2",
            "code": "DILR-3.2",
            "title": "Logical Connectives",
            "moduleTitle": "DILR-3: Logical Set Types",
            "duration": "1 hour 05 min",
            "coverage": "CAT Logical Connectives",
            "videoTitle": "DILR-3.3",
            "videoUrl": "",
            "youtubeId": "VT9-jeEmlJ8",
            "completed": false,
            "active": false
          },
          {
            "id": "dilr-3-3",
            "code": "DILR-3.3",
            "title": "Venn Diagram",
            "moduleTitle": "DILR-3: Logical Set Types",
            "duration": "50 min",
            "coverage": "CAT Venn Diagrams",
            "videoTitle": "DILR-3.4",
            "videoUrl": "",
            "youtubeId": "VT9-jeEmlJ8",
            "completed": false,
            "active": false
          },
          {
            "id": "dilr-3-4",
            "code": "DILR-3.4",
            "title": "Syllogism",
            "moduleTitle": "DILR-3: Logical Set Types",
            "duration": "35 min",
            "coverage": "CAT Syllogism",
            "videoTitle": "DILR-3.5",
            "videoUrl": "",
            "youtubeId": "VT9-jeEmlJ8",
            "completed": false,
            "active": false
          },
          {
            "id": "dilr-3-5",
            "code": "DILR-3.5",
            "title": "Calendar/Clock Reasoning",
            "moduleTitle": "DILR-3: Logical Set Types",
            "duration": "48 min",
            "coverage": "CAT Calendars &amp; Clocks",
            "videoTitle": "DILR-3.6",
            "videoUrl": "",
            "youtubeId": "VT9-jeEmlJ8",
            "completed": false,
            "active": false
          },
          {
            "id": "dilr-3-6",
            "code": "DILR-3.6",
            "title": "Games &amp; Tournaments",
            "moduleTitle": "DILR-3: Logical Set Types",
            "duration": "1 hour 12 min",
            "coverage": "Rodha – Games &amp; Tournaments 1",
            "videoTitle": "DILR-3.7",
            "videoUrl": "",
            "youtubeId": "VT9-jeEmlJ8",
            "completed": false,
            "active": false
          },
          {
            "id": "dilr-3-7",
            "code": "DILR-3.7",
            "title": "Routes &amp; Networks",
            "moduleTitle": "DILR-3: Logical Set Types",
            "duration": "55 min",
            "coverage": "Rodha – Routes &amp; Networks",
            "videoTitle": "DILR-3.8",
            "videoUrl": "",
            "youtubeId": "VT9-jeEmlJ8",
            "completed": false,
            "active": false
          },
          {
            "id": "dilr-3-8",
            "code": "DILR-3.8",
            "title": "Quant-based Puzzles",
            "moduleTitle": "DILR-3: Logical Set Types",
            "duration": "1 hour 25 min",
            "coverage": "Rodha – Quant Based Puzzle 1",
            "videoTitle": "DILR-3.9",
            "videoUrl": "",
            "youtubeId": "VT9-jeEmlJ8",
            "completed": false,
            "active": false
          },
          {
            "id": "dilr-3-9",
            "code": "DILR-3.9",
            "title": "Maximisation–Minimisation",
            "moduleTitle": "DILR-3: Logical Set Types",
            "duration": "40 min",
            "coverage": "Chocolate distribution, maximum/minimum possible values",
            "videoTitle": "Again, DILR-3.9 needs an exact direct watch URL before final implementation; I would exclude it from the database until verified.",
            "videoUrl": "",
            "youtubeId": "VT9-jeEmlJ8",
            "completed": false,
            "active": false
          }
        ]
      }
    ],
    "lessons": [
      {
        "id": "dilr-1-1",
        "code": "DILR-1.1",
        "title": "Tables",
        "moduleTitle": "DILR-1: Data Interpretation",
        "duration": "1 hour 12 min",
        "coverage": "Tabular information, missing values, comparison",
        "videoTitle": "CAT Tables DI",
        "videoUrl": "https://www.youtube.com/watch?v=72Eycf7cPeo&amp;utm_source=chatgpt.com",
        "youtubeId": "72Eycf7cPeo",
        "completed": true,
        "active": false
      },
      {
        "id": "dilr-1-2",
        "code": "DILR-1.2",
        "title": "Bar Graphs",
        "moduleTitle": "DILR-1: Data Interpretation",
        "duration": "55 min",
        "coverage": "Simple, grouped and stacked bar charts",
        "videoTitle": "CAT Bar Graphs",
        "videoUrl": "https://www.youtube.com/watch?v=zQbrZAFy76E&amp;utm_source=chatgpt.com",
        "youtubeId": "zQbrZAFy76E",
        "completed": true,
        "active": false
      },
      {
        "id": "dilr-1-3",
        "code": "DILR-1.3",
        "title": "Line Graphs",
        "moduleTitle": "DILR-1: Data Interpretation",
        "duration": "1 hour 25 min",
        "coverage": "Trends, comparison, multi-line graphs",
        "videoTitle": "CAT Line Graphs",
        "videoUrl": "https://www.youtube.com/watch?v=KGJzU8jQqsE&amp;utm_source=chatgpt.com",
        "youtubeId": "KGJzU8jQqsE",
        "completed": false,
        "active": true
      },
      {
        "id": "dilr-1-4",
        "code": "DILR-1.4",
        "title": "Pie Charts",
        "moduleTitle": "DILR-1: Data Interpretation",
        "duration": "40 min",
        "coverage": "Angle/share/percentage interpretation",
        "videoTitle": "CAT Pie Charts",
        "videoUrl": "https://www.youtube.com/watch?v=XuLIwYIXSIQ&amp;utm_source=chatgpt.com",
        "youtubeId": "XuLIwYIXSIQ",
        "completed": false,
        "active": false
      },
      {
        "id": "dilr-1-5",
        "code": "DILR-1.5",
        "title": "Caselets",
        "moduleTitle": "DILR-1: Data Interpretation",
        "duration": "1 hour 05 min",
        "coverage": "Data embedded in paragraph form",
        "videoTitle": "CAT DI Caselets",
        "videoUrl": "https://www.youtube.com/watch?v=VpyHoyfMDi0&amp;utm_source=chatgpt.com",
        "youtubeId": "VpyHoyfMDi0",
        "completed": false,
        "active": false
      },
      {
        "id": "dilr-1-6",
        "code": "DILR-1.6",
        "title": "Quant-based DI",
        "moduleTitle": "DILR-1: Data Interpretation",
        "duration": "50 min",
        "coverage": "Ratio, percentage, average and equation-based data",
        "videoTitle": "Rodha – Quant Based Puzzle Set 1",
        "videoUrl": "https://www.youtube.com/watch?v=sQofq1SfL1M&amp;utm_source=chatgpt.com",
        "youtubeId": "sQofq1SfL1M",
        "completed": false,
        "active": false
      },
      {
        "id": "dilr-2-1",
        "code": "DILR-2.1",
        "title": "Linear Arrangement",
        "moduleTitle": "DILR-2: Arrangements &amp; Allocation",
        "duration": "35 min",
        "coverage": "Positioning, ordering, left/right relations",
        "videoTitle": "CAT Seating Arrangement",
        "videoUrl": "https://www.youtube.com/watch?v=4tI-h-GKWVk&amp;utm_source=chatgpt.com",
        "youtubeId": "4tI-h-GKWVk",
        "completed": false,
        "active": false
      },
      {
        "id": "dilr-2-2",
        "code": "DILR-2.2",
        "title": "Circular Arrangement",
        "moduleTitle": "DILR-2: Arrangements &amp; Allocation",
        "duration": "48 min",
        "coverage": "Facing centre/outward, relative positions",
        "videoTitle": "CAT Linear &amp; Circular Arrangement",
        "videoUrl": "https://www.youtube.com/watch?v=4tI-h-GKWVk&amp;utm_source=chatgpt.com",
        "youtubeId": "4tI-h-GKWVk",
        "completed": false,
        "active": false
      },
      {
        "id": "dilr-2-3",
        "code": "DILR-2.3",
        "title": "Matrix/Two-dimensional Arrangement",
        "moduleTitle": "DILR-2: Arrangements &amp; Allocation",
        "duration": "1 hour 12 min",
        "coverage": "Person × attribute mapping",
        "videoTitle": "CAT Logical Matching Puzzles",
        "videoUrl": "https://www.youtube.com/watch?v=XpLBL2uILuw",
        "youtubeId": "XpLBL2uILuw",
        "completed": false,
        "active": false
      },
      {
        "id": "dilr-2-4",
        "code": "DILR-2.4",
        "title": "Scheduling",
        "moduleTitle": "DILR-2: Arrangements &amp; Allocation",
        "duration": "55 min",
        "coverage": "Days, slots, activities, conditional scheduling",
        "videoTitle": "Logical Matching Puzzles",
        "videoUrl": "https://www.youtube.com/watch?v=XpLBL2uILuw&amp;utm_source=chatgpt.com",
        "youtubeId": "XpLBL2uILuw",
        "completed": false,
        "active": false
      },
      {
        "id": "dilr-2-5",
        "code": "DILR-2.5",
        "title": "Selection &amp; Distribution",
        "moduleTitle": "DILR-2: Arrangements &amp; Allocation",
        "duration": "1 hour 25 min",
        "coverage": "Teams, groups, assignment and distribution",
        "videoTitle": "CAT Selection/Distribution Logic",
        "videoUrl": "https://www.youtube.com/watch?v=XpLBL2uILuw&amp;utm_source=chatgpt.com",
        "youtubeId": "XpLBL2uILuw",
        "completed": false,
        "active": false
      },
      {
        "id": "dilr-3-1",
        "code": "DILR-3.1",
        "title": "Binary Logic",
        "moduleTitle": "DILR-3: Logical Set Types",
        "duration": "40 min",
        "coverage": "CAT Binary Logic",
        "videoTitle": "DILR-3.2",
        "videoUrl": "",
        "youtubeId": "VT9-jeEmlJ8",
        "completed": false,
        "active": false
      },
      {
        "id": "dilr-3-2",
        "code": "DILR-3.2",
        "title": "Logical Connectives",
        "moduleTitle": "DILR-3: Logical Set Types",
        "duration": "1 hour 05 min",
        "coverage": "CAT Logical Connectives",
        "videoTitle": "DILR-3.3",
        "videoUrl": "",
        "youtubeId": "VT9-jeEmlJ8",
        "completed": false,
        "active": false
      },
      {
        "id": "dilr-3-3",
        "code": "DILR-3.3",
        "title": "Venn Diagram",
        "moduleTitle": "DILR-3: Logical Set Types",
        "duration": "50 min",
        "coverage": "CAT Venn Diagrams",
        "videoTitle": "DILR-3.4",
        "videoUrl": "",
        "youtubeId": "VT9-jeEmlJ8",
        "completed": false,
        "active": false
      },
      {
        "id": "dilr-3-4",
        "code": "DILR-3.4",
        "title": "Syllogism",
        "moduleTitle": "DILR-3: Logical Set Types",
        "duration": "35 min",
        "coverage": "CAT Syllogism",
        "videoTitle": "DILR-3.5",
        "videoUrl": "",
        "youtubeId": "VT9-jeEmlJ8",
        "completed": false,
        "active": false
      },
      {
        "id": "dilr-3-5",
        "code": "DILR-3.5",
        "title": "Calendar/Clock Reasoning",
        "moduleTitle": "DILR-3: Logical Set Types",
        "duration": "48 min",
        "coverage": "CAT Calendars &amp; Clocks",
        "videoTitle": "DILR-3.6",
        "videoUrl": "",
        "youtubeId": "VT9-jeEmlJ8",
        "completed": false,
        "active": false
      },
      {
        "id": "dilr-3-6",
        "code": "DILR-3.6",
        "title": "Games &amp; Tournaments",
        "moduleTitle": "DILR-3: Logical Set Types",
        "duration": "1 hour 12 min",
        "coverage": "Rodha – Games &amp; Tournaments 1",
        "videoTitle": "DILR-3.7",
        "videoUrl": "",
        "youtubeId": "VT9-jeEmlJ8",
        "completed": false,
        "active": false
      },
      {
        "id": "dilr-3-7",
        "code": "DILR-3.7",
        "title": "Routes &amp; Networks",
        "moduleTitle": "DILR-3: Logical Set Types",
        "duration": "55 min",
        "coverage": "Rodha – Routes &amp; Networks",
        "videoTitle": "DILR-3.8",
        "videoUrl": "",
        "youtubeId": "VT9-jeEmlJ8",
        "completed": false,
        "active": false
      },
      {
        "id": "dilr-3-8",
        "code": "DILR-3.8",
        "title": "Quant-based Puzzles",
        "moduleTitle": "DILR-3: Logical Set Types",
        "duration": "1 hour 25 min",
        "coverage": "Rodha – Quant Based Puzzle 1",
        "videoTitle": "DILR-3.9",
        "videoUrl": "",
        "youtubeId": "VT9-jeEmlJ8",
        "completed": false,
        "active": false
      },
      {
        "id": "dilr-3-9",
        "code": "DILR-3.9",
        "title": "Maximisation–Minimisation",
        "moduleTitle": "DILR-3: Logical Set Types",
        "duration": "40 min",
        "coverage": "Chocolate distribution, maximum/minimum possible values",
        "videoTitle": "Again, DILR-3.9 needs an exact direct watch URL before final implementation; I would exclude it from the database until verified.",
        "videoUrl": "",
        "youtubeId": "VT9-jeEmlJ8",
        "completed": false,
        "active": false
      }
    ]
  },
  {
    "id": "varc-verbal-ability",
    "codePrefix": "VARC",
    "title": "Topic C: Verbal Ability & Reading Comprehension (VARC)",
    "shortTitle": "Verbal Ability & Reading Comprehension (VARC)",
    "category": "Verbal Ability",
    "description": "Master CAT VARC with Gejo Sreenivasan's proven methodology: effective reading, question type decoding, option elimination, and verbal logic.",
    "fullAbout": "Master CAT VARC with Gejo Sreenivasan's proven methodology: effective reading, question type decoding, option elimination, and verbal logic.",
    "suitsFor": [
      "Students looking to eliminate close-option confusion in Reading Comprehension.",
      "Aspirants targeting 99 percentile through passage reasoning rather than vocabulary drills.",
      "CAT, XAT, and SNAP test takers."
    ],
    "bannerGradient": "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
    "bannerImage": "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1200&auto=format&fit=crop&q=85",
    "instructor": {
      "name": "Gejo Sreenivasan & Career Launcher",
      "role": "Chief VARC Mentor • TechnoCAT Partner",
      "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80"
    },
    "progressPercent": 11,
    "milestones": [
      {
        "points": 25,
        "label": "25 Points",
        "reached": false
      },
      {
        "points": 50,
        "label": "50 Points",
        "reached": false
      },
      {
        "points": 75,
        "label": "75 Points",
        "reached": false
      },
      {
        "points": 100,
        "label": "100 Points",
        "reached": false
      }
    ],
    "motivationalMessage": "Great momentum! 🚀 You are making rapid progress through Verbal Ability & Reading Comprehension (VARC). Consistency in watching lectures and solving PYQs will ensure 99+ percentile!",
    "totalLessons": 18,
    "completedLessonsCount": 2,
    "modules": [
      {
        "title": "VARC-1: Reading Skills",
        "lessons": [
          {
            "id": "varc-1-1",
            "code": "VARC-1.1",
            "title": "Effective Reading",
            "moduleTitle": "VARC-1: Reading Skills",
            "duration": "55 min",
            "coverage": "Identifying paragraph idea instead of memorising every sentence",
            "videoTitle": "Gejo – How to Read a Passage Effectively",
            "videoUrl": "https://www.youtube.com/watch?v=IzzDC2qCYu0&amp;utm_source=chatgpt.com",
            "youtubeId": "IzzDC2qCYu0",
            "completed": true,
            "active": false
          },
          {
            "id": "varc-1-2",
            "code": "VARC-1.2",
            "title": "Paragraph Structure",
            "moduleTitle": "VARC-1: Reading Skills",
            "duration": "1 hour 25 min",
            "coverage": "Claim, explanation, example, contrast and conclusion",
            "videoTitle": "Gejo – Effective Reading",
            "videoUrl": "https://www.youtube.com/watch?v=IzzDC2qCYu0&amp;utm_source=chatgpt.com",
            "youtubeId": "IzzDC2qCYu0",
            "completed": true,
            "active": false
          },
          {
            "id": "varc-1-3",
            "code": "VARC-1.3",
            "title": "Dense Passages",
            "moduleTitle": "VARC-1: Reading Skills",
            "duration": "40 min",
            "coverage": "Philosophy/science/humanities passages and difficult sentences",
            "videoTitle": "Gejo – Effective Reading",
            "videoUrl": "https://www.youtube.com/watch?v=IzzDC2qCYu0&amp;utm_source=chatgpt.com",
            "youtubeId": "IzzDC2qCYu0",
            "completed": false,
            "active": true
          },
          {
            "id": "varc-1-4",
            "code": "VARC-1.4",
            "title": "Main Idea",
            "moduleTitle": "VARC-1: Reading Skills",
            "duration": "1 hour 05 min",
            "coverage": "Identifying the author's overall claim",
            "videoTitle": "Reading Comprehension Strategy",
            "videoUrl": "https://www.youtube.com/watch?v=G04dx7BtvKI&amp;utm_source=chatgpt.com",
            "youtubeId": "G04dx7BtvKI",
            "completed": false,
            "active": false
          },
          {
            "id": "varc-1-5",
            "code": "VARC-1.5",
            "title": "Author's Purpose/Viewpoint",
            "moduleTitle": "VARC-1: Reading Skills",
            "duration": "50 min",
            "coverage": "Why the passage was written and author's position",
            "videoTitle": "Reading Comprehension Strategy",
            "videoUrl": "https://www.youtube.com/watch?v=G04dx7BtvKI&amp;utm_source=chatgpt.com",
            "youtubeId": "G04dx7BtvKI",
            "completed": false,
            "active": false
          }
        ]
      },
      {
        "title": "VARC-2: RC Question Types",
        "lessons": [
          {
            "id": "varc-2-1",
            "code": "VARC-2.1",
            "title": "Inference Questions",
            "moduleTitle": "VARC-2: RC Question Types",
            "duration": "35 min",
            "coverage": "What logically follows from passage evidence",
            "videoTitle": "Career Launcher – CAT RC Inference Questions",
            "videoUrl": "https://www.youtube.com/watch?v=_rjuDn3G3p0&amp;utm_source=chatgpt.com",
            "youtubeId": "_rjuDn3G3p0",
            "completed": false,
            "active": false
          },
          {
            "id": "varc-2-2",
            "code": "VARC-2.2",
            "title": "Factual/Detail Questions",
            "moduleTitle": "VARC-2: RC Question Types",
            "duration": "48 min",
            "coverage": "Locating and interpreting passage information",
            "videoTitle": "CAT Reading Comprehension Strategy",
            "videoUrl": "https://www.youtube.com/watch?v=G04dx7BtvKI&amp;utm_source=chatgpt.com",
            "youtubeId": "G04dx7BtvKI",
            "completed": false,
            "active": false
          },
          {
            "id": "varc-2-3",
            "code": "VARC-2.3",
            "title": "Tone",
            "moduleTitle": "VARC-2: RC Question Types",
            "duration": "1 hour 12 min",
            "coverage": "Author attitude, sentiment and stance",
            "videoTitle": "Gejo – Effective Use of Tone",
            "videoUrl": "https://www.youtube.com/watch?v=6-dN3Qh2rsw&amp;utm_source=chatgpt.com",
            "youtubeId": "6-dN3Qh2rsw",
            "completed": false,
            "active": false
          },
          {
            "id": "varc-2-4",
            "code": "VARC-2.4",
            "title": "Strengthen/Weaken",
            "moduleTitle": "VARC-2: RC Question Types",
            "duration": "55 min",
            "coverage": "How new information affects an argument",
            "videoTitle": "CAT Verbal Reasoning",
            "videoUrl": "https://www.youtube.com/watch?v=s_VUjaggBOg&amp;utm_source=chatgpt.com",
            "youtubeId": "s_VUjaggBOg",
            "completed": false,
            "active": false
          },
          {
            "id": "varc-2-5",
            "code": "VARC-2.5",
            "title": "Assumption",
            "moduleTitle": "VARC-2: RC Question Types",
            "duration": "1 hour 25 min",
            "coverage": "Unstated premise supporting conclusion",
            "videoTitle": "CAT Verbal Reasoning",
            "videoUrl": "https://www.youtube.com/watch?v=s_VUjaggBOg&amp;utm_source=chatgpt.com",
            "youtubeId": "s_VUjaggBOg",
            "completed": false,
            "active": false
          }
        ]
      },
      {
        "title": "VARC-3: Option Elimination",
        "lessons": [
          {
            "id": "varc-3-1",
            "code": "VARC-3.1",
            "title": "Option Elimination in CAT RC",
            "moduleTitle": "VARC-3: Option Elimination",
            "duration": "40 min",
            "coverage": "Extreme options, scope shift, distortion, half-correct options, unsupported inference, true-but-irrelevant, opposite interpretation",
            "videoTitle": "Gejo – Learn to Eliminate Wrong RC Options",
            "videoUrl": "https://www.youtube.com/watch?v=inaZ4ezqMu0",
            "youtubeId": "inaZ4ezqMu0",
            "completed": false,
            "active": false
          }
        ]
      },
      {
        "title": "VARC-4: Verbal Ability",
        "lessons": [
          {
            "id": "varc-4-1",
            "code": "VARC-4.1",
            "title": "Para Summary",
            "moduleTitle": "VARC-4: Verbal Ability",
            "duration": "1 hour 05 min",
            "coverage": "Central idea, scope, option elimination",
            "videoTitle": "Gejo – Para Summary",
            "videoUrl": "https://www.youtube.com/watch?v=1nUeQaoLuXc&amp;utm_source=chatgpt.com",
            "youtubeId": "1nUeQaoLuXc",
            "completed": false,
            "active": false
          },
          {
            "id": "varc-4-2",
            "code": "VARC-4.2",
            "title": "Para Jumbles",
            "moduleTitle": "VARC-4: Verbal Ability",
            "duration": "50 min",
            "coverage": "Opening sentence, mandatory pairs, logical sequence",
            "videoTitle": "Gejo – Para Jumbles",
            "videoUrl": "https://www.youtube.com/watch?v=PgNBT_Zp_Us&amp;utm_source=chatgpt.com",
            "youtubeId": "PgNBT_Zp_Us",
            "completed": false,
            "active": false
          },
          {
            "id": "varc-4-3",
            "code": "VARC-4.3",
            "title": "Odd Sentence Out",
            "moduleTitle": "VARC-4: Verbal Ability",
            "duration": "35 min",
            "coverage": "Form coherent paragraph and identify disconnected sentence",
            "videoTitle": "CAT Odd Sentence Out",
            "videoUrl": "https://www.youtube.com/watch?v=In0aLW6hKiU&amp;utm_source=chatgpt.com",
            "youtubeId": "In0aLW6hKiU",
            "completed": false,
            "active": false
          },
          {
            "id": "varc-4-4",
            "code": "VARC-4.4",
            "title": "Sentence Placement",
            "moduleTitle": "VARC-4: Verbal Ability",
            "duration": "48 min",
            "coverage": "Find correct location of missing sentence",
            "videoTitle": "Career Launcher – CAT 2026 Sentence Placement 01",
            "videoUrl": "https://www.youtube.com/watch?v=l5E-OpdK5q8&amp;utm_source=chatgpt.com",
            "youtubeId": "l5E-OpdK5q8",
            "completed": false,
            "active": false
          },
          {
            "id": "varc-4-5",
            "code": "VARC-4.5",
            "title": "Critical Reasoning",
            "moduleTitle": "VARC-4: Verbal Ability",
            "duration": "1 hour 12 min",
            "coverage": "Premise, conclusion, inference, assumption",
            "videoTitle": "CAT Verbal Reasoning",
            "videoUrl": "https://www.youtube.com/watch?v=s_VUjaggBOg&amp;utm_source=chatgpt.com",
            "youtubeId": "s_VUjaggBOg",
            "completed": false,
            "active": false
          },
          {
            "id": "varc-4-6",
            "code": "VARC-4.6",
            "title": "Vocabulary in Context",
            "moduleTitle": "VARC-4: Verbal Ability",
            "duration": "55 min",
            "coverage": "Contextual meaning, synonyms/antonyms",
            "videoTitle": "CAT Vocabulary",
            "videoUrl": "https://www.youtube.com/watch?v=QBqXNgJzhz8&amp;utm_source=chatgpt.com",
            "youtubeId": "QBqXNgJzhz8",
            "completed": false,
            "active": false
          },
          {
            "id": "varc-4-7",
            "code": "VARC-4.7",
            "title": "Grammar Support",
            "moduleTitle": "VARC-4: Verbal Ability",
            "duration": "1 hour 25 min",
            "coverage": "Sentence construction and grammatical comprehension",
            "videoTitle": "CAT Grammar/English Usage",
            "videoUrl": "https://www.youtube.com/watch?v=rT3CLPQYn-Q&amp;utm_source=chatgpt.com",
            "youtubeId": "rT3CLPQYn-Q",
            "completed": false,
            "active": false
          }
        ]
      }
    ],
    "lessons": [
      {
        "id": "varc-1-1",
        "code": "VARC-1.1",
        "title": "Effective Reading",
        "moduleTitle": "VARC-1: Reading Skills",
        "duration": "55 min",
        "coverage": "Identifying paragraph idea instead of memorising every sentence",
        "videoTitle": "Gejo – How to Read a Passage Effectively",
        "videoUrl": "https://www.youtube.com/watch?v=IzzDC2qCYu0&amp;utm_source=chatgpt.com",
        "youtubeId": "IzzDC2qCYu0",
        "completed": true,
        "active": false
      },
      {
        "id": "varc-1-2",
        "code": "VARC-1.2",
        "title": "Paragraph Structure",
        "moduleTitle": "VARC-1: Reading Skills",
        "duration": "1 hour 25 min",
        "coverage": "Claim, explanation, example, contrast and conclusion",
        "videoTitle": "Gejo – Effective Reading",
        "videoUrl": "https://www.youtube.com/watch?v=IzzDC2qCYu0&amp;utm_source=chatgpt.com",
        "youtubeId": "IzzDC2qCYu0",
        "completed": true,
        "active": false
      },
      {
        "id": "varc-1-3",
        "code": "VARC-1.3",
        "title": "Dense Passages",
        "moduleTitle": "VARC-1: Reading Skills",
        "duration": "40 min",
        "coverage": "Philosophy/science/humanities passages and difficult sentences",
        "videoTitle": "Gejo – Effective Reading",
        "videoUrl": "https://www.youtube.com/watch?v=IzzDC2qCYu0&amp;utm_source=chatgpt.com",
        "youtubeId": "IzzDC2qCYu0",
        "completed": false,
        "active": true
      },
      {
        "id": "varc-1-4",
        "code": "VARC-1.4",
        "title": "Main Idea",
        "moduleTitle": "VARC-1: Reading Skills",
        "duration": "1 hour 05 min",
        "coverage": "Identifying the author's overall claim",
        "videoTitle": "Reading Comprehension Strategy",
        "videoUrl": "https://www.youtube.com/watch?v=G04dx7BtvKI&amp;utm_source=chatgpt.com",
        "youtubeId": "G04dx7BtvKI",
        "completed": false,
        "active": false
      },
      {
        "id": "varc-1-5",
        "code": "VARC-1.5",
        "title": "Author's Purpose/Viewpoint",
        "moduleTitle": "VARC-1: Reading Skills",
        "duration": "50 min",
        "coverage": "Why the passage was written and author's position",
        "videoTitle": "Reading Comprehension Strategy",
        "videoUrl": "https://www.youtube.com/watch?v=G04dx7BtvKI&amp;utm_source=chatgpt.com",
        "youtubeId": "G04dx7BtvKI",
        "completed": false,
        "active": false
      },
      {
        "id": "varc-2-1",
        "code": "VARC-2.1",
        "title": "Inference Questions",
        "moduleTitle": "VARC-2: RC Question Types",
        "duration": "35 min",
        "coverage": "What logically follows from passage evidence",
        "videoTitle": "Career Launcher – CAT RC Inference Questions",
        "videoUrl": "https://www.youtube.com/watch?v=_rjuDn3G3p0&amp;utm_source=chatgpt.com",
        "youtubeId": "_rjuDn3G3p0",
        "completed": false,
        "active": false
      },
      {
        "id": "varc-2-2",
        "code": "VARC-2.2",
        "title": "Factual/Detail Questions",
        "moduleTitle": "VARC-2: RC Question Types",
        "duration": "48 min",
        "coverage": "Locating and interpreting passage information",
        "videoTitle": "CAT Reading Comprehension Strategy",
        "videoUrl": "https://www.youtube.com/watch?v=G04dx7BtvKI&amp;utm_source=chatgpt.com",
        "youtubeId": "G04dx7BtvKI",
        "completed": false,
        "active": false
      },
      {
        "id": "varc-2-3",
        "code": "VARC-2.3",
        "title": "Tone",
        "moduleTitle": "VARC-2: RC Question Types",
        "duration": "1 hour 12 min",
        "coverage": "Author attitude, sentiment and stance",
        "videoTitle": "Gejo – Effective Use of Tone",
        "videoUrl": "https://www.youtube.com/watch?v=6-dN3Qh2rsw&amp;utm_source=chatgpt.com",
        "youtubeId": "6-dN3Qh2rsw",
        "completed": false,
        "active": false
      },
      {
        "id": "varc-2-4",
        "code": "VARC-2.4",
        "title": "Strengthen/Weaken",
        "moduleTitle": "VARC-2: RC Question Types",
        "duration": "55 min",
        "coverage": "How new information affects an argument",
        "videoTitle": "CAT Verbal Reasoning",
        "videoUrl": "https://www.youtube.com/watch?v=s_VUjaggBOg&amp;utm_source=chatgpt.com",
        "youtubeId": "s_VUjaggBOg",
        "completed": false,
        "active": false
      },
      {
        "id": "varc-2-5",
        "code": "VARC-2.5",
        "title": "Assumption",
        "moduleTitle": "VARC-2: RC Question Types",
        "duration": "1 hour 25 min",
        "coverage": "Unstated premise supporting conclusion",
        "videoTitle": "CAT Verbal Reasoning",
        "videoUrl": "https://www.youtube.com/watch?v=s_VUjaggBOg&amp;utm_source=chatgpt.com",
        "youtubeId": "s_VUjaggBOg",
        "completed": false,
        "active": false
      },
      {
        "id": "varc-3-1",
        "code": "VARC-3.1",
        "title": "Option Elimination in CAT RC",
        "moduleTitle": "VARC-3: Option Elimination",
        "duration": "40 min",
        "coverage": "Extreme options, scope shift, distortion, half-correct options, unsupported inference, true-but-irrelevant, opposite interpretation",
        "videoTitle": "Gejo – Learn to Eliminate Wrong RC Options",
        "videoUrl": "https://www.youtube.com/watch?v=inaZ4ezqMu0",
        "youtubeId": "inaZ4ezqMu0",
        "completed": false,
        "active": false
      },
      {
        "id": "varc-4-1",
        "code": "VARC-4.1",
        "title": "Para Summary",
        "moduleTitle": "VARC-4: Verbal Ability",
        "duration": "1 hour 05 min",
        "coverage": "Central idea, scope, option elimination",
        "videoTitle": "Gejo – Para Summary",
        "videoUrl": "https://www.youtube.com/watch?v=1nUeQaoLuXc&amp;utm_source=chatgpt.com",
        "youtubeId": "1nUeQaoLuXc",
        "completed": false,
        "active": false
      },
      {
        "id": "varc-4-2",
        "code": "VARC-4.2",
        "title": "Para Jumbles",
        "moduleTitle": "VARC-4: Verbal Ability",
        "duration": "50 min",
        "coverage": "Opening sentence, mandatory pairs, logical sequence",
        "videoTitle": "Gejo – Para Jumbles",
        "videoUrl": "https://www.youtube.com/watch?v=PgNBT_Zp_Us&amp;utm_source=chatgpt.com",
        "youtubeId": "PgNBT_Zp_Us",
        "completed": false,
        "active": false
      },
      {
        "id": "varc-4-3",
        "code": "VARC-4.3",
        "title": "Odd Sentence Out",
        "moduleTitle": "VARC-4: Verbal Ability",
        "duration": "35 min",
        "coverage": "Form coherent paragraph and identify disconnected sentence",
        "videoTitle": "CAT Odd Sentence Out",
        "videoUrl": "https://www.youtube.com/watch?v=In0aLW6hKiU&amp;utm_source=chatgpt.com",
        "youtubeId": "In0aLW6hKiU",
        "completed": false,
        "active": false
      },
      {
        "id": "varc-4-4",
        "code": "VARC-4.4",
        "title": "Sentence Placement",
        "moduleTitle": "VARC-4: Verbal Ability",
        "duration": "48 min",
        "coverage": "Find correct location of missing sentence",
        "videoTitle": "Career Launcher – CAT 2026 Sentence Placement 01",
        "videoUrl": "https://www.youtube.com/watch?v=l5E-OpdK5q8&amp;utm_source=chatgpt.com",
        "youtubeId": "l5E-OpdK5q8",
        "completed": false,
        "active": false
      },
      {
        "id": "varc-4-5",
        "code": "VARC-4.5",
        "title": "Critical Reasoning",
        "moduleTitle": "VARC-4: Verbal Ability",
        "duration": "1 hour 12 min",
        "coverage": "Premise, conclusion, inference, assumption",
        "videoTitle": "CAT Verbal Reasoning",
        "videoUrl": "https://www.youtube.com/watch?v=s_VUjaggBOg&amp;utm_source=chatgpt.com",
        "youtubeId": "s_VUjaggBOg",
        "completed": false,
        "active": false
      },
      {
        "id": "varc-4-6",
        "code": "VARC-4.6",
        "title": "Vocabulary in Context",
        "moduleTitle": "VARC-4: Verbal Ability",
        "duration": "55 min",
        "coverage": "Contextual meaning, synonyms/antonyms",
        "videoTitle": "CAT Vocabulary",
        "videoUrl": "https://www.youtube.com/watch?v=QBqXNgJzhz8&amp;utm_source=chatgpt.com",
        "youtubeId": "QBqXNgJzhz8",
        "completed": false,
        "active": false
      },
      {
        "id": "varc-4-7",
        "code": "VARC-4.7",
        "title": "Grammar Support",
        "moduleTitle": "VARC-4: Verbal Ability",
        "duration": "1 hour 25 min",
        "coverage": "Sentence construction and grammatical comprehension",
        "videoTitle": "CAT Grammar/English Usage",
        "videoUrl": "https://www.youtube.com/watch?v=rT3CLPQYn-Q&amp;utm_source=chatgpt.com",
        "youtubeId": "rT3CLPQYn-Q",
        "completed": false,
        "active": false
      }
    ]
  },
  {
    "id": "mastering-illustration",
    "codePrefix": "DES",
    "title": "Topic D: Mastering Illustration & Design",
    "shortTitle": "Mastering Illustration",
    "category": "Design & Illustration",
    "description": "Beginner-level vector design and digital illustration masterclass covering tools, shapes, pen mastery, and professional workflows.",
    "fullAbout": "Unlock your creative potential with our Beginner-Level Illustrator Course! Are you ready to embark on a journey into the world of digital art and design? Our Mastering Illustrator course is perfect for beginners looking to learn the ropes of Adobe Illustrator, the industry-standard vector graphics software.",
    "suitsFor": [
      "Anyone who wants to start their career & get paid for their illustration design skills.",
      "This course is for beginners, newbies & amateurs in the field of illustration.",
      "For anyone that needs to add 'Illustration' to their portfolio.",
      "Aimed at people new to the world of digital art and illustration design."
    ],
    "bannerGradient": "linear-gradient(135deg, #FF9A8B 0%, #FF6A88 55%, #FF99AC 100%)",
    "bannerImage": "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=85",
    "instructor": {
      "name": "Simon Simorangkir",
      "role": "Mentor • Illustrator at Google",
      "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
    },
    "progressPercent": 4,
    "milestones": [
      {
        "points": 25,
        "label": "25 Points",
        "reached": true
      },
      {
        "points": 50,
        "label": "50 Points",
        "reached": false
      },
      {
        "points": 75,
        "label": "75 Points",
        "reached": false
      },
      {
        "points": 100,
        "label": "100 Points",
        "reached": false
      }
    ],
    "motivationalMessage": "Great Job! 🎉 You're on the path to becoming certified in Mastering Illustration. Your dedication to learning is impressive. Finish strong!",
    "totalLessons": 7,
    "completedLessonsCount": 1,
    "modules": [
      {
        "title": "Module 1: Vector Graphics Essentials",
        "lessons": [
          {
            "id": "1",
            "code": "DES-1.1",
            "title": "Introduction to Digital Vector Design",
            "moduleTitle": "Module 1",
            "duration": "20 min",
            "completed": true,
            "active": false,
            "youtubeId": "bC3Wlg6DIRg"
          },
          {
            "id": "2",
            "code": "DES-1.2",
            "title": "Mastering Tools & Panels",
            "moduleTitle": "Module 1",
            "duration": "1 hour 20 min",
            "completed": false,
            "active": true,
            "youtubeId": "VT9-jeEmlJ8"
          },
          {
            "id": "3",
            "code": "DES-1.3",
            "title": "Mastering Vector Shapes & Curves",
            "moduleTitle": "Module 1",
            "duration": "2 hour 10 min",
            "completed": false,
            "active": false,
            "youtubeId": "inaZ4ezqMu0"
          },
          {
            "id": "4",
            "code": "DES-1.4",
            "title": "Create Simple Shapes & Icons",
            "moduleTitle": "Module 1",
            "duration": "40 min",
            "completed": false,
            "active": false,
            "youtubeId": "gvEmPmrz3pA"
          },
          {
            "id": "5",
            "code": "DES-1.5",
            "title": "Typography & Layout Hierarchy",
            "moduleTitle": "Module 1",
            "duration": "40 min",
            "completed": false,
            "active": false,
            "youtubeId": "v0XzBPGiMzI"
          },
          {
            "id": "6",
            "code": "DES-1.6",
            "title": "Mastering the Pen Tool & Bezier Anchor Points",
            "moduleTitle": "Module 1",
            "duration": "1 hour 40 min",
            "completed": false,
            "active": false,
            "youtubeId": "oApzHGJNx38"
          },
          {
            "id": "7",
            "code": "DES-1.7",
            "title": "Mastering Procreate & Color Gradients",
            "moduleTitle": "Module 1",
            "duration": "2 hour",
            "completed": false,
            "active": false,
            "youtubeId": "CKiP208avbc"
          }
        ]
      }
    ],
    "lessons": [
      {
        "id": "1",
        "code": "DES-1.1",
        "title": "Introduction to Digital Vector Design",
        "moduleTitle": "Module 1",
        "duration": "20 min",
        "completed": true,
        "active": false,
        "youtubeId": "bC3Wlg6DIRg"
      },
      {
        "id": "2",
        "code": "DES-1.2",
        "title": "Mastering Tools & Panels",
        "moduleTitle": "Module 1",
        "duration": "1 hour 20 min",
        "completed": false,
        "active": true,
        "youtubeId": "VT9-jeEmlJ8"
      },
      {
        "id": "3",
        "code": "DES-1.3",
        "title": "Mastering Vector Shapes & Curves",
        "moduleTitle": "Module 1",
        "duration": "2 hour 10 min",
        "completed": false,
        "active": false,
        "youtubeId": "inaZ4ezqMu0"
      },
      {
        "id": "4",
        "code": "DES-1.4",
        "title": "Create Simple Shapes & Icons",
        "moduleTitle": "Module 1",
        "duration": "40 min",
        "completed": false,
        "active": false,
        "youtubeId": "gvEmPmrz3pA"
      },
      {
        "id": "5",
        "code": "DES-1.5",
        "title": "Typography & Layout Hierarchy",
        "moduleTitle": "Module 1",
        "duration": "40 min",
        "completed": false,
        "active": false,
        "youtubeId": "v0XzBPGiMzI"
      },
      {
        "id": "6",
        "code": "DES-1.6",
        "title": "Mastering the Pen Tool & Bezier Anchor Points",
        "moduleTitle": "Module 1",
        "duration": "1 hour 40 min",
        "completed": false,
        "active": false,
        "youtubeId": "oApzHGJNx38"
      },
      {
        "id": "7",
        "code": "DES-1.7",
        "title": "Mastering Procreate & Color Gradients",
        "moduleTitle": "Module 1",
        "duration": "2 hour",
        "completed": false,
        "active": false,
        "youtubeId": "CKiP208avbc"
      }
    ]
  }
];

export function getTopicById(id: string): Topic | undefined {
  return TOPICS_DATA.find((t) => t.id === id);
}
