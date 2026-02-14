import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("--- Database Content Check ---");

  const userCount = await prisma.user.count();
  console.log(`Users: ${userCount}`);

  if (userCount > 0) {
    const users = await prisma.user.findMany({ take: 5 });
    console.log(
      "Sample Users:",
      users.map((u) => ({ id: u.id, email: u.email, name: u.name })),
    );
  }

  const orgCount = await prisma.organization.count();
  console.log(`Organizations: ${orgCount}`);

  const teamCount = await prisma.team.count();
  console.log(`Teams: ${teamCount}`);

  const worklogCount = await prisma.worklog.count();
  console.log(`Worklogs: ${worklogCount}`);

  const teamMembersCount = await prisma.teamMember.count();
  console.log(`Team Members: ${teamMembersCount}`);

  console.log("--- End Check ---");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
