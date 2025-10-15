import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import db from "./utils/db";

export const handler: APIGatewayProxyHandlerV2 = async () => {
  try {
    const result = await db.query("SELECT 1 as test;");
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, result: result.rows }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: String(err) }),
    };
  }
};