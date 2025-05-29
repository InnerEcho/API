//API 호출 결과 반환 데이터 타입 정의

export let UserType = /*#__PURE__*/function (UserType) {
  UserType["USER"] = "User";
  UserType["BOT"] = "Bot";
  return UserType;
}({});
//대화이력챗봇 전용 메시지 타입 정의: 기본메시지타입 상속받아 기능확장함
// export interface IMemberMessage extends IMessage {
//     nick_name: string;
// }

export let BotType = /*#__PURE__*/function (BotType) {
  BotType["LLMGPT"] = "LLMGPT";
  BotType["LLMGEMINI"] = "LLMGEMINI";
  BotType["RAGDOC"] = "RAGDOC";
  BotType["RAGWEB"] = "RAGWEB";
  return BotType;
}({});

/**
 * 식물 챗봇을 위한 사용자 & 식물 정보 타입
 */