import { Router } from 'express';
const router = Router();

/* GET home page. */
router.get('/', function (req, res) {
  let apiResult = {
    code: 200,
    data: null,
    msg: 'ok'
  };
  res.json(apiResult);
});
export default router;