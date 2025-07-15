// src/pages/Dashboard.js - Version modernisée style prof
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import axios from "axios";

function Dashboard() {
  const [session, setSession] = useState(null);
  const [token, setToken] = useState(null);
  const [coursToReview, setCoursToReview] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [eleveProfil, setEleveProfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Récupération de la session
  useEffect(() => {
    const initApp = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSession(session);
        setToken(session.access_token);
        await loadEleveProfile(session.access_token);
      }
      setLoading(false);
    };
    initApp();
  }, []);

  // Charger le profil élève
  const loadEleveProfile = async (accessToken) => {
    try {
      const response = await axios.get('http://localhost:3001/eleves', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (response.data.eleves && response.data.eleves.length > 0) {
        setEleveProfil(response.data.eleves[0]);
      } else {
        // Créer un profil par défaut si pas trouvé
        setEleveProfil({
          nom: session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'Élève',
          email: session?.user?.email,
          niveau_arabe: 'débutant'
        });
      }
    } catch (err) {
      console.error("Erreur chargement profil élève:", err);
      setEleveProfil({
        nom: session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'Élève',
        email: session?.user?.email,
        niveau_arabe: 'débutant'
      });
    }
  };

  // Récupération des cours à évaluer
  useEffect(() => {
    const fetchCoursToReview = async () => {
      if (!token) return;

      setLoadingReviews(true);
      try {
        const response = await axios.get('http://localhost:3001/reviews/can-review', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          setCoursToReview(response.data.cours_to_review);
        }
      } catch (err) {
        console.error("Erreur récupération cours à évaluer:", err);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchCoursToReview();
  }, [token]);

  // Récupération des réservations
  useEffect(() => {
    const fetchReservations = async () => {
      if (!token) return;

      setLoadingReservations(true);
      try {
        const response = await axios.get('http://localhost:3001/booking/reservations/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          setReservations(response.data.reservations || []);
        }
      } catch (err) {
        console.error("Erreur récupération réservations:", err);
      } finally {
        setLoadingReservations(false);
      }
    };

    fetchReservations();
  }, [token]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleTabChange = (newTab) => {
    console.log(`🔄 Changement vers: ${newTab}`);
    setActiveTab(newTab);
  };

  // Calculer les statistiques
  const coursConfirmes = reservations.filter(r => 
    r.statut === 'confirmé' && new Date(`${r.date}T${r.heure_debut}`) > new Date()
  );
  
  const coursTermines = reservations.filter(r => 
    r.statut === 'confirmé' && new Date(`${r.date}T${r.heure_debut}`) <= new Date()
  );

  const stats = {
    coursConfirmes: coursConfirmes.length,
    coursTermines: coursTermines.length,
    evaluationsEnAttente: coursToReview.length,
    totalReservations: reservations.length
  };

  // Fonction pour vérifier si le lien Jitsi est disponible (15 min avant)
  const isJitsiAvailable = (date, heure) => {
    const coursDateTime = new Date(`${date}T${heure}`);
    const now = new Date();
    const diffMinutes = (coursDateTime - now) / (1000 * 60);
    return diffMinutes <= 15 && diffMinutes > -60;
  };

  // Fonction pour calculer le temps restant
  const getTimeUntilCours = (date, heure) => {
    const coursDateTime = new Date(`${date}T${heure}`);
    const now = new Date();
    const diffMinutes = Math.ceil((coursDateTime - now) / (1000 * 60));
    
    if (diffMinutes < 0) return "En cours ou terminé";
    if (diffMinutes < 60) return `Dans ${diffMinutes} minutes`;
    if (diffMinutes < 1440) return `Dans ${Math.ceil(diffMinutes / 60)} heures`;
    return `Dans ${Math.ceil(diffMinutes / 1440)} jours`;
  };

  if (loading) return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📚</div>
      <p>Chargement de votre espace élève...</p>
    </div>
  );

  if (!session) return <p>Veuillez vous connecter</p>;

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* Header avec profil - Style prof */}
      <div style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        borderRadius: "20px",
        padding: "2rem",
        marginBottom: "2rem",
        color: "white",
        boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <div style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              border: "3px solid rgba(255,255,255,0.3)"
            }}>
              🎓
            </div>
            <div>
              <h1 style={{ margin: "0 0 0.5rem 0", fontSize: "2rem", fontWeight: "600" }}>
                Bienvenue, {eleveProfil?.nom || 'Élève'} !
              </h1>
              <p style={{ margin: "0", opacity: "0.9", fontSize: "1.1rem" }}>
                {session.user.email}
              </p>
              <div style={{
                background: "rgba(255,255,255,0.2)",
                padding: "0.25rem 0.75rem",
                borderRadius: "12px",
                fontSize: "0.9rem",
                marginTop: "0.5rem",
                display: "inline-block"
              }}>
                📚 Niveau: {eleveProfil?.niveau_arabe || 'Débutant'}
              </div>
            </div>
          </div>
          
          {/* Stats rapides - Style prof */}
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            <div style={{
              background: "rgba(255,255,255,0.15)",
              padding: "1rem",
              borderRadius: "12px",
              textAlign: "center",
              minWidth: "100px",
              backdropFilter: "blur(10px)"
            }}>
              <div style={{ fontSize: "1.8rem", fontWeight: "bold", marginBottom: "0.25rem" }}>
                {stats.coursConfirmes}
              </div>
              <div style={{ fontSize: "0.8rem", opacity: "0.9" }}>📅 Cours à venir</div>
            </div>
            <div style={{
              background: "rgba(255,255,255,0.15)",
              padding: "1rem",
              borderRadius: "12px",
              textAlign: "center",
              minWidth: "100px",
              backdropFilter: "blur(10px)"
            }}>
              <div style={{ fontSize: "1.8rem", fontWeight: "bold", marginBottom: "0.25rem" }}>
                {stats.evaluationsEnAttente}
              </div>
              <div style={{ fontSize: "0.8rem", opacity: "0.9" }}>⭐ À évaluer</div>
            </div>
            <div style={{
              background: "rgba(255,255,255,0.15)",
              padding: "1rem",
              borderRadius: "12px",
              textAlign: "center",
              minWidth: "100px",
              backdropFilter: "blur(10px)"
            }}>
              <div style={{ fontSize: "1.8rem", fontWeight: "bold", marginBottom: "0.25rem" }}>
                {stats.totalReservations}
              </div>
              <div style={{ fontSize: "0.8rem", opacity: "0.9" }}>📋 Total cours</div>
            </div>
          </div>
        </div>
      </div>

      {/* Onglets de navigation - Style prof */}
      <div style={{
        display: "flex",
        gap: "0.5rem",
        marginBottom: "2rem",
        background: "#f8f9fa",
        padding: "0.5rem",
        borderRadius: "12px",
        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)"
      }}>
        {[
          { key: 'dashboard', label: '📊 Tableau de bord', icon: '📊' },
          { key: 'cours', label: '📚 Mes cours', icon: '📚' },
          { key: 'evaluations', label: '⭐ Évaluations', icon: '⭐' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            style={{
              padding: "0.75rem 1.5rem",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "0.95rem",
              transition: "all 0.2s ease",
              background: activeTab === tab.key ? "#667eea" : "transparent",
              color: activeTab === tab.key ? "white" : "#6b7280",
              boxShadow: activeTab === tab.key ? "0 4px 12px rgba(102, 126, 234, 0.3)" : "none"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'dashboard' && (
        <div>
          {/* Actions rapides - Style prof */}
          <div style={{
            background: "white",
            borderRadius: "16px",
            padding: "2rem",
            marginBottom: "2rem",
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)"
          }}>
            <h3 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", color: "#1f2937", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              🚀 Actions rapides
            </h3>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.5rem"
            }}>
              <Link to="/professeurs" style={{ textDecoration: "none" }}>
                <div style={{
                  padding: "1.5rem",
                  border: "2px solid #e5e7eb",
                  borderRadius: "12px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  background: "linear-gradient(135deg, #667eea, #764ba2)"
                }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 8px 25px rgba(102, 126, 234, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "none";
                  }}
                >
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📌</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: "600", color: "white", marginBottom: "0.5rem" }}>
                    Réserver un cours
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.8)" }}>
                    Trouvez votre professeur idéal
                  </div>
                </div>
              </Link>

              <div style={{
                padding: "1.5rem",
                border: "2px solid #e5e7eb",
                borderRadius: "12px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.3s ease",
                background: stats.coursConfirmes > 0 ? "linear-gradient(135deg, #10b981, #059669)" : "#f3f4f6"
              }}
                onClick={() => handleTabChange('cours')}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = stats.coursConfirmes > 0 ? "0 8px 25px rgba(16, 185, 129, 0.3)" : "0 8px 25px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "none";
                }}
              >
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📚</div>
                <div style={{ 
                  fontSize: "1.2rem", 
                  fontWeight: "600", 
                  color: stats.coursConfirmes > 0 ? "white" : "#6b7280", 
                  marginBottom: "0.5rem" 
                }}>
                  Mes cours ({stats.coursConfirmes})
                </div>
                <div style={{ 
                  fontSize: "0.9rem", 
                  color: stats.coursConfirmes > 0 ? "rgba(255,255,255,0.8)" : "#9ca3af" 
                }}>
                  Cours confirmés à venir
                </div>
              </div>

              <div style={{
                padding: "1.5rem",
                border: "2px solid #e5e7eb",
                borderRadius: "12px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.3s ease",
                background: stats.evaluationsEnAttente > 0 ? "linear-gradient(135deg, #f59e0b, #d97706)" : "#f3f4f6"
              }}
                onClick={() => handleTabChange('evaluations')}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = stats.evaluationsEnAttente > 0 ? "0 8px 25px rgba(245, 158, 11, 0.3)" : "0 8px 25px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "none";
                }}
              >
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⭐</div>
                <div style={{ 
                  fontSize: "1.2rem", 
                  fontWeight: "600", 
                  color: stats.evaluationsEnAttente > 0 ? "white" : "#6b7280", 
                  marginBottom: "0.5rem" 
                }}>
                  Évaluations ({stats.evaluationsEnAttente})
                </div>
                <div style={{ 
                  fontSize: "0.9rem", 
                  color: stats.evaluationsEnAttente > 0 ? "rgba(255,255,255,0.8)" : "#9ca3af" 
                }}>
                  Cours à évaluer
                </div>
              </div>
            </div>
          </div>

          {/* Statistiques détaillées */}
          <div style={{
            background: "white",
            borderRadius: "16px",
            padding: "2rem",
            marginBottom: "2rem",
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)"
          }}>
            <h3 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", color: "#1f2937" }}>
              📊 Mes statistiques
            </h3>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1.5rem"
            }}>
              <div style={{
                textAlign: "center",
                padding: "1.5rem",
                background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
                borderRadius: "12px",
                border: "1px solid #bfdbfe"
              }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📚</div>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#1e40af", marginBottom: "0.25rem" }}>
                  {stats.coursConfirmes}
                </div>
                <div style={{ color: "#1e40af", fontWeight: "600" }}>Cours à venir</div>
              </div>

              <div style={{
                textAlign: "center",
                padding: "1.5rem",
                background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                borderRadius: "12px",
                border: "1px solid #bbf7d0"
              }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>✅</div>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#166534", marginBottom: "0.25rem" }}>
                  {stats.coursTermines}
                </div>
                <div style={{ color: "#166534", fontWeight: "600" }}>Cours terminés</div>
              </div>

              <div style={{
                textAlign: "center",
                padding: "1.5rem",
                background: "linear-gradient(135deg, #fffbeb, #fef3c7)",
                borderRadius: "12px",
                border: "1px solid #fde68a"
              }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>⭐</div>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#92400e", marginBottom: "0.25rem" }}>
                  {stats.evaluationsEnAttente}
                </div>
                <div style={{ color: "#92400e", fontWeight: "600" }}>À évaluer</div>
              </div>

              <div style={{
                textAlign: "center",
                padding: "1.5rem",
                background: "linear-gradient(135deg, #fdf2f8, #fce7f3)",
                borderRadius: "12px",
                border: "1px solid #f9a8d4"
              }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📋</div>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#be185d", marginBottom: "0.25rem" }}>
                  {stats.totalReservations}
                </div>
                <div style={{ color: "#be185d", fontWeight: "600" }}>Total réservations</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Onglet Mes cours */}
      {activeTab === 'cours' && (
        <div style={{
          background: "white",
          borderRadius: "16px",
          padding: "2rem",
          marginBottom: "2rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)"
        }}>
          <h3 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", color: "#1f2937" }}>
            📚 Mes cours programmés
          </h3>
          
          {loadingReservations ? (
            <p>Chargement de vos cours...</p>
          ) : coursConfirmes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
              <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📚</div>
              <h4 style={{ marginBottom: "1rem" }}>Aucun cours confirmé à venir</h4>
              <p style={{ marginBottom: "2rem" }}>Réservez votre premier cours pour commencer votre apprentissage !</p>
              <Link to="/professeurs" style={{
                background: "#667eea",
                color: "white",
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: "600"
              }}>
                📌 Réserver un cours
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "1.5rem" }}>
              {coursConfirmes.map((cours) => (
                <div key={cours.id} style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "1.5rem",
                  background: "#f9fafb"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                        <h4 style={{ margin: "0", fontSize: "1.2rem", color: "#1f2937" }}>
                          👨‍🏫 {cours.profs?.nom}
                        </h4>
                        <span style={{
                          background: "#10b981",
                          color: "white",
                          padding: "0.25rem 0.75rem",
                          borderRadius: "12px",
                          fontSize: "0.8rem",
                          fontWeight: "600"
                        }}>
                          ✅ Confirmé
                        </span>
                      </div>
                      
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                        gap: "1rem",
                        marginBottom: "1rem"
                      }}>
                        <div>
                          <div style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.25rem" }}>📅 Date</div>
                          <div style={{ fontWeight: "600" }}>
                            {new Date(cours.date).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long'
                            })}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.25rem" }}>🕒 Heure</div>
                          <div style={{ fontWeight: "600" }}>
                            {cours.heure_debut} - {cours.heure_fin}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.25rem" }}>⏰ Dans</div>
                          <div style={{ fontWeight: "600", color: "#059669" }}>
                            {getTimeUntilCours(cours.date, cours.heure_debut)}
                          </div>
                        </div>
                      </div>

                      {cours.message_eleve && (
                        <div style={{
                          background: "#f3f4f6",
                          padding: "0.75rem",
                          borderRadius: "8px",
                          fontSize: "0.9rem",
                          marginBottom: "1rem"
                        }}>
                          💬 <strong>Votre message:</strong> {cours.message_eleve}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ minWidth: "120px" }}>
                      {isJitsiAvailable(cours.date, cours.heure_debut) ? (
                        <a
                          href={cours.lien_jitsi || `https://meet.jit.si/firstarabic-${cours.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            background: "#10b981",
                            color: "white",
                            padding: "0.75rem 1rem",
                            borderRadius: "8px",
                            textDecoration: "none",
                            textAlign: "center",
                            fontWeight: "600",
                            fontSize: "0.9rem",
                            display: "block"
                          }}
                        >
                          🎥 Rejoindre
                        </a>
                      ) : (
                        <div style={{
                          background: "#f3f4f6",
                          color: "#6b7280",
                          padding: "0.75rem 1rem",
                          borderRadius: "8px",
                          textAlign: "center",
                          fontSize: "0.8rem"
                        }}>
                          🔒 Lien disponible<br/>15 min avant
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Onglet Évaluations */}
      {activeTab === 'evaluations' && (
        <div style={{
          background: "white",
          borderRadius: "16px",
          padding: "2rem",
          marginBottom: "2rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)"
        }}>
          <h3 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", color: "#1f2937" }}>
            ⭐ Cours à évaluer
          </h3>
          
          {loadingReviews ? (
            <p>Chargement des cours...</p>
          ) : coursToReview.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
              <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>⭐</div>
              <h4 style={{ marginBottom: "1rem" }}>Aucun cours à évaluer</h4>
              <p>Les cours terminés apparaîtront ici pour que vous puissiez les évaluer.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "1rem" }}>
              {coursToReview.map((cours) => (
                <div key={cours.id} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "1.5rem",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  background: "#fffbeb"
                }}>
                  <div>
                    <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem", color: "#1f2937" }}>
                      👨‍🏫 {cours.profs?.nom}
                    </h4>
                    <div style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: "0.25rem" }}>
                      📅 {new Date(cours.date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: "600" }}>
                      ✅ {cours.statut}
                    </div>
                  </div>
                  
                  <Link 
                    to={`/review/${cours.id}`}
                    style={{
                      background: "#f59e0b",
                      color: "white",
                      padding: "0.75rem 1.5rem",
                      borderRadius: "8px",
                      textDecoration: "none",
                      fontWeight: "600",
                      fontSize: "0.9rem",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = "#d97706";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = "#f59e0b";
                    }}
                  >
                    ⭐ Évaluer
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Lien vers mes évaluations */}
          <div style={{
            marginTop: "2rem",
            padding: "1.5rem",
            background: "linear-gradient(135deg, #f0f9ff, #e0f2fe)",
            borderRadius: "12px",
            border: "1px solid #0ea5e9"
          }}>
            <h4 style={{ margin: "0 0 1rem 0", color: "#0c4a6e" }}>📝 Mes évaluations publiées</h4>
            <p style={{ margin: "0 0 1rem 0", color: "#0c4a6e" }}>
              Consultez et gérez tous vos avis déjà publiés.
            </p>
            <Link 
              to="/my-reviews" 
              style={{ 
                background: "#0ea5e9",
                color: "white",
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: "600",
                display: "inline-block",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#0284c7";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "#0ea5e9";
              }}
            >
              👁️ Voir mes évaluations
            </Link>
          </div>
        </div>
      )}

      {/* Footer avec déconnexion */}
      <div style={{
        background: "white",
        borderRadius: "16px",
        padding: "2rem",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div>
          <h4 style={{ margin: "0 0 0.5rem 0", color: "#1f2937" }}>💡 Conseils pour progresser</h4>
          <ul style={{ margin: "0", paddingLeft: "1.5rem", color: "#6b7280" }}>
            <li>Soyez ponctuel pour vos cours</li>
            <li>Préparez vos questions à l'avance</li>
            <li>Pratiquez régulièrement entre les cours</li>
            <li>N'hésitez pas à demander des clarifications</li>
          </ul>
        </div>
        
        <button 
          onClick={handleLogout} 
          style={{ 
            background: "#dc3545",
            color: "white",
            border: "none",
            padding: "0.75rem 1.5rem",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "0.95rem",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "#c82333";
            e.target.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "#dc3545";
            e.target.style.transform = "translateY(0)";
          }}
        >
          🚪 Se déconnecter
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
