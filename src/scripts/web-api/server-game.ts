import { int } from "@babylonjs/core";

type RoomState = "waiting" | "ready";

type LobbyConnect =
{
	rooms:			FullRoomInfo[];
	currentRoomId:	string
}

type CreateRoom =
{
	success:	boolean;
	room:		RoomInfo;
}

type JoinRoom =
{
	success:	boolean;
	isCreator:	boolean;
	roomId:		string;
	room:		FullRoomInfo;
}

type LeaveRoom =
{
	userLeft:
	{
		userId:		string;
		username:	string;
		room:		RoomInfo;
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
	id:					string;
	entryFee:			number;
	players:			Set<RoomPlayer>;
	maxPlayers:			number;
	createdAt:			Date;
	state:				RoomState;
}

interface FullRoomInfo extends RoomInfo
{
	createdBy:			string;
	creatorUsername:	string;
	isCurrentRoom:		boolean;
	isCreator:			boolean;
}

export class ServerGame
{
	private _lobbyWs?:				WebSocket;
	private _gameWs?:				WebSocket;
	private _sessionId?:			string;
	private _currentRoomId?:		string;
	private _rooms?:				FullRoomInfo[];

	constructor()
	{
		this.handleClientEvent();
		this.requestSessionIdFromParent();
	}

	public init()
	{
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
				console.log(event.data);
				const data: LobbyConnect = JSON.parse(event.data);
				this._currentRoomId = data.currentRoomId;
				this._rooms = data.rooms;
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
			ws.send(JSON.stringify({ entryFee, maxPlayers }));
		}

		ws.onmessage = (event: MessageEvent) =>
		{
			const data : CreateRoom = event.data;
			this._currentRoomId = data.room.id;

			// TODO: connect to a Game WebSocket

			this.refreshRooms();
			ws.close();
		}

		ws.onclose = () =>
		{}
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

			if (data.userLeft)
			{
				this._currentRoomId = undefined;

				if (this._gameWs)
				{
					this._gameWs.close();
					this._gameWs = undefined;
				}
			}
			// this.handleLobbyMessage(data);
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
		}

		ws.onmessage = (event: MessageEvent) =>
		{
			const data : JoinRoom = event.data;
			this._currentRoomId = data.room.id;

			// TODO: connect to a Game WebSocket

			this.refreshRooms();
			ws.close();
		}

		ws.onclose = () =>
		{}
	}

	public gameWs() : void
	{
		this._gameWs = new WebSocket(`${/**process.env.SERVER_WS_URL ?? **/"ws://localhost:4000/ws"}/game/${this._currentRoomId}?userId=${this._sessionId}`);

		this._gameWs.onopen = () =>
		{
			console.log("Connected to Game WebSocket");
		}

		this._gameWs.onclose = () =>
		{}
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
			const data = JSON.parse(event.data);
			if (data.success)
				console.log("Game started");
			else
				console.log("Failed to start the game");
			ws.close();
		};

		ws.onclose = () =>
		{
		}
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
		{}
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
		{}
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
					console.log('received session');
					console.log(`session is ${event.data.sessionId}`);
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

	public get getRooms() : RoomInfo[]
	{
		return this._rooms!;
	}

	private isWebSocketOpen(ws: WebSocket | undefined): boolean
	{
		if (ws)
			return ws.readyState === WebSocket.OPEN;

		return false;
	}
}