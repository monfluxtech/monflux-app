import { useState, useEffect } from 'react';
import { contacts } from '../api';
import { Trash2, Plus } from 'lucide-react';

export default function DatabaseComponent({ projectId }) {
  const [contactsList, setContactsList] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContacts();
  }, [projectId]);

  async function loadContacts() {
    try {
      const response = await contacts.list();
      setContactsList(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddContact(e) {
    e.preventDefault();
    try {
      await contacts.create(newContact);
      setNewContact({ name: '', email: '', phone: '', address: '' });
      setShowForm(false);
      loadContacts();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id) {
    if (confirm('Êtes-vous sûr?')) {
      try {
        await contacts.delete(id);
        loadContacts();
      } catch (err) {
        console.error(err);
      }
    }
  }

  if (loading) return <div className="p-6">Chargement...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">Contacts</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Nouveau Contact
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddContact} className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nom"
              className="input-field"
              value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              required
            />
            <input
              type="email"
              placeholder="Email"
              className="input-field"
              value={newContact.email}
              onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
            />
            <input
              type="tel"
              placeholder="Téléphone"
              className="input-field"
              value={newContact.phone}
              onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
            />
            <input
              type="text"
              placeholder="Adresse"
              className="input-field"
              value={newContact.address}
              onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
            />
          </div>
          <div className="flex gap-4 mt-4">
            <button type="submit" className="btn-primary">Ajouter</button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-secondary"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Nom</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Téléphone</th>
              <th className="px-4 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {contactsList.map((contact) => (
              <tr key={contact.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{contact.name}</td>
                <td className="px-4 py-3">{contact.email || '-'}</td>
                <td className="px-4 py-3">{contact.phone || '-'}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleDelete(contact.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
