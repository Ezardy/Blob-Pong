import { Scene } from "@babylonjs/core";
import { ServerGame } from "./web-api/server-game";
import { IScript } from "babylonjs-editor-tools";

export default class WebApi implements IScript {
	public readonly	serverGame:	ServerGame;

	public constructor(public scene: Scene) {
		this.serverGame = new ServerGame();
	}

	public	onStart():	void {
		this.serverGame.open();
	}
}
