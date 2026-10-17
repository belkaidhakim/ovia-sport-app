import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import { 
  LogOut, CreditCard, CheckCircle2, AlertTriangle, 
  User, Shield, ShieldCheck, ChevronRight, Phone, Calendar, Megaphone,
  TrendingUp, Timer, Award, FileText, Globe, Waves, Download, 
  Maximize2, Copy, Check, Clock, MapPin, Sparkles, RefreshCw, X,
  ArrowRight, ExternalLink, Info, Flame
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import { SWIMMING_EVENTS, getSwimmingCategory } from '../utils/swimmingCategories';
import { formatDA, formatName, formatWhatsAppPhone } from '../utils/formatters';
import { loadClubLogoBase64 } from '../utils/pdfHelpers';
import { generateBadgeSheetPDF } from '../utils/badgeSheetPdfGenerator';

const translations = {
  fr: {
    // Auth
    portalBadge: 'PORTAIL MEMBRE OFFICIEL',
    loginTitle: 'Espace Adhérent',
    loginSubtitle: 'Accédez à votre badge numérique, vos cotisations et vos chronos',
    identifiantLabel: 'Identifiant / Matricule ou Téléphone',
    identifiantPlaceholder: 'Ex: OVS-1234, 0555..., ou votre Nom',
    pinLabel: 'Date de naissance (Code PIN)',
    loginBtn: 'Accéder à mon Espace',
    supportHelp: 'Besoin d\'aide pour vous connecter ?',
    contactAdmin: 'Contacter le secrétariat (WhatsApp)',
    loginError: 'Identifiant ou date de naissance incorrects.',
    welcome: 'Bienvenue',

    // Nav
    tabCard: 'Mon Badge & Statut',
    tabPerfs: 'Mes Chronos & PB',
    tabPayments: 'Mes Cotisations & Reçus',
    tabClub: 'Actualités du Club',
    tabInfo: 'Horaires & Contact',
    logout: 'Déconnexion',

    // Card & Status
    memberCardTitle: 'Carte Officielle d\'Adhérent',
    digitalBadge: 'PASS NUMÉRIQUE QR',
    statusActive: 'Abonnement Actif',
    statusExpired: 'Abonnement Expiré',
    statusPending: 'Sans Abonnement',
    validUntil: 'Valide jusqu\'au',
    daysRemaining: 'jours restants',
    expiredSince: 'Expiré depuis',
    days: 'jours',
    renewCTA: 'Renouveler ma cotisation',
    fullscreenQR: 'Agrandir QR Code (Mode Scanner)',
    downloadBadgePDF: 'Télécharger mon Badge (PDF)',
    copyMatricule: 'Copier Matricule',
    copied: 'Copié !',
    medicalCert: 'Certificat Médical',
    medicalValid: 'Conforme & Validé',
    medicalMissing: 'À renouveler / Déposer',
    medicalHintValid: 'Votre dossier médical est à jour.',
    medicalHintMissing: 'Pensez à déposer votre certificat médical au secrétariat.',
    groupTitle: 'Mon Groupe & Entraînement',
    coach: 'Entraîneur',
    schedules: 'Horaires',
    pool: 'Bassin',
    category: 'Catégorie Sportive',

    // Attendance
    attendanceTitle: 'Assiduité & Présences aux Bassins',
    thisMonth: 'Ce mois-ci',
    totalSessions: 'Séances pointées',
    lastSession: 'Dernière séance',
    noAttendance: 'Aucune présence enregistrée au scanner pour le moment.',

    // Payments
    paymentsTitle: 'Historique des Règlements',
    paymentsSubtitle: 'Consultez vos cotisations et téléchargez vos reçus officiels',
    paidOn: 'Payé le',
    coveredPeriod: 'Période couverte',
    method: 'Mode de règlement',
    receiptDownload: 'Télécharger Reçu (PDF)',
    noPayments: 'Aucun paiement enregistré pour cet adhérent.',
    paymentSettled: 'Réglé',

    // Performances
    perfTitle: 'Évolution de vos Performances',
    perfSubtitle: 'Suivi de vos records personnels (Personal Bests)',
    event: 'Épreuve',
    bestTime: 'Meilleur Temps (PB)',
    chartTitle: 'Progression Chronométrique',
    noPerfs: 'Aucun chrono enregistré pour le moment. Donnez le meilleur aux entraînements !',

    // Announcements
    newsTitle: 'Actualités & Vie du Club',
    newsSubtitle: 'Informations importantes et événements à venir',

    // Info
    infoTitle: 'Informations Pratiques & Contact',
    receptionHours: 'Accueil & Secrétariat',
    receptionDetails: 'Samedi au Jeudi : 08h30 - 19h00',
    emergencyContact: 'Assistance Rapide',
  },
  ar: {
    // Auth
    portalBadge: 'البوابة الرسمية للمنخرطين',
    loginTitle: 'فضاء المنخرط',
    loginSubtitle: 'الوصول إلى بطاقتك الرقمية، الاشتراكات والأوقات القياسية',
    identifiantLabel: 'رقم التسجيل أو الهاتف أو اللقب',
    identifiantPlaceholder: 'مثال: OVS-1234 أو 0555... أو اللقب',
    pinLabel: 'تاريخ الميلاد (الرمز السري)',
    loginBtn: 'الدخول إلى فضاءي',
    supportHelp: 'هل تحتاج إلى مساعدة في تسجيل الدخول؟',
    contactAdmin: 'تواصل مع أمانة النادي (واتساب)',
    loginError: 'المعلومات غير مطابقة لتاريخ الميلاد.',
    welcome: 'مرحباً بك',

    // Nav
    tabCard: 'بطاقتي وحالتي',
    tabPerfs: 'الأوقات القياسية (الكرونو)',
    tabPayments: 'الاشتراكات والوصولات',
    tabClub: 'أخبار النادي',
    tabInfo: 'المواعيد والتواصل',
    logout: 'تسجيل الخروج',

    // Card & Status
    memberCardTitle: 'بطاقة العضوية الرسمية',
    digitalBadge: 'بطاقة المرور الرقمية QR',
    statusActive: 'اشتراك سارٍ ونشط',
    statusExpired: 'الاشتراك منتهي الصلاحية',
    statusPending: 'بدون اشتراك نشط',
    validUntil: 'صالح حتى',
    daysRemaining: 'أيام متبقية',
    expiredSince: 'منتهي منذ',
    days: 'أيام',
    renewCTA: 'تجديد الاشتراك عبر واتساب',
    fullscreenQR: 'تكبير رمز QR (لمسحه بالمدخل)',
    downloadBadgePDF: 'تحميل بطاقتي (PDF)',
    copyMatricule: 'نسخ رقم التسجيل',
    copied: 'تم النسخ !',
    medicalCert: 'الشهادة الطبية',
    medicalValid: 'مقبولة وسارية',
    medicalMissing: 'يجب تجديدها / تسليمها',
    medicalHintValid: 'ملفك الطبي سليم وموافق عليه.',
    medicalHintMissing: 'يرجى تقديم الشهادة الطبية للأمانة.',
    groupTitle: 'الفوج ومواعيد التدريب',
    coach: 'المدرب',
    schedules: 'المواعيد',
    pool: 'المسبح',
    category: 'الفئة الرياضية',

    // Attendance
    attendanceTitle: 'المواظبة والحضور للحصص',
    thisMonth: 'هذا الشهر',
    totalSessions: 'مجموع الحصص المسجلة',
    lastSession: 'آخر حضور',
    noAttendance: 'لم يتم تسجيل أي حضور عبر الماسح حتى الآن.',

    // Payments
    paymentsTitle: 'سجل الاشتراكات والمدفوعات',
    paymentsSubtitle: 'اطّلع على تاريخ اشتراكاتك وقم بتحميل الوصولات الرسمية',
    paidOn: 'دُفع بتاريخ',
    coveredPeriod: 'الفترة المغطاة',
    method: 'طريقة الدفع',
    receiptDownload: 'تحميل الوصل (PDF)',
    noPayments: 'لا توجد مدفوعات مسجلة لهذا المنخرط.',
    paymentSettled: 'مدفوع بالكامل',

    // Performances
    perfTitle: 'تطور أدائك الرياضي',
    perfSubtitle: 'متابعة أرقامك القياسية الفردية (PB)',
    event: 'التخصص',
    bestTime: 'أفضل توقيت (PB)',
    chartTitle: 'المنحنى الزمني للكرونو',
    noPerfs: 'لم يتم تسجيل أي توقيت بعد. واصل التدريب بجد!',

    // Announcements
    newsTitle: 'أخبار النادي والإعلانات',
    newsSubtitle: 'معلومات هامة ومواعيد المنافسات القادمة',

    // Info
    infoTitle: 'معلومات عامة وتواصل',
    receptionHours: 'استقبال الأمانة',
    receptionDetails: 'من السبت إلى الخميس: 08:30 - 19:00',
    emergencyContact: 'المساعدة السريعة',
  }
};

export default function MemberPortal() {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('ovs_member_lang') || 'fr';
    } catch {
      return 'fr';
    }
  });

  const t = translations[lang] || translations.fr;

  const handleLanguageChange = (newLang) => {
    setLang(newLang);
    try {
      localStorage.setItem('ovs_member_lang', newLang);
    } catch {}
  };

  const [session, setSession] = useState(() => {
    try {
      const stored = localStorage.getItem('member_session');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [loginData, setLoginData] = useState({ identifiant: '', date_naissance: '' });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('card');
  const [performances, setPerformances] = useState([]);
  const [presences, setPresences] = useState([]);
  const [showFullscreenQR, setShowFullscreenQR] = useState(false);
  const [copiedMatricule, setCopiedMatricule] = useState(false);
  const [isDownloadingBadge, setIsDownloadingBadge] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (session?.id) {
      fetchAthleteData(session.id);
      loadPerformances(session.id);
      fetchPresences(session.id);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAthleteData = async (athleteId) => {
    try {
      setIsRefreshing(true);
      const { data, error } = await supabase
        .from('athletes')
        .select(`
          *,
          cotisations (*),
          cartes_acces (*),
          groupes (*)
        `)
        .eq('id', athleteId)
        .single();
      
      if (!error && data) {
        setSession(data);
        localStorage.setItem('member_session', JSON.stringify(data));
      } else if (error && error.code === 'PGRST116') {
        handleLogout();
      }
    } catch (e) {
      console.error('fetchAthleteData error:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchPresences = async (athleteId) => {
    try {
      const { data } = await supabase
        .from('presences')
        .select('*')
        .eq('athlete_id', athleteId)
        .order('date_scan', { ascending: false })
        .limit(30);
      setPresences(data || []);
    } catch (err) {
      console.warn('Presences fetch:', err);
    }
  };

  const loadPerformances = (athleteId) => {
    try {
      const localSwim = localStorage.getItem(`scb_athlete_perfs_${athleteId}`) || localStorage.getItem(`ovs_athlete_perfs_${athleteId}`);
      if (localSwim) {
        const parsed = JSON.parse(localSwim);
        if (Array.isArray(parsed)) setPerformances(parsed);
      }
    } catch (e) {
      setPerformances([]);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('athletes')
        .select(`
          *,
          cotisations (*),
          cartes_acces (*),
          groupes (*)
        `)
        .eq('date_naissance', loginData.date_naissance);

      if (error) throw error;

      if (data && data.length > 0) {
        const queryClean = String(loginData.identifiant).trim().toLowerCase();
        const queryDigits = queryClean.replace(/\D/g, '');

        const matched = data.find(a => {
          const qrToken = String(a.token_qr || '').trim().toLowerCase();
          const nom = String(a.nom || '').trim().toLowerCase();
          const prenom = String(a.prenom || '').trim().toLowerCase();
          const phone = String(a.telephone || '').replace(/\D/g, '');
          const phoneTuteur = String(a.telephone_tuteur || '').replace(/\D/g, '');

          if (qrToken && qrToken === queryClean) return true;
          if (queryDigits && queryDigits.length >= 8) {
            if (phone.includes(queryDigits) || queryDigits.includes(phone)) return true;
            if (phoneTuteur.includes(queryDigits) || queryDigits.includes(phoneTuteur)) return true;
          }
          if (nom === queryClean || prenom === queryClean) return true;
          if (`${nom} ${prenom}` === queryClean || `${prenom} ${nom}` === queryClean) return true;

          return false;
        });

        if (matched) {
          setSession(matched);
          localStorage.setItem('member_session', JSON.stringify(matched));
          loadPerformances(matched.id);
          fetchPresences(matched.id);
          toast.success(`${t.welcome} ${matched.prenom} !`);
        } else {
          toast.error(t.loginError);
        }
      } else {
        toast.error(t.loginError);
      }
    } catch (err) {
      console.error(err);
      toast.error(t.loginError);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('member_session');
    setPerformances([]);
    setPresences([]);
    toast.success(lang === 'ar' ? 'تم تسجيل الخروج' : 'Déconnexion réussie');
  };

  const handleCopyMatricule = () => {
    if (!session?.token_qr) return;
    navigator.clipboard.writeText(session.token_qr);
    setCopiedMatricule(true);
    toast.success(t.copied);
    setTimeout(() => setCopiedMatricule(false), 2000);
  };

  const handleDownloadBadge = async () => {
    if (!session) return;
    setIsDownloadingBadge(true);
    const toastId = toast.loading(lang === 'ar' ? 'جارٍ تحضير البطاقة...' : 'Génération du badge PDF...');
    try {
      await generateBadgeSheetPDF([session], `Badge_Ovia_Sport_${session.nom || 'Adherent'}.pdf`);
      toast.success(lang === 'ar' ? 'تم تحميل البطاقة بنجاح !' : 'Badge officiel téléchargé !', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du téléchargement du badge', { id: toastId });
    } finally {
      setIsDownloadingBadge(false);
    }
  };

  const handleDownloadReceipt = async (cotis) => {
    const toastId = toast.loading(lang === 'ar' ? 'جارٍ إنشاء الوصل...' : 'Génération du reçu...');
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const logoBase64 = await loadClubLogoBase64();
      const receiptNumber = `OVS-REC-${cotis.id ? cotis.id.substring(0, 8).toUpperCase() : Date.now().toString().slice(-6)}`;
      const datePaiementStr = cotis.date_paiement ? new Date(cotis.date_paiement).toLocaleDateString('fr-FR') : '-';
      const endDateStr = cotis.periode_couverte_fin ? new Date(cotis.periode_couverte_fin).toLocaleDateString('fr-FR') : '-';
      const athleteFullName = `${(session.nom || 'NOM').toUpperCase()} ${session.prenom || ''}`;

      doc.setFillColor(15, 23, 42); doc.rect(0, 0, 210, 6, 'F');
      doc.setFillColor(16, 185, 129); doc.rect(0, 6, 210, 2, 'F');
      if (logoBase64) doc.addImage(logoBase64, 'JPEG', 18, 14, 22, 22);

      doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(15, 23, 42);
      doc.text('OVIA SPORT CLUB', 45, 20);
      doc.setFontSize(9); doc.setTextColor(16, 185, 129);
      doc.text('REÇU OFFICIEL DE COTISATION ADHÉRENT', 45, 26);

      doc.setFillColor(248, 250, 252); doc.roundedRect(140, 13, 52, 24, 3, 3, 'F');
      doc.setFontSize(9); doc.setTextColor(15, 23, 42);
      doc.text(receiptNumber, 166, 21, { align: 'center' });
      doc.setFontSize(8); doc.setTextColor(100, 116, 139);
      doc.text(`Date : ${datePaiementStr}`, 166, 29, { align: 'center' });

      doc.setDrawColor(226, 232, 240); doc.line(18, 42, 192, 42);

      doc.setFontSize(10); doc.setTextColor(100, 116, 139);
      doc.text('ADHÉRENT BENEFICIAIRE :', 18, 52);
      doc.setFontSize(14); doc.setTextColor(15, 23, 42);
      doc.text(athleteFullName, 18, 60);

      doc.setFontSize(9); doc.setTextColor(100, 116, 139);
      doc.text(`Matricule : ${session.token_qr || session.id?.slice(0, 8) || '-'}`, 18, 67);
      doc.text(`Groupe : ${session.groupes?.nom || session.groupe || 'Membre Club'}`, 18, 73);

      doc.setFillColor(241, 245, 249); doc.roundedRect(18, 82, 174, 52, 4, 4, 'F');
      doc.setDrawColor(203, 213, 225); doc.roundedRect(18, 82, 174, 52, 4, 4, 'S');

      doc.setFontSize(11); doc.setTextColor(15, 23, 42);
      doc.text('DÉTAILS DU RÈGLEMENT', 24, 92);

      doc.setFontSize(10); doc.setTextColor(100, 116, 139);
      doc.text('Montant réglé :', 24, 102);
      doc.setFontSize(12); doc.setTextColor(16, 185, 129);
      doc.text(`${formatDA(cotis.montant_paye)}`, 75, 102);

      doc.setFontSize(10); doc.setTextColor(100, 116, 139);
      doc.text('Période couverte :', 24, 112);
      doc.setTextColor(15, 23, 42);
      doc.text(`Jusqu'au ${endDateStr}`, 75, 112);

      doc.setFontSize(10); doc.setTextColor(100, 116, 139);
      doc.text('Mode de paiement :', 24, 122);
      doc.setTextColor(15, 23, 42);
      doc.text(`${cotis.mode_paiement || 'Espèces'}`, 75, 122);

      doc.setFillColor(255, 255, 255); doc.roundedRect(110, 145, 82, 38, 3, 3, 'F');
      doc.setDrawColor(203, 213, 225); doc.roundedRect(110, 145, 82, 38, 3, 3, 'S');
      doc.setFontSize(8.5); doc.setTextColor(71, 85, 105);
      doc.text('Cachet numérique & Validation Ovia Sport', 115, 152);
      doc.setFontSize(7.5); doc.setTextColor(148, 163, 184);
      doc.text('Document généré via l\'Espace Adhérent officiel.', 115, 160);
      doc.text('Fait foi de paiement sous réserve d\'encaissement.', 115, 165);

      doc.setDrawColor(226, 232, 240); doc.line(18, 275, 192, 275);
      doc.setFontSize(7.5); doc.setTextColor(148, 163, 184);
      doc.text(`Document officiel Ovia Sport - Généré le ${new Date().toLocaleDateString('fr-FR')}`, 105, 282, { align: 'center' });

      doc.save(`${receiptNumber}.pdf`);
      toast.success(lang === 'ar' ? 'تم تنزيل الوصل بنجاح !' : 'Reçu officiel téléchargé !', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du téléchargement du reçu', { id: toastId });
    }
  };

  // Traitement intelligent des données
  const cotisationsList = useMemo(() => {
    if (!session?.cotisations || !Array.isArray(session.cotisations)) return [];
    return [...session.cotisations].sort((a, b) => new Date(b.date_paiement || 0) - new Date(a.date_paiement || 0));
  }, [session?.cotisations]);

  const latestCotis = useMemo(() => {
    if (cotisationsList.length === 0) return null;
    return [...cotisationsList].sort((a, b) => new Date(b.periode_couverte_fin || 0) - new Date(a.periode_couverte_fin || 0))[0];
  }, [cotisationsList]);

  const subscriptionStatus = useMemo(() => {
    if (!latestCotis?.periode_couverte_fin) {
      return {
        type: 'pending',
        label: t.statusPending,
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.1)',
        border: 'rgba(245, 158, 11, 0.3)',
        daysText: '-',
        isOk: false,
        daysRemaining: -999
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(latestCotis.periode_couverte_fin);
    end.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

    if (diffDays >= 0) {
      const isNear = diffDays <= 7;
      return {
        type: isNear ? 'near' : 'active',
        label: t.statusActive,
        color: isNear ? '#f59e0b' : '#10b981',
        bg: isNear ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
        border: isNear ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)',
        daysText: `${diffDays} ${t.daysRemaining}`,
        isOk: true,
        daysRemaining: diffDays
      };
    } else {
      const pastDays = Math.abs(diffDays);
      return {
        type: 'expired',
        label: t.statusExpired,
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.1)',
        border: 'rgba(239, 68, 68, 0.3)',
        daysText: `${t.expiredSince} ${pastDays} ${t.days}`,
        isOk: false,
        daysRemaining: diffDays
      };
    }
  }, [latestCotis, t]);

  const categoryInfo = useMemo(() => {
    return session?.date_naissance ? getSwimmingCategory(session) : null;
  }, [session]);

  const medicalValid = Boolean(session?.certificat_medical || session?.certificat_medical_valide);

  const groupInfo = useMemo(() => {
    if (session?.groupes) {
      return {
        nom: session.groupes.nom || 'Groupe Club',
        horaires: session.groupes.horaires || 'Séances régulières selon planning',
        entraineur: session.groupes.entraineur || 'Staff Technique Ovia Sport',
        bassin: session.groupes.bassin || 'Bassin Principal 50m'
      };
    }
    return {
      nom: session?.groupe || 'École de Natation / Loisir',
      horaires: 'Séances régulières selon planning',
      entraineur: 'Staff Technique Ovia Sport',
      bassin: 'Bassin Principal'
    };
  }, [session]);

  const thisMonthPresences = useMemo(() => {
    const curMonth = new Date().getMonth();
    const curYear = new Date().getFullYear();
    return presences.filter(p => {
      const d = new Date(p.date_scan);
      return d.getMonth() === curMonth && d.getFullYear() === curYear;
    }).length;
  }, [presences]);

  const chartData = useMemo(() => {
    if (!Array.isArray(performances) || performances.length === 0) return [];
    const eventCounts = {};
    performances.forEach(p => {
      if (p?.event_id) eventCounts[p.event_id] = (eventCounts[p.event_id] || 0) + 1;
    });
    const keys = Object.keys(eventCounts);
    if (keys.length === 0) return [];
    const topEventId = keys.sort((a, b) => eventCounts[b] - eventCounts[a])[0];

    const perfs = performances
      .filter(p => p?.event_id === topEventId)
      .sort((a, b) => new Date(a.date_perf || 0) - new Date(b.date_perf || 0));

    return perfs.map(p => {
      let dStr = '-';
      try {
        const d = new Date(p.date_perf);
        dStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      } catch {}
      return {
        date: dStr,
        temps: Number(p.seconds) || 0,
        chrono: String(p.chrono_str || '-'),
        label: String(p.event_label || topEventId)
      };
    });
  }, [performances]);

  const whatsappRenewalLink = useMemo(() => {
    const clubPhone = '213550000000';
    const message = encodeURIComponent(
      `Bonjour Ovia Sport, je souhaite renouveler la cotisation de ${session?.prenom} ${session?.nom} (Matricule: ${session?.token_qr || '-'}). Pouvez-vous me confirmer les modalités ? Merci !`
    );
    return `https://wa.me/${clubPhone}?text=${message}`;
  }, [session]);

  // ==========================================
  // ÉCRAN 1 : CONNEXION ADHÉRENT MODERNE
  // ==========================================
  if (!session) {
    return (
      <div 
        className="min-h-screen flex flex-col justify-between font-sans relative overflow-hidden" 
        style={{
          background: 'radial-gradient(ellipse 90% 60% at 50% -10%, #0c2340 0%, #070d17 70%, #030712 100%)',
          color: '#f8fafc'
        }}
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Cercles d'ambiance lumineux (Aquatic Glow) */}
        <div style={{ position: 'absolute', top: '-15%', left: '10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(14, 165, 233, 0.18) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '10%', width: '450px', height: '450px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

        {/* Top Navbar */}
        <header className="relative z-10 p-6 flex justify-between items-center max-w-6xl w-full mx-auto">
          <Link to="/" className="flex items-center gap-3 group text-decoration-none">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/25 border border-sky-400/30 group-hover:scale-105 transition-transform">
              <Waves size={22} className="text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-wider text-white block leading-tight">OVIA SPORT</span>
              <span className="text-[10px] text-sky-400 font-bold tracking-widest block uppercase">Aquatic Club</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {/* Lang Switch */}
            <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/15">
              <button 
                type="button"
                onClick={() => handleLanguageChange('fr')} 
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${lang === 'fr' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                FR
              </button>
              <button 
                type="button"
                onClick={() => handleLanguageChange('ar')} 
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${lang === 'ar' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                العربية
              </button>
            </div>

            <Link to="/" className="text-xs font-bold text-slate-300 hover:text-white px-3 py-1.5 rounded-xl border border-white/10 hover:border-white/20 transition-all hidden sm:inline-flex items-center gap-1.5">
              ← {lang === 'ar' ? 'الرئيسية' : 'Site public'}
            </Link>
          </div>
        </header>

        {/* Form Container */}
        <main className="relative z-10 flex-1 flex items-center justify-center p-4">
          <div 
            className="w-full max-w-md p-8 sm:p-10 rounded-3xl border border-white/15 shadow-2xl relative overflow-hidden"
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(14, 165, 233, 0.1)'
            }}
          >
            {/* Header Badge */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest mb-4 bg-sky-500/15 text-sky-400 border border-sky-500/30">
                <ShieldCheck size={14} />
                {t.portalBadge}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
                {t.loginTitle}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
                {t.loginSubtitle}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Identifiant */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
                  {t.identifiantLabel}
                </label>
                <div className="relative">
                  <div className={`absolute inset-y-0 ${lang === 'ar' ? 'right-0 pr-3.5' : 'left-0 pl-3.5'} flex items-center pointer-events-none text-slate-400`}>
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder={t.identifiantPlaceholder}
                    value={loginData.identifiant}
                    onChange={(e) => setLoginData(prev => ({ ...prev, identifiant: e.target.value }))}
                    className={`w-full ${lang === 'ar' ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm font-medium focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 transition-all`}
                  />
                </div>
              </div>

              {/* Date de naissance */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
                  {t.pinLabel}
                </label>
                <div className="relative">
                  <div className={`absolute inset-y-0 ${lang === 'ar' ? 'right-0 pr-3.5' : 'left-0 pl-3.5'} flex items-center pointer-events-none text-slate-400`}>
                    <Calendar size={18} />
                  </div>
                  <input
                    type="date"
                    required
                    value={loginData.date_naissance}
                    onChange={(e) => setLoginData(prev => ({ ...prev, date_naissance: e.target.value }))}
                    className={`w-full ${lang === 'ar' ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-white text-sm font-medium focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 transition-all`}
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-xl font-extrabold text-sm text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg disabled:opacity-60 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 50%, #38bdf8 100%)',
                  boxShadow: '0 10px 25px -5px rgba(14, 165, 233, 0.45)'
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>{lang === 'ar' ? 'جارٍ التحقق...' : 'Vérification en cours...'}</span>
                  </>
                ) : (
                  <>
                    <span>{t.loginBtn}</span>
                    <ArrowRight size={18} className={lang === 'ar' ? 'rotate-180' : ''} />
                  </>
                )}
              </button>
            </form>

            {/* Assistance WhatsApp */}
            <div className="mt-8 pt-6 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-400 mb-2">{t.supportHelp}</p>
              <a 
                href="https://wa.me/213550000000?text=Bonjour,%20j'ai%20besoin%20d'aide%20pour%20acc%C3%A9der%20%C3%A0%20l'espace%20adh%C3%A9rent%20Ovia%20Sport."
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-extrabold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <Phone size={14} />
                <span>{t.contactAdmin}</span>
              </a>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 p-4 text-center text-xs text-slate-500">
          Ovia Sport Aquatic Center © {new Date().getFullYear()} · Tous droits réservés
        </footer>
      </div>
    );
  }

  // ==========================================
  // ÉCRAN 2 : ESPACE ADHÉRENT CONNECTÉ (VIP)
  // ==========================================
  return (
    <div 
      className="min-h-screen font-sans pb-24"
      style={{
        background: '#070d17',
        color: '#f8fafc'
      }}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Glows d'ambiance */}
      <div style={{ position: 'fixed', top: '0', left: '20%', width: '600px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(14, 165, 233, 0.08) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />

      {/* STICKY TOP NAVBAR */}
      <header 
        className="sticky top-0 z-40 border-b backdrop-blur-xl"
        style={{
          backgroundColor: 'rgba(7, 13, 23, 0.85)',
          borderColor: 'rgba(255, 255, 255, 0.08)'
        }}
      >
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 text-decoration-none">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-500/20">
                <Waves size={20} className="text-white" />
              </div>
              <div>
                <span className="font-extrabold text-sm sm:text-base text-white block leading-none">OVIA SPORT</span>
                <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider block">Espace Adhérent</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Pill Adhérent Info */}
            <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/70">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-sky-500 flex items-center justify-center text-xs font-bold text-white">
                {session.photo ? (
                  <img src={session.photo} alt={session.prenom} className="w-full h-full object-cover" />
                ) : (
                  <span>{session.prenom?.[0] || 'A'}</span>
                )}
              </div>
              <span className="text-xs font-bold text-white">
                {session.prenom} {session.nom?.toUpperCase()}
              </span>
              <span 
                className="w-2 h-2 rounded-full animate-pulse" 
                style={{ backgroundColor: subscriptionStatus.color }}
                title={subscriptionStatus.label}
              />
            </div>

            {/* Sync Refresh Button */}
            <button
              onClick={() => {
                fetchAthleteData(session.id);
                fetchPresences(session.id);
                toast.success(lang === 'ar' ? 'تم تحديث البيانات' : 'Données actualisées !');
              }}
              disabled={isRefreshing}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
              title="Actualiser les informations"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-sky-400' : ''} />
            </button>

            {/* Language Switch */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => handleLanguageChange('fr')}
                className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${lang === 'fr' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                FR
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('ar')}
                className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${lang === 'ar' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                AR
              </button>
            </div>

            {/* Logout CTA */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 transition-all cursor-pointer"
              title={t.logout}
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">{t.logout}</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO BANNER DE BIENVENUE */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-6">
        <div 
          className="p-6 sm:p-8 rounded-3xl border border-white/10 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(30, 41, 59, 0.6) 100%)',
            backdropFilter: 'blur(16px)'
          }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider mb-2 bg-sky-500/15 text-sky-400 border border-sky-500/30">
                <Sparkles size={13} />
                {groupInfo.nom}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                {t.welcome}, {session.prenom} {session.nom?.toUpperCase()} 👋
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                Retrouvez votre carte d'accès numérique, l'état de votre abonnement et le suivi de vos entraînements.
              </p>
            </div>

            {/* Statut Badge en grand */}
            <div 
              className="px-4 py-2.5 rounded-2xl border flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-start"
              style={{
                backgroundColor: subscriptionStatus.bg,
                borderColor: subscriptionStatus.border
              }}
            >
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Statut Abonnement</span>
                <span className="text-sm font-extrabold block" style={{ color: subscriptionStatus.color }}>
                  {subscriptionStatus.label}
                </span>
              </div>
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold"
                style={{ backgroundColor: subscriptionStatus.color, color: '#ffffff' }}
              >
                {subscriptionStatus.isOk ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BARRE D'ONGLETS ERGONOMIQUE */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 mt-6">
        <div className="flex gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('card')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${activeTab === 'card' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <Shield size={16} />
            <span>{t.tabCard}</span>
          </button>

          <button
            onClick={() => setActiveTab('performances')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${activeTab === 'performances' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <Timer size={16} />
            <span>{t.tabPerfs}</span>
            {performances.length > 0 && (
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">{performances.length}</span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('cotisations')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${activeTab === 'cotisations' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <CreditCard size={16} />
            <span>{t.tabPayments}</span>
            {cotisationsList.length > 0 && (
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">{cotisationsList.length}</span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('annonces')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${activeTab === 'annonces' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <Megaphone size={16} />
            <span>{t.tabClub}</span>
          </button>

          <button
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${activeTab === 'info' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <Info size={16} />
            <span>{t.tabInfo}</span>
          </button>
        </div>
      </div>

      {/* CONTENU PRINCIPAL PAR ONGLET */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 mt-6">
        
        {/* ========================================================= */}
        {/* ONGLET 1 : MA CARTE VIP & STATUT & ASSIDUITÉ              */}
        {/* ========================================================= */}
        {activeTab === 'card' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* COLONNE GAUCHE : CARTE VIRTUELLE DE MEMBRE HOLOGRAPHIQUE (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              
              {/* LA CARTE VIP STYLE PHYSIQUE (Format CR80) */}
              <div 
                className="rounded-3xl p-6 relative overflow-hidden border border-white/20 shadow-2xl transition-all"
                style={{
                  background: 'linear-gradient(135deg, #09152b 0%, #0f2b59 50%, #1e1b4b 100%)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(14, 165, 233, 0.2)'
                }}
              >
                {/* Filigrane Holographique */}
                <div style={{ position: 'absolute', top: '-20%', right: '-20%', width: '220px', height: '220px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none' }} />
                
                {/* Header de la carte */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <img 
                      src="/logo.jpg" 
                      alt="Logo Ovia Sport" 
                      className="w-10 h-10 rounded-full border-2 border-white/40 object-cover shadow-md"
                    />
                    <div>
                      <span className="text-xs font-black text-white tracking-widest block">OVIA SPORT</span>
                      <span className="text-[9px] text-sky-400 font-bold uppercase tracking-wider block">Aquatic Center</span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 text-white border border-white/20">
                    MEMBRE VIP
                  </span>
                </div>

                {/* Corps de la carte */}
                <div className="flex gap-4 items-center mb-6">
                  {/* Photo Adhérent */}
                  <div className="w-20 h-24 rounded-2xl overflow-hidden bg-slate-800 border-2 border-white/30 flex-shrink-0 flex items-center justify-center shadow-lg">
                    {session.photo ? (
                      <img src={session.photo} alt={session.prenom} className="w-full h-full object-cover" />
                    ) : (
                      <User size={36} className="text-slate-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-black text-white leading-tight truncate">
                      {session.nom?.toUpperCase()}
                    </h2>
                    <p className="text-sm font-bold text-sky-400 truncate mb-2">
                      {session.prenom}
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        {groupInfo.nom}
                      </span>
                      {categoryInfo && (
                        <span 
                          className="text-[10px] font-extrabold px-2 py-0.5 rounded-md"
                          style={{ backgroundColor: categoryInfo.badgeBg, color: categoryInfo.color }}
                        >
                          {categoryInfo.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* QR Code & Matricule */}
                <div className="p-4 rounded-2xl bg-white flex items-center justify-between gap-4 shadow-inner">
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      {t.digitalBadge}
                    </span>
                    <strong className="text-xs font-mono font-black text-slate-900 block truncate">
                      {session.token_qr || `OVS-${session.id?.slice(0, 8)}`}
                    </strong>
                    <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
                      <ShieldCheck size={12} /> Prêt pour scanner d'accès
                    </span>
                  </div>

                  <div className="flex-shrink-0 p-1 bg-white rounded-lg">
                    <QRCodeSVG 
                      value={String(session.token_qr || session.id || 'OVS-MEMBER')} 
                      size={64} 
                      level="H" 
                      includeMargin={false} 
                      fgColor="#0f172a" 
                    />
                  </div>
                </div>

                {/* Footer Carte */}
                <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-[10px] text-slate-400">
                  <span>Valide : {latestCotis ? new Date(latestCotis.periode_couverte_fin).toLocaleDateString('fr-FR') : '-'}</span>
                  <span className="font-mono text-slate-400 font-bold">OVS-PASS-2026</span>
                </div>
              </div>

              {/* ACTIONS SUR LE BADGE */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowFullscreenQR(true)}
                  className="p-3 rounded-2xl bg-slate-900 border border-slate-700 hover:border-sky-500 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Maximize2 size={15} className="text-sky-400" />
                  <span>Mode Scanner</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadBadge}
                  disabled={isDownloadingBadge}
                  className="p-3 rounded-2xl bg-slate-900 border border-slate-700 hover:border-sky-500 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download size={15} className="text-emerald-400" />
                  <span>{isDownloadingBadge ? 'PDF...' : 'Badge (PDF)'}</span>
                </button>
              </div>

              {/* Bouton Copier Matricule */}
              <button
                type="button"
                onClick={handleCopyMatricule}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {copiedMatricule ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedMatricule ? t.copied : `${t.copyMatricule} (${session.token_qr})`}</span>
              </button>
            </div>

            {/* COLONNE DROITE : STATUTS, ALERTES, GROUPE & ASSIDUITÉ (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              {/* ALERTE INTELLIGENTE DE RENOUVELLEMENT (Si abonnement expiré ou bientôt expiré) */}
              {(!subscriptionStatus.isOk || subscriptionStatus.type === 'near') && (
                <div 
                  className="p-5 rounded-3xl border relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  style={{
                    backgroundColor: subscriptionStatus.bg,
                    borderColor: subscriptionStatus.border
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl text-white mt-0.5" style={{ backgroundColor: subscriptionStatus.color }}>
                      <Flame size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-white">
                        {subscriptionStatus.type === 'expired' ? 'Abonnement arrivé à échéance' : 'Abonnement bientôt expiré'}
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5">
                        {subscriptionStatus.type === 'expired' 
                          ? 'Renouvelez votre cotisation pour débloquer votre accès aux bassins sans interruption.'
                          : `Votre accès expire dans ${subscriptionStatus.daysRemaining} jour(s). Pensez à renouveler dès maintenant.`}
                      </p>
                    </div>
                  </div>

                  <a
                    href={whatsappRenewalLink}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs text-black bg-[#25D366] hover:bg-[#20bd5a] flex items-center justify-center gap-2 transition-all flex-shrink-0 shadow-md cursor-pointer"
                  >
                    <Phone size={14} />
                    <span>{t.renewCTA}</span>
                  </a>
                </div>
              )}

              {/* GRID KPIS : ABONNEMENT & MÉDICAL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* CARTE ABONNEMENT */}
                <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Validité Abonnement</span>
                      <strong className="text-lg font-black block mt-1" style={{ color: subscriptionStatus.color }}>
                        {subscriptionStatus.label}
                      </strong>
                    </div>
                    <div className="p-2 rounded-xl" style={{ backgroundColor: subscriptionStatus.bg, color: subscriptionStatus.color }}>
                      <Clock size={18} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>{t.validUntil} :</span>
                      <strong className="text-white font-mono">
                        {latestCotis ? new Date(latestCotis.periode_couverte_fin).toLocaleDateString('fr-FR') : '-'}
                      </strong>
                    </div>
                    <div className="text-[11px] text-slate-400 font-semibold">
                      {subscriptionStatus.daysText}
                    </div>
                  </div>
                </div>

                {/* CARTE CERTIFICAT MÉDICAL */}
                <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">{t.medicalCert}</span>
                      <strong className={`text-lg font-black block mt-1 ${medicalValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {medicalValid ? t.medicalValid : t.medicalMissing}
                      </strong>
                    </div>
                    <div className={`p-2 rounded-xl ${medicalValid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      <FileText size={18} />
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-2">
                    {medicalValid ? t.medicalHintValid : t.medicalHintMissing}
                  </p>
                </div>
              </div>

              {/* CARTE MON GROUPE & SÉANCES */}
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400">
                    <Waves size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">{t.groupTitle}</h3>
                    <p className="text-xs text-slate-400">Détails de votre groupe d'entraînement</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Groupe</span>
                    <strong className="text-sm font-bold text-sky-400 block mt-1">{groupInfo.nom}</strong>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">{t.pool}</span>
                    <strong className="text-sm font-bold text-white block mt-1">{groupInfo.bassin}</strong>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">{t.coach}</span>
                    <strong className="text-sm font-bold text-white block mt-1">{groupInfo.entraineur}</strong>
                  </div>
                </div>

                <div className="mt-3 p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center gap-3">
                  <Calendar size={18} className="text-sky-400 flex-shrink-0" />
                  <div className="text-xs text-slate-300">
                    <strong className="text-white block font-bold mb-0.5">{t.schedules} :</strong>
                    {groupInfo.horaires}
                  </div>
                </div>
              </div>

              {/* ASSIDUITÉ & POINTAGE SÉANCES */}
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white">{t.attendanceTitle}</h3>
                      <p className="text-xs text-slate-400">Scans enregistrés à l'entrée du bassin</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <span className="px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-400 text-xs font-black border border-emerald-500/30">
                      {thisMonthPresences} {t.thisMonth}
                    </span>
                  </div>
                </div>

                {presences.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-white/5 text-xs text-slate-400 font-medium">
                    {t.noAttendance}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-xs text-slate-400 font-bold mb-2">
                      Dernières séances validées au scanner ({presences.length} au total) :
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {presences.slice(0, 6).map((item, idx) => (
                        <div key={item.id || idx} className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                          <div className="text-xs truncate">
                            <span className="font-bold text-white block">
                              {new Date(item.date_scan).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(item.date_scan).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ONGLET 2 : MES PERFORMANCES (CHRONOS & PB)                */}
        {/* ========================================================= */}
        {activeTab === 'performances' && (
          <div className="space-y-6">
            {/* Header PB */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Timer size={22} className="text-sky-400" />
                    {t.perfTitle}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    {t.perfSubtitle}
                  </p>
                </div>

                {categoryInfo && (
                  <span 
                    className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider"
                    style={{ backgroundColor: categoryInfo.badgeBg, color: categoryInfo.color }}
                  >
                    {categoryInfo.label}
                  </span>
                )}
              </div>

              {/* Cartes PB officielles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: '50_NL', label: '50m Nage Libre', short: '50 NL' },
                  { id: '100_NL', label: '100m Nage Libre', short: '100 NL' },
                  { id: '50_DOS', label: '50m Dos', short: '50 DOS' },
                  { id: '50_PAP', label: '50m Papillon', short: '50 PAP' },
                ].map(ev => {
                  const perfs = performances.filter(p => p?.event_id === ev.id).sort((a,b) => (Number(a.seconds) || 0) - (Number(b.seconds) || 0));
                  const pb = perfs[0];
                  return (
                    <div key={ev.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between">
                      <span className="text-xs font-bold text-slate-400">{ev.label}</span>
                      <div className="my-2">
                        <strong className="text-xl sm:text-2xl font-black text-emerald-400 block font-mono">
                          {pb ? pb.chrono_str : '--:--.--'}
                        </strong>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500">
                        <span>{pb ? new Date(pb.date_perf).toLocaleDateString('fr-FR') : 'Non chronométré'}</span>
                        {pb && <span className="bg-emerald-500/20 text-emerald-400 font-extrabold px-1.5 py-0.5 rounded">PB</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Graphique de Progression */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
              <h3 className="text-base font-extrabold text-white mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-sky-400" />
                {t.chartTitle}
              </h3>

              {chartData.length > 0 ? (
                <div>
                  <p className="text-xs text-slate-400 mb-6">
                    Évolution des chronos sur l'épreuve : <strong className="text-sky-400">{chartData[0].label}</strong>
                  </p>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          border: '1px solid rgba(255,255,255,0.1)', 
                          borderRadius: '12px', 
                          color: '#fff',
                          fontSize: '12px' 
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="temps" 
                        stroke="#38bdf8" 
                        strokeWidth={3} 
                        dot={{ r: 5, fill: '#38bdf8' }} 
                        activeDot={{ r: 7 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="p-12 text-center rounded-2xl bg-white/5 border border-dashed border-slate-800 text-xs text-slate-400 font-medium">
                  {t.noPerfs}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ONGLET 3 : MES COTISATIONS & REÇUS OFFICIELS              */}
        {/* ========================================================= */}
        {activeTab === 'cotisations' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <CreditCard size={22} className="text-emerald-400" />
                    {t.paymentsTitle}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    {t.paymentsSubtitle}
                  </p>
                </div>
              </div>

              {cotisationsList.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-white/5 border border-dashed border-slate-800 text-xs text-slate-400 font-medium">
                  {t.noPayments}
                </div>
              ) : (
                <div className="space-y-3">
                  {cotisationsList.map((cotis) => (
                    <div 
                      key={cotis.id || Math.random()} 
                      className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-slate-700 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex flex-col items-center justify-center flex-shrink-0">
                          <span className="text-xs font-black uppercase">
                            {new Date(cotis.periode_couverte_fin).toLocaleDateString('fr-FR', { month: 'short' })}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(cotis.periode_couverte_fin).getFullYear()}
                          </span>
                        </div>

                        <div>
                          <strong className="text-sm font-extrabold text-white block">
                            Cotisation Ovia Sport · {formatDA(cotis.montant_paye)}
                          </strong>
                          <span className="text-xs text-slate-400 block mt-0.5">
                            {t.paidOn} : {new Date(cotis.date_paiement).toLocaleDateString('fr-FR')} · {t.coveredPeriod} : jusqu'au {new Date(cotis.periode_couverte_fin).toLocaleDateString('fr-FR')}
                          </span>
                          {cotis.mode_paiement && (
                            <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded mt-1 inline-block">
                              Mode : {cotis.mode_paiement}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 size={12} /> {t.paymentSettled}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleDownloadReceipt(cotis)}
                          className="px-3.5 py-2 rounded-xl text-xs font-extrabold text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <Download size={14} className="text-sky-400" />
                          <span>{t.receiptDownload}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ONGLET 4 : ACTUALITÉS & VIE DU CLUB                       */}
        {/* ========================================================= */}
        {activeTab === 'annonces' && (
          <div className="space-y-4">
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 mb-6">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Megaphone size={22} className="text-sky-400" />
                {t.newsTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {t.newsSubtitle}
              </p>
            </div>

            {/* Annonce 1 */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-sky-500/30 relative overflow-hidden">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-sky-500 text-white rounded-2xl shadow-lg shadow-sky-500/25 flex-shrink-0">
                  <Waves size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-sky-500/20 text-sky-400 border border-sky-500/30">
                      Entraînements
                    </span>
                    <span className="text-xs text-slate-400">Cette semaine</span>
                  </div>
                  <h3 className="text-base font-extrabold text-white">Nouveau système de contrôle d'accès numérique</h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                    Vous pouvez désormais présenter directement votre QR Code depuis cet espace adhérent sur votre téléphone devant la tablette à l'entrée du bassin pour enregistrer votre séance.
                  </p>
                </div>
              </div>
            </div>

            {/* Annonce 2 */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-amber-500/30 relative overflow-hidden">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-500/25 flex-shrink-0">
                  <Award size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Compétition
                    </span>
                    <span className="text-xs text-slate-400">À venir</span>
                  </div>
                  <h3 className="text-base font-extrabold text-white">Prochain Meeting & Convocations</h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                    Les athlètes présélectionnés pour la compétition régionale recevront leur convocation et leurs épreuves officielles prochainement. Consultez régulièrement l'onglet "Mes Chronos".
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ONGLET 5 : HORAIRES & CONTACT                             */}
        {/* ========================================================= */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
              <h3 className="text-base font-black text-white mb-4 flex items-center gap-2">
                <Clock size={18} className="text-sky-400" />
                {t.receptionHours}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                Le secrétariat et l'accueil du club sont à votre disposition pour le règlement des cotisations, le dépôt des certificats médicaux et les questions administratives.
              </p>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-xs text-slate-300 font-semibold">
                {t.receptionDetails}
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
              <h3 className="text-base font-black text-white mb-4 flex items-center gap-2">
                <Phone size={18} className="text-emerald-400" />
                {t.emergencyContact}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                Pour toute urgence ou question sur votre adhésion, contactez directement l'équipe administrative via WhatsApp.
              </p>
              <a
                href={whatsappRenewalLink}
                target="_blank"
                rel="noreferrer"
                className="w-full p-4 rounded-2xl font-extrabold text-sm text-black bg-[#25D366] hover:bg-[#20bd5a] flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
              >
                <Phone size={18} />
                <span>Ouvrir la conversation WhatsApp</span>
              </a>
            </div>
          </div>
        )}

      </main>

      {/* ========================================================= */}
      {/* MODALE QR CODE GÉANT (MODE SCANNER BORNES D'ACCÈS)        */}
      {/* ========================================================= */}
      {showFullscreenQR && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.92)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div 
            className="w-full max-w-sm p-8 rounded-3xl text-center relative border border-white/20 shadow-2xl"
            style={{
              backgroundColor: '#ffffff',
              color: '#0f172a'
            }}
          >
            <button
              onClick={() => setShowFullscreenQR(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-900 bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <span className="text-[11px] font-black text-sky-600 uppercase tracking-widest block mb-1">
              OVIA SPORT PASS
            </span>
            <h3 className="text-xl font-black text-slate-900 mb-1">
              {session.prenom} {session.nom?.toUpperCase()}
            </h3>
            <p className="text-xs text-slate-500 mb-6 font-semibold">
              Présentez ce QR Code devant le scanner du club
            </p>

            {/* QR CODE HAUTE DÉFINITION SUR FOND BLANC PUR */}
            <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 inline-block mb-4 shadow-sm">
              <QRCodeSVG 
                value={String(session.token_qr || session.id || 'OVS-PASS')} 
                size={220} 
                level="H" 
                includeMargin={false} 
                fgColor="#000000" 
              />
            </div>

            <div className="font-mono text-xs font-black text-slate-700 bg-slate-100 py-2 px-3 rounded-xl mb-4">
              {session.token_qr || session.id}
            </div>

            <button
              type="button"
              onClick={() => setShowFullscreenQR(false)}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
