"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const index_1 = __importDefault(require("../models/index"));
class AuthController {
    /**
     * 사용자 회원가입
     */
    registerUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const apiResult = {
                code: 400,
                data: null,
                msg: "",
            };
            try {
                const { user_name, userEmail, password } = req.body;
                const existEmail = yield index_1.default.User.findOne({ where: { user_email: userEmail } });
                const existNickName = yield index_1.default.User.findOne({ where: { user_name } });
                if (existEmail) {
                    apiResult.msg = "ExistEmail";
                    res.status(400).json(apiResult);
                    return;
                }
                else if (existNickName) {
                    apiResult.msg = "ExistNickName";
                    res.status(400).json(apiResult);
                    return;
                }
                const entryPassword = yield bcryptjs_1.default.hash(password, 12);
                const entryUser = { user_name, user_email: userEmail, password: entryPassword };
                const registedUser = yield index_1.default.User.create(entryUser);
                registedUser.password = ""; // 비밀번호 숨김 처리
                apiResult.code = 200;
                apiResult.data = registedUser;
                apiResult.msg = "Success";
                res.status(200).json(apiResult);
            }
            catch (err) {
                apiResult.code = 500;
                apiResult.msg = "ServerError";
                res.status(500).json(apiResult);
            }
        });
    }
    /**
     * 사용자 로그인 처리
     */
    loginUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const apiResult = {
                code: 400,
                data: null,
                msg: "",
            };
            try {
                const { userEmail, password } = req.body;
                const dbUser = yield index_1.default.User.findOne({ where: { user_email: userEmail } });
                if (!dbUser) {
                    apiResult.msg = "NotExistEmail";
                    apiResult.code = 401;
                    res.json(apiResult);
                    return;
                }
                const comparePassword = yield bcryptjs_1.default.compare(password, dbUser.password);
                if (!comparePassword) {
                    apiResult.msg = "IncorrectPassword";
                    apiResult.code = 402;
                    res.json(apiResult);
                    return;
                }
                const dbPlant = yield index_1.default.sequelize.query(`
        SELECT p.plant_id, p.nickname
        FROM user u, plant p
        WHERE u.user_id = p.user_id AND u.user_id = ${dbUser.user_id} AND p.plant_id = 1;
      `, {
                    type: index_1.default.Sequelize.QueryTypes.SELECT,
                });
                const tokenData = {
                    user_id: dbUser.user_id,
                    user_email: dbUser.user_email,
                    user_name: dbUser.user_name,
                    state: dbUser.state,
                    plant_id: ((_a = dbPlant[0]) === null || _a === void 0 ? void 0 : _a.plant_id) || null,
                    nickname: ((_b = dbPlant[0]) === null || _b === void 0 ? void 0 : _b.nickname) || null,
                };
                const token = jsonwebtoken_1.default.sign(tokenData, process.env.JWT_AUTH_KEY, {
                    expiresIn: "24h",
                    issuer: "InnerEcho",
                });
                console.log(token);
                apiResult.code = 200;
                apiResult.data = token;
                apiResult.msg = "Ok";
                res.status(200).json(apiResult);
            }
            catch (err) {
                apiResult.code = 500;
                apiResult.msg = "ServerError";
                console.log(err);
                res.status(500).json(apiResult);
            }
        });
    }
    /**
     * 이메일 인증 코드 발송
     */
    sendEmailVerification(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const apiResult = {
                code: 400,
                data: null,
                msg: "",
            };
            const smtpTransport = nodemailer_1.default.createTransport({
                pool: true,
                maxConnections: 1,
                service: "naver",
                host: "smtp.naver.com",
                port: 587,
                secure: false,
                requireTLS: true,
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.PW,
                },
                tls: {
                    rejectUnauthorized: false,
                },
            });
            const randNum = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;
            const email = req.body.email;
            const mailOptions = {
                from: process.env.EMAIL,
                to: email,
                subject: "Ohgnoy 메일 인증",
                html: `인증번호를 입력해주세요: ${randNum}`,
            };
            try {
                yield smtpTransport.sendMail(mailOptions);
                apiResult.code = 200;
                apiResult.data = randNum;
                apiResult.msg = "SendMail";
            }
            catch (err) {
                apiResult.code = 500;
                apiResult.msg = "ServerError";
                console.log(err);
            }
            res.json(apiResult);
        });
    }
}
// AuthController 인스턴스 생성
exports.default = new AuthController();
