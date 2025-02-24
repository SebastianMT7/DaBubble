import { Message } from "./message.model";
import { User } from "./user.model";

export class Channel {   
    chaId:string;
    title: string;
    creatorId:string;
    description: string;
    users: User[];
    messages: Message[];
    comments: string[];
    reactions: string[];

    constructor(obj?: any) {    
        this.chaId = obj?.chaId ?? ''; 
        this.title = obj ? obj.title : "";
        this.creatorId = obj ? obj.creatorId : "";
        this.description = obj ? obj.description : "";
        this.users = obj ? obj.users : [];
        this.messages = obj?.messages ?? [];
        this.comments = obj?.comments ?? [];
        this.reactions = obj?.reactions ?? [];
    }

    public getJSON() {
        return {
            chaId: this.chaId,
            title: this.title,
            creatorId: this.creatorId,
            description: this.description,
            users: this.users,
            messages: this.messages,
            comments: this.comments,
            reactions: this.reactions     
        };
    }

}