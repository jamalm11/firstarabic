import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AvailabilityManagement = () => {
  const [disponibilites, setDisponibilites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  
  // 🔧 États pour token et session
  const [token, setToken] = useState(null);
  const [profId, setProfId] = useState(null);
  
  // Formulaire pour nouvelle disponibilité
  const [newAvailability, setNewAvailability] = useState({
    jour: 'lundi',
    heure_debut: '09:00',
    heure_fin: '18:00',
    is_active: true
  });

  const jours = [
    'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'
  ];

  const joursLabels = {
    'lundi': 'Lundi',
    'mardi': 'Mardi', 
    'mercredi': 'Mercredi',
    'jeudi': 'Jeudi',
    'vendredi': 'Vendredi',
    'samedi': 'Samedi',
    'dimanche': 'Dimanche'
  };

  // 🔧 Récupération du token et session
  useEffect(() => {
    const getTokenAndProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          setToken(session.access_token);
          console.log("✅ Token récupéré dans AvailabilityManagement");
          
          // Récupérer l'ID du prof
          const response = await fetch('http://localhost:3001/profs/me', {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });
          
          const data = await response.json();
          if (data.success && data.prof) {
            setProfId(data.prof.id);
            console.log("✅ Profil récupéré:", data.prof.id);
          }
        } else {
          setMessage('⚠️ Session expirée, veuillez vous reconnecter');
          setLoading(false);
        }
      } catch (error) {
        console.error('Erreur récupération token:', error);
        setMessage('❌ Erreur d\'authentification');
        setLoading(false);
      }
    };

    getTokenAndProfile();
  }, []);

  useEffect(() => {
    if (token && profId) {
      fetchDisponibilites();
    }
  }, [token, profId]);

  const fetchDisponibilites = async () => {
    if (!token || !profId) {
      console.log("🚫 fetchDisponibilites - pas de token ou profId");
      return;
    }

    try {
      console.log("🔍 Récupération disponibilités pour prof:", profId);
      
      // Récupérer les disponibilités
      const response = await fetch(`http://localhost:3001/booking/availability/${profId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        setDisponibilites(data.disponibilites || []);
        console.log("✅ Disponibilités récupérées:", data.disponibilites?.length || 0);
      } else {
        setMessage('❌ Erreur lors du chargement des disponibilités');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessage('❌ Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAvailability = async () => {
    if (newAvailability.heure_debut >= newAvailability.heure_fin) {
      setMessage('❌ L\'heure de fin doit être après l\'heure de début');
      return;
    }

    if (!token) {
      setMessage('❌ Token manquant, veuillez vous reconnecter');
      return;
    }

    setSaving(true);
    try {
      console.log("📤 Envoi disponibilité avec token:", token ? "✅" : "❌");
      
      const response = await fetch('http://localhost:3001/booking/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAvailability)
      });

      const data = await response.json();
      if (data.success) {
        setDisponibilites([...disponibilites, data.disponibilite]);
        setNewAvailability({
          jour: 'lundi',
          heure_debut: '09:00',
          heure_fin: '18:00',
          is_active: true
        });
        setShowAddForm(false);
        setMessage('✅ Disponibilité ajoutée avec succès');
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessage('❌ Erreur lors de l\'ajout');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAvailability = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette disponibilité ?')) return;

    if (!token) {
      setMessage('❌ Token manquant, veuillez vous reconnecter');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/booking/availability/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setDisponibilites(disponibilites.filter(d => d.id !== id));
        setMessage('✅ Disponibilité supprimée');
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessage('❌ Erreur lors de la suppression');
    }
  };

  const toggleAvailability = async (id, currentStatus) => {
    if (!token) {
      setMessage('❌ Token manquant, veuillez vous reconnecter');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/booking/availability/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      const data = await response.json();
      if (data.success) {
        setDisponibilites(disponibilites.map(d => 
          d.id === id ? { ...d, is_active: !currentStatus } : d
        ));
        setMessage(`✅ Disponibilité ${!currentStatus ? 'activée' : 'désactivée'}`);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessage('❌ Erreur lors de la modification');
    }
  };

  if (loading) {
    return (
      <div style={{padding: '2rem', textAlign: 'center'}}>
        <div>Chargement de vos disponibilités...</div>
      </div>
    );
  }

  return (
    <div style={{padding: '2rem', backgroundColor: 'white', borderRadius: '15px', margin: '2rem 0'}}>
      {/* Header */}
      <div style={{marginBottom: '2rem'}}>
        <h2 style={{color: '#2d3748', marginBottom: '1rem'}}>
          🗓️ Gestion des Disponibilités
        </h2>
        <p style={{color: '#6b7280'}}>
          Définissez vos créneaux de disponibilité pour que les élèves puissent réserver des cours avec vous.
        </p>
      </div>

      {/* Messages */}
      {message && (
        <div style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          borderRadius: '8px',
          backgroundColor: message.includes('✅') ? '#f0f9ff' : 
                           message.includes('⚠️') ? '#fffbeb' : '#fef2f2',
          border: `1px solid ${message.includes('✅') ? '#0ea5e9' : 
                               message.includes('⚠️') ? '#f59e0b' : '#ef4444'}`,
          color: message.includes('✅') ? '#0c4a6e' : 
                 message.includes('⚠️') ? '#92400e' : '#7f1d1d'
        }}>
          {message}
        </div>
      )}

      {/* Bouton Ajouter */}
      <div style={{marginBottom: '1.5rem'}}>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          ➕ Ajouter une disponibilité
        </button>
      </div>

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          marginBottom: '2rem',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{marginBottom: '1rem'}}>Nouvelle disponibilité</h3>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
            <div>
              <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 'bold'}}>
                Jour
              </label>
              <select
                value={newAvailability.jour}
                onChange={(e) => setNewAvailability({...newAvailability, jour: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px'
                }}
              >
                {jours.map(jour => (
                  <option key={jour} value={jour}>{joursLabels[jour]}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 'bold'}}>
                Heure de début
              </label>
              <input
                type="time"
                value={newAvailability.heure_debut}
                onChange={(e) => setNewAvailability({...newAvailability, heure_debut: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 'bold'}}>
                Heure de fin
              </label>
              <input
                type="time"
                value={newAvailability.heure_fin}
                onChange={(e) => setNewAvailability({...newAvailability, heure_fin: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div style={{display: 'flex', alignItems: 'end'}}>
              <button
                onClick={handleAddAvailability}
                disabled={saving}
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  backgroundColor: saving ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? 'Ajout...' : '💾 Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des disponibilités */}
      <div>
        <h3 style={{marginBottom: '1rem', color: '#374151'}}>Vos disponibilités actuelles</h3>
        
        {disponibilites.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            color: '#6b7280'
          }}>
            <div style={{fontSize: '3rem', marginBottom: '1rem'}}>📅</div>
            <h3 style={{marginBottom: '0.5rem'}}>Aucune disponibilité configurée</h3>
            <p>Commencez par ajouter vos créneaux de disponibilité pour que les élèves puissent réserver des cours.</p>
          </div>
        ) : (
          <div style={{display: 'grid', gap: '1rem'}}>
            {jours.map(jour => {
              const disponibilitesJour = disponibilites.filter(d => d.jour === jour);
              return (
                <div key={jour} style={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '1rem'
                }}>
                  <h4 style={{
                    margin: '0 0 1rem 0',
                    color: '#374151',
                    fontWeight: 'bold'
                  }}>
                    🕒 {joursLabels[jour]}
                  </h4>
                  
                  {disponibilitesJour.length === 0 ? (
                    <p style={{color: '#9ca3af', fontStyle: 'italic', margin: 0}}>
                      Aucune disponibilité
                    </p>
                  ) : (
                    <div style={{display: 'grid', gap: '0.5rem'}}>
                      {disponibilitesJour.map(dispo => (
                        <div key={dispo.id} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem',
                          backgroundColor: '#f9fafb',
                          borderRadius: '6px'
                        }}>
                          <div style={{display: 'flex', alignItems: 'center'}}>
                            <span style={{
                              display: 'inline-block',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              marginRight: '0.75rem',
                              backgroundColor: dispo.is_active ? '#dcfce7' : '#f3f4f6',
                              color: dispo.is_active ? '#166534' : '#374151'
                            }}>
                              {dispo.is_active ? 'Actif' : 'Inactif'}
                            </span>
                            <span style={{fontWeight: 'bold'}}>
                              {dispo.heure_debut} - {dispo.heure_fin}
                            </span>
                          </div>
                          <div style={{display: 'flex', gap: '0.5rem'}}>
                            <button
                              onClick={() => toggleAvailability(dispo.id, dispo.is_active)}
                              style={{
                                padding: '0.25rem 0.75rem',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                backgroundColor: dispo.is_active ? '#fef3c7' : '#dcfce7',
                                color: dispo.is_active ? '#92400e' : '#166534'
                              }}
                            >
                              {dispo.is_active ? 'Désactiver' : 'Activer'}
                            </button>
                            <button
                              onClick={() => handleDeleteAvailability(dispo.id)}
                              style={{
                                padding: '0.25rem 0.5rem',
                                border: 'none',
                                backgroundColor: '#fee2e2',
                                color: '#dc2626',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Aide */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#eff6ff',
        borderRadius: '8px',
        border: '1px solid #bfdbfe'
      }}>
        <h3 style={{color: '#1e40af', marginBottom: '0.5rem'}}>💡 Conseils</h3>
        <ul style={{color: '#1e40af', fontSize: '0.875rem', margin: 0}}>
          <li>Définissez des créneaux de plusieurs heures que les élèves pourront subdiviser</li>
          <li>Vous pouvez désactiver temporairement une disponibilité sans la supprimer</li>
          <li>Les élèves pourront réserver des cours de 30 ou 60 minutes dans vos créneaux</li>
          <li>Vous recevrez une notification pour chaque demande de réservation</li>
        </ul>
      </div>
    </div>
  );
};

export default AvailabilityManagement;
