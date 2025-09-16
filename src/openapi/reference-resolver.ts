import * as lodash from "lodash";
import type { OpenAPIV3 } from "openapi-types";

export class ReferenceResolver {
	constructor(private apiDocument: OpenAPIV3.Document) {}

	ResolveRef<T>(schema: OpenAPIV3.ReferenceObject | T): [T, string[]?] {
		// @ts-expect-error
		if ("properties" in schema) {
			return [schema as T, undefined];
		}
		// @ts-expect-error
		if ("oneOf" in schema) {
			// @ts-expect-error
			schema = schema.oneOf[0];
		}
		// @ts-expect-error
		if ("anyOf" in schema) {
			// @ts-expect-error
			schema = schema.anyOf[0];
		}
		// @ts-expect-error
		if ("allOf" in schema) {
			// @ts-expect-error
			const results = schema.allOf.map((s) => this.ResolveRef(s));
			const schemas = results.map(
				(r: [OpenAPIV3.SchemaObject, string[]?]) => r[0],
			);
			const refs = results.map(
				(r: [OpenAPIV3.SchemaObject, string[]?]) => r[1],
			);
			const refsFlat = lodash.flatten<string>(refs);
			const object = Object.assign({}, ...schemas);
			return [object as T, refsFlat];
		}
		// @ts-expect-error
		if ("$ref" in schema) {
			const schemaResolved = this.FindRef(schema.$ref);
			const { $ref, ...rest } = schema;
			Object.assign(rest, schemaResolved);
			return [rest as T, [$ref]];
		}
		return [schema as T, undefined];
	}

	Resolve<T>(schema: OpenAPIV3.ReferenceObject | T): T {
		return this.ResolveRef(schema)[0];
	}

	private FindRef(ref: string): OpenAPIV3.SchemaObject {
		const refPath = ref.split("/").slice(1);
		let schema: OpenAPIV3.Document | OpenAPIV3.SchemaObject = this.apiDocument;
		for (const path of refPath) {
			schema = (schema as Record<string, unknown>)[path] as
				| OpenAPIV3.Document
				| OpenAPIV3.SchemaObject;
			if (!schema) {
				throw new Error(`Schema not found for ref '${ref}'`);
			}
		}
		if ("$ref" in schema) {
			return this.FindRef(schema.$ref as string);
		}
		return schema;
	}
}
