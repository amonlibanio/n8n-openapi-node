import type { OpenAPIV3 } from "openapi-types";
import { ReferenceResolver } from "./reference-resolver";

class SchemaExampleBuilder {
	private visitedRefs: Set<string> = new Set<string>();

	constructor(private resolver: ReferenceResolver) {}

	build(
		schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject,
	): Record<string, unknown> | undefined {
		let refs: string[] | undefined;
		[schema, refs] = this.resolver.ResolveRef(schema);

		if (refs) {
			// Prevent infinite recursion
			for (const ref of refs) {
				if (this.visitedRefs.has(ref)) {
					return {};
				}
				this.visitedRefs.add(ref);
			}
		}
		if ("oneOf" in schema) {
			return this.build(
				schema.oneOf?.[0] as OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject,
			);
		}
		if ("allOf" in schema) {
			const examples = schema.allOf?.map((s) => this.build(s));
			return Object.assign({}, ...(examples ?? []));
		}
		if ("example" in schema && schema.example !== undefined) {
			return schema.example;
		}
		if ("default" in schema && schema.default !== undefined) {
			return schema.default;
		}
		if ("properties" in schema && schema.properties) {
			const obj: Record<string, unknown> = {};
			for (const key in schema.properties) {
				obj[key] = this.build(schema.properties[key]);
			}
			return obj;
		}
		if ("items" in schema && schema.items) {
			return this.build(
				schema.items as OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject,
			);
		}
		return undefined;
	}
}

export class SchemaExample {
	private resolver: ReferenceResolver;

	constructor(doc: OpenAPIV3.Document) {
		this.resolver = new ReferenceResolver(doc);
	}

	extractExample(
		schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject,
	): Record<string, unknown> | undefined {
		return new SchemaExampleBuilder(this.resolver).build(schema);
	}
}
