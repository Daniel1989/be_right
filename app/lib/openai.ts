import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Extract text content from an image using OpenAI's vision capabilities
 */
export async function extractTextFromImage(imageUrl: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all the text content from this image of a homework problem or test question. Include the question and any visible answers. Format it properly with line breaks.",
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw new Error('Failed to extract text from image');
  }
}

/**
 * Analyze extracted text to identify the question, wrong answer, and correct answer
 */
export async function analyzeQuestionContent(textContent: string): Promise<{
  title: string;
  content: string;
  wrongAnswer?: string;
  rightAnswer?: string;
  subject?: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert tutor analyzing homework problems and test questions. Extract structured information from the text of a problem."
        },
        {
          role: "user",
          content: `Analyze this homework problem or test question and extract the following information in JSON format:
          1. title: A brief title for the problem (no more than 10 words)
          2. content: The full question text
          3. wrongAnswer: The incorrect answer if visible (or null if not present)
          4. rightAnswer: The correct answer if visible (or null if not present)
          5. subject: The academic subject (math, physics, chemistry, biology, literature, english, history, geography, politics)
          
          Text content: ${textContent}
          
          Return only valid JSON without any other text.`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    return {
      title: result.title || 'Untitled Question',
      content: result.content || textContent,
      wrongAnswer: result.wrongAnswer || undefined,
      rightAnswer: result.rightAnswer || undefined,
      subject: result.subject || undefined,
    };
  } catch (error) {
    console.error('Error analyzing question content:', error);
    // Return basic information if analysis fails
    return {
      title: 'Untitled Question',
      content: textContent,
    };
  }
} 