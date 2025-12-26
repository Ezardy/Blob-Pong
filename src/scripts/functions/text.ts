import { ICanvasRenderingContext } from "@babylonjs/core";
import { InputText, InputTextArea, TextBlock } from "@babylonjs/gui";

export function	fitTextIntoControl(control: InputText | InputTextArea | TextBlock, context: ICanvasRenderingContext, minSize: number, maxSize: number) {
	let	maxWidth:	number;
	let	maxHeight:	number;
	if (control instanceof TextBlock) {
		maxWidth = control.widthInPixels;
		maxHeight = control.heightInPixels;
	} else {
		maxWidth = control.maxWidthInPixels - 2 * control.marginInPixels;
		if (control instanceof InputTextArea)
			maxHeight = control.maxHeightInPixels;
		else
			maxHeight = control.heightInPixels;
	}
	context.font = `${control.fontSizeInPixels}px ${control.fontFamily}`;
	let	size:	number = Number.parseInt(control.fontSize as string);
	let	width:	number = context.measureText(control.text).width;
	let	step:	number;
	if (width > maxWidth) {
		maxSize = size;
		step = -1;
	} else {
		minSize = size;
		step = 1;
	}
	step *= Math.max(Math.ceil((maxSize - minSize) / 2), 1);
	while (maxSize > 1 + minSize) {
		size = Math.min(Math.max(size + step, minSize), maxSize);
		context.font = `${size / 100 * maxHeight}px ${control.fontFamily}`;
		width = context.measureText(control.text).width;
		if (width > maxWidth) {
			maxSize = size;
			if (step > 0)
				step = -Math.ceil(step / 2);
		} else {
			minSize = size;
			if (step < 0)
				step = -Math.floor(step / 2);
		}
	}
	if (maxSize - minSize < 2)
		control.fontSize = `${minSize}%`;
	else
		control.fontSize = `${size}%`;
}