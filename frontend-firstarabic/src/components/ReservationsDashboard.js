import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const ReservationsDashboard = ({ token: propToken }) => {
  const [reservations, setReservations] = useState([]);
  const [userType, setUserType] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, en_attente, confirmé, etc.
  const [message, setMessage] = useState('');
  
  // 🔧 Utiliser le token passé en prop ou récupérer via supabase
  const [token, setToken] = useState(propToken || null);

  // 🔧 Récupérer le token si pas passé en prop
  useEffect(() => {
    const getToken = async () => {
      if (!token) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          setToken(session.access_token);
        }
      }
    };
    getToken();
  }, [propToken]);

  useEffect(() => {
    if (token) {
      fetchReservations();
    }
  }, [token]);

  const fetchReservations = async () => {
    if (!token) {
      setMessage('⚠️ Token manquant, rechargement...');
      setLoading(false);
      return;
    }

    try {
      console.log("🔍 Récupération réservations avec token:", token ? "✅" : "❌");
      
      const response = await fetch('http://localhost:3001/booking/reservations/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        setReservations(data.reservations || []);
        setUserType(data.user_type);
        console.log("✅ Réservations récupérées:", data.reservations?.length || 0);
      } else {
        setMessage('❌ Erreur lors du chargement des réservations');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessage('❌ Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReservation = async (reservationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/booking/reservations/${reservationId}/confirm`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        setMessage('✅ Réservation confirmée avec succès');
        fetchReservations(); // Recharger la liste
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessage('❌ Erreur lors de la confirmation');
    }
  };

  const handleRefuseReservation = async (reservationId) => {
    const motif = window.prompt('Motif du refus (optionnel):');
    if (motif === null) return; // Annulé

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/booking/reservations/${reservationId}/refuse`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ motif_refus: motif })
      });
      
      const data = await response.json();
      if (data.success) {
        setMessage('✅ Réservation refusée');
        fetchReservations();
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessage('❌ Erreur lors du refus');
    }
  };

  const handleCancelReservation = async (reservationId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/booking/reservations/${reservationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        setMessage('✅ Réservation annulée');
        fetchReservations();
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessage('❌ Erreur lors de l\'annulation');
    }
  };

  const getStatusBadge = (statut) => {
    const statusConfig = {
      'en_attente': { color: '#fbbf24', bg: '#fef3c7', label: 'En attente' },
      'confirmé': { color: '#10b981', bg: '#d1fae5', label: 'Confirmé' },
      'refusé': { color: '#ef4444', bg: '#fee2e2', label: 'Refusé' },
      'annulé': { color: '#6b7280', bg: '#f3f4f6', label: 'Annulé' },
      'expiré': { color: '#6b7280', bg: '#f3f4f6', label: 'Expiré' }
    };

    const config = statusConfig[statut] || statusConfig['en_attente'];

    return (
      <span style={{
        display: 'inline-block',
        padding: '0.25rem 0.75rem',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: 'bold',
        backgroundColor: config.bg,
        color: config.color
      }}>
        {config.label}
      </span>
    );
  };

  const filteredReservations = reservations.filter(res => 
    filter === 'all' || res.statut === filter
  );

  const upcomingConfirmed = reservations.filter(res => 
    res.statut === 'confirmé' && new Date(`${res.date}T${res.heure_debut}`) > new Date()
  );

  if (loading) {
    return (
      <div style={{padding: '2rem', textAlign: 'center'}}>
        <div>Chargement de vos réservations...</div>
      </div>
    );
  }

  return (
    <div style={{padding: '2rem', backgroundColor: 'white', borderRadius: '15px', margin: '2rem 0'}}>
      {/* Header */}
      <div style={{marginBottom: '2rem'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem'}}>
          <div>
            <h2 style={{color: '#2d3748', marginBottom: '0.5rem'}}>
              📋 {userType === 'prof' ? 'Demandes de réservation' : 'Mes réservations'}
            </h2>
            <p style={{color: '#6b7280', margin: 0}}>
              {userType === 'prof' 
                ? 'Gérez les demandes de cours de vos élèves' 
                : 'Suivez vos demandes et cours programmés'
              }
            </p>
          </div>
          
          {/* Stats rapides */}
          <div style={{display: 'flex', gap: '1rem'}}>
            <div style={{
              backgroundColor: '#eff6ff',
              padding: '1rem',
              borderRadius: '8px',
              textAlign: 'center',
              minWidth: '100px'
            }}>
              <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb'}}>
                {upcomingConfirmed.length}
              </div>
              <div style={{fontSize: '0.75rem', color: '#1e40af'}}>
                {userType === 'prof' ? 'Cours à venir' : 'Cours programmés'}
              </div>
            </div>
            <div style={{
              backgroundColor: '#fef3c7',
              padding: '1rem',
              borderRadius: '8px',
              textAlign: 'center',
              minWidth: '100px'
            }}>
              <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#d97706'}}>
                {reservations.filter(r => r.statut === 'en_attente').length}
              </div>
              <div style={{fontSize: '0.75rem', color: '#92400e'}}>En attente</div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          borderRadius: '8px',
          backgroundColor: message.includes('✅') ? '#f0f9ff' : '#fef2f2',
          border: `1px solid ${message.includes('✅') ? '#0ea5e9' : '#ef4444'}`,
          color: message.includes('✅') ? '#0c4a6e' : '#7f1d1d'
        }}>
          {message}
        </div>
      )}

      {/* Filtres */}
      <div style={{marginBottom: '1.5rem'}}>
        <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
          {[
            { key: 'all', label: 'Toutes' },
            { key: 'en_attente', label: 'En attente' },
            { key: 'confirmé', label: 'Confirmées' },
            { key: 'refusé', label: 'Refusées' },
            { key: 'annulé', label: 'Annulées' }
          ].map(filterOption => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key)}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                backgroundColor: filter === filterOption.key ? '#3b82f6' : '#f3f4f6',
                color: filter === filterOption.key ? 'white' : '#374151'
              }}
            >
              {filterOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des réservations */}
      {filteredReservations.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          color: '#6b7280'
        }}>
          <div style={{fontSize: '3rem', marginBottom: '1rem'}}>📋</div>
          <h3 style={{marginBottom: '0.5rem'}}>
            {filter === 'all' ? 'Aucune réservation' : `Aucune réservation ${filter}`}
          </h3>
          <p style={{margin: 0}}>
            {userType === 'prof' 
              ? 'Les demandes de cours apparaîtront ici quand les élèves vous contacteront.'
              : 'Vos demandes de cours apparaîtront ici après avoir réservé avec un professeur.'
            }
          </p>
        </div>
      ) : (
        <div style={{display: 'grid', gap: '1rem'}}>
          {filteredReservations.map((reservation) => (
            <div key={reservation.id} style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '1.5rem'
            }}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem'}}>
                <div style={{flex: '1'}}>
                  {/* En-tête avec statut */}
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem'}}>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                      <span style={{marginRight: '0.5rem'}}>👤</span>
                      <span style={{fontWeight: 'bold', color: '#374151'}}>
                        {userType === 'prof' 
                          ? `${reservation.eleves?.prenom || ''} ${reservation.eleves?.nom || 'Élève'}`
                          : reservation.profs?.nom || 'Professeur'
                        }
                      </span>
                    </div>
                    {getStatusBadge(reservation.statut)}
                  </div>

                  {/* Détails du cours */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div>
                      <div style={{fontSize: '0.875rem', color: '#6b7280'}}>Date</div>
                      <div style={{fontWeight: 'bold'}}>
                        {new Date(reservation.date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long'
                        })}
                      </div>
                    </div>
                    <div>
                      <div style={{fontSize: '0.875rem', color: '#6b7280'}}>Heure</div>
                      <div style={{fontWeight: 'bold'}}>
                        🕒 {reservation.heure_debut} - {reservation.heure_fin}
                      </div>
                    </div>
                    <div>
                      <div style={{fontSize: '0.875rem', color: '#6b7280'}}>Durée</div>
                      <div style={{fontWeight: 'bold'}}>{reservation.duree_minutes || 30} min</div>
                    </div>
                    <div>
                      <div style={{fontSize: '0.875rem', color: '#6b7280'}}>Prix</div>
                      <div style={{fontWeight: 'bold', color: '#10b981'}}>
                        💰 {reservation.prix_total}€
                      </div>
                    </div>
                  </div>

                  {/* Message de l'élève */}
                  {reservation.message_eleve && (
                    <div style={{marginBottom: '1rem'}}>
                      <div style={{fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem'}}>
                        Message de l'élève
                      </div>
                      <div style={{
                        backgroundColor: '#f9fafb',
                        padding: '0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.875rem'
                      }}>
                        💬 {reservation.message_eleve}
                      </div>
                    </div>
                  )}

                  {/* Motif de refus */}
                  {reservation.motif_refus && (
                    <div style={{marginBottom: '1rem'}}>
                      <div style={{fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem'}}>
                        Motif du refus
                      </div>
                      <div style={{
                        backgroundColor: '#fee2e2',
                        padding: '0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        color: '#7f1d1d'
                      }}>
                        {reservation.motif_refus}
                      </div>
                    </div>
                  )}

                  {/* Lien Jitsi pour cours confirmés */}
                  {reservation.statut === 'confirmé' && reservation.cours_id && (
                    <div style={{marginBottom: '1rem'}}>
                      <div style={{
                        backgroundColor: '#d1fae5',
                        border: '1px solid #34d399',
                        borderRadius: '6px',
                        padding: '0.75rem'
                      }}>
                        <div style={{display: 'flex', alignItems: 'center', color: '#065f46'}}>
                          <span style={{marginRight: '0.5rem'}}>🎥</span>
                          <span style={{fontWeight: 'bold'}}>Cours confirmé</span>
                        </div>
                        <div style={{fontSize: '0.875rem', color: '#047857', marginTop: '0.25rem'}}>
                          Le lien de cours sera disponible 15 minutes avant le début.
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '120px'}}>
                  {userType === 'prof' && reservation.statut === 'en_attente' && (
                    <>
                      <button
                        onClick={() => handleConfirmReservation(reservation.id)}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: 'bold'
                        }}
                      >
                        ✅ Confirmer
                      </button>
                      <button
                        onClick={() => handleRefuseReservation(reservation.id)}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: 'bold'
                        }}
                      >
                        ❌ Refuser
                      </button>
                    </>
                  )}

                  {userType === 'eleve' && reservation.statut === 'en_attente' && (
                    <button
                      onClick={() => handleCancelReservation(reservation.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 'bold'
                      }}
                    >
                      ❌ Annuler
                    </button>
                  )}

                  {reservation.statut === 'confirmé' && (
                    <div style={{textAlign: 'center', padding: '0.5rem'}}>
                      <div style={{fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem'}}>
                        Cours dans
                      </div>
                      <div style={{fontSize: '0.875rem', fontWeight: 'bold', color: '#3b82f6'}}>
                        {Math.ceil((new Date(`${reservation.date}T${reservation.heure_debut}`) - new Date()) / (1000 * 60 * 60 * 24))} jours
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer avec dates */}
              <div style={{
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid #f3f4f6',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: '#9ca3af',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <span>Demandé le {new Date(reservation.created_at).toLocaleDateString('fr-FR')}</span>
                {reservation.confirmed_at && (
                  <span>Confirmé le {new Date(reservation.confirmed_at).toLocaleDateString('fr-FR')}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReservationsDashboard;
