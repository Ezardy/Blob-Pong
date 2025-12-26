import { Observable, Scene } from "@babylonjs/core";
import { ServerGame } from "./web-api/server-game";
import { IScript } from "babylonjs-editor-tools";
import { getCurrentUser, UserInfo } from "./web-api/server-login";

export default class WebApi implements IScript {
	public readonly	serverGame:	ServerGame;
	public readonly	onServerGameReady:	Observable<void>;

	private	_clientInfo?:	UserInfo;

	public get	clientInfo():	UserInfo | undefined {
		return this._clientInfo;
	}

	public constructor(public scene: Scene) {
		this.serverGame = new ServerGame();
		this.onServerGameReady = new Observable<void>();
	}

	public	onStart():	void {
		this.serverGame.onWebSocketOpenedObservable.add(() => {
			getCurrentUser().then((info) => {
				if (info) {
					this._clientInfo = info;
					this.onServerGameReady.notifyObservers();
				}
			});
		});
		this.serverGame.open();
	}
}
