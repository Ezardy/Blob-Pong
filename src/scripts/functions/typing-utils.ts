import { Control3D } from "@babylonjs/gui";

export type			JSONValue = string | number | boolean | null | JSONObject | JSONArray;
export interface	JSONObject { [key: string]: JSONValue }
export interface	JSONArray extends Array<JSONObject> {}

export type			Control3DClone = { root: Control3D, children: Control3DClone[]};