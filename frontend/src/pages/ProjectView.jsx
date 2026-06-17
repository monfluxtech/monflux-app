import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projects, chat, forms, contacts } from '../api';
import ChatComponent from '../components/ChatComponent';
import FormComponent from '../components/FormComponent';
import DatabaseComponent from '../components/DatabaseComponent';
import ReportsComponent from '../components/ReportsComponent';
import { ArrowLeft } from 'lucide-react';

export default function ProjectView() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  async function fetchProject() {
    try {
      const response = await projects.get(projectId);
      setProject(response.data);
    } catch (err) {
      console.error(err);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-12 text-center">Chargement...</div>;
  if (!project) return <div className="p-12 text-center">Projet non trouvé</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{project.name}</h1>
              <p className="text-gray-600">{project.type} • Budget: ${project.budget || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex border-b border-gray-200 mb-8">
          {[
            { id: 'chat', label: '💬 Chat IA' },
            { id: 'forms', label: '📋 Formulaires' },
            { id: 'database', label: '📊 Base de données' },
            { id: 'reports', label: '📈 Rapports' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'chat' && <ChatComponent projectId={projectId} />}
          {activeTab === 'forms' && <FormComponent projectId={projectId} />}
          {activeTab === 'database' && <DatabaseComponent projectId={projectId} />}
          {activeTab === 'reports' && <ReportsComponent projectId={projectId} />}
        </div>
      </div>
    </div>
  );
}
