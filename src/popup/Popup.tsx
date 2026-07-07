import { useEffect, useRef, useState } from "react";
import { MousePointerSquareDashed, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { ActionResponse, Message, RunResult, StateResponse } from "@/lib/messages";

const MIN_WIDTH = 320;
const MAX_WIDTH = 1600;

function send<T>(tabId: number, msg: Message): Promise<T | null> {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, msg, (resp) => {
      if (chrome.runtime.lastError) resolve(null);
      else resolve(resp as T);
    });
  });
}

function StatusLine({ last }: { last: RunResult | null }) {
  if (!last) return null;
  const el = last.element ? (
    <code className="bg-muted rounded px-1 py-0.5 font-mono text-[11px]">{last.element}</code>
  ) : (
    "the element"
  );
  const text = (() => {
    switch (last.reason) {
      case "applied-auto":
        return <>Applied to {el} (auto-detected).</>;
      case "applied-manual":
        return <>Applied to your picked {el}.</>;
      case "already-contained":
        return <>Already has a container ({el}) – nothing to do.</>;
      case "no-candidate":
        return <>Couldn't find a main content element. Try picking one.</>;
      case "disabled":
        return <>Off – flip the switch to add a container on this site.</>;
    }
  })();
  return <p className="text-muted-foreground min-h-4 text-xs leading-relaxed">{text}</p>;
}

export function Popup() {
  const [tabId, setTabId] = useState<number | null>(null);
  const [state, setState] = useState<StateResponse | null>(null);
  const [width, setWidth] = useState(1200);
  const [unavailable, setUnavailable] = useState(false);
  const widthTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.tabs) return;
    (async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return setUnavailable(true);
      setTabId(tab.id);
      const s = await send<StateResponse>(tab.id, { type: "GET_STATE" });
      if (!s) setUnavailable(true);
      else {
        setState(s);
        setWidth(s.maxWidth);
      }
    })();
  }, []);

  async function onToggle(enabled: boolean) {
    if (tabId == null) return;
    const resp = await send<ActionResponse>(tabId, { type: "SET_ENABLED", enabled });
    setState((s) => (s ? { ...s, enabled, last: resp?.last ?? s.last } : s));
  }

  // Update locally on every tick for a smooth drag; debounce the persisted change.
  function onWidth(next: number) {
    setWidth(next);
    if (tabId == null) return;
    window.clearTimeout(widthTimer.current);
    widthTimer.current = window.setTimeout(async () => {
      const resp = await send<ActionResponse>(tabId, { type: "SET_MAX_WIDTH", maxWidth: next });
      setState((s) => (s ? { ...s, maxWidth: next, last: resp?.last ?? s.last } : s));
    }, 120);
  }

  async function onPick() {
    if (tabId == null) return;
    await send(tabId, { type: "START_PICKER" });
    window.close();
  }

  async function onReset() {
    if (tabId == null) return;
    await send<ActionResponse>(tabId, { type: "RESET_SITE" });
    const s = await send<StateResponse>(tabId, { type: "GET_STATE" });
    if (s) {
      setState(s);
      setWidth(s.maxWidth);
    }
  }

  if (unavailable) {
    return (
      <Card className="rounded-none border-0 shadow-none">
        <CardContent className="text-muted-foreground text-sm">
          max-w can't run on this page.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gap-0 py-0 rounded-none border-0 shadow-none">
      <CardHeader className="flex items-center justify-between gap-2 border-b py-3">
        <CardTitle className="text-[15px]">max-w</CardTitle>
        <span className="text-muted-foreground max-w-[150px] truncate text-xs" title={state?.host}>
          {state?.host ?? "…"}
        </span>
      </CardHeader>

      <CardContent className="flex flex-col gap-5 py-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="enabled">Enable on this site</Label>
          <Switch id="enabled" checked={state?.enabled ?? false} onCheckedChange={onToggle} />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="maxWidth">Max width</Label>
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Input
                id="maxWidth"
                type="number"
                className="h-7 w-20 text-right"
                min={MIN_WIDTH}
                max={2000}
                step={10}
                value={width}
                onChange={(e) => onWidth(Number(e.target.value))}
              />
              px
            </div>
          </div>
          <Slider
            value={[width]}
            min={MIN_WIDTH}
            max={MAX_WIDTH}
            step={10}
            onValueChange={([v]) => onWidth(v)}
          />
        </div>

        <div className="flex gap-2">
          <Button className="flex-1" onClick={onPick}>
            <MousePointerSquareDashed />
            Pick element
          </Button>
          <Button variant="outline" onClick={onReset}>
            <RotateCcw />
            Reset
          </Button>
        </div>

        <StatusLine last={state?.last ?? null} />
      </CardContent>
    </Card>
  );
}
