import { Job } from '../../../types';

export enum RiskLevel {
    Low = 'Low',
    Medium = 'Medium',
    High = 'High',
    None = 'None',
}

export interface SmartRiskAnalysis {
    underbillingRisk: RiskLevel;
    scheduleDriftWeeks: number;
    marginFadePercent: number;
    isMarginFading: boolean;
}

/**
 * Calculates the Underbilling Risk based on billing position relative to contract value.
 * High Risk: Underbilled by > 10% of contract
 * Medium Risk: Underbilled by > 5% of contract
 */
export const calculateUnderbillingRisk = (job: Job): RiskLevel => {
    const contractValue = job.contract.labor + job.contract.material + job.contract.other;
    if (contractValue === 0) return RiskLevel.None;

    const budgetTotal = job.budget.labor + job.budget.material + job.budget.other;
    const costsTotal = job.costs.labor + job.costs.material + job.costs.other;
    const invoicedTotal = job.invoiced.labor + job.invoiced.material + job.invoiced.other;

    // Earned Revenue (Cost to Cost method)
    const percentComplete = budgetTotal > 0 ? costsTotal / budgetTotal : 0;
    const earnedRevenue = contractValue * Math.min(percentComplete, 1);

    const billingPosition = invoicedTotal - earnedRevenue;
    const billingPositionPercent = billingPosition / contractValue;

    if (billingPositionPercent < -0.10) return RiskLevel.High;
    if (billingPositionPercent < -0.05) return RiskLevel.Medium;

    return RiskLevel.Low;
};

/**
 * Calculates Schedule Drift based on financial progress vs time elapsed.
 * Returns estimated weeks behind schedule.
 * Only calculates if job has started and has an end date.
 */
export const calculateScheduleDrift = (job: Job): number => {
    if (!job.startDate || !job.endDate) return 0;

    const start = new Date(job.startDate).getTime();
    const end = new Date(job.endDate).getTime();
    const now = new Date().getTime();
    const totalDuration = end - start;

    // If job hasn't started or is already past end date (handled by basic late check), skip predictive logic
    if (now < start || totalDuration <= 0) return 0;

    const timeElapsedPercent = (now - start) / totalDuration;

    // Financial completion
    const budgetTotal = job.budget.labor + job.budget.material + job.budget.other;
    const costsTotal = job.costs.labor + job.costs.material + job.costs.other;

    // If budget or costs are 0, can't calculate earn rate
    if (budgetTotal === 0) return 0;

    const financialPercent = costsTotal / budgetTotal;

    // If we are significantly further in time than in money spent, we are drifting
    // Drift = (Time% - Money%) * TotalDuration
    // If Time% is 50% but Money% is only 25%, we are drifting

    const driftRatio = timeElapsedPercent - financialPercent;

    // Threshold: if drift is less than 10%, ignore it (normal fluctuation)
    if (driftRatio < 0.1) return 0;

    // Convert drift ratio to weeks
    const driftMs = driftRatio * totalDuration;
    const driftWeeks = Math.round(driftMs / (1000 * 60 * 60 * 24 * 7));

    return Math.max(0, driftWeeks);
};

/**
 * Calculates Margin Fade based on current forecast vs original target.
 * Returns the percentage of margin points lost.
 */
export const calculateMarginFade = (job: Job): { isFading: boolean; fadePercent: number } => {
    const contractTotal = job.contract.labor + job.contract.material + job.contract.other;
    const budgetTotal = job.budget.labor + job.budget.material + job.budget.other;
    const costsTotal = job.costs.labor + job.costs.material + job.costs.other;
    const costToComplete = job.costToComplete.labor + job.costToComplete.material + job.costToComplete.other;

    if (contractTotal === 0) return { isFading: false, fadePercent: 0 };

    const originalProfit = contractTotal - budgetTotal;
    const originalMargin = originalProfit / contractTotal;

    const forecastedCost = costsTotal + costToComplete;
    const forecastedProfit = contractTotal - forecastedCost;
    const forecastedMargin = forecastedProfit / contractTotal;

    // Calculate fade in margin points (e.g., 20% -> 15% = 5 points fade)
    const fadePoints = (originalMargin - forecastedMargin) * 100;

    // Alert if fade is more than 2 percentage points
    return {
        isFading: fadePoints > 2,
        fadePercent: parseFloat(fadePoints.toFixed(1))
    };
};

export const analyzeJobRisk = (job: Job): SmartRiskAnalysis => {
    return {
        underbillingRisk: calculateUnderbillingRisk(job),
        scheduleDriftWeeks: calculateScheduleDrift(job),
        ...calculateMarginFade(job),
        marginFadePercent: calculateMarginFade(job).fadePercent,
        isMarginFading: calculateMarginFade(job).isFading
    };
};
