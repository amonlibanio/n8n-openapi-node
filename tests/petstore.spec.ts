import type { INodeProperties } from "n8n-workflow";
import type { OpenAPIV3 } from "openapi-types";
import { PropertiesBuilder } from "../src/core/properties-builder";

describe("Petstore API Integration Tests", () => {
	let doc: OpenAPIV3.Document;
	let parser: PropertiesBuilder;
	let result: INodeProperties[];

	beforeAll(() => {
		doc = require("./samples/petstore.json");
		parser = new PropertiesBuilder(doc, {});
		result = parser.Build();
	});

	test("should generate resource options with Pet, Store, and User", () => {
		const resourceField = result.find((field) => field.name === "resource");
		expect(resourceField).toBeDefined();
		expect(resourceField?.type).toBe("options");
		expect(resourceField?.options).toHaveLength(3);
		expect(resourceField?.options).toEqual(
			expect.arrayContaining([
				{
					name: "Pet",
					value: "Pet",
					description: "Everything about your Pets",
				},
				{
					name: "Store",
					value: "Store",
					description: "Access to Petstore orders",
				},
				{ name: "User", value: "User", description: "Operations about user" },
			]),
		);
	});

	test("should generate Pet operations correctly", () => {
		const petOperations = result.find(
			(field) =>
				field.name === "operation" &&
				field.displayOptions?.show?.resource?.includes("Pet"),
		);

		expect(petOperations).toBeDefined();
		expect(petOperations?.type).toBe("options");
		expect(petOperations?.options).toHaveLength(8);

		const operationNames =
			petOperations?.options?.map((opt) => ("value" in opt ? opt.value : "")) ||
			[];
		expect(operationNames).toEqual(
			expect.arrayContaining([
				"Update Pet",
				"Add Pet",
				"Find Pets By Status",
				"Find Pets By Tags",
				"Get Pet By Id",
				"Update Pet With Form",
				"Delete Pet",
				"Upload File",
			]),
		);
	});

	test("should generate Store operations correctly", () => {
		const storeOperations = result.find(
			(field) =>
				field.name === "operation" &&
				field.displayOptions?.show?.resource?.includes("Store"),
		);

		expect(storeOperations).toBeDefined();
		expect(storeOperations?.type).toBe("options");
		expect(storeOperations?.options).toHaveLength(4);

		const operationNames =
			storeOperations?.options?.map((opt) =>
				"value" in opt ? opt.value : "",
			) || [];
		expect(operationNames).toEqual(
			expect.arrayContaining([
				"Get Inventory",
				"Place Order",
				"Get Order By Id",
				"Delete Order",
			]),
		);
	});

	test("should generate User operations correctly", () => {
		const userOperations = result.find(
			(field) =>
				field.name === "operation" &&
				field.displayOptions?.show?.resource?.includes("User"),
		);

		expect(userOperations).toBeDefined();
		expect(userOperations?.type).toBe("options");
		expect(userOperations?.options).toHaveLength(7);

		const operationNames =
			userOperations?.options?.map((opt) =>
				"value" in opt ? opt.value : "",
			) || [];
		expect(operationNames).toEqual(
			expect.arrayContaining([
				"Create User",
				"Create Users With List Input",
				"Login User",
				"Logout User",
				"Get User By Name",
				"Update User",
				"Delete User",
			]),
		);
	});

	test("should generate notice fields for HTTP methods", () => {
		const noticeFields = result.filter((field) => field.type === "notice");
		expect(noticeFields.length).toBeGreaterThan(0);

		const petNotice = noticeFields.find(
			(field) =>
				field.displayName === "PUT /pet" &&
				field.displayOptions?.show?.resource?.includes("Pet"),
		);
		expect(petNotice).toBeDefined();
		expect(petNotice?.typeOptions?.theme).toBe("info");
	});

	test("should generate required parameters for Pet operations", () => {
		const nameField = result.find(
			(field) =>
				field.name === "name" &&
				field.displayOptions?.show?.resource?.includes("Pet") &&
				field.displayOptions?.show?.operation?.includes("Add Pet"),
		);

		expect(nameField).toBeDefined();
		expect(nameField?.type).toBe("string");
		expect(nameField?.required).toBe(true);
		expect(nameField?.displayName).toBe("Name");
	});

	test("should generate enum options for status field", () => {
		const statusField = result.find(
			(field) =>
				field.name === "status" &&
				field.displayOptions?.show?.resource?.includes("Pet") &&
				field.displayOptions?.show?.operation?.includes("Add Pet"),
		);

		expect(statusField).toBeDefined();
		expect(statusField?.type).toBe("options");
		expect(statusField?.options).toEqual(
			expect.arrayContaining([
				{ name: "Available", value: "available" },
				{ name: "Pending", value: "pending" },
				{ name: "Sold", value: "sold" },
			]),
		);
	});

	test("should handle path parameters correctly", () => {
		const petIdField = result.find(
			(field) =>
				field.name === "petId" &&
				field.displayOptions?.show?.resource?.includes("Pet") &&
				field.displayOptions?.show?.operation?.includes("Get Pet By Id"),
		);

		expect(petIdField).toBeDefined();
		expect(petIdField?.type).toBe("number");
		expect(petIdField?.required).toBe(true);
		expect(petIdField?.displayName).toBe("Pet Id");
	});

	test("should handle query parameters correctly", () => {
		const usernameField = result.find(
			(field) =>
				field.name === "username" &&
				field.displayOptions?.show?.resource?.includes("User") &&
				field.displayOptions?.show?.operation?.includes("Login User"),
		);

		expect(usernameField).toBeDefined();
		expect(usernameField?.type).toBe("string");
		expect(usernameField?.routing?.send?.type).toBe("query");
		expect(usernameField?.routing?.send?.property).toBe("username");
	});

	test("should handle JSON body fields correctly", () => {
		const categoryField = result.find(
			(field) =>
				field.name === "category" &&
				field.displayOptions?.show?.resource?.includes("Pet") &&
				field.displayOptions?.show?.operation?.includes("Add Pet"),
		);

		expect(categoryField).toBeDefined();
		expect(categoryField?.type).toBe("json");
		expect(categoryField?.routing?.send?.type).toBe("body");
		expect(categoryField?.routing?.send?.value).toBe(
			"={{ JSON.parse($value) }}",
		);
	});

	test("should handle header parameters correctly", () => {
		const apiKeyField = result.find(
			(field) =>
				field.name === "api_key" &&
				field.displayOptions?.show?.resource?.includes("Pet") &&
				field.displayOptions?.show?.operation?.includes("Delete Pet"),
		);

		expect(apiKeyField).toBeDefined();
		expect(apiKeyField?.type).toBe("string");
		expect(apiKeyField?.routing?.request?.headers).toEqual({
			api_key: "={{ $value }}",
		});
	});

	test("should generate routing configuration for different HTTP methods", () => {
		const postOperation = result
			.find(
				(field) =>
					field.name === "operation" &&
					field.type === "options" &&
					field.displayOptions?.show?.resource?.includes("Pet"),
			)
			?.options?.find((opt) => "value" in opt && opt.value === "Add Pet");

		expect(postOperation).toBeDefined();
		if (postOperation && "routing" in postOperation) {
			expect((postOperation as any).routing?.request?.method).toBe("POST");
			expect((postOperation as any).routing?.request?.url).toBe("=/pet");
		}

		const getOperation = result
			.find(
				(field) =>
					field.name === "operation" &&
					field.type === "options" &&
					field.displayOptions?.show?.resource?.includes("Pet"),
			)
			?.options?.find((opt) => "value" in opt && opt.value === "Get Pet By Id");

		expect(getOperation).toBeDefined();
		if (getOperation && "routing" in getOperation) {
			expect((getOperation as any).routing?.request?.method).toBe("GET");
			expect((getOperation as any).routing?.request?.url).toContain(
				'{{$parameter["petId"]}}',
			);
		}
	});

	test("should handle complex nested objects", () => {
		const userFields = result.filter(
			(field) =>
				field.displayOptions?.show?.resource?.includes("User") &&
				field.displayOptions?.show?.operation?.includes("Create User"),
		);

		const expectedFields = [
			"id",
			"username",
			"firstName",
			"lastName",
			"email",
			"password",
			"phone",
			"userStatus",
		];
		const actualFields = userFields.map((f) => f.name);

		expectedFields.forEach((field) => {
			expect(actualFields).toContain(field);
		});
	});

	test("should validate total number of generated fields", () => {
		// This is a basic sanity check to ensure we're generating a reasonable number of fields
		expect(result.length).toBeGreaterThan(50);
		expect(result.length).toBeLessThan(200);
	});

	test("should validate field structure consistency", () => {
		result.forEach((field) => {
			expect(field).toHaveProperty("name");
			expect(field).toHaveProperty("type");
			expect(field).toHaveProperty("displayName");

			if (field.type === "options") {
				expect(field).toHaveProperty("options");
				expect(Array.isArray(field.options)).toBe(true);
			}

			if (field.routing?.send) {
				expect(field.routing.send).toHaveProperty("property");
				expect(field.routing.send).toHaveProperty("type");
				expect(field.routing.send).toHaveProperty("value");
			}

			// Only check routing.request if it exists and has the expected structure
			if (
				field.routing?.request &&
				typeof field.routing.request === "object" &&
				"method" in field.routing.request
			) {
				expect(field.routing.request).toHaveProperty("method");
				expect(field.routing.request).toHaveProperty("url");
			}
		});
	});
});
