import { GrowthDiaryBot } from './bots/GrowthDiaryBot.js';
export declare class GrowthDiaryService {
    private growthDiaryBot;
    constructor(growthDiaryBot: GrowthDiaryBot);
    create(userId: number, plantId: number, userMessage: string): Promise<any>;
}
