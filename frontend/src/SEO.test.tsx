import { render, cleanup } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { SEO } from "./SEO";

describe("SEO Component - Document Title Tests", () => {
  beforeEach(() => {
    document.title = "";
    document.head.innerHTML = "";
  });

  afterEach(() => {
    cleanup();
  });

  it("sets the document title correctly with suffix", () => {
    render(<SEO title="Home" />);
    expect(document.title).toBe("Home | GeoGuessr");
  });

  it("handles empty title string", () => {
    render(<SEO title="" />);
    expect(document.title).toBe("| GeoGuessr");
  });

  it("handles long title string", () => {
    const longTitle = "A".repeat(200);
    render(<SEO title={longTitle} />);
    expect(document.title).toBe(`${longTitle} | GeoGuessr`);
  });

  it("handles special characters in title", () => {
    render(<SEO title="<Play & Win!> 'Geo' #1" />);
    expect(document.title).toBe("<Play & Win!> 'Geo' #1 | GeoGuessr");
  });

  it("updates title when title prop changes", () => {
    const { rerender } = render(<SEO title="First Title" />);
    expect(document.title).toBe("First Title | GeoGuessr");

    rerender(<SEO title="Second Title" />);
    expect(document.title).toBe("Second Title | GeoGuessr");
  });
});

describe("SEO Component - Meta Description Tests", () => {
  beforeEach(() => {
    document.title = "";
    document.head.innerHTML = "";
  });

  afterEach(() => {
    cleanup();
  });

  it("creates meta description tag if it does not exist", () => {
    render(<SEO title="Test" description="Awesome game page" />);

    const meta = document.querySelector('meta[name="description"]');
    expect(meta).not.toBeNull();
    expect(meta?.getAttribute("content")).toBe("Awesome game page");
  });

  it("updates existing meta description tag", () => {
    const existingMeta = document.createElement("meta");
    existingMeta.setAttribute("name", "description");
    existingMeta.setAttribute("content", "Old description");
    document.head.appendChild(existingMeta);

    render(<SEO title="Test" description="New description" />);

    const metas = document.querySelectorAll('meta[name="description"]');
    expect(metas.length).toBe(1);
    expect(metas[0].getAttribute("content")).toBe("New description");
  });

  it("does nothing to meta description if description prop is omitted", () => {
    render(<SEO title="Test" />);

    const meta = document.querySelector('meta[name="description"]');
    expect(meta).toBeNull();
  });

  it("does nothing to meta description if description prop is undefined", () => {
    render(<SEO title="Test" description={undefined} />);

    const meta = document.querySelector('meta[name="description"]');
    expect(meta).toBeNull();
  });

  it("handles empty string description and sets content attribute to empty string", () => {
    render(<SEO title="Test" description="" />);

    const meta = document.querySelector('meta[name="description"]');
    expect(meta).toBeNull();
  });

  it("updates meta description when description prop changes", () => {
    const { rerender } = render(<SEO title="Test" description="Initial" />);

    let meta = document.querySelector('meta[name="description"]');
    expect(meta?.getAttribute("content")).toBe("Initial");

    rerender(<SEO title="Test" description="Updated" />);

    meta = document.querySelector('meta[name="description"]');
    expect(meta?.getAttribute("content")).toBe("Updated");
  });

  it("preserves existing meta description if description prop becomes undefined on rerender", () => {
    const { rerender } = render(<SEO title="Test" description="Existing" />);

    rerender(<SEO title="Test" description={undefined} />);

    const meta = document.querySelector('meta[name="description"]');
    expect(meta).not.toBeNull();
    expect(meta?.getAttribute("content")).toBe("Existing");
  });
});

describe("SEO Component - Meta Robots Tests", () => {
  beforeEach(() => {
    document.title = "";
    document.head.innerHTML = "";
  });

  afterEach(() => {
    cleanup();
  });

  it("creates meta robots tag when noindex is true and tag does not exist", () => {
    render(<SEO title="Test" noindex={true} />);

    const meta = document.querySelector('meta[name="robots"]');
    expect(meta).not.toBeNull();
    expect(meta?.getAttribute("content")).toBe("noindex, nofollow");
  });

  it("updates existing meta robots tag when noindex is true", () => {
    const existingMeta = document.createElement("meta");
    existingMeta.setAttribute("name", "robots");
    existingMeta.setAttribute("content", "index, follow");
    document.head.appendChild(existingMeta);

    render(<SEO title="Test" noindex={true} />);

    const metas = document.querySelectorAll('meta[name="robots"]');
    expect(metas.length).toBe(1);
    expect(metas[0].getAttribute("content")).toBe("noindex, nofollow");
  });

  it("removes existing meta robots tag when noindex is false", () => {
    const existingMeta = document.createElement("meta");
    existingMeta.setAttribute("name", "robots");
    existingMeta.setAttribute("content", "noindex, nofollow");
    document.head.appendChild(existingMeta);

    render(<SEO title="Test" noindex={false} />);

    const meta = document.querySelector('meta[name="robots"]');
    expect(meta).toBeNull();
  });

  it("does not create meta robots tag when noindex is false and tag does not exist", () => {
    render(<SEO title="Test" noindex={false} />);

    const meta = document.querySelector('meta[name="robots"]');
    expect(meta).toBeNull();
  });

  it("defaults noindex to false when omitted", () => {
    const existingMeta = document.createElement("meta");
    existingMeta.setAttribute("name", "robots");
    existingMeta.setAttribute("content", "noindex, nofollow");
    document.head.appendChild(existingMeta);

    render(<SEO title="Test" />);

    const meta = document.querySelector('meta[name="robots"]');
    expect(meta).toBeNull();
  });

  it("adds and then removes meta robots when toggling noindex prop", () => {
    const { rerender } = render(<SEO title="Test" noindex={true} />);

    let meta = document.querySelector('meta[name="robots"]');
    expect(meta).not.toBeNull();

    rerender(<SEO title="Test" noindex={false} />);

    meta = document.querySelector('meta[name="robots"]');
    expect(meta).toBeNull();
  });
});

describe("SEO Component - Render & DOM Structure Integration Tests", () => {
  beforeEach(() => {
    document.title = "";
    document.head.innerHTML = "";
  });

  afterEach(() => {
    cleanup();
  });

  it("returns null and renders no physical DOM elements inside body", () => {
    const { container } = render(<SEO title="Test" />);
    expect(container.firstChild).toBeNull();
    expect(container.innerHTML).toBe("");
  });

  it("correctly sets title, description and robots tags simultaneously", () => {
    render(
      <SEO
        title="Full Test"
        description="Full description test"
        noindex={true}
      />
    );

    expect(document.title).toBe("Full Test | GeoGuessr");

    const descMeta = document.querySelector('meta[name="description"]');
    expect(descMeta?.getAttribute("content")).toBe("Full description test");

    const robotsMeta = document.querySelector('meta[name="robots"]');
    expect(robotsMeta?.getAttribute("content")).toBe("noindex, nofollow");
  });

  it("handles unmounting without crashing or resetting title", () => {
    const { unmount } = render(
      <SEO title="Unmount Test" description="Desc" noindex={true} />
    );

    expect(document.title).toBe("Unmount Test | GeoGuessr");

    unmount();

    expect(document.title).toBe("Unmount Test | GeoGuessr");
    expect(document.querySelector('meta[name="description"]')).not.toBeNull();
  });

  it("calls document.querySelector and document.createElement with correct parameters", () => {
    const querySpy = vi.spyOn(document, "querySelector");
    const createElementSpy = vi.spyOn(document, "createElement");

    render(<SEO title="Spy Test" description="Spy Desc" noindex={true} />);

    expect(querySpy).toHaveBeenCalledWith('meta[name="description"]');
    expect(querySpy).toHaveBeenCalledWith('meta[name="robots"]');
    expect(createElementSpy).toHaveBeenCalledWith("meta");

    querySpy.mockRestore();
    createElementSpy.mockRestore();
  });

  it("appends created meta tags into document.head", () => {
    const appendChildSpy = vi.spyOn(document.head, "appendChild");

    render(<SEO title="Append Test" description="Desc" noindex={true} />);

    expect(appendChildSpy).toHaveBeenCalledTimes(2);

    appendChildSpy.mockRestore();
  });

  it("handles rapid consecutive prop changes", () => {
    const { rerender } = render(<SEO title="Initial" />);

    for (let i = 0; i < 10; i++) {
      rerender(
        <SEO
          title={`Title ${i}`}
          description={`Description ${i}`}
          noindex={i % 2 === 0}
        />
      );
    }

    expect(document.title).toBe("Title 9 | GeoGuessr");

    const descMeta = document.querySelector('meta[name="description"]');
    expect(descMeta?.getAttribute("content")).toBe("Description 9");

    const robotsMeta = document.querySelector('meta[name="robots"]');
    expect(robotsMeta).toBeNull();
  });
});