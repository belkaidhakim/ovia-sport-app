import React, { useState } from 'react';
import { 
  Building2, 
  CheckCircle2, 
  X, 
  Star
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const DEFAULT_PARTNERS = [
  {
    id: 'saa',
    nom: 'SAA (Société Nationale d\'Assurance)',
    sigle: 'SAA',
    statut: 'Convention Principale FAN / DJS',
    conventionNum: 'CONV-SAA-BOU-2026/01',
    tarifNegocie: 1200,
    tarifPublic: 2500,
    contactNom: 'Agence Principale Bouira',
    telephone: '026 73 12 45',
    policeGroupe: 'POL-COLL-SAA-2026/77',
    garanties: ['Responsabilité Civile Club', 'Individuelle Accident Athlètes', 'Frais Médicaux d\'Urgence'],
    recommande: true
  },
  {
    id: 'caat',
    nom: 'CAAT (Compagnie Algérienne des Assurances)',
    sigle: 'CAAT',
    statut: 'Accord Cadre National',
    conventionNum: 'ACC-CAAT-SPORT-2026',
    tarifNegocie: 1400,
    tarifPublic: 2800,
    contactNom: 'Direction Régionale Centre',
    telephone: '021 69 40 22',
    policeGroupe: 'POL-CAAT-GROUPE-889',
    garanties: ['Responsabilité Civile', 'Assurance Transport & Déplacements Compétitions'],
    recommande: false
  },
  {
    id: 'macir',
    nom: 'Macir Vie Assurances',
    sigle: 'Macir Vie',
    statut: 'Pack Santé & Sportif Elite',
    conventionNum: 'MACIR-OVIA-PRO-02',
    tarifNegocie: 1800,
    tarifPublic: 3500,
    contactNom: 'Pôle Sport & Collectivités',
    telephone: '023 50 10 10',
    policeGroupe: 'POL-MACIR-NATATION-2026',
    garanties: ['Individuelle Accident 24h/24', 'Rapatriement Sanitaire Compétition', 'Prise en charge Kinésithérapie'],
    recommande: false
  },
  {
    id: 'alliance',
    nom: 'Alliance Assurances Algérie',
    sigle: 'Alliance',
    statut: 'Partenaire Local',
    conventionNum: 'ALLIANCE-CS-2026/09',
    tarifNegocie: 1350,
    tarifPublic: 2600,
    contactNom: 'Agence Bouira Ville',
    telephone: '026 71 88 50',
    policeGroupe: 'POL-ALLIANCE-CS-2026',
    garanties: ['Responsabilité Civile', 'Dommages Corporels'],
    recommande: false
  }
];

export default function InsurancePartnersModal({
  isOpen,
  onClose,
  activePartnerId = 'saa',
  onSelectPartner
}) {
  const [selectedId, setSelectedId] = useState(() => {
    return localStorage.getItem('ovia_active_insurance_partner_id') || activePartnerId || 'saa';
  });

  if (!isOpen) return null;

  const handleSetActive = (partner) => {
    setSelectedId(partner.id);
    localStorage.setItem('ovia_active_insurance_partner_id', partner.id);
    localStorage.setItem('ovia_active_insurance_partner_name', partner.nom);
    localStorage.setItem('ovia_active_insurance_partner_rate', String(partner.tarifNegocie));
    localStorage.setItem('ovia_active_insurance_partner_police', partner.policeGroupe);
    
    if (onSelectPartner) {
      onSelectPartner(partner);
    }
    toast.success(`${partner.sigle} est désormais le partenaire d'assurance référent du club !`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* EN-TÊTE MODALE */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Compagnies Partenaires & Accords Cadres
                <span className="px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 text-xs font-black">
                  Tarifs Négociés
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Gestion des conventions annuelles avec les compagnies d'assurance algériennes pour le club Ovia Sport.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* LISTE DES PARTENAIRES */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DEFAULT_PARTNERS.map(partner => {
              const isActive = selectedId === partner.id;

              return (
                <div
                  key={partner.id}
                  className={`p-5 rounded-3xl border-2 transition relative flex flex-col justify-between ${
                    isActive
                      ? 'border-sky-500 bg-sky-50/40 dark:bg-sky-950/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/40 hover:border-slate-300'
                  }`}
                >
                  {partner.recommande && (
                    <span className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <Star size={11} className="fill-current" /> Partenaire Fédéral
                    </span>
                  )}

                  <div>
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-xs text-sky-600 dark:text-sky-400 shadow-sm">
                        {partner.sigle.substring(0, 3)}
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                          {partner.nom}
                        </h3>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Convention : <code className="font-mono text-slate-700 dark:text-slate-300">{partner.conventionNum}</code>
                        </span>
                      </div>
                    </div>

                    {/* TARIFS COMPARATIFS */}
                    <div className="my-3 p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Tarif Club Négocié</span>
                        <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                          {partner.tarifNegocie.toLocaleString()} DA <span className="text-[10px] text-slate-400 font-normal">/ athlète</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Tarif Public</span>
                        <span className="text-xs line-through text-slate-400">
                          {partner.tarifPublic.toLocaleString()} DA
                        </span>
                      </div>
                    </div>

                    {/* GARANTIES */}
                    <div className="space-y-1 mb-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Garanties couvertes :
                      </span>
                      {partner.garanties.map((gar, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
                          <span className="truncate">{gar}</span>
                        </div>
                      ))}
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>Contact : {partner.contactNom}</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{partner.telephone}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3">
                    <button
                      type="button"
                      onClick={() => handleSetActive(partner)}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
                        isActive
                          ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-sky-500'
                      }`}
                    >
                      {isActive ? (
                        <>
                          <CheckCircle2 size={15} /> Partenaire Actif Sélectionné
                        </>
                      ) : (
                        'Définir comme Partenaire Référent'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PIED DE MODALE */}
        <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-xs text-slate-500">
          <span>Le choix du partenaire applique automatiquement son tarif et sa police groupe lors des souscriptions collectives.</span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold transition"
          >
            Fermer
          </button>
        </div>
      </motion.div>
    </div>
  );
}
