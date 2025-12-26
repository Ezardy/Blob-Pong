export interface IDisablable {
	get	isEnabled():	boolean;
	set	isEnabled(value: boolean);
}

export function	isdisablable(obj: any):	obj is IDisablable {
	let	result:	boolean = false;

	if (obj != null) {
		let proto = obj;
		while (proto && !result) {
			const desc = Object.getOwnPropertyDescriptor(proto, "isEnabled");
			if (desc)
				result = typeof desc.get === "function" && typeof desc.set === "function";
			proto = Object.getPrototypeOf(proto);
		}
	}
	return result;
}
