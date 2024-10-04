"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
/* GET home page. */
router.get('/', function (req, res) {
    let apiResult = {
        code: 200,
        data: null,
        msg: "ok"
    };
    res.json(apiResult);
});
exports.default = router;
