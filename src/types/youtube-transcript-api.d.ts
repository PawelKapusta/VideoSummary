declare module 'youtube-transcript-api' {
  export default class TranscriptAPI {
    static getTranscript(
      videoId: string,
      langCode?: string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      config?: any,
    ): Promise<
      Array<{
        text?: string;
        start?: number;
        duration?: number;
      }>
    >;
  }
}
