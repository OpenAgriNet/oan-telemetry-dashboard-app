import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  Gauge,
  History,
  KeyRound,
  Languages,
  Link2,
  ListChecks,
  Play,
  Plus,
  Power,
  Save,
  Server,
  ShieldCheck,
  Sparkles,
  TestTube2,
  Trash2,
  WandSparkles,
} from "lucide-react";
import RoleBasedAccess from "@/components/RoleBasedAccess";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteEvaluationSchedule,
  fetchEvaluationRuns,
  fetchEvaluationSchedules,
  fetchJudgeEndpoints,
  saveEvaluationSchedule,
  saveJudgeEndpoint,
  startEvaluationRun,
  testJudgeEndpoint,
  updateEvaluationSchedule,
  updateJudgeEndpoint,
} from "@/features/evaluations/api";
import type {
  EvaluationRun,
  JudgeProvider,
} from "@/features/evaluations/types";
import { toast } from "sonner";

const providerLabels: Record<JudgeProvider, string> = {
  openai: "OpenAI",
  vllm: "vLLM",
  cerebras: "Cerebras",
  openai_compatible: "Compatible API",
};
const providerDefaults: Partial<Record<JudgeProvider, string>> = {
  openai: "https://api.openai.com/v1",
  cerebras: "https://api.cerebras.ai/v1",
};
const statusVariant = (status: string) =>
  status === "failed"
    ? "destructive"
    : status === "complete"
      ? "default"
      : "secondary";
const selectedCount = (run: EvaluationRun) =>
  run.feedback_selected_count + run.random_selected_count;
const finishedCount = (run: EvaluationRun) =>
  run.successful_count + run.failed_count;
const languageOptions = [
  ["mr", "मराठी"],
  ["hi", "हिन्दी"],
  ["en", "English"],
  ["bhb", "भिली"],
] as const;
const supportedLanguageCodes = languageOptions.map(([code]) => code);

function AdminRunForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("run");
  const endpoints = useQuery({
    queryKey: ["evaluation-judge-endpoints"],
    queryFn: fetchJudgeEndpoints,
  });
  const schedules = useQuery({
    queryKey: ["evaluation-schedules"],
    queryFn: fetchEvaluationSchedules,
    refetchInterval: 15000,
  });
  const runs = useQuery({
    queryKey: ["evaluation-runs"],
    queryFn: fetchEvaluationRuns,
    refetchInterval: 5000,
  });
  const enabledEndpoints = useMemo(
    () => endpoints.data?.filter((item) => item.enabled) || [],
    [endpoints.data],
  );

  const [endpointId, setEndpointId] = useState("");
  const [populationLimit, setPopulationLimit] = useState(1000);
  const [samplingMode, setSamplingMode] = useState<"percent" | "count">(
    "percent",
  );
  const [samplingValue, setSamplingValue] = useState(10);
  const [targetLanguages, setTargetLanguages] = useState<string[]>(["mr"]);
  const [scheduleName, setScheduleName] = useState(
    "Daily production evaluation",
  );
  const [dailyHour, setDailyHour] = useState(2);
  const [showEndpointForm, setShowEndpointForm] = useState(false);
  useEffect(() => {
    if (!endpointId && enabledEndpoints.length)
      setEndpointId(enabledEndpoints[0].id);
  }, [endpointId, enabledEndpoints]);
  const selectedEndpoint = enabledEndpoints.find(
    (item) => item.id === endpointId,
  );
  const estimated =
    samplingMode === "percent"
      ? Math.ceil((populationLimit * samplingValue) / 100)
      : Math.min(populationLimit, samplingValue);

  const [endpointName, setEndpointName] = useState("");
  const [providerType, setProviderType] =
    useState<JudgeProvider>("openai_compatible");
  const [baseUrl, setBaseUrl] = useState("");
  const [defaultModel, setDefaultModel] = useState("");
  const [apiKey, setApiKey] = useState("");

  const refreshEndpoints = () =>
    queryClient.invalidateQueries({ queryKey: ["evaluation-judge-endpoints"] });
  const refreshSchedules = () =>
    queryClient.invalidateQueries({ queryKey: ["evaluation-schedules"] });
  const start = useMutation({
    mutationFn: () =>
      startEvaluationRun({
        judgeEndpointId: endpointId,
        populationLimit,
        samplingMode,
        samplingValue,
        targetLanguages,
      }),
    onSuccess: async (run) => {
      await queryClient.invalidateQueries({ queryKey: ["evaluation-runs"] });
      toast.success(`Run ${run.run_id} started`);
      navigate(`/evaluation?run=${encodeURIComponent(run.run_id)}`);
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Could not start the run",
      ),
  });
  const addEndpoint = useMutation({
    mutationFn: () =>
      saveJudgeEndpoint({
        name: endpointName,
        provider_type: providerType,
        base_url: baseUrl,
        default_model: defaultModel,
        api_key: apiKey || undefined,
      }),
    onSuccess: async (saved) => {
      await refreshEndpoints();
      setEndpointId(saved.id);
      setEndpointName("");
      setBaseUrl("");
      setDefaultModel("");
      setApiKey("");
      setShowEndpointForm(false);
      toast.success("Judge endpoint saved securely");
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Could not save endpoint",
      ),
  });
  const testEndpoint = useMutation({
    mutationFn: testJudgeEndpoint,
    onSuccess: (result) =>
      toast.success(`Connected · ${result.models.length} model(s) found`),
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Connection failed"),
  });
  const toggleEndpoint = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      updateJudgeEndpoint(id, { enabled }),
    onSuccess: refreshEndpoints,
  });
  const addSchedule = useMutation({
    mutationFn: () =>
      saveEvaluationSchedule({
        name: scheduleName,
        judge_endpoint_id: endpointId,
        population_limit: populationLimit,
        sampling_mode: samplingMode,
        sampling_value: samplingValue,
        target_languages: targetLanguages,
        daily_hour_ist: dailyHour,
        enabled: true,
      }),
    onSuccess: async () => {
      await refreshSchedules();
      toast.success("Daily schedule saved");
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Could not save schedule",
      ),
  });
  const toggleSchedule = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      updateEvaluationSchedule(id, { enabled }),
    onSuccess: refreshSchedules,
  });
  const removeSchedule = useMutation({
    mutationFn: deleteEvaluationSchedule,
    onSuccess: refreshSchedules,
  });

  const runValid =
    Boolean(endpointId) &&
    populationLimit >= 10 &&
    populationLimit <= 100000 &&
    samplingValue > 0 &&
    targetLanguages.length > 0 &&
    (samplingMode === "count" || samplingValue <= 100);
  const providerChanged = (provider: JudgeProvider) => {
    const priorPreset = providerDefaults[providerType];
    setProviderType(provider);
    if (!baseUrl || baseUrl === priorPreset)
      setBaseUrl(providerDefaults[provider] || "");
  };
  const shortcutValues =
    samplingMode === "percent" ? [5, 10, 20] : [25, 50, 100];
  const toggleLanguage = (code: string) =>
    setTargetLanguages((current) =>
      current.includes(code)
        ? current.length === 1
          ? current
          : current.filter((item) => item !== code)
        : [...current, code],
    );

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-12">
      <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-fuchsia-500/5 p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <Badge
              className="mb-3 border-primary/30 bg-background/60"
              variant="outline"
            >
              <ShieldCheck className="mr-1 h-3 w-3" />
              Super-admin
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Evaluation control center
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Run, connect, and automate judges without leaving the dashboard.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="self-start bg-background/70"
          >
            <Link to="/evaluation">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Evaluation dashboard
            </Link>
          </Button>
        </div>
        <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border bg-background/60 p-3">
            <div className="text-xs text-muted-foreground">
              Active connections
            </div>
            <div className="mt-1 text-xl font-bold">
              {enabledEndpoints.length}
            </div>
          </div>
          <div className="rounded-xl border bg-background/60 p-3">
            <div className="text-xs text-muted-foreground">
              Daily automations
            </div>
            <div className="mt-1 text-xl font-bold">
              {schedules.data?.filter((item) => item.enabled).length || 0}
            </div>
          </div>
          <div className="rounded-xl border bg-background/60 p-3">
            <div className="text-xs text-muted-foreground">
              Runs in progress
            </div>
            <div className="mt-1 text-xl font-bold">
              {runs.data?.filter((item) => item.status === "running").length ||
                0}
            </div>
          </div>
        </div>
      </section>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl p-1.5 lg:grid-cols-4">
          <TabsTrigger value="run" className="h-10 gap-2">
            <Play className="h-4 w-4" />
            Run now
          </TabsTrigger>
          <TabsTrigger value="connections" className="h-10 gap-2">
            <Server className="h-4 w-4" />
            Connections
          </TabsTrigger>
          <TabsTrigger value="automation" className="h-10 gap-2">
            <CalendarClock className="h-4 w-4" />
            Automation
          </TabsTrigger>
          <TabsTrigger value="history" className="h-10 gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="run" className="mt-5">
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,.75fr)]">
            <Card className="overflow-hidden border-primary/20">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <WandSparkles className="h-5 w-5 text-primary" />
                  Configure this run
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-7 p-5 sm:p-6">
                <div>
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <Badge className="h-6 w-6 justify-center rounded-full p-0">
                      1
                    </Badge>
                    Choose the judge
                  </div>
                  {enabledEndpoints.length ? (
                    <select
                      className="h-12 w-full rounded-xl border bg-background px-3"
                      value={endpointId}
                      onChange={(event) => setEndpointId(event.target.value)}
                    >
                      {enabledEndpoints.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} · {item.default_model}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <button
                      className="flex w-full items-center justify-between rounded-xl border border-dashed p-4 text-left text-sm hover:border-primary"
                      onClick={() => setActiveTab("connections")}
                    >
                      <span>No active judge connections</span>
                      <span className="text-primary">Add one →</span>
                    </button>
                  )}
                  {selectedEndpoint && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline">
                        {providerLabels[selectedEndpoint.provider_type]}
                      </Badge>
                      <span className="truncate">
                        {selectedEndpoint.base_url}
                      </span>
                      {selectedEndpoint.has_api_key && (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <KeyRound className="h-3 w-3" />
                          Key secured
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <Badge className="h-6 w-6 justify-center rounded-full p-0">
                      2
                    </Badge>
                    Set the daily population
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <Input
                      className="h-12 text-base"
                      type="number"
                      min={10}
                      max={100000}
                      value={populationLimit}
                      onChange={(event) =>
                        setPopulationLimit(Number(event.target.value))
                      }
                    />
                    <div className="flex items-center rounded-xl border bg-muted/30 px-4 text-sm text-muted-foreground">
                      latest traces
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    The worker inspects this many recent Langfuse traces before
                    selecting conversations.
                  </p>
                </div>
                <div>
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <Badge className="h-6 w-6 justify-center rounded-full p-0">
                      3
                    </Badge>
                    Choose trace languages
                  </div>
                  <div className="rounded-xl border bg-muted/15 p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Languages className="h-4 w-4 text-primary" />
                        Filter before sampling
                      </span>
                      <Button
                        size="sm"
                        variant={
                          targetLanguages.length === supportedLanguageCodes.length
                            ? "default"
                            : "ghost"
                        }
                        onClick={() =>
                          setTargetLanguages([...supportedLanguageCodes])
                        }
                      >
                        All four
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {languageOptions.map(([code, label]) => (
                        <button
                          type="button"
                          key={code}
                          onClick={() => toggleLanguage(code)}
                          className={`rounded-full border px-3 py-2 text-sm transition ${targetLanguages.includes(code) ? "border-primary bg-primary text-primary-foreground shadow-sm" : "bg-background hover:border-primary/50"}`}
                        >
                          <span className="font-medium">{label}</span>
                          <span className="ml-1.5 text-xs opacity-70">
                            {code}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    The worker keeps scanning recent pages until it finds up to{" "}
                    {populationLimit.toLocaleString()} matching traces.
                  </p>
                </div>
                <div>
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <Badge className="h-6 w-6 justify-center rounded-full p-0">
                      4
                    </Badge>
                    Choose how many to score
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      className={`rounded-xl border p-4 text-left transition ${samplingMode === "percent" ? "border-primary bg-primary/8 ring-2 ring-primary/15" : "hover:border-primary/40"}`}
                      onClick={() => {
                        setSamplingMode("percent");
                        setSamplingValue(10);
                      }}
                    >
                      <div className="flex items-center gap-2 font-semibold">
                        <Gauge className="h-4 w-4 text-primary" />
                        Percentage
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Scale automatically with daily traffic.
                      </p>
                    </button>
                    <button
                      className={`rounded-xl border p-4 text-left transition ${samplingMode === "count" ? "border-primary bg-primary/8 ring-2 ring-primary/15" : "hover:border-primary/40"}`}
                      onClick={() => {
                        setSamplingMode("count");
                        setSamplingValue(50);
                      }}
                    >
                      <div className="flex items-center gap-2 font-semibold">
                        <ListChecks className="h-4 w-4 text-primary" />
                        Fixed count
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Score the same maximum every day.
                      </p>
                    </button>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                      <Input
                        className="h-11 pr-20"
                        type="number"
                        min={samplingMode === "percent" ? 0.01 : 1}
                        max={samplingMode === "percent" ? 100 : populationLimit}
                        value={samplingValue}
                        onChange={(event) =>
                          setSamplingValue(Number(event.target.value))
                        }
                      />
                      <span className="absolute right-3 top-3 text-xs text-muted-foreground">
                        {samplingMode === "percent"
                          ? "% per day"
                          : "traces/day"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {shortcutValues.map((value) => (
                        <Button
                          key={value}
                          size="sm"
                          variant={
                            samplingValue === value ? "default" : "outline"
                          }
                          className="h-11"
                          onClick={() => setSamplingValue(value)}
                        >
                          {value}
                          {samplingMode === "percent" ? "%" : ""}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="overflow-hidden border-primary/25 xl:sticky xl:top-5">
              <CardHeader className="border-b bg-primary/[0.05]">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Run summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 p-5">
                <div className="rounded-2xl bg-gradient-to-br from-primary to-violet-700 p-5 text-primary-foreground">
                  <div className="text-sm opacity-80">Estimated selection</div>
                  <div className="mt-1 text-4xl font-bold">
                    {estimated.toLocaleString()}
                  </div>
                  <div className="mt-1 text-xs opacity-80">
                    conversations from {populationLimit.toLocaleString()}{" "}
                    matching traces
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>
                      Language filtering happens before feedback and random
                      selection.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>All feedback-matched traces are included first.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>
                      One trace is scored and saved before the next starts.
                    </span>
                  </div>
                </div>
                <div className="rounded-xl border bg-muted/25 p-3 text-xs">
                  <span className="text-muted-foreground">Judge</span>
                  <div className="mt-1 truncate font-semibold">
                    {selectedEndpoint?.name || "No endpoint selected"}
                  </div>
                  <div className="truncate text-muted-foreground">
                    {selectedEndpoint?.default_model || "—"}
                  </div>
                  <div className="mt-3 border-t pt-3">
                    <span className="text-muted-foreground">Languages</span>
                    <div className="mt-1 font-semibold">
                      {targetLanguages.length
                        ? targetLanguages.join(", ").toUpperCase()
                        : "All languages"}
                    </div>
                  </div>
                </div>
                <Button
                  className="h-12 w-full"
                  size="lg"
                  disabled={!runValid || start.isPending}
                  onClick={() => start.mutate()}
                >
                  <Play className="mr-2 h-4 w-4" />
                  {start.isPending ? "Starting…" : "Start evaluation"}
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  disabled={!runValid}
                  onClick={() => setActiveTab("automation")}
                >
                  <CalendarClock className="mr-2 h-4 w-4" />
                  Automate this setup
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="connections" className="mt-5 space-y-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold">Judge connections</h2>
              <p className="text-sm text-muted-foreground">
                Reusable provider settings; secrets never return to the browser.
              </p>
            </div>
            <Button onClick={() => setShowEndpointForm((value) => !value)}>
              <Plus className="mr-2 h-4 w-4" />
              {showEndpointForm ? "Close form" : "Add connection"}
            </Button>
          </div>
          {showEndpointForm && (
            <Card className="overflow-hidden border-primary/25">
              <CardHeader className="border-b bg-primary/[0.04]">
                <CardTitle className="text-base">
                  New OpenAI-compatible connection
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 p-5 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium">
                  <span>Name</span>
                  <Input
                    placeholder="Production Cerebras"
                    value={endpointName}
                    onChange={(event) => setEndpointName(event.target.value)}
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  <span>Provider type</span>
                  <select
                    className="h-10 rounded-md border bg-background px-3"
                    value={providerType}
                    onChange={(event) =>
                      providerChanged(event.target.value as JudgeProvider)
                    }
                  >
                    <option value="openai">OpenAI</option>
                    <option value="cerebras">Cerebras</option>
                    <option value="vllm">vLLM</option>
                    <option value="openai_compatible">
                      Other compatible API
                    </option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  <span className="flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    Base URL
                  </span>
                  <Input
                    placeholder="https://api.provider.com/v1"
                    value={baseUrl}
                    onChange={(event) => setBaseUrl(event.target.value)}
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  <span className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    Model ID
                  </span>
                  <Input
                    placeholder="llama-3.3-70b"
                    value={defaultModel}
                    onChange={(event) => setDefaultModel(event.target.value)}
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium md:col-span-2">
                  <span className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4" />
                    API key{" "}
                    <span className="font-normal text-muted-foreground">
                      ({providerType === "vllm" ? "optional" : "encrypted"})
                    </span>
                  </span>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="Paste once; it will not be shown again"
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                  />
                </label>
                <div className="flex flex-col justify-between gap-3 rounded-xl border bg-muted/20 p-3 text-xs text-muted-foreground md:col-span-2 sm:flex-row sm:items-center">
                  <span>
                    AES-256-GCM encryption · optional hostname allowlist ·
                    admin-only access
                  </span>
                  <Button
                    disabled={
                      !endpointName ||
                      !baseUrl ||
                      !defaultModel ||
                      addEndpoint.isPending
                    }
                    onClick={() => addEndpoint.mutate()}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save connection
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            {endpoints.data?.map((item) => (
              <Card
                key={item.id}
                className={`transition ${item.enabled ? "border-primary/20" : "opacity-65"}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`rounded-xl p-2.5 ${item.enabled ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}
                    >
                      <Server className="h-5 w-5" />
                    </span>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        {providerLabels[item.provider_type]}
                      </Badge>
                      <Badge variant={item.enabled ? "secondary" : "outline"}>
                        {item.enabled ? "Active" : "Disabled"}
                      </Badge>
                    </div>
                  </div>
                  <h3 className="mt-4 font-semibold">{item.name}</h3>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {item.base_url}
                  </p>
                  <div className="mt-3 rounded-lg bg-muted/30 px-3 py-2 text-xs">
                    <span className="text-muted-foreground">Model</span>
                    <div className="mt-0.5 truncate font-medium">
                      {item.default_model}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {item.has_api_key ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <KeyRound className="h-3 w-3" />
                          Credential secured
                        </span>
                      ) : (
                        "No API key"
                      )}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={testEndpoint.isPending}
                        onClick={() => testEndpoint.mutate(item.id)}
                      >
                        <TestTube2 className="mr-1 h-4 w-4" />
                        Test
                      </Button>
                      <Button
                        size="sm"
                        variant={item.enabled ? "outline" : "default"}
                        onClick={() =>
                          toggleEndpoint.mutate({
                            id: item.id,
                            enabled: !item.enabled,
                          })
                        }
                      >
                        <Power className="mr-1 h-4 w-4" />
                        {item.enabled ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!endpoints.isLoading && !endpoints.data?.length && (
              <Card className="border-dashed lg:col-span-2">
                <CardContent className="py-14 text-center">
                  <Server className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 font-medium">No judge connections yet</p>
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() => setShowEndpointForm(true)}
                  >
                    Add your first connection
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="automation" className="mt-5 space-y-5">
          <div>
            <h2 className="text-xl font-bold">Daily automation</h2>
            <p className="text-sm text-muted-foreground">
              Schedule the current endpoint, language, and sampling setup in
              IST.
            </p>
          </div>
          <Card className="border-primary/20">
            <CardContent className="grid gap-4 p-5 lg:grid-cols-[1.5fr_1fr_auto]">
              <label className="grid gap-2 text-sm font-medium">
                <span>Schedule name</span>
                <Input
                  value={scheduleName}
                  onChange={(event) => setScheduleName(event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                <span>Start time</span>
                <select
                  className="h-10 rounded-md border bg-background px-3"
                  value={dailyHour}
                  onChange={(event) => setDailyHour(Number(event.target.value))}
                >
                  {Array.from({ length: 24 }, (_, hour) => (
                    <option key={hour} value={hour}>
                      {String(hour).padStart(2, "0")}:00 IST daily
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-end">
                <Button
                  className="w-full"
                  disabled={!runValid || !scheduleName || addSchedule.isPending}
                  onClick={() => addSchedule.mutate()}
                >
                  <CalendarClock className="mr-2 h-4 w-4" />
                  Create schedule
                </Button>
              </div>
              <div className="rounded-xl border bg-muted/25 p-3 text-sm lg:col-span-3">
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <span>
                    <strong>Judge:</strong> {selectedEndpoint?.name || "None"}
                  </span>
                  <span>
                    <strong>Languages:</strong>{" "}
                    {targetLanguages.length
                      ? targetLanguages.join(", ").toUpperCase()
                      : "All"}
                  </span>
                  <span>
                    <strong>Population:</strong>{" "}
                    {populationLimit.toLocaleString()}
                  </span>
                  <span>
                    <strong>Selection:</strong>{" "}
                    {samplingMode === "percent"
                      ? `${samplingValue}% (~${estimated})`
                      : `${samplingValue} traces`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-4 lg:grid-cols-2">
            {schedules.data?.map((item) => (
              <Card
                key={item.id}
                className={item.enabled ? "border-primary/20" : "opacity-65"}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-xl bg-blue-500/10 p-2.5 text-blue-600">
                      <CalendarClock className="h-5 w-5" />
                    </span>
                    <Switch
                      checked={item.enabled}
                      onCheckedChange={(enabled) =>
                        toggleSchedule.mutate({ id: item.id, enabled })
                      }
                    />
                  </div>
                  <h3 className="mt-4 font-semibold">{item.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.endpoint_name} · {item.default_model}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-muted/30 p-3">
                      <div className="text-xs text-muted-foreground">
                        Every day
                      </div>
                      <strong>
                        {String(item.daily_hour_ist).padStart(2, "0")}:00 IST
                      </strong>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3">
                      <div className="text-xs text-muted-foreground">
                        Selection
                      </div>
                      <strong>
                        {item.sampling_mode === "percent"
                          ? `${Number(item.sampling_value)}%`
                          : `${Number(item.sampling_value)} traces`}
                      </strong>
                    </div>
                  </div>
                  {item.last_error && (
                    <div className="mt-3 flex gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      {item.last_error}
                    </div>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {item.last_run_id ? (
                        <>
                          Last:{" "}
                          <Link
                            className="text-primary hover:underline"
                            to={`/evaluation?run=${encodeURIComponent(item.last_run_id)}`}
                          >
                            {item.last_run_id}
                          </Link>
                        </>
                      ) : (
                        "Not run yet"
                      )}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Delete ${item.name}`}
                      onClick={() => removeSchedule.mutate(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!schedules.isLoading && !schedules.data?.length && (
              <Card className="border-dashed lg:col-span-2">
                <CardContent className="py-14 text-center">
                  <CalendarClock className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 font-medium">No automations configured</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your current run setup is ready to schedule above.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-5">
          <Card className="overflow-hidden border-primary/20">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Run history
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Run ID</TableHead>
                      <TableHead>Judge</TableHead>
                      <TableHead>Requested by</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runs.data?.map((run) => {
                      const total = selectedCount(run);
                      const finished = finishedCount(run);
                      return (
                        <TableRow key={run.run_id}>
                          <TableCell>
                            <code className="text-xs">{run.run_id}</code>
                            {run.error && (
                              <div className="mt-1 flex max-w-sm gap-1 text-xs text-destructive">
                                <AlertTriangle className="h-3 w-3 shrink-0" />
                                {run.error}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{run.judge_model}</TableCell>
                          <TableCell>{run.requested_by || "—"}</TableCell>
                          <TableCell className="min-w-44">
                            <div className="mb-1 text-xs text-muted-foreground">
                              {finished} / {total || "selecting"}
                            </div>
                            <Progress
                              value={total ? (finished / total) * 100 : 2}
                            />
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={statusVariant(run.status)}
                              className="capitalize"
                            >
                              {run.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button asChild size="sm" variant="ghost">
                              <Link
                                to={`/evaluation?run=${encodeURIComponent(run.run_id)}`}
                              >
                                <ExternalLink className="mr-1 h-4 w-4" />
                                View
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {!runs.isLoading && !runs.data?.length && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No runs yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function EvaluationRunAdmin() {
  return (
    <RoleBasedAccess allowedRoles={["super-admin"]}>
      <AdminRunForm />
    </RoleBasedAccess>
  );
}
