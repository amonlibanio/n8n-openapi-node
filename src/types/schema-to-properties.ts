import * as lodash from "lodash";
import type {
	INodeProperties,
	NodeParameterValueType,
	NodePropertyTypes,
} from "n8n-workflow";
import type { OpenAPIV3 } from "openapi-types";
import { ReferenceResolver } from "../openapi/reference-resolver";
import { SchemaExample } from "../openapi/schema-example";

type IApiSchema = OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject;
type ISchemaPropertyConfig = Pick<
	INodeProperties,
	"type" | "default" | "description" | "options"
>;

type IApiContent = {
	schema: IApiSchema;
};

type ISchemaDefaults = {
	readonly [key in NonNullable<OpenAPIV3.SchemaObject["type"]>]: unknown;
};

const JSON_CONTENT_PATTERN = /application\/json.*/;

const SCHEMA_DEFAULTS: ISchemaDefaults = {
	boolean: true,
	string: "",
	object: "{}",
	array: "[]",
	number: 0,
	integer: 0,
};

const PROPERTY_TYPE_MAPPING: Record<string, NodePropertyTypes> = {
	boolean: "boolean",
	string: "string",
	object: "json",
	array: "json",
	number: "number",
	integer: "number",
};

function MergeProperties(
	...sources: Partial<INodeProperties>[]
): INodeProperties {
	const mergedProperties = lodash.defaults({}, ...sources);
	if (!mergedProperties.required) {
		delete mergedProperties.required;
	}
	return mergedProperties;
}

function FindMatchingKey(
	obj: Record<string, unknown>,
	pattern: RegExp,
): unknown | undefined {
	const key = Object.keys(obj).find((k) => pattern.test(k));
	return key ? obj[key] : undefined;
}

function IsContentObject(value: unknown): value is IApiContent {
	return typeof value === "object" && value !== null && "schema" in value;
}

/**
 * One level deep - meaning only top fields of the schema
 * The rest represent as JSON string
 */
export class PropertyMapper {
	private referenceResolver: ReferenceResolver;
	private schemaExample: SchemaExample;

	constructor(apiDocument: OpenAPIV3.Document) {
		this.referenceResolver = new ReferenceResolver(apiDocument);
		this.schemaExample = new SchemaExample(apiDocument);
	}

	private GetDefaultValues(
		schema: OpenAPIV3.SchemaObject,
	): Partial<Record<string, unknown>> {
		const schemaType = schema.type || "string";
		return { [schemaType]: SCHEMA_DEFAULTS[schemaType] };
	}

	private GetTypeMapping(schemaType: string): NodePropertyTypes {
		return PROPERTY_TYPE_MAPPING[schemaType] || "string";
	}

	MapFromSchema(schema: IApiSchema): ISchemaPropertyConfig {
		const resolvedSchema =
			this.referenceResolver.Resolve<OpenAPIV3.SchemaObject>(schema);
		const exampleValue = this.schemaExample.extractExample(resolvedSchema);
		const defaultValues = this.GetDefaultValues(resolvedSchema);

		const type = this.GetTypeMapping(resolvedSchema.type || "string");
		const defaultValue =
			exampleValue !== undefined
				? exampleValue
				: defaultValues[resolvedSchema.type || "string"];

		const field: ISchemaPropertyConfig = {
			type,
			default:
				typeof defaultValue === "object"
					? (JSON.stringify(defaultValue, null, 2) as NodeParameterValueType)
					: (defaultValue as NodeParameterValueType),
			description: resolvedSchema.description,
		};

		if (resolvedSchema.enum && resolvedSchema.enum.length > 0) {
			field.type = "options";
			field.options = resolvedSchema.enum.map((value: string) => ({
				name: lodash.startCase(value),
				value,
			}));
			field.default =
				field.default || (resolvedSchema.enum[0] as NodeParameterValueType);
		}

		return field;
	}

	MapFromParameter(
		parameter: OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject,
	): INodeProperties {
		const resolvedParameter =
			this.referenceResolver.Resolve<OpenAPIV3.ParameterObject>(parameter);

		if (!resolvedParameter.name) {
			throw new Error("Parameter name is required");
		}

		let schemaFieldConfig: ISchemaPropertyConfig | undefined;

		if (resolvedParameter.schema) {
			schemaFieldConfig = this.MapFromSchema(resolvedParameter.schema);
		}

		if (!schemaFieldConfig && resolvedParameter.content) {
			const content = FindMatchingKey(
				resolvedParameter.content,
				JSON_CONTENT_PATTERN,
			);
			if (IsContentObject(content)) {
				schemaFieldConfig = this.MapFromSchema(content.schema);
			}
		}

		if (!schemaFieldConfig) {
			throw new Error(
				`Parameter schema or content not found for parameter '${resolvedParameter.name}'`,
			);
		}

		const parameterFieldConfig: Partial<INodeProperties> = {
			displayName: lodash.startCase(resolvedParameter.name),
			name: encodeURIComponent(resolvedParameter.name.replace(/\./g, "-")),
			required: resolvedParameter.required,
			description: resolvedParameter.description,
			default: resolvedParameter.example as NodeParameterValueType,
		};

		const field = MergeProperties(parameterFieldConfig, schemaFieldConfig);

		this.SetParameterRouting(field, resolvedParameter);

		if (!field.required) {
			delete field.required;
		}

		return field;
	}

	private SetParameterRouting(
		field: INodeProperties,
		parameter: OpenAPIV3.ParameterObject,
	): void {
		switch (parameter.in) {
			case "query":
				field.routing = {
					send: {
						type: "query",
						property: parameter.name,
						value: "={{ $value }}" as string,
						propertyInDotNotation: false,
					},
				};
				break;
			case "path":
				field.required = true;
				break;
			case "header":
				field.routing = {
					request: {
						headers: {
							[parameter.name]: "={{ $value }}" as NodeParameterValueType,
						},
					},
				};
				break;
			default:
				throw new Error(`Unknown parameter location '${parameter.in}'`);
		}
	}

	MapFromParameters(
		parameters:
			| (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[]
			| undefined,
	): INodeProperties[] {
		if (!parameters || parameters.length === 0) {
			return [];
		}
		return parameters.map((parameter) => this.MapFromParameter(parameter));
	}

	MapFromSchemaProperty(
		name: string,
		property: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject,
	): INodeProperties {
		const schemaFieldConfig: ISchemaPropertyConfig =
			this.MapFromSchema(property);
		const parameterFieldConfig: Partial<INodeProperties> = {
			displayName: lodash.startCase(name),
			name: name.replace(/\./g, "-"),
		};
		const field = MergeProperties(parameterFieldConfig, schemaFieldConfig);
		return field;
	}

	MapFromRequestBody(
		body: OpenAPIV3.ReferenceObject | OpenAPIV3.RequestBodyObject | undefined,
	): INodeProperties[] {
		if (!body) {
			return [];
		}

		const resolvedBody =
			this.referenceResolver.Resolve<OpenAPIV3.RequestBodyObject>(body);
		const content = FindMatchingKey(resolvedBody.content, JSON_CONTENT_PATTERN);

		if (!IsContentObject(content)) {
			throw new Error(`No '${JSON_CONTENT_PATTERN}' content found`);
		}

		const requestBodySchema = content.schema;
		const schema =
			this.referenceResolver.Resolve<OpenAPIV3.SchemaObject>(requestBodySchema);

		if (
			!schema.properties &&
			schema.type !== "object" &&
			schema.type !== "array"
		) {
			throw new Error(
				`Request body schema type '${schema.type || "unknown"}' not supported`,
			);
		}

		const fields: INodeProperties[] = [];

		if (schema.type === "array" && schema.items) {
			const innerSchema =
				this.referenceResolver.Resolve<OpenAPIV3.SchemaObject>(schema.items);
			const fieldPropertyKeys = this.MapFromSchemaProperty("body", innerSchema);
			const fieldDefaults: Partial<INodeProperties> = {
				required: !!schema.required,
			};
			const field = MergeProperties(fieldDefaults, fieldPropertyKeys);
			field.routing = {
				request: {
					body: "={{ JSON.parse($value) }}" as NodeParameterValueType,
				},
			};
			fields.push(field);
		}

		if (schema.properties) {
			for (const key in schema.properties) {
				const property = schema.properties[key];
				const fieldPropertyKeys = this.MapFromSchemaProperty(key, property);
				const fieldDefaults: Partial<INodeProperties> = {
					required: schema.required?.includes(key) ?? false,
				};
				const field = MergeProperties(fieldDefaults, fieldPropertyKeys);

				field.routing = {
					send: {
						property: key,
						propertyInDotNotation: false,
						type: "body",
						value:
							field.type === "json"
								? "={{ JSON.parse($value) }}"
								: "={{ $value }}",
					},
				};

				fields.push(field);
			}
		}

		return fields;
	}
}
