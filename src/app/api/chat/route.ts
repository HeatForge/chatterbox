import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { getSession } from "better-auth/api";
import { model } from "~/server/ai/completions";
import { auth } from "~/server/better-auth";


export const STREAM_RESPONSE_MAX_DURATION = 30;

export async function POST(request: Request) {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { messages }: { messages: UIMessage[] } = await request.json(); // So this apparently exctracts the messages array from the whole request body object

    const result = streamText({
        model: model,
        system: "You are a helpful assistant.",
        messages: await convertToModelMessages(messages)
    });

    return result.toUIMessageStreamResponse();
}