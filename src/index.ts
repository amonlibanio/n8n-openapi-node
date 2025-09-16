/**
 * @alibsoft/n8n-openapi-node
 * 
 * A TypeScript library for converting OpenAPI v3 specifications into n8n node properties.
 * This library provides tools to parse OpenAPI documents and generate the necessary
 * configuration for creating n8n community nodes.
 * 
 * @packageDocumentation
 */

import {
	type IBuilderConfig,
	type IPropertyOverride,
	PropertiesBuilder,
} from "./core/properties-builder";
import { OpenApiParser } from "./openapi/openapi-parser";
import type {
	IOpenApiVisitor,
	IOperationContext,
} from "./openapi/openapi-visitor";
import {
	type IOperationParser,
	OperationParser,
} from "./parsers/operation-parser";
import { OperationCollector as OperationsCollector } from "./parsers/operations-collector";
import { ResourceCollector } from "./parsers/resource-collector";
import {
	type IResourceParser,
	ResourceParser,
} from "./parsers/resource-parser";

export {
	type IBuilderConfig,
	PropertiesBuilder,
	type IOpenApiVisitor,
	OpenApiParser,
	type IOperationContext,
	type IOperationParser,
	OperationParser,
	OperationsCollector,
	type IResourceParser,
	ResourceParser,
	type IPropertyOverride,
	ResourceCollector,
};
