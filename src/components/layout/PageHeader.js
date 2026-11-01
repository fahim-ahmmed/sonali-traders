// নেভি → কমলা-সোনালি গ্রেডিয়েন্ট ব্যান্ড + breadcrumb (ভিডিওর হেডার)
export default function PageHeader({ group, title, children }) {
  return (
    <header className="no-print bg-gradient-to-r from-navy-900 via-navy-800 to-gold-500 py-4 pl-16 pr-5 text-white sm:pr-8 md:pl-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] text-white/70">{group}</p>
          <h1 className="text-sm font-semibold sm:text-base">{title}</h1>
        </div>
        {children}
      </div>
    </header>
  );
}
