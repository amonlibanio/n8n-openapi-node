# @amonlibanio/n8n-openapi-node

Convert OpenAPI v3 specifications into n8n node properties.

[![npm version](https://img.shields.io/npm/v/@amonlibanio/n8n-openapi-node.svg)](https://www.npmjs.com/package/@amonlibanio/n8n-openapi-node)

## Installation

```bash
npm install @amonlibanio/n8n-openapi-node
```

## Usage

1. Add your OpenAPI specification file to your project
2. Generate n8n node properties:

```typescript
import { PropertiesBuilder } from '@amonlibanio/n8n-openapi-node';
import * as doc from './openapi.json';
import type { OpenAPIV3 } from 'openapi-types';

const parser = new PropertiesBuilder(doc as OpenAPIV3.Document);
const properties = parser.Build();

// Use properties in your n8n node
export class MyNode implements INodeType {
  description: INodeTypeDescription = {
    // ... other properties
    properties: properties, // Generated properties
  };
}
```

## What it generates

- **Resources** from OpenAPI tags
- **Operations** from OpenAPI operations (actions in n8n)
- **Parameters** (query, path, header)
- **Request body** fields
- **Response** handling

## Customization

### Custom Parsers

```typescript
import { PropertiesBuilder, IBuilderConfig, ResourceParser, OperationParser } from '@amonlibanio/n8n-openapi-node';
import type { OpenAPIV3 } from 'openapi-types';

// Custom resource parser
class CustomResourceParser extends ResourceParser {
  GetName(tag: OpenAPIV3.TagObject): string {
    return tag['x-display-name'] || super.GetName(tag);
  }
}

// Custom operation parser
class CustomOperationParser extends OperationParser {
  ShouldSkip(operation: OpenAPIV3.OperationObject): boolean {
    // Skip internal operations
    return operation.tags?.includes('internal') || super.ShouldSkip(operation);
  }
}

const config: IBuilderConfig = {
  resource: new CustomResourceParser(),
  operation: new CustomOperationParser(),
};

const parser = new PropertiesBuilder(doc as OpenAPIV3.Document, config);
const properties = parser.Build();
```

### Property Overrides

Override specific properties after generation:

```typescript
const overrides = [
  {
    find: { name: 'session', type: 'string' },
    replace: { default: '={{ $json.session }}' }
  },
  {
    find: { name: 'apiKey', type: 'string' },
    replace: { 
      default: '={{ $credentials.apiKey }}',
      required: true 
    }
  }
];

const properties = parser.Build(overrides);
```

## Examples

### Basic Usage

```typescript
import { PropertiesBuilder } from '@amonlibanio/n8n-openapi-node';
import * as openApiSpec from './api-spec.json';
import type { OpenAPIV3 } from 'openapi-types';

// Generate properties from OpenAPI spec
const builder = new PropertiesBuilder(openApiSpec as OpenAPIV3.Document);
const properties = builder.Build();

// Use in your n8n node
export class MyApiNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'My API',
    name: 'myApi',
    group: ['transform'],
    version: 1,
    properties: properties, // Generated properties
    // ... other node configuration
  };
}
```

### Custom Parsers

```typescript
import { PropertiesBuilder, IBuilderConfig, ResourceParser, OperationParser } from '@amonlibanio/n8n-openapi-node';
import type { OpenAPIV3 } from 'openapi-types';

// Custom resource parser
class CustomResourceParser extends ResourceParser {
  GetName(tag: OpenAPIV3.TagObject): string {
    return tag['x-display-name'] || super.GetName(tag);
  }
}

// Custom operation parser
class CustomOperationParser extends OperationParser {
  ShouldSkip(operation: OpenAPIV3.OperationObject): boolean {
    // Skip internal operations
    return operation.tags?.includes('internal') || super.ShouldSkip(operation);
  }
}

// Use custom parsers
const config: IBuilderConfig = {
  resource: new CustomResourceParser(),
  operation: new CustomOperationParser(),
};

const builder = new PropertiesBuilder(openApiSpec as OpenAPIV3.Document, config);
const properties = builder.Build();
```

### Property Overrides

```typescript
// Override specific properties
const overrides = [
  {
    find: { name: 'apiKey', type: 'string' },
    replace: { 
      default: '={{ $credentials.apiKey }}',
      required: true 
    }
  },
  {
    find: { name: 'userId', type: 'number' },
    replace: { 
      default: '={{ $json.id }}',
      displayName: 'User ID' 
    }
  }
];

const properties = builder.Build(overrides);
```

## FAQ

**OpenAPI v2?** Convert to v3 at [editor.swagger.io](https://editor.swagger.io)

**YAML spec?** Convert to JSON at [editor.swagger.io](https://editor.swagger.io)

**Issues?** Open a [GitHub issue](https://github.com/amonlibanio/n8n-openapi-node/issues) with your spec file.
