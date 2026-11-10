export { executeChatOperation };
declare function executeChatOperation(sock: any, operation: any, i: any): Promise<{
    json: {
        success: boolean;
        jid: any;
        action: string;
        duration?: undefined;
    };
} | {
    json: {
        success: boolean;
        jid: any;
        action: string;
        duration: any;
    };
}>;
