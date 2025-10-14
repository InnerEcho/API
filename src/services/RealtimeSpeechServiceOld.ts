import WebSocket from 'ws';
import type { PlantDbInfo } from '@/interface/index.js';
import { RedisChatMessageHistory } from '@/services/bots/RedisChatMessageHistory.js';
import db from '@/models/index.js';

// ... 기존 인터페이스 정의 ...
interface RealtimeSessionConfig {
  model: string;
  voice: string;
  instructions: string;
  input_audio_format: string;
  output_audio_format: string;
  turn_detection: {
    type: string;
    threshold: number;
    silence_duration_ms: number;
  };
}

interface ConversationItem {
  type: 'message';
  role: 'user' | 'assistant';
  content: Array<{
    type: 'input_text' | 'text';
    text: string;
  }>;
}


export class RealtimeSpeechServiceOld {
  // Old WebSocket + G.711 μ-law 방식
  private apiKey: string;
  private realtimeApiUrl =
    'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17';

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not defined');
    }
    this.apiKey = process.env.OPENAI_API_KEY;
  }


  // ... getPlantInfo, loadChatHistory, createSystemPrompt 메서드는 변경 없음 ...
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
   * 대화 히스토리를 가져와서 OpenAI Realtime API 형식으로 변환합니다.
   */
  private async loadChatHistory(
    userId: number,
    plantId: number,
  ): Promise<ConversationItem[]> {
    const messageHistory = new RedisChatMessageHistory(userId, plantId);
    const messages = await messageHistory.getMessages();

    // LangChain 메시지를 OpenAI Realtime API 형식으로 변환
    return messages.map(msg => {
      const isUser = msg._getType() === 'human';
      return {
        type: 'message' as const,
        role: isUser ? ('user' as const) : ('assistant' as const),
        content: [
          {
            type: isUser ? ('input_text' as const) : ('text' as const),
            text: String(msg.content),
          },
        ],
      };
    });
  }

  /**
   * 식물 캐릭터 프롬프트를 생성합니다.
   */
  private createSystemPrompt(plantDbInfo: PlantDbInfo): string {
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
   * OpenAI Realtime API WebSocket 연결을 생성합니다.
   */
  public async createRealtimeConnection(
    userId: number,
    plantId: number,
    clientWs: WebSocket,
  ): Promise<void> {
    console.log(
      `🔌 Realtime API 연결 시작: userId=${userId}, plantId=${plantId}`,
    );

    // ... 1, 2, 3 단계는 변경 없음 ...
    const plantInfo = await this.getPlantInfo(userId, plantId);
    console.log(`🌱 식물 정보 로드 완료: ${plantInfo.nickname}`);
    const conversationHistory = await this.loadChatHistory(userId, plantId);
    console.log(
      `💬 대화 히스토리 로드 완료: ${conversationHistory.length}개 메시지`,
    );
    const openaiWs = new WebSocket(this.realtimeApiUrl, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'OpenAI-Beta': 'realtime=v1',
      },
    });
    

    // ... 4단계 openaiWs 이벤트 핸들러 ...
    openaiWs.on('open', () => {
      console.log('✅ OpenAI Realtime API 연결 성공');
      const sessionConfig: RealtimeSessionConfig = {
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'shimmer',
        instructions: this.createSystemPrompt(plantInfo),
        // G.711 μ-law: 모바일에 최적화된 포맷 (낮은 대역폭, 실시간 최적화)
        input_audio_format: 'g711_ulaw',
        output_audio_format: 'g711_ulaw',
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          silence_duration_ms: 500,
        },
      };
      openaiWs.send(
        JSON.stringify({
          type: 'session.update',
          session: sessionConfig,
        }),
      );
      console.log('✅ 세션 설정 완료 (g711_ulaw - 모바일 최적화)');
      console.log(
        `⚠️ 대화 히스토리 로드 비활성화됨 (${conversationHistory.length}개 메시지)`,
      );
    });

    openaiWs.on('message', (data: Buffer) => {
      const event = JSON.parse(data.toString());
      console.log(`📥 OpenAI 이벤트: ${event.type}`);
      if (event.type === 'error') {
        console.error(
          '❌ OpenAI API 에러:',
          JSON.stringify(event.error, null, 2),
        );
      }
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(data.toString());
      }
      this.handleHistorySave(event, userId, plantId);
    });

    openaiWs.on('error', error => {
      console.error('❌ OpenAI WebSocket 오류:', error);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'error',
            error: {
              message: 'OpenAI API 연결 오류',
              code: 'openai_connection_error',
            },
          }),
        );
      }
    });

    openaiWs.on('close', (code, reason) => {
      console.log(`🔌 OpenAI WebSocket 연결 종료: ${code} - ${reason.toString()}`);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.close();
      }
    });


    // 5. 클라이언트 WebSocket 이벤트 핸들러 (수정된 코드)
    clientWs.on('message', (message: Buffer) => {
      console.log(
        `➡️ 클라이언트로부터 메시지 수신: 크기=${message.length} bytes`,
      );

      if (openaiWs.readyState !== WebSocket.OPEN) {
        console.warn('⚠️ OpenAI 소켓이 열려있지 않아 메시지를 전달할 수 없습니다.');
        return;
      }

      try {
        const event = JSON.parse(message.toString());
        console.log(`📦 수신된 JSON 타입: ${event.type}`);

        // 클라이언트의 오디오 청크 이벤트를 OpenAI 형식으로 번역
        if (event.type === 'input_audio_buffer.append' && event.audio) {
          const audioChunkEvent = {
            type: 'input_audio_buffer.append',
            audio: event.audio, // 클라이언트가 보낸 base64 PCM16 데이터
          };
          openaiWs.send(JSON.stringify(audioChunkEvent));
          console.log('🎧 오디오 청크(G.711)를 OpenAI로 전달');
        } 
        // 클라이언트의 응답 생성 요청
        else if (event.type === 'response.create') {
          openaiWs.send(JSON.stringify({ type: 'response.create' }));
          console.log('🗣️ 응답 생성 요청을 OpenAI로 전달');
        }
      } catch (e) {
        console.warn('⚠️ 수신된 메시지가 예상된 JSON 형식이 아닙니다:', message.toString());
      }
    });

    // ... clientWs 'close', 'error' 핸들러는 변경 없음 ...
    clientWs.on('close', () => {
      console.log('🔌 클라이언트 WebSocket 연결 종료');
      if (openaiWs.readyState === WebSocket.OPEN) {
        openaiWs.close();
      }
    });

    clientWs.on('error', error => {
      console.error('❌ 클라이언트 WebSocket 오류:', error);
      if (clientWs.readyState === WebSocket.OPEN) {
        openaiWs.close();
      }
    });
  }

  // ... handleHistorySave 메서드는 변경 없음 ...
  /**
   * 대화 히스토리 저장 처리
   */
  private async handleHistorySave(
    event: any,
    userId: number,
    plantId: number,
  ): Promise<void> {
    try {
      const messageHistory = new RedisChatMessageHistory(userId, plantId);

      if (
        event.type === 'conversation.item.input_audio_transcription.completed'
      ) {
        const userMessage = event.transcript;
        if (userMessage) {
          await messageHistory.addUserMessage(userMessage);
          console.log(`💾 사용자 메시지 저장: ${userMessage}`);
        }
      }

      if (event.type === 'response.done') {
        const output = event.response?.output;
        if (output && output.length > 0) {
          const assistantMessage = output
            .filter((item: any) => item.type === 'message')
            .map((item: any) => {
              const textContent = item.content?.find(
                (c: any) => c.type === 'text',
              );
              return textContent?.text || '';
            })
            .join(' ')
            .trim();

          if (assistantMessage) {
            await messageHistory.addAIChatMessage(assistantMessage);
            console.log(`💾 AI 응답 저장: ${assistantMessage}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ 대화 히스토리 저장 오류:', error);
    }
  }
}

