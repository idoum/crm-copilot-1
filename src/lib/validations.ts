import { z } from 'zod'

// Client validation schemas
export const clientStatusSchema = z.enum(['PROSPECT', 'ACTIVE', 'INACTIVE'])

export const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  status: clientStatusSchema.default('PROSPECT'),
  tags: z.array(z.string()).default([]),
  note: z.string().max(5000).optional().or(z.literal('')),
})

export const updateClientSchema = createClientSchema.partial()

// Activity validation schemas
export const activityTypeSchema = z.enum(['NOTE', 'CALL', 'EMAIL', 'MEETING'])

export const createActivitySchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  type: activityTypeSchema,
  content: z.string().min(1, 'Content is required').max(10000),
  occurredAt: z.coerce.date().optional(),
})

// Follow-up validation schemas
export const followUpStatusSchema = z.enum(['OPEN', 'DONE'])

export const createFollowUpSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  reason: z.string().min(1, 'Reason is required').max(500),
  dueDate: z.coerce.date(),
})

export const updateFollowUpSchema = z.object({
  reason: z.string().min(1).max(500).optional(),
  dueDate: z.coerce.date().optional(),
  status: followUpStatusSchema.optional(),
})

// Workspace validation schemas
export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
})

// Signup validation schema
export const signupSchema = z.object({
  workspaceName: z.string().min(1, 'Workspace name is required').max(100),
  name: z.string().max(100).optional().or(z.literal('')),
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type SignupInput = z.infer<typeof signupSchema>

// Join user schema (signup without workspace)
export const joinUserSchema = z.object({
  name: z.string().max(100).optional().or(z.literal('')),
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type JoinUserInput = z.infer<typeof joinUserSchema>

// Invitation validation schemas
export const invitationRoleSchema = z.enum(['MEMBER', 'OWNER'])

export const generateInviteSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  role: invitationRoleSchema.default('MEMBER'),
})

export const acceptInviteSchema = z.object({
  token: z.string().min(1, 'Token is required'),
})

export type GenerateInviteInput = z.infer<typeof generateInviteSchema>
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>

// Password reset validation schemas
export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

// Change password validation schema (for logged-in users)
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(100),
  confirmNewPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Passwords do not match',
  path: ['confirmNewPassword'],
})

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

// Export types
export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
export type CreateActivityInput = z.infer<typeof createActivitySchema>
export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>
export type UpdateFollowUpInput = z.infer<typeof updateFollowUpSchema>
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>
