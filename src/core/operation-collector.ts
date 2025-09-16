import * as lodash from "lodash";
import type { INodeProperties } from "n8n-workflow";
import type { OpenAPIV3 } from "openapi-types";
import type pino from "pino";
import type {
	IOpenApiVisitor,
	IOperationContext,
} from "../openapi/openapi-visitor";
import type { IOperationParser } from "../types/operation-parser";
import type { IResourceParser } from "../types/resource-parser";
import { PropertyMapper } from "../types/schema-to-properties";
import { FormatPathWithParameters } from "../utils";
import { ResourceOptionsMap } from "./resource-options-map";

/**
 * Base class for collecting operations from OpenAPI documents and converting them to n8n node properties
 * @class BaseOperationCollector
 * @implements {IOpenApiVisitor}
 */
export class BaseOperationCollector implements IOpenApiVisitor {
	public readonly collectedFields: INodeProperties[];
	private resourceOptions: ResourceOptionsMap = new ResourceOptionsMap();
	private propertyMapper: PropertyMapper;

	private logContext?: Record<string, unknown>;

	private shouldSkip(
		operation: OpenAPIV3.OperationObject,
		context: IOperationContext,
	): boolean {
		return (
			this.operationParser.shouldSkip?.(operation, context) ??
			this.operationParser.ShouldSkip(operation, context)
		);
	}

	private name(
		operation: OpenAPIV3.OperationObject,
		context: IOperationContext,
	): string {
		return (
			this.operationParser.name?.(operation, context) ??
			this.operationParser.GetName(operation, context)
		);
	}

	private value(
		operation: OpenAPIV3.OperationObject,
		context: IOperationContext,
	): string {
		return this.operationParser.GetValue(operation, context);
	}

	private action(
		operation: OpenAPIV3.OperationObject,
		context: IOperationContext,
	): string {
		return this.operationParser.GetAction(operation, context);
	}

	private description(
		operation: OpenAPIV3.OperationObject,
		context: IOperationContext,
	): string {
		return (
			this.operationParser.description?.(operation, context) ??
			this.operationParser.GetDescription(operation, context)
		);
	}

	constructor(
		apiDocument: OpenAPIV3.Document,
		protected operationParser: IOperationParser,
		protected resourceParser: IResourceParser,
		protected logger: pino.Logger,
	) {
		this.collectedFields = [];
		this.propertyMapper = new PropertyMapper(apiDocument);
	}

	get operations(): INodeProperties[] {
		if (this.resourceOptions.size === 0) {
			throw new Error("No operations found in OpenAPI document");
		}

		const operations: INodeProperties[] = [];
		for (const [resource, options] of this.resourceOptions) {
			const operation: INodeProperties = {
				displayName: "Operation",
				name: "operation",
				type: "options",
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: [resource],
					},
				},
				options: options,
				default: "",
			};
			operations.push(operation);
		}
		return operations;
	}

	get fields() {
		return [...this.collectedFields];
	}

	VisitOperation(
		operation: OpenAPIV3.OperationObject,
		context: IOperationContext,
	) {
		const contextData = {
			operation: {
				pattern: context.pattern,
				method: context.method,
				operationId: operation.operationId,
			},
		};
		this.logContext = contextData;
		try {
			this.VisitOperationInternal(operation, context);
		} catch (error) {
			const data = { ...this.logContext, error: `${error}` };

			this.logger.warn(data, "Failed to parse operation");
		}
	}

	VisitOperationInternal(
		operation: OpenAPIV3.OperationObject,
		context: IOperationContext,
	) {
		if (this.operationParser?.shouldSkip?.(operation, context)) {
			this.logger.info(this.logContext, "Skipping operation");
			return;
		}
		const { option, fields: operationFields } = this.ParseOperation(
			operation,
			context,
		);
		let resources: string[] = [];
		if (operation.tags && operation.tags.length > 0) {
			resources = operation.tags
				.map((tag: string) => this.resourceParser?.GetValue?.({ name: tag }))
				.filter(Boolean);
		} else {
			// Use default resource when no tags are specified
			resources = [
				this.resourceParser?.GetValue?.({ name: "Default" }) || "Default",
			];
		}

		for (const resourceName of resources) {
			const fields = lodash.cloneDeep(operationFields);
			const operationName = option.name;
			this.AddDisplayOption(fields, resourceName, operationName);
			this.resourceOptions.add(resourceName, option);
			this.collectedFields.push(...fields);
		}
	}

	/**
	 * Parse fields from operation, both parameters and request body
	 */
	ParseFields(
		operation: OpenAPIV3.OperationObject,
		context: IOperationContext,
	) {
		const fields = [];
		const parameterFields = this.propertyMapper.MapFromParameters(
			operation.parameters,
		);
		fields.push(...parameterFields);

		try {
			const bodyFields = this.propertyMapper.MapFromRequestBody(
				operation.requestBody,
			);
			fields.push(...bodyFields);
		} catch (error) {
			const data = { ...this.logContext, error: `${error}` };

			this.logger.warn(data, "Failed to parse request body");
			const msg =
				"There's no body available for request, kindly use HTTP Request node to send body";
			const notice: INodeProperties = {
				displayName: `${context.method.toUpperCase()} ${context.pattern}<br/><br/>${msg}`,
				name: "operation",
				type: "notice",
				default: "",
			};
			fields.push(notice);
		}
		return fields;
	}

	private AddDisplayOption(
		fields: INodeProperties[],
		resource: string,
		operation: string,
	) {
		const displayOptions = {
			show: {
				resource: [resource],
				operation: [operation],
			},
		};
		fields.forEach((field) => {
			field.displayOptions = displayOptions;
		});
	}

	protected ParseOperation(
		operation: OpenAPIV3.OperationObject,
		context: IOperationContext,
	) {
		const method = context.method;
		const uri = context.pattern;
		const option = {
			name: this.name(operation, context),
			value: this.value(operation, context),
			action: this.action(operation, context),
			description: this.description(operation, context),
			routing: {
				request: {
					method: method.toUpperCase(),
					url: `=${FormatPathWithParameters(uri)}`,
				},
			},
		};
		const fields = this.ParseFields(operation, context);

		return {
			option: option,
			fields: fields,
		};
	}
}

export class OperationCollector extends BaseOperationCollector {
	protected ParseOperation(
		operation: OpenAPIV3.OperationObject,
		context: IOperationContext,
	) {
		const result = super.ParseOperation(operation, context);
		const notice: INodeProperties = {
			displayName: `${context.method.toUpperCase()} ${context.pattern}`,
			name: "operation",
			type: "notice",
			typeOptions: {
				theme: "info",
			},
			default: "",
		};
		result.fields.unshift(notice);
		return result;
	}
}
