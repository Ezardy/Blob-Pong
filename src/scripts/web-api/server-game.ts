import { int, Observable } from "@babylonjs/core";

type LobbyRooms =
{
	rooms:			RoomInfo[];
	// currentRoomId:	string;
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

export type GameState =
{
	state:				"countdown" | "finished" | "playing";
	players:			GamePlayer[];
	ballPosition:		[number, number];
	countdownSeconds:	number | undefined;
}

export type GamePlayer =
{
	id:				string;
	username:		string;
	position:		number;
}

export type ResultPlayer =
{
	id:				string;
	score:			number;
	place:			string;
	username:		string;
	isActive:		boolean;
	playersKicked:	number;
}

type GameResult =
{
	gameResult:
	{
		players:	Array<ResultPlayer>;
		fee:		number
		state:		'finished' | 'aborted';
	}
}

type RoomState = "waiting" | "ready";

type CreateRoom =
{
	createRoom:
	{
		roomId:		string;
		success:	boolean;
		isPrivate:	boolean;
	}
}

type JoinRoom =
{
	joinRoom:
	{
		roomId:		string;
		success:	boolean;
	}
}

type LeaveRoom = 
{
	leaveRoom:
	{
		success:	boolean;
	}
}

type RoomStateChanged =
{
	roomStateChanged:
	{
		roomId:		string;
	}
}

export type RoomPlayer =
{
	id:			string;
	isReady:	boolean;
	username:	string;
};

export interface RoomInfo
{
	id:			string;
	name:		string;
	count:		number;
	state:		RoomState;
	entryFee:	number;
	maxPlayers:	number;
}

export interface RoomDetails
{
	id:			string;
	players:	Array<RoomPlayer>;
	creator:	RoomPlayer;
	createdAt:	Date;
	maxPlayers:	number;
}

export class ServerGame
{
	private			_lobbyWs?:						WebSocket;
	private			_gameState?:					GameState;
	private			_sessionId?:					string;
	private			_currentRoomId?:				string;
	public readonly	onRoomsUpdatedObservable:		Observable<RoomInfo[]>;
	public readonly	onRoomDetailsUpdatedObservable:	Observable<RoomDetails>;
	public readonly	onGameStateUpdatedObservable:	Observable<GameState>;
	public readonly	onGameResultObservable:			Observable<GameResult>;
	public readonly	onWebSocketOpenedObservable:	Observable<void>;

	constructor()
	{
		this.onRoomsUpdatedObservable = new Observable<RoomInfo[]>();
		this.onRoomDetailsUpdatedObservable = new Observable<RoomDetails>();
		this.onGameStateUpdatedObservable = new Observable<GameState>();
		this.onGameResultObservable = new Observable<GameResult>();
		this.onWebSocketOpenedObservable = new Observable<void>();
	}

	public	open() : void {
		//this._lobbyWs = new WebSocket(`wss://${window.location.host}/ws/lobby?sId=${this._sessionId}`);
		this._lobbyWs = new WebSocket(`${/**process.env.SERVER_WS_URL ?? **/"ws://localhost:4000/ws"}/lobby?sId=${this._sessionId}`);

		this._lobbyWs.onopen = () => {
			console.log("Connected to Lobby WebSocket ");
			this.onWebSocketOpenedObservable.notifyObservers();
		};

		this._lobbyWs.onmessage = (event: MessageEvent) =>
		{
			try
			{
				// figure out what event was sent from the server
				const data: LobbyRooms | CreateRoom | JoinRoom | LeaveRoom | RoomDetails | RoomStateChanged | GameState | GameResult
					= JSON.parse(event.data);

				if ("rooms" in data) // LobbyRooms
				{
					this.onRoomsUpdatedObservable.notifyObservers(data.rooms);
				}
				else if ("createRoom" in data) // CreateRoom
				{
					this._currentRoomId = data.createRoom.roomId;
				}
				else if ("joinRoom" in data) // JoinRoom
				{
					this._currentRoomId = data.joinRoom.roomId;
				}
				else if ("leaveRoom" in data)
				{
					this._currentRoomId = undefined;
				}
				else if ("creator" in data) // RoomDetails
				{
					if (!this._currentRoomId)
						this._currentRoomId = data.id;
					this.onRoomDetailsUpdatedObservable.notifyObservers(data);
				}
				else if ("roomStateChanged" in data) // RoomStateChanged
				{
					data.roomStateChanged.roomId
				}
				else if ("ballPosition" in data) // GameState
				{
					this._gameState = data;
					this.onGameStateUpdatedObservable.notifyObservers(data);
				}
				else if ("gameResult" in data) // GameResult
				{
					this.onGameResultObservable.notifyObservers(data);
				}
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

		this._lobbyWs.onerror = (error) => {
			console.log("Lobby WebSocket error: ", error);
		};

		window.addEventListener("message", (event: MessageEvent) =>
		{
			switch (event.data.type)
			{
				case "LOGOUT":
					this.closeWebsocket();
			}
		});
	}

	public getRoomDetails() : void
	{
		const type = "GET_ROOM";

		if (this.isWebSocketOpen())
			this._lobbyWs?.send(JSON.stringify({ type, roomId: this._currentRoomId }));
	}

	public createRoom(
		name: string,
		entryFee: int,
		maxPlayers: int,
		isPrivate: boolean = false
	) : void
	{
		const type = "CREATE_ROOM";

		if (this.isWebSocketOpen())
			this._lobbyWs?.send(JSON.stringify({ type, maxPlayers, entryFee, name, isPrivate }));
	}

	public joinRoom(roomId: string) : void
	{
		const type = "JOIN_ROOM";

		if (this.isWebSocketOpen())
			this._lobbyWs?.send(JSON.stringify({ type, roomId }));
	}

	public leaveRoom() : void
	{
		const type = "LEAVE_ROOM";

		if (this.isWebSocketOpen() && this._currentRoomId)
			this._lobbyWs?.send(JSON.stringify({ type, roomId: this._currentRoomId }));
	}

	public markRoomPlayerReady() : void
	{
		const type = "READY";

		if (this.isWebSocketOpen())
			this._lobbyWs?.send(JSON.stringify({ type, roomId: this._currentRoomId }));
	}

	public markRoomPlayerWaiting() : void
	{
		const type = "WAITING";

		if (this.isWebSocketOpen())
			this._lobbyWs?.send(JSON.stringify({ type, roomId: this._currentRoomId }));
	}

	public startGame() : void
	{
		const type = "START_GAME";

		if (this.isWebSocketOpen())
			this._lobbyWs?.send(JSON.stringify({ type, roomId: this._currentRoomId }));
	}

	public reconnectToTopics() : void
	{
		const type = "RECONNECT";

		if (this.isWebSocketOpen())
			this._lobbyWs?.send(JSON.stringify({ type }));
	}

	public subscribeToLobby()
	{
		const type = "SUBSCRIBE_LOBBY";

		if (this.isWebSocketOpen())
			this._lobbyWs?.send(JSON.stringify({ type }));
	}
	
	public unsubscribeFromLobby()
	{
		const type = "UNSUBSCRIBE_LOBBY";

		if (this.isWebSocketOpen())
			this._lobbyWs?.send(JSON.stringify({ type }));
	}

	public sendDragToServer(dragValue: number)
	{
		const type = "GAME_DATA";

		if (this.isWebSocketOpen())
			this._lobbyWs!.send(JSON.stringify({ type, dragValue: dragValue}));
	}

	public closeWebsocket()
	{
		const type = "CLOSE_WS";

		if (this.isWebSocketOpen())
			this._lobbyWs!.send(JSON.stringify({ type }));
	}

	public isWebSocketOpen(): boolean
	{
		if (this._lobbyWs)
			return this._lobbyWs.readyState === WebSocket.OPEN;

		return false;
	}
}
