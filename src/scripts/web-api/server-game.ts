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
}

type GameResult =
{
	gameResult:
	{
		players:	Array<
		{
			id:				string;
			score:			number;
			place:			string;
			username:		string;
			isActive:		boolean;
			playersKicked:	number;
		}>;
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

type RoomPlayer =
{
	id:			string;
	isReady:	boolean;
	username:	string;
};

interface RoomInfo
{
	id:			string;
	name:		string;
	count:		number;
	state:		RoomState;
	entryFee:	number;
	maxPlayers:	number;
}

interface RoomDetails
{
	players:	Set<RoomPlayer>;
	creator:	RoomPlayer;
	createdAt:	Date;
}

export class ServerGame
{
	private _lobbyWs?:						WebSocket;
	private _gameState?:					GameState;
	private _sessionId?:					string;
	private _currentRoomId?:				string;
	public onRoomsUpdatedObservable:		Observable<RoomInfo[]>;
	public onRoomDetailsUpdatedObservable:	Observable<RoomDetails>;
	public onGameStateUpdatedObservable:	Observable<GameState>;

	constructor()
	{
		this.onRoomsUpdatedObservable = new Observable<RoomInfo[]>();
		this.onRoomDetailsUpdatedObservable = new Observable<RoomDetails>();
		this.onGameStateUpdatedObservable = new Observable<GameState>();
		this.lobbyWs();

		// Resubscription logic
		// this.resubscribeToRoom();
		// this.resubscribeToGame();

		// this.handleClientEvent();
		// this.requestSessionIdFromParent();
	}

	public lobbyWs() : void
	{
		this._lobbyWs = new WebSocket(`${/**process.env.SERVER_WS_URL ?? **/"ws://localhost:4000/ws"}/lobby?sId=${this._sessionId}`);

		this._lobbyWs.onopen = () =>
		{
			console.log("Connected to Lobby WebSocket ");
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
					data.gameResult.state
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

		this._lobbyWs.onerror = (error) =>
		{
			console.log("Lobby WebSocket error: ", error);
		};
	}

	public getRooms() : void
	{
		const type = "GET_ROOMS";

		if (this.isWebSocketOpen(this._lobbyWs))
			this._lobbyWs?.send(JSON.stringify({ type }));
	}

	public getRoomDetails() : void
	{
		const type = "GET_ROOM";

		if (this.isWebSocketOpen(this._lobbyWs))
			this._lobbyWs?.send(JSON.stringify({ type, roomId: this._currentRoomId }));
	}

	public createRoom(
		name: string,
		entryFee: int,
		maxPlayers: int
	) : void
	{
		const type = "CREATE_ROOM";

		if (this.isWebSocketOpen(this._lobbyWs))
			this._lobbyWs?.send(JSON.stringify({ type, maxPlayers, entryFee, name }));
	}

	public joinRoom(roomId: string) : void
	{
		const type = "JOIN_ROOM";

		if (this.isWebSocketOpen(this._lobbyWs))
			this._lobbyWs?.send(JSON.stringify({ type, roomId }));
	}

	public leaveRoom() : void
	{
		const type = "LEAVE_ROOM";

		if (this.isWebSocketOpen(this._lobbyWs))
			this._lobbyWs?.send(JSON.stringify({ type, roomId: this._currentRoomId }));
	}

	public markRoomPlayerReady(roomId: string) : void
	{
		const type = "READY";

		if (this.isWebSocketOpen(this._lobbyWs))
			this._lobbyWs?.send(JSON.stringify({ type, roomId }));
	}

	public markRoomPlayerWaiting(roomId: string) : void
	{
		const type = "WAITING";

		if (this.isWebSocketOpen(this._lobbyWs))
			this._lobbyWs?.send(JSON.stringify({ type, roomId }));
	}

	public startGame() : void
	{
		const type = "START_GAME";

		if (this.isWebSocketOpen(this._lobbyWs))
			this._lobbyWs?.send(JSON.stringify({ type, roomId: this._currentRoomId }));
	}

	public subscribeToRoom() : void
	{
		const type = "SUBSCRIBE_ROOM";

		if (this.isWebSocketOpen(this._lobbyWs))
			this._lobbyWs?.send(JSON.stringify({ type, roomId: this._currentRoomId ?? undefined }))
	}

	public subscribeToGame() : void
	{
		const type = "SUBSCRIBE_GAME";

		if (this.isWebSocketOpen(this._lobbyWs))
			this._lobbyWs?.send(JSON.stringify({ type, roomId: this._currentRoomId ?? undefined }))
	}

	public usubscribeFromRoom(roomId: string)
	{
		const type = "UNSUBSCRIBE_ROOM";

		if (this.isWebSocketOpen(this._lobbyWs))
			this._lobbyWs?.send(JSON.stringify({ type, roomId }))
	}

	public unsubscribeFromGame(roomId: string)
	{
		const type = "UNSUBSCRIBE_GAME";

		if (this.isWebSocketOpen(this._lobbyWs))
			this._lobbyWs?.send(JSON.stringify({ type, roomId }))
	}

	public subscribeToLobby()
	{
		const type = "SUBSCRIBE_LOBBY";

		if (this.isWebSocketOpen(this._lobbyWs))
			this._lobbyWs?.send(JSON.stringify({ type }));
	}
	
	public unsubscribeFromLobby()
	{
		const type = "UNSUBSCRIBE_LOBBY";

		if (this.isWebSocketOpen(this._lobbyWs))
			this._lobbyWs?.send(JSON.stringify({ type }));
	}

	public sendDragToServer(dragValue: number)
	{
		const type = "GAME_DATA";

		if (this.isWebSocketOpen(this._lobbyWs) && this._gameState!.players.length == 2)
			this._lobbyWs!.send(JSON.stringify({ type, dragValue: dragValue * 1000}));
		else if (this.isWebSocketOpen(this._lobbyWs) && this._gameState!.players.length > 2)
			this._lobbyWs!.send(JSON.stringify({ type, dragValue: dragValue * 500}));
	}

	private isWebSocketOpen(ws: WebSocket | undefined): boolean
	{
		if (ws)
			return ws.readyState === WebSocket.OPEN;

		return false;
	}
}