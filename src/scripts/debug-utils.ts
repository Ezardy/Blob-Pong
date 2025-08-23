import { Color3, LinesMesh, MeshBuilder, Scene, Vector3 } from "@babylonjs/core";

export function	drawBoundingBox(name: string, scene: Scene, color: Color3, min: Vector3, max: Vector3): LinesMesh {
	const	aXiYiZ:	Vector3 = new Vector3(max.x, min.y, min.z);
	const	aXaYiZ:	Vector3 = new Vector3(max.x, max.y, min.z);
	const	iXaYiZ:	Vector3 = new Vector3(min.x, max.y, min.z);
	const	iXiYaZ:	Vector3 = new Vector3(min.x, min.y, max.z);
	const	iXaYaZ:	Vector3 = new Vector3(min.x, max.y, max.z);
	const	line:	LinesMesh = MeshBuilder.CreateLines(name + " bounding box", {points: [
		min,
		aXiYiZ,
		aXaYiZ,
		iXaYiZ,
		min,
		iXiYaZ,
		iXaYaZ,
		iXaYiZ,
		iXaYaZ,
		max,
		aXaYiZ,
		aXiYiZ,
		new Vector3(max.x, min.y, max.z),
		iXiYaZ
	]}, scene);
	line.color = color;
	return line;
}