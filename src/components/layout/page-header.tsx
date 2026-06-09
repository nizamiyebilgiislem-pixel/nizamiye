type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        {eyebrow ? (
          <p className="inline-flex items-center rounded-md bg-[#eaf1f6] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#093657]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-xl font-semibold tracking-tight text-[#093657] sm:text-2xl lg:text-3xl">{title}</h1>
        {description ? <p className="text-sm leading-relaxed text-[#64748b]">{description}</p> : null}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
