import type { WASocket } from '@whiskeysockets/baileys';
import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
export declare function executeNewsletterOperation(this: IExecuteFunctions, sock: WASocket, operation: string, i: number): Promise<INodeExecutionData>;
