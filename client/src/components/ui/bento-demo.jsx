import {
  BellIcon,
  FileTextIcon,
  GlobeIcon,
  BarChartIcon,
  CheckCircledIcon,
} from "@radix-ui/react-icons";

import { BentoCard, BentoGrid } from "./bento-grid";

const features = [
  {
    Icon: FileTextIcon,
    name: "Meeting History & Archive",
    description:
      "Every processed meeting is saved and searchable. Trace any GitHub issue back to the exact meeting it was discussed in.",
    href: "/dashboard/history",
    cta: "View History",
    background: <div className="absolute right-0 top-0 w-64 h-64 bg-[#B45309]/5 blur-[80px] rounded-full pointer-events-none transition-all group-hover:scale-110 duration-700" />,
    className: "lg:row-start-1 lg:row-end-4 lg:col-start-2 lg:col-end-3",
  },
  {
    Icon: BarChartIcon,
    name: "Analytics & Insights",
    description:
      "Track task approval rates, team workload, and meeting efficiency with live charts.",
    href: "/dashboard/analytics",
    cta: "View Analytics",
    background: <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#F7FAF8_0%,_transparent_50%)] pointer-events-none opacity-50" />,
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-3",
  },
  {
    Icon: CheckCircledIcon,
    name: "Human Validation",
    description:
      "Review, edit, approve or reject every AI-generated task before it reaches GitHub or Trello.",
    href: "/dashboard/validate",
    cta: "Review Tasks",
    background: <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-[#15803D]/10 blur-[60px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />,
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-3 lg:row-end-4",
  },
  {
    Icon: GlobeIcon,
    name: "Integration Hub",
    description:
      "Connect GitHub, Trello, Discord, and Notion from one settings page. No code required.",
    href: "/dashboard/integrations",
    cta: "Manage Integrations",
    background: <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#B45309]/5 to-transparent pointer-events-none" />,
    className: "lg:col-start-3 lg:col-end-4 lg:row-start-1 lg:row-end-2",
  },
  {
    Icon: BellIcon,
    name: "Notification Centre",
    description:
      "Get alerted when validation is needed, tasks are overdue, or integrations disconnect.",
    href: "/dashboard/notifications",
    cta: "View Notifications",
    background: <div className="absolute right-[-40px] top-[-40px] w-32 h-32 border-[12px] border-[#F7FAF8] rounded-full opacity-40 pointer-events-none group-hover:scale-150 transition-transform duration-700" />,
    className: "lg:col-start-3 lg:col-end-4 lg:row-start-2 lg:row-end-4",
  },
];

function BentoDemo() {
  return (
    <BentoGrid className="lg:grid-rows-3 pb-8">
      {features.map((feature) => (
        <BentoCard key={feature.name} {...feature} />
      ))}
    </BentoGrid>
  );
}

export { BentoDemo };
