// Type definitions to replace SQLite-incompatible enums

export const MembershipRole = {
  OWNER: 'OWNER',
  MEMBER: 'MEMBER',
} as const
export type MembershipRole = (typeof MembershipRole)[keyof typeof MembershipRole]

export const ClientStatus = {
  PROSPECT: 'PROSPECT',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const
export type ClientStatus = (typeof ClientStatus)[keyof typeof ClientStatus]

export const ActivityType = {
  NOTE: 'NOTE',
  CALL: 'CALL',
  EMAIL: 'EMAIL',
  MEETING: 'MEETING',
} as const
export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType]

export const FollowUpStatus = {
  OPEN: 'OPEN',
  DONE: 'DONE',
} as const
export type FollowUpStatus = (typeof FollowUpStatus)[keyof typeof FollowUpStatus]
