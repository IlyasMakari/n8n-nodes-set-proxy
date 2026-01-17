/* eslint-disable @n8n/community-nodes/no-restricted-globals */
/* eslint-disable @n8n/community-nodes/no-restricted-imports */

import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { ProxyAgent, setGlobalDispatcher } from 'undici';
import 'global-agent/bootstrap';

export class SetProxy implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Set Proxy',
		name: 'setProxy',
		icon: { light: 'file:example.svg', dark: 'file:example.dark.svg' },
		group: ['input'],
		version: 1,
		description: 'Sets a proxy for HTTP requests',
		defaults: {
			name: 'Set Proxy',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		properties: [
			{
				displayName: 'Proxy URL',
				name: 'proxyUrl',
				type: 'string',
				default: '',
				placeholder: 'http://proxyserver:port',
				description: 'The URL of the proxy server',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		let item: INodeExecutionData;
		let proxyUrl: string;

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				proxyUrl = this.getNodeParameter('proxyUrl', itemIndex, '') as string;
				item = items[itemIndex];

				global.GLOBAL_AGENT.HTTP_PROXY = proxyUrl;
				const proxyAgent = new ProxyAgent(proxyUrl);
				setGlobalDispatcher(proxyAgent);

				item.json.proxyUrl = proxyUrl;
			} catch (error) {

				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
				} else {
					// Adding `itemIndex` allows other workflows to handle this error
					if (error.context) {
						// If the error thrown already contains the context property,
						// only append the itemIndex
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return [items];
	}
}
