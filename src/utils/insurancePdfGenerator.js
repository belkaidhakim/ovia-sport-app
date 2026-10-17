import jsPDF from 'jspdf';
import { loadClubLogoBase64 } from './pdfHelpers';
import { formatDA } from './formatters';

/**
 * Génère le Bordereau Collectif d'Assurance d'Ovia Sport
 * Format officiel destiné à la compagnie d'assurance ou à la fédération.
 */
export async function generateBordereauCollectifPdf({
  compagnie = 'SAA Assurances',
  numeroPolice = 'POL-2026-COLLECTIF',
  dateDebut = new Date().toISOString().split('T')[0],
  dateFin = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  typeCouverture = 'Responsabilité Civile (RC) + Individuelle Accident (IA)',
  athletes = []
} = {}) {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const logoBase64 = await loadClubLogoBase64();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const drawHeader = (pageNum, totalPages) => {
      // En-tête officiel
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, 'JPEG', 14, 10, 20, 20);
        } catch {}
      }

      // Titres du Club
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text('CLUB SPORTIF DE NATATION - OVIA SPORT', 38, 16);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text('Complexe Sportif · Wilaya de Bouira · Algérie · Tél : 0770 71 98 68', 38, 22);
      doc.text(`Édité le : ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, 38, 27);

      // Titre du Document
      doc.setFillColor(30, 41, 59);
      doc.roundedRect(pageWidth - 95, 10, 81, 20, 3, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(255, 255, 255);
      doc.text('BORDEREAU D\'ASSURANCE', pageWidth - 90, 17);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('SOUSCRIPTION COLLECTIVE SPORTIVE', pageWidth - 90, 24);

      // Encadré Informations Police
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 34, pageWidth - 28, 18, 2, 2, 'FD');

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Compagnie :', 18, 41);
      doc.text('Police N° :', 18, 48);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(compagnie, 42, 41);
      doc.text(numeroPolice, 42, 48);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Période Couverte :', 115, 45);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const debutStr = dateDebut ? new Date(dateDebut).toLocaleDateString('fr-FR') : '-';
      const finStr = dateFin ? new Date(dateFin).toLocaleDateString('fr-FR') : '-';
      doc.text(`Du ${debutStr} au ${finStr}`, 148, 45);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Effectif Assuré :', pageWidth - 65, 41);
      doc.setFontSize(11);
      doc.setTextColor(16, 185, 129); // emerald
      doc.text(`${athletes.length} Athlète(s)`, pageWidth - 65, 49);
    };

    drawHeader(1, 1);

    // Dessin du Tableau manuellement avec pagination
    const startY = 56;
    const rowHeight = 7.5;
    const cols = [
      { header: 'N°', x: 14, w: 14, align: 'center' },
      { header: 'Nom', x: 28, w: 52, align: 'left' },
      { header: 'Prénom', x: 80, w: 52, align: 'left' },
      { header: 'Sexe', x: 132, w: 22, align: 'center' },
      { header: 'Date de Naissance', x: 154, w: 40, align: 'center' },
      { header: 'Lieu de Naissance', x: 194, w: 55, align: 'left' },
      { header: 'Âge', x: 249, w: 34, align: 'center' }
    ];

    const drawTableHeader = (y) => {
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(14, y, pageWidth - 28, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);

      cols.forEach(col => {
        const textX = col.align === 'center' ? col.x + col.w / 2 : (col.align === 'right' ? col.x + col.w - 2 : col.x + 2);
        doc.text(col.header, textX, y + 5.5, { align: col.align });
      });
    };

    let currentY = startY;
    drawTableHeader(currentY);
    currentY += 8;

    athletes.forEach((ath, idx) => {
      // Vérifier saut de page
      if (currentY + rowHeight > pageHeight - 32) {
        doc.addPage();
        drawHeader();
        currentY = startY;
        drawTableHeader(currentY);
        currentY += 8;
      }

      // Fond alterné
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, currentY, pageWidth - 28, rowHeight, 'F');
      }

      // Bordure inférieure fine
      doc.setDrawColor(226, 232, 240);
      doc.line(14, currentY + rowHeight, pageWidth - 14, currentY + rowHeight);

      // Calcul des données
      const dateStr = ath.date_naissance ? new Date(ath.date_naissance).toLocaleDateString('fr-FR') : '-';
      const lieuStr = ath.lieu_naissance || '-';
      let age = '-';
      if (ath.date_naissance) {
        const b = new Date(ath.date_naissance);
        const now = new Date();
        let a = now.getFullYear() - b.getFullYear();
        if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) a--;
        if (a >= 0) age = `${a} ans`;
      }

      const rowValues = [
        (idx + 1).toString(),
        (ath.nom || '').toUpperCase(),
        ath.prenom || '',
        (ath.sexe === 'Femme' || ath.sexe === 'F') ? 'F' : 'M',
        dateStr,
        lieuStr,
        age
      ];

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.8);
      doc.setTextColor(30, 41, 59);

      cols.forEach((col, cIdx) => {
        const textX = col.align === 'center' ? col.x + col.w / 2 : (col.align === 'right' ? col.x + col.w - 2 : col.x + 2);
        if (cIdx === 1) doc.setFont('helvetica', 'bold');
        else doc.setFont('helvetica', 'normal');
        doc.text(rowValues[cIdx], textX, currentY + 5, { align: col.align });
      });

      currentY += rowHeight;
    });

    // Bloc Signatures & Cachets sur la page finale
    const sigY = Math.min(currentY + 6, pageHeight - 24);
    doc.setDrawColor(203, 213, 225);
    doc.line(14, sigY, pageWidth - 14, sigY);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Pour la Compagnie d\'Assurance (Cachet & Signature) :', 20, sigY + 6);
    doc.text('Pour le Club Ovia Sport (Président / Secrétaire) :', pageWidth - 110, sigY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Date de réception et validation : ___ / ___ / 2026', 20, sigY + 11);
    doc.text('Certifié conforme aux listes d\'adhérents enregistrés', pageWidth - 110, sigY + 11);

    const fileName = `Bordereau_Assurance_${compagnie.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
    doc.save(fileName);
    return fileName;
  } catch (err) {
    console.error('Erreur génération Bordereau PDF:', err);
    throw err;
  }
}

/**
 * Génère l'Attestation Individuelle d'Assurance Sportive
 */
export async function generateAttestationAssurancePdf({
  athlete = {},
  assurance = {},
  clubName = 'OVIA SPORT'
} = {}) {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const logoBase64 = await loadClubLogoBase64();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Cadre décoratif
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(1);
    doc.rect(8, 8, pageWidth - 16, 281);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.rect(10, 10, pageWidth - 20, 277);

    // Logo & En-tête
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'JPEG', 18, 16, 25, 25);
      } catch {}
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text('CLUB SPORTIF DE NATATION - OVIA SPORT', 48, 24);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Agréé par le Ministère de la Jeunesse et des Sports · Wilaya de Bouira · Tél : 0770 71 98 68', 48, 30);
    doc.text('Affilié à la Fédération Algérienne de Natation (FAN)', 48, 35);

    // Titre
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(20, 52, pageWidth - 40, 18, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('ATTESTATION D\'ASSURANCE SPORTIVE', pageWidth / 2, 63, { align: 'center' });

    // Corps de l'attestation
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);

    const dateToday = new Date().toLocaleDateString('fr-FR');
    doc.text(`Fait à Bouira, le ${dateToday}`, pageWidth - 25, 80, { align: 'right' });

    doc.text('Le Président du Club Sportif OVIA SPORT soussigné certifie par la présente que :', 20, 92);

    // Encadré Athlète
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(20, 98, pageWidth - 40, 48, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`L'athlète : ${(athlete.nom || '').toUpperCase()} ${athlete.prenom || ''}`, 26, 108);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    const birthDatePart = athlete.date_naissance ? new Date(athlete.date_naissance).toLocaleDateString('fr-FR') : '-';
    const birthLieuPart = athlete.lieu_naissance ? ` à ${athlete.lieu_naissance}` : '';
    doc.text(`• Date & lieu de naissance : ${birthDatePart}${birthLieuPart}`, 26, 116);
    doc.text(`• Sexe : ${athlete.sexe || 'Non spécifié'}`, 26, 123);
    doc.text(`• Groupe / Niveau : ${athlete.groupes?.nom || athlete.groupe || 'Standard'}`, 26, 130);
    doc.text(`• Identifiant / QR Token : ${athlete.token_qr || athlete.id?.substring(0, 12)}`, 26, 137);

    // Détails de la Couverture
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 41, 59);
    doc.text(
      'Est régulièrement inscrit(e) et couvert(e) par la police d\'assurance souscrite par le club dans le cadre ' +
      'de la pratique des activités nautiques et sportives organisées sous l\'égide du club :',
      20,
      156,
      { maxWidth: pageWidth - 40, lineHeightFactor: 1.4 }
    );

    // Tableau Récapitulatif Police
    doc.setFillColor(238, 242, 255);
    doc.setDrawColor(199, 210, 254);
    doc.roundedRect(20, 172, pageWidth - 40, 45, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(67, 56, 202); // indigo-700
    doc.text('DÉTAILS DU CONTRAT D\'ASSURANCE :', 26, 180);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`• Compagnie Assureur : ${assurance.compagnie || 'SAA Assurances'}`, 26, 188);
    doc.text(`• Police / Contrat N° : ${assurance.numero_police || 'POL-COLLECTIF-2026'}`, 26, 195);
    const deb = assurance.date_debut ? new Date(assurance.date_debut).toLocaleDateString('fr-FR') : '-';
    const fin = assurance.date_fin ? new Date(assurance.date_fin).toLocaleDateString('fr-FR') : '-';
    doc.text(`• Période de validité : Du ${deb} au ${fin}`, 26, 202);
    doc.text(`• Nature de la garantie : ${assurance.type_couverture || 'Responsabilité Civile & Individuelle Accident'}`, 26, 209);

    // Mention légale
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Cette attestation est délivrée à l\'intéressé(e) pour servir et valoir ce que de droit, ' +
      'notamment auprès des instances sportives, ligues régionales et établissements scolaires.',
      20,
      228,
      { maxWidth: pageWidth - 40, lineHeightFactor: 1.4 }
    );

    // Signature et Cachet
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Le Président du Club :', pageWidth - 70, 248);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('(Signature et Cachet Officiel)', pageWidth - 70, 254);

    const fileName = `Attestation_Assurance_${(athlete.nom || '').toUpperCase()}_${Date.now()}.pdf`;
    doc.save(fileName);
    return fileName;
  } catch (err) {
    console.error('Erreur attestation PDF:', err);
    throw err;
  }
}

/**
 * Génère le Bordereau Officiel de Déclaration d'Assurance Fédérale (FAN & DJS)
 * Conforme aux exigences de la Fédération Algérienne de Natation et de la DJS Bouira.
 */
export async function generateBordereauFederalFanPdf({
  compagnie = 'SAA Assurances',
  numeroPolice = 'CONV-FAN-OVIA-2026',
  saison = '2026 / 2027',
  athletes = []
} = {}) {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const logoBase64 = await loadClubLogoBase64();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const drawHeader = (pageNum, totalPages) => {
      // En-tête national & fédéral
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE', pageWidth / 2, 10, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text('MINISTÈRE DE LA JEUNESSE ET DES SPORTS · DIRECTION DE LA JEUNESSE ET DES SPORTS (DJS BOUIRA)', pageWidth / 2, 15, { align: 'center' });
      doc.text('FÉDÉRATION ALGÉRIENNE DE NATATION (FAN) · LIGUE DE NATATION DE LA WILAYA DE BOUIRA', pageWidth / 2, 19, { align: 'center' });

      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.line(14, 22, pageWidth - 14, 22);

      // Logo Club
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, 'JPEG', 14, 25, 16, 16);
        } catch {}
      }

      // Identité Club
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('CLUB SPORTIF AMATEUR · OVIA SPORT (CSA OVIA)', 34, 30);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Affiliation FAN N° : FAN-BOU-044/2026 · Wilaya de Bouira · Saison Sportive : ${saison}`, 34, 35);
      doc.text(`Compagnie Assureur Conventionnée : ${compagnie} · Police Groupe N° : ${numeroPolice}`, 34, 39);

      // Titre Encadré Officiel
      doc.setFillColor(15, 23, 42);
      doc.roundedRect(pageWidth - 95, 25, 81, 16, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(255, 255, 255);
      doc.text('BORDEREAU D\'ASSURANCE FÉDÉRALE', pageWidth - 90, 31);
      doc.setFontSize(7.5);
      doc.setTextColor(56, 189, 248);
      doc.text('DÉCLARATION COLLECTIVE DES ADHÉRENTS', pageWidth - 90, 37);

      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${pageNum} / ${totalPages} · Édité le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 14, 45, { align: 'right' });
    };

    const startY = 48;
    const rowHeight = 7.5;
    const rowsPerPage = 14;
    const totalPages = Math.ceil(athletes.length / rowsPerPage) || 1;

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) doc.addPage();
      drawHeader(page + 1, totalPages);

      // Table Header
      let y = startY;
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, pageWidth - 28, 8, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(14, y, pageWidth - 28, 8, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);

      const cols = [
        { label: 'N°', x: 18, width: 10 },
        { label: 'N° LICENCE FAN', x: 30, width: 30 },
        { label: 'NOM & PRÉNOM', x: 62, width: 55 },
        { label: 'DATE NAISS.', x: 120, width: 25 },
        { label: 'SEXE', x: 148, width: 15 },
        { label: 'CATÉGORIE FÉDÉRALE', x: 165, width: 40 },
        { label: 'N° QUITTANCE / POLICE', x: 208, width: 45 },
        { label: 'VISA MÉDECIN', x: 256, width: 25 }
      ];

      cols.forEach(col => {
        doc.text(col.label, col.x, y + 5.5);
      });

      // Rows
      y += 8;
      const pageAthletes = athletes.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

      pageAthletes.forEach((ath, idx) => {
        const globalIdx = page * rowsPerPage + idx + 1;
        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(14, y, pageWidth - 28, rowHeight, 'F');
        }
        doc.setDrawColor(226, 232, 240);
        doc.rect(14, y, pageWidth - 28, rowHeight, 'S');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);

        // N°
        doc.text(String(globalIdx), cols[0].x, y + 5);

        // N° Licence FAN
        const licenceFan = ath.token_qr || `FAN-${new Date().getFullYear()}-${String(globalIdx).padStart(4, '0')}`;
        doc.setFont('courier', 'bold');
        doc.text(licenceFan.substring(0, 16), cols[1].x, y + 5);
        doc.setFont('helvetica', 'normal');

        // Nom & Prénom
        doc.setFont('helvetica', 'bold');
        doc.text(`${(ath.nom || '').toUpperCase()} ${ath.prenom || ''}`.substring(0, 30), cols[2].x, y + 5);
        doc.setFont('helvetica', 'normal');

        // Date Naissance
        const bDate = ath.date_naissance ? new Date(ath.date_naissance).toLocaleDateString('fr-FR') : '-';
        doc.text(bDate, cols[3].x, y + 5);

        // Sexe
        doc.text(ath.sexe === 'Femme' || ath.sexe === 'F' ? 'F' : 'M', cols[4].x, y + 5);

        // Catégorie
        const cat = ath.categorie || ath.groupes?.nom || ath.groupe || 'Standard';
        doc.text(cat.substring(0, 24), cols[5].x, y + 5);

        // N° Quittance / Police
        const policeNum = ath.assurance?.numero_police || numeroPolice || 'En attente';
        doc.text(policeNum.substring(0, 24), cols[6].x, y + 5);

        // Visa Médecin
        doc.setFontSize(7);
        doc.setTextColor(16, 185, 129);
        doc.text(ath.medical_ok !== false ? 'Apte [✓]' : 'En attente', cols[7].x, y + 5);
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(8);

        y += rowHeight;
      });

      // Cadre des 3 Visas et Signatures officielles sur chaque page
      const footerBoxY = pageHeight - 34;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225);
      doc.rect(14, footerBoxY, pageWidth - 28, 26, 'S');

      const colW = (pageWidth - 28) / 3;

      // 1. Médecin du Club
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('1. VISA DU MÉDECIN DU CLUB', 18, footerBoxY + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Certifie l\'aptitude médicale des athlètes', 18, footerBoxY + 11);
      doc.text('(Signature et Cachet du Médecin)', 18, footerBoxY + 22);

      // Séparateur 1
      doc.line(14 + colW, footerBoxY, 14 + colW, footerBoxY + 26);

      // 2. Président Ovia Sport
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('2. LE PRÉSIDENT DU CLUB (CSA)', 18 + colW, footerBoxY + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Déclare l\'exactitude des informations et le paiement de la prime', 18 + colW, footerBoxY + 11);
      doc.text('(Signature et Cachet Officiel Ovia Sport)', 18 + colW, footerBoxY + 22);

      // Séparateur 2
      doc.line(14 + colW * 2, footerBoxY, 14 + colW * 2, footerBoxY + 26);

      // 3. Visa Ligue / DJS
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('3. VISA LIGUE FAN / DJS BOUIRA', 18 + colW * 2, footerBoxY + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Homologation fédérale et délivrance des licences', 18 + colW * 2, footerBoxY + 11);
      doc.text('(Cachet de la Ligue de Natation)', 18 + colW * 2, footerBoxY + 22);
    }

    const fileName = `Bordereau_Federal_FAN_OviaSport_${Date.now()}.pdf`;
    doc.save(fileName);
    return fileName;
  } catch (err) {
    console.error('Erreur génération Bordereau FAN PDF:', err);
    throw err;
  }
}

