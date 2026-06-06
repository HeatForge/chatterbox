export enum Sender {
    USER = "user",
    ASSISTANT = "assistant",
}

interface ChatBubbleProps {
    message: string;
    sender: "user" | "assistant" | "system";
}

export default function ChatBubble({ message, sender }: ChatBubbleProps) {


    const backgroundColor = sender === Sender.USER ? "#C5CBD3" : "#2F343C";
    const textColor = sender === Sender.USER ? "#000000" : "#FFFFFF";
    return (
        <div style={{ borderRadius: 10, margin: 10, padding : 10, backgroundColor, color : textColor, alignItems : "left", lineHeight : "0.5", minWidth : "15rem" }}>
            <h4>{sender.charAt(0).toUpperCase() + sender.slice(1)}</h4>
            <p>{message}</p>
        </div>
    )
}
