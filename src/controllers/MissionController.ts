import type { Request, Response } from "express";
import type { ApiResult } from "../interface/api.js";

interface DailyMission {
    start():void;
    evaluate():boolean;
}

const MISSION_XP = 10;

class MissionController {
    //일일 미션 주기 함수 필요


    public async drinkWater(req:Request, res:Response): Promise<void>{
        const apiResult: ApiResult = {
            code:400,
            data:null,
            msg:"",
        };

        try{
            //물마시는 이미지 받기
            //물마시는 이미지인지 판단
            //판단 결과 반환
        }catch(err){
            apiResult.code=500;
            apiResult.msg = "ServerError";
            res.status(500).json(apiResult);
        }
    }

    public async walk(req:Request, res:Response): Promise<void>{
        const apiResult:ApiResult = {
            code:400,
            data:null,
            msg:"",
        };

        try{

        }catch(err){
            apiResult.code=500;
            apiResult.msg = "ServerError";
            res.status(500).json(apiResult);
        }
    }

    public async chatWithPlant(req:Request, res:Response): Promise<void>{
        const apiResult:ApiResult = {
            code:400,
            data:null,
            msg:"",
        };

        try{

        }catch(err){
            apiResult.code=500;
            apiResult.msg = "ServerError";
            res.status(500).json(apiResult);
        }
    }

    public async talkWithPlant(req:Request, res:Response): Promise<void>{
        const apiResult:ApiResult = {
            code:400,
            data:null,
            msg:"",
        };

        try{

        }catch(err){
            apiResult.code=500;
            apiResult.msg = "ServerError";
            res.status(500).json(apiResult);
        }
    }

    public async submitSmileImage(req:Request, res:Response): Promise<void>{
        const apiResult:ApiResult = {
            code:400,
            data:null,
            msg:"",
        };

        try{

        }catch(err){
            apiResult.code=500;
            apiResult.msg = "ServerError";
            res.status(500).json(apiResult);
        }
    }
}