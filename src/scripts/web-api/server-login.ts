interface LoginInfo
{
	email:		string;
	password:	string;
}

interface SignUpInfo extends LoginInfo
{
	username:	string;
}

type SignUpResponse =
{
	user:
	{
		id:			string;
		username:	string;
		email:		string;
		nonce:		string;
	}
}

export type UserInfo =
{
	id:			string;
	username:	string;
	email:		string;
}

type LoginResponse =
{
	message:	string;
	user:		UserInfo
}

export async function loginAsync(data: LoginInfo) : Promise<LoginResponse | undefined>
{
	const response = await fetch(
		process.env.SERVER_API_LOGIN ?? "http://localhost:4000/api/users/login",
		{
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify(data) 
		}
	);

	if (response.ok)
	{
		const json = await response.json();
		return json as LoginResponse;
	}

	return undefined;
}

export async function registerAsync(data: SignUpInfo) : Promise<SignUpResponse | undefined>
{
	const response = await fetch(
		process.env.SERVER_API_SIGN_UP ?? "http://localhost:4000/api/users/register",
		{
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify(data) 
		}
	)

	if (response.status === 200)
	{
		const json = await response.json();
		return {
			user:
			{
				id: json.id,
				email: json.email,
				username: json.username,
				nonce: json.emailVerified.nonce
			}
		};
	}

	return undefined;
}

export async function logoutAsync() : Promise<void>
{
	const response = await fetch(
		process.env.SERVER_API_LOG_OUT ?? "http://localhost:4000/api/users/logout",
		{
			method: 'POST',
			credentials: 'include'
		}
	);

	if (response.status === 200)
	{
		console.log("Logout successful");
	}
}

export async function doesSessionExist() : Promise<boolean>
{
	const response = await fetch("http://localhost:4000/api/users/tokens",
		{
			method: "GET",
			credentials: "include"
		}
	);

	if (response.ok)
		return true;

	return false;
}

export async function getCurrentUser() : Promise<UserInfo | undefined>
{
	const response = await fetch("http://localhost:4000/api/users/current",
		{
			method: "GET",
			credentials: "include"
		}
	);

	if (response.ok)
	{
		const json = await response.json();
		return {
			id: json.id,
			email: json.email,
			username: json.username,
		};
	}

	return undefined;
}