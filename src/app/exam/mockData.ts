export interface ChartDataPoint {
  label: string
  value: number
}

export interface ExamQuestion {
  id: string
  module: string
  questionText: string
  chartType: 'bar' | 'pie' | 'line' | 'table'
  chartData: ChartDataPoint[]
  options: string[]
  correctAnswer: string
  explanation: string
}

export const GRAPHS_MOCK_QUESTIONS: ExamQuestion[] = [
  {
    id: "gcd_001",
    module: "graphs_charts_data",
    questionText: "If the number of Chinese Insurance stocks represented 3.5% of all Insurance securities, approximately how many Insurance bonds were Chinese?",
    chartType: "pie",
    chartData: [
      { label: "Chinese", value: 30 },
      { label: "Indian", value: 24 },
      { label: "US", value: 20 },
      { label: "Brazilian", value: 16 },
      { label: "Israeli", value: 10 }
    ],
    options: ["9,200,000", "9,500,000", "10,800,000", "1,080,000"],
    correctAnswer: "9,500,000",
    explanation: "Total insurance securities = 33,000 bonds + 3,000 stocks = 36,000 (in thousands). Chinese share = 30% of 36,000 = 10,800. Chinese stocks = 3.5% of 36,000 = 1,260. Chinese bonds = 10,800 - 1,260 = 9,540, which is approximately 9,500 (thousands → 9,500,000)."
  },
  {
    id: "gcd_002",
    module: "graphs_charts_data",
    questionText: "What was the ratio of investment in 1997 over the investment in 1992?",
    chartType: "bar",
    chartData: [
      { label: "1992", value: 5.7 },
      { label: "1993", value: 10.15 },
      { label: "1994", value: 12.16 },
      { label: "1995", value: 10.22 },
      { label: "1996", value: 24.23 },
      { label: "1997", value: 31.36 }
    ],
    options: ["5.50", "5.36", "5.64", "5.75"],
    correctAnswer: "5.50",
    explanation: "31.36 / 5.7 = 5.5017 ≈ 5.50."
  },
  {
    id: "gcd_003",
    module: "graphs_charts_data",
    questionText: "What was the absolute difference in the FDI to Philippines between 1996 and 1997?",
    chartType: "bar",
    chartData: [
      { label: "1992", value: 5.7 },
      { label: "1993", value: 10.15 },
      { label: "1994", value: 12.16 },
      { label: "1995", value: 10.22 },
      { label: "1996", value: 24.23 },
      { label: "1997", value: 31.36 }
    ],
    options: ["7.29", "7.13", "8.13", "None of these"],
    correctAnswer: "7.13",
    explanation: "31.36 - 24.23 = 7.13 million Pesos."
  },
  {
    id: "gcd_004",
    module: "graphs_charts_data",
    questionText: "If Philippine FDI from OPEC countries was proportionately the same in 1992 and 1997 as the total FDI from all over the world, and if the FDI in 1992 from the OPEC countries was Euro 2 million, what was the amount of FDI from the OPEC countries in 1997?",
    chartType: "bar",
    chartData: [
      { label: "1992", value: 5.7 },
      { label: "1993", value: 10.15 },
      { label: "1994", value: 12.16 },
      { label: "1995", value: 10.22 },
      { label: "1996", value: 24.23 },
      { label: "1997", value: 31.36 }
    ],
    options: ["11", "10.72", "11.28", "11.5"],
    correctAnswer: "11",
    explanation: "(2 / 5.7) * 31.36 = 11.0035 ≈ 11."
  },
  {
    id: "gcd_005",
    module: "graphs_charts_data",
    questionText: "Which year exhibited the highest growth in FDI in Philippines over the period shown?",
    chartType: "bar",
    chartData: [
      { label: "1992", value: 5.7 },
      { label: "1993", value: 10.15 },
      { label: "1994", value: 12.16 },
      { label: "1995", value: 10.22 },
      { label: "1996", value: 24.23 },
      { label: "1997", value: 31.36 }
    ],
    options: ["1993", "1994", "1995", "1996"],
    correctAnswer: "1996",
    explanation: "1996 grew from 10.22 to 24.23 (increase of 14.01, or ~137% growth). This is the single largest absolute jump."
  },
  {
    id: "gcd_006",
    module: "graphs_charts_data",
    questionText: "What was Philippines' total FDI for the period shown in the figure?",
    chartType: "bar",
    chartData: [
      { label: "1992", value: 5.7 },
      { label: "1993", value: 10.15 },
      { label: "1994", value: 12.16 },
      { label: "1995", value: 10.22 },
      { label: "1996", value: 24.23 },
      { label: "1997", value: 31.36 }
    ],
    options: ["93.82", "93.22", "93.19", "None of these"],
    correctAnswer: "93.82",
    explanation: "5.7 + 10.15 + 12.16 + 10.22 + 24.23 + 31.36 = 93.82."
  },
  {
    id: "gcd_007",
    module: "graphs_charts_data",
    questionText: "What are the average marks obtained by the student in all the periodical exams during the last session?",
    chartType: "line",
    chartData: [
      { label: "Apr-01", value: 360 },
      { label: "Jun-01", value: 365 },
      { label: "Aug-01", value: 370 },
      { label: "Oct-01", value: 385 },
      { label: "Dec-01", value: 400 },
      { label: "Feb-02", value: 405 }
    ],
    options: ["373", "379", "381", "385"],
    correctAnswer: "381",
    explanation: "(360 + 365 + 370 + 385 + 400 + 405) / 6 = 2285 / 6 = 380.83 ≈ 381."
  },
  {
    id: "gcd_008",
    module: "graphs_charts_data",
    questionText: "In which periodical exams is there a fall in percentage of marks as compared to the previous periodical exams?",
    chartType: "line",
    chartData: [
      { label: "Apr-01", value: 360 },
      { label: "Jun-01", value: 365 },
      { label: "Aug-01", value: 370 },
      { label: "Oct-01", value: 385 },
      { label: "Dec-01", value: 400 },
      { label: "Feb-02", value: 405 }
    ],
    options: ["None", "June, 01", "Oct, 01", "Feb, 02"],
    correctAnswer: "None",
    explanation: "Marks increase steadily (360 → 365 → 370 → 385 → 400 → 405). There is no fall."
  },
  {
    id: "gcd_009",
    module: "graphs_charts_data",
    questionText: "The total number of marks obtained in Feb. 02 is what percent of the total marks obtained in April 01?",
    chartType: "line",
    chartData: [
      { label: "Apr-01", value: 360 },
      { label: "Jun-01", value: 365 },
      { label: "Aug-01", value: 370 },
      { label: "Oct-01", value: 385 },
      { label: "Dec-01", value: 400 },
      { label: "Feb-02", value: 405 }
    ],
    options: ["110%", "112.5%", "115%", "116.5%"],
    correctAnswer: "112.5%",
    explanation: "(405 / 360) × 100 = 112.5%."
  },
  {
    id: "gcd_010",
    module: "graphs_charts_data",
    questionText: "The table above shows the data Steve collected while watching birds for one week. How many raptors did Steve see on Monday?",
    chartType: "table",
    chartData: [
      { label: "Monday", value: 6 },
      { label: "Tuesday", value: 7 },
      { label: "Wednesday", value: 12 },
      { label: "Thursday", value: 11 },
      { label: "Friday", value: 4 }
    ],
    options: ["6 raptors", "7 raptors", "8 raptors", "10 raptors"],
    correctAnswer: "6 raptors",
    explanation: "Mean is 8 across 5 days → total = 40. Known days: 7 + 12 + 11 + 4 = 34. Monday = 40 - 34 = 6 raptors."
  }
]