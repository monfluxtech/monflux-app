import { useState, useEffect } from 'react';
import { forms } from '../api';

export default function FormComponent({ projectId }) {
  const [templates, setTemplates] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
    loadSubmissions();
  }, [projectId]);

  async function loadTemplates() {
    try {
      const response = await forms.templates();
      setTemplates(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadSubmissions() {
    try {
      const response = await forms.submissions(projectId);
      setSubmissions(response.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await forms.submit(projectId, selectedTemplate, formData);
      setFormData({});
      setSelectedTemplate(null);
      loadSubmissions();
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) return <div className="p-6">Chargement...</div>;

  return (
    <div className="p-6">
      {!selectedTemplate ? (
        <div>
          <h3 className="text-xl font-bold mb-4">Formulaires disponibles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {Object.entries(templates).map(([key, template]) => (
              <button
                key={key}
                onClick={() => setSelectedTemplate(key)}
                className="card hover:shadow-lg text-left"
              >
                <h4 className="font-bold text-lg">{template.name}</h4>
                <p className="text-gray-600 text-sm">{template.fields.length} champs</p>
              </button>
            ))}
          </div>

          <h3 className="text-xl font-bold mb-4">Soumissions récentes</h3>
          {submissions.length === 0 ? (
            <p className="text-gray-500">Aucune soumission</p>
          ) : (
            <div className="space-y-2">
              {submissions.map((sub) => (
                <div key={sub.id} className="card">
                  <p className="font-medium">{sub.form_type}</p>
                  <p className="text-sm text-gray-500">{new Date(sub.submitted_at).toLocaleString('fr-CA')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <button
            onClick={() => setSelectedTemplate(null)}
            className="text-blue-600 hover:underline mb-4"
          >
            ← Retour
          </button>
          <h3 className="text-xl font-bold mb-4">{templates[selectedTemplate].name}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {templates[selectedTemplate].fields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                {field.type === 'textarea' ? (
                  <textarea
                    className="input-field"
                    value={formData[field.id] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                  />
                ) : field.type === 'select' ? (
                  <select
                    className="input-field"
                    value={formData[field.id] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                  >
                    <option>Sélectionner...</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    className="input-field"
                    value={formData[field.id] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                  />
                )}
              </div>
            ))}
            <div className="flex gap-4">
              <button type="submit" className="btn-primary">Soumettre</button>
              <button
                type="button"
                onClick={() => setSelectedTemplate(null)}
                className="btn-secondary"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
