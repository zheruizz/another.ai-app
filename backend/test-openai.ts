import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import OpenAI from "openai";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

export const handler: APIGatewayProxyHandlerV2 = async () => {
  const startTime = Date.now();
  const result: any = {
    success: false,
    steps: [],
    error: null,
  };

  try {
    // Step 1: Check environment variables
    const secretName = process.env.OPENAI_SECRET_NAME;
    const secretRegion = process.env.OPENAI_REGION;
    const modelName = process.env.MODEL_NAME || "gpt-4o-mini";

    result.steps.push({
      step: "Environment variables",
      secretName,
      secretRegion,
      modelName,
      status: "OK",
    });

    // Step 2: Retrieve API key from Secrets Manager
    let apiKey: string;

    if (secretName && secretRegion) {
      result.steps.push({
        step: "Secrets Manager",
        message: "Attempting to retrieve OpenAI API key from AWS Secrets Manager",
      });

      const sm = new SecretsManagerClient({ region: secretRegion });
      const res = await sm.send(
        new GetSecretValueCommand({ SecretId: secretName })
      );
      const secretString = res.SecretString;

      if (!secretString) {
        throw new Error("Secrets Manager returned empty SecretString");
      }

      const parsed = JSON.parse(secretString);
      if (!parsed.OPENAI_API_KEY) {
        throw new Error("Secret missing OPENAI_API_KEY field");
      }

      apiKey = parsed.OPENAI_API_KEY;
      result.steps.push({
        step: "Secrets Manager",
        status: "OK",
        message: "Successfully retrieved API key from Secrets Manager",
      });
    } else {
      // Fallback to environment variable
      const envKey = process.env.OPENAI_API_KEY;
      if (!envKey) {
        throw new Error(
          "OpenAI API key not found (neither Secrets Manager nor OPENAI_API_KEY env)"
        );
      }
      apiKey = envKey;
      result.steps.push({
        step: "Secrets Manager",
        status: "SKIPPED",
        message: "Using OPENAI_API_KEY from environment variable",
      });
    }

    // Step 3: Initialize OpenAI client
    result.steps.push({
      step: "OpenAI Client",
      message: "Initializing OpenAI client",
    });

    const client = new OpenAI({ apiKey });
    result.steps.push({
      step: "OpenAI Client",
      status: "OK",
      message: "OpenAI client initialized successfully",
    });

    // Step 4: Make a minimal test API call
    result.steps.push({
      step: "OpenAI API Test",
      message: "Making a minimal test completion request",
    });

    const completion = await client.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: "user",
          content: "Reply with just the word 'OK' if you can read this.",
        },
      ],
      max_tokens: 10,
      temperature: 0,
    });

    const testResponse = completion.choices?.[0]?.message?.content || "";

    result.steps.push({
      step: "OpenAI API Test",
      status: "OK",
      message: "Successfully received response from OpenAI API",
      testResponse,
      model: completion.model,
      usage: completion.usage,
    });

    // Success!
    result.success = true;
    result.message = "All OpenAI connectivity tests passed";
    result.totalTimeMs = Date.now() - startTime;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result, null, 2),
    };
  } catch (err: any) {
    result.error = {
      message: err.message || String(err),
      stack: err.stack,
    };
    result.totalTimeMs = Date.now() - startTime;

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result, null, 2),
    };
  }
};
