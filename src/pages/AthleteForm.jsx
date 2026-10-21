"use client";

import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";
import { 
  Eye, 
  Upload, 
  Trash2, 
  Camera 
} from "lucide-react";
import { useGroupes } from "../hooks/useGroupes";
import { compressImageFile } from "../utils/imageCompressor";

export default function AthleteForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { groupes } = useGroupes();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    date_naissance: "",
    lieu_naissance: "",
    telephone: "",
    contact_urgence: "",
    groupe_sanguin: "",
    observations_medicales: "",
    groupe_id: "",
    sexe: "",
    certificat_medical_valide: false,
    photo: null,
    certificat_medical: null,
    autorisation_parentale: null,
    extrait_naissance: null
  });

  const [photoPreview, setPhotoPreview] = useState(null);

  // Charger les données de l'athlète si mode modification
  useEffect(() => {
    if (id) {
      const fetchAthlete = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from("athletes")
            .select("*")
            .eq("id", id)
            .single();

          if (error) throw error;

          if (data) {
            setFormData({
              nom: data.nom || "",
              prenom: data.prenom || "",
              date_naissance: data.date_naissance ? data.date_naissance.split("T")[0] : "",
              lieu_naissance: data.lieu_naissance || "",
              telephone: data.telephone || "",
              contact_urgence: data.contact_urgence || data.telephone_urgence || "",
              groupe_sanguin: data.groupe_sanguin || "",
              observations_medicales: data.observations_medicales || data.remarques_medicales || "",
              groupe_id: data.groupe_id || "",
              sexe: data.sexe || "",
              certificat_medical_valide: Boolean(data.certificat_medical_valide),
              photo: data.photo || null,
              certificat_medical: data.certificat_medical || null,
              autorisation_parentale: data.autorisation_parentale || null,
              extrait_naissance: data.extrait_naissance || null
            });
            if (data.photo) setPhotoPreview(data.photo);
          }
        } catch (e) {
          console.error("Erreur chargement athlète:", e);
          toast.error("Impossible de charger les données de l'athlète");
        } finally {
          setLoading(false);
        }
      };
      fetchAthlete();
    }
  }, [id]);

  // Calcul automatique de l'âge et de la catégorie sportive
  const getCategoryInfo = (dateString) => {
    if (!dateString) return null;
    const birthYear = new Date(dateString).getFullYear();
    if (isNaN(birthYear)) return null;
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;

    if (age < 3 || age > 95) return null;
    let category = "Seniors (18+ ans)";
    if (age <= 7) category = "École / Éveil Aquatique";
    else if (age <= 9) category = "Poussins";
    else if (age <= 11) category = "Benjamins";
    else if (age <= 13) category = "Minimes";
    else if (age <= 15) category = "Cadets";
    else if (age <= 17) category = "Juniors";

    return { age, category };
  };

  const categoryInfo = getCategoryInfo(formData.date_naissance);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 360;
        const MAX_HEIGHT = 460;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.78);
        setPhotoPreview(dataUrl);
        setFormData(prev => ({ ...prev, photo: dataUrl }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDocumentChange = async (e, fieldName) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImageFile(file, 1200, 1600, 0.75);
      if (base64) {
        setFormData(prev => ({ ...prev, [fieldName]: base64 }));
        toast.success("Document chargé en mémoire. N'oubliez pas d'enregistrer.");
      }
    } catch {
      toast.error("Erreur lors du traitement du fichier.");
    }
  };

  const openDocument = (base64Data) => {
    if (!base64Data) return;
    const newWindow = window.open();
    if (newWindow) {
      if (base64Data.startsWith("data:application/pdf")) {
        newWindow.document.write(
          `<iframe src="${base64Data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
        );
      } else {
        newWindow.document.write(`<img src="${base64Data}" style="max-width:100%; height:auto;" />`);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nom.trim() || !formData.prenom.trim()) {
      toast.error("Veuillez renseigner le nom et le prénom");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        nom: formData.nom.trim().toUpperCase(),
        prenom: formData.prenom.trim().charAt(0).toUpperCase() + formData.prenom.trim().slice(1),
        date_naissance: formData.date_naissance || null,
        lieu_naissance: formData.lieu_naissance ? formData.lieu_naissance.trim() : null,
        telephone: formData.telephone ? formData.telephone.trim() : null,
        contact_urgence: formData.contact_urgence ? formData.contact_urgence.trim() : null,
        groupe_sanguin: formData.groupe_sanguin || null,
        observations_medicales: formData.observations_medicales ? formData.observations_medicales.trim() : null,
        groupe_id: formData.groupe_id || null,
        sexe: formData.sexe || null,
        certificat_medical_valide: Boolean(formData.certificat_medical_valide),
        photo: formData.photo || null,
        certificat_medical: formData.certificat_medical || null,
        autorisation_parentale: formData.autorisation_parentale || null,
        extrait_naissance: formData.extrait_naissance || null
      };

      if (id) {
        let { error } = await supabase
          .from("athletes")
          .update(payload)
          .eq("id", id);

        if (error && error.message.includes("column")) {
          delete payload.contact_urgence;
          delete payload.groupe_sanguin;
          delete payload.observations_medicales;
          delete payload.certificat_medical;
          delete payload.autorisation_parentale;
          delete payload.extrait_naissance;
          if (error.message.includes("lieu_naissance")) {
            delete payload.lieu_naissance;
          }
          const retry = await supabase.from("athletes").update(payload).eq("id", id);
          if (retry.error) throw retry.error;
        } else if (error) {
          throw error;
        }
        toast.success("Dossier athlète mis à jour avec succès !");
      } else {
        const token_qr = `CLUB-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        payload.token_qr = token_qr;
        payload.est_actif = true;

        let { data: newAthlete, error } = await supabase
          .from("athletes")
          .insert([payload])
          .select()
          .single();

        if (error && error.message.includes("column")) {
          delete payload.contact_urgence;
          delete payload.groupe_sanguin;
          delete payload.observations_medicales;
          delete payload.certificat_medical;
          delete payload.autorisation_parentale;
          delete payload.extrait_naissance;
          if (error.message.includes("lieu_naissance")) {
            delete payload.lieu_naissance;
          }
          const retry = await supabase.from("athletes").insert([payload]).select().single();
          if (retry.error) throw retry.error;
          newAthlete = retry.data;
        } else if (error) {
          throw error;
        }

        // Création automatique de la carte d'accès initiale
        if (newAthlete?.id) {
          try {
            await supabase
              .from("cartes_acces")
              .insert([{
                athlete_id: newAthlete.id,
                statut: "ACTIVE",
                date_emission: new Date().toISOString()
              }]);
          } catch (cardErr) {
            console.warn("Card auto-create warning:", cardErr);
          }
        }

        toast.success("Athlète enregistré avec succès !");
      }

      navigate("/athletes");
    } catch (error) {
      console.error("Error saving athlete:", error);
      toast.error("Erreur lors de la sauvegarde : " + (error.message || "Erreur inconnue"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 p-6 lg:p-8 transition-colors">
      
      {/* EN-TÊTE DE LA PAGE (100% lisible en Clair comme en Sombre) */}
      <div className="max-w-5xl mx-auto mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-1">
            <Link to="/athletes" className="hover:underline text-inherit no-underline">Académie & Membres</Link>
            <span>/</span>
            <span>{id ? "Modification Dossier" : "Nouveau Dossier"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-0">
            {id ? "Modifier Athlète" : "Nouvel Athlète"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-0">
            Inscrivez un nouveau membre dans la base de données et générez sa carte d'accès.
          </p>
        </div>

        {categoryInfo && (
          <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-700 dark:text-sky-300 shrink-0">
            <span className="text-2xl">🏊</span>
            <div>
              <div className="text-xs uppercase font-bold opacity-75">Catégorie Détectée</div>
              <div className="text-sm font-extrabold">{categoryInfo.category} · {categoryInfo.age} ans</div>
            </div>
          </div>
        )}
      </div>

      {/* FORMULAIRE PRINCIPAL */}
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6">
        
        {/* BLOC 1 : INFORMATIONS PERSONNELLES & PHOTO */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
            <span className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-sm">
              1
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-0">
              Informations Personnelles & Affectation
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Zone Photo Moderne à gauche (3 colonnes) */}
            <div className="lg:col-span-3 flex flex-col items-center">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 self-start lg:self-center">
                Photo Carte Accès
              </label>
              <label className="relative group cursor-pointer w-36 h-44 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-400 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center overflow-hidden transition-all shadow-inner">
                {photoPreview ? (
                  <>
                    <img src={photoPreview} alt="Aperçu" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-semibold">
                      <Camera className="w-6 h-6 mb-1 text-cyan-400" />
                      <span>Changer la photo</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <div className="text-3xl mb-2">📷</div>
                    <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 block">
                      Ajouter une photo
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      JPG, PNG (Max 5 Mo)
                    </span>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoChange} 
                  className="hidden" 
                />
              </label>
              {photoPreview && (
                <button
                  type="button"
                  onClick={() => {
                    setPhotoPreview(null);
                    setFormData(prev => ({ ...prev, photo: null }));
                  }}
                  className="mt-2 text-xs text-rose-500 hover:text-rose-600 hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0"
                >
                  <Trash2 size={12} /> Supprimer la photo
                </button>
              )}
            </div>

            {/* Champs de saisie à droite (9 colonnes) */}
            <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nom <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                  placeholder="EX: BOUKIR"
                  className="w-full uppercase px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Prénom <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Samir"
                  className="w-full capitalize px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Date de naissance <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="date_naissance"
                  value={formData.date_naissance}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Lieu de naissance
                </label>
                <input
                  type="text"
                  name="lieu_naissance"
                  value={formData.lieu_naissance}
                  onChange={handleChange}
                  placeholder="ex: Bouira, Alger, Oran..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Téléphone Personnel / WhatsApp
                </label>
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  placeholder="ex: 0550 12 34 56"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Sexe <span className="text-rose-500">*</span>
                </label>
                <select 
                  name="sexe"
                  value={formData.sexe}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                >
                  <option value="">Sélectionner le sexe</option>
                  <option value="M">Masculin (Garçon / Homme)</option>
                  <option value="F">Féminin (Fille / Femme)</option>
                  <option value="Homme">Homme</option>
                  <option value="Femme">Femme</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Groupe d'entraînement & Couloir affecté
                </label>
                <select 
                  name="groupe_id"
                  value={formData.groupe_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium"
                >
                  <option value="">-- Non assigné --</option>
                  {groupes && groupes.length > 0 ? (
                    groupes.map((g) => {
                      const inscrits = g.athletes ? g.athletes.length : 0;
                      const max = g.capacite_max || 30;
                      const remaining = Math.max(0, max - inscrits);
                      const isFull = inscrits >= max;
                      const badgeEmoji = isFull ? "🔴" : remaining <= 5 ? "🟠" : "🟢";
                      const statusText = isFull ? "COMPLET !" : `${remaining} place(s) disponible(s)`;
                      return (
                        <option key={g.id} value={g.id}>
                          {badgeEmoji} {g.nom} ({inscrits} / {max} inscrits — {statusText})
                        </option>
                      );
                    })
                  ) : (
                    <>
                      <option value="initiation">🟢 Initiation (6 / 30 inscrits — Places disponibles)</option>
                      <option value="apprentissage">🟢 Apprentissage (0 / 30 inscrits — Places disponibles)</option>
                      <option value="entrainement">🟠 Entraînement (15 / 20 inscrits — 5 places restantes)</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* BLOC 2 : SÉCURITÉ & INFORMATIONS MÉDICALES */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
            <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
              2
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-0">
              Sécurité & Informations Médicales
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Contact d'Urgence (Parent / Tuteur) <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                name="contact_urgence"
                value={formData.contact_urgence}
                onChange={handleChange}
                required
                placeholder="ex: 0555 99 88 77 (Numéro prioritaire en cas d'urgence)"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Groupe Sanguin
              </label>
              <select 
                name="groupe_sanguin"
                value={formData.groupe_sanguin}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-semibold"
              >
                <option value="">Non renseigné</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>

          {/* Switch / Checkbox Certificat Médical mis en valeur */}
          <label className="flex items-center gap-3.5 p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 cursor-pointer mb-5 transition hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
            <input 
              type="checkbox" 
              name="certificat_medical_valide"
              checked={formData.certificat_medical_valide}
              onChange={handleChange}
              className="w-5 h-5 accent-emerald-600 rounded cursor-pointer" 
            />
            <div>
              <span className="text-sm font-bold text-slate-900 dark:text-white block">
                Certificat médical de non-contre-indication à la natation fourni
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Autorise l'accès immédiat aux bassins lors du passage au lecteur QR Code.
              </span>
            </div>
          </label>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Observations & Antécédents Médicaux (Asthme, allergies, lunettes, précautions...)
            </label>
            <textarea
              name="observations_medicales"
              value={formData.observations_medicales}
              onChange={handleChange}
              rows={3}
              placeholder="Saisissez toute remarque médicale importante pour les entraîneurs..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
            />
          </div>
        </section>

        {/* BLOC 3 : DOCUMENTS OFFICIELS (Cartes d'upload modernes au lieu du bouton gris natif) */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
            <span className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
              3
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-0">
              Documents Officiels & Pièces Jointes Numériques
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { 
                field: "certificat_medical",
                title: "Certificat Médical", 
                icon: "🩺", 
                desc: "PDF ou Photo lisible" 
              },
              { 
                field: "extrait_naissance",
                title: "Extrait de Naissance", 
                icon: "📄", 
                desc: "Acte de naissance N°12" 
              },
              { 
                field: "autorisation_parentale",
                title: "Autorisation Parentale", 
                icon: "✍️", 
                desc: "Obligatoire pour mineurs" 
              },
            ].map((doc) => {
              const fileData = formData[doc.field];
              return (
                <div
                  key={doc.field}
                  className="flex flex-col items-center justify-between p-5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-400 bg-slate-50/50 dark:bg-slate-800/30 transition text-center"
                >
                  <div className="flex flex-col items-center w-full">
                    <span className="text-3xl mb-2">{doc.icon}</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{doc.title}</span>
                    <span className="text-xs text-slate-400 mt-0.5 mb-3">{doc.desc}</span>
                  </div>

                  {fileData ? (
                    <div className="flex items-center gap-2 w-full pt-2">
                      <button
                        type="button"
                        onClick={() => openDocument(fileData)}
                        className="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition cursor-pointer inline-flex items-center justify-center gap-1"
                      >
                        <Eye size={12} /> Voir
                      </button>
                      <label className="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer inline-flex items-center justify-center gap-1">
                        <Upload size={12} /> Remplacer
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          onChange={(e) => handleDocumentChange(e, doc.field)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="w-full px-3 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sky-600 dark:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-xs cursor-pointer inline-flex items-center justify-center gap-1.5 transition">
                      <Upload size={13} />
                      <span>+ Sélectionner un fichier</span>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => handleDocumentChange(e, doc.field)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* BARRE D'ACTIONS FIXE EN BAS */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-xs cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/25 transition cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <span>✓ Enregistrer l'athlète</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
