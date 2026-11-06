import path from "node:path";

// Enforce boundaries on resolved paths, including imports with different ../ depths.
export const moduleBoundaries = {
    meta: {
        type: "problem",
        schema: [],
        messages: {
            shared: "shared no debe depender de app ni features.",
            app: "Una funcionalidad no debe importar la composición de app.",
            public: "Importa otra funcionalidad a través de su index público.",
            layer: "API/model/types deben permanecer independientes de React, sesión y caché.",
        },
    },
    create(context) {
        const filename = context.filename.replaceAll(path.sep, "/");
        const owner = filename.match(/\/src\/features\/([^/]+)\//)?.[1];
        const adapterFree = /\/src\/features\/[^/]+\/(api|model|types)\//.test(filename);
        function check(node) {
            const specifier = node.source?.value;
            if (typeof specifier !== "string") return;
            if (
                adapterFree &&
                /^(react(?:-dom|-router)?(?:\/|$)|@tanstack\/|zustand)/.test(specifier)
            ) {
                context.report({ node, messageId: "layer" });
            }
            if (!specifier.startsWith(".")) return;
            const target = path
                .resolve(path.dirname(context.filename), specifier)
                .replaceAll(path.sep, "/");
            if (filename.includes("/src/shared/") && /\/src\/(app|features)\//.test(target)) {
                context.report({ node, messageId: "shared" });
            }
            if (owner && target.includes("/src/app/")) context.report({ node, messageId: "app" });
            if (adapterFree && /\/(auth\.store|hooks|pages|components)(?:\/|$|\.)/.test(target)) {
                context.report({ node, messageId: "layer" });
            }
            const destination = target.match(/\/src\/features\/([^/]+)(.*)$/);
            if (!owner || !destination || destination[1] === owner) return;
            if (
                destination[2] !== "" &&
                destination[2] !== "/index" &&
                destination[2] !== "/index.ts"
            ) {
                context.report({ node, messageId: "public" });
            }
        }
        return {
            ImportDeclaration: check,
            ExportNamedDeclaration: check,
            ExportAllDeclaration: check,
        };
    },
};
