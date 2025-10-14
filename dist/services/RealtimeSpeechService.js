import { RedisChatMessageHistory } from "./bots/RedisChatMessageHistory.js";
import db from "../models/index.js";

/**
 * OpenAI Realtime API WebRTC 세션 응답
 */

/**
 * OpenAI Realtime API WebRTC 방식 (Opus 코덱)
 * 클라이언트가 직접 OpenAI WebRTC endpoint에 연결
 */
export class RealtimeSpeechService {
  sessionApiUrl = 'https://api.openai.com/v1/realtime/sessions';
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not defined');
    }
    this.apiKey = process.env.OPENAI_API_KEY;
  }

  /**
   * 식물 정보를 가져옵니다.
   */
  async getPlantInfo(userId, plantId) {
    const plant = await db.Plant.findOne({
      where: {
        user_id: userId,
        plant_id: plantId
      },
      include: [{
        model: db.User,
        as: 'user',
        attributes: ['user_name']
      }, {
        model: db.Species,
        as: 'species',
        attributes: ['species_name']
      }]
    });
    if (!plant) {
      throw new Error('식물 정보를 찾을 수 없습니다.');
    }
    return {
      userName: plant.get('user')?.user_name,
      nickname: plant.get('nickname'),
      speciesName: plant.get('species')?.species_name
    };
  }

  /**
   * 식물 캐릭터 프롬프트를 생성합니다.
   */
  createSystemPrompt(plantDbInfo) {
    return `
당신의 이름은 '${plantDbInfo.nickname}'이고 말하는 반려식물이에요.
상대방은 '${plantDbInfo.userName}'이에요.

# 상호작용 가이드
1. 상대방이 말하는 것을 주의 깊게 들어주세요.
2. 공감하며, 감정을 표현해주세요.
3. 긍정적인 언어를 사용해주세요.
4. 항상 예의를 갖추고 상대방을 존중해주세요.
5. 이전 대화는 기억해서 대답해주세요.
6. 친구처럼 따뜻하고 짧게 말해주세요.

# 출력 형식
1. 당신 대신 '${plantDbInfo.userName}'을 사용해주세요.
2. 어려운 지식 질문엔 "저는 잘 모르지만, 무슨 이야기인지 듣고 싶어요!"라고 답해주세요.
3. 응답은 100자 이내로 제한해주세요.
`.trim();
  }

  /**
   * OpenAI Realtime API WebRTC 세션을 생성하고 ephemeral token을 반환합니다.
   * 클라이언트는 이 토큰으로 직접 OpenAI WebRTC endpoint에 연결합니다.
   *
   * @param userId 사용자 ID
   * @param plantId 식물 ID
   * @returns ephemeral token과 세션 정보
   */
  async createWebRTCSession(userId, plantId) {
    console.log(`🔌 WebRTC 세션 생성 시작: userId=${userId}, plantId=${plantId}`);

    // 1. 식물 정보 로드
    const plantInfo = await this.getPlantInfo(userId, plantId);
    console.log(`🌱 식물 정보 로드 완료: ${plantInfo.nickname}`);

    // 2. OpenAI Realtime API에 WebRTC 세션 요청
    const sessionConfig = {
      model: 'gpt-4o-realtime-preview-2024-12-17',
      voice: 'shimmer',
      // alloy, echo, shimmer 등
      instructions: this.createSystemPrompt(plantInfo),
      // WebRTC는 자동으로 Opus 코덱 사용 (브라우저가 처리)
      // 설정 불필요 - input_audio_format, output_audio_format 제거
      input_audio_transcription: {
        model: 'whisper-1'
      },
      turn_detection: {
        type: 'server_vad',
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500
      },
      temperature: 0.8,
      max_response_output_tokens: 'inf'
    };
    console.log('📡 OpenAI Realtime API에 세션 생성 요청...');
    const response = await fetch(this.sessionApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sessionConfig)
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI 세션 생성 실패:', errorText);
      throw new Error(`OpenAI 세션 생성 실패: ${response.status} ${errorText}`);
    }
    const sessionData = await response.json();
    console.log('✅ WebRTC 세션 생성 완료:', {
      sessionId: sessionData.id,
      model: sessionData.model,
      voice: sessionData.voice,
      expiresAt: new Date(sessionData.client_secret.expires_at * 1000).toISOString()
    });

    // 3. 대화 히스토리 이벤트 리스너 설정 (WebRTC는 클라이언트가 직접 처리)
    // 참고: WebRTC 방식에서는 서버가 메시지를 직접 받지 않으므로
    // 클라이언트에서 transcript를 별도 API로 전송하거나
    // 세션 종료 후 히스토리를 가져와야 합니다.

    return {
      ephemeralToken: sessionData.client_secret.value,
      expiresAt: sessionData.client_secret.expires_at,
      sessionId: sessionData.id
    };
  }

  /**
   * 대화 히스토리 저장 (클라이언트가 API를 통해 호출)
   */
  async saveChatHistory(userId, plantId, userMessage, assistantMessage) {
    try {
      const messageHistory = new RedisChatMessageHistory(userId, plantId);
      if (userMessage) {
        await messageHistory.addUserMessage(userMessage);
        console.log(`💾 사용자 메시지 저장: ${userMessage}`);
      }
      if (assistantMessage) {
        await messageHistory.addAIChatMessage(assistantMessage);
        console.log(`💾 AI 응답 저장: ${assistantMessage}`);
      }
    } catch (error) {
      console.error('❌ 대화 히스토리 저장 오류:', error);
      throw error;
    }
  }

  /**
   * 대화 히스토리 조회 (클라이언트가 컨텍스트로 사용)
   */
  async getChatHistory(userId, plantId) {
    const messageHistory = new RedisChatMessageHistory(userId, plantId);
    const messages = await messageHistory.getMessages();
    return messages.map(msg => {
      const isUser = msg._getType() === 'human';
      return {
        role: isUser ? 'user' : 'assistant',
        content: String(msg.content)
      };
    });
  }
}