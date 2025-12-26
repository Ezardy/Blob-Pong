export interface ISelectable {
	select():	void;
	deselect():	void;
}

export function	isselectable(obj: any):	obj is ISelectable {
	return obj.select === "function" && obj.deselect === "function";
}
