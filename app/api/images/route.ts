import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
// import { extractTextFromImage, analyzeQuestionContent } from '@/app/lib/openai';
// import { saveBase64Image, saveFormFile } from '@/app/lib/upload';

/**
 * Upload an image and process it
 */
export async function POST(req: NextRequest) {
  try {
    // Get user from auth cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
    };

    const userId = decoded.id;

    // Parse request body
    const data = await req.formData();
    const file = data.get('image') as File;
    const questionId = data.get('questionId') as string | null;
    const base64Data = data.get('base64') as string | null;

    if (!file && !base64Data) {
      return NextResponse.json(
        { message: 'No image or base64 data provided' },
        { status: 400 }
      );
    }

    let imageUrl = '';
    let localPath = '';

    // TODO: Uncomment when the libraries are installed
    // // Process based on input type
    // if (file) {
    //   const result = await saveFormFile(file);
    //   imageUrl = result.url;
    //   localPath = result.path;
    // } else if (base64Data) {
    //   const result = await saveBase64Image(base64Data);
    //   imageUrl = result.url;
    //   localPath = result.path;
    // }

    // For now, use a placeholder URL
    imageUrl = 'https://placeholder.com/image.jpg';
    localPath = '/tmp/placeholder-image.jpg';

    // Create record in database
    const image = await prisma.questionImage.create({
      data: {
        url: imageUrl,
        localPath,
        userId,
        questionId: questionId || undefined,
        processingStatus: 'PENDING',
      },
    });

    // Start processing in the background without awaiting (we'll return immediately)
    // processImageInBackground(image.id, imageUrl);

    return NextResponse.json(
      { message: 'Image uploaded successfully', image },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { message: 'Error uploading image' },
      { status: 500 }
    );
  }
}

/**
 * Get all images for the current user
 */
export async function GET(req: NextRequest) {
  try {
    // Get user from auth cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
    };

    const userId = decoded.id;

    // Parse query parameters
    const url = new URL(req.url);
    const questionId = url.searchParams.get('questionId');
    const status = url.searchParams.get('status');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = { userId };
    if (questionId) filter.questionId = questionId;
    if (status) filter.processingStatus = status;

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
      images,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error getting images:', error);
    return NextResponse.json(
      { message: 'Error retrieving images' },
      { status: 500 }
    );
  }
}

/**
 * Get a single image by ID
 */
export async function PATCH(req: NextRequest) {
  try {
    // Get user from auth cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
    };

    const userId = decoded.id;

    // Parse request body
    const data = await req.json();
    const { id, processingStatus, textContent, analyzedContent, questionId } = data;

    if (!id) {
      return NextResponse.json(
        { message: 'Image ID is required' },
        { status: 400 }
      );
    }

    // Check if image exists and belongs to user
    const existingImage = await prisma.questionImage.findFirst({
      where: { id, userId },
    });

    if (!existingImage) {
      return NextResponse.json(
        { message: 'Image not found or not authorized' },
        { status: 404 }
      );
    }

    // Update image
    const updateData: any = {};
    if (processingStatus) updateData.processingStatus = processingStatus;
    if (textContent !== undefined) updateData.textContent = textContent;
    if (analyzedContent !== undefined) updateData.analyzedContent = analyzedContent;
    if (questionId !== undefined) updateData.questionId = questionId || null;

    const updatedImage = await prisma.questionImage.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Image updated successfully',
      image: updatedImage,
    });
  } catch (error) {
    console.error('Error updating image:', error);
    return NextResponse.json(
      { message: 'Error updating image' },
      { status: 500 }
    );
  }
}

// Async processing function (to be implemented when libraries are installed)
// async function processImageInBackground(imageId: string, imageUrl: string) {
//   try {
//     // Update status to processing
//     await prisma.questionImage.update({
//       where: { id: imageId },
//       data: { processingStatus: 'PROCESSING' }
//     });

//     // Extract text from image
//     const extractedText = await extractTextFromImage(imageUrl);
    
//     if (!extractedText) {
//       await prisma.questionImage.update({
//         where: { id: imageId },
//         data: { 
//           processingStatus: 'FAILED',
//           textContent: 'Failed to extract text from image'
//         }
//       });
//       return;
//     }

//     // Update with extracted text
//     await prisma.questionImage.update({
//       where: { id: imageId },
//       data: { 
//         textContent: extractedText,
//         processingStatus: 'ANALYZING'
//       }
//     });

//     // Analyze the content
//     const analyzedContent = await analyzeQuestionContent(extractedText);
    
//     // Update with analyzed content
//     await prisma.questionImage.update({
//       where: { id: imageId },
//       data: { 
//         analyzedContent: JSON.stringify(analyzedContent),
//         processingStatus: 'COMPLETED'
//       }
//     });
//   } catch (error) {
//     console.error('Error processing image:', error);
//     // Update status to failed
//     await prisma.questionImage.update({
//       where: { id: imageId },
//       data: { 
//         processingStatus: 'FAILED',
//         textContent: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
//       }
//     });
//   }
// } 