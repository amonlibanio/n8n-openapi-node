import type { OpenAPIV3 } from "openapi-types";
import type { IOperationContext } from "../openapi/openapi-visitor";

/**
 * Interface for parsing OpenAPI operations into n8n node properties
 * @interface IOperationParser
 */
export interface IOperationParser {
	/**
	 * Gets the display name of the operation (e.g. "Create User")
	 * @param operation - The OpenAPI operation object
	 * @param context - The operation context including path and method
	 * @returns The display name for the operation
	 */
	GetName(
		operation: OpenAPIV3.OperationObject,
		context: IOperationContext,
	): string;

	/**
	 * Gets the value of the operation (e.g. "create-user")
	 * @param operation - The OpenAPI operation object
	 * @param context - The operation context including path and method
	 * @returns The value for the operation
	 */
	GetValue(
		operation: OpenAPIV3.OperationObject,
		context: IOperationContext,
	): string;

	/**
	 * Gets the action name of the operation (e.g. "Create User") - will be visible in list of actions
	 * @param operation - The OpenAPI operation object
	 * @param context - The operation context including path and method
	 * @returns The action name for the operation
	 */
	GetAction(
		operation: OpenAPIV3.OperationObject,
		context: IOperationContext,
	): string;

	/**
	 * Gets the description of the operation
	 * @param operation - The OpenAPI operation object
	 * @param context - The operation context including path and method
	 * @returns The description for the operation
	 */
	GetDescription(
		operation: OpenAPIV3.OperationObject,
		context: IOperationContext,
	): string;

	/**
	 * Determines if this operation should be skipped
	 * @param operation - The OpenAPI operation object
	 * @param context - The operation context including path and method
	 * @returns True if the operation should be skipped, false otherwise
	 */
	ShouldSkip(
		operation: OpenAPIV3.OperationObject,
		context: IOperationContext,
	): boolean;

	// Legacy methods for backward compatibility
	/** @deprecated Use GetName instead */
	name?(
		operation: OpenAPIV3.OperationObject,
		context: IOperationContext,
	): string;
	/** @deprecated Use GetValue instead */
	value?(
		operation: OpenAPIV3.OperationObject,
		context: IOperationContext,
	): string;
	/** @deprecated Use GetAction instead */
	action?(
		operation: OpenAPIV3.OperationObject,
		context: IOperationContext,
	): string;
	/** @deprecated Use GetDescription instead */
	description?(
		operation: OpenAPIV3.OperationObject,
		context: IOperationContext,
	): string;
	/** @deprecated Use ShouldSkip instead */
	shouldSkip?(
		operation: OpenAPIV3.OperationObject,
		context: IOperationContext,
	): boolean;
}
