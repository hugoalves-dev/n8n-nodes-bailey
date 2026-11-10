"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPairingCodeHandler = createPairingCodeHandler;
function createPairingCodeHandler({ requestCode, onCode, onError, state }) {
    const requestState = state ?? { requested: false };
    return (update, registered) => {
        if (registered || requestState.requested || !update.qr)
            return;
        requestState.requested = true;
        void requestCode().then(onCode).catch(() => {
            onError('WhatsApp could not create a pairing code. Wait a moment and try again.');
        });
    };
}
//# sourceMappingURL=PairingCoordinator.js.map