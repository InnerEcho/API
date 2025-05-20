import { IMessage, PlantDbInfo } from '../interface/chatbot.js';
/**
 * 🌱 BaseChatBot (템플릿 메서드 패턴의 추상 클래스)
 * - 대화 처리의 공통 흐름을 고정
 * - 프롬프트 생성은 하위 클래스에 위임
 */
export declare abstract class BaseChatBot {
    private messageHistories;
    /**
     * 🌱 대화 처리의 공통 템플릿 메서드
     * 1. 식물 정보 조회
     * 2. 프롬프트 생성 (하위 클래스에 위임)
     * 3. LLM 호출
     * 4. 대화 이력 관리
     * 5. 대화 결과 저장 및 반환
     */
    processChat(userId: number, plantId: number, userMessage: string): Promise<IMessage>;
    /**
     * 🌱 프롬프트 생성 메서드 (하위 클래스에서 반드시 구현)
     * @param plantDbInfo - 사용자와 식물 정보
     * @param userMessage - 사용자 입력 메시지
     */
    protected abstract createPrompt(plantDbInfo: PlantDbInfo, userMessage: string, userId: number, plantId: number): Promise<Array<[string, string]>>;
}
