export interface IRenderOnStart {
	get	isRendered():		boolean;
	get	renderOnStart():	boolean;
	set	isRendered(value: boolean);
	set	renderOnStart(value: boolean);
	render():			void;
}

export function	isrenderedonstart(obj: any):	obj is IRenderOnStart {
	let	isRenderedExists:	boolean = false;
	let	renderOnStartExists:	boolean = false;
	if (obj != null) {
		let	proto = obj;
		while (proto && !isRenderedExists) {
			const	desc = Object.getOwnPropertyDescriptor(proto, "isRendered");
			if (desc)
				isRenderedExists = typeof desc.get === "function" && typeof desc.set === "function";
			proto = Object.getPrototypeOf(proto);
		}
		proto = obj;
		while (proto && !renderOnStartExists) {
			const	desc = Object.getOwnPropertyDescriptor(proto, "renderOnStart");
			if (desc)
				renderOnStartExists = typeof desc.get === "function" && typeof desc.set === "function";
			proto = Object.getPrototypeOf(proto);
		}
	}
	return isRenderedExists && renderOnStartExists && obj.render === "function";
}
