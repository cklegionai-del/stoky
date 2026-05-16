"use server"

import { prisma } from "@/lib/prisma"
import { auth, signIn, signOut } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import fs from "fs"
import path from "path"
import {
  loginSchema,
  registerSchema,
  callUploadSchema,
  evaluationSchema,
  rubricSchema,
  organizationSchema,
  keywordSchema,
  teamSchema,
} from "./validations"

// ─── Auth Actions ─────────────────────────────────────────

export async function authenticate(
  prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  try {
    const parsed = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    })
    if (!parsed.success) {
      return { error: "Invalid email or password" }
    }

    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    })

    revalidatePath("/dashboard")
    redirect("/dashboard")
  } catch (error) {
    if ((error as any)?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error
    }
    return { error: "Invalid email or password" }
  }
}

export async function register(
  prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string } | undefined> {
  try {
    const parsed = registerSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    })
    if (!parsed.success) {
      return { error: "Invalid registration data" }
    }

    const { name, email, password } = parsed.data

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return { error: "Email already registered" }
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    // Find or create default organization
    let org = await prisma.organization.findFirst({ where: { slug: "default" } })
    if (!org) {
      org = await prisma.organization.create({
        data: { name: "Default Organization", slug: "default" },
      })
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "ADMIN",
        organizationId: org.id,
      },
    })

    await prisma.auditLog.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        action: "CREATE",
        entityType: "USER",
        entityId: user.id,
      },
    })

    await signIn("credentials", { email, password, redirect: false })
    revalidatePath("/dashboard")
    redirect("/dashboard")
  } catch (error) {
    if ((error as any)?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error
    }
    return { error: "Registration failed" }
  }
}

export async function logout() {
  await signOut({ redirect: false })
  redirect("/login")
}

// ─── Call Actions ─────────────────────────────────────────

export async function uploadCall(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const organizationId = (session.user as any).organizationId
  if (!organizationId) return { error: "No organization" }

  const file = formData.get("file") as File
  if (!file) return { error: "No file provided" }

  const language = (formData.get("language") as string) || "EN"
  const teamId = formData.get("teamId") as string
  const agentId = formData.get("agentId") as string
  const phoneNumber = formData.get("phoneNumber") as string
  const callReference = formData.get("callReference") as string

  const parsed = callUploadSchema.safeParse({
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    language,
    teamId: teamId || undefined,
    agentId: agentId || undefined,
    phoneNumber: phoneNumber || undefined,
    callReference: callReference || undefined,
  })
  if (!parsed.success) return { error: "Invalid file data" }

  // Save file to public/audio directory
  const fileName = `${crypto.randomUUID()}-${file.name}`
  const filePath = `public/audio/${fileName}`
  const buffer = Buffer.from(await file.arrayBuffer())

  // Ensure directory exists
  const dir = path.join(process.cwd(), "public/audio")
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(path.join(process.cwd(), filePath), buffer)

  const call = await prisma.call.create({
    data: {
      organizationId,
      teamId: teamId || null,
      agentId: agentId || null,
      uploadedById: session.user.id,
      fileName: file.name,
      filePath: `/audio/${fileName}`,
      fileSize: file.size,
      mimeType: file.type,
      language: language as any,
      phoneNumber: phoneNumber || null,
      callReference: callReference || null,
      status: "UPLOADED",
    },
  })

  await prisma.auditLog.create({
    data: {
      organizationId,
      userId: session.user.id,
      action: "CREATE",
      entityType: "CALL",
      entityId: call.id,
    },
  })

  revalidatePath("/dashboard")
  revalidatePath("/calls")

  // Trigger async processing
  processCall(call.id).catch((err) => {
    console.error(`[Orianna] Background processing failed for call ${call.id}:`, err)
  })

  return { success: true, callId: call.id }
}

async function processCall(callId: string) {
  const { processAudio } = await import("@/lib/audio/processor")
  await processAudio(callId)
}

export async function assignForReview(callId: string, reviewerId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const organizationId = (session.user as any).organizationId
  if (!organizationId) return { error: "No organization" }

  // Verify the call belongs to this organization
  const call = await prisma.call.findUnique({
    where: { id: callId },
    select: { organizationId: true },
  })

  if (!call || call.organizationId !== organizationId) {
    return { error: "Call not found" }
  }

  await prisma.call.update({
    where: { id: callId },
    data: { assignedToId: reviewerId },
  })

  revalidatePath("/calls")
  return { success: true }
}

// ─── Evaluation Actions ───────────────────────────────────

export async function submitEvaluation(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const organizationId = (session.user as any).organizationId
  const data = JSON.parse(formData.get("data") as string)
  const parsed = evaluationSchema.safeParse(data)
  if (!parsed.success) return { error: "Invalid evaluation data" }

  const { callId, rubricId, scores, notes, feedback, coachingNotes, status } = parsed.data

  // Get rubric to calculate weighted score
  const rubric = rubricId
    ? await prisma.rubric.findUnique({ where: { id: rubricId }, include: { criteria: true } })
    : null

  let totalScore = 0
  let maxPossible = 0

  if (rubric) {
    for (const score of scores) {
      const criterion = rubric.criteria.find(c => c.id === score.criterionId)
      if (criterion) {
        totalScore += score.score * criterion.weight
        maxPossible += criterion.maxScore * criterion.weight
      }
    }
  }

  const weightedScore = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : null

  // Get previous evaluation for audit trail
  const existingEval = await prisma.evaluation.findFirst({
    where: { callId },
    orderBy: { createdAt: "desc" },
  })

  const evaluation = await prisma.evaluation.create({
    data: {
      organizationId,
      callId,
      rubricId: rubricId || null,
      reviewerId: session.user.id,
      totalScore: weightedScore,
      status: status as any,
      notes: notes || null,
      feedback: feedback || null,
      coachingNotes: coachingNotes || null,
      previousVersion: existingEval ? JSON.stringify(existingEval) : null,
      scores: {
        create: scores.map(s => ({
          criterionId: s.criterionId,
          score: s.score,
          comment: s.comment || null,
        })),
      },
    },
  })

  // Verify call belongs to this organization
  const call = await prisma.call.findUnique({
    where: { id: callId },
    select: { organizationId: true },
  })
  if (!call || call.organizationId !== organizationId) {
    return { error: "Call not found" }
  }

  // Update call status to REVIEWED
  await prisma.call.update({
    where: { id: callId },
    data: { status: "REVIEWED" },
  })

  await prisma.auditLog.create({
    data: {
      organizationId,
      userId: session.user.id,
      action: existingEval ? "UPDATE" : "CREATE",
      entityType: "EVALUATION",
      entityId: evaluation.id,
      changes: existingEval ? JSON.stringify({ before: existingEval.id, after: evaluation.id }) : undefined,
    },
  })

  revalidatePath("/calls")
  revalidatePath("/reviewer")
  return { success: true, evaluationId: evaluation.id }
}

// ─── Rubric Actions ───────────────────────────────────────

export async function createRubric(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const organizationId = (session.user as any).organizationId
  const data = JSON.parse(formData.get("data") as string)
  const parsed = rubricSchema.safeParse(data)
  if (!parsed.success) return { error: "Invalid rubric data" }

  const { name, description, maxScore, passingScore, criteria } = parsed.data

  const rubric = await prisma.rubric.create({
    data: {
      organizationId,
      name,
      description: description || null,
      maxScore,
      passingScore,
      criteria: {
        create: criteria.map((c, i) => ({
          name: c.name,
          description: c.description || null,
          weight: c.weight,
          maxScore: c.maxScore,
          orderIndex: i,
          category: c.category || null,
        })),
      },
    },
  })

  revalidatePath("/rubrics")
  revalidatePath("/admin/rubrics")
  return { success: true, rubricId: rubric.id }
}

// ─── Keyword Actions ──────────────────────────────────────

export async function createKeyword(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const organizationId = (session.user as any).organizationId
  const data = JSON.parse(formData.get("data") as string)
  const parsed = keywordSchema.safeParse(data)
  if (!parsed.success) return { error: "Invalid keyword data" }

  const keyword = await prisma.keyword.create({
    data: {
      organizationId,
      ...parsed.data,
    },
  })

  revalidatePath("/admin/keywords")
  return { success: true, keywordId: keyword.id }
}

// ─── Team Actions ─────────────────────────────────────────

export async function createTeam(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const organizationId = (session.user as any).organizationId
  const data = JSON.parse(formData.get("data") as string)
  const parsed = teamSchema.safeParse(data)
  if (!parsed.success) return { error: "Invalid team data" }

  const team = await prisma.team.create({
    data: { organizationId, ...parsed.data },
  })

  revalidatePath("/admin/teams")
  return { success: true, teamId: team.id }
}

export async function assignToTeam(userId: string, teamId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const organizationId = (session.user as any).organizationId
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  })
  if (!user || user.organizationId !== organizationId) {
    return { error: "User not found" }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { teamId },
  })

  revalidatePath("/admin/users")
  revalidatePath("/team-leader")
  return { success: true }
}

// ─── Organization Actions ─────────────────────────────────

export async function createOrganization(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const data = JSON.parse(formData.get("data") as string)
  const parsed = organizationSchema.safeParse(data)
  if (!parsed.success) return { error: "Invalid organization data" }

  const org = await prisma.organization.create({
    data: parsed.data,
  })

  revalidatePath("/admin")
  return { success: true, organizationId: org.id }
}

// ─── Alert Actions ────────────────────────────────────────

export async function acknowledgeAlert(alertId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const organizationId = (session.user as any).organizationId
  const alert = await prisma.alert.findUnique({
    where: { id: alertId },
    select: { organizationId: true },
  })
  if (!alert || alert.organizationId !== organizationId) {
    return { error: "Alert not found" }
  }

  await prisma.alert.update({
    where: { id: alertId },
    data: {
      status: "ACKNOWLEDGED",
      acknowledgedBy: session.user.id,
      acknowledgedAt: new Date(),
    },
  })

  revalidatePath("/alerts")
  return { success: true }
}

export async function resolveAlert(alertId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const organizationId = (session.user as any).organizationId
  const alert = await prisma.alert.findUnique({
    where: { id: alertId },
    select: { organizationId: true },
  })
  if (!alert || alert.organizationId !== organizationId) {
    return { error: "Alert not found" }
  }

  await prisma.alert.update({
    where: { id: alertId },
    data: {
      status: "RESOLVED",
      resolvedBy: session.user.id,
      resolvedAt: new Date(),
    },
  })

  revalidatePath("/alerts")
  return { success: true }
}
