import { useState, useEffect } from 'react';
import { projects } from '../api';

export default function ReportsComponent({ projectId }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  async function loadProject() {
    try {
      const response = await projects.get(projectId);
      setProject(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-6">Chargement...</div>;
  if (!project) return <div className="p-6">Projet non trouvé</div>;

  // Mock data for demo
  const progressPercent = 45;
  const dailyHours = [8, 7, 8, 7, 8, 6, 7];
  const teamMembers = project.team || [];

  return (
    <div className="p-6 space-y-8">
      <div>
        <h3 className="text-xl font-bold mb-4">Vue d'ensemble du projet</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card text-center">
            <p className="text-gray-600 mb-2">Progression</p>
            <p className="text-3xl font-bold text-blue-600">{progressPercent}%</p>
          </div>
          <div className="card text-center">
            <p className="text-gray-600 mb-2">Budget utilisé</p>
            <p className="text-3xl font-bold text-green-600">62%</p>
          </div>
          <div className="card text-center">
            <p className="text-gray-600 mb-2">Équipe</p>
            <p className="text-3xl font-bold text-purple-600">{teamMembers.length || 0}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-4">Barre de progression</h3>
        <div className="card">
          <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-400 to-blue-600 h-full flex items-center justify-center text-white font-bold"
              style={{ width: `${progressPercent}%` }}
            >
              {progressPercent}%
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-4">Heures par jour (dernière semaine)</h3>
        <div className="card">
          <div className="flex items-end justify-around h-48 gap-2">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, i) => (
              <div key={day} className="text-center">
                <div
                  className="bg-blue-600 rounded-t w-12"
                  style={{ height: `${(dailyHours[i] / 8) * 100}%` }}
                />
                <p className="text-sm text-gray-600 mt-2">{day}</p>
                <p className="text-xs font-bold">{dailyHours[i]}h</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-4">Équipe du projet</h3>
        {teamMembers.length === 0 ? (
          <p className="text-gray-500">Aucun membre d'équipe</p>
        ) : (
          <div className="card">
            <ul className="space-y-3">
              {teamMembers.map((member) => (
                <li key={member.id} className="flex justify-between items-center border-b pb-3 last:border-b-0">
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-gray-600">{member.role}</p>
                  </div>
                  {member.email && <p className="text-sm text-gray-500">{member.email}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="card text-center">
        <button className="btn-primary">Exporter en PDF</button>
      </div>
    </div>
  );
}
