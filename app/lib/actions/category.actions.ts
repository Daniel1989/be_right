'use server';

import { prisma } from '../prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const CategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  color: z.string().optional(),
});

export type CategoryFormData = z.infer<typeof CategorySchema>;

export async function createCategory(userId: string, formData: CategoryFormData) {
  try {
    const validatedFields = CategorySchema.parse(formData);
    
    const { name, color } = validatedFields;
    
    // Check if category with this name already exists for the user
    const existingCategory = await prisma.category.findFirst({
      where: {
        name,
        userId,
      },
    });
    
    if (existingCategory) {
      return { success: false, error: 'A category with this name already exists' };
    }
    
    await prisma.category.create({
      data: {
        name,
        color,
        userId,
      },
    });
    
    revalidatePath('/categories');
    return { success: true };
  } catch (error) {
    console.error('Failed to create category:', error);
    return { success: false, error: 'Failed to create category' };
  }
}

export async function getCategories(userId: string) {
  try {
    const categories = await prisma.category.findMany({
      where: {
        userId,
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    return { success: true, data: categories };
  } catch (error) {
    console.error('Failed to get categories:', error);
    return { success: false, error: 'Failed to fetch categories' };
  }
}

export async function updateCategory(categoryId: string, userId: string, formData: CategoryFormData) {
  try {
    const validatedFields = CategorySchema.parse(formData);
    
    const { name, color } = validatedFields;
    
    // Check if another category with this name exists for the user
    const existingCategory = await prisma.category.findFirst({
      where: {
        name,
        userId,
        NOT: {
          id: categoryId,
        },
      },
    });
    
    if (existingCategory) {
      return { success: false, error: 'A category with this name already exists' };
    }
    
    await prisma.category.update({
      where: {
        id: categoryId,
        userId, // Ensure the category belongs to the user
      },
      data: {
        name,
        color,
      },
    });
    
    revalidatePath('/categories');
    return { success: true };
  } catch (error) {
    console.error('Failed to update category:', error);
    return { success: false, error: 'Failed to update category' };
  }
}

export async function deleteCategory(categoryId: string, userId: string) {
  try {
    await prisma.category.delete({
      where: {
        id: categoryId,
        userId, // Ensure the category belongs to the user
      },
    });
    
    revalidatePath('/categories');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete category:', error);
    return { success: false, error: 'Failed to delete category' };
  }
} 