import ScrollList3D from "./scroll-list-3d";
import { int, Nullable, Observable } from "@babylonjs/core";
import { AbstractButton3D, Control3D } from "@babylonjs/gui";
import { JSONArray, JSONObject } from "../functions/typing-utils";
import { ISelectable } from "../interfaces/iselectable";

export default class ScrollRaioList3D extends ScrollList3D {
	private	_selectedControl:	Nullable<Control3D> = null;

	public readonly	onSelectObservable:	Observable<Nullable<Control3D>>;

	public constructor(isVertical: boolean, pageSize: int, fillerFunc: (entry: JSONObject, control: Control3D) => void, private buttonSelector: (control: Control3D) => AbstractButton3D & ISelectable) {
		super(isVertical, pageSize, fillerFunc);
		this.onSelectObservable = new Observable<Nullable<Control3D>>();
	}

	public get	selectedControl():	Nullable<Control3D> {
		return this._selectedControl;
	}

	public override	fillList(entries: JSONArray):	void {
		super.fillList(entries);
		for (const child of this.children) {
			const	button:	AbstractButton3D & ISelectable = this.buttonSelector(child);
			button.onPointerClickObservable.add((_, s) => {
				if (this._selectedControl)
					this.buttonSelector(child).deselect();
				if (this._selectedControl == child)
					this._selectedControl = null;
				else {
					this._selectedControl = child;
					this.buttonSelector(child).select();
				}
 				this.onSelectObservable.notifyObservers(this._selectedControl, -1, s.target, this._selectedControl);
			});
		}
	}
}
