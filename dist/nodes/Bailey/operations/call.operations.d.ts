export { executeCallOperation };
declare function executeCallOperation(sock: any, operation: any, i: any): Promise<{
    json: {
        success: boolean;
        callId: any;
        callFrom: any;
        link?: undefined;
    };
} | {
    json: {
        link: any;
        success?: undefined;
        callId?: undefined;
        callFrom?: undefined;
    };
}>;
