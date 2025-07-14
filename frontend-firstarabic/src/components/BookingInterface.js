import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Euro, MessageSquare, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const BookingInterface = ({ profId, profData, onClose }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [duration, setDuration] = useState(30);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [step, setStep] = useState(1); // 1: Date, 2: Créneau, 3: Confirmation

  // Générer les 14 prochains jours
  const getNextDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        date: date.toISOString().split('T')[0],
        display: date.toLocaleDateString('fr-FR', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long' 
        })
      });
    }
    return days;
  };

  const availableDays = getNextDays();

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDate, duration]);

  const fetchAvailableSlots = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/booking/availability/slots/${profId}/${selectedDate}?duree=${duration}`);
      const data = await response.json();
      
      if (data.success) {
        setAvailableSlots(data.creneaux || []);
        if (data.creneaux?.length > 0) {
          setStep(2);
        }
      } else {
        setMessage('❌ Erreur lors du chargement des créneaux');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessage('❌ Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedSlot) return;

    setBooking(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/booking/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prof_id: profId,
          date: selectedDate,
          heure_debut: selectedSlot.heure_debut,
          duree_minutes: duration,
          message_eleve: message
        })
      });

      const data = await response.json();
      if (data.success) {
        setStep(4); // Succès
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessage('❌ Erreur lors de la réservation');
    } finally {
      setBooking(false);
    }
  };

  const calculatePrice = () => {
    if (!profData) return 0;
    return duration === 60 ? 
      (profData.prix_60min || profData.prix_30min * 2) : 
      profData.prix_30min;
  };

  if (step === 4) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Demande envoyée !
            </h3>
            <p className="text-gray-600 mb-6">
              Votre demande de réservation a été envoyée à {profData?.nom}. 
              Vous recevrez une notification dès qu'il aura répondu.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-600 space-y-1">
                <div><strong>Date :</strong> {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                <div><strong>Heure :</strong> {selectedSlot?.heure_debut} - {selectedSlot?.heure_fin}</div>
                <div><strong>Durée :</strong> {duration} minutes</div>
                <div><strong>Prix :</strong> {calculatePrice()}€</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <User className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Réserver un cours avec {profData?.nom}
                </h2>
                <p className="text-gray-600">
                  {profData?.specialites?.join(', ') || 'Professeur d\'arabe'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XCircle className="h-6 w-6 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center">
              {[1, 2, 3].map((stepNumber) => (
                <React.Fragment key={stepNumber}>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    step >= stepNumber 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'border-gray-300 text-gray-400'
                  }`}>
                    {stepNumber}
                  </div>
                  {stepNumber < 3 && (
                    <div className={`h-1 w-16 mx-2 ${
                      step > stepNumber ? 'bg-blue-600' : 'bg-gray-300'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>Date</span>
              <span>Créneau</span>
              <span>Confirmation</span>
            </div>
          </div>

          {/* Messages d'erreur */}
          {message && message.includes('❌') && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-800">
              <AlertCircle className="h-5 w-5 mr-2" />
              {message}
            </div>
          )}

          {/* Étape 1: Sélection de la date et durée */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Choisissez la durée du cours
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setDuration(30)}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      duration === 30 
                        ? 'border-blue-600 bg-blue-50 text-blue-900' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-center">
                      <Clock className="h-6 w-6 mx-auto mb-2" />
                      <div className="font-semibold">30 minutes</div>
                      <div className="text-sm text-gray-600">{profData?.prix_30min || 15}€</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setDuration(60)}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      duration === 60 
                        ? 'border-blue-600 bg-blue-50 text-blue-900' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-center">
                      <Clock className="h-6 w-6 mx-auto mb-2" />
                      <div className="font-semibold">60 minutes</div>
                      <div className="text-sm text-gray-600">{calculatePrice()}€</div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Sélectionnez une date
                </h3>
                <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                  {availableDays.map((day) => (
                    <button
                      key={day.date}
                      onClick={() => setSelectedDate(day.date)}
                      className={`p-3 text-left border rounded-lg transition-colors ${
                        selectedDate === day.date 
                          ? 'border-blue-600 bg-blue-50 text-blue-900' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-medium">{day.display}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Étape 2: Sélection du créneau */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Créneaux disponibles
                </h3>
                <button
                  onClick={() => setStep(1)}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  ← Changer la date
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">
                  <div><strong>Date :</strong> {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                  <div><strong>Durée :</strong> {duration} minutes</div>
                  <div><strong>Prix :</strong> {calculatePrice()}€</div>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3">Chargement des créneaux...</span>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun créneau disponible</h3>
                  <p className="text-gray-600">
                    Le professeur n'a pas de créneaux libres pour cette date. 
                    Essayez une autre date.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {availableSlots.map((slot, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedSlot(slot);
                        setStep(3);
                      }}
                      className="p-3 border border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors text-center"
                    >
                      <div className="font-medium">{slot.heure_debut}</div>
                      <div className="text-sm text-gray-600">→ {slot.heure_fin}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Étape 3: Confirmation */}
          {step === 3 && selectedSlot && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirmer la réservation
                </h3>
                <button
                  onClick={() => setStep(2)}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  ← Changer le créneau
                </button>
              </div>

              {/* Récapitulatif */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                  Récapitulatif de votre cours
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Professeur :</span>
                    <div className="font-medium">{profData?.nom}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Spécialité :</span>
                    <div className="font-medium">{profData?.specialites?.[0] || 'Arabe général'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Date :</span>
                    <div className="font-medium">
                      {new Date(selectedDate).toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long' 
                      })}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Heure :</span>
                    <div className="font-medium">{selectedSlot.heure_debut} - {selectedSlot.heure_fin}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Durée :</span>
                    <div className="font-medium">{duration} minutes</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Prix :</span>
                    <div className="font-medium text-lg text-blue-600">{calculatePrice()}€</div>
                  </div>
                </div>
              </div>

              {/* Message optionnel */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message pour le professeur (optionnel)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Présentez-vous ou indiquez vos objectifs pour ce cours..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {message.length}/500 caractères
                </div>
              </div>

              {/* Informations importantes */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  À savoir
                </h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Votre demande sera envoyée au professeur pour validation</li>
                  <li>• Vous recevrez une notification dès qu'il aura répondu</li>
                  <li>• Le lien de cours vous sera fourni une fois la réservation confirmée</li>
                  <li>• Vous pourrez annuler jusqu'à 4h avant le début du cours</li>
                </ul>
              </div>

              {/* Boutons d'action */}
              <div className="flex space-x-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleBooking}
                  disabled={booking}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                >
                  {booking ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Euro className="h-4 w-4 mr-2" />
                      Confirmer la réservation
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingInterface;
