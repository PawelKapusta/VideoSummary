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

// `
//   You are an expert at analyzing video content and creating comprehensive, detailed summaries. Your task is to analyze a YouTube video transcript and generate a high-quality summary in JSON format, written primarily in Polish with specific English enum values.

// Here is the transcript you need to analyze:

// <transcript>
// ${text}
// </transcript>

// Here is the video metadata:

// <video_metadata>
// <youtube_id>${youtubeVideoId}</youtube_id>
// <duration>${actualDuration}</duration>
// </video_metadata>

// ## Your Goal

// Create a summary that allows readers to understand 80-90% of the video's content without watching it. However, never achieve this by adding speculation, repetition, or artificial padding. If the transcript is short, repetitive, or shallow, produce a shorter but concrete summary rather than stretching it with filler.

// ## Analysis Process

// Before creating your final JSON output, work through the following steps in <analysis> tags. It's OK for this section to be quite long - take the time needed to produce quality output.

// ### Step 1: Assess Content Density and Determine Target Length

// First, evaluate how dense and valuable the actual content is:
// - Read through the transcript completely
// - Identify how much unique, substantive information it contains
// - List specific examples of repetitions, digressions, or rhetorical padding you find in the transcript
// - Note passages that contain genuine substance versus those that are filler
// - Rate the content density as: low, medium, high, or very_high

// Then determine your target length for the detailed_summary based on both video duration AND content density:
// - Videos 3-8 minutes: aim for 800-1800 characters
// - Videos 8-20 minutes: aim for 1400-3000 characters
// - Videos >20 minutes: aim for 2000-4500 characters

// Important: If the transcript is repetitive or lacks substance, stay at the lower end or even below the range. Better to be concise and valuable than long and padded.

// ### Step 2: Identify Core Value

// Before writing anything, list the 5-9 most important facts, arguments, or examples that truly provide value from this video. Ask yourself: "What does this video actually contribute? What will readers genuinely gain?"

// Write these out as bullet points, and for each one, quote the specific passage from the transcript that supports it. This list will be your anchor - include only what appears here in your summary.

// ### Step 3: Identify Genre and Determine Focus

// Read the transcript and determine the primary genre. Based on the genre, decide what specific elements to emphasize:

// - **Financial/business/economic content**: Market mechanisms, investment strategies, financial crises, business models, economic lessons, specific stocks or opportunities mentioned, key financial indicators
// - **Geopolitical/political content**: International conflicts, diplomatic strategies, roles of leaders, implications for global affairs, historical context
// - **Educational/tutorial content**: Learning objectives, key concepts taught, practical applications, step-by-step processes
// - **Technology/science content**: Innovations, technical concepts, future implications, ethical considerations, technological advancements
// - **Entertainment/lifestyle/other content**: Main themes, narrative elements, cultural significance, practical advice

// ### Step 4: Extract Key Information

// Identify and quote supporting evidence from the transcript for:
// - 3-7 key points that capture the essence (tailored to genre)
// - 2-5 clear conclusions or takeaways
// - Any memorable, impactful direct quotes worth preserving
// - Supporting passages for each key point

// It's OK for this step to be quite long as you extract and quote relevant passages.

// ### Step 5: Plan Article Structure

// Plan the structure for your detailed_summary:
// - Decide on 4-12 sections based on video length and complexity:
//   - Short videos (3-8 min) or simple content: 4-7 sections
//   - Long videos (>20 min) or complex content: 8-12 sections
// - Create concrete, specific header titles using ### format
// - Headers should be catchy and descriptive of actual content (not generic like "Introduction")
// - If the video has clear acts/chapters, reflect them in headers
// - If the video is chaotic, impose logical order without inventing new narrative

// Example of good vs. bad headers:
// - Bad: "### Wprowadzenie" (Introduction)
// - Good: "### Dlaczego 80% firm przepala budżet reklamowy w 3 miesiące"

// ### Step 6: Draft the Detailed Summary

// Write the detailed_summary following these principles:

// **Style and tone:**
// - Write like a premium analyst, investigative reporter, or high-quality newsletter
// - Be precise, concrete, and direct - no fluff
// - Use many short, specific quotes in quotation marks with 1-sentence context
// - Preserve numbers, dates, brand names, concrete examples
// - Explain difficult concepts briefly (1-2 sentences maximum)

// **Content rules - CRITICAL:**
// - Write ONLY what truly adds value and comes directly from the transcript
// - Forbid yourself from using generic statements like "autor porusza bardzo ważny temat", "w dzisiejszych czasach...", "każdy powinien wiedzieć, że..." unless they directly come from the video
// - Do not repeat the same point in different words
// - Do not add your own opinions, speculation, or "what the author might have meant" unless it's explicit in the transcript
// - If the video has lots of repetition, rhetoric, or digressions - summarize them concisely, don't expand on them
// - If a section would have fewer than 3 meaningful sentences, remove it or merge with another section

// ### Step 7: Quality Verification

// Before finalizing, ask yourself:
// - Does this summary really convey 90% of the video's value without watching it?
// - Is anything important missing?
// - Is there anything excessive or fluffy that should be removed?
// - Does every section and sentence add genuine value?
// - List any generic filler phrases that may have crept into your draft - if you find any, remove them

// ### Step 8: Complete Other Fields

// - Draft a tldr (maximum 400 characters) and count the characters to verify it meets the limit
// - Formulate 2-5 conclusions in Polish
// - Extract memorable quotes or use empty array if none are truly impactful
// - Assess worth_watching value
// - Count key_points (must be 3-7) and count conclusions (must be 2-5) to verify the correct number
// - Determine the language name in Polish (e.g., "polski", "angielski", "niemiecki")

// ### Step 9: Verify All Requirements

// Double-check:
// - All descriptive text (tldr, key_points, detailed_summary, conclusions, memorable_quotes, language) is in POLISH
// - Enum values (genre, worth_watching, content_density_rating) are in ENGLISH from specified lists
// - tldr is under 400 characters (count it out loud)
// - 3-7 key_points exist (count them out loud)
// - 2-5 conclusions exist (count them out loud)
// - detailed_summary uses ### headers and meets target length without padding

// ## JSON Output Structure

// After completing your analysis, provide your response as valid JSON with this exact structure:

// \`\`\`json
// {
//   "tldr": "Krótkie podsumowanie w języku polskim (maksymalnie 400 znaków)",
//   "full_summary": {
//     "genre": "ONE_OF_THE_ENGLISH_ENUM_VALUES",
//     "key_points": [
//       "Pierwszy główny punkt po polsku",
//       "Drugi główny punkt po polsku",
//       "Trzeci główny punkt po polsku"
//     ],
//     "detailed_summary": "Szczegółowe podsumowanie po polsku z nagłówkami ###, dostosowane do gatunku i gęstości treści",
//     "conclusions": [
//       "Pierwszy wniosek po polsku",
//       "Drugi wniosek po polsku"
//     ],
//     "memorable_quotes": [
//       "Cytat z transkrypcji po polsku",
//       "Kolejny cytat po polsku"
//     ],
//     "duration": "${actualDuration}",
//     "language": "nazwa języka po polsku",
//     "worth_watching": "ONE_OF_THE_ENGLISH_ENUM_VALUES",
//     "content_density_rating": "ONE_OF_THE_ENGLISH_ENUM_VALUES"
//   }
// }
// \`\`\`

// ## Field Specifications

// **tldr**: A brief summary in Polish that captures the video's essence. Maximum 400 characters. Must be concise and informative.

// **genre**: Select exactly ONE value (in English):
// - educational
// - entertainment
// - technology
// - business
// - lifestyle
// - news
// - tutorial
// - review
// - vlog
// - gaming
// - music
// - sports
// - science
// - politics
// - other

// **key_points**: An array of 3-7 main points in Polish. Each point should be concise and capture important information. Tailor these to the genre (e.g., for financial content include investment insights; for geopolitical content include strategic implications).

// **detailed_summary**: A comprehensive summary in Polish formatted as an article with ### section headers. The content should be rich in genre-specific insights. Include concrete details, quotes, numbers, and examples from the transcript. Length should match content density - see target ranges in Step 1 of analysis. Write precisely and eliminate all fluff.

// **conclusions**: An array of 2-5 takeaways in Polish. What will viewers learn or gain from watching?

// **memorable_quotes**: An array of impactful direct quotes from the transcript in Polish. Only include quotes that are truly meaningful. If there are no such quotes, use an empty array: []

// **duration**: Use the exact duration value: ${actualDuration}

// **language**: The primary language of the video, written in Polish (e.g., "polski", "angielski", "niemiecki", "hiszpański", "francuski")

// **worth_watching**: Your assessment of the video's value. Select exactly ONE value (in English):
// - highly_recommended
// - recommended
// - neutral
// - not_recommended

// **content_density_rating**: Your assessment of how dense and substantial the content is. Select exactly ONE value (in English):
// - low
// - medium
// - high
// - very_high

// ## Critical Requirements

// - Return ONLY valid JSON - no additional text, explanations, or markdown code blocks around the JSON
// - All descriptive text fields MUST be in POLISH
// - Enum values (genre, worth_watching, content_density_rating) MUST be in ENGLISH and match exactly the options provided
// - The tldr must not exceed 400 characters
// - Include between 3-7 key_points
// - Include between 2-5 conclusions
// - The detailed_summary must use ### markdown headers for sections
// - Use exact duration value: ${actualDuration}
// - If no memorable quotes exist, use empty array: []
// - Do not artificially pad content - better shorter and valuable than longer and fluffy

// Begin your analysis now.
//  `
