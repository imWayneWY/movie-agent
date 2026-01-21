// src/llm.ts
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { AzureChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { AgentResponse } from './types';
import config from './config';
import { sanitizeForLLMPrompt, detectPromptInjection } from './sanitize';

/**
 * LLM service for generating formatted movie recommendation output
 */
export class LLMService {
  private model: ChatGoogleGenerativeAI | AzureChatOpenAI;
  private chain: any;

  constructor(
    apiKey?: string,
    provider?: 'gemini' | 'azure',
    azureConfig?: {
      endpoint?: string;
      deployment?: string;
    }
  ) {
    const llmProvider = provider || config.LLM_PROVIDER;

    if (llmProvider === 'azure') {
      // Azure OpenAI Configuration
      const azureApiKey = apiKey || config.AZURE_OPENAI_API_KEY;
      const azureEndpoint =
        azureConfig?.endpoint || config.AZURE_OPENAI_ENDPOINT;
      const azureDeployment =
        azureConfig?.deployment || config.AZURE_OPENAI_DEPLOYMENT;

      if (!azureApiKey || !azureEndpoint || !azureDeployment) {
        throw new Error(
          'AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, and AZURE_OPENAI_DEPLOYMENT are required for Azure OpenAI'
        );
      }

      this.model = new AzureChatOpenAI({
        azureOpenAIApiKey: azureApiKey,
        azureOpenAIApiInstanceName: azureEndpoint
          .replace(/^https?:\/\//, '')
          .replace(/\.openai\.azure\.com\/?$/, ''),
        azureOpenAIApiDeploymentName: azureDeployment,
        azureOpenAIApiVersion: '2024-08-01-preview',
        temperature: 0.7,
      });
    } else {
      // Gemini Configuration (default)
      const geminiApiKey = apiKey || config.GEMINI_API_KEY;

      if (!geminiApiKey) {
        throw new Error('GEMINI_API_KEY is required for LLM service');
      }

      this.model = new ChatGoogleGenerativeAI({
        apiKey: geminiApiKey,
        model: 'gemini-2.5-flash',
        temperature: 0.7,
      });
    }

    // Create the prompt template
    const promptTemplate = PromptTemplate.fromTemplate(`
You are a friendly movie recommendation assistant. Analyze the movie descriptions and create personalized recommendations.

User Input: {userInput}

Movie Recommendations:
{recommendations}

Instructions:
- Start with a brief, warm greeting (1-2 sentences max)
- Format as a **numbered markdown list**
- For each movie, include:
  * **Title** (Year) • Runtime
  * Genres as tags
  * 📺 Streaming: list platforms
  * ✨ **Why watch this**: Read the movie's description and write 1-2 sentences explaining why THIS specific movie would appeal to the user based on their mood/preferences AND the movie's actual plot/themes
- Keep each recommendation concise (4-5 lines max)
- Use --- between movies for visual separation

Example format:
### 🎬 Your Recommendations

1. **Movie Title** (2024) • 120 min
   - 🏷️ Action, Thriller
   - 📺 Netflix, Prime Video
   - ✨ **Why watch this**: [Personalized reason based on movie content + user preferences]

---

Generate the formatted output:
`);

    // Create the chain: prompt -> model -> output parser
    this.chain = promptTemplate.pipe(this.model).pipe(new StringOutputParser());
  }

  /**
   * Format movie recommendations using LLM (non-streaming)
   * @param response - Agent response with recommendations
   * @param userInput - Original user input for context
   * @returns Formatted markdown string
   */
  async formatRecommendations(
    response: AgentResponse,
    userInput: any
  ): Promise<string> {
    // Prepare the recommendations data
    const recommendationsText = response.recommendations
      .map((movie, index) => {
        const platforms = movie.streamingPlatforms
          .filter(p => p.available)
          .map(p => p.name)
          .join(', ');

        return `
${index + 1}. ${movie.title} (${movie.releaseYear})
   - Runtime: ${movie.runtime} minutes
   - Genres: ${movie.genres.join(', ')}
   - Description: ${movie.description}
   - Available on: ${platforms || 'No streaming availability'}
   - Match reason: ${movie.matchReason}
`;
      })
      .join('\n');

    // Sanitize and format user input to prevent prompt injection
    const sanitizedInput = sanitizeForLLMPrompt(userInput);

    // Log potential injection attempts for security monitoring
    if (detectPromptInjection(userInput)) {
      console.warn(
        '⚠️ Potential prompt injection detected in user input. Input has been sanitized.'
      );
    }

    const userInputText = JSON.stringify(sanitizedInput, null, 2);

    // Generate formatted output using LLM with timeout
    try {
      const timeoutMs = 15000; // 15 second timeout
      const startTime = Date.now();

      const formattedOutput = await Promise.race([
        this.chain.invoke({
          userInput: userInputText,
          recommendations: recommendationsText,
        }),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error('LLM request timeout')), timeoutMs)
        ),
      ]);

      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✓ LLM formatting completed in ${elapsedTime}s\n`);

      return formattedOutput;
    } catch (error) {
      console.error('LLM formatting error:', error);
      // Fallback to basic formatting if LLM fails
      return this.fallbackFormat(response);
    }
  }

  /**
   * Format movie recommendations using LLM with streaming
   * @param response - Agent response with recommendations
   * @param userInput - Original user input for context
   * @param onChunk - Callback function called for each chunk of streamed content
   * @returns Promise that resolves when streaming is complete
   */
  async formatRecommendationsStream(
    response: AgentResponse,
    userInput: any,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    // Prepare the recommendations data
    const recommendationsText = response.recommendations
      .map((movie, index) => {
        const platforms = movie.streamingPlatforms
          .filter(p => p.available)
          .map(p => p.name)
          .join(', ');

        return `
${index + 1}. ${movie.title} (${movie.releaseYear})
   - Runtime: ${movie.runtime} minutes
   - Genres: ${movie.genres.join(', ')}
   - Description: ${movie.description}
   - Available on: ${platforms || 'No streaming availability'}
   - Match reason: ${movie.matchReason}
`;
      })
      .join('\n');

    // Sanitize and format user input to prevent prompt injection
    const sanitizedInput = sanitizeForLLMPrompt(userInput);

    // Log potential injection attempts for security monitoring
    if (detectPromptInjection(userInput)) {
      console.warn(
        '⚠️ Potential prompt injection detected in user input. Input has been sanitized.'
      );
    }

    const userInputText = JSON.stringify(sanitizedInput, null, 2);

    try {
      const timeoutMs = 15000; // 15 second timeout
      const startTime = Date.now();

      // Create a promise that will handle the streaming
      const streamPromise = (async () => {
        const stream = await this.chain.stream({
          userInput: userInputText,
          recommendations: recommendationsText,
        });

        for await (const chunk of stream) {
          onChunk(chunk);
        }
      })();

      // Race between streaming and timeout
      await Promise.race([
        streamPromise,
        new Promise<void>((_, reject) =>
          setTimeout(
            () => reject(new Error('LLM streaming timeout')),
            timeoutMs
          )
        ),
      ]);

      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`\n✓ LLM streaming completed in ${elapsedTime}s\n`);
    } catch (error) {
      console.error('\nLLM streaming error:', error);
      // Fallback to basic formatting if LLM fails
      const fallback = this.fallbackFormat(response);
      onChunk(fallback);
    }
  }

  /**
   * Fallback formatting if LLM fails
   */
  private fallbackFormat(response: AgentResponse): string {
    let output = '\n🎬 Movie Recommendations\n\n';

    response.recommendations.forEach((movie, index) => {
      output += `${index + 1}. **${movie.title}** (${movie.releaseYear}) • ${movie.runtime} min\n`;
      output += `   Genres: ${movie.genres.join(', ')}\n\n`;
      output += `   ${movie.description}\n\n`;

      const platforms = movie.streamingPlatforms
        .filter(p => p.available)
        .map(p => p.name);

      if (platforms.length > 0) {
        output += `   📺 Available on: ${platforms.join(', ')}\n`;
      }

      output += `   ✨ Why: ${movie.matchReason}\n\n`;
    });

    return output;
  }
}

/**
 * Create and export a singleton instance
 */
let llmServiceInstance: LLMService | null = null;

export function getLLMService(provider?: 'gemini' | 'azure'): LLMService {
  if (!llmServiceInstance) {
    llmServiceInstance = new LLMService(undefined, provider);
  }
  return llmServiceInstance;
}
