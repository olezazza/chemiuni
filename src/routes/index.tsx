import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ChemiUni Counselor Service" },
      { name: "description", content: "Secure university counseling for the ChemiUni phone app." },
      { property: "og:title", content: "ChemiUni Counselor Service" },
      { property: "og:description", content: "University counseling for the ChemiUni phone app." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background text-foreground">
      <h1 className="text-2xl font-semibold">ChemiUni</h1>
      <p className="text-muted-foreground">
        University counselor service. Continue in the ChemiUni phone app.
      </p>
    </div>
  );
}
