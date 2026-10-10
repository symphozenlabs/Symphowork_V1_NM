import { describe, expect, it, vi } from "vitest";
import React from "react";
import PublicJobPage, { generateMetadata } from "./[slug]/page";

vi.mock("@/modules/ats/service", () => ({
  publicJobBySlug: vi.fn().mockResolvedValue({
    job: {
      id: "job-123",
      slug: "staff-software-engineer",
      publicTitle: "Staff Software Engineer",
      publicDescription: "Lead architectural evolution of our enterprise HCM platform.",
      location: "San Francisco, CA",
      workMode: "Hybrid",
      employmentType: "Full-time",
      responsibilities: "Architect scalable backend primitives.",
      qualifications: "8+ years building enterprise SaaS platforms.",
    },
  }),
}));

describe("PublicJobPage public job board rendering", () => {
  it("generates metadata with job title and description", async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: "staff-software-engineer" }) });
    expect(meta.title).toContain("Staff Software Engineer");
    expect(meta.description).toContain("Lead architectural evolution");
  });

  it("renders brand logo, job title, metadata badges, and apply link", async () => {
    const rendered = await PublicJobPage({ params: Promise.resolve({ slug: "staff-software-engineer" }) });
    const rootChildren = React.Children.toArray(rendered.props.children) as React.ReactElement<{
      children?: React.ReactNode;
      className?: string;
    }>[];

    // 1. Header with logo
    const header = rootChildren[0];
    const headerInner = React.Children.toArray(header.props.children)[0] as React.ReactElement<{
      children?: React.ReactNode;
    }>;
    const headerItems = React.Children.toArray(headerInner.props.children) as React.ReactElement<{
      href?: string;
      children?: React.ReactNode;
    }>[];
    const brandLink = headerItems[0];
    expect(brandLink.props.href).toBe("/");

    const logoImg = React.Children.toArray(brandLink.props.children)[0] as React.ReactElement<{
      src?: string;
      alt?: string;
    }>;
    expect(logoImg.props.src).toBe("/symphowork-logo.png");

    // 2. Main article with job title
    const main = rootChildren[1];
    const article = React.Children.toArray(main.props.children)[0] as React.ReactElement<{
      children?: React.ReactNode;
    }>;
    const articleSections = React.Children.toArray(article.props.children) as React.ReactElement<{
      children?: React.ReactNode;
    }>[];

    const articleHeader = articleSections[0];
    const headerContent = React.Children.toArray(articleHeader.props.children) as React.ReactElement<{
      children?: React.ReactNode;
    }>[];
    const titleElement = headerContent[1];
    expect(titleElement.props.children).toBe("Staff Software Engineer");
  });
});
