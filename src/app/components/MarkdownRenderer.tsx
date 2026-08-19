import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={`prose dark:prose-invert max-w-none ${className ?? ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          a: ({ children, ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
            >
              {children}
            </a>
          ),
          pre: ({ children, ...props }) => (
            <pre
              {...props}
              className="rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner leading-relaxed p-4"
            >
              {children}
            </pre>
          ),
          code: ({ className: codeClassName, children, ...props }) => {
            const isInline = !codeClassName;
            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded-md bg-secondary text-foreground font-mono text-[0.85em]"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className={codeClassName} {...props}>
                {children}
              </code>
            );
          },
          h1: ({ children, ...props }) => (
            <h1 className="text-2xl font-black tracking-tight text-foreground mt-8 mb-4" {...props}>{children}</h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-xl font-bold tracking-tight text-foreground mt-6 mb-3" {...props}>{children}</h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-lg font-semibold text-foreground mt-5 mb-2" {...props}>{children}</h3>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote
              className="border-l-4 border-primary/40 pl-4 italic text-muted-foreground"
              {...props}
            >
              {children}
            </blockquote>
          ),
          ul: ({ children, ...props }) => (
            <ul className="list-disc list-inside space-y-1 text-foreground/90" {...props}>{children}</ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal list-inside space-y-1 text-foreground/90" {...props}>{children}</ol>
          ),
          li: ({ children, ...props }) => (
            <li className="text-sm leading-relaxed" {...props}>{children}</li>
          ),
          hr: (props) => (
            <hr className="my-8 border-border/60" {...props} />
          ),
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-4 rounded-lg border border-border/60">
              <table className="w-full text-sm" {...props}>{children}</table>
            </div>
          ),
          th: ({ children, ...props }) => (
            <th className="px-4 py-2 text-left font-semibold bg-secondary/50 border-b border-border/60" {...props}>{children}</th>
          ),
          td: ({ children, ...props }) => (
            <td className="px-4 py-2 border-b border-border/30" {...props}>{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
