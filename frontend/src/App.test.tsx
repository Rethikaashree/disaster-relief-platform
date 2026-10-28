import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import App from "./App";

describe("verification portal", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  test("renders the purpose selection with beneficiary, donor, and officer entry points", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: "Welcome! How would you like to participate?",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Get help" })).toHaveAttribute(
      "href",
      "/beneficiary/login",
    );
    expect(screen.getByRole("link", { name: "Donate" })).toHaveAttribute(
      "href",
      "/donor/login",
    );
    expect(
      screen.getByRole("link", { name: "Authorized Officer? Login Here" }),
    ).toHaveAttribute("href", "/officer/login");
  });

  test("beneficiary path has a separate registration form", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("link", { name: "Get help" }));
    fireEvent.click(screen.getByRole("link", { name: "Create an account" }));
    expect(
      screen.getByRole("heading", {
        name: "Create your beneficiary portal account",
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Address")).toBeInTheDocument();
    expect(screen.getByLabelText("PIN code")).toBeInTheDocument();
  });

  test("donor path has no officer registration option", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("link", { name: "Donate" }));
    fireEvent.click(screen.getByRole("link", { name: "Create an account" }));
    expect(
      screen.getByRole("heading", { name: "Create your donor portal account" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Optional")).toBeInTheDocument();
    expect(screen.queryByText("District")).not.toBeInTheDocument();
  });

  test("officer sign-in does not expose public registration", () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole("link", { name: "Authorized Officer? Login Here" }),
    );
    expect(screen.getByText("RESTRICTED ACCESS")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Create an account" }),
    ).not.toBeInTheDocument();
  });

  test("password visibility and sample email hints are available on all login portals", () => {
    const portals = [
      {
        entry: "Get help",
        hint: "beneficiary@example.com",
        sample: "beneficiary@example.com",
      },
      {
        entry: "Donate",
        hint: "donor@example.com",
        sample: "donor@example.com",
      },
      {
        entry: "Authorized Officer? Login Here",
        hint: "officer@organization.gov",
        sample: "officer@example.com",
      },
    ];

    for (const portal of portals) {
      window.history.replaceState({}, "", "/");
      const view = render(<App />);
      fireEvent.click(screen.getByRole("link", { name: portal.entry }));
      fireEvent.change(screen.getByLabelText("Email address"), {
        target: { value: portal.sample },
      });
      expect(screen.getByLabelText("Email address")).toHaveValue(portal.sample);
      const passwordInput = screen.getByLabelText("Password");
      fireEvent.change(passwordInput, { target: { value: "ExamplePass123!" } });
      expect(passwordInput).toHaveValue("ExamplePass123!");
      expect(passwordInput).toHaveAttribute("type", "password");
      fireEvent.click(screen.getByRole("button", { name: "Show password" }));
      expect(passwordInput).toHaveAttribute("type", "text");
      fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
      expect(passwordInput).toHaveAttribute("type", "password");
      view.unmount();
    }
  });
});
