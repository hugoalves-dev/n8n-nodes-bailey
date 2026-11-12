import type { INodeProperties } from 'n8n-workflow';
export const recoveryFields: INodeProperties[] = [
 { displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true, displayOptions: { show: { resource: ['recovery'] } }, default: 'acknowledge', options: [
  { name: 'Acknowledge Message', value: 'acknowledge', action: 'Acknowledge a processed message' },
  { name: 'Get Cursors', value: 'cursors', action: 'Get known conversation cursors' },
  { name: 'Get Pending Messages', value: 'pending', action: 'Get pending messages' },
 ] },
 { displayName: 'Trigger ID', name: 'triggerId', type: 'string', required: true, default: '', displayOptions: { show: { resource: ['recovery'] } }, description: 'ID of the Bailey Trigger that recorded the messages; available in _recovery.triggerId' },
 { displayName: 'Message Key', name: 'recoveryKey', type: 'json', required: true, default: '{}', displayOptions: { show: { resource: ['recovery'], operation: ['acknowledge'] } }, description: 'Message key to acknowledge only after successful processing' },
];
