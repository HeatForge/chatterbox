import { generateText, streamText, type ModelMessage } from "ai";
import { createOpenAICompatible, OpenAICompatibleChatLanguageModel } from "@ai-sdk/openai-compatible";
import { env } from "~/env";

const provider = createOpenAICompatible({
    name: "openrouter",
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: env.OPENROUTER_API_KEY,
})

export const model = provider("google/gemma-4-26b-a4b-it")

export const getResponse = () => {
    const result = generateText({
        model: model,
        messages: [
            {
                role: "system",
                content: "You are a helpful assistant."
            },
            {
                role: "user",
                content: "Tell me a random fact?"
            }
        ]
    });

    return result;
}