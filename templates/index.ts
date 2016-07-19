(<DojoLoader.RootRequire> require).config({
	baseUrl: '../..',
	packages: [<% for (moduleId in modules) { var module = modules[moduleId];%>
		{ name: '<%= module.packageName || moduleId %>', location: 'node_modules/<%= moduleId %><%= module.packageLocation || '' %>' },<% } %>
		{ name: 'src', location: '_build/src' }
	]
});

/* Requiring in the main module */
require([ 'src/app' ], function () {});
