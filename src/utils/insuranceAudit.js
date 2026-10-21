export const INITIAL_LOGS = [
  {
    id: 'log-1',
    date: new Date(Date.now() - 3600000 * 2).toISOString(),
    athleteNom: 'BOUKIR SAMIR',
    action: 'VALIDATION_OCR',
    actionLabel: 'Validation automatique OCR',
    operateur: 'Système OVIA OCR',
    compagnie: 'SAA Assurances',
    details: 'Police N° SAA-2026-9812 validée avec succès'
  },
  {
    id: 'log-2',
    date: new Date(Date.now() - 3600000 * 24).toISOString(),
    athleteNom: 'BOUALEM AMINE',
    action: 'ATTESTATION_PDF',
    actionLabel: 'Génération Attestation Individuelle',
    operateur: 'Secrétariat',
    compagnie: 'Alliance Assurances',
    details: 'Attestation sportive officielle téléchargée'
  },
  {
    id: 'log-3',
    date: new Date(Date.now() - 3600000 * 48).toISOString(),
    athleteNom: 'TOUATI RYAD',
    action: 'EXTEND_COVERAGE',
    actionLabel: 'Prolongation de couverture',
    operateur: 'Administrateur (Direction)',
    compagnie: 'CAAT Assurances',
    details: 'Prolongation validité jusqu\'au 31/08/2027'
  }
];

export function logInsuranceAction(entry) {
  try {
    const existing = localStorage.getItem('ovia_insurance_audit_log');
    const logs = existing ? JSON.parse(existing) : INITIAL_LOGS;
    const newEntry = {
      id: `log-${Date.now()}`,
      date: new Date().toISOString(),
      operateur: 'Administrateur',
      ...entry
    };
    logs.unshift(newEntry);
    localStorage.setItem('ovia_insurance_audit_log', JSON.stringify(logs.slice(0, 100)));
  } catch (err) {
    console.warn('Audit log write error:', err);
  }
}
