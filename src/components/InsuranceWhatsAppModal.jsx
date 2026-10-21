import React, { useState } from 'react';
import { 
  MessageSquare, 
  Phone, 
  Send, 
  X, 
  Copy 
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { formatWhatsAppPhone } from '../utils/formatters';

const TEMPLATES = [
  {
    id: 'standard',
    title: '🏊‍♂️ Rappel Obligatoire Début de Saison',
    subject: 'Assurance sportive Ovia Sport - Saison 2026/2027',
    getMessage: (athlete, deadline) => 
      `Bonjour,\n\nLe club de natation *Ovia Sport* vous informe que l'athlète *${athlete.prenom} ${athlete.nom}* (${athlete.groupe || athlete.groupes?.nom || 'Adhérent'}) n'a pas encore de couverture d'assurance sportive enregistrée pour la saison 2026/2027.\n\n` +
      `📅 *Date limite de régularisation :* ${deadline || 'Dimanche prochain'}\n\n` +
      `Pour des raisons légales de conformité et de sécurité au bord du bassin, merci de transmettre l'attestation ou de régler la cotisation d'assurance au secrétariat du club.\n\n` +
      `📞 Contact Secrétariat / WhatsApp : 0770 71 98 68\n\n` +
      `Cordialement,\nDirection Ovia Sport 🏊‍♂️ · Wilaya de Bouira`
  },
  {
    id: 'urgente',
    title: '🚨 Alerte Urgente - Accès Bassin Restreint',
    subject: 'URGENT : Absence d\'assurance sportive',
    getMessage: (athlete, deadline) => 
      `🚨 *URGENT - DIRECTION OVIA SPORT*\n\nMadame, Monsieur,\n\nNous constatons que la police d'assurance de votre enfant *${athlete.prenom} ${athlete.nom}* n'a pas été renouvelée.\n\n` +
      `⚠️ *Attention :* Conformément aux directives de la Fédération Algérienne de Natation (FAN) et de la DJS, l'accès aux lignes d'eau et aux compétitions sera temporairement suspendu sans couverture valide d'ici le *${deadline || '30 Octobre'}*.\n\n` +
      `Veuillez contacter d'urgence le secrétariat au 0770 71 98 68.\n\n` +
      `Club Ovia Sport`
  },
  {
    id: 'renouvellement',
    title: '⏳ Renouvellement Annuel de Police',
    subject: 'Renouvellement assurance annuelle',
    getMessage: (athlete, deadline) => 
      `Bonjour,\n\nLa police d'assurance annuelle d'Ovia Sport pour *${athlete.prenom} ${athlete.nom}* arrive à échéance.\n\n` +
      `Pour maintenir la continuité des garanties (Responsabilité Civile & Individuelle Accident lors des entraînements et déplacements), merci de procéder au renouvellement avant le *${deadline || 'fin de semaine'}*.\n\n` +
      `Secrétariat Ovia Sport · 0770 71 98 68`
  }
];

export default function InsuranceWhatsAppModal({ 
  isOpen, 
  onClose, 
  athletes = [],
  onReminderSent
}) {
  const [selectedTemplateId, setSelectedTemplateId] = useState('standard');
  const [deadline, setDeadline] = useState('31 Octobre 2026');
  const [searchFilter, setSearchFilter] = useState('');
  const [sentMap, setSentMap] = useState({});

  if (!isOpen) return null;

  const currentTemplate = TEMPLATES.find(t => t.id === selectedTemplateId) || TEMPLATES[0];

  const filteredAthletes = athletes.filter(ath => {
    const q = searchFilter.toLowerCase().trim();
    if (!q) return true;
    const name = `${ath.nom || ''} ${ath.prenom || ''}`.toLowerCase();
    const phone = (ath.telephone || ath.telephone_parent || '').toLowerCase();
    return name.includes(q) || phone.includes(q);
  });

  const handleSendWhatsApp = (athlete) => {
    const rawPhone = athlete.telephone || athlete.telephone_parent || athlete.contact_urgence;
    if (!rawPhone) {
      toast.error(`Aucun numéro de téléphone disponible pour ${athlete.nom} ${athlete.prenom}`);
      return;
    }

    const cleanPhone = formatWhatsAppPhone(rawPhone);
    const text = currentTemplate.getMessage(athlete, deadline);
    const encoded = encodeURIComponent(text);

    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');

    setSentMap(prev => ({
      ...prev,
      [athlete.id]: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }));

    if (onReminderSent) {
      onReminderSent(athlete, 'WHATSAPP', currentTemplate.title);
    }
  };

  const handleSendSms = (athlete) => {
    const rawPhone = athlete.telephone || athlete.telephone_parent || athlete.contact_urgence;
    if (!rawPhone) {
      toast.error(`Aucun numéro disponible pour ${athlete.nom}`);
      return;
    }
    const text = currentTemplate.getMessage(athlete, deadline);
    window.open(`sms:${rawPhone}?body=${encodeURIComponent(text)}`, '_blank');

    setSentMap(prev => ({
      ...prev,
      [athlete.id]: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }));

    if (onReminderSent) {
      onReminderSent(athlete, 'SMS', currentTemplate.title);
    }
  };

  const handleCopyMessage = (athlete) => {
    const text = currentTemplate.getMessage(athlete, deadline);
    navigator.clipboard.writeText(text);
    toast.success(`Message copié pour ${athlete.nom} !`);
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
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Relances Automatisées WhatsApp & SMS
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-black">
                  {athletes.length} cas
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Envoyez des notifications pré-remplies directement aux tuteurs pour régulariser les assurances.
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

        {/* CONTENU EN 2 COLONNES */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto">
          
          {/* COLONNE GAUCHE : CHOIX TEMPLATE & PARAMÈTRES (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                1. Modèle de Message (Template)
              </label>
              <div className="space-y-2">
                {TEMPLATES.map(tmpl => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(tmpl.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition flex flex-col gap-1 ${
                      selectedTemplateId === tmpl.id
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {tmpl.title}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {tmpl.subject}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Date Limite Mentionnée
              </label>
              <input
                type="text"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                placeholder="Ex: 31 Octobre 2026"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              />
            </div>

            {/* APERÇU EN DIRECT DU MESSAGE */}
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Aperçu du texte WhatsApp généré :
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed font-mono text-[11px]">
                {currentTemplate.getMessage(
                  filteredAthletes[0] || { nom: 'BENALI', prenom: 'Mohamed', groupe: 'Entraînement' },
                  deadline
                )}
              </p>
            </div>
          </div>

          {/* COLONNE DROITE : LISTE DES PARENTS À RELANCER (7 cols) */}
          <div className="lg:col-span-7 flex flex-col h-full space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                2. Destinataires ({filteredAthletes.length})
              </label>
              <input 
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filtrer par nom ou téléphone..."
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[460px]">
              {filteredAthletes.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Aucun athlète non assuré correspondant aux critères.
                </div>
              ) : (
                filteredAthletes.map(ath => {
                  const phone = ath.telephone || ath.telephone_parent || ath.contact_urgence;
                  const isSent = !!sentMap[ath.id];

                  return (
                    <div 
                      key={ath.id}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex items-center justify-between gap-3 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-700 transition"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <strong className="text-sm font-bold text-slate-900 dark:text-white uppercase truncate">
                            {ath.nom} {ath.prenom}
                          </strong>
                          {isSent && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                              ✓ {sentMap[ath.id]}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span>Groupe : {ath.groupes?.nom || ath.groupe || 'Standard'}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                            {phone || 'Sans numéro'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(ath)}
                          title="Copier le texte"
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition"
                        >
                          <Copy size={14} />
                        </button>

                        <button
                          type="button"
                          disabled={!phone}
                          onClick={() => handleSendSms(ath)}
                          title="Envoyer par SMS"
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition disabled:opacity-40"
                        >
                          <Phone size={14} />
                        </button>

                        <button
                          type="button"
                          disabled={!phone}
                          onClick={() => handleSendWhatsApp(ath)}
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition disabled:opacity-40"
                        >
                          <Send size={13} />
                          WhatsApp
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* PIED DE MODALE */}
        <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            <span>Les relances utilisent directement WhatsApp Web ou WhatsApp Mobile sans frais d'API.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold transition"
          >
            Fermer
          </button>
        </div>
      </motion.div>
    </div>
  );
}
