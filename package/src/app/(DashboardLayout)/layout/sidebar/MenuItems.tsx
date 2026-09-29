import {
  IconAperture,
  IconCopy,
  IconLayoutDashboard,
  IconTypography,
  IconPhoto,
  IconCalendarEvent,
} from "@tabler/icons-react";

import { uniqueId } from "lodash";

const Menuitems = [
  {
    navlabel: true,
    subheader: "BUILD OS",
  },
  {
    id: uniqueId(),
    title: "Content Queue",
    icon: IconLayoutDashboard,
    href: "/",
  },
  {
    id: uniqueId(),
    title: "30-Day Auto-Queue",
    icon: IconCalendarEvent,
    href: "/schedule",
  },
  {
    id: uniqueId(),
    title: "Media Library",
    icon: IconPhoto,
    href: "/media",
  },
  {
    id: uniqueId(),
    title: "Campaigns",
    icon: IconAperture,
    href: "/campaigns",
  },
  {
    id: uniqueId(),
    title: "Visual Studio",
    icon: IconPhoto,
    href: "/studio",
  },
  {
    id: uniqueId(),
    title: "Accounts",
    icon: IconAperture,
    href: "/accounts",
  },
  {
    id: uniqueId(),
    title: "Publish Logs",
    icon: IconTypography,
    href: "/logs",
  },
  {
    id: uniqueId(),
    title: "Settings",
    icon: IconCopy,
    href: "/settings",
  },
];

export default Menuitems;
