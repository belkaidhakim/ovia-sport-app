import React from 'react';
import { CheckCircle2, MessageCircle } from 'lucide-react';
import { Button } from '../ui';
import { formatDA, formatWhatsAppPhone } from '../../utils/formatters';

export default function ImpayesTable({
  expiredList = [],
  cotisationAdhesion = 3000,
  isDark = false
}) {
  if (expiredList.length === 0) {
    return (
      <div className="text-center py-8 text-emerald-500 font-bold">
        <CheckCircle2 size={32} className="mx-auto mb-2 opacity-50" />
        Aucun impayé !
      </div>
    );
  }

  return (
    <div className="table-responsive overflow-x-auto">
      <table style={{ minWidth: '700px' }}>
        <thead>
          <tr>
            <th>Adhérent</th>
            <th>Groupe (Tarif)</th>
            <th>Date d'expiration</th>
            <th>Retard</th>
            <th style={{ textAlign: 'right' }}>Relance Rapide</th>
          </tr>
        </thead>
        <tbody>
          {expiredList.map((cotis) => {
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
            const tarif = cotisationAdhesion || 3000;
            const retardDays = Math.max(
              0,
              Math.floor((new Date() - new Date(cotis.periode_couverte_fin)) / (1000 * 60 * 60 * 24))
            );

            return (
              <tr
                key={`imp-${cotis.id}`}
                style={{
                  backgroundColor: isDark
                    ? 'rgba(245, 158, 11, 0.05)'
                    : 'rgba(245, 158, 11, 0.03)'
                }}
              >
                <td className="font-semibold text-sm">{athleteName}</td>
                <td className="text-xs text-muted">
                  {cotis.athletes?.groupes?.nom || cotis.athletes?.groupe || '-'} <br />
                  <span className="text-[10px] text-red-400">Dû : {formatDA(tarif)}</span>
                </td>
                <td className="text-xs font-bold text-orange-500">{cotis.endDateStr}</td>
                <td className="text-xs font-bold text-red-500">{retardDays} jour(s)</td>
                <td style={{ textAlign: 'right' }}>
                  {wpPhone ? (
                    <a
                      href={`https://wa.me/${wpPhone}?text=${encodeURIComponent(
                        `Bonjour ${cotis.athletes?.prenom}, sauf erreur de notre part, votre cotisation Ovia Sport de ${formatDA(
                          tarif
                        )} a expiré le ${cotis.endDateStr}. Merci de régulariser la situation à la réception. Sportivement.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button
                        variant="secondary"
                        style={{
                          backgroundColor: 'rgba(37, 211, 102, 0.1)',
                          color: '#25D366',
                          borderColor: 'transparent',
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.75rem'
                        }}
                      >
                        <MessageCircle size={14} style={{ marginRight: '6px' }} /> Relancer
                      </Button>
                    </a>
                  ) : (
                    <span className="text-[10px] text-muted italic">Pas de numéro</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
