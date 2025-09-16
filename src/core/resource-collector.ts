import type { INodeProperties } from "n8n-workflow";
import type { OpenAPIV3 } from "openapi-types";
import type {
	IOpenApiVisitor,
	IOperationContext,
} from "../openapi/openapi-visitor";
import type { IResourceParser } from "../types/resource-parser";
import type { TagObject } from "../types/tag-object";


/**
 * Collector for gathering resource information from OpenAPI tags and converting them to n8n node properties
 * @class ResourceCollector
 * @implements {IOpenApiVisitor}
 */
export class ResourceCollector implements IOpenApiVisitor {
	private tags: Map<string, TagObject>;
	private tagsOrder = new Map<string, number>();

	constructor(protected resourceParser: IResourceParser) {
		this.tags = new Map<string, TagObject>();
	}

	private name(tag: TagObject): string {
		return this.resourceParser.GetName(tag);
	}

	private value(tag: TagObject): string {
		return this.resourceParser.GetValue(tag);
	}

	private description(tag: TagObject): string {
		return this.resourceParser.GetDescription(tag);
	}

	get resources(): INodeProperties {
		const tags = this.sortedTags;
		const _parser = this.resourceParser;
		const options = tags.map((tag) => {
			return {
				name: this.name(tag),
				value: this.value(tag),
				description: this.description(tag),
			};
		});
		return {
			displayName: "Resource",
			name: "resource",
			type: "options",
			noDataExpression: true,
			options: options,
			default: "",
		};
	}

	private get sortedTags() {
		const tags = Array.from(this.tags.values());
		tags.sort((a, b) => {
			return (
				(this.tagsOrder.get(a.name) ?? 0) - (this.tagsOrder.get(b.name) ?? 0)
			);
		});
		
		if (!this.tagsOrder.has("default")) {
			const defaultTag = tags.find((tag) => tag.name === "default");
			if (defaultTag) {
				tags.splice(tags.indexOf(defaultTag), 1);
				tags.push(defaultTag);
			}
		}
		return tags;
	}

	visitOperation(
		operation: OpenAPIV3.OperationObject,
		_context: IOperationContext,
	) {
		const tags = operation.tags as string[];
		if (tags.length === 0) {
			// Add default tag when no tags are specified
			this.addTagByName("Default");
		} else {
			tags.forEach((tag) => {
				this.addTagByName(tag);
			});
		}
	}

	private addTagByName(tag: string) {
		// insert if not found
		if (!this.tags.has(tag)) {
			this.tags.set(tag, {
				name: tag,
				description: "",
			});
		}
	}

	visitTag(tag: OpenAPIV3.TagObject): void {
		const name = tag.name;
		this.tags.set(name, {
			name: name,
			description: tag.description || "",
		});
		this.tagsOrder.set(name, this.tagsOrder.size);
	}
}
