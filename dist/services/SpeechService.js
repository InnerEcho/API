import { SpeechClient } from '@google-cloud/speech';
import { ZyphraClient } from '@zyphra/client';
import fs from 'fs';
import { PassThrough } from 'stream';
import { UserType } from "../interface/chatbot.js";
import { ZyphraError } from '@zyphra/client';
export class SpeechService {
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
    console.log('🔔 textToSpeech 호출 시작');
    console.log(`📤 입력 메시지: ${message}`);
    try {
      console.log('🚀 Zyphra createStream 요청 시작...');
      const {
        stream,
        mimeType
      } = await this.client.audio.speech.createStream({
        text: message,
        model: 'zonos-v0.1-transformer',
        // 공식 모델
        language_iso_code: 'ko',
        // 지원 언어
        speaking_rate: 15,
        // 공식 기본 속도
        mime_type: 'audio/ogg',
        // 유지: Ogg 포맷
        emotion: {
          happiness: 0.8,
          // 공식 emotion 기본값
          neutral: 0.3,
          sadness: 0.05,
          disgust: 0.05,
          fear: 0.05,
          surprise: 0.05,
          anger: 0.05,
          other: 0.5
        }
      });
      console.log('✅ Zyphra createStream 요청 성공');
      console.log(`📄 MIME 타입: ${mimeType}`);
      const passThrough = new PassThrough();
      const reader = stream.getReader();
      (async () => {
        console.log('🔄 Start pushing stream data...');
        try {
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
        } catch (streamErr) {
          console.error('❌ Stream 처리 중 오류:', streamErr);
          // TypeScript에서 타입 단언 추가
          passThrough.destroy(streamErr);
        }
      })();
      return {
        audioStream: passThrough,
        mimeType
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