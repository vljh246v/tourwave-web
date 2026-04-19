import { Suspense } from "react";
import { ExplorePage } from "./ExplorePage";

export default function Page() {
  return (
    <Suspense>
      <ExplorePage />
    </Suspense>
  );
}
