import { OpenAPIV3 } from "openapi-types";
import type { IOpenApiVisitor, IOperationContext } from "./openapi-visitor";

const HTTP_METHODS: string[] = Object.values(OpenAPIV3.HttpMethods);

/**
 * Parser for OpenAPI v3 documents that visits different parts of the specification
 * @class OpenApiParser
 */
export class OpenApiParser {
	private readonly apiDocument: OpenAPIV3.Document;

	/**
	 * Creates a new OpenApiParser instance
	 * @param apiDocument - The OpenAPI v3 document to parse
	 */
	constructor(apiDocument: OpenAPIV3.Document) {
		this.apiDocument = apiDocument;
	}

	/**
	 * Parses the OpenAPI document using the provided visitor
	 * @param visitor - The visitor to process the OpenAPI document
	 */
	Parse(visitor: IOpenApiVisitor) {
		this.ParseDocument(visitor);
		this.ParsePaths(visitor);
		this.ParseTags(visitor);
		if (visitor.Finish) {
			visitor.Finish();
		}
	}

	/**
	 * Parses the OpenAPI document root
	 * @private
	 * @param visitor - The visitor to process the document
	 * @param doc - Optional document to parse (defaults to the main document)
	 */
	private ParseDocument(visitor: IOpenApiVisitor, doc?: OpenAPIV3.Document) {
		if (!doc) {
			doc = this.apiDocument;
		}
		if (visitor.visitDocument) {
			visitor.visitDocument(doc);
		}
	}

	/**
	 * Parses all paths and operations in the OpenAPI document
	 * @private
	 * @param visitor - The visitor to process the paths
	 * @param paths - Optional paths object to parse (defaults to the main document paths)
	 */
	private ParsePaths(visitor: IOpenApiVisitor, paths?: OpenAPIV3.PathsObject) {
		if (!paths) {
			paths = this.apiDocument.paths;
		}
		if (!paths) {
			return;
		}
		for (const path in paths) {
			const pathItem: OpenAPIV3.PathItemObject = paths[
				path
			] as OpenAPIV3.PathItemObject;

			for (const [httpMethod, operationValue] of Object.entries(pathItem)) {
				if (!HTTP_METHODS.includes(httpMethod)) {
					continue;
				}
				const operation = operationValue as
					| OpenAPIV3.OperationObject
					| OpenAPIV3.ReferenceObject;
				if (
					typeof operation === "object" &&
					operation !== null &&
					!("$ref" in operation)
				) {
					(operation as OpenAPIV3.OperationObject).tags ??= ["default"];
				}

				const context: IOperationContext = {
					pattern: path,
					path: pathItem,
					method: httpMethod as OpenAPIV3.HttpMethods,
				};

				if ("$ref" in operation) {
					continue; // Skip reference objects for now
				}
				visitor.VisitOperation?.(operation, context) ??
					visitor.visitOperation?.(operation, context);
			}
		}
	}

	/**
	 * Parses all tags in the OpenAPI document
	 * @private
	 * @param visitor - The visitor to process the tags
	 */
	private ParseTags(visitor: IOpenApiVisitor) {
		if (!this.apiDocument.tags) {
			return;
		}
		for (const tag of this.apiDocument.tags) {
			visitor.VisitTag?.(tag) ?? visitor.visitTag?.(tag);
		}
	}
}
