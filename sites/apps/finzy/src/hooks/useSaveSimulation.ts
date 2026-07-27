import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SaveSimulationParams {
  simulator_type: string;
  label: string;
  params_json: Record<string, unknown>;
  result_json: Record<string, unknown>;
}

export function useSaveSimulation() {
  const [saving, setSaving] = useState(false);

  const saveSimulation = async (
    userId: string,
    params: SaveSimulationParams
  ): Promise<boolean> => {
    setSaving(true);
    const { error } = await supabase.from('saved_simulations').insert([{
      user_id: userId,
      simulator_type: params.simulator_type,
      label: params.label,
      params_json: params.params_json as any,
      result_json: params.result_json as any,
    }]);
    setSaving(false);
    if (error) {
      toast.error('Erreur lors de la sauvegarde');
      return false;
    }
    toast.success('Simulation sauvegardée !');
    return true;
  };

  return { saveSimulation, saving };
}
