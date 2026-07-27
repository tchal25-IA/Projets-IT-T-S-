export function checkEligibility(prixBien: number, fondsPropres: number, revenuBrut: number) {
  const minFonds = prixBien * 0.20;
  const montantHypotheque = prixBien - fondsPropres;
  const deuxiemeRang = Math.max(0, montantHypotheque - prixBien * 0.65);
  const chargesTheoriques = (prixBien * 0.05) + (deuxiemeRang / 15) + (prixBien * 0.01);
  const eligible = fondsPropres >= minFonds && chargesTheoriques <= revenuBrut / 3;
  return { eligible, montantHypotheque, manque: Math.max(0, minFonds - fondsPropres), chargesTheoriques };
}

export function calculateRangs(prixBien: number, montantHypotheque: number) {
  const premierRang = Math.min(prixBien * 0.65, montantHypotheque);
  const deuxiemeRang = Math.max(0, montantHypotheque - premierRang);
  const amortissementAnnuel = deuxiemeRang > 0 ? deuxiemeRang / 15 : 0;
  return { premierRang, deuxiemeRang, amortissementAnnuel };
}

export function compareNantissementVsRetrait(capital3a: number, canton: string, revenu: number) {
  // Inline simplified tax saving calculation to avoid circular imports
  const CANTONAL_RATES: Record<string, number> = { ZG: 0.22, SZ: 0.24, NW: 0.26, UR: 0.28, OW: 0.28, GL: 0.30, AI: 0.30, TG: 0.32, LU: 0.33, SO: 0.34, AG: 0.34, SG: 0.35, AR: 0.35, SH: 0.35, GR: 0.35, BL: 0.36, FR: 0.36, BE: 0.37, NE: 0.38, VS: 0.38, TI: 0.38, JU: 0.39, BS: 0.39, VD: 0.41, ZH: 0.38, GE: 0.45 };
  const rate = CANTONAL_RATES[canton] ?? 0.35;
  const economieAnnuelle = Math.round(capital3a * rate);
  const retraitNet = capital3a * 0.92;
  const gainNantissement10ans = economieAnnuelle * 10;
  return { retraitNet, gainNantissement10ans };
}

export function calculateEPL(avoirLPP: number, montantEPL: number, age: number, _salaire: number) {
  const montantNet = montantEPL * 0.92;
  const yearsToRetirement = Math.max(0, 65 - age);
  const tauxConversion = 0.068;
  const perteRenteEstimee = montantEPL * tauxConversion;
  return { montantNet, perteRenteEstimee, yearsToRetirement };
}
