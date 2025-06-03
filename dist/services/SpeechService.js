import { SpeechClient } from '@google-cloud/speech';
import { ZyphraClient } from '@zyphra/client';
import fs from 'fs';
import { PassThrough } from 'stream';
import { UserType } from "../interface/chatbot.js";
export class SpeechService {
  constructor() {
    if (!process.env.ZONOS_API_KEY) {
      throw new Error("ZONOS_API_KEY is not defined");
    }
    this.client = new ZyphraClient({
      apiKey: process.env.ZONOS_API_KEY
    });
  }
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
  async textToSpeech(message) {
    const {
      stream,
      mimeType
    } = await this.client.audio.speech.createStream({
      text: message,
      model: "zonos-v0.1-transformer",
      language_iso_code: "ko",
      speaking_rate: 20,
      mime_type: "audio/ogg",
      emotion: {
        happiness: 0.8,
        neutral: 0.3
      }
    });
    const passThrough = new PassThrough();
    const reader = stream.getReader();
    (async () => {
      console.log('🔄 Start pushing stream data...');
      while (true) {
        const {
          done,
          value
        } = await reader.read();
        if (done) {
          console.log('✅ Reader finished reading all chunks.');
          passThrough.end();
          break;
        }
        console.log(`📦 Pushing chunk of size: ${value.length}`);
        passThrough.write(value);
      }
    })();
    return {
      audioStream: passThrough,
      mimeType
    };
  }
}