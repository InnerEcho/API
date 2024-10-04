import { Request, Response, Router } from 'express';
import { ApiResult } from '../interface/api'
const router = Router();

/* GET home page. */
router.get('/', function (req: Request, res: Response) {
  let apiResult: ApiResult = {
    code: 200,
    data: null,
    msg: "ok"
  };

  res.json(apiResult);
});

export default router;
