import type { OpenAPIV3 } from "openapi-types";

/**
 * Interface for parsing OpenAPI tags into n8n resource properties
 * @interface IResourceParser
 */
export interface IResourceParser {
	/**
	 * Gets the display name of the resource (e.g. "User")
	 * @param tag - The OpenAPI tag object
	 * @returns The display name for the resource
	 */
	GetName(tag: OpenAPIV3.TagObject): string;

	/**
	 * Gets the value of the resource (e.g. "user")
	 * @param tag - The OpenAPI tag object with at least the name property
	 * @returns The value for the resource
	 * @note - will be used on operations as well, only "name" will be available for that
	 */
	GetValue(tag: Pick<OpenAPIV3.TagObject, "name">): string;

	/**
	 * Gets the description of the resource
	 * @param tag - The OpenAPI tag object
	 * @returns The description for the resource
	 */
	GetDescription(tag: OpenAPIV3.TagObject): string;

	// Legacy methods for backward compatibility
	/** @deprecated Use GetName instead */
	name?(tag: OpenAPIV3.TagObject): string;
	/** @deprecated Use GetValue instead */
	value?(tag: Pick<OpenAPIV3.TagObject, "name">): string;
	/** @deprecated Use GetDescription instead */
	description?(tag: OpenAPIV3.TagObject): string;
}
