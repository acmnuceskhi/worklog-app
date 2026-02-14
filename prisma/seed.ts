/* eslint-disable @typescript-eslint/no-empty-object-type */
import { PrismaClient, Prisma } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { trackOperation, logOperationSummary } from "../lib/db-operations";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
  transactionOptions: {
    maxWait: 20000, // 20 seconds
    timeout: 20000, // 20 seconds
  },
});

// Environment safety check
if (process.env.NODE_ENV === "production") {
  console.error("❌ Seeding is not allowed in production environment!");
  process.exit(1);
}

// Seed data for comprehensive testing
const userData: Prisma.UserCreateInput[] = [
  {
    name: "Alice Johnson",
    email: "alice.johnson@nu.edu.pk",
    emailVerified: new Date(),
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
  },
  {
    name: "Bob Smith",
    email: "bob.smith@nu.edu.pk",
    emailVerified: new Date(),
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
  },
  {
    name: "Carol Williams",
    email: "carol.williams@nu.edu.pk",
    emailVerified: new Date(),
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=carol",
  },
  {
    name: "David Brown",
    email: "david.brown@nu.edu.pk",
    emailVerified: new Date(),
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
  },
  {
    name: "Eva Davis",
    email: "eva.davis@nu.edu.pk",
    emailVerified: new Date(),
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=eva",
  },
  {
    name: "Frank Miller",
    email: "frank.miller@nu.edu.pk",
    emailVerified: new Date(),
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=frank",
  },
];

// Organization data - will be created with owner relation
const organizationData = [
  {
    name: "TechCorp Solutions",
    description: "Leading technology solutions provider",
    credits: 1000,
  },
  {
    name: "InnovateLabs",
    description: "Research and development laboratory",
    credits: 750,
  },
];

// Team data - will be created with owner and organization relations
const teamData = [
  {
    name: "Frontend Development",
    description: "React and Next.js development team",
    project: "Customer Portal Redesign",
    credits: 500,
  },
  {
    name: "Backend Development",
    description: "API and database development team",
    project: "Microservices Migration",
    credits: 600,
  },
  {
    name: "DevOps Team",
    description: "Infrastructure and deployment team",
    project: "Cloud Migration",
    credits: 400,
  },
  {
    name: "QA Team",
    description: "Quality assurance and testing team",
    project: "Automated Testing Suite",
    credits: 300,
  },
  {
    name: "Design Team",
    description: "UI/UX design and prototyping team",
    project: "Design System Creation",
    credits: 250,
  },
];

// Worklog data - will be created with user and team relations
const worklogData = [
  {
    title: "Implement user authentication flow",
    description:
      "Complete the login and registration system with email verification and password reset functionality.",
    githubLink: "https://github.com/techcorp/auth-service/pull/123",
    progressStatus: "COMPLETED" as const,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  },
  {
    title: "Design database schema for user management",
    description:
      "Create comprehensive database schema including users, roles, permissions, and audit logs.",
    progressStatus: "REVIEWED" as const,
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
  },
  {
    title: "Set up CI/CD pipeline",
    description:
      "Configure automated testing, building, and deployment pipeline using GitHub Actions.",
    githubLink: "https://github.com/techcorp/infrastructure/pull/456",
    progressStatus: "HALF_DONE" as const,
    deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago (overdue)
  },
  {
    title: "Create API documentation",
    description:
      "Document all REST API endpoints with examples, request/response formats, and error codes.",
    progressStatus: "STARTED" as const,
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
  },
  {
    title: "Implement responsive design",
    description:
      "Ensure all components work properly on mobile, tablet, and desktop devices.",
    progressStatus: "GRADED" as const,
    deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
  },
  {
    title: "Performance optimization",
    description:
      "Optimize database queries, implement caching, and improve page load times.",
    progressStatus: "STARTED" as const,
  },
  {
    title: "Security audit and fixes",
    description:
      "Conduct comprehensive security review and implement necessary fixes.",
    progressStatus: "HALF_DONE" as const,
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
  },
  {
    title: "User feedback integration",
    description: "Implement user feedback collection and analysis system.",
    progressStatus: "COMPLETED" as const,
  },
];

// Rating data - will be created with worklog and rater relations
const ratingData = [
  {
    value: 9,
    comment:
      "Excellent work on the authentication flow. Clean code and thorough testing.",
  },
  {
    value: 8,
    comment: "Good database design with proper relationships and indexing.",
  },
  {
    value: 7,
    comment: "Decent work but could use more comprehensive error handling.",
  },
  {
    value: 10,
    comment:
      "Outstanding responsive design implementation. Works perfectly across all devices.",
  },
];

async function seedUsers(
  tx: Prisma.TransactionClient,
): Promise<Prisma.UserGetPayload<{}>[]> {
  console.log("👥 Creating users...");
  const users: Prisma.UserGetPayload<{}>[] = [];
  for (const user of userData) {
    const createdUser = await tx.user.create({
      data: user,
    });
    users.push(createdUser);
    trackOperation("user.create");
  }
  return users;
}

async function seedOrganizations(
  tx: Prisma.TransactionClient,
  users: Prisma.UserGetPayload<{}>[],
): Promise<Prisma.OrganizationGetPayload<{}>[]> {
  console.log("🏢 Creating organizations...");
  const organizations: Prisma.OrganizationGetPayload<{}>[] = [];
  for (let i = 0; i < organizationData.length; i++) {
    const org = await tx.organization.create({
      data: {
        ...organizationData[i],
        owner: {
          connect: { id: users[i].id },
        },
      },
    });
    organizations.push(org);
    trackOperation("organization.create");
  }
  return organizations;
}

async function seedTeams(
  tx: Prisma.TransactionClient,
  users: Prisma.UserGetPayload<{}>[],
  organizations: Prisma.OrganizationGetPayload<{}>[],
): Promise<Prisma.TeamGetPayload<{}>[]> {
  console.log("👥 Creating teams...");
  const teams: Prisma.TeamGetPayload<{}>[] = [];
  for (let i = 0; i < teamData.length; i++) {
    const team = await tx.team.create({
      data: {
        ...teamData[i],
        owner: {
          connect: { id: users[i % users.length].id },
        },
        organization:
          i < 3
            ? {
                connect: { id: organizations[0].id },
              }
            : i < 4
              ? {
                  connect: { id: organizations[1].id },
                }
              : undefined,
      },
    });
    teams.push(team);
    trackOperation("team.create");
  }
  return teams;
}

async function seedMemberships(
  tx: Prisma.TransactionClient,
  users: Prisma.UserGetPayload<{}>[],
  teams: Prisma.TeamGetPayload<{}>[],
): Promise<void> {
  console.log("🔗 Creating team memberships...");
  const memberships = [
    // TechCorp teams
    { teamIndex: 0, userIndex: 0, status: "ACCEPTED" }, // Alice in Frontend (owner)
    { teamIndex: 0, userIndex: 2, status: "ACCEPTED" }, // Carol in Frontend
    { teamIndex: 0, userIndex: 3, status: "PENDING" }, // David invited to Frontend
    { teamIndex: 1, userIndex: 1, status: "ACCEPTED" }, // Bob in Backend (owner)
    { teamIndex: 1, userIndex: 4, status: "ACCEPTED" }, // Eva in Backend
    { teamIndex: 2, userIndex: 0, status: "ACCEPTED" }, // Alice in DevOps

    // InnovateLabs teams
    { teamIndex: 3, userIndex: 1, status: "ACCEPTED" }, // Bob in QA (owner)
    { teamIndex: 3, userIndex: 5, status: "ACCEPTED" }, // Frank in QA

    // Standalone teams
    { teamIndex: 4, userIndex: 2, status: "ACCEPTED" }, // Carol in Design (owner)
  ];

  for (const membership of memberships) {
    await tx.teamMember.create({
      data: {
        team: {
          connect: { id: teams[membership.teamIndex].id },
        },
        user: {
          connect: { id: users[membership.userIndex].id },
        },
        email: users[membership.userIndex].email!,
        status: membership.status as "PENDING" | "ACCEPTED" | "REJECTED",
        joinedAt: membership.status === "ACCEPTED" ? new Date() : null,
      },
    });
    trackOperation("teamMember.create");
  }
}

async function seedWorklogs(
  tx: Prisma.TransactionClient,
  users: Prisma.UserGetPayload<{}>[],
  teams: Prisma.TeamGetPayload<{}>[],
): Promise<Prisma.WorklogGetPayload<{}>[]> {
  console.log("📝 Creating worklogs...");
  const worklogs: Prisma.WorklogGetPayload<{}>[] = [];
  for (let i = 0; i < worklogData.length; i++) {
    const worklog = await tx.worklog.create({
      data: {
        ...worklogData[i],
        user: {
          connect: { id: users[i % users.length].id },
        },
        team: {
          connect: { id: teams[i % teams.length].id },
        },
      },
    });
    worklogs.push(worklog);
    trackOperation("worklog.create");
  }
  return worklogs;
}

async function seedRatings(
  tx: Prisma.TransactionClient,
  worklogs: Prisma.WorklogGetPayload<{}>[],
  organizations: Prisma.OrganizationGetPayload<{}>[],
): Promise<void> {
  console.log("⭐ Creating ratings...");
  const gradableWorklogs = worklogs.filter(
    (w) => w.progressStatus === "REVIEWED" || w.progressStatus === "GRADED",
  );

  for (
    let i = 0;
    i < Math.min(ratingData.length, gradableWorklogs.length);
    i++
  ) {
    await tx.rating.create({
      data: {
        ...ratingData[i],
        worklog: {
          connect: { id: gradableWorklogs[i].id },
        },
        rater: {
          connect: { id: organizations[0].ownerId },
        },
      },
    });
    trackOperation("rating.create");
  }
}

export async function main() {
  console.log("🌱 Checking database state...");

  // Check if database is already seeded
  const userCount = await prisma.user.count();
  trackOperation("user.count");
  const orgCount = await prisma.organization.count();
  trackOperation("organization.count");
  const teamCount = await prisma.team.count();
  trackOperation("team.count");

  if (userCount >= 6 && orgCount >= 2 && teamCount >= 5) {
    console.log("✅ Database already seeded. Skipping full seeding...");
    console.log(
      `📊 Found ${userCount} users, ${orgCount} organizations, ${teamCount} teams`,
    );
    console.log("💡 Tip: Use 'npm run db:seed:test-users' for test user setup");
    return;
  }

  console.log("🌱 Starting database seeding...");

  try {
    await prisma.$transaction(async (tx) => {
      // Clear existing data in reverse dependency order
      console.log("🧹 Clearing existing data...");
      await tx.rating.deleteMany();
      trackOperation("rating.deleteMany");
      await tx.worklog.deleteMany();
      trackOperation("worklog.deleteMany");
      await tx.teamMember.deleteMany();
      trackOperation("teamMember.deleteMany");
      await tx.team.deleteMany();
      trackOperation("team.deleteMany");
      await tx.organization.deleteMany();
      trackOperation("organization.deleteMany");
      await tx.user.deleteMany();
      trackOperation("user.deleteMany");
      await tx.account.deleteMany();
      trackOperation("account.deleteMany");
      await tx.session.deleteMany();
      trackOperation("session.deleteMany");
      await tx.verificationToken.deleteMany();
      trackOperation("verificationToken.deleteMany");

      // Seed data in dependency order
      const users = await seedUsers(tx);
      const organizations = await seedOrganizations(tx, users);
      const teams = await seedTeams(tx, users, organizations);
      await seedMemberships(tx, users, teams);
      const worklogs = await seedWorklogs(tx, users, teams);
      await seedRatings(tx, worklogs, organizations);

      console.log("✅ Database seeding completed successfully!");
      console.log(`📊 Created:`);
      console.log(`   - ${users.length} users`);
      console.log(`   - ${organizations.length} organizations`);
      console.log(`   - ${teams.length} teams`);
      console.log(`   - 9 team memberships`);
      console.log(`   - ${worklogs.length} worklogs`);
      console.log(
        `   - ${Math.min(ratingData.length, worklogs.filter((w) => w.progressStatus === "REVIEWED" || w.progressStatus === "GRADED").length)} ratings`,
      );
      console.log("\n🎉 Ready for testing!");
    });

    // Log operation summary
    logOperationSummary();
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
