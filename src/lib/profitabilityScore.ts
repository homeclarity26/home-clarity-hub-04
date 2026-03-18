export interface ProfitabilityData {
  totalRevenue: number;
  totalHours: number;
  targetHourlyRate: number;
  messageCount: number;
  messageCostPerMsg: number;
}

export interface ProfitabilityResult {
  revenue: number;
  timeCost: number;
  supportCost: number;
  netProfit: number;
  grade: "A" | "B" | "C" | "D";
  gradeColor: string;
}

export function computeProfitability(data: ProfitabilityData): ProfitabilityResult {
  const timeCost = data.totalHours * data.targetHourlyRate;
  const supportCost = data.messageCount * data.messageCostPerMsg;
  const netProfit = data.totalRevenue - timeCost - supportCost;

  let grade: ProfitabilityResult["grade"];
  let gradeColor: string;

  if (data.totalRevenue === 0 && data.totalHours === 0) {
    grade = "C";
    gradeColor = "text-blue-600 bg-blue-100";
  } else if (netProfit > data.totalRevenue * 0.3) {
    grade = "A";
    gradeColor = "text-emerald-700 bg-emerald-100";
  } else if (netProfit > 0) {
    grade = "B";
    gradeColor = "text-blue-700 bg-blue-100";
  } else if (netProfit > -data.targetHourlyRate * 2) {
    grade = "C";
    gradeColor = "text-amber-700 bg-amber-100";
  } else {
    grade = "D";
    gradeColor = "text-destructive bg-destructive/10";
  }

  return { revenue: data.totalRevenue, timeCost, supportCost, netProfit, grade, gradeColor };
}
