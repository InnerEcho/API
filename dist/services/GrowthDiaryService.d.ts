import { GrowthDiaryBot } from './bots/GrowthDiaryBot.js';
export declare class GrowthDiaryService {
    private growthDiaryBot;
    constructor(growthDiaryBot: GrowthDiaryBot);
    getDiaryByDate(user_id: number, date: string): Promise<any>;
    create(userId: number, plantId: number, userMessage: string): Promise<any>;
}
