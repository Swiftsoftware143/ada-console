import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Inbox, ExternalLink, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { generateEmbedCode } from "@/lib/helpers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import EmbedCodeBlock from "@/components/EmbedCodeBlock";
import StatusBadge from "@/components/StatusBadge";

export default function EmbedCodePage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });
    setClients(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) => c.name?.toLowerCase().includes(q) || c.domain?.toLowerCase().includes(q)
    );
  }, [clients, search]);

  return (
    <div data-testid="embed-code-page">
      <PageHeader
        eyebrow="Deployment"
        title="Embed Code"
        subtitle="One-click copy snippets for every client. Drop into their <body> tag to activate the widget."
      />

      <div className="bg-[#1e2130] border border-[#2e3245] rounded-xl px-5 py-4 mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748b] pointer-events-none" />
          <Input
            data-testid="embed-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client or domain..."
            className="pl-9 bg-[#0f1117] border-[#2e3245] text-white placeholder:text-[#64748b] focus-visible:ring-[#007bff] focus-visible:border-transparent"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-[#1e2130] border border-[#2e3245] rounded-xl p-12 text-center text-[#64748b] text-sm">
          Loading snippets...
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-[#1e2130] border border-[#2e3245] rounded-xl p-14 text-center" data-testid="embed-empty-state">
          <div className="h-14 w-14 mx-auto rounded-xl bg-[#0f1117] border border-[#2e3245] grid place-items-center mb-4">
            <Inbox className="h-6 w-6 text-[#64748b]" />
          </div>
          <h3
            className="text-white font-semibold tracking-tight text-lg"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            No snippets yet
          </h3>
          <p className="text-sm text-[#94a3b8] mt-1.5 mb-5">
            Add a client to auto-generate their embed code.
          </p>
          <Link to="/clients">
            <Button
              data-testid="embed-empty-add-btn"
              className="bg-[#007bff] hover:bg-[#0056b3] text-white shadow-[0_0_15px_rgba(0,123,255,0.25)]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add a client
            </Button>
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#1e2130] border border-[#2e3245] rounded-xl p-12 text-center text-[#64748b] text-sm">
          No clients match &ldquo;{search}&rdquo;
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {filtered.map((c) => (
            <div
              key={c.id}
              data-testid={`embed-card-${c.id}`}
              className="bg-[#1e2130] border border-[#2e3245] rounded-xl p-5 hover:border-[#3e445e] transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Link
                    to={`/clients/${c.id}`}
                    className="inline-flex items-center gap-1.5 text-white font-semibold tracking-tight hover:text-[#007bff] transition-colors"
                    style={{ fontFamily: "Outfit, sans-serif" }}
                  >
                    {c.name}
                    <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                  </Link>
                  <div className="text-xs text-[#94a3b8] font-mono mt-1">{c.domain}</div>
                </div>
                <StatusBadge active={c.active} testId={`embed-status-${c.id}`} />
              </div>
              <EmbedCodeBlock code={generateEmbedCode(c.domain)} testId={`embed-block-${c.id}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
