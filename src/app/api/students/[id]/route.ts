
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authorization";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const adminSchema = z.object({
  name: z.string().trim().min(2).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
}).strict().refine(
  (data) => data.name !== undefined || data.email !== undefined,
  { message: "Aucune modification fournie" }
);

const teacherSchema = z.object({
  niveau: z.string().trim().min(1, "Le niveau est obligatoire"),
}).strict();

async function getStudent(id: number) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });
}

export async function PATCH(req: Request, context: RouteContext) {
  const auth = await requireRole(["ADMIN", "ENSEIGNANT"]);

  if (!auth.ok) {
    return NextResponse.json(
      { error: "Accès interdit" },
      { status: auth.status }
    );
  }

  const { id } = await context.params;
  const studentId = Number(id);

  if (!Number.isInteger(studentId) || studentId <= 0) {
    return NextResponse.json(
      { error: "Identifiant invalide" },
      { status: 400 }
    );
  }

  const student = await getStudent(studentId);

  if (!student || student.role !== "ETUDIANT") {
    return NextResponse.json(
      { error: "Étudiant introuvable" },
      { status: 404 }
    );
  }

  const body = await req.json().catch(() => null);

  if (auth.user.role === "ADMIN") {
    const parsed = adminSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides" },
        { status: 400 }
      );
    }

    if (parsed.data.email) {
      const existing = await prisma.user.findFirst({
        where: {
          email: parsed.data.email,
          NOT: { id: studentId },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Cet email est déjà utilisé." },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id: studentId },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        niveau: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updated);
  }

  const parsed = teacherSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Le niveau est obligatoire." },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: studentId },
    data: { niveau: parsed.data.niveau },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      niveau: true,
      createdAt: true,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, context: RouteContext) {
  const auth = await requireRole(["ADMIN"]);

  if (!auth.ok) {
    return NextResponse.json(
      { error: "Accès interdit" },
      { status: auth.status }
    );
  }

  const { id } = await context.params;
  const studentId = Number(id);

  if (!Number.isInteger(studentId) || studentId <= 0) {
    return NextResponse.json(
      { error: "Identifiant invalide" },
      { status: 400 }
    );
  }

  const student = await getStudent(studentId);

  if (!student || student.role !== "ETUDIANT") {
    return NextResponse.json(
      { error: "Étudiant introuvable" },
      { status: 404 }
    );
  }

  await prisma.user.delete({
    where: { id: studentId },
  });

  return NextResponse.json({
    message: "Étudiant supprimé avec succès.",
  });
}
