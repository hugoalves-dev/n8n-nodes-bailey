export interface PairingCodeUpdate {
    qr?: string;
    connection?: string;
}
interface PairingCodeHandlerOptions {
    requestCode: () => Promise<string>;
    onCode: (code: string) => void;
    onError: (message: string) => void;
    state?: {
        requested: boolean;
    };
}
export declare function createPairingCodeHandler({ requestCode, onCode, onError, state }: PairingCodeHandlerOptions): (update: PairingCodeUpdate, registered: boolean) => void;
export {};
