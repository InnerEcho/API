import express from 'express';
import { PlantSpeechController } from '@/controllers/SpeechController.js';
import { SpeechService } from '@/services/SpeechService.js';

const router = express.Router();

// 의존성 주입
const speechService = new SpeechService();
const plantSpeechController = new PlantSpeechController(speechService);

router.post(
  '/stt',
  plantSpeechController.speechToText.bind(plantSpeechController),
);

// 음성 생성 및 HLS 변환 요청
router.get('/tts', plantSpeechController.textToSpeech.bind(plantSpeechController));

export default router;
