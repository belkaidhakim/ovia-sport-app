import React from 'react';
import { Edit, Download, MessageCircle, Trash2 } from 'lucide-react';
import { Badge } from '../ui';
import { formatDA, formatWhatsAppPhone } from '../../utils/formatters';

const getPaymentModeBadge = (mode) => {
  switch (mode) {
    case 'BaridiMob':
      return (
        <Badge style={{ backgroundColor: 'rgba(234, 179, 8, 0.15)', color: '#ca8a04', borderColor: 'transparent' }}>
          🟡 BaridiMob
        </Badge>
      );
    case 'Virement CCP':
      return (
        <Badge style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#2563eb', borderColor: 'transparent' }}>
          🔵 CCP
        </Badge>
      );
    case 'Chèque':
      return (
        <Badge style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#7c3aed', borderColor: 'transparent' }}>
          🟣 Chèque
        </Badge>
      );
    default:
      return (
        <Badge style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#059669', borderColor: 'transparent' }}>
          🟢 Espèces
        </Badge>
      );
  }
};

export default function CotisationsTable({
  cotisations = [],
  onEdit,
  onGenerateReceipt,
  onDeleteClick
}) {
  if (cotisations.length === 0) {
    return (
      <div className="text-center py-8 text-muted text-sm">
        Aucun encaissement trouvé.
      </div>
    );
  }

  return (
    <div className="table-responsive overflow-x-auto">
      <table style={{ minWidth: '850px' }}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Adhérent</th>
            <th>Montant</th>
            <th>Mode (Tags)</th>
            <th>Période Couverte</th>
            <th style={{ textAlign: 'right' }}>Actions (PDF / WA)</th>
          </tr>
        </thead>
        <tbody>
          {cotisations.map((cotis) => {
            const athleteName = cotis.athletes
              ? `${cotis.athletes.nom} ${cotis.athletes.prenom}`
              : 'Inconnu';
            const wpPhone = cotis.athletes
              ? formatWhatsAppPhone(
                  cotis.athletes.telephone ||
                    cotis.athletes.contact_urgence ||
                    cotis.athletes.telephone_tuteur
                )
              : null;

            return (
              <tr key={cotis.id}>
                <td className="text-xs text-muted">
                  {new Date(cotis.date_paiement).toLocaleDateString('fr-FR')}
                </td>
                <td className="font-semibold text-sm">{athleteName}</td>
                <td className="font-bold text-emerald-500">{formatDA(cotis.montant_paye)}</td>
                <td>{getPaymentModeBadge(cotis.mode_paiement)}</td>
                <td className="text-xs">
                  Jusqu'au {new Date(cotis.periode_couverte_fin).toLocaleDateString('fr-FR')}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div className="flex justify-end items-center gap-1.5">
                    <button
                      onClick={() => onEdit(cotis)}
                      className="btn-secondary flex items-center justify-center p-1.5 rounded text-amber-500 hover:bg-amber-500/10 cursor-pointer"
                      title="Modifier cet encaissement"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => onGenerateReceipt(cotis, true)}
                      className="btn-secondary flex items-center justify-center p-1.5 rounded text-indigo-500 hover:bg-indigo-500/10 cursor-pointer"
                      title="Télécharger Reçu PDF"
                    >
                      <Download size={14} />
                    </button>
                    {wpPhone && (
                      <a
                        href={`https://wa.me/${wpPhone}?text=${encodeURIComponent(
                          `Bonjour ${cotis.athletes?.prenom}, voici la confirmation de votre paiement de ${formatDA(
                            cotis.montant_paye
                          )} pour la cotisation Ovia Sport (valable jusqu'au ${new Date(
                            cotis.periode_couverte_fin
                          ).toLocaleDateString('fr-FR')}). Merci !`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary flex items-center justify-center p-1.5 rounded text-[#25D366] hover:bg-[#25D366]/10"
                        title="Envoyer Reçu WhatsApp"
                      >
                        <MessageCircle size={14} />
                      </a>
                    )}
                    <button
                      onClick={() => onDeleteClick(cotis)}
                      className="btn-secondary flex items-center justify-center p-1.5 rounded text-red-500 hover:text-red-600 hover:bg-red-500/10 cursor-pointer"
                      title="Supprimer cet encaissement"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
