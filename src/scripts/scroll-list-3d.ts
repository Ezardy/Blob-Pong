import { EventState, int, PointerEventTypes, PointerInfo, Scene, Vector3 } from "@babylonjs/core";
import { AdvancedStackPanel3D } from "./advanced-stack-panel-3d";
import { Control3D } from "@babylonjs/gui";

export default class ScrollList3D extends AdvancedStackPanel3D {
	private	_firstPos:		number = 0;
	private	_lastPos:		number = 0;
	private	_extendSize:	Vector3 = Vector3.Zero();

	private readonly	_pageSize:	int;

	constructor(control: Control3D, isVertical: boolean, pageSize: int) {
		super(isVertical);
		this._pageSize = pageSize;
		this.node?.getScene().onPointerObservable.add(this._scrollCallback);
	}

	public	fillList(entries: {}[]):	void {
		
	}

	public override set	isVisible(value: boolean) {
		Object.getOwnPropertyDescriptor(AdvancedStackPanel3D.prototype, "isVisible")!.set!.call(this, value);
		if (value)
			this.node?.getScene().onPointerObservable.add(this._scrollCallback);
		else
			this.node?.getScene().onPointerObservable.removeCallback(this._scrollCallback);
	}

	private	_scrollCallback(info: PointerInfo, state: EventState) {
		if (info.type == PointerEventTypes.POINTERWHEEL) {
		}
	}

	protected override	_arrangeChildren() {
		super._arrangeChildren();

	}
}
