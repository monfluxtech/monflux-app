import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { projects } from '../api';
import { useAuthStore, useProjectStore } from '../store';
import { Plus, LogOut } from 'lucide-react';

export default function Dashboard() {
  const [projectsList, setProjectsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectData, setNewProjectData] = useState({
    name: '',
    type: 'Rénovation',
    budget: ''
  });
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const setProjects = useProjectStore((state) => state.setProjects);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const response = await projects.list();
      setProjectsList(response.data);
      setProjects(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProject(e) {
    e.preventDefault();
    try {
      await projects.create({
        name: newProjectData.name,
        type: newProjectData.type,
        budget: newProjectData.budget ? parseFloat(newProjectData.budget) : null
      });
      setShowNewProject(false);
      setNewProjectData({ name: '', type: 'Rénovation', budget: '' });
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">MONFLUX</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-600 hover:text-red-600"
          >
            <LogOut size={20} />
            Déconnexion
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Mes Projets</h2>
          <button
            onClick={() => setShowNewProject(!showNewProject)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Nouveau Projet
          </button>
        </div>

        {/* New Project Form */}
        {showNewProject && (
          <form onSubmit={handleCreateProject} className="card mb-8">
            <h3 className="text-xl font-bold mb-4">Créer un nouveau projet</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  className="input-field"
                  value={newProjectData.name}
                  onChange={(e) => setNewProjectData({ ...newProjectData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  className="input-field"
                  value={newProjectData.type}
                  onChange={(e) => setNewProjectData({ ...newProjectData, type: e.target.value })}
                >
                  <option>Rénovation</option>
                  <option>Électrique</option>
                  <option>Plomberie</option>
                  <option>Générale</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                <input
                  type="number"
                  className="input-field"
                  value={newProjectData.budget}
                  onChange={(e) => setNewProjectData({ ...newProjectData, budget: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <button type="submit" className="btn-primary">Créer</button>
              <button
                type="button"
                onClick={() => setShowNewProject(false)}
                className="btn-secondary"
              >
                Annuler
              </button>
            </div>
          </form>
        )}

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center py-12">Chargement...</div>
        ) : projectsList.length === 0 ? (
          <div className="card text-center">
            <p className="text-gray-500 mb-4">Aucun projet. Créez votre premier projet!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectsList.map((project) => (
              <Link
                key={project.id}
                to={`/project/${project.id}`}
                className="card hover:shadow-lg cursor-pointer"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-2">{project.name}</h3>
                <p className="text-gray-600 mb-1">Type: {project.type}</p>
                {project.budget && <p className="text-gray-600 mb-3">Budget: ${project.budget}</p>}
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    project.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {project.status === 'active' ? 'Actif' : 'Complété'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
