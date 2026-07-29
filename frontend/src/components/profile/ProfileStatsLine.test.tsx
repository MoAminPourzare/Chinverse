import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProfileStatsLine from "./ProfileStatsLine";

describe("ProfileStatsLine", () => {
  it("keeps the location before followers in RTL reading order", () => {
    const { container } = render(
      <ProfileStatsLine
        followersCount={12}
        location="اردبیل، ایران"
        followersHref="/profile/network"
      />,
    );

    const stats = container.firstElementChild;
    expect(stats).toHaveAttribute("dir", "rtl");
    expect(stats?.textContent).toBe("اردبیل، ایران|12");
    expect(screen.getByRole("link")).toHaveAttribute("href", "/profile/network");
  });

  it("does not render a separator when location is missing", () => {
    const { container } = render(<ProfileStatsLine followersCount={0} />);

    expect(container).not.toHaveTextContent("|");
    expect(container).toHaveTextContent("0");
  });
});
