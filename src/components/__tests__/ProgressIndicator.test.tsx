import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProgressIndicator from "../ProgressIndicator";
import { formatProgressPercent } from "../../lib/readingProgress";

function renderIndicator(fraction: number) {
  return render(
    <MantineProvider>
      <ProgressIndicator fraction={fraction} />
    </MantineProvider>,
  );
}

describe("ProgressIndicator", () => {
  // In-range samples plus out-of-range values that must clamp (Req 6.3).
  it.each([0, 0.5, 1, 0.37, -0.5, 2])(
    "renders the formatted percent for fraction %f",
    (fraction) => {
      renderIndicator(fraction);
      expect(screen.getByText(formatProgressPercent(fraction))).toBeInTheDocument();
    },
  );
});
