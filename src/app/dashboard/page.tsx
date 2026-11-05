
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getDashboardStats } from "@/lib/dashboard";
import LogoutButton from "@/components/LogoutButton";
import UsersTable from "./UsersTable";
import StudentsTable from "./StudentsTable";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      name: true,
      email: true,
      role: true,
      niveau: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const stats =
    user.role === "ADMIN" || user.role === "ENSEIGNANT"
      ? await getDashboardStats()
      : null;

  const maxNiveau = stats
    ? Math.max(
        ...stats.repartitionNiveaux.map(
          (item) => item._count._all
        ),
        1
      )
    : 1;

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-8 pt-16">
      <div>
        <h1 className="text-3xl font-bold">
          Bonjour {user.name} !
        </h1>
        <p className="mt-2 text-gray-600">
          Bienvenue dans votre espace personnel.
        </p>
      </div>

      <section className="space-y-3 rounded-xl border p-6">
        <h2 className="text-xl font-semibold">
          Informations du compte
        </h2>

        <p>Nom : {user.name}</p>
        <p>Email : {user.email}</p>
        <p>Rôle : {user.role}</p>

        {user.role === "ETUDIANT" && (
          <p>Niveau : {user.niveau || "Non renseigné"}</p>
        )}

        <p>
          Membre depuis :{" "}
          {user.createdAt.toLocaleDateString("fr-FR")}
        </p>
      </section>

      {(user.role === "ADMIN" ||
        user.role === "ENSEIGNANT") && (
        <section className="space-y-6">
          <h2 className="text-2xl font-bold">
            Tableau de bord
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">
                Total des étudiants
              </p>
              <p className="mt-2 text-3xl font-bold">
                {stats?.totalEtudiants ?? 0}
              </p>
            </div>

            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">
                Nouveaux étudiants (30 jours)
              </p>
              <p className="mt-2 text-3xl font-bold">
                {stats?.nouveauxEtudiants ?? 0}
              </p>
            </div>

            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">
                Niveaux représentés
              </p>
              <p className="mt-2 text-3xl font-bold">
                {stats?.repartitionNiveaux.length ?? 0}
              </p>
            </div>
          </div>

          <div className="space-y-5 rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">
              Répartition des étudiants par niveau
            </h2>

            {!stats || stats.repartitionNiveaux.length === 0 ? (
              <p className="text-gray-500">
                Aucun étudiant à afficher.
              </p>
            ) : (
              <div className="space-y-4">
                {stats.repartitionNiveaux.map((item) => {
                  const nombre = item._count._all;
                  const largeur = (nombre / maxNiveau) * 100;

                  return (
                    <div
                      key={item.niveau ?? "sans-niveau"}
                      className="space-y-2"
                    >
                      <div className="flex justify-between text-sm">
                        <span>
                          {item.niveau || "Non renseigné"}
                        </span>
                        <span className="font-semibold">
                          {nombre}
                        </span>
                      </div>

                      <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{ width: `${largeur}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">
              Les 5 derniers étudiants ajoutés
            </h2>

            {!stats || stats.derniersEtudiants.length === 0 ? (
              <p className="text-gray-500">
                Aucun étudiant enregistré.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="p-3">Nom</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Niveau</th>
                      <th className="p-3">Date d'ajout</th>
                    </tr>
                  </thead>

                  <tbody>
                    {stats.derniersEtudiants.map((etudiant) => (
                      <tr key={etudiant.id} className="border-b">
                        <td className="p-3">{etudiant.name}</td>
                        <td className="p-3">{etudiant.email}</td>
                        <td className="p-3">
                          {etudiant.niveau || "Non renseigné"}
                        </td>
                        <td className="p-3">
                          {etudiant.createdAt.toLocaleDateString("fr-FR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {user.role === "ADMIN" && <UsersTable />}

      {user.role === "ENSEIGNANT" && (
        <section className="space-y-4 rounded-xl border p-6">
          <h2 className="text-xl font-semibold">
            Espace Enseignant
          </h2>
          <p>
            Consultez les étudiants et modifiez leurs niveaux.
          </p>
          <StudentsTable />
        </section>
      )}

      {user.role === "ETUDIANT" && (
        <section className="rounded-xl border p-6">
          <h2 className="text-xl font-semibold">
            Espace Étudiant
          </h2>
          <p>Consultez vos informations personnelles.</p>
        </section>
      )}

      <LogoutButton />
    </main>
  );
}