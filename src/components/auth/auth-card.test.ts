import { describe, expect, it } from "vitest";
import React from "react";
import { AuthCard } from "./auth-card";

describe("AuthCard component", () => {
  it("renders executive split layout with brand logo, title, description, children, and footer", () => {
    const rendered = AuthCard({
      title: "Welcome Back",
      description: "Sign in to your enterprise account",
      children: React.createElement("div", { id: "test-form" }, "Form Content"),
      footer: React.createElement("div", { id: "test-footer" }, "Footer Links"),
    });

    const rootChildren = React.Children.toArray(rendered.props.children) as React.ReactElement<{
      children?: React.ReactNode;
      className?: string;
    }>[];

    // 1. Left desktop brand column
    const leftColumn = rootChildren[0];
    const leftChildren = React.Children.toArray(leftColumn.props.children) as React.ReactElement<{
      children?: React.ReactNode;
    }>[];
    const brandHeader = leftChildren[1];
    const brandHeaderItems = React.Children.toArray(brandHeader.props.children) as React.ReactElement<{
      href?: string;
      children?: React.ReactNode;
    }>[];
    const brandLink = brandHeaderItems[0];
    expect(brandLink.props.href).toBe("/");

    const logoImage = React.Children.toArray(brandLink.props.children)[0] as React.ReactElement<{
      src?: string;
      alt?: string;
    }>;
    expect(logoImage.props.src).toBe("/symphowork-logo-white.png");
    expect(logoImage.props.alt).toBe("SymphoWork");

    // 2. Right form column
    const rightColumn = rootChildren[1];
    const rightChildren = React.Children.toArray(rightColumn.props.children) as React.ReactElement<{
      children?: React.ReactNode;
    }>[];
    const formCardWrapper = rightChildren[1];
    const card = React.Children.toArray(formCardWrapper.props.children)[0] as React.ReactElement<{
      children?: React.ReactNode;
    }>;
    const cardChildren = React.Children.toArray(card.props.children) as React.ReactElement<{
      children?: React.ReactNode;
    }>[];

    const header = cardChildren[0];
    const headerItems = React.Children.toArray(header.props.children) as React.ReactElement<{
      children?: React.ReactNode;
    }>[];
    expect(headerItems[1].props.children).toBe("Welcome Back");
    expect(headerItems[2].props.children).toBe("Sign in to your enterprise account");
  });
});
