import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  ForecastMethodologyConfig,
  ForecastMethodologyType,
} from '../types';
import {
  getDefaultParameters,
} from '../lib/forecastMethodologies';

interface DbMethodologyRow {
  id: string;
  company_id: string;
  line_item_id: string;
  methodology: ForecastMethodologyType;
  parameters: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function mapRow(row: DbMethodologyRow): ForecastMethodologyConfig {
  return {
    id: row.id,
    companyId: row.company_id,
    lineItemId: row.line_item_id,
    methodology: row.methodology,
    parameters: row.parameters || {},
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useForecastMethodologies(companyId: string | null) {
  const [configs, setConfigs] = useState<Record<string, ForecastMethodologyConfig>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigs = useCallback(async () => {
    if (!companyId) {
      setConfigs({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('forecast_methodologies')
        .select('*')
        .eq('company_id', companyId);

      if (fetchError) throw fetchError;

      const mapped = (data || []).map(mapRow);
      const map: Record<string, ForecastMethodologyConfig> = {};
      mapped.forEach((config) => {
        map[config.lineItemId] = config;
      });
      setConfigs(map);
    } catch (err: any) {
      console.error('[useForecastMethodologies] fetch failed', err);
      setError(err.message || 'Failed to load methodologies');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const saveMethodology = useCallback(
    async (
      lineItemId: string,
      methodology: ForecastMethodologyType,
      parameters: Record<string, any>
    ) => {
      if (!companyId) {
        throw new Error('Select a company first.');
      }

      setError(null);

      try {
        const payload = {
          company_id: companyId,
          line_item_id: lineItemId,
          methodology,
          parameters: { ...getDefaultParameters(methodology), ...parameters },
          is_active: true,
        };

        const { data, error: upsertError } = await supabase
          .from('forecast_methodologies')
          .upsert(payload, {
            onConflict: 'company_id,line_item_id',
          })
          .select('*')
          .single();

        if (upsertError) throw upsertError;

        const mapped = mapRow(data as DbMethodologyRow);
        setConfigs((prev) => ({
          ...prev,
          [lineItemId]: mapped,
        }));

        return mapped;
      } catch (err: any) {
        console.error('[useForecastMethodologies] save failed', err);
        setError(err.message || 'Failed to save methodology');
        throw err;
      }
    },
    [companyId]
  );

  const getConfigForLine = useCallback(
    (lineItemId: string, fallbackMethod: ForecastMethodologyType = 'run_rate') => {
      return (
        configs[lineItemId] ?? {
          id: `temp-${lineItemId}`,
          companyId: companyId ?? '',
          lineItemId,
          methodology: fallbackMethod,
          parameters: getDefaultParameters(fallbackMethod),
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
    },
    [configs, companyId]
  );

  const configList = useMemo(() => Object.values(configs), [configs]);

  return {
    configs,
    configList,
    getConfigForLine,
    loading,
    error,
    refresh: fetchConfigs,
    saveMethodology,
  };
}

