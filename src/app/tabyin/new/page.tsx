import type { Metadata } from "next";
import { TabyinSubmissionForm } from "./TabyinSubmissionForm";

export const metadata: Metadata = {
  title: "ارسال روایت | جهاد تبیین",
  description: "ارسال روایت مردمی برای بررسی و انتشار در جهاد تبیین بعثت مردم.",
  robots: { index: false, follow: false },
};

export default function NewTabyinPage() {
  return <TabyinSubmissionForm />;
}
