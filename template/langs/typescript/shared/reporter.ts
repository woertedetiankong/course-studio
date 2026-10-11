// 运行器自动生成的文件，每次运行都会覆盖，不要修改。
// A `node --test` reporter that prints one JSON object per line for lib/runner.ts.
export default async function* reporter(source: AsyncIterable<{ type: string; data: any }>) {
	for await (const ev of source) {
		if (ev.type === "test:pass" || ev.type === "test:fail") {
			const d = ev.data, err = d.details?.error, cause = err?.cause ?? err;
			yield JSON.stringify({
				k: ev.type === "test:pass" ? "pass" : "fail",
				name: d.name, nesting: d.nesting, type: d.details?.type, ms: d.details?.duration_ms,
				ft: err?.failureType, msg: cause?.message ?? (cause == null ? undefined : String(cause)), stack: cause?.stack,
			}) + "\n";
		} else if (ev.type === "test:stdout" || ev.type === "test:stderr") {
			yield JSON.stringify({ k: ev.type === "test:stdout" ? "stdout" : "stderr", msg: ev.data.message }) + "\n";
		}
	}
}
