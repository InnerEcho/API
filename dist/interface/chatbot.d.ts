export type ResponseData = {
    code: number;
    data: string | null | IMessage;
    msg: string;
};
export interface IMessage {
    user_id: number;
    plant_id: number;
    message: string | undefined;
    send_date: Date;
    user_type: UserType;
}
export declare enum UserType {
    USER = "User",
    BOT = "Bot"
}
export interface ISendMessage {
    role: string;
    message: string;
}
export declare enum BotType {
    LLMGPT = "LLMGPT",
    LLMGEMINI = "LLMGEMINI",
    RAGDOC = "RAGDOC",
    RAGWEB = "RAGWEB"
}
/**
 * 식물 챗봇을 위한 사용자 & 식물 정보 타입
 */
export interface PlantDbInfo {
    user_name: string;
    nickname: string;
    species_name: string;
}
