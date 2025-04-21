import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';
import { writeFile, unlink } from 'fs/promises';
import { mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Configure uploads directory
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const UPLOADS_BASE_URL = '/uploads';

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directory:', error);
  }
}

// Call this on server startup
ensureUploadDir();

/**
 * Get all images for the current user
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user from cookie
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token');
    
    if (!authToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const userData = JSON.parse(authToken.value);
    
    if (!userData || !userData.id) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Extract query parameters
    const url = new URL(request.url);
    const questionId = url.searchParams.get('questionId');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = { userId: userData.id };
    if (questionId) filter.questionId = questionId;

    // Get images
    const images = await prisma.questionImage.findMany({
      where: filter,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    // Get total count for pagination
    const totalCount = await prisma.questionImage.count({
      where: filter,
    });

    return NextResponse.json({
      success: true,
      data: images,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}

/**
 * Upload an image
 */
export async function POST(request: NextRequest) {
  try {
    // Get current user from cookie
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token');
    
    if (!authToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const userData = JSON.parse(authToken.value);
    
    if (!userData || !userData.id) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Ensure user upload directory exists
    const userUploadDir = path.join(UPLOAD_DIR, userData.id);
    await mkdir(userUploadDir, { recursive: true });

    // Handle FormData with uploaded file
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const questionId = formData.get('questionId') as string | null;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No image provided' },
        { status: 400 }
      );
    }

    // Generate a unique filename
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = path.join(userUploadDir, fileName);
    
    // Convert File to Buffer and save to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);
    
    // Generate URL for the saved file
    const fileUrl = `${UPLOADS_BASE_URL}/${userData.id}/${fileName}`;
    
    // Create image record in database
    const image = await prisma.questionImage.create({
      data: {
        userId: userData.id,
        url: fileUrl,
        localPath: filePath,
        processingStatus: 'UPLOADED',
        questionId: questionId || null
      }
    });
    
    return NextResponse.json({
      success: true,
      data: image
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

/**
 * Delete an image
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get current user from cookie
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token');
    
    if (!authToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const userData = JSON.parse(authToken.value);
    
    if (!userData || !userData.id) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { imageId } = body;
    
    if (!imageId) {
      return NextResponse.json(
        { success: false, error: 'Image ID is required' },
        { status: 400 }
      );
    }
    
    // Find the image in the database
    const image = await prisma.questionImage.findFirst({
      where: {
        id: imageId,
        userId: userData.id
      }
    });
    
    if (!image) {
      return NextResponse.json(
        { success: false, error: 'Image not found or you do not have permission' },
        { status: 404 }
      );
    }
    
    // Delete the file from the filesystem
    if (image.localPath) {
      try {
        await unlink(image.localPath);
      } catch (fsError) {
        console.error('Error deleting file:', fsError);
        // Continue with deletion from database even if file deletion fails
      }
    }
    
    // Delete from database
    await prisma.questionImage.delete({
      where: {
        id: imageId
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete image' },
      { status: 500 }
    );
  }
} 