import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export class PlantSpeechController {
  constructor(speechService) {
    this.speechService = speechService;
  }

  /**
   * STT 처리
   */
  async speechToText(req, res) {
    const result = {
      code: 400,
      data: null,
      msg: 'Failed'
    };
    try {
      if (!req.file) {
        result.msg = 'Not Exist Audio File';
        res.status(400).json(result);
        return;
      }
      const {
        user_id,
        plant_id
      } = req.body;
      const response = await this.speechService.speechToText(req.file.path, user_id, plant_id);
      result.code = 200;
      result.data = response;
      result.msg = 'Ok';
      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      result.code = 500;
      result.msg = 'Server Error';
      res.status(500).json(result);
    }
  }
  async textToSpeechHLS(req, res) {
    try {
      const {
        message
      } = req.query;
      const sessionId = Date.now().toString();
      const hlsDir = path.join(__dirname, `../../hls/${sessionId}`);
      fs.mkdirSync(hlsDir, {
        recursive: true
      });
      await this.speechService.generateHLS(message, hlsDir);
      res.json({
        sessionId,
        hlsUrl: `/speech/tts/stream/${sessionId}.m3u8`
      });
    } catch (err) {
      console.error('TTS HLS Error:', err);
      res.status(500).json({
        code: 500,
        msg: 'TTS HLS Error'
      });
    }
  }
  getPlaylist(req, res) {
    const {
      sessionId
    } = req.params;
    const playlistPath = path.join(__dirname, `../../hls/${sessionId}/playlist.m3u8`);
    if (fs.existsSync(playlistPath)) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      fs.createReadStream(playlistPath).pipe(res);
    } else {
      res.status(404).send('Playlist not found');
    }
  }
  getSegment(req, res) {
    const {
      sessionId,
      segment
    } = req.params;
    const segmentPath = path.join(__dirname, `../../hls/${sessionId}/${segment}`);
    if (fs.existsSync(segmentPath)) {
      res.setHeader('Content-Type', 'video/MP2T');
      fs.createReadStream(segmentPath).pipe(res);
    } else {
      res.status(404).send('Segment not found');
    }
  }
}