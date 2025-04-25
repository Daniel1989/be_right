import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import OpenAI from 'openai';
import { staticSubjects } from '@/app/lib/constants';

// Import static subjects from the subjects route

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://ark.cn-beijing.volces.com/api/v3",
});

// Define Subject interface
interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
}

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
    
    // Parse request body
    const body = await request.json();
    const { imageUrl } = body;
    
    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Image URL is required' },
        { status: 400 }
      );
    }
    
    // Extract locale from URL
    const url = new URL(request.url);
    const pathname = url.pathname;
    const locale = pathname.split('/')[1] || 'en';
    
    // Get absolute URL for the image (OpenAI requires full URLs)
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const absoluteImageUrl = imageUrl.startsWith('http') 
      ? imageUrl 
      : `${protocol}://${host}${imageUrl}`;
    
    // Prepare error messages based on locale
    const errorMessages: { [key: string]: string } = {
      en: "Please upload an image of student homework or test with questions and answers.",
      zh: "请上传包含问题和答案的学生作业或测试图片。",
      // Add more languages as needed
    };
    
    const errorMessage = errorMessages[locale] || errorMessages.en;
    
    // Prepare the list of available subjects for the AI to choose from
    const subjectsList = staticSubjects.map((subject: Subject) => subject.name).join(', ');
    
    // Call OpenAI API to analyze the image
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_VISION_MODEL as any,
      messages: [
        {
          role: 'system',
          content: `You are an AI that analyzes student homework and test images. Follow these steps:
          1. Determine if the image contains student homework or test with questions and answers.
          2. If not, respond with JSON: {"success": false, "error": "${errorMessage}"}
          3. If yes, extract all questions and answers visible in the image.
          4. For each question, determine if the answer is correct or incorrect.
          5. For incorrect answers, extract:
             - subject (choose ONLY from this exact list of available subjects: ${subjectsList})
             - question content (the full question text)
             - wrong answer (the student's incorrect answer)
             - right answer (the correct answer)
             - difficulty (1-5, where 1 is easiest and 5 is hardest)
          6. Format the response as JSON:
          {
            "success": true,
            "data": [
              {
                "subjectName": "Choose an exact match from the list provided",
                "content": "What is 2+2?",
                "wrongAnswer": "5",
                "rightAnswer": "4",
                "difficulty": 1
              },
              ...more questions...
            ]
          }
          
          Important: 
          - Match the subject EXACTLY to one from this list: ${subjectsList}
          - Do not make up or modify the subject names
          - Choose the most appropriate subject from the list based on the question content
          - Detect the language of the text in the image and provide your analysis in that same language. If the image contains ${locale === 'zh' ? 'Chinese' : 'English'} text, respond in ${locale === 'zh' ? 'Chinese' : 'English'}. If you can't detect the language clearly, default to ${locale === 'zh' ? 'Chinese' : 'English'}.`
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: locale === 'zh' ? 
              '请分析这张学生作业或考试图片，提取其中有错误的问题。请确保使用我提供的科目列表中的精确科目名称。' : 
              'Please analyze this homework/test image and extract the questions with incorrect answers. Make sure to use the exact subject names from the provided list.' 
            },
            { type: 'image_url', image_url: { url: absoluteImageUrl } }
          ]
        }
      ],
      max_tokens: 4000,
    });
    
    // Extract the response content
    const analysisResult = response.choices[0]?.message?.content || '';
    
    try {
      // Parse the JSON response
      const jsonResult = JSON.parse(analysisResult);
      return NextResponse.json(jsonResult);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      return NextResponse.json(
        { success: false, error: locale === 'zh' ? 
          '无法解析分析结果' : 
          'Failed to parse analysis results' 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error analyzing image:', error);
    
    // Extract locale from URL for error message
    try {
      const url = new URL(request.url);
      const pathname = url.pathname;
      const locale = pathname.split('/')[1] || 'en';
      
      return NextResponse.json(
        { success: false, error: locale === 'zh' ? 
          '分析图片时出错' : 
          'Failed to analyze image' 
        },
        { status: 500 }
      );
    } catch {
      // Fallback if URL parsing fails
      return NextResponse.json(
        { success: false, error: 'Failed to analyze image' },
        { status: 500 }
      );
    }
  }
} 