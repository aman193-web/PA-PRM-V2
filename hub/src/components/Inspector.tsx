import { useRef } from "react"
import { ArrowRight, Sparkles } from "lucide-react"
import { byId, type Faq, type Gap, type PermAction, type Rule } from "@hub/content"
import { personas, roleOrder, roleShort } from "@hub/content/personas"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@hub/components/ui/sheet"
import { Button } from "@hub/components/ui/button"
import { CellMark, cellText, CommentButton, ItemLink, KindTag, Sources, StageBadge, StatusChip } from "@hub/components/bits"
import { useNav } from "@hub/lib/nav"

export function Inspector() {
  const { inspected, inspect, askAssistant } = useNav()
  const item = inspected ? byId.get(inspected) : undefined
  const body = useRef<HTMLDivElement>(null)

  return (
    <Sheet open={!!item} onOpenChange={(o) => !o && inspect(null)}>
      <SheetContent className="flex flex-col gap-0 overflow-y-auto p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[560px]">
        {item && (
          <>
            <SheetHeader className="gap-2 border-b px-6 py-5">
              <div className="flex flex-wrap items-center gap-2 pr-8">
                <KindTag kind={item.kind} />
                {/^(R-|UX-|G\d)/.test(item.id) && <span className="font-mono text-[12.5px] text-muted-foreground">{item.id}</span>}
              </div>
              <SheetTitle className="text-[21px] leading-snug">{item.title}</SheetTitle>
              <SheetDescription className="sr-only">Details, status and sources</SheetDescription>
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip status={item.status} />
                <StageBadge stage={item.stage} />
              </div>
            </SheetHeader>

            <div ref={body} className="flex-1 space-y-6 px-6 py-5">
              {item.kind === "faq" ? (
                <p className="text-[16px] leading-relaxed text-foreground">{(item as Faq).answer}</p>
              ) : (
                <p className="text-[16px] leading-relaxed text-foreground">{item.summary}</p>
              )}

              {item.kind === "rule" && (item as Rule).numbers?.length ? (
                <div>
                  <p className="eyebrow mb-2 text-muted-foreground">Numbers</p>
                  <ul className="flex flex-wrap gap-2">
                    {(item as Rule).numbers!.map((n) => <li key={n} className="rounded-lg bg-muted px-3 py-1.5 font-mono text-[13.5px] text-foreground">{n}</li>)}
                  </ul>
                </div>
              ) : null}

              {item.kind === "rule" && (item as Rule).requirementIds?.length ? (
                <p className="text-[14px] text-muted-foreground">Requirements: <span className="font-mono text-foreground">{(item as Rule).requirementIds!.join(" · ")}</span></p>
              ) : null}

              {item.kind === "permission" && <PermissionRoles action={item as PermAction} />}

              {item.kind === "gap" && (
                <div className="space-y-3">
                  <p className="eyebrow text-muted-foreground">What the sources say</p>
                  <ul className="space-y-2">
                    {(item as Gap).says.map((s, i) => (
                      <li key={i} className="flex gap-3 rounded-[10px] border p-3 text-[14.5px]">
                        <span className="w-20 shrink-0 font-mono text-[12.5px] font-semibold text-foreground">{s.doc}</span>
                        <span>{s.text}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="rounded-[12px] bg-amber-soft/70 p-4">
                    <p className="eyebrow mb-1 text-amber-ink">Practical default</p>
                    <p className="text-foreground">{(item as Gap).resolution}</p>
                    <p className="mt-1 text-[13.5px] text-muted-foreground">Decision owner: {(item as Gap).owner}</p>
                  </div>
                </div>
              )}

              {item.points?.length ? (
                <ul className="space-y-2 text-[15px]">
                  {item.points.map((p) => <li key={p} className="flex gap-2.5"><span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />{p}</li>)}
                </ul>
              ) : null}

              <div>
                <p className="eyebrow mb-2 text-muted-foreground">Sources</p>
                <Sources sources={item.sources} />
              </div>

              {item.related?.length ? (
                <div>
                  <p className="eyebrow mb-2 text-muted-foreground">Related</p>
                  <div className="flex flex-col gap-2">
                    {item.related.map((r) => <ItemLink key={r} id={r} />)}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2 border-t px-6 py-4">
              <Button variant="outline" onClick={() => askAssistant(`Explain "${item.title}" (${item.id}) and how it affects each role.`)}>
                <Sparkles className="text-primary" /> Ask about this
              </Button>
              <CommentButton target={body} label="Comment or raise a doubt" />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function PermissionRoles({ action }: { action: PermAction }) {
  const { open } = useNav()
  return (
    <div>
      <p className="eyebrow mb-2 text-muted-foreground">By role</p>
      <ul className="divide-y rounded-[12px] border">
        {roleOrder.map((r) => {
          const cell = action.cells[r] ?? "no"
          const p = personas.find((x) => x.id === r)!
          return (
            <li key={r}>
              <button onClick={() => open(r)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50">
                <CellMark cell={cell} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-medium text-foreground">{roleShort[r]}</span>
                  <span className="block text-[13px] text-muted-foreground">{action.notes?.[r] ?? cellText(cell)} · {p.side === "vendor" ? "Vendor" : "Partner"}</span>
                </span>
                <ArrowRight className="size-4 text-muted-foreground" />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
