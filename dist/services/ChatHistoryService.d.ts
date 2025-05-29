import type { IMessage } from '@/interface/chatbot.js';
/**
 * 🌱 PlantChatHistoryService
 * - 식물 챗봇 대화 이력을 조회하는 전용 서비스
 */
export declare class ChatHistoryService {
    /**
     * 특정 사용자와 식물 간의 대화 이력 조회
     */
    getChatHistory(userId: number, plantId: number): Promise<IMessage[]>;
    getTodayHistory(userId: number, plantId: number): Promise<IMessage[]>;
}
