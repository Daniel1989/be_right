import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import OpenAI from 'openai';
import prisma from '../../../../lib/prisma';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com/v1",
});

const openaiGitee = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY_GITEE,
  baseURL: "https://ai.gitee.com/v1",
  defaultHeaders: {
    "X-Failover-Enabled": "true",
  },
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
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'question id is required' },
        { status: 400 }
      );
    }

    // Extract locale from URL
    const url = new URL(request.url);
    const pathname = url.pathname;
    const locale = pathname.split('/')[1] || 'en';

    const question = await prisma.question.findUnique({
      where: {
        id: id
      },
    });

    if (!question) {
      return NextResponse.json(
        { success: false, error: 'question not found' },
        { status: 400 }
      );
    }

    // Call OpenAI API to analyze the image
    const response = await openaiGitee.chat.completions.create({
      model: "DeepSeek-R1-Distill-Qwen-32B",
      messages: [
        {
          role: 'system',
          content: `
          You are a teacher who is analyzing a student's homework or test question. Follow these steps:
          1. Analyze why the student failed in question which provided by the user.
          2. Format the response as json:
          {
            "success": true,
            "data": {
                "reason": "maybe student didn't understand the question, or didn't read the question carefully, or didn't know the answer, etc.",
            }
          }
          Important: 
          - Detect the language of the text in the image and provide your analysis in that same language. If the image contains ${locale === 'zh' ? 'Chinese' : 'English'} text, respond in ${locale === 'zh' ? 'Chinese' : 'English'}. If you can't detect the language clearly, default to ${locale === 'zh' ? 'Chinese' : 'English'}.`
        },
        {
          role: 'user',
          content: `
          Analyze why the student failed in this question: ${question.text}, with the wrong answer: ${question.notes}, and the correct answer: ${question.answer}
          `
        }
      ],
      max_tokens: 1024,
      temperature: 0.6,
      top_p: 0.7,
      frequency_penalty: 0,
    });

    const reasoning = (response.choices[0]?.message as any).content;
    const regex = /<think>(.*?)<\/think>/;
    const match = reasoning.match(regex);
    console.log(match ? match[1] : '');
    const finalResult = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: 'system',
          content: `
          You are a teacher who is analyzing a student's homework or test question. Follow these steps:
          1. Analyze why the student failed in question which provided by the user, and you should use the reasoning from the user to analyze the question.
          2. Format the response as json:
          {
            "success": true,
            "data": {
                "reason": "maybe student didn't understand the question, or didn't read the question carefully, or didn't know the answer, etc.",
            }
          }
          Important: 
          - Detect the language of the text in the image and provide your analysis in that same language. If the image contains ${locale === 'zh' ? 'Chinese' : 'English'} text, respond in ${locale === 'zh' ? 'Chinese' : 'English'}. If you can't detect the language clearly, default to ${locale === 'zh' ? 'Chinese' : 'English'}.`
        },
        {
          role: 'user',
          content: `
          Analyze why the student failed in this question: ${question.text}, with the wrong answer: ${question.notes}, and the correct answer: ${question.answer}, and the reasoning from the user: ${match ? match[1] : ''}
          `
        }
      ],
      max_tokens: 4000,
      response_format: { type: "json_object" }
    });

    // Extract the response content
    console.log(finalResult.choices[0]?.message?.content);
    try {
      // Parse the JSON response
      const jsonResult = JSON.parse(finalResult.choices[0]?.message?.content!);
      const reason = jsonResult.data.reason;
      await prisma.question.update({
        where: {
          id: id
        },
        data: {
          errorReason: reason
        }
      });
      return NextResponse.json(jsonResult);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      return NextResponse.json(
        {
          success: false, error: locale === 'zh' ?
            '无法解析分析结果' :
            'Failed to parse analysis results'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error analyzing image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze question' },
      { status: 500 }
    );
  }
} 