
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authorization";

export async function GET() {
  const auth = await requireRole(["ADMIN"]);

  if (!auth.ok) {
    return NextResponse.json(
      { error: "Accès réservé à l'administrateur" },
      { status: auth.status }
    );
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(users);
}
