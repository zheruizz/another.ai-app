/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useState } from "react";

type AgentTaskType = "pricing_page" | "newsletter_subscribe" | "refund_policy";

type AgentTestTask = {
  id: string;
  type: AgentTaskType;
  description: string;
  success?: boolean;
  errorReason?: string | null;
  videoUrl?: string | null;
  details?: { steps: string[] };
};

type SuggestTasksResponse = {
  runId: string;
  url: string;
  tasks: AgentTestTask[];
};

type RunAgentTestsResponse = {
  runId: string;
  overallScore: number;
  tasks: AgentTestTask[];
};

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

export default function AgentTestsPage() {
  const [url, setUrl] = useState("https://example.com");
  const [suggestResult, setSuggestResult] = useState<SuggestTasksResponse | null>(null);
  const [runResult, setRunResult] = useState<RunAgentTestsResponse | null>(null);
  const [loading, setLoading] = useState<"suggest" | "run" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canRun = useMemo(
    () => !!suggestResult?.runId && !!suggestResult?.tasks?.length && !loading,
    [suggestResult, loading],
  );

  async function callApi<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(text || `Request failed with ${res.status}`);
    }
    return JSON.parse(text) as T;
  }

  async function handleSuggest() {
    setLoading("suggest");
    setError(null);
    setRunResult(null);
    try {
      const data = await callApi<SuggestTasksResponse>("/api/agent-tests/suggest-tasks", { url });
      setSuggestResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to suggest tasks");
    } finally {
      setLoading(null);
    }
  }

  async function handleRun() {
    if (!suggestResult) return;
    setLoading("run");
    setError(null);
    try {
      const data = await callApi<RunAgentTestsResponse>("/api/agent-tests/run", {
        runId: suggestResult.runId,
        url: suggestResult.url,
        tasks: suggestResult.tasks,
      });
      setRunResult(data);
      setSuggestResult((prev) => (prev ? { ...prev, tasks: data.tasks } : prev));
    } catch (err: any) {
      setError(err.message || "Failed to run tests");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <header className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Agent Tests</p>
          <h1 className="mt-2 text-3xl font-semibold">Generate and run tasks</h1>
          <p className="mt-2 text-sm text-slate-600">
            Points at the Lambda endpoints wired in CDK. Set{" "}
            <code className="rounded bg-slate-800 px-2 py-1 text-xs text-white">
              NEXT_PUBLIC_API_BASE_URL
            </code>{" "}
            to hit your deployed API, or leave blank to use relative paths/proxy.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="block text-sm font-medium text-slate-700" htmlFor="url-input">
            Site URL
          </label>
          <div className="mt-2 flex gap-3">
            <input
              id="url-input"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-base shadow-inner focus:border-slate-400 focus:outline-none"
            />
            <button
              onClick={handleSuggest}
              disabled={!url || loading === "suggest"}
              className="whitespace-nowrap rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {loading === "suggest" ? "Suggesting..." : "Suggest tasks"}
            </button>
          </div>
          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
        </section>

        {suggestResult && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Suggested tasks</h2>
                <p className="text-sm text-slate-600">Run ID: {suggestResult.runId}</p>
              </div>
              <button
                onClick={handleRun}
                disabled={!canRun || loading === "run"}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {loading === "run" ? "Running..." : "Run tests"}
              </button>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Task</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {suggestResult.tasks.map((task) => (
                    <tr key={task.id}>
                      <td className="px-4 py-3 font-medium text-slate-800">{task.description}</td>
                      <td className="px-4 py-3 text-slate-600">{task.type}</td>
                      <td className="px-4 py-3">
                        {task.success === undefined ? (
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                            pending
                          </span>
                        ) : task.success ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700">
                            success
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">
                            failed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {runResult && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Run result</h2>
            <p className="text-sm text-slate-600">Overall score: {runResult.overallScore}</p>
            <pre className="mt-3 max-h-96 overflow-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100">
              {JSON.stringify(runResult, null, 2)}
            </pre>
          </section>
        )}
      </div>
    </div>
  );
}
