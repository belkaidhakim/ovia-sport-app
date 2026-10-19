"use client";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Sun, 
  Moon, 
  ArrowLeft, 
  Download, 
  Lock, 
  Phone, 
  FileText,
  FileCheck,
  Camera,
  Upload,
  Trash2,
  MapPin
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { useRegistrationSettings } from "../hooks/useRegistrationSettings";
import { useTheme } from "../contexts/ThemeContext";
import { generateOfficialRegistrationFormPdf } from "../utils/registrationFormPdfGenerator";
import { compressImageFile } from "../utils/imageCompressor";
import toast from "react-hot-toast";

export default function PublicRegistration() {
  const { theme, toggleTheme } = useTheme();
  const { isOpen: isRegistrationOpen, loading: settingsLoading } = useRegistrationSettings();

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [lieuNaissance, setLieuNaissance] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [certificatMedical, setCertificatMedical] = useState(null);
  const [certificatMedicalName, setCertificatMedicalName] = useState("");
  const [extraitNaissance, setExtraitNaissance] = useState(null);
  const [extraitNaissanceName, setExtraitNaissanceName] = useState("");
  const [sexe, setSexe] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [dossierNumber, setDossierNumber] = useState("");

  // Calcul automatique de la catégorie selon l'âge
  const getCategoryInfo = (dateString) => {
    if (!dateString) return null;
    const birthYear = new Date(dateString).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;

    if (age < 4 || age > 90) return null;
    let category = "Seniors (18+ ans)";
    if (age <= 7) category = "École / Éveil Aquatique";
    else if (age <= 9) category = "Poussins (9-10 ans)";
    else if (age <= 11) category = "Benjamins (11-12 ans)";
    else if (age <= 13) category = "Minimes (13-14 ans)";
    else if (age <= 15) category = "Cadets (15-16 ans)";
    else if (age <= 17) category = "Juniors (17-18 ans)";

    return { age, category };
  };

  const categoryInfo = getCategoryInfo(birthDate);

  // Traitement et compression de la photo
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("La photo ne doit pas dépasser 8 Mo.");
      return;
    }
    const toastId = toast.loading("Optimisation de la photo...");
    try {
      const compressed = await compressImageFile(file, 400, 500, 0.78);
      setPhoto(compressed);
      setPhotoPreview(compressed);
      toast.dismiss(toastId);
      toast.success("Photo d'identité chargée !");
    } catch (err) {
      toast.dismiss(toastId);
      console.error(err);
      toast.error("Erreur lors de la préparation de la photo.");
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
  };

  // Traitement et compression des documents officiels (Fiche / Certificat & Extrait de Naissance)
  const handleDocumentUpload = async (e, setDoc, setDocName, label) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error(`${label} : le fichier ne doit pas dépasser 10 Mo.`);
      return;
    }
    const toastId = toast.loading(`Optimisation de ${label}...`);
    try {
      const dataUrl = await compressImageFile(file, 1200, 1600, 0.75);
      if (dataUrl) {
        setDoc(dataUrl);
        setDocName(file.name);
        toast.dismiss(toastId);
        toast.success(`${label} prêt !`);
      } else {
        throw new Error("Format non reconnu");
      }
    } catch (err) {
      toast.dismiss(toastId);
      console.error(err);
      toast.error(`Erreur de lecture pour ${label}`);
    }
  };

  // Téléchargement du formulaire vierge à faire signer par le médecin
  const handleDownloadBlankForm = async () => {
    try {
      const toastId = toast.loading("Génération de la fiche officielle d'inscription vierge...");
      await generateOfficialRegistrationFormPdf({
        isBlank: true,
        fraisInscription: 1000,
        cotisationAdhesion: 2000
      });
      toast.dismiss(toastId);
      toast.success("Fiche d'inscription vierge téléchargée avec succès !");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la génération du formulaire : " + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nom.trim() || !prenom.trim() || !birthDate || !sexe || !parentName.trim() || !parentPhone.trim()) {
      toast.error("Veuillez renseigner tous les champs obligatoires (*)");
      return;
    }

    setSubmitting(true);
    const numDossier = `OVS-${Date.now().toString().slice(-6)}`;
    setDossierNumber(numDossier);

    const cat = categoryInfo?.category || "Seniors (18+ ans)";
    const cleanPhone = parentPhone.replace(/\s+/g, "");

    // Schéma de base universel compatible Supabase
    const basePayload = {
      numero_dossier: numDossier,
      nom: nom.trim().toUpperCase(),
      prenom: prenom.trim(),
      date_naissance: birthDate,
      lieu_naissance: lieuNaissance.trim() || null,
      photo: photo || null,
      certificat_medical: certificatMedical || null,
      extrait_naissance: extraitNaissance || null,
      sexe: sexe === "F" ? "Femme" : "Homme",
      telephone: cleanPhone,
      telephone_parent: cleanPhone,
      observations_medicales: parentName.trim() ? `Tuteur légal: ${parentName.trim()}` : null,
      groupe_nom: cat,
      statut: "EN_ATTENTE",
      date_demande: new Date().toISOString(),
      reglement_accepte: true,
      consentement_loi_18_07: true
    };

    // 1. Sauvegarde Supabase avec stratégie résiliente (auto-repli si colonnes étendues non présentes)
    try {
      let payloadToTry = {
        ...basePayload,
        nom_parent: parentName.trim(),
        categorie: cat
      };

      let { error } = await supabase.from("inscriptions").insert([payloadToTry]);

      if (error && (error.code === "PGRST204" || error.message?.includes("column") || error.message?.includes("schema cache"))) {
        console.warn("Colonnes étendues non trouvées dans inscriptions, repli sur le schéma standard:", error.message);
        const retryPayload = { ...basePayload };
        let retry = await supabase.from("inscriptions").insert([retryPayload]);
        if (retry.error && retry.error.message?.includes("extrait_naissance")) {
          delete retryPayload.extrait_naissance;
          retry = await supabase.from("inscriptions").insert([retryPayload]);
        }
        error = retry.error;
      }

      if (error) {
        console.error("Erreur critique Supabase insert:", error);
        toast.error("Erreur lors de l'enregistrement sur le serveur : " + (error.message || "Vérifiez votre connexion"));
        setSubmitting(false);
        return;
      }
    } catch (err) {
      console.error("Exception insertion Supabase:", err);
      toast.error("Erreur de connexion au serveur : " + (err.message || "Erreur inconnue"));
      setSubmitting(false);
      return;
    }

    // 2. Sauvegarde locale de secours
    try {
      const stored = localStorage.getItem("local_inscriptions_backup");
      const list = stored ? JSON.parse(stored) : [];
      list.unshift({ 
        ...basePayload, 
        nom_parent: parentName.trim(),
        categorie: cat,
        id: `local-${Date.now()}` 
      });
      localStorage.setItem("local_inscriptions_backup", JSON.stringify(list));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("scb_inscriptions_updated"));
    } catch (err) {
      console.warn("Erreur sauvegarde locale:", err);
    }

    setSubmitting(false);
    setSubmitted(true);
    toast.success("Demande d'inscription enregistrée avec succès !");
  };

  const handleDownloadPdf = async () => {
    try {
      await generateOfficialRegistrationFormPdf({
        data: {
          nom: nom.trim().toUpperCase(),
          prenom: prenom.trim(),
          date_naissance: birthDate,
          lieu_naissance: lieuNaissance.trim(),
          photo: photo,
          sexe: sexe === "F" ? "Femme" : "Homme",
          telephone: parentPhone,
          telephone_parent: parentPhone,
          observations_medicales: `Tuteur légal: ${parentName.trim()}`
        },
        numeroDossier: dossierNumber || `OVS-${Date.now().toString().slice(-6)}`,
        photoBase64: photo,
        selectedGroupeNom: categoryInfo?.category || "Natation"
      });
      toast.success("Fiche officielle PDF téléchargée !");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la génération du PDF");
    }
  };

  const resetForm = () => {
    setNom("");
    setPrenom("");
    setBirthDate("");
    setLieuNaissance("");
    setPhoto(null);
    setPhotoPreview(null);
    setCertificatMedical(null);
    setCertificatMedicalName("");
    setExtraitNaissance(null);
    setExtraitNaissanceName("");
    setSexe("");
    setParentName("");
    setParentPhone("");
    setSubmitted(false);
  };

  // ÉCRAN 1 : INSCRIPTIONS CLÔTURÉES
  if (!settingsLoading && !isRegistrationOpen && !submitted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] flex items-center justify-center p-6 text-slate-900 dark:text-slate-100 transition-colors">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-xl">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold mb-2">Inscriptions Clôturées</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Les pré-inscriptions en ligne pour le club <strong>Ovia Sport</strong> sont temporairement suspendues par l'administration du club.
          </p>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2 mb-6">
            <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Phone size={14} className="text-sky-500" /> Contact Secrétariat :
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              Pour toute demande d'adhésion exceptionnelle ou inscription tardive, veuillez vous adresser directement à l'accueil du complexe.
            </p>
          </div>
          <Link
            to="/"
            className="w-full inline-block py-3 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-sm transition"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  // ÉCRAN 2 : CONFIRMATION DE SUCCÈS
  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] flex items-center justify-center p-6 text-slate-900 dark:text-slate-100 transition-colors relative">
        {/* Toggle Thème */}
        <div className="absolute top-6 right-6">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm"
            title={theme === "dark" ? "Mode clair" : "Mode sombre"}
          >
            {theme === "dark" ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
          </button>
        </div>

        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-xl">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-3xl rounded-2xl flex items-center justify-center mx-auto mb-4">
            ✓
          </div>
          <h2 className="text-2xl font-extrabold mb-1">Pré-inscription Validée !</h2>
          
          {dossierNumber && (
            <div className="inline-block px-3 py-1 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-lg text-xs font-mono font-bold my-2">
              Dossier N° {dossierNumber}
            </div>
          )}

          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Votre dossier a bien été transmis à la direction du club. Un SMS de confirmation et les instructions de finalisation vous seront envoyés sous 24h.
          </p>

          <div className="space-y-3">
            <button
              onClick={resetForm}
              className="w-full py-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm transition shadow-lg shadow-sky-600/25"
            >
              Inscrire un autre membre
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-2"
            >
              <Download size={14} className="text-sky-500" />
              Télécharger mon récapitulatif officiel (PDF)
            </button>

            <button
              type="button"
              onClick={handleDownloadBlankForm}
              className="w-full py-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-medium transition flex items-center justify-center gap-1.5"
            >
              <FileText size={13} />
              Télécharger aussi la fiche vierge pour le médecin
            </button>

            <Link
              to="/"
              className="inline-block text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition pt-2"
            >
              ← Retour au site officiel Ovia Sport
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ÉCRAN 3 : FORMULAIRE D'INSCRIPTION PRINCIPAL
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6 transition-colors relative">
      
      {/* BARRE SUPÉRIEURE : RETOUR ACCUEIL & BASCULE THÈME */}
      <div className="max-w-3xl mx-auto flex items-center justify-between mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl shadow-sm"
        >
          <ArrowLeft size={15} />
          Retour au site
        </Link>

        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm"
          title={theme === "dark" ? "Mode clair" : "Mode sombre"}
        >
          {theme === "dark" ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
        </button>
      </div>

      {/* EN-TÊTE DU CLUB */}
      <div className="max-w-3xl mx-auto text-center mb-8">
        <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-400 text-white text-3xl font-black shadow-lg shadow-sky-600/30 mb-4 overflow-hidden">
          <img 
            src="/logo.jpg" 
            alt="Logo Ovia Sport" 
            className="w-full h-full object-cover absolute inset-0"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
          <span className="relative z-0">O</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Ovia Sport · Inscription Saison 2026 / 2027
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-lg mx-auto">
          Remplissez le formulaire ci-dessous pour effectuer votre demande d'adhésion au club.
        </p>
      </div>

      {/* BANDEAU FICHE D'INSCRIPTION VIERGE (TÉLÉCHARGEMENT DIRECT) */}
      <div className="max-w-3xl mx-auto mb-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-left w-full sm:w-auto">
          <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Fiche d'Inscription Officielle Vierge (PDF)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Document officiel tout-en-un à imprimer, incluant le volet médical pour le médecin traitant.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDownloadBlankForm}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs sm:text-sm transition shadow-sm whitespace-nowrap"
        >
          <Download size={16} />
          Télécharger vierge (PDF)
        </button>
      </div>

      {/* FORMULAIRE */}
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
        
        {/* SECTION 1 : INFORMATIONS DE L'ATHLÈTE */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
            <span className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-sm">
              1
            </span>
            <h2 className="text-lg font-bold">Informations de l'Athlète</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nom <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nom}
                onChange={(e) => setNom(e.target.value.toUpperCase())}
                placeholder="EX: BENALI"
                className="w-full uppercase px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Prénom <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Ex: Anis"
                className="w-full capitalize px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Date de Naissance <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <MapPin size={13} className="text-sky-500" /> Lieu de Naissance
              </label>
              <input
                type="text"
                value={lieuNaissance}
                onChange={(e) => setLieuNaissance(e.target.value)}
                placeholder="Ex: Alger, Oran, Blida..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Sexe <span className="text-rose-500">*</span>
              </label>
              <select 
                required 
                value={sexe}
                onChange={(e) => setSexe(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              >
                <option value="">Sélectionner</option>
                <option value="M">Masculin (Homme)</option>
                <option value="F">Féminin (Femme)</option>
              </select>
            </div>

            {/* Photo d'identité de l'Athlète */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Photo d'Identité de l'Athlète (Optionnelle)
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700">
                <div className="relative w-20 h-24 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-300 dark:border-slate-600 shadow-sm">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Aperçu identité" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {photoPreview ? "Photo chargée avec succès !" : "Ajouter une photo d'identité"}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                    Format portrait JPEG ou PNG, max 8 Mo. Utilisée pour le badge officiel du club.
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl cursor-pointer transition shadow-sm">
                      <Upload size={14} />
                      {photoPreview ? "Remplacer la photo" : "Télécharger une photo"}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handlePhotoUpload} 
                        className="hidden" 
                      />
                    </label>
                    {photoPreview && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-semibold rounded-xl transition cursor-pointer"
                      >
                        <Trash2 size={14} />
                        Retirer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Affichage dynamique de la catégorie détectée */}
            {categoryInfo && (
              <div className="sm:col-span-2 p-4 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider block">
                    Catégorie Fédérale Attribuée
                  </span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">
                    {categoryInfo.category}
                  </span>
                </div>
                <span className="px-3 py-1 bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 rounded-lg text-xs font-bold shadow-sm">
                  {categoryInfo.age} ans
                </span>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2 : CONTACT & RESPONSABLE LÉGAL */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
            <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
              2
            </span>
            <h2 className="text-lg font-bold">Contact & Tuteur Légal</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nom du Parent / Tuteur <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Ex: BENALI Mohamed"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Numéro de Téléphone (WhatsApp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="0550 12 34 56"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3 : PIÈCES JOINTES & DOCUMENTS OFFICIELS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
            <span className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
              3
            </span>
            <div>
              <h2 className="text-lg font-bold">Pièces Justificatives Numériques</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 m-0">Fiche d'inscription signée par le médecin et extrait de naissance</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* 1. Fiche d'inscription / Certificat médical */}
            <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <FileText size={16} className="text-sky-500" />
                    Fiche d'Inscription / Certificat Médical
                  </span>
                  {certificatMedical && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      ✔ Fichier joint
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                  Fiche médicale officielle complétée et visée par le médecin traitant (PDF ou photo lisible).
                </p>
              </div>

              {certificatMedical ? (
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText size={18} className="text-sky-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate" title={certificatMedicalName}>
                      {certificatMedicalName || "Fiche_Medicale.pdf"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCertificatMedical(null);
                      setCertificatMedicalName("");
                    }}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                    title="Supprimer ce document"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-sky-600 dark:text-sky-400 text-xs font-bold shadow-xs transition">
                  <Upload size={14} />
                  <span>Téléverser la Fiche / Certificat</span>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => handleDocumentUpload(e, setCertificatMedical, setCertificatMedicalName, "Fiche d'inscription")}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* 2. Extrait de naissance */}
            <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <FileCheck size={16} className="text-emerald-500" />
                    Extrait de Naissance (Acte N°12)
                  </span>
                  {extraitNaissance && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      ✔ Fichier joint
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                  Extrait d'acte de naissance officiel ou copie lisible du livret de famille (PDF ou photo).
                </p>
              </div>

              {extraitNaissance ? (
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileCheck size={18} className="text-emerald-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate" title={extraitNaissanceName}>
                      {extraitNaissanceName || "Extrait_Naissance.pdf"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setExtraitNaissance(null);
                      setExtraitNaissanceName("");
                    }}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                    title="Supprimer ce document"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 text-xs font-bold shadow-xs transition">
                  <Upload size={14} />
                  <span>Téléverser l'Extrait de Naissance</span>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => handleDocumentUpload(e, setExtraitNaissance, setExtraitNaissanceName, "Extrait de naissance")}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* BOUTON DE SOUMISSION */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-base shadow-xl shadow-sky-600/25 transition transform active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {submitting ? "Transmission en cours..." : "Valider ma pré-inscription"}
        </button>

        <p className="text-center text-xs text-slate-400">
          En validant ce formulaire, vous certifiez l'exactitude des informations fournies et l'acceptation du règlement intérieur du club.
        </p>
      </form>
    </div>
  );
}
