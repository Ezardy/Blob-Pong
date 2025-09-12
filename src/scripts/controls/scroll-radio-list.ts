import ScrollList3D from "./scroll-list-3d";
import { int, Nullable, Observable, Scene, PointerInfo, EventState, PointerEventTypes } from "@babylonjs/core";
import { AbstractButton3D, Control3D } from "@babylonjs/gui";
import { JSONArray, JSONObject } from "../functions/typing-utils";
import { ISelectable } from "../interfaces/iselectable";

export default class ScrollRaioList3D extends ScrollList3D {
	private	_selectedControl:	Nullable<Control3D> = null;
	private	_indexOnSelection:	int = 0;
	private	_prevIndex:			int = 0;
	private	_controlIndex:		int = 0;

	private readonly	_callbackPost:	(info: PointerInfo, state: EventState) => void;

	public readonly	onSelectObservable:	Observable<Nullable<Control3D>>;

	public get	selectedEntryIndex():	int {
		return this._controlIndex;
	}

	public constructor(isVertical: boolean, pageSize: int, fillerFunc: (entry: JSONObject, control: Control3D) => void, private buttonSelector: (control: Control3D) => AbstractButton3D & ISelectable, scene: Scene) {
		super(isVertical, pageSize, fillerFunc, scene);
		this.onSelectObservable = new Observable<Nullable<Control3D>>();
		this._callbackPost = this._scrollCallbackPost.bind(this);
		scene.onPointerObservable.add(this._callbackPost, PointerEventTypes.POINTERWHEEL);
	}

	public get	selectedControl():	Nullable<Control3D> {
		return this._selectedControl;
	}

	public override	fillList(entries: JSONArray):	void {
		super.fillList(entries);
		for (const child of this.children) {
			const	button:	AbstractButton3D & ISelectable = this.buttonSelector(child);
			button.onPointerUpObservable.add((_, s) => {
				if (this._selectedControl == child) {
					if (this._index == this._indexOnSelection)
						this._selectedControl = null;
					else
						this._indexOnSelection = this._index;
				} else {
					if (this._selectedControl)
						this.buttonSelector(this._selectedControl).deselect();
					this._selectedControl = child;
					this._controlIndex = this._rollControls.indexOf(child) + this._index;
					this._indexOnSelection = this._index;
				}
 				this.onSelectObservable.notifyObservers(this._selectedControl, -1, s.target, this._selectedControl);
			});
		}
	}

	public override get	isVisible():	boolean {
		return this._isVisible;
	}

	public override set	isVisible(value: boolean) {
		if (this._isVisible != value) {
			Object.getOwnPropertyDescriptor(ScrollList3D.prototype, "isVisible")!.set!.call(this, value);
			if (value)
				this.scene.onPointerObservable.add(this._callbackPost, PointerEventTypes.POINTERWHEEL);
			else
				this.scene.onPointerObservable.removeCallback(this._callbackPost);
		}
	}

	private	_scrollCallbackPost(info: PointerInfo, state: EventState): void {
		if (this._selectedControl && this._prevIndex != this._index) {
			const	lastIndex:	int = this._rollControls.length - 1;
			if ((((this._index > this._prevIndex && this.isVertical) || (this._index < this._prevIndex && !this.isVertical)) && this._selectedControl == this._rollControls[0])
				|| (((this._index < this._prevIndex && this.isVertical) || (this._index > this._prevIndex && !this.isVertical)) && this._selectedControl == this._rollControls[lastIndex])) {
				if (this._indexOnSelection == this._index)
					this.buttonSelector(this._selectedControl).select();
				else
					this.buttonSelector(this._selectedControl).deselect();
			}
		}
		this._prevIndex = this._index;
	}
}
