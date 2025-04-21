import { PrismaClient } from '../generated/prisma';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create test user if doesn't exist
  const existingUser = await prisma.user.findUnique({
    where: { email: 'test@example.com' }
  });

  let userId;

  if (!existingUser) {
    console.log('Creating test user...');
    const hashedPassword = await hash('password', 10);
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword
      }
    });
    userId = user.id;
    console.log(`Created user with id: ${userId}`);
  } else {
    userId = existingUser.id;
    console.log(`Using existing user with id: ${userId}`);
  }

  // Create subjects
  const subjects = [
    { name: '数学', color: '#4F46E5', icon: 'calculator' },
    { name: '物理', color: '#8B5CF6', icon: 'atom' },
    { name: '化学', color: '#EC4899', icon: 'flask' },
    { name: '生物', color: '#10B981', icon: 'leaf' },
    { name: '英语', color: '#3B82F6', icon: 'language' },
    { name: '语文', color: '#EF4444', icon: 'book' },
  ];

  console.log('Creating subjects...');

  for (const subject of subjects) {
    const existingSubject = await prisma.subject.findFirst({
      where: {
        name: subject.name,
        userId
      }
    });

    if (!existingSubject) {
      await prisma.subject.create({
        data: {
          name: subject.name,
          color: subject.color,
          icon: subject.icon,
          userId
        }
      });
      console.log(`Created subject: ${subject.name}`);
    } else {
      console.log(`Subject ${subject.name} already exists, skipping...`);
    }
  }

  // Create some example questions
  const firstSubject = await prisma.subject.findFirst({
    where: { userId }
  });

  if (firstSubject) {
    const questionCount = await prisma.question.count({
      where: { userId }
    });

    if (questionCount === 0) {
      console.log('Creating sample questions...');
      
      await prisma.question.create({
        data: {
          text: '求下列方程的解: x² + 5x + 6 = 0',
          answer: 'x = -2 或 x = -3',
          difficulty: 'MEDIUM',
          status: 'PENDING',
          userId,
          subjectId: firstSubject.id,
        }
      });

      await prisma.question.create({
        data: {
          text: '如果 f(x) = 2x + 3, 求 f(5) 的值。',
          answer: 'f(5) = 2(5) + 3 = 13',
          notes: 'f(5) = 2(5) + 3 = 10 + 3 = 13',
          difficulty: 'EASY',
          status: 'SOLVED',
          userId,
          subjectId: firstSubject.id,
        }
      });

      console.log('Sample questions created');
    } else {
      console.log('Questions already exist, skipping...');
    }
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 