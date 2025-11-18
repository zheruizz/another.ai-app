"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3 = new client_s3_1.S3Client({});
const BUCKET_NAME = process.env.BUCKET_NAME || "";
const handler = async (event) => {
    // Support both REST and HTTP API event formats
    const method = (event.requestContext && event.requestContext.http && event.requestContext.http.method) ||
        (event.httpMethod);
    const path = event.rawPath || event.path;
    // /hello endpoint: GET
    if (method === "GET" && path && path.endsWith("/hello")) {
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ message: "Hello from backend!" }),
        };
    }
    // /upload endpoint: POST
    if (method === "POST" && path && path.endsWith("/upload")) {
        try {
            const body = event.body || "Demo file content";
            await s3.send(new client_s3_1.PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: "demo.txt",
                Body: body,
                ContentType: "text/plain",
                ContentDisposition: "attachment; filename=\"demo.txt\"",
            }));
            return {
                statusCode: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                body: JSON.stringify({ message: "File uploaded to S3!", bucket: BUCKET_NAME }),
            };
        }
        catch (err) {
            return {
                statusCode: 500,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                body: JSON.stringify({ message: "S3 upload failed!", error: String(err) }),
            };
        }
    }
    return {
        statusCode: 404,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ message: "Not found" }),
    };
};
exports.handler = handler;
