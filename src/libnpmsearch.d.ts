declare module 'libnpmsearch' {
	interface NpmPackageMaintainers {
		username: string;
		email: string;
	}

	interface NpmSearchResult {
		name: string;
		scope: string;
		description: string;
		version: string;
		keywords: string[];
		date: Date | null;
		maintainers: NpmPackageMaintainers[] | null;
	}

	interface NpmSearchOpts {
		limit: number;
		offset: number;
		detailed: boolean;
		sortBy: 'optimal' | 'quality' | 'maintenance' | 'popularity';
		quality: number;
		maintenance: number;
		popularity: number;
	}

	function search(query: string | string[], opts?: NpmSearchOpts): Promise<NpmSearchResult[]>;
	export = search;
}
