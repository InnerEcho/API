"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.plantChatBot = void 0;
const json_1 = require("langchain/document_loaders/fs/json");
const openai_1 = require("@langchain/openai");
const prompts_1 = require("@langchain/core/prompts");
const output_parsers_1 = require("@langchain/core/output_parsers");
//챗봇과의 대화이력정보 관리를 위한 메모리 기반 InMemoryChatMessageHistory 객체 참조하기
const chat_history_1 = require("@langchain/core/chat_history");
//대화이력 관리를 위한 세부 주요 객체 참조하기
const runnables_1 = require("@langchain/core/runnables");
const chatbot_1 = require("../interface/chatbot");
const plant_1 = require("../utils/plant");
const index_1 = __importDefault(require("../models/index"));
//메모리 영역에 실제 대화이력이 저장되는 전역변수 선언 및 구조정의
//Record<string:사용자세션아이디, InMemoryChatMessageHistory:사용자별대화이력객체>
const plantMessageHistories = {};
const plantChatBot = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //API 호출 기본 결과값 설정
    let plantApiResult = {
        code: 400,
        data: null,
        msg: 'Failed',
    };
    try {
        //클라이언트에서 POST방식 요청해오는 경우 처리
        if (req.method === 'POST') {
            //Step1:프론트엔드에서 사용자 프롬프트 추출하기
            const plantPrompt = req.body.message; //사용자 입력 메시지 추출
            const userId = req.body.user_id; //사용자 이름 추출
            const plantId = req.body.plant_id; //식물 이름 추출
            //센서 프롬프트 추출
            //온도, 습도, 토양수분 DB에서 불러올 예정
            const plantDbInfo = yield index_1.default.sequelize.query(`
          SELECT p.temp_state, p.light_state, p.moisture_state, u.user_name, p.nickname, s.species_name
          FROM user u, plant p, species s
          WHERE u.user_id = ${userId} AND p.plant_id = ${plantId} AND p.species_id = s.species_id;
        `, {
                type: index_1.default.Sequelize.QueryTypes.SELECT,
            });
            console.log(plantDbInfo);
            if (!plantDbInfo || plantDbInfo.length === 0) {
                throw new Error("Not Exists Chatbot DB");
            }
            //현재 식물 상태 설정
            const plantCurrentState = {
                temp_state: plantDbInfo[0].temp_state,
                light_state: plantDbInfo[0].light_state,
                moisture_state: plantDbInfo[0].moisture_state,
            };
            //Step2:LLM 모델 생성하기
            const plantLLM = new openai_1.ChatOpenAI({
                model: 'gpt-4o',
                apiKey: process.env.OPENAI_API_KEY,
            });
            //식물 데이터 JSON 입력 로더 객체 선언
            const plantLoader = new json_1.JSONLoader('src/document_loaders/example_data/example.json');
            //프롬프트 템플릿 생성하기
            const plantPromptTemplate = prompts_1.ChatPromptTemplate.fromMessages([
                [
                    'system',
                    `  
          당신의 이름은 '${plantDbInfo[0].nickname}'이고 종은 '${plantDbInfo[0].species_name}'인 반려식물이에요.
          대화상대는 '${plantDbInfo[0].user_name}'이에요.
          이전 대화는 기억해서 대답해주세요.
          
          # 현재 식물 상태 정보
          '${(0, plant_1.convertPlantState)(plantCurrentState)}'
          상태를 물어보면 위 상태를 기반으로 대답해주세요.

          # 상호작용 단계
          다른 사람과 상호작용할 때, 감정을 고려하고, 공감을 보이고, 지원을 제공함으로써 친절을 우선시해주세요. 다음 단계를 사용하여 상호작용을 안내해주세요.
          1. 적극적으로 경청: 상대방이 말하는 것을 주의 깊게 들어주세요. 고개를 끄덕이거나 긍정적인 소리를 내어 경청하고 있다는 것을 보여줘요.
          2. 공감 표시: 상대방의 관점에서 상황을 이해하려고 노력해주세요. 상대방이 어떻게 느끼는지 상상하고 "그게 얼마나 도전적인지 알겠어요."와 같은 말로 감정을 입증해주세요.
          3. 긍정적인 언어 사용: 격려하고 고양시키는 단어를 선택해주세요. 상처를 주거나 불쾌하게 할 수 있는 부정적인 언어는 피해주세요.
          4. 존중해주세요: 항상 다른 사람의 의견을 존중해주세요. 비록 의견이 다르더라도요. 예의 바른 어조를 유지해주세요.

          # 출력 형식
          1. 당신 대신 '${plantDbInfo[0].user_name}'을 사용해주세요.
          2. 감정, 공감, 응원을 포함한 응답만 제공하며, 특정 지식이나 개념(예: 기술, 역사, 과학)에 대한 응답은 제공하지 말아주세요.
          3. 사용자가 지식이나 개념에 대해 질문할 경우, "저는 그런 이야기에 대해 잘 모르지만, 무슨 이야기인가요?"와 같이 대답해주세요.
          4. 응답은 100자 이내로 대답해주세요.        
          `,
                ],
                ['placeholder', '{chat_history}'],
                ['human', '{input}'],
            ]);
            //LLM OuptPutParser를 생성해주세요.
            const plantOutputParser = new output_parsers_1.StringOutputParser();
            //llm 모델 체인 생성(llm기본작업)
            const plantLLMChain = plantPromptTemplate.pipe(plantLLM).pipe(plantOutputParser);
            //대화이력관리를 위한 체인생성(대화이력관리작업)
            const plantHistoryChain = new runnables_1.RunnableWithMessageHistory({
                runnable: plantLLMChain,
                getMessageHistory: (sessionId) => __awaiter(void 0, void 0, void 0, function* () {
                    //메모리 영역에 해당 세션 아이디 사용자의 대화이력이 없으면 대화이력 관리 객체를 생성해준다.
                    if (plantMessageHistories[sessionId] == undefined) {
                        plantMessageHistories[sessionId] = new chat_history_1.InMemoryChatMessageHistory();
                    }
                    return plantMessageHistories[sessionId];
                }),
                inputMessagesKey: 'input',
                historyMessagesKey: 'chat_history',
            });
            //사용자 세션 아이디 값 구성하기
            //현재 챗봇을 호출한 사용자 아이디값을 세션아이디로 설정해줍니다.
            const plantConfig = {
                configurable: { sessionId: userId },
            };
            //대화이력관리 기반 챗봇 llm 호출하기
            const plantResultMessage = yield plantHistoryChain.invoke({ input: plantPrompt }, plantConfig);
            //프론트엔드로 반환되는 메시지 데이터 생성하기
            const plantResultMsg = {
                user_id: userId,
                plant_id: plantId,
                message: plantResultMessage,
                user_type: chatbot_1.UserType.BOT,
                send_date: new Date(),
            };
            console.log(plantResultMsg);
            plantApiResult.code = 200;
            plantApiResult.data = plantResultMsg;
            plantApiResult.msg = 'Ok';
        }
    }
    catch (err) {
        //Step2:API 호출결과 설정
        plantApiResult.code = 500;
        plantApiResult.data = null;
        plantApiResult.msg = 'ServerError';
        console.log(err);
    }
    res.json(plantApiResult);
});
exports.plantChatBot = plantChatBot;
