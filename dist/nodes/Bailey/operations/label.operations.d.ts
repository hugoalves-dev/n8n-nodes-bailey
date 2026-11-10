export { executeLabelOperation };
declare function executeLabelOperation(sock: any, operation: any, i: any): Promise<{
    json: {
        success: boolean;
        jid: any;
        labelId?: undefined;
        messageId?: undefined;
    };
} | {
    json: {
        success: boolean;
        jid: any;
        labelId: any;
        messageId?: undefined;
    };
} | {
    json: {
        success: boolean;
        jid: any;
        messageId: any;
        labelId: any;
    };
}>;
