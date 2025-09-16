import type { OpenAPIV3 } from "openapi-types";

/**
 * Context information for an OpenAPI operation
 * @typedef IOperationContext
 */
export type IOperationContext = {
	/** The URL pattern for the operation */
	pattern: string;
	/** The path item object containing the operation */
	path: OpenAPIV3.PathItemObject;
	/** The HTTP method for the operation */
	method: OpenAPIV3.HttpMethods;
};

/**
 * Visitor interface for processing OpenAPI documents
 * @interface IOpenApiVisitor
 */
export interface IOpenApiVisitor {
	/**
	 * Called when visiting the root document
	 * @param doc - The OpenAPI document
	 */
	visitDocument?(doc: OpenAPIV3.Document): void;

	/**
	 * Called when visiting an operation (preferred method)
	 * @param operation - The OpenAPI operation object
	 * @param context - The operation context
	 */
	VisitOperation?(
		operation: OpenAPIV3.OperationObject,
		context: IOperationContext,
	): void;

	/**
	 * Called when visiting a tag (preferred method)
	 * @param tag - The OpenAPI tag object
	 */
	VisitTag?(tag: OpenAPIV3.TagObject): void;

	/**
	 * Called when parsing is finished (preferred method)
	 */
	Finish?(): void;

	// Legacy methods for backward compatibility
	/** @deprecated Use VisitOperation instead */
	visitOperation?(
		operation: OpenAPIV3.OperationObject,
		context: IOperationContext,
	): void;
	/** @deprecated Use VisitTag instead */
	visitTag?(tag: OpenAPIV3.TagObject): void;
	/** @deprecated Use Finish instead */
	finish?(): void;
}
