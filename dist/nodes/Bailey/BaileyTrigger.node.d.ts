declare class BaileyTrigger {
    constructor();
    trigger(): Promise<{
        closeFunction: () => Promise<void>;
        manualTriggerFunction: () => Promise<void>;
    }>;
}
export { BaileyTrigger };
