import lodash from "lodash";
import type { IResourceOption } from "../types/resource-option";

export class ResourceOptionsMap extends Map<string, IResourceOption[]> {

	add(resource: string, option: IResourceOption) {
		if (!this.has(resource)) {
			this.set(resource, []);
		}
		const resourceOptions = this.get(resource) || [];
		if (lodash.find(resourceOptions, { value: option.value })) {
			throw new Error(
				`Duplicate operation '${option.value}' for resource '${resource}'`,
			);
		}
		resourceOptions.push(option);
	}
}
