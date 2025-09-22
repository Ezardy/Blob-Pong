import { int, Observable } from "@babylonjs/core";

type RoomState = "waiting" | "ready";

type LobbyConnect =
{
	rooms:			FullRoomInfo[];
	currentRoomId:	string
}

type CreateRoom =
{
	room:		RoomInfo;
	success:	boolean;
	isCreator:	boolean;
}

type JoinRoom = CreateRoom;

type LeaveRoom = 
{
	success:	boolean;
	room:		RoomInfo;
}

type StartGame =
{
	success:	boolean;
	message:	string;
}

type GameInit =
{
	type:	string;
	roomId:	string;
}

type GameState =
{
	state:				"countdown" | "finished" | "playing";
	players:			GamePlayer[];
	ballPosition:		[number, number];
	countdownSeconds:	number | undefined;
}

type GamePlayer =
{
	id:				string;
	username:		string;
	position:		number;
	isActive:		boolean;
}

type GameResult =
{
	gameResult:
	{
		players:	Array<
		{
			id:				string;
			score:			number
			place:			string;
			username:		string;
			isActive:		boolean;
			playersKicked:	number;
		}>;
		fee:		number
		state:		'finished' | 'aborted';
	}
}

type RoomStateChanged =
{
	roomStateChanged:
	{
		roomId:		string;
		newState:	string;
		room:		RoomInfo;
	}
}

type RoomPlayer =
{
	id:			string;
	username:	string;
};

interface RoomInfo
{
	id:			string;
	name:		string;
	state:		RoomState;
	players:	Set<RoomPlayer>;
	entryFee:	number;
	createdAt:	Date;
	maxPlayers:	number;
}

interface FullRoomInfo extends RoomInfo
{
	createdBy:			string;
	isCreator:			boolean;
	isCurrentRoom:		boolean;
	creatorUsername:	string;
}

export class ServerGame
{
	private _rooms?:					FullRoomInfo[];
	private _gameWs?:					WebSocket;
	private _lobbyWs?:					WebSocket;
	private _gameState?:				GameState;
	private _sessionId?:				string;
	private _currentRoomId?:			string;
	public onRoomsUpdatedObservable:	Observable<FullRoomInfo[]>;

	constructor()
	{
		this.onRoomsUpdatedObservable = new Observable<FullRoomInfo[]>();
		this.handleClientEvent();
		this.requestSessionIdFromParent();
	}

	public lobbyWs() : void
	{
		this._lobbyWs = new WebSocket(`${/**process.env.SERVER_WS_URL ?? **/"ws://localhost:4000/ws"}/lobby?userId=${this._sessionId}`);

		this._lobbyWs.onopen = () =>
		{
			console.log("Connected to Lobby WebSocket ");
		};

		this._lobbyWs.onmessage = (event: MessageEvent) =>
		{
			try
			{
				const data: LobbyConnect = JSON.parse(event.data);
				this._currentRoomId = data.currentRoomId;
				this._rooms = data.rooms;

				this.onRoomsUpdatedObservable.notifyObservers(this._rooms);
			}
			catch (error)
			{
				console.error('Error parsing lobby message:', error);
			}
		};

		this._lobbyWs.onclose = () =>
		{
			console.log("Disconnected Lobby WebSocket");
		};

		this._lobbyWs.onerror = (error) =>
		{
			console.log("Lobby WebSocket error: ", error);
		};
	}

	public createRoomWs(
		name: string,
		entryFee: int,
		maxPlayers: int,
	)
	{
		const ws = new WebSocket(`${/**process.env.SERVER_WS_URL ?? **/"ws://localhost:4000/ws"}/room/create?userId=${this._sessionId}`);

		ws.onopen = () =>
		{
			console.log("Connected to CreateRoom WebSocket");
			ws.send(JSON.stringify({ maxPlayers, entryFee, name }));
		};

		ws.onmessage = (event: MessageEvent) =>
		{
			console.log(event.data);
			const data : CreateRoom = event.data;
	
			if (data.success)
			{
				this._currentRoomId = data.room.id;
				// data.isCreator
			}
			// TODO: connect to a Game WebSocket

			// this.refreshRooms();
			ws.close();
		};

		ws.onclose = () =>
		{};
	}

	public leaveRoomWs() : void
	{
		const ws = new WebSocket(`${/**process.env.SERVER_WS_URL ?? **/"ws://localhost:4000/ws"}/room/leave?userId=${this._sessionId}`)

		ws.onopen = () =>
		{
			ws.send(JSON.stringify({ roomId: this._currentRoomId }));
			this._currentRoomId = undefined;
		};

		ws.onmessage = (event) =>
		{
			const data: LeaveRoom = JSON.parse(event.data);

			if (data.success)
			{
				this._currentRoomId = undefined;

				if (this._gameWs)
				{
					this._gameWs.close();
					this._gameWs = undefined;
				}
			}

			ws.close();
		};

	}

	public joinRoomWs(roomId: string) : void
	{
		const ws = new WebSocket(`${/**process.env.SERVER_WS_URL ?? **/"ws://localhost:4000/ws"}/room/join?userId=${this._sessionId}`);

		ws.onopen = () =>
		{
			console.log("Connected to JoinRoom WebSocket");
			ws.send(JSON.stringify({ roomId }));
		};

		ws.onmessage = (event: MessageEvent) =>
		{
			const data : JoinRoom = event.data;

			if (data.success)
			{
				console.log("see im here");
				this._currentRoomId = data.room.id;
				// data.isCreator
			}

			// TODO: connect to a Game WebSocket

			this.refreshRooms();
			ws.close();
		};

		ws.onclose = () =>
		{};
	}

	public markRoomWaitingWs() : void
	{
		const ws = new WebSocket(`${/**process.env.SERVER_WS_URL ?? **/"ws://localhost:4000/ws"}/room/markWaiting?userId=${this._sessionId}`);
		
		ws.onopen = () =>
		{
			ws.send('mark room as waiting');
		};

		ws.onmessage = (event) =>
		{
			const data: RoomStateChanged = JSON.parse(event.data);
			if (data.roomStateChanged)
				console.log();
			else
				console.log();
			ws.close();
		};

		ws.onclose = () =>
		{};
	}

	public markRoomReadyWs() : void
	{
		const ws = new WebSocket(`${/**process.env.SERVER_WS_URL ?? **/"ws://localhost:4000/ws"}/room/markReady?userId=${this._sessionId}`);
		
		ws.onopen = () =>
		{
			ws.send('mark room as waiting');
		};

		ws.onmessage = (event) =>
		{
			const data: RoomStateChanged = JSON.parse(event.data);
			if (data.roomStateChanged)
			{
				console.log();
				this.refreshRooms();
			}
			else
				console.log();
			ws.close();
		};

		ws.onclose = () =>
		{};
	}

	public startGameWs() : void
	{
		const ws = new WebSocket(`${/**process.env.SERVER_WS_URL ?? **/"ws://localhost:4000/ws"}/game/${this._currentRoomId}/start?userId=${this._sessionId}`);

		ws.onopen = () =>
		{
			ws.send('START GAME');
		};

		ws.onmessage = (event) =>
		{
			const data : StartGame = JSON.parse(event.data);
			if (data.success)
				console.log(data.message);
			else
				console.log("Failed to start the game");
			ws.close();
		};

		ws.onclose = () =>
		{};
	}

	public gameWs() : void
	{
		this._gameWs = new WebSocket(`${/**process.env.SERVER_WS_URL ?? **/"ws://localhost:4000/ws"}/game/${this._currentRoomId}?userId=${this._sessionId}`);

		this._gameWs.onopen = () =>
		{
			console.log("Connected to Game WebSocket");
		};

		this._gameWs.onmessage = (event: MessageEvent) =>
		{
			const data : GameState | GameResult = JSON.parse(event.data);

			if ("ballPosition" in data)
			{
				this._gameState = data;
			}
			else if ("gameResult" in data)
			{
				console.log("Received game result:", data.gameResult.state);
			}
		};
	
		this._gameWs.onclose = () =>
		{};
	}

	public sendDragToServer(dragValue: number)
	{
		if (this.isWebSocketOpen(this._gameWs) && this._gameState!.players.length == 2)
			this._gameWs!.send((dragValue * 1000).toString());
		else if (this.isWebSocketOpen(this._gameWs) && this._gameState!.players.length > 2)
			this._gameWs!.send((dragValue * 500).toString());
	}

	public refreshRooms() : void
	{
		if (this.isWebSocketOpen(this._lobbyWs))
			this._lobbyWs!.send("PING");
	}

	public handleClientEvent()
	{
		window.addEventListener("message", (event: MessageEvent) =>
		{
			switch (event.data.type)
			{
				case "SESSION_ID_RESPONSE":
					this._sessionId = event.data.sessionId;
					this.lobbyWs();
					break;
				default:
					break;
			}
		});
	}

	public requestSessionIdFromParent()
	{
		const parentOrigin = window.location.ancestorOrigins 
			? window.location.ancestorOrigins[0] 
			: '*';

		window.parent.postMessage(
			{ type: 'REQUEST_SESSION' },
			parentOrigin
		);
	}

	public get	inGame():	boolean {
		return this._gameState !== null;
	}

	public get getRooms() : RoomInfo[]
	{
		return this._rooms!;
	}

	public get getGameState() : GameState
	{
		return this._gameState!;
	}

	private isWebSocketOpen(ws: WebSocket | undefined): boolean
	{
		if (ws)
			return ws.readyState === WebSocket.OPEN;

		return false;
	}
}