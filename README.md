# @alibsoft/n8n-openapi-node

🚀 **Transform OpenAPI v3 specifications into n8n node properties with zero configuration**

A powerful TypeScript library that automatically converts your OpenAPI documentation into fully functional n8n node properties. Save hours of manual coding and ensure your custom n8n nodes stay in sync with your API documentation.

[![npm version](https://img.shields.io/npm/v/@alibsoft/n8n-openapi-node.svg)](https://www.npmjs.com/package/@alibsoft/n8n-openapi-node)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🔄 **Automatic Conversion** - Transform OpenAPI specs to n8n properties instantly
- 🏗️ **Smart Structure** - Automatically generates resources, operations, and parameters
- 🔧 **Highly Customizable** - Extend with custom parsers and property overrides
- 📝 **TypeScript Support** - Full type safety and IntelliSense support
- 🎯 **Production Ready** - Battle-tested with real-world APIs

## 🚀 Quick Start

### Installation

```bash
npm install @alibsoft/n8n-openapi-node
```

### Basic Usage

1. Add your OpenAPI specification file to your project
2. Generate n8n node properties with just a few lines of code:

```typescript
import { PropertiesBuilder } from '@alibsoft/n8n-openapi-node';
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

## 📋 What It Generates

The library intelligently converts your OpenAPI v3 specification into complete n8n node properties:

- **🏷️ Resources** - Automatically created from OpenAPI tags
- **⚡ Operations** - All API operations become n8n actions
- **🔧 Parameters** - Query, path, and header parameters with proper validation
- **📦 Request Body** - Complex object structures with nested fields
- **🎯 Response Handling** - Proper field routing and data mapping
- **📝 Documentation** - Descriptions and examples from your spec

## 🛠️ Advanced Customization

### Custom Parsers

Extend the library with custom parsers to handle specific API patterns or requirements:

```typescript
import { PropertiesBuilder, IBuilderConfig, ResourceParser, OperationParser } from '@alibsoft/n8n-openapi-node';
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

Fine-tune generated properties with targeted overrides:

```typescript
import type { IPropertyOverride } from '@alibsoft/n8n-openapi-node';

// Add dynamic defaults and custom validation
const overrides: IPropertyOverride[] = [
  {
    find: { name: 'session', type: 'string' },
    replace: {
      default: '={{ $json.session }}',
      description: 'User session token from previous request'
    }
  },
  {
    find: { name: 'apiKey', type: 'string' },
    replace: {
      required: true,
      default: '={{ $credentials.apiKey }}',
      description: 'API authentication key'
    }
  }
];

const properties = parser.Build(overrides);
```

## 📚 Real-World Examples

### Basic API Integration

Here's how to integrate with a typical REST API:

```typescript
import { PropertiesBuilder } from '@alibsoft/n8n-openapi-node';
import * as openApiSpec from './api-spec.json';
import type { OpenAPIV3 } from 'openapi-types';
import type { INodeType, INodeTypeDescription } from 'n8n-workflow';

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
    properties: properties,
    defaults: {
      name: 'My API'
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'myApiAuth',
        required: true
      }
    ]
  };
}
```

### Custom Parsers

```typescript
import { PropertiesBuilder, IBuilderConfig, ResourceParser, OperationParser } from '@alibsoft/n8n-openapi-node';
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
import type { IPropertyOverride } from '@alibsoft/n8n-openapi-node';

// Override specific properties
const overrides: IPropertyOverride[] = [
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

## ❓ Frequently Asked Questions

### Common Questions

**Q: Can I use OpenAPI v2 specifications?**
A: Yes! Convert your v2 spec to v3 using [editor.swagger.io](https://editor.swagger.io) first.

**Q: Does it support YAML specifications?**
A: The library works with JSON, but you can easily convert YAML to JSON using [editor.swagger.io](https://editor.swagger.io).

**Q: How do I handle authentication?**
A: Use property overrides to add credential references:
```typescript
const overrides: IPropertyOverride[] = [
  {
    find: { name: 'authorization' },
    replace: {
      default: '={{ $credentials.apiKey }}',
      required: true
    }
  }
];
```

### Troubleshooting

**Issue: Generated properties are empty**
- Ensure your OpenAPI spec has `paths` defined
- Check that operations have `tags` specified
- Verify your spec is valid OpenAPI v3

**Issue: Type errors in TypeScript**
- Make sure to cast your spec: `as OpenAPIV3.Document`
- Install `openapi-types` package: `npm install openapi-types`

**Issue: Missing parameters or fields**
- Check that your schema objects have proper `type` definitions
- Verify `$ref` references are valid
- Ensure required fields are listed in `required` arrays

### Getting Help

- 📚 **Documentation**: Check the [GitHub Wiki](https://github.com/alibsoft/n8n-openapi-node/wiki)
- 🐛 **Bug Reports**: Open a [GitHub issue](https://github.com/alibsoft/n8n-openapi-node/issues) with your spec file
- 💬 **Discussions**: Join our [GitHub Discussions](https://github.com/alibsoft/n8n-openapi-node/discussions)
- 📧 **Support**: Email support@alibsoft.com

---

## 📄 License

MIT License - see [LICENSE](https://github.com/alibsoft/n8n-openapi-node/blob/main/LICENSE) for details.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/alibsoft/n8n-openapi-node/blob/main/CONTRIBUTING.md) for details.

---

Made with ❤️ by [Alibsoft](https://github.com/alibsoft)
