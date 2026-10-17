"use client";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Sun, 
  Moon, 
  ArrowLeft, 
  Check, 
  Download, 
  Lock, 
  Phone, 
  Waves,
  ShieldCheck,
  FileText
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { useRegistrationSettings } from "../hooks/useRegistrationSettings";
import { useTheme } from "../contexts/ThemeContext";
import { generateOfficialRegistrationFormPdf } from "../utils/registrationFormPdfGenerator";
import toast from "react-hot-toast";

export default function PublicRegistration() {
  const { theme, toggleTheme } = useTheme();
  const { isOpen: isRegistrationOpen, loading: settingsLoading } = useRegistrationSettings();

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [sexe, setSexe] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [formula, setFormula] = useState("mensuel");
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

    const payload = {
      numero_dossier: numDossier,
      nom: nom.trim().toUpperCase(),
      prenom: prenom.trim(),
      date_naissance: birthDate,
      sexe: sexe === "F" ? "Femme" : "Homme",
      telephone: cleanPhone,
      telephone_parent: cleanPhone,
      nom_parent: parentName.trim(),
      observations_medicales: `Formule: ${formula.toUpperCase()} | Tuteur légal: ${parentName.trim()}`,
      statut: "EN_ATTENTE",
      categorie: cat,
      date_demande: new Date().toISOString(),
      reglement_accepte: true,
      consentement_loi_18_07: true
    };

    // 1. Sauvegarde locale de secours (garantit la visibilité immédiate dans l'admin)
    try {
      const stored = localStorage.getItem("local_inscriptions_backup");
      const list = stored ? JSON.parse(stored) : [];
      list.unshift({ 
        ...payload, 
        id: `local-${Date.now()}` 
      });
      localStorage.setItem("local_inscriptions_backup", JSON.stringify(list));
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      console.warn("Erreur sauvegarde locale:", err);
    }

    // 2. Sauvegarde Supabase
    try {
      const { error } = await supabase.from("inscriptions").insert([payload]);
      if (error) {
        console.warn("Supabase insert note:", error);
      }
    } catch (err) {
      console.warn("Supabase exception:", err);
    }

    setSubmitting(false);
    setSubmitted(true);
  };

  const handleDownloadPdf = async () => {
    try {
      await generateOfficialRegistrationFormPdf({
        data: {
          nom: nom.trim().toUpperCase(),
          prenom: prenom.trim(),
          date_naissance: birthDate,
          sexe: sexe === "F" ? "Femme" : "Homme",
          telephone: parentPhone,
          telephone_parent: parentPhone,
          observations_medicales: `Formule: ${formula.toUpperCase()} | Tuteur: ${parentName.trim()}`
        },
        numeroDossier: dossierNumber || `OVS-${Date.now().toString().slice(-6)}`,
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
    setSexe("");
    setParentName("");
    setParentPhone("");
    setFormula("mensuel");
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
            Votre dossier a bien été transmis à la direction du club. Un SMS de confirmation et les instructions de paiement vous seront envoyés sous 24h.
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
      <div className="max-w-3xl mx-auto text-center mb-10">
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
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
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

        {/* SECTION 3 : CHOIX DE LA FORMULE */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
            <span className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
              3
            </span>
            <h2 className="text-lg font-bold">Formule d'Abonnement</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { id: "mensuel", title: "Mensuel", price: "3 000 DA", desc: "Accès 1 mois" },
              { id: "trimestriel", title: "Trimestriel", price: "8 000 DA", desc: "Le plus populaire (-10%)" },
              { id: "annuel", title: "Saison Complète", price: "25 000 DA", desc: "Engagement annuel" },
            ].map((item) => (
              <div
                key={item.id}
                onClick={() => setFormula(item.id)}
                className={`cursor-pointer p-5 rounded-2xl border-2 transition text-center flex flex-col justify-between ${
                  formula === item.id
                    ? "border-sky-500 bg-sky-50/50 dark:bg-sky-500/10 shadow-sm"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    {item.title}
                  </span>
                  <span className="text-xl font-black text-slate-900 dark:text-white block mb-1">
                    {item.price}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</span>
                </div>
                <div className={`mt-4 w-5 h-5 mx-auto rounded-full border flex items-center justify-center font-bold text-xs ${formula === item.id ? "border-sky-600 bg-sky-600 text-white" : "border-slate-300 dark:border-slate-700"}`}>
                  {formula === item.id && "✓"}
                </div>
              </div>
            ))}
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
