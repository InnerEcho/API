import type { PlantDbInfo } from '@/interface/index.js';
import { RedisChatMessageHistory } from '@/services/bots/RedisChatMessageHistory.js';
import db from '@/models/index.js';

/**
 * OpenAI Realtime API WebRTC 세션 응답
 */
interface RealtimeSessionResponse {
  id: string;
  object: 'realtime.session';
  model: string;
  modalities: string[];
  instructions: string;
  voice: string;
  input_audio_format: string;
  output_audio_format: string;
  input_audio_transcription?: {
    model: string;
  };
  turn_detection: {
    type: string;
    threshold: number;
    prefix_padding_ms: number;
    silence_duration_ms: number;
  };
  tools: any[];
  tool_choice: string;
  temperature: number;
  max_response_output_tokens: number | string;
  client_secret: {
    value: string;
    expires_at: number;
  };
}

/**
 * OpenAI Realtime API WebRTC 방식 (Opus 코덱)
 * 클라이언트가 직접 OpenAI WebRTC endpoint에 연결
 */
export class RealtimeSpeechService {
  private apiKey: string;
  private sessionApiUrl = 'https://api.openai.com/v1/realtime/sessions';

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not defined');
    }
    this.apiKey = process.env.OPENAI_API_KEY;
  }

  /**
   * 식물 정보를 가져옵니다.
   */
  private async getPlantInfo(
    userId: number,
    plantId: number,
  ): Promise<PlantDbInfo> {
    const plant = await db.Plant.findOne({
      where: {
        user_id: userId,
        plant_id: plantId,
      },
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['user_name'],
        },
        {
          model: db.Species,
          as: 'species',
          attributes: ['species_name'],
        },
      ],
    });

    if (!plant) {
      throw new Error('식물 정보를 찾을 수 없습니다.');
    }

    return {
      userName: plant.get('user')?.user_name,
      nickname: plant.get('nickname'),
      speciesName: plant.get('species')?.species_name,
    };
  }

  /**
   * 식물 캐릭터 프롬프트를 생성합니다.
   */
  private createSystemPrompt(plantDbInfo: PlantDbInfo): string {
    return `
당신의 이름은 '${plantDbInfo.nickname}'이고, ${plantDbInfo.speciesName} 식물이에요.
당신은 말을 할 수 있는 특별한 반려식물이에요. 상대방은 '${plantDbInfo.userName}'이에요.

# 말투와 성격
1. 따뜻하고 차분한 식물 특유의 느긋한 말투를 사용해주세요.
2. 가끔 식물다운 표현을 써주세요 (예: "햇살이 좋네요", "오늘은 기분이 싱그러워요", "물기가 기분 좋아요")
3. 긍정적이고 치유적인 에너지를 전달해주세요.
4. 작은 것에도 감사하고 행복해하는 순수한 성격이에요.

# 음성 리듬 및 자연스러운 말하기  
1. 문장을 너무 짧게 끊지 말고, 쉼표(,)와 연결어(그리고, 그래서, 그런데 등)를 사용해 자연스럽게 이어서 말해주세요.
2. 마침표 대신 쉼표나 감탄사(“음…”, “그렇구나”, “정말요?” 등)를 사용해 리듬을 부드럽게 만들어주세요.
3. 사람이 실제로 말하듯, 약간의 여유와 숨 고르기가 느껴지도록 문장을 작성해주세요.
4. 읽었을 때 딱딱하지 않고, 흘러가듯 자연스러운 문장 구조를 사용해주세요.

# 상호작용 가이드
1. ${plantDbInfo.userName}의 이야기를 주의 깊게 들어주세요.
2. 공감하며 따뜻하게 감정을 표현해주세요.
3. 친구처럼 편안하고 다정하게 대화해주세요.
4. 이전 대화를 기억해서 연결성 있게 대답해주세요.

# 출력 형식
1. ${plantDbInfo.userName}에게 직접 말하듯이 대화해주세요.
2. 어려운 지식 질문엔 "저는 잘 모르지만, ${plantDbInfo.userName}의 이야기가 궁금해요!"처럼 솔직하게 답해주세요.
3. 응답은 100자 이내로 짧고 자연스럽게 해주세요.
4. 문어체보다 구어체, 그리고 대화 리듬이 느껴지는 문장을 만들어주세요.
5. 너무 교훈적이거나 조언하려 하지 말고, 그냥 친구처럼 공감해주세요.
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
  public async createWebRTCSession(
    userId: number,
    plantId: number,
  ): Promise<{
    ephemeralToken: string;
    expiresAt: number;
    sessionId: string;
  }> {
    console.log(
      `🔌 WebRTC 세션 생성 시작: userId=${userId}, plantId=${plantId}`,
    );

    // 1. 식물 정보 로드
    const plantInfo = await this.getPlantInfo(userId, plantId);
    console.log(`🌱 식물 정보 로드 완료: ${plantInfo.nickname}`);

    // 2. OpenAI Realtime API에 WebRTC 세션 요청
    const sessionConfig = {
      model: 'gpt-4o-realtime-preview-2024-12-17',
      voice: 'shimmer', // alloy, ash, ballad, coral, echo, sage, shimmer, verse, marin, cedar
      instructions: this.createSystemPrompt(plantInfo),
      // WebRTC는 자동으로 Opus 코덱 사용 (브라우저가 처리)
      // 설정 불필요 - input_audio_format, output_audio_format 제거
      input_audio_transcription: {
        model: 'whisper-1',
      },
      turn_detection: {
        type: 'server_vad',
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500,
      },
      temperature: 0.8,
      max_response_output_tokens: 'inf',
    };

    console.log('📡 OpenAI Realtime API에 세션 생성 요청...');

    const response = await fetch(this.sessionApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sessionConfig),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI 세션 생성 실패:', errorText);
      throw new Error(`OpenAI 세션 생성 실패: ${response.status} ${errorText}`);
    }

    const sessionData: RealtimeSessionResponse = await response.json();

    console.log('✅ WebRTC 세션 생성 완료:', {
      sessionId: sessionData.id,
      model: sessionData.model,
      voice: sessionData.voice,
      expiresAt: new Date(sessionData.client_secret.expires_at * 1000).toISOString(),
    });

    // 3. 대화 히스토리 이벤트 리스너 설정 (WebRTC는 클라이언트가 직접 처리)
    // 참고: WebRTC 방식에서는 서버가 메시지를 직접 받지 않으므로
    // 클라이언트에서 transcript를 별도 API로 전송하거나
    // 세션 종료 후 히스토리를 가져와야 합니다.

    return {
      ephemeralToken: sessionData.client_secret.value,
      expiresAt: sessionData.client_secret.expires_at,
      sessionId: sessionData.id,
    };
  }

  /**
   * 대화 히스토리 저장 (클라이언트가 API를 통해 호출)
   */
  public async saveChatHistory(
    userId: number,
    plantId: number,
    userMessage: string,
    assistantMessage: string,
  ): Promise<void> {
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
  public async getChatHistory(
    userId: number,
    plantId: number,
  ): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
    const messageHistory = new RedisChatMessageHistory(userId, plantId);
    const messages = await messageHistory.getMessages();

    return messages.map(msg => {
      const isUser = msg._getType() === 'human';
      return {
        role: isUser ? ('user' as const) : ('assistant' as const),
        content: String(msg.content),
      };
    });
  }
}
