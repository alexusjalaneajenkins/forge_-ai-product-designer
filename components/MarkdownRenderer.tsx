import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-slate max-w-none">
      <ReactMarkdown
        components={{
          h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-forge-text mb-6 border-b border-forge-700 pb-4" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-2xl font-semibold text-forge-text mt-10 mb-4" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-xl font-medium text-forge-accent mt-8 mb-3" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc pl-6 space-y-2 mb-6 text-forge-muted" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal pl-6 space-y-2 mb-6 text-forge-muted" {...props} />,
          li: ({node, ...props}) => <li className="pl-2 leading-relaxed" {...props} />,
          p: ({node, ...props}) => <p className="mb-6 leading-7 text-forge-muted" {...props} />,
          strong: ({node, ...props}) => <strong className="font-bold text-forge-text" {...props} />,
          code: ({node, ...props}) => (
            <code className="bg-forge-800 border border-forge-700 px-1.5 py-0.5 rounded text-forge-accent font-mono text-sm" {...props} />
          ),
          pre: ({node, ...props}) => (
            <pre className="bg-forge-900 p-4 rounded-lg overflow-x-auto border border-forge-700 my-6 shadow-sm text-forge-muted" {...props} />
          ),
          blockquote: ({node, ...props}) => (
            <blockquote className="border-l-4 border-forge-accent pl-4 italic text-forge-muted my-6 bg-forge-800/50 py-3 rounded-r" {...props} />
          ),
          a: ({node, ...props}) => <a className="text-forge-accent hover:underline underline-offset-4 transition-all" {...props} />,
          hr: ({node, ...props}) => <hr className="border-forge-700 my-8" {...props} />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};