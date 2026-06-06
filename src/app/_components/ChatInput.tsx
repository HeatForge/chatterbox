import { useState } from "react";

interface ChatInputProps {
    onSubmit: (message: string) => void;
    onChange: (message: string) => void;
    content: string;
}

export default function ChatInput({onSubmit, onChange, content} : ChatInputProps) {


    return (
        <div style={{ display : "flex", width  : "25rem", height : "2.5rem"}}>
            <textarea style={{ resize : "none", width : "100%", height : "100%" }} value={content} onChange={(event) => onChange(event.target.value)} />
            <button onClick={() => onSubmit(content)}>Send</button>
        </div>
    )
}