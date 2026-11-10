export { executeMediaOperation };
declare function executeMediaOperation(sock: any, operation: any, i: any): Promise<{
    json: {
        fileName: any;
        mimeType: any;
    };
    binary: {
        [x: number]: any;
    };
} | {
    json: any;
    binary?: undefined;
}>;
