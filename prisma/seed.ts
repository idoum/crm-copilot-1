import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Get bcrypt rounds from env or use default
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10', 10)

async function main() {
  // Safety: prevent seeding in production
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Seed is disabled in production. Set ALLOW_SEED=true to override.')
    if (process.env.ALLOW_SEED !== 'true') {
      process.exit(1)
    }
    console.warn('⚠️  ALLOW_SEED=true detected. Proceeding with seed in production...')
  }

  console.log('🌱 Starting seed...')

  // Hash the demo password
  const hashedPassword = await bcrypt.hash('demo123', BCRYPT_ROUNDS)

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      password: hashedPassword,
    },
  })
  console.log('✅ Created user:', user.email)

  // Create demo workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'demo-workspace' },
    update: {},
    create: {
      name: 'Mon Entreprise',
      slug: 'demo-workspace',
    },
  })
  console.log('✅ Created workspace:', workspace.name)

  // Create membership (OWNER)
  await prisma.membership.upsert({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId: workspace.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      workspaceId: workspace.id,
      role: 'OWNER',
    },
  })
  console.log('✅ Created membership for user')

  // Create sample clients
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        workspaceId: workspace.id,
        name: 'Marie Dupont',
        email: 'marie.dupont@email.com',
        phone: '+33 6 12 34 56 78',
        status: 'ACTIVE',
        tags: JSON.stringify(['VIP', 'Paris']),
        note: 'Cliente fidèle depuis 2023',
      },
    }),
    prisma.client.create({
      data: {
        workspaceId: workspace.id,
        name: 'Jean Martin',
        email: 'jean.martin@entreprise.fr',
        phone: '+33 6 98 76 54 32',
        status: 'PROSPECT',
        tags: JSON.stringify(['B2B', 'Lyon']),
        note: 'Intéressé par notre offre premium',
      },
    }),
    prisma.client.create({
      data: {
        workspaceId: workspace.id,
        name: 'Sophie Bernard',
        email: 'sophie.b@gmail.com',
        phone: '+33 6 55 44 33 22',
        status: 'ACTIVE',
        tags: JSON.stringify(['Particulier']),
      },
    }),
    prisma.client.create({
      data: {
        workspaceId: workspace.id,
        name: 'Pierre Durand',
        email: 'p.durand@societe.com',
        status: 'INACTIVE',
        tags: JSON.stringify(['B2B', 'Ancien']),
        note: "N'a pas renouvelé son contrat",
      },
    }),
    prisma.client.create({
      data: {
        workspaceId: workspace.id,
        name: 'Claire Lefebvre',
        email: 'claire.lefebvre@mail.com',
        phone: '+33 6 11 22 33 44',
        status: 'PROSPECT',
        tags: JSON.stringify(['Recommandation']),
      },
    }),
  ])
  console.log('✅ Created', clients.length, 'clients')

  // Create sample activities
  const activities = await Promise.all([
    prisma.activity.create({
      data: {
        workspaceId: workspace.id,
        clientId: clients[0].id,
        type: 'MEETING',
        content: 'Réunion de suivi trimestriel. La cliente est très satisfaite de nos services.',
        occurredAt: new Date('2026-01-20T14:00:00'),
      },
    }),
    prisma.activity.create({
      data: {
        workspaceId: workspace.id,
        clientId: clients[0].id,
        type: 'EMAIL',
        content: 'Envoi du récapitulatif de la réunion et des prochaines étapes.',
        occurredAt: new Date('2026-01-20T16:30:00'),
      },
    }),
    prisma.activity.create({
      data: {
        workspaceId: workspace.id,
        clientId: clients[1].id,
        type: 'CALL',
        content: "Premier appel de découverte. Très intéressé par l'offre premium.",
        occurredAt: new Date('2026-01-22T10:00:00'),
      },
    }),
    prisma.activity.create({
      data: {
        workspaceId: workspace.id,
        clientId: clients[1].id,
        type: 'NOTE',
        content: 'À recontacter la semaine prochaine pour proposition commerciale.',
        occurredAt: new Date('2026-01-22T10:30:00'),
      },
    }),
    prisma.activity.create({
      data: {
        workspaceId: workspace.id,
        clientId: clients[2].id,
        type: 'EMAIL',
        content: 'Réponse à sa demande de renseignements sur les tarifs.',
        occurredAt: new Date('2026-01-24T09:15:00'),
      },
    }),
  ])
  console.log('✅ Created', activities.length, 'activities')

  // Create sample follow-ups
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)

  const followUps = await Promise.all([
    prisma.followUp.create({
      data: {
        workspaceId: workspace.id,
        clientId: clients[1].id,
        reason: 'Envoyer proposition commerciale',
        dueDate: today,
        status: 'OPEN',
      },
    }),
    prisma.followUp.create({
      data: {
        workspaceId: workspace.id,
        clientId: clients[0].id,
        reason: 'Appel de courtoisie mensuel',
        dueDate: tomorrow,
        status: 'OPEN',
      },
    }),
    prisma.followUp.create({
      data: {
        workspaceId: workspace.id,
        clientId: clients[4].id,
        reason: 'Relancer après premier contact',
        dueDate: yesterday,
        status: 'OPEN',
      },
    }),
    prisma.followUp.create({
      data: {
        workspaceId: workspace.id,
        clientId: clients[2].id,
        reason: 'Proposer renouvellement abonnement',
        dueDate: nextWeek,
        status: 'OPEN',
      },
    }),
    prisma.followUp.create({
      data: {
        workspaceId: workspace.id,
        clientId: clients[3].id,
        reason: 'Tenter réactivation',
        dueDate: yesterday,
        status: 'DONE',
      },
    }),
  ])
  console.log('✅ Created', followUps.length, 'follow-ups')

  console.log('🎉 Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
