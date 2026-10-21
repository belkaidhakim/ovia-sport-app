import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../supabaseClient';

export function BulkGroupModal({ isOpen, onClose, selectedAthletes, groupes, onComplete }) {
  const [selectedGroup, setSelectedGroup] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleApply = async () => {
    if (!selectedGroup) {
      toast.error('Veuillez sélectionner un groupe.');
      return;
    }
    setLoading(true);
    try {
      const g = groupes.find(item => item.id === selectedGroup);
      const { error } = await supabase
        .from('athletes')
        .update({ groupe_id: selectedGroup, groupe: g?.nom || null })
        .in('id', selectedAthletes);
      if (error) throw error;
      toast.success('Groupes mis à jour !');
      onComplete();
      onClose();
    } catch (e) {
      toast.error('Erreur: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
          Changer le groupe d'entraînement
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Sélectionnez le nouveau groupe pour les <strong>{selectedAthletes.length} membres</strong> sélectionnés.
        </p>
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm mb-4 outline-none text-slate-900 dark:text-white"
        >
          <option value="">Sélectionner un groupe...</option>
          {groupes.map(g => (
            <option key={g.id} value={g.id}>{g.nom}</option>
          ))}
        </select>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Annuler
          </button>
          <button
            onClick={handleApply}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
          >
            {loading ? 'Application...' : 'Appliquer'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function BulkCotisationModal({ isOpen, onClose, selectedAthletes, onComplete }) {
  const [montant, setMontant] = useState(3000);
  const [mode, setMode] = useState('Espèces');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      const records = selectedAthletes.map(athleteId => ({
        athlete_id: athleteId,
        montant_paye: montant,
        date_paiement: now.toISOString(),
        periode_couverte_fin: nextMonth.toISOString(),
        mode_paiement: mode
      }));
      const { error } = await supabase.from('cotisations').insert(records);
      if (error) throw error;

      // Réactivation automatique des cartes d'accès
      try {
        await supabase
          .from('cartes_acces')
          .update({
            statut: 'ACTIVE',
            date_dernier_paiement: now.toISOString()
          })
          .in('athlete_id', selectedAthletes);
      } catch (cardErr) {
        console.warn('Erreur mise à jour cartes_acces:', cardErr);
      }

      toast.success(`Cotisations validées et accès réactivés pour ${selectedAthletes.length} membres !`);
      onComplete();
      onClose();
    } catch (e) {
      toast.error('Erreur: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
          Règlement groupé des cotisations
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Valider la cotisation mensuelle pour les <strong>{selectedAthletes.length} membres</strong> sélectionnés.
        </p>
        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Montant par nageur (DA) :
            </label>
            <input
              type="number"
              value={montant}
              onChange={(e) => setMontant(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Mode de règlement :
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none"
            >
              <option value="Espèces">Espèces</option>
              <option value="Virement">Virement bancaire</option>
              <option value="Chèque">Chèque</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer"
          >
            {loading ? 'Validation...' : 'Confirmer le règlement'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function BulkMessageModal({ isOpen, onClose, selectedAthletes, athletes }) {
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleCopy = () => {
    const selectedList = athletes.filter(a => selectedAthletes.includes(a.id));
    const phones = selectedList.map(a => a.telephone).filter(Boolean).join(', ');
    navigator.clipboard.writeText(`Numéros : ${phones}\n\n${message}`);
    toast.success('Numéros et message copiés dans le presse-papier !');
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-purple-600" /> Communication Groupée
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Envoi aux <strong>{selectedAthletes.length} membres</strong> sélectionnés.
        </p>
        <div className="mb-3">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
            Message :
          </label>
          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Écrivez votre annonce ou consigne ici..."
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none"
          />
        </div>
        <div className="flex justify-between items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
          >
            Copier SMS & Numéros
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
