module.exports = {
	"sourceMaps": true,
	"presets": [
		[
			"@babel/preset-env",
			{
				"useBuiltIns": "usage",
				"corejs": 3,
			},
		],
		[
			"@babel/preset-typescript",
			{
				"onlyRemoveTypeImports": true,
			}
		],
        [ "@babel/preset-react" ],
	],
	"plugins": [
		"@babel/plugin-proposal-class-properties",
	],
};
