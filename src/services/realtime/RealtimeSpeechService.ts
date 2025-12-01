import { RedisChatMessageHistory } from '@/services/bots/RedisChatMessageHistory.js';
import { PlantRepository, type PlantInfoRecord } from '@/services/realtime/PlantRepository.js';
import { PromptBuilder } from '@/services/realtime/PromptBuilder.js';
import { OpenAIRealtimeClient } from '@/services/realtime/OpenAIRealtimeClient.js';

/**
 * OpenAI Realtime API WebRTC 방식 (Opus 코덱)
 * 클라이언트가 직접 OpenAI WebRTC endpoint에 연결
 */
export class RealtimeSpeechService {
  private apiKey: string;

  constructor(
    private plantRepository: PlantRepository = new PlantRepository(),
    private promptBuilder: PromptBuilder = new PromptBuilder(),
    private realtimeClient: OpenAIRealtimeClient | null = null,
  ) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not defined');
    }
    this.apiKey = process.env.OPENAI_API_KEY;
    if (!this.realtimeClient) {
      this.realtimeClient = new OpenAIRealtimeClient(this.apiKey);
    }
  }

  /**
   * 식물 정보를 가져옵니다.
   */
  private async getPlantInfo(userId: number, plantId: number): Promise<PlantInfoRecord> {
    const plant = await this.plantRepository.getPlantInfo(userId, plantId);
    if (!plant) {
      throw new Error('식물 정보를 찾을 수 없습니다.');
    }
    return plant;
  }

  /**
   * 식물 캐릭터 프롬프트를 생성합니다.
   */
  private createSystemPrompt(plantDbInfo: PlantInfoRecord): string {
    return this.promptBuilder.buildSystemPrompt(plantDbInfo);
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

    const sessionData = await this.realtimeClient!.createSession(sessionConfig);

    console.log('✅ WebRTC 세션 생성 완료:', {
      sessionId: sessionData.sessionId,
      model: sessionData.model,
      voice: sessionData.voice,
      expiresAt: new Date(sessionData.expiresAt * 1000).toISOString(),
    });

    // 3. 대화 히스토리 이벤트 리스너 설정 (WebRTC는 클라이언트가 직접 처리)
    // 참고: WebRTC 방식에서는 서버가 메시지를 직접 받지 않으므로
    // 클라이언트에서 transcript를 별도 API로 전송하거나
    // 세션 종료 후 히스토리를 가져와야 합니다.

    return {
      ephemeralToken: sessionData.ephemeralToken,
      expiresAt: sessionData.expiresAt,
      sessionId: sessionData.sessionId,
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
