import express from 'express';
import { PlantSpeechController } from "../controllers/speech/SpeechController.js";
import { SpeechService } from "../services/speech/SpeechService.js";
import multer from 'multer';
const router = express.Router();
const upload = multer({
  dest: 'uploads/'
}); // 파일을 임시로 'uploads' 폴더에 저장

// 의존성 주입
const speechService = new SpeechService();
const plantSpeechController = new PlantSpeechController(speechService);
router.post('/stt', upload.single('file'), plantSpeechController.speechToText.bind(plantSpeechController));

// 음성 생성 및 HLS 변환 요청
router.post('/tts', plantSpeechController.textToSpeech.bind(plantSpeechController));
export default router;