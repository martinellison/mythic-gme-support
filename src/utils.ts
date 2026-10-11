
/** this checks whether a value exists and throws an error otherwise. */
export function assertDefined<T>(value: T | undefined | null, narr?: string): asserts value is T {
	if (value === undefined || value == null) {
		const msg = `Value is undefined or null${narr === undefined ? '' : ' (' + narr + ')'}`;
		console.warn(msg);
		throw new Error(msg);
	}
}
/** displays a trace message if required */
export function mTrace(narr: string, ...vals: string[]): void {
	// // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- only use here
	// console.log("mythic", `${narr}: `, ...vals);
}
/** shorten a string. */
export function shorten(s: string): string {
	const SHORTlENGTH = 60;
	return s.length < SHORTlENGTH ? s : s.substring(0, SHORTlENGTH) + "...";
}

/** This returns a random integer 1 to `n` */
export function mythicDice(n: number): number { return Math.floor(Math.random() * n) + 1; }
