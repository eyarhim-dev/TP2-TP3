
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authorization";
import { registerSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireRole([
    "ADMIN",
    "ENSEIGNANT",
    "ETUDIANT",
  ]);

  if (!auth.ok) {
    return NextResponse.json(
      { error: "Accès interdit" },
      { status: auth.status }
    );
  }

  const users = await prisma.user.findMany({
    where:
      auth.user.role === "ETUDIANT"
        ? { id: auth.user.id }
        : { role: "ETUDIANT" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      niveau: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const auth = await requireRole(["ADMIN"]);

  if (!auth.ok) {
    return NextResponse.json(
      { error: "Accès interdit" },
      { status: auth.status }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "Cet email est déjà utilisé." },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const student = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "ETUDIANT",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      niveau: true,
      createdAt: true,
    },
  });

  return NextResponse.json(student, { status: 201 });
}
