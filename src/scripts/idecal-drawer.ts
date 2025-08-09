export interface IDecalDrawer {
	draw():	void;
}

export function	isDecalDrawer(obj: any):	obj is IDecalDrawer {
	return (obj as IDecalDrawer).draw !== undefined;
}
