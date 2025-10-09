import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({});
const BUCKET_NAME = process.env.BUCKET_NAME || "";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  // Support both REST and HTTP API event formats
  const method =
    (event.requestContext && event.requestContext.http && event.requestContext.http.method) ||
    ((event as any).httpMethod);

  const path = event.rawPath || (event as any).path;

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
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: "demo.txt",
          Body: body,
          ContentType: "text/plain",
          ContentDisposition: "attachment; filename=\"demo.txt\"",
        })
      );
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ message: "File uploaded to S3!", bucket: BUCKET_NAME }),
      };
    } catch (err) {
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