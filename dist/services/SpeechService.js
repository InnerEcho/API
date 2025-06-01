import { SpeechClient } from '@google-cloud/speech';
import { ZyphraClient } from '@zyphra/client';
import fs from 'fs';
import { UserType } from "../interface/chatbot.js";
export class SpeechService {
  /**
   * Google Cloud STT 처리
   */
  async speechToText(filePath, user_id, plant_id) {
    const client = new SpeechClient();
    const fileContent = fs.readFileSync(filePath);
    const request = {
      audio: {
        content: fileContent.toString('base64')
      },
      config: {
        encoding: 'OGG_OPUS',
        sampleRateHertz: 16000,
        languageCode: 'ko-KR'
      }
    };
    const [response] = await client.recognize(request);
    const transcription = response.results?.map(result => result.alternatives?.[0].transcript).join('\n') || '';
    return {
      user_id: user_id,
      plant_id: plant_id,
      message: transcription,
      user_type: UserType.BOT,
      send_date: new Date()
    };
  }

  /**
   * Zonos TTS 처리
   */
  async textToSpeech(userMessage) {
    if (!process.env.ZONOS_API_KEY) {
      throw new Error('ZONOS_API_KEY is not defined');
    }
    const client = new ZyphraClient({
      apiKey: process.env.ZONOS_API_KEY
    });
    const audioBlob = await client.audio.speech.create({
      text: userMessage,
      speaking_rate: 15,
      model: 'zonos-v0.1-transformer',
      mime_type: 'audio/ogg',
      language_iso_code: 'ko'
    });
    const arrayBuffer = await audioBlob.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}