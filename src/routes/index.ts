import type { Request, Response } from 'express';
import { Router } from 'express';
import type { ApiResult } from '@/interface/api.js';
const router = Router();

/* GET home page. */
router.get('/', function (req: Request, res: Response) {
  let apiResult: ApiResult = {
    code: 200,
    data: null,
    msg: 'ok',
  };

  res.json(apiResult);
});

export default router;
