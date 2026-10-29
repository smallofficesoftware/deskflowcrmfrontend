import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import SavedFilterMenu from "./SavedFilterMenu";

const filters = [
  { id: "f1", name: "Today" },
  { id: "f2", name: "This month" },
];

// A list that behaves like the entries list: picking a filter changes what is applied.
const Host: React.FC<{ onPick: (id: string) => void }> = ({ onPick }) => {
  const [active, setActive] = useState("");
  return (
    <SavedFilterMenu
      filters={filters}
      activeId={active}
      onPick={(id) => {
        onPick(id);
        setActive(id);
      }}
    />
  );
};

const menu = () => document.querySelector("ul.labelDropLeft") as HTMLElement;
const filterButton = () => document.querySelector("button.report_button") as HTMLElement;
const icon = () => document.querySelector("button.report_button .p-button-icon") as HTMLElement;

// A real mouse click, element by element: press, release, click (RTL's fireEvent runs each inside act()).
const mouseClick = (el: HTMLElement) => {
  fireEvent.mouseDown(el);
  fireEvent.mouseUp(el);
  fireEvent.click(el);
};

describe("SavedFilterMenu", () => {
  test("opens on one click and picks on one click", () => {
    const onPick = jest.fn();
    render(<Host onPick={onPick} />);
    expect(menu().className).toContain("isHidden");
    mouseClick(filterButton());
    expect(menu().className).toContain("isVisible");
    mouseClick(screen.getByText("Today"));
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith("f1");
    expect(menu().className).toContain("isHidden");
  });

  test("a click on the ICON inside the button opens the list, before and after a filter is applied", () => {
    render(<Host onPick={jest.fn()} />);
    expect(icon().className).toContain("pi-filter");
    mouseClick(icon());
    expect(menu().className).toContain("isVisible");
    mouseClick(screen.getByText("Today"));
    // the icon is now the slashed one; one click on it must open the list again
    expect(icon().className).toContain("pi-filter-slash");
    mouseClick(icon());
    expect(menu().className).toContain("isVisible");
  });

  test("after a pick, one click opens it again and one click picks another", () => {
    const onPick = jest.fn();
    render(<Host onPick={onPick} />);
    mouseClick(filterButton());
    mouseClick(screen.getByText("Today"));
    mouseClick(filterButton());
    expect(menu().className).toContain("isVisible");
    mouseClick(screen.getByText("This month"));
    expect(onPick).toHaveBeenLastCalledWith("f2");
    expect(onPick).toHaveBeenCalledTimes(2);
  });

  test("clicking the filter that is already applied does nothing but close the list", () => {
    const onPick = jest.fn();
    render(<Host onPick={onPick} />);
    mouseClick(filterButton());
    mouseClick(screen.getByText("Today"));
    mouseClick(filterButton());
    mouseClick(screen.getAllByText("Today")[0]);
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(menu().className).toContain("isHidden");
  });

  test("All entries clears the filter", () => {
    const onPick = jest.fn();
    render(<Host onPick={onPick} />);
    mouseClick(filterButton());
    mouseClick(screen.getByText("Today"));
    mouseClick(filterButton());
    mouseClick(screen.getByText("All entries"));
    expect(onPick).toHaveBeenLastCalledWith("");
  });

  test("a click outside closes the open list", () => {
    render(<Host onPick={jest.fn()} />);
    mouseClick(filterButton());
    expect(menu().className).toContain("isVisible");
    fireEvent.mouseDown(document.body);
    expect(menu().className).toContain("isHidden");
  });
});
