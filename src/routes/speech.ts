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
// HLS playlist(.m3u8) 제공 엔드포인트
router.get('/tts/stream/:sessionId.m3u8', plantSpeechController.getPlaylist.bind(plantSpeechController));

// HLS 세그먼트(.ts) 제공 엔드포인트
router.get('/tts/segment/:sessionId/:segment', plantSpeechController.getSegment.bind(plantSpeechController));

// 음성 생성 및 HLS 변환 요청
router.get('/tts', plantSpeechController.textToSpeechHLS.bind(plantSpeechController));

export default router;
