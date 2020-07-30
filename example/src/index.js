const symbol = new Symbol(2)

const test = {
	1: 'one',
	[symbol]: 'two',
}

console.log(...test)
console.log(test?.1 ?? true)