import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../api';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    usagePreference: '',
    teamSize: '',
    sector: '',
    companyName: '',
    rbqNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  async function handleComplete() {
    setLoading(true);
    try {
      await auth.onboarding(data);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  const steps = [
    {
      title: "Comment vas-tu utiliser MONFLUX ?",
      options: ['Chat IA', 'Formulaires', 'Rapports', 'CRM'],
      key: 'usagePreference'
    },
    {
      title: "Taille de ton équipe",
      options: ['Solo', '2-5 personnes', '5-20 personnes', '+20 personnes'],
      key: 'teamSize'
    },
    {
      title: "Secteur de construction",
      options: ['Rénovation', 'Électrique', 'Plomberie', 'Générale', 'Autre'],
      key: 'sector'
    },
    {
      title: "Infos entreprise",
      type: 'form',
      fields: [
        { label: 'Nom entreprise', key: 'companyName', type: 'text' },
        { label: 'Numéro RBQ (optionnel)', key: 'rbqNumber', type: 'text' }
      ]
    }
  ];

  const currentStep = steps[step - 1];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="mb-8">
          <div className="flex justify-between mb-4">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                  s === step ? 'bg-blue-600 text-white' : s < step ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {s}
              </div>
            ))}
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">{currentStep.title}</h2>

        {currentStep.type === 'form' ? (
          <div className="space-y-4">
            {currentStep.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                <input
                  type={field.type}
                  className="input-field"
                  value={data[field.key] || ''}
                  onChange={(e) => setData({ ...data, [field.key]: e.target.value })}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {currentStep.options.map((option) => (
              <button
                key={option}
                onClick={() => setData({ ...data, [currentStep.key]: option })}
                className={`w-full p-4 border-2 rounded-lg font-medium transition ${
                  data[currentStep.key] === option
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-200 text-gray-700 hover:border-blue-300'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-4 mt-8">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="btn-secondary flex-1"
          >
            Précédent
          </button>
          <button
            onClick={step === 4 ? handleComplete : handleNext}
            disabled={loading}
            className="btn-primary flex-1"
          >
            {loading ? 'Chargement...' : step === 4 ? 'Terminer' : 'Suivant'}
          </button>
        </div>
      </div>
    </div>
  );
}
