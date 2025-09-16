import * as lodash from "lodash";
import type { OpenAPIV3 } from "openapi-types";
import {
	type IPropertyOverride,
	PropertiesBuilder,
} from "../src/core/properties-builder";
import type { IOperationContext } from "../src/openapi/openapi-visitor";
import { OperationParser } from "../src/parsers/operation-parser";
import { ResourceParser } from "../src/parsers/resource-parser";

// Test fixtures
const TEST_PATHS = {
	"/api/entities": {
		get: {
			operationId: "EntityController_list",
			summary: "List all entities",
			parameters: [
				{
					name: "all",
					required: false,
					in: "query",
					example: false,
					description: "Boolean flag description",
					schema: {
						type: "boolean",
					},
				},
			],
			tags: ["🖥️ Entity"],
		},
	},
};

const TEST_COMPONENTS = {
	schemas: {
		Entity: {
			type: "object",
			properties: {
				name: {
					type: "string",
					maxLength: 54,
					example: "default",
					description: "Entity name",
				},
				start: {
					type: "boolean",
					description: "Boolean flag description",
					example: true,
					default: true,
				},
				config: {
					$ref: "#/components/schemas/EntityConfig",
				},
			},
			required: ["name"],
		},
		EntityConfig: {
			type: "object",
			properties: {
				foo: {
					type: "string",
					example: "bar",
				},
			},
		},
	},
};

// Custom parsers for testing
class CustomOperationParser extends OperationParser {
	name(
		operation: OpenAPIV3.OperationObject,
		_context: IOperationContext,
	): string {
		if (!operation.operationId) {
			return "Unknown Operation";
		}

		let operationId = operation.operationId.split("_").slice(1).join("_");
		if (!operationId) {
			operationId = operation.operationId;
		}
		return lodash.startCase(operationId);
	}

	value(
		operation: OpenAPIV3.OperationObject,
		_context: IOperationContext,
	): string {
		return this.name(operation, _context);
	}

	action(
		operation: OpenAPIV3.OperationObject,
		_context: IOperationContext,
	): string {
		return operation.summary || this.name(operation, _context);
	}

	description(
		operation: OpenAPIV3.OperationObject,
		_context: IOperationContext,
	): string {
		return operation.description || operation.summary || "";
	}
}

class CustomResourceParser extends ResourceParser {
	value(tag: OpenAPIV3.TagObject): string {
		return lodash.startCase(tag.name.replace(/[^a-zA-Z0-9_-]/g, ""));
	}
}

// Helper functions
function createParser(
	paths: Record<string, unknown> = TEST_PATHS,
	components?: Record<string, unknown>,
): PropertiesBuilder {
	return new PropertiesBuilder(
		{ paths, ...(components ? { components } : {}) } as OpenAPIV3.Document,
		{
			operation: new CustomOperationParser(),
			resource: new CustomResourceParser(),
		},
	);
}

describe("N8NPropertiesBuilder - Query Parameters", () => {
	test("should handle query parameter with schema", () => {
		const parser = createParser();
		const result = parser.Build();

		expect(result).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					displayName: "All",
					name: "all",
					type: "boolean",
					default: false,
					description: "Boolean flag description",
					routing: {
						send: {
							property: "all",
							propertyInDotNotation: false,
							type: "query",
							value: "={{ $value }}",
						},
					},
				}),
			]),
		);
	});

	test("should handle query parameter with content", () => {
		const paths = {
			"/api/entities": {
				get: {
					operationId: "EntityController_list",
					summary: "List all entities",
					parameters: [
						{
							name: "filter",
							required: false,
							in: "query",
							example: false,
							description: "Filter description",
							content: {
								"application/json": {
									schema: {
										$ref: "#/components/schemas/Entity",
									},
								},
							},
						},
					],
					tags: ["🖥️ Entity"],
				},
			},
		};

		const parser = createParser(paths, TEST_COMPONENTS);
		const result = parser.Build();

		expect(result).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					displayName: "Filter",
					name: "filter",
					type: "json",
					default: false,
					description: "Filter description",
					routing: {
						send: {
							property: "filter",
							propertyInDotNotation: false,
							type: "query",
							value: "={{ $value }}",
						},
					},
				}),
			]),
		);
	});

	test("should handle dot notation in parameter names", () => {
		const paths = {
			"/api/entities": {
				get: {
					operationId: "EntityController_list",
					summary: "List all entities",
					parameters: [
						{
							name: "filter.entities.all",
							required: false,
							in: "query",
							example: false,
							description: "Boolean flag description",
							schema: {
								type: "boolean",
							},
						},
					],
					tags: ["🖥️ Entity"],
				},
			},
		};

		const parser = createParser(paths);
		const result = parser.Build();

		expect(result).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					displayName: "Filter Entities All",
					name: "filter-entities-all",
					type: "boolean",
					default: false,
					description: "Boolean flag description",
					routing: {
						send: {
							property: "filter.entities.all",
							propertyInDotNotation: false,
							type: "query",
							value: "={{ $value }}",
						},
					},
				}),
			]),
		);
	});
});

describe("N8NPropertiesBuilder - Path Parameters", () => {
	test("should handle path parameters", () => {
		const paths = {
			"/api/entities/{entity}": {
				get: {
					operationId: "EntityController_get",
					summary: "Get entity",
					parameters: [
						{
							name: "entity",
							required: true,
							in: "path",
							schema: {
								default: "default",
							},
							description: "Entity <code>name</code>",
						},
					],
					tags: ["🖥️ Entity"],
				},
			},
		};

		const parser = createParser(paths);
		const result = parser.Build();

		expect(result).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					displayName: "Entity",
					name: "entity",
					type: "string",
					default: "default",
					required: true,
					description: "Entity <code>name</code>",
				}),
			]),
		);
	});
});

describe("N8NPropertiesBuilder - Request Body", () => {
	test("should handle request body with schema references", () => {
		const paths = {
			"/api/entities": {
				post: {
					operationId: "EntityController_create",
					summary: "Create entity",
					requestBody: {
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/Entity",
								},
							},
						},
					},
					tags: ["🖥️ Entity"],
				},
			},
		};

		const parser = createParser(paths, TEST_COMPONENTS);
		const result = parser.Build();

		expect(result).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					displayName: "Name",
					name: "name",
					type: "string",
					default: "default",
					required: true,
					description: "Entity name",
					routing: {
						send: {
							property: "name",
							propertyInDotNotation: false,
							type: "body",
							value: "={{ $value }}",
						},
					},
				}),
				expect.objectContaining({
					displayName: "Start",
					name: "start",
					type: "boolean",
					default: true,
					description: "Boolean flag description",
					routing: {
						send: {
							property: "start",
							propertyInDotNotation: false,
							type: "body",
							value: "={{ $value }}",
						},
					},
				}),
				expect.objectContaining({
					displayName: "Config",
					name: "config",
					type: "json",
					default: JSON.stringify({ foo: "bar" }, null, 2),
					routing: {
						send: {
							property: "config",
							propertyInDotNotation: false,
							type: "body",
							value: "={{ JSON.parse($value) }}",
						},
					},
				}),
			]),
		);
	});

	test("should handle enum schemas", () => {
		const paths = {
			"/api/entities": {
				post: {
					operationId: "EntityController_create",
					summary: "Create entity",
					requestBody: {
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										type: {
											type: "string",
											enum: ["type1", "type2"],
										},
									},
									required: ["type"],
								},
							},
						},
					},
					tags: ["🖥️ Entity"],
				},
			},
		};

		const parser = createParser(paths);
		const result = parser.Build();

		expect(result).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					displayName: "Type",
					name: "type",
					type: "options",
					default: "type1",
					required: true,
					options: [
						{ name: "Type 1", value: "type1" },
						{ name: "Type 2", value: "type2" },
					],
					routing: {
						send: {
							property: "type",
							propertyInDotNotation: false,
							type: "body",
							value: "={{ $value }}",
						},
					},
				}),
			]),
		);
	});

	test("should handle array body parameters", () => {
		const paths = {
			"/api/entities": {
				post: {
					operationId: "EntityController_create",
					summary: "Create entity",
					requestBody: {
						content: {
							"application/json": {
								schema: {
									type: "array",
									items: {
										type: "string",
									},
								},
							},
						},
					},
					tags: ["🖥️ Entity"],
				},
			},
		};

		const parser = createParser(paths);
		const result = parser.Build();

		expect(result).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					displayName: "Body",
					name: "body",
					type: "string",
					routing: {
						request: {
							body: "={{ JSON.parse($value) }}",
						},
					},
				}),
			]),
		);
	});
});

describe("N8NPropertiesBuilder - Overrides", () => {
	test("should handle property overrides", () => {
		const paths = {
			"/api/entities": {
				post: {
					operationId: "EntityController_create",
					summary: "Create entity",
					requestBody: {
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/Entity",
								},
							},
						},
					},
					tags: ["🖥️ Entity"],
				},
			},
		};

		const customDefaults: IPropertyOverride[] = [
			{
				find: {
					name: "config",
					displayOptions: {
						show: {
							resource: ["Entity"],
							operation: ["Create"],
						},
					},
				},
				replace: {
					default: "={{ $json.config }}",
				},
			},
		];

		const parser = createParser(paths, TEST_COMPONENTS);
		const result = parser.Build(customDefaults);

		expect(result).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					displayName: "Config",
					name: "config",
					type: "json",
					default: "={{ $json.config }}",
				}),
			]),
		);
	});
});

describe("N8NPropertiesBuilder - Multiple Tags", () => {
	test("should handle multiple tags", () => {
		const paths = {
			"/api/entities": {
				get: {
					operationId: "EntityController_list",
					summary: "List all entities",
					parameters: [
						{
							name: "all",
							required: false,
							in: "query",
							example: false,
							description: "Boolean flag description",
							schema: {
								type: "boolean",
							},
						},
					],
					tags: ["🖥️ Entity", "Another Tag"],
				},
			},
		};

		const parser = createParser(paths);
		const result = parser.Build();

		const resourceField = result.find((field) => field.name === "resource");
		expect(resourceField?.options).toHaveLength(2);
		expect(resourceField?.options).toEqual(
			expect.arrayContaining([
				{ name: "🖥️ Entity", value: "Entity", description: "" },
				{ name: "Another Tag", value: "Another Tag", description: "" },
			]),
		);
	});

	test("should handle empty tags with default", () => {
		const paths = {
			"/api/entities": {
				get: {
					operationId: "EntityController_list",
					summary: "List all entities",
					parameters: [
						{
							name: "all",
							required: false,
							in: "query",
							example: false,
							description: "Boolean flag description",
							schema: {
								type: "boolean",
							},
						},
					],
					tags: [],
				},
			},
		};

		const parser = createParser(paths);
		const result = parser.Build();

		const resourceField = result.find((field) => field.name === "resource");
		expect(resourceField?.options).toEqual([
			{ name: "Default", value: "Default", description: "" },
		]);
	});
});

describe("N8NPropertiesBuilder - Edge Cases", () => {
	test("should handle missing operationId", () => {
		const paths = {
			"/api/entities": {
				get: {
					summary: "List all entities",
					parameters: [],
					tags: ["🖥️ Entity"],
				},
			},
		};

		const parser = createParser(paths);
		const result = parser.Build();

		expect(result).toBeDefined();
	});

	test("should handle missing parameters", () => {
		const paths = {
			"/api/entities": {
				get: {
					operationId: "EntityController_list",
					summary: "List all entities",
					tags: ["🖥️ Entity"],
				},
			},
		};

		const parser = createParser(paths);
		const result = parser.Build();

		expect(result).toBeDefined();
	});

	test("should handle missing requestBody", () => {
		const paths = {
			"/api/entities": {
				post: {
					operationId: "EntityController_create",
					summary: "Create entity",
					tags: ["🖥️ Entity"],
				},
			},
		};

		const parser = createParser(paths);
		const result = parser.Build();

		expect(result).toBeDefined();
	});
});

describe("N8NPropertiesBuilder - Output Structure", () => {
	test("should include resource field with options", () => {
		const parser = createParser();
		const result = parser.Build();

		const resourceField = result.find((field) => field.name === "resource");
		expect(resourceField).toBeDefined();
		expect(resourceField?.type).toBe("options");
		expect(resourceField?.options).toHaveLength(1);
	});

	test("should include operation field with options", () => {
		const parser = createParser();
		const result = parser.Build();

		const operationField = result.find((field) => field.name === "operation");
		expect(operationField).toBeDefined();
		expect(operationField?.type).toBe("options");
		expect(operationField?.noDataExpression).toBe(true);
	});

	test("should include notice field for HTTP method", () => {
		const parser = createParser();
		const result = parser.Build();

		const noticeField = result.find(
			(field) =>
				field.type === "notice" && field.displayName === "GET /api/entities",
		);
		expect(noticeField).toBeDefined();
		expect(noticeField?.typeOptions?.theme).toBe("info");
	});
});
