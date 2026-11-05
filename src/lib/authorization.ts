
import { getSession } from "./session";
import { prisma } from "./prisma";

type Role = "ADMIN" | "ENSEIGNANT" | "ETUDIANT";

export async function requireRole(rolesAutorises: Role[]) {
  // Vérifier la session JWT
  const session = await getSession();

  if (!session) {
    return {
      ok: false as const,
      status: 401,
      user: null,
    };
  }

  // Récupérer l'utilisateur et son rôle depuis la base
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  // Vérifier que l'utilisateur existe
  if (!user) {
    return {
      ok: false as const,
      status: 401,
      user: null,
    };
  }

  // Vérifier que le rôle est valide et autorisé
  if (
    !["ADMIN", "ENSEIGNANT", "ETUDIANT"].includes(user.role) ||
    !rolesAutorises.includes(user.role as Role)
  ) {
    return {
      ok: false as const,
      status: 403,
      user: null,
    };
  }

  // Accès autorisé
  return {
    ok: true as const,
    status: 200,
    user,
  };
}
