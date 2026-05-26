module.exports = [
"[externals]/argon2 [external] (argon2, cjs, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/[externals]_argon2_9461559e._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[externals]/argon2 [external] (argon2, cjs)");
    });
});
}),
"[externals]/node:crypto [external] (node:crypto, cjs, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.resolve().then(() => {
        return parentImport("[externals]/node:crypto [external] (node:crypto, cjs)");
    });
});
}),
];