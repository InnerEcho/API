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
exports.speechToText = void 0;
require("dotenv/config");
const chatbot_1 = require("../interface/chatbot");
const speech_1 = require("@google-cloud/speech");
const fs_1 = __importDefault(require("fs"));
const speechToText = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
exports.speechToText = speechToText;
