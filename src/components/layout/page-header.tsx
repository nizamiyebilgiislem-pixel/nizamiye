type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="space-y-3">
      {eyebrow ? (
        <p className="inline-flex items-center rounded-md bg-[#eaf1f6] px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-[#093657]">
          {eyebrow}
        </p>
      ) : null}
      <div className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight text-[#093657] sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
    </header>
  );
}
