"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const db_1 = __importDefault(require("./utils/db"));
const handler = async () => {
    try {
        const result = await db_1.default.query("SELECT * FROM projects;");
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, result: result.rows }),
        };
    }
    catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: String(err) }),
        };
    }
};
exports.handler = handler;
