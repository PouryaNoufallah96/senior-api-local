import { generateOpenAPIDocument } from "@/lib/api/openapi";

/** Prints the generated OpenAPI document; handy for diffing in CI or reviews. */
async function main(): Promise<void> {
  const document = await generateOpenAPIDocument();
  process.stdout.write(`${JSON.stringify(document, null, 2)}\n`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
