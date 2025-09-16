/**
 * /api/entities/{entity} => /api/entities/{{$parameter["entity"]}}
 */
export function FormatPathWithParameters(uri: string): string {
	return uri.replace(/{([^}]*)}/g, '{{$parameter["$1"]}}');
}
