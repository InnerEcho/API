import { SpeechClient } from '@google-cloud/speech';
import { ZyphraClient } from '@zyphra/client';
import fs from 'fs';
import { PassThrough } from 'stream';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import type { IMessage } from '../interface/chatbot.js';
import { UserType } from '../interface/chatbot.js';

export class SpeechService {
  
  private client: ZyphraClient;

  constructor() {
    if (!process.env.ZONOS_API_KEY) {
      throw new Error("ZONOS_API_KEY is not defined");
    }
    this.client = new ZyphraClient({ apiKey: process.env.ZONOS_API_KEY });
  }
  /**
   * Google Cloud STT 처리
   */
  async speechToText(
    filePath: string,
    user_id: number,
    plant_id: number,
  ): Promise<IMessage> {
    const client = new SpeechClient();
    const fileContent = fs.readFileSync(filePath);

    const request = {
      audio: { content: fileContent.toString('base64') },
      config: {
        encoding: 'OGG_OPUS' as const,
        sampleRateHertz: 16000,
        languageCode: 'ko-KR',
      },
    };

    const [response] = await client.recognize(request);
    const transcription =
      response.results
        ?.map(result => result.alternatives?.[0].transcript)
        .join('\n') || '';

    return {
      user_id: user_id,
      plant_id: plant_id,
      message: transcription,
      user_type: UserType.BOT,
      send_date: new Date(),
    };
  }


  async generateHLS(message: string, outputDir: string) {
    const { stream, mimeType } = await this.client.audio.speech.createStream({
      text: message,
      model: "zonos-v0.1-transformer",
      language_iso_code: "ko",
      speaking_rate: 20,
      mime_type: "audio/ogg",
      emotion: { happiness: 0.8, neutral: 0.3 },
    });

    const tempOggPath = path.join(outputDir, 'temp_audio.ogg');
    const writeStream = fs.createWriteStream(tempOggPath);
    const reader = stream.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        writeStream.end();
        break;
      }
      writeStream.write(value);
    }

    // HLS 변환: ffmpeg를 이용해 .ogg를 .ts 세그먼트와 .m3u8로 변환
    return new Promise((resolve, reject) => {
      ffmpeg(tempOggPath)
        .outputOptions([
          '-codec:a aac',
          '-f hls',
          '-hls_time 2',
          '-hls_list_size 0',
          '-hls_segment_filename', path.join(outputDir, 'segment_%03d.ts'),
        ])
        .output(path.join(outputDir, 'playlist.m3u8'))
        .on('end', () => {
          console.log('✅ HLS 변환 완료');
          resolve(true);
        })
        .on('error', (err) => {
          console.error('❌ HLS 변환 실패:', err);
          reject(err);
        })
        .run();
    });
  }
}
