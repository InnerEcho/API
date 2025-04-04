//API 호출 결과 반환 데이터 타입 정의
export type ResponseData = {
    code: number;
    data: string | null | IMessage;
    msg: string;
};
  
export interface IMessage {
    user_id:number;
    plant_id:number;
    message: string | undefined;
    send_date: Date;
    user_type: UserType;
}
  
export enum UserType {
    USER = 'User',
    BOT = 'Bot',
}
  
export interface ISendMessage {
    role: string;
    message: string;
}
  
//대화이력챗봇 전용 메시지 타입 정의: 기본메시지타입 상속받아 기능확장함
// export interface IMemberMessage extends IMessage {
//     nick_name: string;
// }
  
export enum BotType {
    LLMGPT = 'LLMGPT',
    LLMGEMINI = 'LLMGEMINI',
    RAGDOC = 'RAGDOC',
    RAGWEB = 'RAGWEB',
}