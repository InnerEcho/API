import 'dotenv/config';
import { Request, Response } from 'express';
import { ApiResult } from '../interface/api';
import { SpeechClient } from '@google-cloud/speech';
import fs from 'fs';

export const speechToText = async (
  req: Request,
  res: Response,
): Promise<any> => {
  let apiResult: ApiResult = {
    code: 400,
    data: null,
    msg: 'Failed',
  };

  try {
    // 업로드된 파일 확인
    if (!req.file || !req.file.path) {
      apiResult.msg = 'Not Exist Audio File';
      res.json(apiResult);
      return;
    }

    // Google Cloud SpeechClient 생성 (환경 변수 사용)
    const client = new SpeechClient();

    // 파일 경로 가져오기
    const filePath = req.file.path;

    // 파일을 Buffer로 읽기
    const fileContent = fs.readFileSync(filePath);

    // Define the audio and config objects
    const audio = {
      content: fileContent.toString('base64'), // 오디오 파일을 Base64 인코딩하여 content에 추가
    };

    const config = {
      encoding: 'OGG_OPUS' as const, // Opus 인코딩을 사용
      sampleRateHertz: 16000, // 녹음 시 설정했던 샘플링 레이트
      languageCode: 'ko-KR',
    };

    const request = {
      audio,
      config,
    };

    // Call the recognize method
    const [response] = await client.recognize(request);

    // Extract the transcription from the response
    const transcription = response.results
      ?.map(result => result.alternatives?.[0].transcript)
      .join('\n');

    console.log(`Transcription: ${transcription}`);

    apiResult.code = 200;
    apiResult.data = transcription;
    apiResult.msg = 'Ok';
  } catch (err) {
    apiResult.code = 500;
    apiResult.data = null;
    apiResult.msg = 'Server Error';
    console.error('음성 인식 처리 중 오류 발생:', err);
  }

  res.json(apiResult);
};
