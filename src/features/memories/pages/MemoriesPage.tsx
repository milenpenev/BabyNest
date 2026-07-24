import {
  BookHeart,
  BookOpen,
  CalendarDays,
  FolderHeart,
  Heart,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import PremiumGate from "../../../components/premium/PremiumGate";
import { useActivityStore } from "../../../store/activityStore";
import { useBabyStore } from "../../../store/babyStore";
import { useCurrentUserStore } from "../../../store/currentUserStore";
import { useFamilyStore } from "../../../store/familyStore";
import { useMemoryStore } from "../../../store/memoryStore";
import { useSubscriptionStore } from "../../../store/subscriptionStore";
import MemoryCard from "../components/MemoryCard";
import MemoryEditor from "../components/MemoryEditor";
import type { Memory } from "../model/memory.types";
import { memoryTitle } from "../utils/memoryDisplay";
import { buildDeterministicStory } from "../utils/memoryStory";

type Section = "latest" | "favorites" | "month" | "year" | "milestones";
export default function MemoriesPage() {
  const { t } = useTranslation();
  const baby = useBabyStore((s) =>
    s.babies.find((item) => item.id === s.selectedBabyId),
  );
  const allMemories = useMemoryStore((s) => s.memories);
  const albums = useMemoryStore((s) => s.albums);
  const upsert = useMemoryStore((s) => s.upsertMemory);
  const remove = useMemoryStore((s) => s.deleteMemory);
  const favorite = useMemoryStore((s) => s.toggleFavorite);
  const activities = useActivityStore((s) => s.activities);
  const members = useFamilyStore((s) => s.members);
  const currentUser = useCurrentUserStore((s) => s.currentUser);
  const premium = useSubscriptionStore((s) => s.effectivePlan) === "premium";
  const [editing, setEditing] = useState<Memory | "new" | null>(null);
  const [search, setSearch] = useState("");
  const [section, setSection] = useState<Section>("latest");
  const [album, setAlbum] = useState<string>("all");
  const [albumName, setAlbumName] = useState("");
  const addAlbum = useMemoryStore((s) => s.addAlbum);
  const member = members.find((item) => item.userId === currentUser.id);
  const memories = useMemo(
    () =>
      allMemories
        .filter((item) => item.babyId === baby?.id)
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
    [allMemories, baby?.id],
  );
  if (!baby || !member) return null;
  const now = new Date();
  const visible = memories.filter((memory) => {
    const date = new Date(memory.date);
    if (section === "favorites" && !memory.favorite) return false;
    if (
      section === "month" &&
      (date.getMonth() !== now.getMonth() ||
        date.getFullYear() !== now.getFullYear())
    )
      return false;
    if (section === "year" && date.getFullYear() !== now.getFullYear())
      return false;
    if (
      section === "milestones" &&
      !memory.relatedMilestoneId &&
      !memory.tags.includes("milestones")
    )
      return false;
    if (album !== "all") {
      const selected = albums.find((item) => item.id === album);
      if (selected && !selected.tags.some((tag) => memory.tags.includes(tag)))
        return false;
    }
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [
      memoryTitle(memory, t),
      memory.description,
      ...memory.tags,
      String(date.getMonth() + 1),
      String(date.getFullYear()),
      memory.relatedActivityId,
      memory.relatedMilestoneId,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });
  const story = buildDeterministicStory(memories, activities, baby.id);
  const albumContent = (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800 sm:p-6">
      <div className="flex items-center gap-2">
        <FolderHeart className="h-5 w-5 text-violet-600" />
        <h2 className="text-xl font-bold">{t("memories.albumsTitle")}</h2>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setAlbum("all")}
          className={`rounded-full px-3 py-1.5 text-sm ${album === "all" ? "bg-violet-600 text-white" : "bg-slate-100 dark:bg-slate-700"}`}
        >
          {t("memories.all")}
        </button>
        {albums.map((item) => (
          <button
            key={item.id}
            onClick={() => setAlbum(item.id)}
            className={`rounded-full px-3 py-1.5 text-sm ${album === item.id ? "bg-violet-600 text-white" : "bg-slate-100 dark:bg-slate-700"}`}
          >
            {item.nameKey ? t(item.nameKey) : item.name}
          </button>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <input
          value={albumName}
          onChange={(e) => setAlbumName(e.target.value)}
          placeholder={t("memories.customAlbum")}
          className="h-10 min-w-0 flex-1 rounded-xl border px-3 dark:border-slate-600 dark:bg-slate-900"
        />
        <button
          onClick={() => {
            addAlbum(albumName, [albumName.trim().toLowerCase()]);
            setAlbumName("");
          }}
          className="rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white"
        >
          {t("memories.addAlbum")}
        </button>
      </div>
    </section>
  );
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-rose-500 via-fuchsia-600 to-violet-700 p-6 text-white sm:p-8">
        <BookHeart className="h-9 w-9" />
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
          {t("memories.title")}
        </h1>
        <p className="mt-2 max-w-2xl text-rose-100">
          {t("memories.description")}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => setEditing("new")}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 font-semibold text-violet-700"
          >
            <Plus className="h-4 w-4" />
            {t("memories.add")}
          </button>
          <Link
            to="/memories/book"
            className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 font-semibold text-white"
          >
            <BookOpen className="h-4 w-4" />
            {t("memories.babyBook")}
          </Link>
        </div>
      </section>
      <section className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 dark:border-violet-900 dark:from-violet-950/40 dark:to-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-600" />
          <h2 className="font-bold">{t("memories.story.title")}</h2>
        </div>
        <div className="mt-3 space-y-1 text-sm text-slate-700 dark:text-slate-200">
          {story.map((line, index) => (
            <p key={`${line.key}:${index}`}>
              {t(
                line.key,
                line.values?.title
                  ? { ...line.values, title: t(String(line.values.title)) }
                  : line.values,
              )}
            </p>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {t("memories.story.disclaimer")}
        </p>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("memories.search")}
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            ["latest", "favorites", "month", "year", "milestones"] as Section[]
          ).map((value) => (
            <button
              key={value}
              onClick={() => setSection(value)}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm ${section === value ? "bg-rose-600 text-white" : "bg-slate-100 dark:bg-slate-700"}`}
            >
              {value === "favorites" ? (
                <Heart className="h-3.5 w-3.5" />
              ) : (
                <CalendarDays className="h-3.5 w-3.5" />
              )}
              {t(`memories.sections.${value}`)}
            </button>
          ))}
        </div>
      </section>
      {premium ? (
        albumContent
      ) : (
        <PremiumGate
          title={t("memories.albumsPremiumTitle")}
          description={t("memories.albumsPremiumDescription")}
          preview={albumContent}
        >
          {albumContent}
        </PremiumGate>
      )}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {t(`memories.sections.${section}`)}
          </h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold dark:bg-slate-700">
            {visible.length}
          </span>
        </div>
        {visible.length ? (
          <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((memory) => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                onEdit={setEditing}
                onDelete={(item) => {
                  if (window.confirm(t("memories.deleteConfirm")))
                    remove(item.id);
                }}
                onFavorite={favorite}
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-slate-700">
            {t("memories.empty")}
          </div>
        )}
      </section>
      {editing ? (
        <MemoryEditor
          babyId={baby.id}
          authorId={member.id}
          memory={editing === "new" ? undefined : editing}
          onSave={upsert}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </main>
  );
}
