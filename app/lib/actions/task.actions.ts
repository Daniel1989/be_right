'use server';

import { prisma } from '../prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Define Priority enum to match the Prisma schema
enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  categoryId: z.string().optional().nullable(),
});

export type TaskFormData = z.infer<typeof CreateTaskSchema>;

export async function createTask(userId: string, formData: TaskFormData) {
  try {
    const validatedFields = CreateTaskSchema.parse(formData);
    
    const { title, description, dueDate, priority, categoryId } = validatedFields;
    
    await prisma.task.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority as Priority,
        userId,
        categoryId: categoryId || undefined,
      },
    });
    
    revalidatePath('/tasks');
    return { success: true };
  } catch (error) {
    console.error('Failed to create task:', error);
    return { success: false, error: 'Failed to create task' };
  }
}

export async function getTasks(userId: string) {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        userId,
      },
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return { success: true, data: tasks };
  } catch (error) {
    console.error('Failed to get tasks:', error);
    return { success: false, error: 'Failed to fetch tasks' };
  }
}

export async function updateTask(taskId: string, userId: string, formData: TaskFormData) {
  try {
    const validatedFields = CreateTaskSchema.parse(formData);
    
    const { title, description, dueDate, priority, categoryId } = validatedFields;
    
    await prisma.task.update({
      where: {
        id: taskId,
        userId, // Ensure the task belongs to the user
      },
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority as Priority,
        categoryId: categoryId || null,
      },
    });
    
    revalidatePath('/tasks');
    return { success: true };
  } catch (error) {
    console.error('Failed to update task:', error);
    return { success: false, error: 'Failed to update task' };
  }
}

export async function deleteTask(taskId: string, userId: string) {
  try {
    await prisma.task.delete({
      where: {
        id: taskId,
        userId, // Ensure the task belongs to the user
      },
    });
    
    revalidatePath('/tasks');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete task:', error);
    return { success: false, error: 'Failed to delete task' };
  }
}

export async function toggleTaskCompletion(taskId: string, userId: string) {
  try {
    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
        userId, // Ensure the task belongs to the user
      },
    });
    
    if (!task) {
      return { success: false, error: 'Task not found' };
    }
    
    await prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        completed: !task.completed,
      },
    });
    
    revalidatePath('/tasks');
    return { success: true };
  } catch (error) {
    console.error('Failed to toggle task completion:', error);
    return { success: false, error: 'Failed to update task' };
  }
} 