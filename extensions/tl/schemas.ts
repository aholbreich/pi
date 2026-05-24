import { StringEnum } from "@earendil-works/pi-ai";
import { Type } from "typebox";

/**
 * TypeBox schemas describe tool parameters to Pi and to the LLM provider.
 *
 * We keep common schemas here so each tool definition can stay short.
 */
export const Priority = StringEnum(["low", "medium", "high"] as const);

export const IdParam = {
	id: Type.String({ description: "Task id, e.g. task-k5g or bare short code k5g" }),
};
