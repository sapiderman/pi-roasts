import { describe, it, expect, vi } from "vitest";
import { createWidget, type WidgetPort } from "../widget.js";

function createFakePort(): WidgetPort & { lastWidget: unknown } {
  const port = {
    lastWidget: undefined as unknown,
    setWidget(_key: string, widget: unknown) {
      this.lastWidget = widget;
    },
  };
  return port;
}

describe("Widget", () => {
  it("render calls setWidget with a widget whose render() returns themed text", () => {
    const port = createFakePort();
    const widget = createWidget(port);

    widget.render("you're bad at this", "accent");

    // The widget is a factory function that receives (tui, theme)
    const factory = port.lastWidget as (tui: unknown, theme: { fg: (c: string, t: string) => string }) => { render: () => string[] };
    const fakeTheme = { fg: (c: string, t: string) => `[${c}]${t}` };
    const rendered = factory(null, fakeTheme);

    expect(rendered.render()).toEqual(["[accent]🔥 you're bad at this"]);
  });

  it("clear calls setWidget with undefined", () => {
    const port = createFakePort();
    const widget = createWidget(port);

    widget.render("test", "accent");
    expect(port.lastWidget).toBeDefined();

    widget.clear();
    expect(port.lastWidget).toBeUndefined();
  });
});
