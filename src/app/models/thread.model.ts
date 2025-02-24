import { Message } from "./message.model";

export class Thread {
    id: string;
    convId: string;
    rootMessage: string;
    messages: Message[];
    type: 'channel' | 'chat' | null;

    constructor(obj?: Partial<Thread>){
        this.id = obj?.id ?? '';
        this.rootMessage = obj?.rootMessage ?? '';
        this.messages = obj?.messages ?? [];
        this.type = obj?.type ?? null
        this.convId = obj?.convId ?? ''
    }
}