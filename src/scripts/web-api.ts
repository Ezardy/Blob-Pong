import { Scene } from "@babylonjs/core";
import { ServerGame } from "./web-api/server-game";

export default class WebApi {
	public readonly	serverGame:	ServerGame;

	public constructor(public scene: Scene) {
		this.serverGame = new ServerGame();
	}
}
