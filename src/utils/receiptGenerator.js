/**
 * =====================================================
 * OVIA SPORT — Reçu de Paiement PDF Generator
 * =====================================================
 */

import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import { formatDA } from './formatters';
import { loadClubLogoBase64 } from './pdfHelpers';

export async function generatePDFReceipt(cotisation, autoDownload = false) {
  const toastId = toast.loading('Préparation du reçu...');
  try {
    let logoBase64 = null;
    try {
      logoBase64 = await loadClubLogoBase64();
    } catch {}

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const receiptNumber = `OVS-REC-${
      cotisation.id ? cotisation.id.substring(0, 8).toUpperCase() : Date.now().toString().slice(-6)
    }`;
    const datePaiementStr = new Date(cotisation.date_paiement).toLocaleDateString('fr-FR');
    const endDateStr = new Date(cotisation.periode_couverte_fin).toLocaleDateString('fr-FR');
    const athleteFullName = `${(cotisation.athletes?.nom || 'NOM').toUpperCase()} ${
      cotisation.athletes?.prenom || ''
    }`;

    // Header bar
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 5, 'F');
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 5, 210, 2, 'F');
    if (logoBase64) doc.addImage(logoBase64, 'JPEG', 18, 12, 22, 22);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42);
    doc.text('OVIA SPORT', 45, 18);
    doc.setFontSize(8.5);
    doc.setTextColor(16, 185, 129);
    doc.text('REÇU DE PAIEMENT', 45, 23.5);

    // Cadre Numéro Reçu
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(140, 11, 52, 24, 3, 3, 'F');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(receiptNumber, 166, 18, { align: 'center' });
    doc.setTextColor(100, 116, 139);
    doc.text(`Date: ${datePaiementStr}`, 166, 26, { align: 'center' });

    doc.setDrawColor(226, 232, 240);
    doc.line(18, 40, 192, 40);

    // Section Adhérent
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('ADHÉRENT :', 18, 50);
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129);
    doc.text(athleteFullName, 18, 58);

    // Section Détails
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('DÉTAILS DU RÈGLEMENT :', 18, 70);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Montant payé :', 18, 80);
    doc.setTextColor(15, 23, 42);
    doc.text(`${formatDA(cotisation.montant_paye)}`, 60, 80);

    doc.setTextColor(100, 116, 139);
    doc.text('Période couverte :', 18, 88);
    doc.setTextColor(15, 23, 42);
    doc.text(`Jusqu'au ${endDateStr}`, 60, 88);

    doc.setTextColor(100, 116, 139);
    doc.text('Mode de paiement :', 18, 96);
    doc.setTextColor(15, 23, 42);
    doc.text(cotisation.mode_paiement || 'Espèces', 60, 96);

    // Cachet & Signature
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(110, 120, 82, 40, 3, 3, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(110, 120, 82, 40, 3, 3, 'S');
    doc.setFontSize(8);
    doc.text('Cachet & Signature Ovia Sport :', 116, 127);

    // Footer
    doc.setDrawColor(226, 232, 240);
    doc.line(18, 275, 192, 275);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Reçu généré le ${new Date().toLocaleDateString('fr-FR')} - Ne peut être modifié.`,
      105,
      280,
      { align: 'center' }
    );

    if (autoDownload) {
      doc.save(`${receiptNumber}.pdf`);
      toast.success('Reçu téléchargé !', { id: toastId });
    } else {
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      toast.dismiss(toastId);
    }
  } catch (e) {
    console.error(e);
    toast.error('Erreur PDF', { id: toastId });
  }
}
