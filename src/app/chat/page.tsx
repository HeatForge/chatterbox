"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useChat } from "@ai-sdk/react";
import { Sender } from "../_components/ChatBubble";
import ChatInput from "../_components/ChatInput";
import ChatBubble from "../_components/ChatBubble";
import { DefaultChatTransport } from "ai";

export default function Chat() {

    const [input, setInput] = useState<string>("");

    const { messages, sendMessage, status } = useChat({
        transport: new DefaultChatTransport({ api: "/api/chat" }),
    });

    const handleSubmit = (message: string) => {
        if (!message.trim() || status !== "ready") return;
        sendMessage({ text: message });
        setInput("");
    }

    return (
        <main style={{ alignItems : "center", display : "flex", flexDirection : "column", height : "100%", width : "100%" }}>
            <h1>Welcome to the chat</h1>
            <div style={{ alignItems : "center", display: "flex", flexDirection: "column", gap: "10px", height : "100%", width : "100%", minHeight : "0" }}>
                <div style = {{ flexGrow : 1, overflow : "auto"}}>
                    {messages.map((msg, index) => {

                        if (msg.role === "system") return;

                        const text = msg.parts
                            .filter((part) => part.type === "text")
                            .map((part) => part.text)
                            .join("");

                        return (<ChatBubble key={index} sender={msg.role} message={text} />)
                    })}
                </div>
                <div style={{ marginBottom : "2.5rem"}}>
                    <ChatInput content={input} onChange={(message) => setInput(message)} onSubmit={(message) => {
                        handleSubmit(message);
                        setInput("")
                    }} />
                </div>
            </div>
        </main>
    )
}