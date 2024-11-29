import { Request, Response } from "express";
import { ApiResult } from "interface/api";

type plantState = {
    test:string;
};

export const getPlantState = async(req:Request,res:Response):Promise<any> =>{
    let apiResult: ApiResult={
        code:400,
        data:null,
        msg:"Failed"
    };

    try{

        const plantState:plantState = {
            test:"test"
        };

        apiResult.code = 200;
        apiResult.data = plantState;
        apiResult.msg = "Ok";
    }catch(err){
        apiResult.code = 500;
        apiResult.data = null;
        apiResult.msg = 'ServerError';
    }

    res.json(apiResult);
}