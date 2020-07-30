const symbol = Symbol(2)

const test = {
	one: '1',
	[symbol]: '2',
}

console.log(...Object.values(test))
console.log(test?.one ?? test.one)
