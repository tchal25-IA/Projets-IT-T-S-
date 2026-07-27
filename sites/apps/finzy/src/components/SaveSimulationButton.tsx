import { useState } from 'react';
import { Save, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useSaveSimulation } from '@/hooks/useSaveSimulation';

interface SaveSimulationButtonProps {
  simulator_type: string;
  label: string;
  params_json: Record<string, unknown>;
  result_json: Record<string, unknown>;
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg';
}

export function SaveSimulationButton({
  simulator_type,
  label: defaultLabel,
  params_json,
  result_json,
  variant = 'outline',
  size = 'default',
}: SaveSimulationButtonProps) {
  const { user } = useAuth();
  const { saveSimulation, saving } = useSaveSimulation();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(defaultLabel);

  if (!user) return null;

  const handleSave = async () => {
    const ok = await saveSimulation(user.id, {
      simulator_type,
      label: label.trim() || defaultLabel,
      params_json,
      result_json,
    });
    if (ok) setOpen(false);
  };

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)}>
        <Save className="h-4 w-4 mr-2" />
        Sauvegarder
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sauvegarder cette simulation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <label className="text-sm font-medium">Nom (optionnel)</label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={defaultLabel}
            />
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
