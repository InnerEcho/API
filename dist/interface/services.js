/**
 * 서비스 레이어 인터페이스
 * 비즈니스 로직에서 사용되는 타입 정의
 */

// ==================== Token Service ====================

// ==================== Plant Service ====================

// ==================== ChatBot Service ====================

export let UserType = /*#__PURE__*/function (UserType) {
  UserType["USER"] = "User";
  UserType["BOT"] = "Bot";
  return UserType;
}({});
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