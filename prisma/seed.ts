import { PrismaClient } from '../generated/prisma';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create a demo user
  const passwordHash = await hash('password123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      password: passwordHash,
    },
  });
  
  console.log(`Created user: ${user.name} (${user.email})`);
  
  // Create categories for this user
  const categories = [
    { name: 'Work', color: '#ff5722' },
    { name: 'Personal', color: '#4caf50' },
    { name: 'Health', color: '#2196f3' },
    { name: 'Shopping', color: '#9c27b0' },
  ];
  
  const createdCategories = await Promise.all(
    categories.map(async (category) => {
      return prisma.category.upsert({
        where: { 
          name_userId: {
            name: category.name,
            userId: user.id,
          }
        },
        update: { color: category.color },
        create: {
          name: category.name,
          color: category.color,
          userId: user.id,
        },
      });
    })
  );
  
  console.log(`Created ${createdCategories.length} categories`);
  
  // Create sample tasks for this user
  const tasks = [
    {
      title: 'Complete project proposal',
      description: 'Write and submit the project proposal for the new client',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      priority: 'HIGH',
      categoryName: 'Work',
    },
    {
      title: 'Buy groceries',
      description: 'Milk, eggs, bread, and vegetables',
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
      priority: 'MEDIUM',
      categoryName: 'Shopping',
    },
    {
      title: 'Morning run',
      description: '30 minutes jogging in the park',
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
      priority: 'LOW',
      categoryName: 'Health',
    },
    {
      title: 'Call mom',
      description: 'Catch up with mom on the weekend',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      priority: 'MEDIUM',
      categoryName: 'Personal',
    },
  ];
  
  const categoryMap = createdCategories.reduce((map, category) => {
    map[category.name] = category.id;
    return map;
  }, {} as Record<string, string>);
  
  const createdTasks = await Promise.all(
    tasks.map(async (task) => {
      return prisma.task.create({
        data: {
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          priority: task.priority as any,
          userId: user.id,
          categoryId: categoryMap[task.categoryName],
        },
      });
    })
  );
  
  console.log(`Created ${createdTasks.length} tasks`);
  
  console.log('Database seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 