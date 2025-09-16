import * as lodash from "lodash";
import type { OpenAPIV3 } from "openapi-types";
import type { IResourceParser } from "../types/resource-parser";

/**
 * Default implementation of IResourceParser for parsing OpenAPI tags
 * It will use tag name as name and value and description as description
 * @class ResourceParser
 * @implements {IResourceParser}
 */
export class ResourceParser implements IResourceParser {
	/**
	 * Gets the display name of the resource
	 * @param tag - The OpenAPI tag object
	 * @returns The display name for the resource
	 */
	GetName(tag: OpenAPIV3.TagObject): string {
		return lodash.startCase(tag.name);
	}

	/**
	 * Gets the value of the resource
	 * @param tag - The OpenAPI tag object with at least the name property
	 * @returns The value for the resource (sanitized name without emojis)
	 */
	GetValue(tag: Pick<OpenAPIV3.TagObject, "name">): string {
		// Remove emojis and spaces from the value but keep them in the name
		const nameWithoutEmojis = tag.name
			.replace(
				/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}\u{2022}\u{2B50}\u{2B55}]+/gu,
				"",
			)
			.replace(/[\u{FE0F}\u{200D}]+/gu, "")
			.trim();
		return lodash.startCase(nameWithoutEmojis);
	}

	/**
	 * Gets the description of the resource
	 * @param tag - The OpenAPI tag object
	 * @returns The description for the resource
	 */
	GetDescription(tag: OpenAPIV3.TagObject): string {
		return tag.description || "";
	}

	// Legacy methods for backward compatibility
	/** @deprecated Use GetName instead */
	name(tag: OpenAPIV3.TagObject): string {
		return this.GetName(tag);
	}

	/** @deprecated Use GetValue instead */
	value(tag: Pick<OpenAPIV3.TagObject, "name">): string {
		return this.GetValue(tag);
	}

	/** @deprecated Use GetDescription instead */
	description(tag: OpenAPIV3.TagObject): string {
		return this.GetDescription(tag);
	}
}
