declare module "youtube-transcript-api" {
  interface TranscriptConfig {
    lang?: string;
    country?: string;
  }

  // eslint-disable-next-line @typescript-eslint/no-extraneous-class
  export default class TranscriptAPI {
    static getTranscript(
      videoId: string,
      langCode?: string,
      config?: TranscriptConfig
    ): Promise<
      {
        text?: string;
        start?: number;
        duration?: number;
      }[]
    >;
  }
}
