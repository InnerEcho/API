import { SpeechClient } from '@google-cloud/speech';
import { ZyphraClient } from '@zyphra/client';
import fs from 'fs';
import { UserType } from "../../interface/index.js";
import { ZyphraError } from '@zyphra/client';
export class SpeechService {
  client;
  constructor() {
    if (!process.env.ZONOS_API_KEY) {
      throw new Error('ZONOS_API_KEY is not defined');
    }
    this.client = new ZyphraClient({
      apiKey: process.env.ZONOS_API_KEY
    });
  }
  /**
   * Google Cloud STT 처리
   */
  async speechToText(filePath, userId, plantId) {
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
      userId: userId,
      plantId: plantId,
      message: transcription,
      userType: UserType.BOT,
      sendDate: new Date()
    };
  }
  async textToSpeech(message) {
    console.log('🔔 textToSpeech 호출 시작');
    console.log(`📤 입력 메시지: ${message}`);
    try {
      console.log('🚀 Zyphra create 요청 시작...');
      const audioBlob = await this.client.audio.speech.create({
        text: message,
        model: 'zonos-v0.1-transformer',
        // 공식 모델
        default_voice_name: 'anime_girl',
        language_iso_code: 'ko',
        speaking_rate: 15,
        mime_type: 'audio/ogg',
        // 유지
        emotion: {
          happiness: 0.8,
          neutral: 0.3,
          sadness: 0.05,
          disgust: 0.05,
          fear: 0.05,
          surprise: 0.05,
          anger: 0.05,
          other: 0.5
        }
      });
      console.log('✅ Zyphra create 요청 성공');
      return {
        audioBlob,
        mimeType: 'audio/ogg'
      };
    } catch (error) {
      const zyphraError = error;
      if (zyphraError instanceof ZyphraError) {
        console.error(`❌ Zyphra API 오류: ${zyphraError.statusCode} - ${JSON.stringify(zyphraError.response, null, 2)}`);
      } else {
        console.error('❌ 알 수 없는 오류 발생:', error);
      }
      throw error;
    }
  }
}