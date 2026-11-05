
"use client";

import { useEffect, useState } from "react";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export default function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadUsers() {
    try {
      const response = await fetch("/api/users");

      if (!response.ok) {
        setError("Impossible de charger les utilisateurs.");
        return;
      }

      const data = await response.json();
      setUsers(data);
      setError("");
    } catch {
      setError("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function startEditing(user: User) {
    setEditingUser(user);
    setNewName(user.name);
    setNewEmail(user.email);
  }

  async function updateUser() {
    if (!editingUser) return;

    if (!newName.trim() || !newEmail.trim()) {
      setError("Le nom et l'email sont obligatoires.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/students/${editingUser.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newName.trim(),
            email: newEmail.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erreur lors de la modification.");
        return;
      }

      await loadUsers();
      setEditingUser(null);
    } catch {
      setError("Erreur de connexion au serveur.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser(user: User) {
    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer le compte de ${user.name} ?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/students/${user.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erreur lors de la suppression.");
        return;
      }

      setUsers((current) =>
        current.filter((item) => item.id !== user.id)
      );

      setError("");
    } catch {
      setError("Erreur de connexion au serveur.");
    }
  }

  if (loading) {
    return <p>Chargement des utilisateurs...</p>;
  }

  return (
    <section className="space-y-5">
      <h2 className="text-2xl font-bold">
        Gestion de tous les utilisateurs
      </h2>

      <p>Total : {users.length} utilisateur(s)</p>

      {error && (
        <p className="rounded-lg bg-red-100 p-3 text-red-700">
          {error}
        </p>
      )}

      {editingUser && (
        <div className="space-y-4 rounded-xl border p-5">
          <h3 className="text-lg font-semibold">
            Modifier un utilisateur
          </h3>

          <div>
            <label className="mb-1 block">Nom</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full rounded-lg border p-2"
            />
          </div>

          <div>
            <label className="mb-1 block">Email</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full rounded-lg border p-2"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={updateUser}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>

            <button
              onClick={() => setEditingUser(null)}
              className="rounded-lg border px-4 py-2"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Nom</th>
              <th className="p-3">Email</th>
              <th className="p-3">Rôle</th>
              <th className="p-3">Date de création</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center">
                  Aucun utilisateur trouvé.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-t">
                  <td className="p-3">{user.id}</td>
                  <td className="p-3">{user.name}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3">{user.role}</td>
                  <td className="p-3">
                    {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                  </td>

                  <td className="p-3">
                    {user.role === "ETUDIANT" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditing(user)}
                          className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
                        >
                          Modifier
                        </button>

                        <button
                          onClick={() => deleteUser(user)}
                          className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700"
                        >
                          Supprimer
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400">
                        Aucune action
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
