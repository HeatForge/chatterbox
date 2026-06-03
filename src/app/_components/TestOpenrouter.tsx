"use client";
import type { TextPart } from "ai";
import { useState } from "react";
import { api } from "~/trpc/react";

export default function TestOpenrouter() {
    const [response, setResponse] = useState("");

    const testOpenrouter = api.ai.testOpenrouter.useQuery(undefined, {
        enabled: false,
    });
    return (
        <div>
            <p style={{ color: "white", fontWeight : "bold" }}>{response}</p>
            <button onClick={() => {
                testOpenrouter.refetch().then((res) => {
                    const reply : TextPart = res.data?.steps[res.data?.steps.length - 1]?.response.messages[0]?.content[0] as TextPart ?? {};
                    console.log("Recieved response from Openrouter: ", JSON.stringify(reply));
                    setResponse(reply.text);
                });
            }}>Test Openrouter</button>  
        </div>
    )
}