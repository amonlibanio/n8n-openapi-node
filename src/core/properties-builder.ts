import lodash from "lodash";
import type { INodeProperties } from "n8n-workflow";
import type { OpenAPIV3 } from "openapi-types";
import pino from "pino";
import { OpenApiParser } from "../openapi/openapi-parser";
import {
	type IOperationParser,
	OperationParser,
} from "../parsers/operation-parser";
import {
	type BaseOperationCollector,
	OperationCollector as OperationCollectorImpl,
} from "../parsers/operations-collector";
import { ResourceCollector as ResourcePropertiesCollector } from "../parsers/resource-collector";
import {
	type IResourceParser,
	ResourceParser,
} from "../parsers/resource-parser";

/**
 * Interface for property overrides that allows customizing generated properties
 * @interface IPropertyOverride
 */
export interface IPropertyOverride {
	/** Criteria to find properties to override */
	find: Record<string, unknown>;
	/** Values to replace in matching properties */
	replace: Record<string, unknown>;
}

/**
 * Configuration interface for PropertiesBuilder
 * @interface IBuilderConfig
 */
export interface IBuilderConfig {
	/** Optional logger instance for debugging */
	logger?: pino.Logger;
	/** Custom operation collector class */
	OperationCollector?: typeof BaseOperationCollector;
	/** Custom resource properties collector class */
	ResourcePropertiesCollector?: typeof ResourcePropertiesCollector;
	/** Custom operation parser instance */
	operation?: IOperationParser;
	/** Custom resource parser instance */
	resource?: IResourceParser;
}

/**
 * Main class for building n8n node properties from OpenAPI specifications
 * @class PropertiesBuilder
 */
export class PropertiesBuilder {
	private readonly apiDocument: OpenAPIV3.Document;
	private readonly logger: pino.Logger;
	private readonly apiWalker: OpenApiParser;

	// Dependency injection
	private readonly operationParser: IOperationParser;
	private readonly resourceParser: IResourceParser;
	private readonly OperationCollector: typeof BaseOperationCollector;
	private readonly ResourcePropertiesCollector: typeof ResourcePropertiesCollector;

	/**
	 * Creates a new PropertiesBuilder instance
	 * @param apiDocument - The OpenAPI v3 document to parse
	 * @param config - Optional configuration for customizing behavior
	 */
	constructor(apiDocument: OpenAPIV3.Document, config?: IBuilderConfig) {
		this.apiDocument = apiDocument;
		this.logger =
			config?.logger || pino({ transport: { target: "pino-pretty" } });
		this.apiWalker = new OpenApiParser(this.apiDocument);

		// DI
		this.operationParser = config?.operation || new OperationParser();
		this.resourceParser = config?.resource || new ResourceParser();
		this.OperationCollector = config?.OperationCollector
			? config.OperationCollector
			: OperationCollectorImpl;
		this.ResourcePropertiesCollector = config?.ResourcePropertiesCollector
			? config.ResourcePropertiesCollector
			: ResourcePropertiesCollector;
	}

	/**
	 * Builds n8n node properties from the OpenAPI document
	 * @param overrides - Optional array of property overrides to customize generated properties
	 * @returns Array of n8n node properties
	 */
	Build(overrides: IPropertyOverride[] = []): INodeProperties[] {
		const resourcePropertiesCollector = new this.ResourcePropertiesCollector(
			this.resourceParser,
		);
		this.apiWalker.Parse(resourcePropertiesCollector);
		const resourceNode = resourcePropertiesCollector.resources;

		const operationsCollector = new this.OperationCollector(
			this.apiDocument,
			this.operationParser,
			this.resourceParser,
			this.logger,
		);
		this.apiWalker.Parse(operationsCollector);
		const operations = operationsCollector.operations;
		const fields = operationsCollector.fields;

		const properties = [resourceNode, ...operations, ...fields];
		return this.UpdateProperties(properties, overrides);
	}

	/**
	 * Applies property overrides to the generated properties
	 * @private
	 * @param fields - Array of properties to update
	 * @param patterns - Array of override patterns to apply
	 * @returns Updated array of properties
	 */
	private UpdateProperties(
		fields: INodeProperties[],
		patterns: IPropertyOverride[],
	) {
		for (const pattern of patterns) {
			for (const element of lodash.filter(fields, pattern.find)) {
				Object.assign(element, pattern.replace);
			}
		}
		return fields;
	}
}
