import { useState, useEffect, useCallback } from 'react';
import { Settings, CapacityPlan, StaffingDiscipline } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const DEFAULT_CAPACITY_ROWS = [
  { discipline: StaffingDiscipline.ProjectManagement, label: 'Project Management', headcount: 3, hoursPerPerson: 40, committedHours: 110 },
  { discipline: StaffingDiscipline.Superintendents, label: 'Superintendents', headcount: 4, hoursPerPerson: 45, committedHours: 150 },
  { discipline: StaffingDiscipline.Engineering, label: 'Engineering', headcount: 5, hoursPerPerson: 40, committedHours: 165 },
  { discipline: StaffingDiscipline.FieldLabor, label: 'Field Labor', headcount: 32, hoursPerPerson: 38, committedHours: 1120 },
  { discipline: StaffingDiscipline.Safety, label: 'Safety', headcount: 2, hoursPerPerson: 40, committedHours: 60 },
] as const;

export const DEFAULT_CAPACITY_PLAN: CapacityPlan = {
  planningHorizonWeeks: 8,
  notes: 'Baseline staffing plan for your workload.',
  rows: DEFAULT_CAPACITY_ROWS.map((row, index) => ({
    id: `seed-${index}`,
    discipline: row.discipline,
    label: row.label,
    headcount: row.headcount,
    hoursPerPerson: row.hoursPerPerson,
    committedHours: row.committedHours,
  })),
};

export function useSupabaseSettings(companyId?: string | null) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [settingsRowId, setSettingsRowId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    if (!companyId) {
      setSettings(null);
      setSettingsRowId(null);
      setError(null);
      setLoading(false);
      return;
    }
    if (!isSupabaseConfigured()) {
      setError('Supabase not configured');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase!
        .from('settings')
        .select(`
          *,
          capacity_plans (
            *,
            capacity_rows (*)
          )
        `)
        .eq('company_id', companyId)
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!data) {
        setSettings(null);
        setError('No settings found for this company.');
        return;
      }

      setSettingsRowId(data.id);

      const capacityEnabled = Boolean(data.capacity_enabled);
      const capacityPlan: CapacityPlan | undefined = capacityEnabled && data.capacity_plans ? {
        planningHorizonWeeks: data.capacity_plans.planning_horizon_weeks,
        notes: data.capacity_plans.notes || undefined,
        lastUpdated: data.capacity_plans.last_updated || undefined,
        rows: (data.capacity_plans.capacity_rows || []).map((row: any) => ({
          id: row.id,
          discipline: row.discipline,
          label: row.label,
          headcount: Number(row.headcount),
          hoursPerPerson: Number(row.hours_per_person),
          committedHours: Number(row.committed_hours),
        })),
        companyId,
      } : undefined;

      const appSettings: Settings = {
        companyName: data.company_name,
        projectManagers: data.project_managers || [],
        estimators: data.estimators || [],
        weekEndDay: data.week_end_day,
        defaultStatus: data.default_status,
        defaultRole: data.default_role,
        capacityEnabled,
        capacityPlan,
        companyLogo: data.company_logo || undefined,
        companyId,
        companyType: data.company_type || 'direct',
      };

      setSettings(appSettings);
      setError(null);
    } catch (err: any) {
      console.error('[useSupabaseSettings] Error loading settings', err);
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSettings = useCallback(async (newSettings: Settings) => {
    if (!companyId || !settingsRowId || !isSupabaseConfigured()) return;

    try {
      let capacityPlanId: string | null = null;
      let planForState: CapacityPlan | undefined | null = newSettings.capacityPlan;

      const { data: existingPlan } = await supabase!
        .from('capacity_plans')
        .select('id')
        .eq('company_id', companyId)
        .limit(1)
        .maybeSingle();

      if (newSettings.capacityEnabled) {
        const planSource: CapacityPlan = newSettings.capacityPlan ?? DEFAULT_CAPACITY_PLAN;
        planForState = planSource;

        const planPayload = {
          company_id: companyId,
          planning_horizon_weeks: planSource.planningHorizonWeeks,
          notes: planSource.notes || null,
          last_updated: new Date().toISOString(),
        };

        if (existingPlan) {
          capacityPlanId = existingPlan.id;
          await supabase!
            .from('capacity_plans')
            .update(planPayload)
            .eq('id', capacityPlanId);

          await supabase!
            .from('capacity_rows')
            .delete()
            .eq('plan_id', capacityPlanId)
            .eq('company_id', companyId);
        } else {
          const { data: plan, error: planError } = await supabase!
            .from('capacity_plans')
            .insert(planPayload)
            .select()
            .single();
          if (planError) throw planError;
          capacityPlanId = plan.id;
        }

        if (capacityPlanId && planSource.rows.length > 0) {
          const rowsPayload = planSource.rows.map(row => ({
            plan_id: capacityPlanId!,
            company_id: companyId,
            discipline: row.discipline,
            label: row.label,
            headcount: row.headcount,
            hours_per_person: row.hoursPerPerson,
            committed_hours: row.committedHours,
          }));
          const { error: rowsError } = await supabase!
            .from('capacity_rows')
            .insert(rowsPayload);
          if (rowsError) throw rowsError;
        }
      } else {
        planForState = null;
        capacityPlanId = existingPlan?.id ?? null;
      }

      const { error: updateError } = await supabase!
        .from('settings')
        .update({
          company_name: newSettings.companyName,
          project_managers: newSettings.projectManagers,
          estimators: newSettings.estimators,
          week_end_day: newSettings.weekEndDay,
          default_status: newSettings.defaultStatus,
          default_role: newSettings.defaultRole,
          capacity_plan_id: capacityPlanId,
          capacity_enabled: newSettings.capacityEnabled,
          company_logo: newSettings.companyLogo || null,
        })
        .eq('id', settingsRowId)
        .eq('company_id', companyId);

      if (updateError) throw updateError;

      setSettings({
        ...newSettings,
        capacityPlan: planForState ?? undefined,
      });
    } catch (err: any) {
      console.error('[useSupabaseSettings] Error updating settings', err);
      throw err;
    }
  }, [companyId, settingsRowId]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    refreshSettings: loadSettings,
  };
}

