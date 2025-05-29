import type { Request, Response } from 'express';
import type { ApiResult } from '@/interface/api.js';
import { SpeechService } from '@/services/SpeechService.js';

export class PlantSpeechController {
  private speechService: SpeechService;

  constructor(speechService: SpeechService) {
    this.speechService = speechService;
  }

  /**
   * STT 처리
   */
  public async speechToText(req: Request, res: Response): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      if (!req.file) {
        result.msg = 'Not Exist Audio File';
        res.status(400).json(result);
        return;
      }

      const { user_id, plant_id } = req.body;
      const response = await this.speechService.speechToText(
        req.file.path,
        user_id,
        plant_id,
      );
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

  /**
   * TTS 처리
   */
  public async textToSpeech(req: Request, res: Response): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: 'Failed' };

    try {
      const { text } = req.body;
      const response = await this.speechService.textToSpeech(text);

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
}
