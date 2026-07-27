import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis,
} from "recharts";
import {
  Plus, Trash2, X, List, LayoutDashboard, CalendarDays,
  Kanban, Clock, BarChart2, FolderOpen, AlertTriangle,
  TrendingUp, Check, Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { readLS, writeLS, LS_KEYS } from "@/lib/storage";

/* ─── Types ──────────────────────────────────────────────── */

type Status = "todo" | "doing" | "done";
type Priority = "low" | "medium" | "high";
type View = "dashboard" | "semaine" | "missions" | "kanban" | "echeances" | "gantt";

type Project = { id: string; name: string; color: string };
type Task = {
  id: string;
  title: string;
  description: string;
  projectId: string;
  status: Status;
  priority: Priority;
  dueDate: string;
  createdAt: string;
};

/* ─── Constantes ─────────────────────────────────────────── */

const STATUS_LABEL: Record<Status, string> = { todo: "À faire", doing: "En cours", done: "Terminé" };
const STATUS_COLOR: Record<Status, string> = { todo: "#6b7280", doing: "#f59e0b", done: "#22c55e" };
const PRIORITY_LABEL: Record<Priority, string> = { low: "Basse", medium: "Moyenne", high: "Haute" };
const PRIORITY_COLOR: Record<Priority, string> = { low: "#6b7280", medium: "#f59e0b", high: "#ef4444" };
const PROJECT_COLORS = ["#f59e0b", "#60a5fa", "#34d399", "#f87171", "#a78bfa", "#fb923c", "#38bdf8", "#4ade80"];

const LS_PROJECTS = LS_KEYS.tmProjects;
const LS_TASKS = LS_KEYS.tmTasks;
const LS_INIT = LS_KEYS.tmInit;

/* Pas de données de démo : chaque utilisateur démarre avec un TaskFlow vierge
   et crée ses propres projets / tâches. */

/* ─── Composant principal ────────────────────────────────── */

export function TaskManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<View>("dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const inited = readLS<boolean>(LS_INIT, false);
    if (!inited) {
      // Première connexion : on repart de zéro et on nettoie d'éventuelles
      // anciennes données de démo stockées localement.
      setProjects([]);
      setTasks([]);
      writeLS(LS_PROJECTS, []);
      writeLS(LS_TASKS, []);
      writeLS(LS_INIT, true);
    } else {
      setProjects(readLS<Project[]>(LS_PROJECTS, []));
      setTasks(readLS<Task[]>(LS_TASKS, []));
    }
  }, []);

  const saveProjects = (next: Project[]) => { setProjects(next); writeLS(LS_PROJECTS, next); };
  const saveTasks = (next: Task[]) => { setTasks(next); writeLS(LS_TASKS, next); };

  const visibleTasks = selectedProjectId
    ? tasks.filter((t) => t.projectId === selectedProjectId)
    : tasks;

  const openNew = () => { setEditTask(null); setShowTaskForm(true); };
  const openEdit = (t: Task) => { setEditTask(t); setShowTaskForm(true); };
  const deleteTask = (id: string) => saveTasks(tasks.filter((t) => t.id !== id));
  const changeStatus = (id: string, s: Status) => saveTasks(tasks.map((t) => (t.id === id ? { ...t, status: s } : t)));

  return (
    <div className="flex min-h-[680px] overflow-hidden rounded-2xl border bg-card shadow-card">
      {/* Sidebar desktop */}
      <div className="hidden md:block">
        <Sidebar
          projects={projects} tasks={tasks} selectedProjectId={selectedProjectId}
          onSelectProject={(id) => { setSelectedProjectId(id); setSidebarOpen(false); }}
          onAddProject={() => { setEditProject(null); setShowProjectForm(true); }}
          onEditProject={(p) => { setEditProject(p); setShowProjectForm(true); }}
          onDeleteProject={(id) => {
            if (tasks.some((t) => t.projectId === id)) {
              if (!window.confirm("Ce projet contient des tâches. Supprimer quand même ?")) return;
              saveTasks(tasks.map((t) => t.projectId === id ? { ...t, projectId: "" } : t));
            }
            if (selectedProjectId === id) setSelectedProjectId(null);
            saveProjects(projects.filter((p) => p.id !== id));
          }}
        />
      </div>

      {/* Sidebar mobile (overlay) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="absolute inset-y-0 left-0">
            <Sidebar
              projects={projects} tasks={tasks} selectedProjectId={selectedProjectId}
              onSelectProject={(id) => { setSelectedProjectId(id); setSidebarOpen(false); }}
              onAddProject={() => { setEditProject(null); setShowProjectForm(true); setSidebarOpen(false); }}
              onEditProject={(p) => { setEditProject(p); setShowProjectForm(true); setSidebarOpen(false); }}
              onDeleteProject={(id) => {
                if (tasks.some((t) => t.projectId === id)) {
                  if (!window.confirm("Ce projet contient des tâches. Supprimer quand même ?")) return;
                  saveTasks(tasks.map((t) => t.projectId === id ? { ...t, projectId: "" } : t));
                }
                if (selectedProjectId === id) setSelectedProjectId(null);
                saveProjects(projects.filter((p) => p.id !== id));
                setSidebarOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Zone principale */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* En-tête */}
        <div className="flex items-start justify-between gap-3 border-b px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border md:hidden"
              aria-label="Menu projets"
            >
              <List className="h-4 w-4" />
            </button>
            <div>
              <h2 className="font-display text-lg font-bold md:text-xl">
                {selectedProjectId
                  ? projects.find((p) => p.id === selectedProjectId)?.name
                  : "Toutes les tâches"}
              </h2>
              <p className="text-xs text-muted-foreground">{visibleTasks.length} tâches</p>
            </div>
          </div>
          <button
            onClick={openNew}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-400 transition-colors md:px-4"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nouvelle tâche</span>
          </button>
        </div>

        {/* Onglets */}
        <TabBar view={view} onView={setView} />

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-5">
          {view === "dashboard" && <DashboardView projects={projects} tasks={visibleTasks} />}
          {view === "semaine" && <WeekView tasks={visibleTasks} projects={projects} onEdit={openEdit} onDelete={deleteTask} onStatusChange={changeStatus} />}
          {view === "missions" && <MissionsView tasks={visibleTasks} projects={projects} onEdit={openEdit} onDelete={deleteTask} onStatusChange={changeStatus} />}
          {view === "kanban" && <KanbanView tasks={visibleTasks} projects={projects} onEdit={openEdit} onDelete={deleteTask} onStatusChange={changeStatus} />}
          {view === "echeances" && <DeadlinesView tasks={visibleTasks} projects={projects} onEdit={openEdit} onDelete={deleteTask} onStatusChange={changeStatus} />}
          {view === "gantt" && <GanttView tasks={visibleTasks} projects={projects} />}
        </div>
      </div>

      {/* Modales */}
      {showTaskForm && (
        <TaskFormModal
          task={editTask}
          projects={projects}
          defaultProjectId={selectedProjectId}
          onClose={() => setShowTaskForm(false)}
          onSave={(task) => {
            saveTasks(editTask ? tasks.map((t) => (t.id === task.id ? task : t)) : [task, ...tasks]);
            setShowTaskForm(false);
          }}
        />
      )}
      {showProjectForm && (
        <ProjectFormModal
          project={editProject}
          usedColors={projects.filter((p) => p.id !== editProject?.id).map((p) => p.color)}
          onClose={() => { setShowProjectForm(false); setEditProject(null); }}
          onSave={(p) => {
            if (editProject) {
              saveProjects(projects.map((x) => (x.id === p.id ? p : x)));
            } else {
              saveProjects([...projects, p]);
            }
            setShowProjectForm(false);
            setEditProject(null);
          }}
        />
      )}
    </div>
  );
}

/* ─── Sidebar ────────────────────────────────────────────── */

function Sidebar({ projects, tasks, selectedProjectId, onSelectProject, onAddProject, onEditProject, onDeleteProject }: {
  projects: Project[]; tasks: Task[]; selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  onAddProject: () => void;
  onEditProject: (p: Project) => void;
  onDeleteProject: (id: string) => void;
}) {
  return (
    <div className="flex w-52 shrink-0 flex-col overflow-y-auto border-r bg-muted/20">
      <div className="border-b px-4 py-4">
        <div className="flex items-center gap-2 font-display text-base font-bold">
          <LayoutDashboard className="h-5 w-5 text-amber-500" /> TaskFlow
        </div>
      </div>
      <div className="flex-1 p-2 space-y-0.5">
        <button
          onClick={() => onSelectProject(null)}
          className={cn("w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors", !selectedProjectId ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted/60")}
        >
          <div className="flex items-center gap-2"><List className="h-4 w-4" /> Toutes les tâches</div>
          <span className="text-xs text-muted-foreground">{tasks.length}</span>
        </button>

        <div className="pt-3">
          <div className="flex items-center justify-between px-3 pb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Projets</span>
            <button onClick={onAddProject} className="rounded p-0.5 hover:bg-muted" title="Nouveau projet">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          {projects.map((p) => {
            const count = tasks.filter((t) => t.projectId === p.id).length;
            return (
              <div key={p.id} className="group relative">
                <button
                  onClick={() => onSelectProject(p.id === selectedProjectId ? null : p.id)}
                  className={cn("w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors pr-16", selectedProjectId === p.id ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted/60")}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.color }} />
                    <span className="truncate">{p.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{count}</span>
                </button>
                {/* Actions edit / delete */}
                <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden items-center gap-0.5 group-hover:flex">
                  <button
                    onClick={(e) => { e.stopPropagation(); onEditProject(p); }}
                    className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                    title="Modifier"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteProject(p.id); }}
                    className="rounded p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    title="Supprimer"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Tab bar ────────────────────────────────────────────── */

const TABS: { id: View; label: string; Icon: React.ElementType }[] = [
  { id: "dashboard", label: "Tableau de bord", Icon: LayoutDashboard },
  { id: "semaine",   label: "Ma semaine",       Icon: CalendarDays },
  { id: "missions",  label: "Missions",          Icon: List },
  { id: "kanban",    label: "Kanban",            Icon: Kanban },
  { id: "echeances", label: "Échéances",         Icon: Clock },
  { id: "gantt",     label: "Gantt",             Icon: BarChart2 },
];

function TabBar({ view, onView }: { view: View; onView: (v: View) => void }) {
  return (
    <div className="flex overflow-x-auto border-b bg-muted/10">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => onView(id)}
          className={cn(
            "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 text-xs font-medium transition-colors",
            view === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="h-3.5 w-3.5" /> {label}
        </button>
      ))}
    </div>
  );
}

/* ─── Dashboard ──────────────────────────────────────────── */

function DashboardView({ projects, tasks }: { projects: Project[]; tasks: Task[] }) {
  const now = new Date();
  const todo  = tasks.filter((t) => t.status === "todo").length;
  const doing = tasks.filter((t) => t.status === "doing").length;
  const done  = tasks.filter((t) => t.status === "done").length;
  const late  = tasks.filter((t) => t.status !== "done" && t.dueDate && new Date(t.dueDate) < now).length;
  const soon  = tasks.filter((t) => t.status !== "done" && t.dueDate && new Date(t.dueDate) > now && new Date(t.dueDate).getTime() - now.getTime() < 7 * 86400000).length;
  const donePct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  const kpis = [
    { label: "Projets",      value: projects.length, sub: "",                      Icon: FolderOpen,     color: "text-violet-500" },
    { label: "Tâches",       value: tasks.length,    sub: `${donePct}% terminées`, Icon: List,           color: "text-blue-500" },
    { label: "En cours",     value: doing,           sub: "",                      Icon: Clock,          color: "text-amber-500" },
    { label: "Terminées",    value: done,            sub: "",                      Icon: Check,          color: "text-emerald-500" },
    { label: "En retard",    value: late,            sub: "",                      Icon: AlertTriangle,  color: "text-rose-500" },
    { label: "Bientôt dues", value: soon,            sub: "≤ 7 jours",             Icon: TrendingUp,     color: "text-orange-500" },
  ];

  const statusData = [
    { name: "À faire",  value: todo,  color: STATUS_COLOR.todo },
    { name: "En cours", value: doing, color: STATUS_COLOR.doing },
    { name: "Terminé",  value: done,  color: STATUS_COLOR.done },
  ];
  const priorityData = [
    { name: "Basse",   value: tasks.filter((t) => t.priority === "low").length,    color: PRIORITY_COLOR.low },
    { name: "Moyenne", value: tasks.filter((t) => t.priority === "medium").length, color: PRIORITY_COLOR.medium },
    { name: "Haute",   value: tasks.filter((t) => t.priority === "high").length,   color: PRIORITY_COLOR.high },
  ];
  const projectData = projects
    .map((p) => ({ name: p.name.length > 11 ? p.name.slice(0, 11) + "…" : p.name, value: tasks.filter((t) => t.projectId === p.id).length, color: p.color }))
    .filter((p) => p.value > 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
        {kpis.map(({ label, value, sub, Icon, color }) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <div className="mb-2 flex items-center gap-1.5">
              <Icon className={cn("h-4 w-4", color)} />
              <span className="text-[11px] text-muted-foreground">{label}</span>
            </div>
            <div className="font-display text-2xl font-bold">{value}</div>
            {sub && <div className="mt-0.5 text-[10px] text-muted-foreground">{sub}</div>}
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <MiniDonut title="Répartition par statut" data={statusData} />
        <MiniDonut title="Répartition par priorité" data={priorityData} />
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tâches par projet</div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectData} margin={{ top: 4, bottom: 4 }}>
                <XAxis dataKey="name" fontSize={9} tick={{ fill: "#9ca3af" }} />
                <YAxis fontSize={9} allowDecimals={false} tick={{ fill: "#9ca3af" }} />
                <Tooltip />
                <Bar dataKey="value" radius={4}>
                  {projectData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniDonut({ title, data }: { title: string; data: { name: string; value: number; color: string }[] }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={42} outerRadius={65} cx="40%" cy="50%">
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Legend
              layout="vertical" align="right" verticalAlign="middle"
              wrapperStyle={{ fontSize: 11 }}
              formatter={(v, entry: any) => (
                <span style={{ color: "#9ca3af" }}>{v} <strong style={{ color: "#e5e7eb" }}>{entry.payload.value}</strong></span>
              )}
            />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ─── TaskCard (partagé) ─────────────────────────────────── */

function TaskCard({ task, project, onEdit, onDelete, onStatusChange, compact = false }: {
  task: Task; project?: Project; onEdit: (t: Task) => void;
  onDelete: (id: string) => void; onStatusChange: (id: string, s: Status) => void; compact?: boolean;
}) {
  const now = new Date();
  const isLate = task.status !== "done" && task.dueDate && new Date(task.dueDate) < now;

  return (
    <div
      onClick={() => onEdit(task)}
      className={cn("group cursor-pointer rounded-xl border bg-card transition-colors hover:border-primary/50", compact ? "p-3" : "p-4")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium leading-tight">{task.title}</div>
          {task.description && !compact && (
            <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.description}</div>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          className="shrink-0 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {project && (
          <span
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium"
            style={{ background: project.color + "28", color: project.color }}
          >
            <div className="h-1.5 w-1.5 rounded-full" style={{ background: project.color }} />
            {project.name}
          </span>
        )}
        {task.dueDate && (
          <span className={cn("inline-flex items-center gap-1 text-[10px]", isLate ? "text-rose-500" : "text-muted-foreground")}>
            <CalendarDays className="h-3 w-3" />
            {new Date(task.dueDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
          </span>
        )}
        <select
          value={task.status}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => { e.stopPropagation(); onStatusChange(task.id, e.target.value as Status); }}
          className="ml-auto cursor-pointer rounded border bg-background px-1.5 py-0.5 text-[10px]"
          style={{ color: STATUS_COLOR[task.status] }}
        >
          {(Object.entries(STATUS_LABEL) as [Status, string][]).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

/* ─── Ma semaine ─────────────────────────────────────────── */

function WeekView({ tasks, projects, onEdit, onDelete, onStatusChange }: SharedViewProps) {
  const now = new Date();
  const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const weekTasks = tasks.filter((t) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    return d >= mon && d <= sun;
  });
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Semaine du {mon.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} au {sun.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
      </p>
      {weekTasks.length === 0
        ? <Empty text="Aucune tâche cette semaine." />
        : <div className="space-y-2">{weekTasks.map((t) => <TaskCard key={t.id} task={t} project={projects.find((p) => p.id === t.projectId)} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} />)}</div>}
    </div>
  );
}

/* ─── Missions (liste filtrée) ───────────────────────────── */

function MissionsView({ tasks, projects, onEdit, onDelete, onStatusChange }: SharedViewProps) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");

  const filtered = useMemo(() => tasks.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    return true;
  }), [tasks, search, filterStatus, filterPriority]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…" className="min-w-[180px] flex-1 rounded-lg border bg-background px-3 py-1.5 text-sm" />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="rounded-lg border bg-background px-3 py-1.5 text-sm">
          <option value="all">Tous statuts</option>
          {(Object.entries(STATUS_LABEL) as [Status, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as any)} className="rounded-lg border bg-background px-3 py-1.5 text-sm">
          <option value="all">Toutes priorités</option>
          {(Object.entries(PRIORITY_LABEL) as [Priority, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      {filtered.length === 0
        ? <Empty text="Aucune tâche trouvée." />
        : <div className="space-y-2">{filtered.map((t) => <TaskCard key={t.id} task={t} project={projects.find((p) => p.id === t.projectId)} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} />)}</div>}
    </div>
  );
}

/* ─── Kanban ─────────────────────────────────────────────── */

function KanbanView({ tasks, projects, onEdit, onDelete, onStatusChange }: SharedViewProps) {
  const [dragging, setDragging] = useState<string | null>(null);
  const cols: { status: Status }[] = [{ status: "todo" }, { status: "doing" }, { status: "done" }];

  return (
    <div className="grid h-full min-h-[480px] grid-cols-3 gap-4">
      {cols.map(({ status }) => {
        const colTasks = tasks.filter((t) => t.status === status);
        return (
          <div
            key={status}
            className="flex flex-col rounded-xl bg-muted/20 p-3"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (dragging) onStatusChange(dragging, status); setDragging(null); }}
          >
            <div className="mb-3 flex items-center gap-2 px-1">
              <div className="h-2 w-2 rounded-full" style={{ background: STATUS_COLOR[status] }} />
              <span className="text-sm font-semibold">{STATUS_LABEL[status]}</span>
              <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{colTasks.length}</span>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto">
              {colTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => setDragging(task.id)}
                  onDragEnd={() => setDragging(null)}
                  className={cn(dragging === task.id && "opacity-40")}
                >
                  <TaskCard task={task} project={projects.find((p) => p.id === task.projectId)} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} compact />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Échéances ──────────────────────────────────────────── */

function DeadlinesView({ tasks, projects, onEdit, onDelete, onStatusChange }: SharedViewProps) {
  const now = new Date();
  const sorted = [...tasks]
    .filter((t) => t.status !== "done" && t.dueDate)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="space-y-2">
      {sorted.length === 0 && <Empty text="Aucune échéance à venir." />}
      {sorted.map((task) => {
        const daysLeft = Math.ceil((new Date(task.dueDate).getTime() - now.getTime()) / 86400000);
        return (
          <div key={task.id} className="flex items-center gap-3">
            <div className={cn("w-16 shrink-0 rounded-lg py-2 text-center text-xs font-semibold",
              daysLeft < 0 ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
              : daysLeft <= 7 ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
              : "bg-muted text-muted-foreground")}>
              {daysLeft < 0 ? `${-daysLeft}j retard` : daysLeft === 0 ? "Auj." : `${daysLeft}j`}
            </div>
            <div className="flex-1">
              <TaskCard task={task} project={projects.find((p) => p.id === task.projectId)} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} compact />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Gantt (simplifié) ──────────────────────────────────── */

function GanttView({ tasks, projects }: { tasks: Task[]; projects: Project[] }) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end   = new Date(now.getFullYear(), now.getMonth() + 3, 0);
  const totalMs = end.getTime() - start.getTime();

  const ganttTasks = tasks.filter((t) => t.dueDate && t.createdAt);

  const months: { label: string; left: number; width: number }[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    const mStart = new Date(cur.getFullYear(), cur.getMonth(), 1);
    const mEnd   = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
    const l = Math.max(0, ((mStart.getTime() - start.getTime()) / totalMs) * 100);
    const r = Math.min(100, ((mEnd.getTime()  - start.getTime()) / totalMs) * 100);
    months.push({ label: cur.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }), left: l, width: r - l });
    cur.setMonth(cur.getMonth() + 1);
  }

  const todayPct = ((now.getTime() - start.getTime()) / totalMs) * 100;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{ganttTasks.length} tâche(s) avec dates affichées — ligne rouge = aujourd'hui</p>

      {/* En-tête mois */}
      <div className="relative ml-40 h-6 border-b">
        {months.map((m) => (
          <div
            key={m.label}
            className="absolute flex h-full items-center border-r px-2 text-[10px] font-medium text-muted-foreground"
            style={{ left: `${m.left}%`, width: `${m.width}%` }}
          >
            {m.label}
          </div>
        ))}
      </div>

      {ganttTasks.length === 0 && <Empty text="Ajoutez des dates de création et d'échéance pour voir le Gantt." />}

      {ganttTasks.map((task) => {
        const project = projects.find((p) => p.id === task.projectId);
        const s = new Date(task.createdAt);
        const e = new Date(task.dueDate);
        const leftPct  = Math.max(0,   ((s.getTime() - start.getTime()) / totalMs) * 100);
        const rightPct = Math.min(100, ((e.getTime() - start.getTime()) / totalMs) * 100);
        const widthPct = Math.max(1, rightPct - leftPct);

        return (
          <div key={task.id} className="flex items-center gap-3">
            <div className="w-40 shrink-0 truncate pr-2 text-right text-xs font-medium">{task.title}</div>
            <div className="relative h-7 flex-1 overflow-hidden rounded bg-muted/30">
              <div
                className="absolute flex h-full items-center rounded px-2 text-[10px] font-medium text-white"
                style={{ left: `${leftPct}%`, width: `${widthPct}%`, background: project?.color ?? "#6b7280" }}
              >
                {widthPct > 12 && task.title}
              </div>
              <div className="absolute top-0 h-full w-0.5 bg-rose-500/70" style={{ left: `${todayPct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Modales ────────────────────────────────────────────── */

function TaskFormModal({ task, projects, defaultProjectId, onClose, onSave }: {
  task: Task | null; projects: Project[]; defaultProjectId: string | null;
  onClose: () => void; onSave: (t: Task) => void;
}) {
  const [title,       setTitle]       = useState(task?.title       ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [projectId,   setProjectId]   = useState(task?.projectId   ?? defaultProjectId ?? projects[0]?.id ?? "");
  const [status,      setStatus]      = useState<Status>(task?.status      ?? "todo");
  const [priority,    setPriority]    = useState<Priority>(task?.priority  ?? "medium");
  const [dueDate,     setDueDate]     = useState(task?.dueDate     ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ id: task?.id ?? crypto.randomUUID(), title: title.trim(), description: description.trim(), projectId, status, priority, dueDate, createdAt: task?.createdAt ?? new Date().toISOString().slice(0, 10) });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">{task ? "Modifier la tâche" : "Nouvelle tâche"}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre *" required className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={2} className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm" />
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Projet", el: <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm">{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select> },
              { label: "Statut", el: <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm">{(Object.entries(STATUS_LABEL) as [Status, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select> },
              { label: "Priorité", el: <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm">{(Object.entries(PRIORITY_LABEL) as [Priority, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select> },
              { label: "Échéance", el: <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" /> },
            ].map(({ label, el }) => (
              <div key={label}><label className="mb-1 block text-xs text-muted-foreground">{label}</label>{el}</div>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border px-4 py-2 text-sm hover:bg-muted">Annuler</button>
            <button type="submit" className="flex-1 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-400">
              {task ? "Enregistrer" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProjectFormModal({ project, usedColors, onClose, onSave }: { project: Project | null; usedColors: string[]; onClose: () => void; onSave: (p: Project) => void }) {
  const [name,  setName]  = useState(project?.name  ?? "");
  const [color, setColor] = useState(project?.color ?? PROJECT_COLORS.find((c) => !usedColors.includes(c)) ?? PROJECT_COLORS[0]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">{project ? "Modifier le projet" : "Nouveau projet"}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) onSave({ id: project?.id ?? crypto.randomUUID(), name: name.trim(), color }); }} className="space-y-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du projet *" required className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
          <div>
            <label className="mb-2 block text-xs text-muted-foreground">Couleur</label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={cn("h-7 w-7 rounded-full border-2 transition-transform", color === c ? "scale-110 border-foreground" : "border-transparent")}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border px-4 py-2 text-sm hover:bg-muted">Annuler</button>
            <button type="submit" className="flex-1 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-400">
              {project ? "Enregistrer" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Utilitaires ────────────────────────────────────────── */

type SharedViewProps = {
  tasks: Task[]; projects: Project[];
  onEdit: (t: Task) => void; onDelete: (id: string) => void; onStatusChange: (id: string, s: Status) => void;
};

function Empty({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">{text}</div>;
}
