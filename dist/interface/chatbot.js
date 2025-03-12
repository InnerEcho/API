"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotType = exports.UserType = void 0;
var UserType;
(function (UserType) {
    UserType["USER"] = "User";
    UserType["BOT"] = "Bot";
})(UserType || (exports.UserType = UserType = {}));
//대화이력챗봇 전용 메시지 타입 정의: 기본메시지타입 상속받아 기능확장함
// export interface IMemberMessage extends IMessage {
//     nick_name: string;
// }
var BotType;
(function (BotType) {
    BotType["LLMGPT"] = "LLMGPT";
    BotType["LLMGEMINI"] = "LLMGEMINI";
    BotType["RAGDOC"] = "RAGDOC";
    BotType["RAGWEB"] = "RAGWEB";
})(BotType || (exports.BotType = BotType = {}));
