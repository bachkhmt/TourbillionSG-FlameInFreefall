"use client";

import { useState } from "react";
import { useDataset } from "@/store/useDatasetStore";
import {
  DatasetGate,
  ResearchHeader,
  SourceLink,
  button,
  field,
  panel,
} from "./Shared";

export function ResearchResources() {
  const { data } = useDataset();
  const [query, setQuery] = useState("");
  const resources =
    data?.resources?.filter((resource) =>
      `${resource.title} ${resource.kind} ${resource.role}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    ) ?? [];
  return (
    <DatasetGate>
      {data && (
        <div
          className="mx-auto max-w-7xl space-y-6 pb-20"
          data-testid="research-resources"
        >
          <ResearchHeader
            title="Official resources"
            description="Explore the challenge’s data repositories, science context and case studies. A linked resource has not necessarily been downloaded or imported into this release."
          />
          <div className={`${panel} space-y-3`}>
            <label className="text-xs font-bold">
              Find a resource
              <input
                className={`${field} mt-2`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search title, resource type or role…"
              />
            </label>
            <p className="text-xs leading-6 text-slate-500">
              Source rights are shown per resource. Unknown rights do not grant
              permission to ingest full text. Historical cases and technology
              examples are context, not experimental runs.
            </p>
          </div>
          {resources.length ? (
            <div className="grid gap-5 md:grid-cols-2">
              {resources.map((resource) => (
                <article key={resource.id} className={`${panel} space-y-3`}>
                  <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-800">
                      {resource.kind.replaceAll("_", " ")}
                    </span>
                    <span>{resource.status.replaceAll("_", " ")}</span>
                  </div>
                  <h2 className="text-lg font-bold">{resource.title}</h2>
                  <p className="text-sm leading-7 text-slate-600">
                    {resource.role}
                  </p>
                  <p className="text-xs text-slate-500">
                    Rights: {resource.license || "unknown"}
                  </p>
                  {/^https?:\/\//.test(resource.url) && (
                    <a
                      className={button}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open original resource ↗
                    </a>
                  )}
                  {resource.sourceId && (
                    <SourceLink
                      id={resource.sourceId}
                      label="Inspect imported source"
                    />
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className={panel}>
              {data.resources
                ? "No resources match this search."
                : "This historical release does not contain a resource registry. Refresh the release to check for an expanded publication."}
            </div>
          )}
        </div>
      )}
    </DatasetGate>
  );
}
