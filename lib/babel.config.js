module.exports = {
	"sourceMaps": true,
	"plugins": [],
	"presets": [
		[
			"@babel/preset-env",
			{
				"useBuiltIns": "usage",
				"corejs": 3,
			},
		],
		[ "@babel/preset-typescript" ],
        [ "@babel/preset-react" ],
	],
};
