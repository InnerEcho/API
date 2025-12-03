interface RealtimeSessionResponse {
  id: string;
  model: string;
  voice: string;
  client_secret: {
    value: string;
    expires_at: number;
  };
}

export interface RealtimeSessionRequest {
  instructions: string;
}

export interface RealtimeSessionResult {
  sessionId: string;
  ephemeralToken: string;
  expiresAt: number;
  model: string;
  voice: string;
}

export class OpenAIRealtimeClient {
  private sessionApiUrl = 'https://api.openai.com/v1/realtime/sessions';

  constructor(private apiKey: string) {}

  public async createSession(requestBody: any): Promise<RealtimeSessionResult> {
    const response = await fetch(this.sessionApiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI 세션 생성 실패: ${response.status} ${errorText}`);
    }

    const sessionData: RealtimeSessionResponse = await response.json();

    return {
      sessionId: sessionData.id,
      model: sessionData.model,
      voice: sessionData.voice,
      ephemeralToken: sessionData.client_secret.value,
      expiresAt: sessionData.client_secret.expires_at,
    };
  }
}
