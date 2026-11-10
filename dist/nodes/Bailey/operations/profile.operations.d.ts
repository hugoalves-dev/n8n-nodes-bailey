export { executeProfileOperation };
declare function executeProfileOperation(sock: any, operation: any, i: any): Promise<{
    json: {
        success: boolean;
        status: any;
        name?: undefined;
        duration?: undefined;
    };
} | {
    json: {
        success: boolean;
        name: any;
        status?: undefined;
        duration?: undefined;
    };
} | {
    json: {
        success: boolean;
        status?: undefined;
        name?: undefined;
        duration?: undefined;
    };
} | {
    json: {
        success: boolean;
        duration: any;
        status?: undefined;
        name?: undefined;
    };
}>;
