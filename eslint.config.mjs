import tseslint from 'typescript-eslint';
import n8nPlugin from 'eslint-plugin-n8n-nodes-base';

export default [
	...tseslint.configs.recommended,
	{
		files: ['nodes/**/*.ts', 'credentials/**/*.ts'],
		plugins: { 'n8n-nodes-base': n8nPlugin },
		rules: {
			...n8nPlugin.configs.nodes.rules,
			...n8nPlugin.configs.community.rules,
			'@typescript-eslint/ban-ts-comment': 'off',
			'@typescript-eslint/no-require-imports': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-expressions': 'off',
			'@typescript-eslint/no-unused-vars': 'off',
			'no-var': 'off',
			'n8n-nodes-base/node-class-description-inputs-wrong-regular-node': 'off',
			'n8n-nodes-base/node-class-description-outputs-wrong': 'off',
		},
	},
	{
		ignores: ['dist/**', 'upstream/**', 'node_modules/**'],
	},
];
