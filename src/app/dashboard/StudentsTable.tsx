
"use client";

import { useEffect, useState } from "react";

type Student = {
  id: number;
  name: string;
  email: string;
  role: string;
  niveau: string | null;
  createdAt: string;
};

export default function StudentsTable() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [niveau, setNiveau] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadStudents() {
    try {
      const response = await fetch("/api/students");
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Impossible de charger les étudiants.");
        return;
      }

      setStudents(data);
      setError("");
    } catch {
      setError("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);

  function startEditing(student: Student) {
    setEditingId(student.id);
    setNiveau(student.niveau || "");
    setError("");
  }

  async function saveNiveau(id: number) {
    if (!niveau.trim()) {
      setError("Veuillez saisir un niveau.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/students/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          niveau: niveau.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erreur lors de la modification.");
        return;
      }

      setStudents((current) =>
        current.map((student) =>
          student.id === id
            ? { ...student, niveau: data.niveau }
            : student
        )
      );

      setEditingId(null);
    } catch {
      setError("Erreur de connexion au serveur.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p>Chargement des étudiants...</p>;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">
        Liste des étudiants
      </h2>

      <p>Total : {students.length} étudiant(s)</p>

      {error && (
        <p className="rounded-lg bg-red-100 p-3 text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Nom</th>
              <th className="p-3">Email</th>
              <th className="p-3">Niveau</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center">
                  Aucun étudiant trouvé.
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student.id} className="border-t">
                  <td className="p-3">{student.id}</td>
                  <td className="p-3">{student.name}</td>
                  <td className="p-3">{student.email}</td>

                  <td className="p-3">
                    {editingId === student.id ? (
                      <input
                        type="text"
                        value={niveau}
                        onChange={(e) => setNiveau(e.target.value)}
                        placeholder="Ex : 1ère année"
                        className="w-40 rounded border p-2"
                      />
                    ) : (
                      student.niveau || "Non renseigné"
                    )}
                  </td>

                  <td className="p-3">
                    {editingId === student.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveNiveau(student.id)}
                          disabled={saving}
                          className="rounded bg-green-600 px-3 py-1 text-white disabled:opacity-50"
                        >
                          {saving ? "..." : "Enregistrer"}
                        </button>

                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded border px-3 py-1"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditing(student)}
                        className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
                      >
                        Modifier le niveau
                      </button>
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
