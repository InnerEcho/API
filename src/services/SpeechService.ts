import { SpeechClient } from '@google-cloud/speech';
import { ZyphraClient } from '@zyphra/client';
import fs from 'fs';
import type { IMessage } from '../interface/chatbot.js';
import { UserType } from '../interface/chatbot.js';

export class PlantSpeechService {
  /**
   * Google Cloud STT 처리
   */
  async speechToText(
    filePath: string,
    userId: number,
    plantId: number,
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
      user_id: userId,
      plant_id: plantId,
      message: transcription,
      user_type: UserType.BOT,
      send_date: new Date(),
    };
  }

  /**
   * Zonos TTS 처리
   */
  async textToSpeech(userMessage: string): Promise<Buffer> {
    if (!process.env.ZONOS_API_KEY) {
      throw new Error('ZONOS_API_KEY is not defined');
    }

    const client = new ZyphraClient({ apiKey: process.env.ZONOS_API_KEY });
    const audioBlob = await client.audio.speech.create({
      text: userMessage,
      speaking_rate: 15,
      model: 'zonos-v0.1-transformer',
      mime_type: 'audio/ogg',
      language_iso_code: 'ko',
    });

    const arrayBuffer = await audioBlob.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
