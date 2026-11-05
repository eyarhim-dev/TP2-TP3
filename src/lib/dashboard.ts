import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
  const dateLimite = new Date();
  dateLimite.setDate(dateLimite.getDate() - 30);

  const [
    totalEtudiants,
    nouveauxEtudiants,
    derniersEtudiants,
    repartitionNiveaux,
  ] = await Promise.all([
    // Nombre total d'étudiants
    prisma.user.count({
      where: { role: "ETUDIANT" },
    }),

    // Étudiants créés durant les 30 derniers jours
    prisma.user.count({
      where: {
        role: "ETUDIANT",
        createdAt: { gte: dateLimite },
      },
    }),

    // Les 5 derniers étudiants
    prisma.user.findMany({
      where: { role: "ETUDIANT" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        niveau: true,
        createdAt: true,
      },
    }),

    // Répartition par niveau
    prisma.user.groupBy({
      by: ["niveau"],
      where: { role: "ETUDIANT" },
      _count: { _all: true },
    }),
  ]);

  return {
    totalEtudiants,
    nouveauxEtudiants,
    derniersEtudiants,
    repartitionNiveaux,
  };
}