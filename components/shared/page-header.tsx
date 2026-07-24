export function PageHeader({ title, subtitle }: { title: string, subtitle: string }) {
  return (
    <div>
      <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-2">
        {title}
      </h1>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
        {subtitle}
      </p>
    </div>
  );
}