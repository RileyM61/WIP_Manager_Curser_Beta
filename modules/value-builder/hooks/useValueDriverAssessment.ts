/**
 * Hook for managing Value Driver Assessments
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { ValueDriverAssessment, StrategicRecommendation } from '../types';
import {
  QuestionnaireAnswers,
  ValueDriverScore,
  calculateValueDriverScores,
  calculateOverallScore,
  identifyStrengthsAndWeaknesses,
} from '../lib/questionnaire';
import {
  getActionItemsForCategory,
  estimateCostForCategory,
  calculateROI,
} from '../lib/strategicActions';

export function useValueDriverAssessment(companyId: string | undefined) {
  const [assessment, setAssessment] = useState<ValueDriverAssessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load latest assessment
  useEffect(() => {
    if (!companyId) {
      setAssessment(null);
      return;
    }

    const loadAssessment = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('value_driver_assessments')
          .select('*')
          .eq('company_id', companyId)
          .order('completed_at', { ascending: false })
          .limit(1)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          // PGRST116 is "no rows returned", which is fine
          throw fetchError;
        }

        if (data) {
          setAssessment({
            id: data.id,
            companyId: data.company_id,
            valuationId: data.valuation_id,
            answers: data.answers as QuestionnaireAnswers,
            scores: data.scores as ValueDriverScore[],
            overallScore: parseFloat(data.overall_score),
            strengths: data.strengths as string[],
            weaknesses: data.weaknesses as string[],
            recommendations: (data.recommendations as StrategicRecommendation[]) || [],
            completedAt: data.completed_at,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          });
        } else {
          setAssessment(null);
        }
      } catch (err) {
        console.error('Error loading assessment:', err);
        setError(err instanceof Error ? err.message : 'Failed to load assessment');
      } finally {
        setLoading(false);
      }
    };

    loadAssessment();
  }, [companyId]);

  // Generate strategic recommendations based on scores
  const generateRecommendations = (
    scores: ValueDriverScore[],
    estimatedEbitda: number = 1000000
  ): StrategicRecommendation[] => {
    // Sort by impact (lowest scores first = highest priority)
    const sortedScores = [...scores].sort((a, b) => a.score - b.score);
    
    return sortedScores.slice(0, 5).map(score => {
      const targetScore = Math.min(2, score.score + 1); // Aim to improve by 1 point
      const potentialImpact = (targetScore - score.score) * score.weight * 0.5;
      const actionItems = getActionItemsForCategory(score.category, score.score);
      const estimatedCost = estimateCostForCategory(score.category);
      const roi = calculateROI(potentialImpact, estimatedCost);
      
      return {
        category: score.category,
        priority: score.score < -0.5 ? 'high' : score.score < 0 ? 'medium' : 'low',
        currentScore: score.score,
        targetScore,
        potentialValueImpact: potentialImpact,
        actionItems,
        estimatedCost,
        estimatedTimeline: '3-12 months', // Could be more sophisticated
        roi,
      };
    });
  };

  // Save assessment
  const saveAssessment = async (
    answers: QuestionnaireAnswers,
    valuationId: string | null = null
  ): Promise<ValueDriverAssessment | null> => {
    if (!companyId) {
      setError('Company ID is required');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const scores = calculateValueDriverScores(answers);
      const overallScore = calculateOverallScore(answers);
      const { strengths, weaknesses } = identifyStrengthsAndWeaknesses(scores);
      const recommendations = generateRecommendations(scores);

      const { data, error: insertError } = await supabase
        .from('value_driver_assessments')
        .insert({
          company_id: companyId,
          valuation_id: valuationId,
          answers,
          scores,
          overall_score: overallScore,
          strengths,
          weaknesses,
          recommendations,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const newAssessment: ValueDriverAssessment = {
        id: data.id,
        companyId: data.company_id,
        valuationId: data.valuation_id,
        answers: data.answers as QuestionnaireAnswers,
        scores: data.scores as ValueDriverScore[],
        overallScore: parseFloat(data.overall_score),
        strengths: data.strengths as string[],
        weaknesses: data.weaknesses as string[],
        recommendations: (data.recommendations as StrategicRecommendation[]) || [],
        completedAt: data.completed_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setAssessment(newAssessment);
      return newAssessment;
    } catch (err) {
      console.error('Error saving assessment:', err);
      setError(err instanceof Error ? err.message : 'Failed to save assessment');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get investment priorities (sorted by ROI)
  const investmentPriorities = useMemo(() => {
    if (!assessment) return [];
    
    const recommendations = assessment.recommendations.length > 0
      ? assessment.recommendations
      : generateRecommendations(assessment.scores);
    
    // Sort by ROI (highest first)
    return recommendations
      .filter(rec => rec.roi !== null && rec.roi > 0)
      .sort((a, b) => (b.roi || 0) - (a.roi || 0));
  }, [assessment]);

  // Calculate investment plan
  const investmentPlan = useMemo(() => {
    if (!investmentPriorities.length) return null;
    
    const top5 = investmentPriorities.slice(0, 5);
    const totalCost = top5.reduce((sum, rec) => sum + (rec.estimatedCost || 0), 0);
    const totalValueImpact = top5.reduce((sum, rec) => sum + rec.potentialValueImpact, 0);
    
    return {
      investments: top5,
      totalCost,
      totalValueImpact,
      overallROI: totalCost > 0 ? totalValueImpact / totalCost : 0,
    };
  }, [investmentPriorities]);

  return {
    assessment,
    loading,
    error,
    saveAssessment,
    generateRecommendations,
    investmentPriorities,
    investmentPlan,
  };
}

