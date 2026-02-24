

const MarkdownView = ({ text }: { text: string }) => {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="space-y-3">
      {lines.map((line, i) => {
        const key = `md-${i}-${line.slice(0, 10)}`;
        if (line.startsWith('###')) return <h4 key={key} className="text-lg font-black text-slate-800 mt-4">{line.replace(/^#+\s*/, '')}</h4>;
        if (line.startsWith('##')) return <h3 key={key} className="text-xl font-black text-slate-800 mt-5">{line.replace(/^#+\s*/, '')}</h3>;
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
          return (
            <div key={key} className="flex gap-2 items-start ml-2">
              <span className="text-blue-500 mt-1.5 text-sm">•</span>
              <span className="text-slate-600 text-sm leading-relaxed">{formatBold(line.replace(/^[*\-\d.]+\s*/, ''))}</span>
            </div>
          );
        }
        if (!line.trim()) return <div key={key} className="h-2" />;
        return <p key={key} className="text-slate-600 text-sm leading-relaxed">{formatBold(line)}</p>;
      })}
    </div>
  );
};

const formatBold = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    const key = `bold-${i}-${part.slice(0, 8)}`;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={key} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
    return part;
  });
};

export default MarkdownView;