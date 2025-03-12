"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.specs = exports.swaggerUi = void 0;
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
exports.swaggerUi = swagger_ui_express_1.default;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "InnerEcho Api",
            description: "InnerEcho Web App RESTful API Documentation",
            contact: {
                name: "InnerEcho",
                email: "dyddyd134@chungbuk.ac.kr",
                // url: "",
            },
            version: "1.0.0",
        },
        servers: [
            {
                url: "http://localhost:3001/",
                description: "Local Development",
            },
            {
                url: "http://test.co.kr/",
                description: "Test Server",
            },
            {
                url: "http://real.co.kr/",
                description: "Real Server",
            },
        ],
    },
    apis: ["./src/routes/*.ts", "./swagger/*"],
};
const specs = (0, swagger_jsdoc_1.default)(options);
exports.specs = specs;
