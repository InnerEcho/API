const MISSION_XP = 10;
class MissionController {
    //일일 미션 주기 함수 필요
    async drinkWater(req, res) {
        const apiResult = {
            code: 400,
            data: null,
            msg: "",
        };
        try {
            //물마시는 이미지 받기
            //물마시는 이미지인지 판단
            //판단 결과 반환
        }
        catch (err) {
            apiResult.code = 500;
            apiResult.msg = "ServerError";
            res.status(500).json(apiResult);
        }
    }
    async walk(req, res) {
        const apiResult = {
            code: 400,
            data: null,
            msg: "",
        };
        try {
        }
        catch (err) {
            apiResult.code = 500;
            apiResult.msg = "ServerError";
            res.status(500).json(apiResult);
        }
    }
    async chatWithPlant(req, res) {
        const apiResult = {
            code: 400,
            data: null,
            msg: "",
        };
        try {
        }
        catch (err) {
            apiResult.code = 500;
            apiResult.msg = "ServerError";
            res.status(500).json(apiResult);
        }
    }
    async talkWithPlant(req, res) {
        const apiResult = {
            code: 400,
            data: null,
            msg: "",
        };
        try {
        }
        catch (err) {
            apiResult.code = 500;
            apiResult.msg = "ServerError";
            res.status(500).json(apiResult);
        }
    }
    async submitSmileImage(req, res) {
        const apiResult = {
            code: 400,
            data: null,
            msg: "",
        };
        try {
        }
        catch (err) {
            apiResult.code = 500;
            apiResult.msg = "ServerError";
            res.status(500).json(apiResult);
        }
    }
}
export {};
//# sourceMappingURL=MissionController.js.map