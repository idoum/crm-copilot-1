'use server'

import { signIn, signOut } from '@/lib/auth'
import { AuthError } from 'next-auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { signupSchema, joinUserSchema } from '@/lib/validations'
import { normalizeEmail } from '@/lib/normalize'
import { env } from '@/lib/env'

export async function login(formData: FormData, redirectTo?: string) {
  try {
    await signIn('credentials', {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      redirectTo: redirectTo || '/app/clients',
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'invalidCredentials' }
        default:
          return { error: 'serverError' }
      }
    }
    throw error
  }
}

export async function logout() {
  await signOut({ redirectTo: '/login' })
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50) || 'workspace'
}

async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug
  let counter = 1
  
  while (await prisma.workspace.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`
    counter++
  }
  
  return slug
}

export type SignupResult = {
  success: true
} | {
  success: false
  error: 'emailExists' | 'validationError' | 'serverError'
  message?: string
}

export async function createTenantAccount(formData: FormData): Promise<SignupResult> {
  try {
    // Extract form data
    const rawData = {
      workspaceName: formData.get('workspaceName') as string,
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    }

    // Validate input
    const validation = signupSchema.safeParse(rawData)
    if (!validation.success) {
      return {
        success: false,
        error: 'validationError',
        message: validation.error.issues[0]?.message,
      }
    }

    const { workspaceName, name, email: rawEmail, password } = validation.data

    // Normalize email for consistent storage and lookup
    const email = normalizeEmail(rawEmail)

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return {
        success: false,
        error: 'emailExists',
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, env.BCRYPT_ROUNDS)

    // Generate unique workspace slug
    const slug = await ensureUniqueSlug(generateSlug(workspaceName))

    // Create user, workspace, and membership in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create workspace first
      const workspace = await tx.workspace.create({
        data: {
          name: workspaceName,
          slug,
        },
      })

      // Create user with selectedWorkspaceId
      const user = await tx.user.create({
        data: {
          email,
          name: name || null,
          password: hashedPassword,
          selectedWorkspaceId: workspace.id,
        },
      })

      // Create OWNER membership
      await tx.membership.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role: 'OWNER',
        },
      })

      return { user, workspace }
    })

    // Sign in the user after successful registration
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/app/clients',
    })

    return { success: true }
  } catch (error) {
    // If signIn throws a redirect, re-throw it
    if (error instanceof AuthError) {
      throw error
    }
    // Check for NEXT_REDIRECT (this is a redirect, not an error)
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }
    // Re-throw redirect errors from Next.js
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error
    }
    
    console.error('Signup error:', error)
    return {
      success: false,
      error: 'serverError',
    }
  }
}

// ============================================
// CREATE USER ONLY (for invitation flow)
// ============================================

export type CreateUserOnlyResult = {
  success: true
} | {
  success: false
  error: 'emailExists' | 'validationError' | 'serverError'
  message?: string
}

export async function createUserOnly(formData: FormData, redirectTo?: string): Promise<CreateUserOnlyResult> {
  try {
    // Extract form data
    const rawData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    }

    // Validate input
    const validation = joinUserSchema.safeParse(rawData)
    if (!validation.success) {
      return {
        success: false,
        error: 'validationError',
        message: validation.error.issues[0]?.message,
      }
    }

    const { name, email: rawEmail, password } = validation.data

    // Normalize email for consistent storage and lookup
    const email = normalizeEmail(rawEmail)

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return {
        success: false,
        error: 'emailExists',
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, env.BCRYPT_ROUNDS)

    // Create user only (no workspace, no membership)
    await prisma.user.create({
      data: {
        email,
        name: name || null,
        password: hashedPassword,
      },
    })

    // Sign in the user after successful registration
    await signIn('credentials', {
      email,
      password,
      redirectTo: redirectTo || '/app/clients',
    })

    return { success: true }
  } catch (error) {
    // If signIn throws a redirect, re-throw it
    if (error instanceof AuthError) {
      throw error
    }
    // Check for NEXT_REDIRECT (this is a redirect, not an error)
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }
    // Re-throw redirect errors from Next.js
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error
    }
    
    console.error('Create user only error:', error)
    return {
      success: false,
      error: 'serverError',
    }
  }
}
