import React from 'react';
import { Trash2 } from 'lucide-react';
import { Badge } from '../ui';
import { formatDA } from '../../utils/formatters';

export default function DepensesTable({ depenses = [], onDeleteClick }) {
  if (depenses.length === 0) {
    return (
      <div className="text-center py-8 text-muted text-sm">
        Aucune dépense trouvée.
      </div>
    );
  }

  return (
    <div className="table-responsive overflow-x-auto">
      <table style={{ minWidth: '700px' }}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Catégorie</th>
            <th>Description</th>
            <th>Montant</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {depenses.map((dep) => (
            <tr key={dep.id}>
              <td className="text-xs text-muted">
                {new Date(dep.date_depense).toLocaleDateString('fr-FR')}
              </td>
              <td>
                <Badge style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                  {dep.categorie}
                </Badge>
              </td>
              <td className="text-sm">{dep.description}</td>
              <td className="font-bold text-red-500">- {formatDA(dep.montant)}</td>
              <td style={{ textAlign: 'right' }}>
                <div className="flex justify-end items-center gap-1.5">
                  <button
                    onClick={() => onDeleteClick(dep)}
                    className="btn-secondary flex items-center justify-center p-1.5 rounded text-red-500 hover:text-red-600 hover:bg-red-500/10 cursor-pointer"
                    title="Supprimer cette dépense"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
