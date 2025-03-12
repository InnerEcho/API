#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_errors_1 = __importDefault(require("http-errors"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const debug_1 = __importDefault(require("debug"));
//Swagger 설정 가져오기
const swagger_config_1 = require("./config/swagger.config");
// 라우터와 데이터베이스 모델 가져오기
const index_1 = __importDefault(require("./routes/index"));
const auth_1 = __importDefault(require("./routes/auth"));
const chat_1 = __importDefault(require("./routes/chat"));
const plant_1 = __importDefault(require("./routes/plant"));
const index_2 = __importDefault(require("./models/index"));
dotenv_1.default.config();
const app = (0, express_1.default)();
index_2.default.sequelize
    .sync({ alter: true }) // 데이터베이스 자동 생성 (force: true는 기존 테이블을 삭제하고 새로 만듦)
    .catch((err) => {
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_USER:', process.env.DB_USER);
    console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
    console.log('DB_NAME:', process.env.DB_NAME);
    console.error('Unable to create DB:', err);
});
const debug = (0, debug_1.default)('ohgnoy-backend:server');
// CORS 설정
app.use((0, cors_1.default)());
// 뷰 엔진 설정
app.set('views', path_1.default.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// 미들웨어 설정
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
// 라우터 설정
app.use('/', index_1.default);
app.use('/user', auth_1.default);
app.use('/chat', chat_1.default);
app.use('/plant', plant_1.default);
//swagger 모듈 호출하기
app.use('/api-docs', swagger_config_1.swaggerUi.serve, swagger_config_1.swaggerUi.setup(swagger_config_1.specs));
// 404 에러 핸들링
app.use((req, res, next) => {
    next((0, http_errors_1.default)(404));
});
// 에러 핸들러
app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.json('error');
});
/**
 * 서버 설정
 */
const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);
const server = http_1.default.createServer(app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
function normalizePort(val) {
    const port = parseInt(val, 10);
    if (isNaN(port)) {
        return val;
    }
    if (port >= 0) {
        return port;
    }
    return false;
}
function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }
    const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}
function onListening() {
    const addr = server.address();
    const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + (addr === null || addr === void 0 ? void 0 : addr.port);
    debug('Listening on ' + bind);
}
exports.default = app;
