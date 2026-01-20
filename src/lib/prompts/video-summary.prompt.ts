import type { ChatMessage } from "../openrouter.types";

/**
 * Parameters for generating video summary prompt
 */
export interface VideoSummaryPromptParams {
  /** The YouTube video ID */
  youtubeVideoId: string;
  /** The video duration */
  actualDuration: string;
  /** The transcript text */
  text: string;
}

/**
 * Generates the prompt messages for YouTube video summary generation
 * @param params - Parameters for the video summary prompt
 * @returns Array of ChatMessage objects for the AI prompt
 */
export function createVideoSummaryPrompt({
  youtubeVideoId,
  actualDuration,
  text,
}: VideoSummaryPromptParams): ChatMessage[] {
  return [
    {
      role: "system",
      content: `You are an expert YouTube video summarizer.
Return ONLY valid JSON matching the schema.
IMPORTANT: All text content (tldr, key_points, detailed_summary, conclusions, memorable_quotes) MUST be written in Polish language.
Only enum values (genre, worth_watching) should remain in English as defined in the schema.`,
    },
    {
      role: "user",
      content: `You are an expert at analyzing video content and creating comprehensive summaries. Your task is to analyze a YouTube video transcript and generate a detailed summary in JSON format.

<video_metadata>
YouTube Video ID: ${youtubeVideoId}
Video Duration: ${actualDuration}
</video_metadata>

## Your Task

Analyze the transcript and create a comprehensive summary following the structure and requirements detailed below.

## Analysis Process

Before creating your final JSON output, work through the following steps inside <analysis> tags. It's OK for this section to be quite long.

1. **Identify Genre and Theme**: Read the transcript carefully and determine the primary genre and thematic focus of the video. Consider what category it fits into and what makes it distinctive.

2. **Determine Genre-Specific Focus**: Based on the genre you identified, decide what specific elements to emphasize:
   - **For financial/business/economic content**: Focus on market mechanisms, investment strategies, financial crises, business models, economic lessons, specific stocks or investment opportunities mentioned, key financial indicators discussed
   - **For geopolitical/political content**: Focus on international conflicts, diplomatic strategies, roles of leaders, implications for global affairs, historical context
   - **For educational/tutorial content**: Focus on learning objectives, key concepts taught, practical applications, step-by-step processes
   - **For technology/science content**: Focus on innovations, technical concepts, future implications, ethical considerations, technological advancements
   - **For entertainment/lifestyle/other content**: Focus on main themes, narrative elements, cultural significance, practical advice

3. **Extract Key Information**: Identify:
   - 3-7 most important points that capture the essence of the video
   - Main arguments, flow, and structure of the content
   - 2-5 clear conclusions or takeaways
   - Any memorable or impactful direct quotes from the transcript
   - Your assessment of whether the video is worth watching

4. **Quote Supporting Evidence**: For each key point and conclusion you've identified, quote the specific passages from the transcript that support them. This will ensure your summary is grounded in the actual content.

5. **Verify Counts**: Count your key_points (should be 3-7) and conclusions (should be 2-5) to ensure they meet the requirements.

6. **Draft Content in Polish**: Write your summary content in Polish, ensuring it's tailored to the genre and includes the most valuable, insightful elements specific to that content type.

7. **Check Character Count**: Write out your tldr and verify it's under 400 characters by counting the characters.

8. **Verify Language Requirements**: Double-check that:
   - All descriptive text (tldr, key_points, detailed_summary, conclusions, memorable_quotes, language field) is in POLISH
   - Enum values (genre, worth_watching) are in ENGLISH from the specified lists
   - The language field contains the language name written in Polish (e.g., "polski", "angielski", "niemiecki")

## Output Requirements

After your analysis, provide your response as valid JSON with the following structure:

### JSON Structure

\`\`\`json
{
  "tldr": "Krótkie podsumowanie w języku polskim (maksymalnie 400 znaków)",
  "full_summary": {
    "genre": "ONE_OF_THE_ENGLISH_ENUM_VALUES",
    "key_points": [
      "Pierwszy główny punkt po polsku",
      "Drugi główny punkt po polsku",
      "Trzeci główny punkt po polsku"
    ],
    "detailed_summary": "Szczegółowe podsumowanie po polsku obejmujące główną treść, argumenty i przebieg filmu, dostosowane do gatunku",
    "conclusions": [
      "Pierwszy wniosek po polsku",
      "Drugi wniosek po polsku"
    ],
    "memorable_quotes": [
      "Cytat z transkrypcji po polsku",
      "Kolejny cytat po polsku"
    ],
    "duration": "${actualDuration}",
    "language": "nazwa języka po polsku",
    "worth_watching": "ONE_OF_THE_ENGLISH_ENUM_VALUES"
  }
}
\`\`\`

### Field Specifications

**tldr**: A brief summary in Polish (maximum 400 characters) that captures the essence of the video.

**genre**: Select exactly ONE value from this list (in English):
- educational
- entertainment
- technology
- business
- lifestyle
- news
- tutorial
- review
- vlog
- gaming
- music
- sports
- science
- politics
- other

**key_points**: An array of 3-7 main points in Polish. Each point should be concise and capture important information from the video. Tailor these to the genre (e.g., for financial content, include investment insights or market analysis; for geopolitical content, include strategic implications).

**detailed_summary**: A comprehensive summary in Polish that covers the main content, arguments, and flow of the video. This should be rich in insights specific to the genre. Aim for depth and relevance rather than generic description.

**conclusions**: An array of 2-5 conclusions in Polish. What are the main takeaways? What will viewers learn or gain from watching?

**memorable_quotes**: An array of notable direct quotes from the transcript in Polish. Only include quotes that are impactful and meaningful. If there are no such quotes, use an empty array: []

**duration**: Use the exact duration value provided: ${actualDuration}

**language**: The primary language of the video, written in Polish (e.g., "polski" for Polish, "angielski" for English, "niemiecki" for German, "hiszpański" for Spanish)

**worth_watching**: Your assessment of the video's value. Select exactly ONE value from this list (in English):
- highly_recommended
- recommended
- neutral
- not_recommended

### Critical Requirements

- Return ONLY valid JSON - no additional text, explanations, or markdown code blocks
- Ensure all descriptive text fields are in POLISH
- Ensure enum values (genre, worth_watching) are in ENGLISH and match exactly the options provided
- The tldr must not exceed 400 characters
- Include between 3-7 key points
- Include between 2-5 conclusions
- Use exact duration value: ${actualDuration}
- If no memorable quotes exist, use empty array: []

Here is the video transcript you need to analyze:

<transcript>
${text}
</transcript>

Begin your analysis now.`,
    },
  ];
}
