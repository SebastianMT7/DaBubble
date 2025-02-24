import { Thread } from "./thread.model";

export class Message {
    msgId: string;
    timeStamp: number;
    senderId: string | unknown;
    text: string;
    thread: string;
    reactions: Reaction[];
    parent: Message | null

    constructor(obj?: Partial<Message>) {
        this.msgId = obj?.msgId ?? '';
        this.timeStamp = obj?.timeStamp ?? 0;
        this.senderId = obj?.senderId ?? '';
        this.text = obj?.text ?? '';
        this.thread = obj?.thread ?? '';
        this.reactions = obj?.reactions ?? [];
        this.parent = obj?.parent ?? null
    }
}
export class Reaction {
    counter: number;
    id: string;    
    reactedUser: {[key: string]: boolean};

    constructor(obj?: Partial<Reaction>) {
        this.counter = obj?.counter ?? 0;
        this.id = obj?.id ?? '';
        this.reactedUser = obj?.reactedUser ?? {};
    }
}
