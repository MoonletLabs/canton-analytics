export function Footer() {
  return (
    <footer className="mt-auto shrink-0 border-t border-border bg-background/80 px-4 py-3">
      <div className="container mx-auto flex flex-col items-center justify-between gap-2 sm:flex-row sm:gap-4">
        <p className="text-sm text-muted-foreground">
          Powered by{" "}
          <a
            href="https://moonlet.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground hover:text-primary hover:underline"
          >
            Moonlet
          </a>
        </p>
        <a
          href="https://www.canton.network/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground hover:text-primary hover:underline"
        >
          Canton Network
        </a>
      </div>
    </footer>
  );
}
