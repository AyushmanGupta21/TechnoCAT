import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { topicId, topicTitle } = await req.json();

    // Simulate RAG / LLM Generation Delay (500ms)
    await new Promise((resolve) => setTimeout(resolve, 500));

    const title = topicTitle || "Geometry: Circles & Tangents";

    // 10 High-Yield CAT Geometry & Quant Diagnostic Questions
    const questions = [
      {
        id: "q1",
        question: "A tangent PT is drawn from an external point P to a circle, and a secant PAB intersects the circle at A and B. If PT = 12 cm and PA = 8 cm, what is the length of chord AB?",
        options: [
          "10 cm",
          "18 cm",
          "14 cm",
          "12 cm"
        ],
        correctIndex: 0,
        explanation: "By the Tangent-Secant Theorem, PT² = PA × PB. Here, 12² = 8 × PB ⇒ 144 = 8 × PB ⇒ PB = 18 cm. Chord AB = PB - PA = 18 - 8 = 10 cm."
      },
      {
        id: "q2",
        question: "In a circle, tangent XY touches the circle at A. Chord AB subtends an angle of 55° at point C on the major arc of the circle. What is the measure of ∠BAY?",
        options: [
          "35°",
          "55°",
          "110°",
          "125°"
        ],
        correctIndex: 1,
        explanation: "By the Alternate Segment Theorem, the angle between the tangent and chord at the point of contact equals the angle subtended by the chord in the alternate segment. Hence, ∠BAY = ∠BCA = 55°."
      },
      {
        id: "q3",
        question: "Two circles of radii 8 cm and 3 cm have their centers 13 cm apart. What is the length of their direct common tangent (DCT)?",
        options: [
          "10 cm",
          "11 cm",
          "12 cm",
          "12.5 cm"
        ],
        correctIndex: 2,
        explanation: "Length of Direct Common Tangent = √(d² - (r₁ - r₂)²). Here, d = 13, r₁ - r₂ = 8 - 3 = 5 cm. DCT = √(13² - 5²) = √(169 - 25) = √144 = 12 cm."
      },
      {
        id: "q4",
        question: "Two circles with radii 5 cm and 4 cm have their centers separated by 15 cm. What is the length of their transverse common tangent (TCT)?",
        options: [
          "12 cm",
          "10 cm",
          "13 cm",
          "14 cm"
        ],
        correctIndex: 0,
        explanation: "Length of Transverse Common Tangent = √(d² - (r₁ + r₂)²). Here, d = 15, r₁ + r₂ = 5 + 4 = 9 cm. TCT = √(15² - 9²) = √(225 - 81) = √144 = 12 cm."
      },
      {
        id: "q5",
        question: "In a right-angled triangle ABC with sides AB = 6 cm, BC = 8 cm, and hypotenuse AC = 10 cm, what is the radius of the incircle?",
        options: [
          "1.5 cm",
          "2 cm",
          "2.5 cm",
          "3 cm"
        ],
        correctIndex: 1,
        explanation: "For a right-angled triangle, inradius r = (a + b - c) / 2 = (6 + 8 - 10) / 2 = 4 / 2 = 2 cm."
      },
      {
        id: "q6",
        question: "Two chords AB and CD of a circle intersect at an interior point E. If AE = 6 cm, EB = 8 cm, and CE = 4 cm, what is the length of ED?",
        options: [
          "10 cm",
          "14 cm",
          "12 cm",
          "16 cm"
        ],
        correctIndex: 2,
        explanation: "By the Intersecting Chords Theorem, AE × EB = CE × ED ⇒ 6 × 8 = 4 × ED ⇒ 48 = 4 × ED ⇒ ED = 12 cm."
      },
      {
        id: "q7",
        question: "In a cyclic quadrilateral ABCD, ∠A = (2x + 4)° and ∠C = (3x - 14)°. What is the measure of ∠A?",
        options: [
          "76°",
          "80°",
          "84°",
          "96°"
        ],
        correctIndex: 1,
        explanation: "In any cyclic quadrilateral, opposite angles sum to 180°. (2x + 4) + (3x - 14) = 180 ⇒ 5x - 10 = 180 ⇒ 5x = 190 ⇒ x = 38. Therefore, ∠A = 2(38) + 4 = 76 + 4 = 80°."
      },
      {
        id: "q8",
        question: "A chord of length 16 cm is drawn in a circle of radius 10 cm. What is the perpendicular distance from the center of the circle to this chord?",
        options: [
          "5 cm",
          "6 cm",
          "8 cm",
          "7 cm"
        ],
        correctIndex: 1,
        explanation: "The perpendicular from the center bisects the chord into two 8 cm segments. By the Pythagorean theorem: distance d = √(r² - (chord/2)²) = √(10² - 8²) = √(100 - 64) = √36 = 6 cm."
      },
      {
        id: "q9",
        question: "AB is a diameter of a circle. C is any point on the circumference other than A and B. If ∠BAC = 32°, what is the measure of ∠ABC?",
        options: [
          "48°",
          "58°",
          "64°",
          "74°"
        ],
        correctIndex: 1,
        explanation: "The angle subtended by a diameter at the circumference (in a semicircle) is always 90° (∠ACB = 90°). Hence, ∠ABC = 180° - 90° - 32° = 58°."
      },
      {
        id: "q10",
        question: "Tangents PA and PB are drawn from an external point P to a circle with center O. If ∠APB = 70°, what is the measure of ∠AOB?",
        options: [
          "110°",
          "140°",
          "70°",
          "120°"
        ],
        correctIndex: 0,
        explanation: "Since radii OA and OB are perpendicular to tangents PA and PB at the points of contact (90° each), quadrilateral PAOB has ∠APB + ∠AOB = 180°. Thus, ∠AOB = 180° - 70° = 110°."
      }
    ];

    return NextResponse.json({ success: true, questions });
  } catch (error) {
    console.error("Quiz Generation Error:", error);
    return NextResponse.json({ success: false, error: "Failed to generate quiz" }, { status: 500 });
  }
}
