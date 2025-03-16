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
const json_1 = require("langchain/document_loaders/fs/json");
const openai_1 = require("@langchain/openai");
const prompts_1 = require("@langchain/core/prompts");
const output_parsers_1 = require("@langchain/core/output_parsers");
const chat_history_1 = require("@langchain/core/chat_history");
const runnables_1 = require("@langchain/core/runnables");
const chatbot_1 = require("../interface/chatbot");
const plant_1 = require("../utils/plant");
const index_1 = __importDefault(require("../models/index"));
const speech_1 = require("@google-cloud/speech");
const fs_1 = __importDefault(require("fs"));
// 대화 이력 저장소
const plantMessageHistories = {};
class PlantChatBotController {
    /**
     * 🌱 식물 챗봇과의 대화 처리
     */
    chat(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            let plantApiResult = {
                code: 400,
                data: null,
                msg: "Failed",
            };
            try {
                if (req.method === "POST") {
                    // Step1: 사용자 입력값 추출
                    const { message: plantPrompt, user_id: userId, plant_id: plantId } = req.body;
                    // Step2: DB에서 식물 정보 가져오기
                    const plantDbInfo = yield index_1.default.sequelize.query(`
            SELECT p.temp_state, p.light_state, p.moisture_state, 
                   u.user_name, p.nickname, s.species_name
            FROM user u, plant p, species s
            WHERE u.user_id = ${userId} AND p.plant_id = ${plantId} 
                  AND p.species_id = s.species_id;
          `, { type: index_1.default.Sequelize.QueryTypes.SELECT });
                    console.log(plantDbInfo);
                    if (!plantDbInfo || plantDbInfo.length === 0) {
                        throw new Error("Not Exists Chatbot DB");
                    }
                    // 현재 식물 상태 설정
                    const plantCurrentState = {
                        temp_state: plantDbInfo[0].temp_state,
                        light_state: plantDbInfo[0].light_state,
                        moisture_state: plantDbInfo[0].moisture_state,
                    };
                    // Step3: LLM 모델 생성
                    const plantLLM = new openai_1.ChatOpenAI({
                        model: "gpt-4o",
                        apiKey: process.env.OPENAI_API_KEY,
                    });
                    // Step4: JSON 데이터 로딩
                    const plantLoader = new json_1.JSONLoader("src/document_loaders/example_data/example.json");
                    // Step5: 프롬프트 템플릿 생성
                    const plantPromptTemplate = prompts_1.ChatPromptTemplate.fromMessages([
                        [
                            "system",
                            `
            당신의 이름은 '${plantDbInfo[0].nickname}'이고, 종은 '${plantDbInfo[0].species_name}'인 반려식물이에요.
            대화 상대는 '${plantDbInfo[0].user_name}'이에요.
            이전 대화는 기억해서 대답해주세요.

            # 현재 식물 상태 정보
            '${(0, plant_1.convertPlantState)(plantCurrentState)}'
            상태를 물어보면 위 상태를 기반으로 대답해주세요.

            # 상호작용 가이드
            1. 상대방이 말하는 것을 주의 깊게 들어주세요.
            2. 공감하며, 감정을 표현해주세요.
            3. 긍정적인 언어를 사용해주세요.
            4. 항상 예의를 갖추고 상대방을 존중해주세요.

            # 출력 형식
            1. 당신 대신 '${plantDbInfo[0].user_name}'을 사용해주세요.
            2. 지식에 대한 질문은 "저는 그런 이야기에 대해 잘 모르지만, 무슨 이야기인가요?"라고 답해주세요.
            3. 응답은 100자 이내로 제한해주세요.
            `,
                        ],
                        ["placeholder", "{chat_history}"],
                        ["human", "{input}"],
                    ]);
                    // Step6: Output Parser 생성
                    const plantOutputParser = new output_parsers_1.StringOutputParser();
                    // Step7: LLM 체인 생성
                    const plantLLMChain = plantPromptTemplate.pipe(plantLLM).pipe(plantOutputParser);
                    // Step8: 대화 이력 관리 체인 생성
                    const plantHistoryChain = new runnables_1.RunnableWithMessageHistory({
                        runnable: plantLLMChain,
                        getMessageHistory: (sessionId) => __awaiter(this, void 0, void 0, function* () {
                            if (!plantMessageHistories[sessionId]) {
                                plantMessageHistories[sessionId] = new chat_history_1.InMemoryChatMessageHistory();
                            }
                            return plantMessageHistories[sessionId];
                        }),
                        inputMessagesKey: "input",
                        historyMessagesKey: "chat_history",
                    });
                    // 사용자 세션 설정
                    const plantConfig = {
                        configurable: { sessionId: userId },
                    };
                    // Step9: 챗봇 응답 생성
                    const plantResultMessage = yield plantHistoryChain.invoke({ input: plantPrompt }, plantConfig);
                    // Step10: 응답 데이터 구성
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
                    plantApiResult.msg = "Ok";
                }
            }
            catch (err) {
                plantApiResult.code = 500;
                plantApiResult.data = null;
                plantApiResult.msg = "ServerError";
                console.error(err);
            }
            res.json(plantApiResult);
        });
    }
    speechToText(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            let apiResult = {
                code: 400,
                data: null,
                msg: 'Failed',
            };
            try {
                const userId = req.body.user_id; //사용자 이름 추출
                const plantId = req.body.plant_id; //식물 이름 추출
                // 업로드된 파일 확인
                if (!req.file || !req.file.path) {
                    apiResult.msg = 'Not Exist Audio File';
                    res.json(apiResult);
                    return;
                }
                // Google Cloud SpeechClient 생성 (환경 변수 사용)
                const client = new speech_1.SpeechClient();
                // 파일 경로 가져오기
                const filePath = req.file.path;
                // 파일을 Buffer로 읽기
                const fileContent = fs_1.default.readFileSync(filePath);
                // Define the audio and config objects
                const audio = {
                    content: fileContent.toString('base64'), // 오디오 파일을 Base64 인코딩하여 content에 추가
                };
                const config = {
                    encoding: 'OGG_OPUS', // Opus 인코딩을 사용
                    sampleRateHertz: 16000, // 녹음 시 설정했던 샘플링 레이트
                    languageCode: 'ko-KR',
                };
                const request = {
                    audio,
                    config,
                };
                // Call the recognize method
                const [response] = yield client.recognize(request);
                // Extract the transcription from the response
                const transcription = (_a = response.results) === null || _a === void 0 ? void 0 : _a.map(result => { var _a; return (_a = result.alternatives) === null || _a === void 0 ? void 0 : _a[0].transcript; }).join('\n');
                console.log(`Transcription: ${transcription}`);
                //프론트엔드로 반환되는 메시지 데이터 생성하기
                const plantResultMsg = {
                    user_id: userId,
                    plant_id: plantId,
                    message: transcription,
                    user_type: chatbot_1.UserType.BOT,
                    send_date: new Date(),
                };
                apiResult.code = 200;
                apiResult.data = plantResultMsg;
                apiResult.msg = 'Ok';
            }
            catch (err) {
                apiResult.code = 500;
                apiResult.data = null;
                apiResult.msg = 'Server Error';
                console.error('음성 인식 처리 중 오류 발생:', err);
            }
            res.json(apiResult);
        });
    }
}
// 🌱 PlantChatBotController 인스턴스 생성 후 export
exports.default = new PlantChatBotController();
