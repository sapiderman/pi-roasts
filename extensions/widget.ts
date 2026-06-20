// ─── Widget ─────────────────────────────────────────────────────────────────────

/**
 * Widget module — owns setWidget rendering and the current-insult state.
 * Hides the "🔥 " prefix, the setWidget closure shape, the WIDGET_KEY constant,
 * and the "no ctx → no-op" guard.
 */

export type ThemeFgColor =
  | "text" | "accent" | "muted" | "dim"
  | "success" | "error" | "warning"
  | "border" | "borderAccent" | "borderMuted";

export interface WidgetPort {
  setWidget(key: string, widget: unknown): void;
}

export interface Widget {
  render(insult: string, color: ThemeFgColor): void;
  clear(): void;
}

const WIDGET_KEY = "pi-roast";

/**
 * Creates a Widget that renders roasts via the pi UI.
 * The port is a narrow slice of ExtensionAPI.ui — only setWidget is needed.
 */
export function createWidget(port: WidgetPort): Widget {
  function render(insult: string, color: ThemeFgColor): void {
    const text = "🔥 " + insult;
    port.setWidget(WIDGET_KEY, (_tui: unknown, theme: { fg: (color: string, text: string) => unknown }) => ({
      render: () => [theme.fg(color, text)],
      invalidate: () => {},
    }));
  }

  function clear(): void {
    port.setWidget(WIDGET_KEY, undefined);
  }

  return { render, clear };
}
