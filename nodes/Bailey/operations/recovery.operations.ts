import { NodeOperationError } from 'n8n-workflow';
import { RecoveryStore } from '../transport/RecoveryStore';

export async function executeRecoveryOperation(this: any, store: RecoveryStore, operation: string, index: number) {
 if (operation === 'acknowledge') {
  const value = this.getNodeParameter('recoveryKey', index);
  let key: any;
  try { key = typeof value === 'string' ? JSON.parse(value) : value; }
  catch { throw new NodeOperationError(this.getNode(), 'Recovery message key must be valid JSON.', { itemIndex: index }); }
  await store.acknowledge(key);
  return { json: { acknowledged: true } };
 }
 if (operation === 'pending') return { json: { messages: await store.pending() } };
 if (operation === 'cursors') return { json: { cursors: await store.cursors() } };
 throw new NodeOperationError(this.getNode(), `Unknown recovery operation: ${operation}`, { itemIndex: index });
}
