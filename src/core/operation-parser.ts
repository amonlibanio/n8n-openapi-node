import * as lodash from "lodash";
import type { OpenAPIV3 } from "openapi-types";
import type { IOperationContext } from "../openapi/openapi-visitor";
import type { IOperationParser } from "../types/operation-parser";

/**
 * Default implementation of IOperationParser for parsing OpenAPI operations
 * @class OperationParser
 * @implements {IOperationParser}
 */
export class OperationParser implements IOperationParser {
	/**
	 * Determines if this operation should be skipped
	 * @param operation - The OpenAPI operation object
	 * @param context - The operation context
	 * @returns True if the operation is deprecated and should be skipped
	 */
	ShouldSkip(
		operation: OpenAPIV3.OperationObject,
		context: IOperationContext,
	): boolean {
		return !!operation.deprecated;
	}

	/**
	 * Gets the display name of the operation
	 * @param operation - The OpenAPI operation object
	 * @param context - The operation context
	 * @returns The display name for the operation
	 */
	GetName(
		operation: OpenAPIV3.OperationObject,
		context: IOperationContext,
	): string {
		if (operation.operationId) {
			return lodash.startCase(operation.operationId);
		}
		return `${context.method.toUpperCase()} ${context.pattern}`;
	}

	/**
	 * Gets the value of the operation
	 * @param operation - The OpenAPI operation object
	 * @param context - The operation context
	 * @returns The value for the operation (sanitized name)
	 */
	GetValue(
		operation: OpenAPIV3.OperationObject,
		context: IOperationContext,
	): string {
		const name = this.GetName(operation, context);
		// replace all non-alphanumeric characters with '-'
		return name.replace(/[^a-zA-Z0-9 ]/g, "-");
	}

	/**
	 * Gets the action name of the operation
	 * @param operation - The OpenAPI operation object
	 * @param context - The operation context
	 * @returns The action name for the operation
	 */
	GetAction(
		operation: OpenAPIV3.OperationObject,
		context: IOperationContext,
	): string {
		return operation.summary || this.GetName(operation, context);
	}

	/**
	 * Gets the description of the operation
	 * @param operation - The OpenAPI operation object
	 * @param _context - The operation context (unused)
	 * @returns The description for the operation
	 */
	GetDescription(
		operation: OpenAPIV3.OperationObject,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		_context: IOperationContext,
	): string {
		return operation.description || operation.summary || "";
	}

	// Legacy methods for backward compatibility
	/** @deprecated Use GetName instead */
	name(
		operation: OpenAPIV3.OperationObject,
		context: IOperationContext,
	): string {
		return this.GetName(operation, context);
	}

	/** @deprecated Use GetValue instead */
	value(
		operation: OpenAPIV3.OperationObject,
		context: IOperationContext,
	): string {
		return this.GetValue(operation, context);
	}

	/** @deprecated Use GetAction instead */
	action(
		operation: OpenAPIV3.OperationObject,
		context: IOperationContext,
	): string {
		return this.GetAction(operation, context);
	}

	/** @deprecated Use GetDescription instead */
	description(
		operation: OpenAPIV3.OperationObject,
		context: IOperationContext,
	): string {
		return this.GetDescription(operation, context);
	}

	/** @deprecated Use ShouldSkip instead */
	shouldSkip(
		operation: OpenAPIV3.OperationObject,
		context: IOperationContext,
	): boolean {
		return this.ShouldSkip(operation, context);
	}
}
